import { Response } from 'express';
import { z } from 'zod';
import {
  hashValue,
  hashPassword,
  comparePassword,
  normalizeEmail,
  requireAuth,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './auth';
import { AuthedRequest, JwtPayload } from './types';
import { prisma } from './prisma';
import {
  getRequestSeatCount,
  computeSupervisorLoad,
  recountSupervisor,
  getProjectParticipantIds,
  getProjectParticipants,
  userCanAccessProject,
  getCommittedStudentIds,
  findExistingAssignment,
  invalidateCompetingRequests,
  countActiveTopics,
  assertTopicCapacity,
  assignTopicToRequest,
} from './domain';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20 MB limit

const registerSchema = z.object({
  fullName: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(6),
  role: z.enum(['student', 'supervisor']),
  department: z.string().trim().min(1),
  groupName: z.string().trim().optional().default(''),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const updateUserSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  department: z.string().trim().min(1).optional(),
  groupName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  studyLevel: z.string().trim().optional(),
  interests: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  title: z.string().trim().optional(),
  areas: z.array(z.string().trim().min(1)).optional(),
  avatar: z.string().trim().optional(),
  openToTeam: z.boolean().optional(),
  preferredTeamSize: z.number().int().min(2).max(10).nullable().optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
});

const updateSupervisorSchema = z.object({
  name: z.string().trim().min(2),
  title: z.string().trim().optional(),
  department: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  areas: z.array(z.string().trim().min(1)).min(1),
  avatar: z.string().trim().optional(),
  capacity: z.number().int().min(1).max(50).optional(),
});

const addTopicSchema = z.object({
  title: z.string().trim().min(1),
  area: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

// редактирование темы — все поля опциональны
const editTopicSchema = z.object({
  title: z.string().trim().min(1).optional(),
  area: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  archived: z.boolean().optional(),
});

// назначение темы заявке: либо существующая тема (topicId),
// либо новая тема, которая создаётся и сразу назначается
const assignTopicSchema = z.object({
  requestId: z.string().trim().min(1),
  topicId: z.string().trim().optional(),
  newTopic: addTopicSchema.optional(),
});

const createRequestSchema = z.object({
  supervisorId: z.string().trim().min(1),
  researchInterests: z.string().trim().min(1, 'Research interests are required.'),
  message: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || ''),
  // приходит из FormData строками, поэтому коэрсим вручную
  applicationType: z
    .enum(['individual', 'team'])
    .optional()
    .transform((v) => v || 'individual'),
  teamId: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || null),
});

const createTeamSchema = z.object({
  name: z.string().trim().min(1, 'Team name is required.'),
  memberUserIds: z.array(z.string().trim().min(1)).optional().default([]),
});

const createInvitationSchema = z.object({
  toUserId: z.string().trim().min(1),
  teamId: z.string().trim().optional(),
});

const respondInvitationSchema = z.object({
  action: z.enum(['accept', 'decline']),
});

// multer для загрузки резюме — только PDF, максимум 5 МБ
const resumeStorage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const dir = path.join(process.cwd(), 'uploads', 'resumes');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});
const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('Only PDF files are allowed.'), false);
    } else {
      cb(null, true);
    }
  }
});

// динамический расчёт силы заявки — НЕ хранится в БД
function calculateApplicationScore(request: { researchInterests?: string; message?: string; resumePath?: string | null }) {
  let score = 0;
  if (request.researchInterests && request.researchInterests.trim().length > 0) score += 50;
  if (request.message && request.message.trim().length > 0) score += 20;
  if (request.resumePath) score += 30;
  return score;
}

function getApplicationLabel(score: number): string {
  if (score >= 90) return 'Strong Application';
  if (score >= 70) return 'Good Application';
  return 'Basic Application';
}

// добавляет applicationScore и applicationLabel к объекту заявки
function addApplicationScore<T extends { researchInterests?: string; message?: string; resumePath?: string | null }>(request: T): T & { applicationScore: number; applicationLabel: string } {
  const score = calculateApplicationScore(request);
  return { ...request, applicationScore: score, applicationLabel: getApplicationLabel(score) };
}

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'under review', 'accepted', 'rejected']),
});

// убираем пароль и хеш токена из ответа, чтобы не палить лишнее
function sanitizeUser(user: any) {
  const { password, refreshTokenHash, ...safeUser } = user;
  return safeUser;
}

// обёртка для async обработчиков, чтобы ошибки не улетали в никуда
function asyncRoute(handler: (req: AuthedRequest, res: Response) => Promise<void>) {
  return async (req: AuthedRequest, res: Response) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      const status = Number(error?.statusCode || error?.status || 400);
      const message = error?.message || 'Request failed';
      const details = error?.issues || error?.flatten?.() || undefined;
      res.status(status).json(details ? { message, details } : { message });
    }
  };
}

// кидаем ошибку с нужным статус-кодом
function createError(statusCode: number, message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

// достаём юзера из реквеста или шлём нахер с 401
function mustUser(req: AuthedRequest): JwtPayload {
  if (!req.user) {
    throw createError(401, 'Unauthorized');
  }
  return req.user;
}

export function registerRoutes(app: any): void {
  // загрузка файлов (аватарки и прочее), возвращаем base64
  app.post('/upload', requireAuth, upload.single('file'), (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const base64 = req.file.buffer.toString('base64');
    const url = `data:${req.file.mimetype};base64,${base64}`;
    res.json({ url });
  });

  // регистрация нового юзера
  app.post('/auth/register', asyncRoute(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid register payload');
    }

    const input = parsed.data;
    const email = normalizeEmail(input.email);

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw createError(409, 'An account with this email already exists.');
    }

    const hashedPassword = await hashPassword(input.password);

    const newUser = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email,
        role: input.role,
        password: hashedPassword,
        department: input.department,
        groupName: input.groupName || '',
        phone: '',
        studyLevel: '',
        interests: '',
        bio: '',
        supervisorProfile: input.role === 'supervisor' ? {
          create: {
            name: input.fullName,
            email,
            phone: '',
            title: 'Supervisor',
            department: input.department,
            areas: input.department ? [input.department] : ['General Research'],
            capacity: 8,
            currentStudents: 0,
            avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=160&q=80',
            bio: 'Update your profile with your specialization and supervision preferences.',
          }
        } : undefined
      }
    });

    res.json({ ok: true, user: sanitizeUser(newUser) });
  }));

  // логин - проверяем пароль, выдаём токены
  app.post('/auth/login', asyncRoute(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid login payload');
    }

    const email = normalizeEmail(parsed.data.email);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw createError(401, 'Invalid email or password.');
    }

    const passwordValid = await comparePassword(parsed.data.password, user.password);
    if (!passwordValid) {
      throw createError(401, 'Invalid email or password.');
    }

    // если пароль ещё на старом sha256 — тихо обновляем на bcrypt при логине
    if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
      const upgraded = await hashPassword(parsed.data.password);
      await prisma.user.update({ where: { id: user.id }, data: { password: upgraded } });
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role as any,
      email: user.email,
    };
    const refreshToken = signRefreshToken(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hashValue(refreshToken) }
    });

    const accessToken = signAccessToken(payload);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ ok: true, accessToken, user: sanitizeUser(user) });
  }));

  // обновление access токена через refresh cookie
  app.post('/auth/refresh', asyncRoute(async (req, res) => {
    const token = (req as any).cookies?.refreshToken as string | undefined;
    if (!token) {
      throw createError(401, 'Refresh token is missing.');
    }

    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw createError(401, 'Refresh token is invalid or expired.');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.refreshTokenHash !== hashValue(token)) {
      throw createError(401, 'Refresh token is invalid.');
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role as any, email: user.email });
    res.json({ ok: true, accessToken });
  }));

  // логаут — чистим refresh токен
  app.post('/auth/logout', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);

    await prisma.user.update({
      where: { id: userPayload.sub },
      data: { refreshTokenHash: null }
    }).catch(() => { }); // если юзер уже удалён — ну и ладно

    res.clearCookie('refreshToken');
    res.json({ ok: true });
  }));

  // получаем данные текущего юзера
  app.get('/users/me', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const user = await prisma.user.findUnique({ where: { id: userPayload.sub } });
    if (!user) {
      throw createError(404, 'User not found.');
    }
    res.json(sanitizeUser(user));
  }));

  // обновление профиля юзера
  app.patch('/users/me', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid profile update payload');
    }

    const updates = parsed.data as any;

    // собираем только заполненные поля (prisma не любит undefined)
    const userData: Record<string, any> = {};
    for (const key of ['fullName', 'department', 'groupName', 'phone', 'studyLevel', 'interests', 'bio', 'avatar', 'openToTeam', 'preferredTeamSize', 'skills']) {
      if (updates[key] !== undefined) {
        userData[key] = updates[key];
      }
    }

    // обновляем юзера в базе
    const updatedUser = await prisma.user.update({
      where: { id: userPayload.sub },
      data: userData
    });

    if (updatedUser.role === 'supervisor') {
      const supervisorData: Record<string, any> = {};
      if (updates.fullName !== undefined) supervisorData.name = updates.fullName;
      if (updates.department !== undefined) supervisorData.department = updates.department;
      if (updates.phone !== undefined) supervisorData.phone = updates.phone;
      if (updates.bio !== undefined) supervisorData.bio = updates.bio;
      if (updates.title !== undefined) supervisorData.title = updates.title;
      if (updates.areas && updates.areas.length > 0) supervisorData.areas = updates.areas;
      if (updates.avatar !== undefined) supervisorData.avatar = updates.avatar;

      if (Object.keys(supervisorData).length > 0) {
        await prisma.supervisor.update({
          where: { userId: updatedUser.id },
          data: supervisorData
        }).catch(() => { });
      }
    }

    res.json(sanitizeUser(updatedUser));
  }));

  // получаем список супервайзеров с фильтрацией
  app.get('/supervisors', asyncRoute(async (req, res) => {
    const keyword = String((req as any).query.keyword || '').trim().toLowerCase();
    const department = String((req as any).query.department || '').trim();
    const area = String((req as any).query.area || '').trim();
    const availableOnly = String((req as any).query.availableOnly || '').toLowerCase() === 'true';

    const supervisors = await prisma.supervisor.findMany({
      include: { topics: true }
    });

    // авторитетно пересчитываем загрузку из принятых заявок — лечим возможный дрейф счётчика
    await Promise.all(
      supervisors.map(async (sup) => {
        sup.currentStudents = await recountSupervisor(sup.id);
      }),
    );

    const result = supervisors.filter((sup) => {
      if (department && sup.department !== department) return false;
      if (area && !sup.areas.includes(area)) return false;
      if (availableOnly && sup.currentStudents >= sup.capacity) return false;
      if (keyword) {
        const haystack = `${sup.name} ${sup.title} ${sup.department} ${sup.bio} ${sup.areas.join(' ')}`.toLowerCase();
        return haystack.includes(keyword);
      }
      return true;
    });

    res.json(result);
  }));

  // получаем конкретного супервайзера по id
  app.get('/supervisors/:id', asyncRoute(async (req, res) => {
    const supervisor = await prisma.supervisor.findUnique({
      where: { id: (req as any).params.id },
      include: { topics: true }
    });
    if (!supervisor) {
      throw createError(404, 'Supervisor not found.');
    }
    // лечим возможный дрейф счётчика перед отдачей
    supervisor.currentStudents = await recountSupervisor(supervisor.id);
    res.json(supervisor);
  }));

  // обновление профиля супервайзера
  app.patch('/supervisors/:id/profile', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') {
      throw createError(403, 'Only supervisors can update this profile.');
    }

    const parsed = updateSupervisorSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid supervisor profile payload');
    }

    const supervisor = await prisma.supervisor.findUnique({ where: { id: (req as any).params.id } });
    if (!supervisor) throw createError(404, 'Supervisor not found.');
    if (supervisor.userId !== userPayload.sub) throw createError(403, 'You can only edit your own supervisor profile.');

    // если передали capacity — не даём поставить меньше текущего кол-ва студентов
    const newCapacity = parsed.data.capacity !== undefined
      ? Math.max(parsed.data.capacity, supervisor.currentStudents)
      : undefined;

    const updatedSupervisor = await prisma.supervisor.update({
      where: { id: supervisor.id },
      data: {
        name: parsed.data.name,
        title: parsed.data.title || 'Supervisor',
        department: parsed.data.department,
        phone: parsed.data.phone || '',
        bio: parsed.data.bio || '',
        areas: parsed.data.areas,
        avatar: parsed.data.avatar ?? supervisor.avatar,
        ...(newCapacity !== undefined ? { capacity: newCapacity } : {}),
      },
      include: { topics: true }
    });

    await prisma.user.update({
      where: { id: userPayload.sub },
      data: {
        fullName: parsed.data.name,
        department: parsed.data.department,
        phone: parsed.data.phone || '',
        bio: parsed.data.bio || '',
        avatar: parsed.data.avatar ?? '',
      }
    });

    res.json(updatedSupervisor);
  }));

  // добавляем новую тему супервайзеру
  app.post('/supervisors/:id/topics', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') {
      throw createError(403, 'Only supervisors can add topics.');
    }

    const parsed = addTopicSchema.safeParse(req.body);
    if (!parsed.success) throw createError(400, 'Invalid topic payload');

    const supervisor = await prisma.supervisor.findUnique({ where: { id: (req as any).params.id } });
    if (!supervisor) throw createError(404, 'Supervisor not found.');
    if (supervisor.userId !== userPayload.sub) throw createError(403, 'You can only add topics to your own profile.');

    // #1 — число активных тем ограничено вместимостью супервайзера
    await assertTopicCapacity(supervisor);

    const nextTopic = await prisma.topic.create({
      data: {
        supervisorId: supervisor.id,
        title: parsed.data.title,
        area: parsed.data.area,
        description: parsed.data.description,
      }
    });

    if (!supervisor.areas.includes(nextTopic.area)) {
      await prisma.supervisor.update({
        where: { id: supervisor.id },
        data: { areas: { push: nextTopic.area } }
      });
    }

    res.json(nextTopic);
  }));

  // удаляем тему у супервайзера
  app.delete('/supervisors/:id/topics/:topicId', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') throw createError(403, 'Only supervisors can remove topics.');

    const supervisor = await prisma.supervisor.findUnique({ where: { id: (req as any).params.id } });
    if (!supervisor) throw createError(404, 'Supervisor not found.');
    if (supervisor.userId !== userPayload.sub) throw createError(403, 'You can only remove topics from your own profile.');

    const topic = await prisma.topic.findUnique({ where: { id: (req as any).params.topicId } });
    if (!topic || topic.supervisorId !== supervisor.id) throw createError(404, 'Topic not found.');

    // #7 — нельзя удалить тему, назначенную активному проекту (целостность данных)
    if (topic.status === 'Assigned') {
      throw createError(400, 'This topic is assigned to an active project. Archive it instead, or disband the project first.');
    }

    await prisma.topic.delete({ where: { id: topic.id } });

    res.json({ ok: true });
  }));

  // ==================== TOPICS (центральная сущность) ====================

  // создать тему для текущего супервайзера (capacity-ограниченная)
  app.post('/topics', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') throw createError(403, 'Only supervisors can create topics.');

    const parsed = addTopicSchema.safeParse(req.body);
    if (!parsed.success) throw createError(400, 'Invalid topic payload');

    const supervisor = await prisma.supervisor.findUnique({ where: { userId: userPayload.sub } });
    if (!supervisor) throw createError(404, 'Supervisor profile not found.');

    // #1 — лимит активных тем = вместимость
    await assertTopicCapacity(supervisor);

    const topic = await prisma.topic.create({
      data: {
        supervisorId: supervisor.id,
        title: parsed.data.title,
        area: parsed.data.area,
        description: parsed.data.description,
      },
    });

    if (!supervisor.areas.includes(topic.area)) {
      await prisma.supervisor.update({
        where: { id: supervisor.id },
        data: { areas: { push: topic.area } },
      });
    }

    res.json(topic);
  }));

  // темы текущего супервайзера (с признаком, занята ли тема активным проектом)
  app.get('/topics/mine', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') throw createError(403, 'Only supervisors can view their topics.');

    const supervisor = await prisma.supervisor.findUnique({ where: { userId: userPayload.sub } });
    if (!supervisor) { res.json({ topics: [], activeCount: 0, capacity: 0 }); return; }

    const topics = await prisma.topic.findMany({
      where: { supervisorId: supervisor.id },
      orderBy: { createdAt: 'desc' },
    });
    const activeCount = await countActiveTopics(supervisor.id);

    res.json({ topics, activeCount, capacity: supervisor.capacity });
  }));

  // редактировать тему (название/область/описание/архивация)
  app.patch('/topics/:id', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') throw createError(403, 'Only supervisors can edit topics.');

    const parsed = editTopicSchema.safeParse(req.body);
    if (!parsed.success) throw createError(400, 'Invalid topic payload');

    const supervisor = await prisma.supervisor.findUnique({ where: { userId: userPayload.sub } });
    if (!supervisor) throw createError(404, 'Supervisor profile not found.');

    const topic = await prisma.topic.findUnique({ where: { id: (req as any).params.id } });
    if (!topic || topic.supervisorId !== supervisor.id) throw createError(404, 'Topic not found.');

    // нельзя разархивировать тему, если уже исчерпан лимит активных тем
    if (parsed.data.archived === false && topic.archived === true && topic.status !== 'Completed') {
      await assertTopicCapacity(supervisor);
    }

    const data: Record<string, any> = {};
    if (parsed.data.title !== undefined) data.title = parsed.data.title;
    if (parsed.data.area !== undefined) data.area = parsed.data.area;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;
    if (parsed.data.archived !== undefined) data.archived = parsed.data.archived;

    const updated = await prisma.topic.update({ where: { id: topic.id }, data });
    res.json(updated);
  }));

  // назначить тему заявке (после принятия). поддерживает существующую тему или создание новой.
  app.post('/topics/assign', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') throw createError(403, 'Only supervisors can assign topics.');

    const parsed = assignTopicSchema.safeParse(req.body);
    if (!parsed.success) throw createError(400, 'Invalid assignment payload');
    if (!parsed.data.topicId && !parsed.data.newTopic) {
      throw createError(400, 'Provide an existing topicId or a newTopic to assign.');
    }

    const supervisor = await prisma.supervisor.findUnique({ where: { userId: userPayload.sub } });
    if (!supervisor) throw createError(404, 'Supervisor profile not found.');

    const request = await prisma.request.findUnique({ where: { id: parsed.data.requestId } });
    if (!request) throw createError(404, 'Request not found.');
    if (request.supervisorId !== supervisor.id) throw createError(403, 'You can only assign topics to your own requests.');
    if (request.status !== 'accepted') throw createError(400, 'You can only assign a topic to an accepted request.');

    // если темы нет — создаём её (с проверкой лимита) и сразу назначаем
    let topicId = parsed.data.topicId || null;
    if (!topicId) {
      await assertTopicCapacity(supervisor);
      const created = await prisma.topic.create({
        data: {
          supervisorId: supervisor.id,
          title: parsed.data.newTopic!.title,
          area: parsed.data.newTopic!.area,
          description: parsed.data.newTopic!.description,
        },
      });
      if (!supervisor.areas.includes(created.area)) {
        await prisma.supervisor.update({
          where: { id: supervisor.id },
          data: { areas: { push: created.area } },
        });
      }
      topicId = created.id;
    }

    const project = await assignTopicToRequest({
      supervisorId: supervisor.id,
      requestId: request.id,
      topicId,
    });

    res.json(project);
  }));

  // студент отправляет заявку супервайзеру (с поддержкой FormData + PDF резюме)
  app.post('/requests', requireAuth, (req: any, res: any, next: any) => {
    resumeUpload.single('resume')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Resume file is too large. Maximum size is 5 MB.' });
        }
        if (err.message === 'Only PDF files are allowed.') {
          return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({ message: err.message || 'File upload error.' });
      }
      next();
    });
  }, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'student') throw createError(403, 'Only student accounts can send requests.');

    const parsed = createRequestSchema.safeParse(req.body);
    if (!parsed.success) throw createError(400, parsed.error.issues?.[0]?.message || 'Invalid request payload');

    const student = await prisma.user.findUnique({ where: { id: userPayload.sub } });
    if (!student) throw createError(404, 'Student user not found.');

    const supervisor = await prisma.supervisor.findUnique({ where: { id: parsed.data.supervisorId } });
    if (!supervisor) throw createError(404, 'Supervisor not found.');

    const duplicate = await prisma.request.findFirst({
      where: {
        studentUserId: student.id,
        supervisorId: supervisor.id,
        status: { not: 'rejected' }
      }
    });

    if (duplicate) throw createError(400, 'You already have an active request for this supervisor.');

    // для командной заявки проверяем что team существует и заявитель — её лидер
    let teamId: string | null = null;
    if (parsed.data.applicationType === 'team') {
      if (!parsed.data.teamId) throw createError(400, 'A team is required for a team application.');
      const team = await prisma.team.findUnique({ where: { id: parsed.data.teamId } });
      if (!team) throw createError(404, 'Team not found.');
      if (team.leaderUserId !== student.id) throw createError(403, 'Only the team leader can apply on behalf of the team.');
      teamId = team.id;
    }

    const resumeFile = (req as any).file;
    const resumePath = resumeFile ? resumeFile.path : null;

    const request = await prisma.request.create({
      data: {
        studentUserId: student.id,
        studentEmail: student.email,
        studentName: student.fullName,
        supervisorId: supervisor.id,
        researchInterests: parsed.data.researchInterests,
        message: parsed.data.message,
        resumePath,
        status: 'pending',
        applicationType: parsed.data.applicationType,
        teamId,
      }
    });

    res.json(addApplicationScore(request));
  }));

  // скачивание резюме из заявки
  app.get('/requests/:id/resume', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const request = await prisma.request.findUnique({ where: { id: (req as any).params.id } });
    if (!request) throw createError(404, 'Request not found.');
    if (!request.resumePath) throw createError(404, 'No resume attached to this request.');

    // доступ — только сам студент или его супервайзер
    if (userPayload.role === 'student' && request.studentUserId !== userPayload.sub) {
      throw createError(403, 'Access denied.');
    }
    if (userPayload.role === 'supervisor') {
      const sup = await prisma.supervisor.findUnique({ where: { userId: userPayload.sub } });
      if (!sup || request.supervisorId !== sup.id) throw createError(403, 'Access denied.');
    }

    if (!fs.existsSync(request.resumePath)) throw createError(404, 'Resume file not found on disk.');

    const fileName = path.basename(request.resumePath);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', 'application/pdf');
    const stream = fs.createReadStream(request.resumePath);
    stream.pipe(res as any);
  }));

  // заявки студента (для страницы 'Мои заявки')
  app.get('/requests/student', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'student') throw createError(403, 'Only student accounts can view this list.');

    const requests = await prisma.request.findMany({
      where: { studentUserId: userPayload.sub },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests.map(addApplicationScore));
  }));

  // заявки для супервайзера (дашборд)
  app.get('/requests/supervisor', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') throw createError(403, 'Only supervisor accounts can view this list.');

    const supervisor = await prisma.supervisor.findUnique({ where: { userId: userPayload.sub } });
    if (!supervisor) {
      res.json([]);
      return;
    }

    const requests = await prisma.request.findMany({
      where: { supervisorId: supervisor.id },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            avatar: true,
            department: true,
            groupName: true,
            phone: true,
            studyLevel: true,
            interests: true,
            bio: true,
          },
        },
        team: {
          include: {
            members: {
              include: {
                user: { select: { fullName: true, department: true, groupName: true } },
              },
            },
          },
        },
        // проект (если уже создан) — чтобы дашборд знал, назначена ли тема
        project: { select: { id: true, topicId: true, topicTitle: true } },
      },
    });

    // вытаскиваем все поля студента в корень объекта + считаем score
    const result = requests.map(r => addApplicationScore({
      ...r,
      studentAvatar: r.student?.avatar || null,
      studentDepartment: r.student?.department || null,
      studentGroup: r.student?.groupName || null,
      studentPhone: r.student?.phone || null,
      studentStudyLevel: r.student?.studyLevel || null,
      studentInterests: r.student?.interests || null,
      studentBio: r.student?.bio || null,
      student: undefined,
      // компактный объект команды для дашборда супервайзера
      team: r.team
        ? {
            id: r.team.id,
            name: r.team.name,
            members: r.team.members
              .filter(m => m.status !== 'declined')
              .map(m => ({
                name: m.user?.fullName || '',
                department: m.user?.department || '',
                group: m.user?.groupName || '',
                role: m.role,
                status: m.status,
              })),
          }
        : null,
    }));

    res.json(result);
  }));

  // супервайзер меняет статус заявки (принять/отклонить/на рассмотрении)
  app.patch('/requests/:id/status', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') throw createError(403, 'Only supervisor accounts can update request status.');

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) throw createError(400, 'Invalid status payload');

    // проверяем что заявка не была уже принята — отменять нужно через удаление проекта
    const existingRequest = await prisma.request.findUnique({ where: { id: (req as any).params.id } });
    if (existingRequest?.status === 'accepted') {
      throw createError(400, 'Cannot change status of an accepted request. To cancel, disband the project instead.');
    }

    const supervisor = await prisma.supervisor.findUnique({ where: { userId: userPayload.sub } });
    if (!supervisor) throw createError(404, 'Supervisor profile not found.');

    const request = await prisma.request.findUnique({ where: { id: (req as any).params.id } });
    if (!request) throw createError(404, 'Request not found.');

    if (request.supervisorId !== supervisor.id) throw createError(403, 'You can only update requests assigned to you.');

    // для командной заявки слот занимает каждый подтверждённый участник
    const seatCount = await getRequestSeatCount(request);

    // принимаем студента/команду — проверяем вместимость и эксклюзивность, создаём проект
    if (parsed.data.status === 'accepted' && request.status !== 'accepted') {
      // #6 — нельзя принять студента/команду, уже назначенных другому супервайзеру
      const conflict = await findExistingAssignment(request);
      if (conflict) throw createError(409, conflict);

      // вместимость считаем от АКТУАЛЬНОЙ загрузки (источник правды), а не от хранимого счётчика
      const currentLoad = await computeSupervisorLoad(supervisor.id);
      if (currentLoad + seatCount > supervisor.capacity) {
        throw createError(400, 'Supervisor has no remaining capacity for this application.');
      }

      // тему можно передать прямо при принятии (одношаговый assign).
      // если topicId указан — валидируем его до создания проекта, чтобы не плодить
      // проект при заведомо некорректной теме.
      const acceptTopicId = typeof (req.body as any)?.topicId === 'string' ? (req.body as any).topicId.trim() : '';
      if (acceptTopicId) {
        const topic = await prisma.topic.findUnique({ where: { id: acceptTopicId } });
        if (!topic || topic.supervisorId !== supervisor.id) throw createError(404, 'Topic not found.');
        if (topic.status === 'Assigned') throw createError(409, 'This topic is already assigned to an active project.');
      }

      // создаём проект если его ещё нет для этой заявки (один общий проект на команду)
      const existingProject = await prisma.project.findUnique({ where: { requestId: request.id } });
      if (!existingProject) {
        let title = `Project: ${request.studentName}`;
        if (request.applicationType === 'team' && request.teamId) {
          const team = await prisma.team.findUnique({ where: { id: request.teamId } });
          if (team) title = `Team: ${team.name}`;
        }
        await prisma.project.create({
          data: {
            title,
            description: '',
            requestId: request.id,
            studentUserId: request.studentUserId,
            supervisorId: supervisor.id,
          }
        });
      }

      // одношаговое назначение темы при принятии (опционально)
      if (acceptTopicId) {
        await assignTopicToRequest({ supervisorId: supervisor.id, requestId: request.id, topicId: acceptTopicId });
      }
    }

    const updatedRequest = await prisma.request.update({
      where: { id: request.id },
      data: { status: parsed.data.status }
    });

    // #6 — после принятия гасим конкурирующие заявки того же студента/команды
    if (parsed.data.status === 'accepted') {
      await invalidateCompetingRequests(request);
    }

    // пересчитываем загрузку этого супервайзера из источника правды (и для accept, и для отмены)
    await recountSupervisor(supervisor.id);

    res.json(updatedRequest);
  }));

  // ==================== СТУДЕНТЫ / КОМАНДЫ / ПРИГЛАШЕНИЯ ====================

  // справочник студентов: для выбора участников команды и для discovery ("ищу команду")
  app.get('/students', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const openToTeamOnly = String((req as any).query.openToTeam || '').toLowerCase() === 'true';
    const keyword = String((req as any).query.keyword || '').trim().toLowerCase();

    // #3 — студенты, уже состоящие в команде или назначенные супервайзеру, не доступны для подбора
    const committedIds = await getCommittedStudentIds();
    const excludeIds = [...new Set([userPayload.sub, ...committedIds])];

    const where: Record<string, any> = {
      role: 'student',
      id: { notIn: excludeIds }, // исключаем себя и уже занятых студентов
    };
    if (openToTeamOnly) where.openToTeam = true;

    let students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        department: true,
        groupName: true,
        avatar: true,
        interests: true,
        skills: true,
        preferredTeamSize: true,
        openToTeam: true,
      },
      orderBy: { fullName: 'asc' },
    });

    if (keyword) {
      students = students.filter(s =>
        s.fullName.toLowerCase().includes(keyword) ||
        (s.department || '').toLowerCase().includes(keyword)
      );
    }

    res.json(students);
  }));

  // загружаем команду с участниками в компактном виде
  async function loadTeam(teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: { user: { select: { id: true, fullName: true, department: true, groupName: true, avatar: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
    });
    if (!team) return null;
    return {
      id: team.id,
      name: team.name,
      leaderUserId: team.leaderUserId,
      createdAt: team.createdAt,
      members: team.members.map(m => ({
        id: m.id,
        userId: m.userId,
        name: m.user?.fullName || '',
        department: m.user?.department || '',
        group: m.user?.groupName || '',
        avatar: m.user?.avatar || null,
        role: m.role,
        status: m.status,
      })),
    };
  }

  // создаём команду: лидер + приглашённые участники (use case 1)
  app.post('/teams', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'student') throw createError(403, 'Only students can create teams.');

    const parsed = createTeamSchema.safeParse(req.body);
    if (!parsed.success) throw createError(400, parsed.error.issues?.[0]?.message || 'Invalid team payload');

    // отфильтровываем самого лидера из списка участников и дубли
    const memberIds = [...new Set(parsed.data.memberUserIds.filter(id => id !== userPayload.sub))];

    // проверяем что все указанные пользователи — реальные студенты
    if (memberIds.length > 0) {
      const found = await prisma.user.count({ where: { id: { in: memberIds }, role: 'student' } });
      if (found !== memberIds.length) throw createError(400, 'One or more selected members are invalid.');
    }

    const team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        leaderUserId: userPayload.sub,
        members: {
          create: [
            { userId: userPayload.sub, role: 'leader', status: 'accepted' },
            ...memberIds.map(id => ({ userId: id, role: 'member', status: 'pending' })),
          ],
        },
        invitations: {
          create: memberIds.map(id => ({ fromUserId: userPayload.sub, toUserId: id, status: 'pending' })),
        },
      },
    });

    const full = await loadTeam(team.id);
    res.json(full);
  }));

  // команды, в которых пользователь состоит или которыми руководит
  app.get('/teams/mine', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const memberships = await prisma.teamMember.findMany({
      where: { userId: userPayload.sub, status: { not: 'declined' } },
      select: { teamId: true },
    });
    const teamIds = [...new Set(memberships.map(m => m.teamId))];
    const teams = await Promise.all(teamIds.map(id => loadTeam(id)));
    res.json(teams.filter(Boolean));
  }));

  // одна команда (доступ — участникам или назначенному супервайзеру)
  app.get('/teams/:id', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const teamId = (req as any).params.id;
    const team = await loadTeam(teamId);
    if (!team) throw createError(404, 'Team not found.');

    const isMember = team.members.some(m => m.userId === userPayload.sub);
    let isSupervisorOfTeam = false;
    if (userPayload.role === 'supervisor') {
      const sup = await prisma.supervisor.findUnique({ where: { userId: userPayload.sub } });
      if (sup) {
        const teamRequest = await prisma.request.findFirst({ where: { teamId, supervisorId: sup.id } });
        isSupervisorOfTeam = !!teamRequest;
      }
    }
    if (!isMember && !isSupervisorOfTeam) throw createError(403, 'Access denied.');

    res.json(team);
  }));

  // приглашения, полученные текущим пользователем
  app.get('/invitations', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const invitations = await prisma.teamInvitation.findMany({
      where: { toUserId: userPayload.sub, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      include: {
        from: { select: { fullName: true, department: true } },
        team: {
          include: {
            members: {
              where: { status: { not: 'declined' } },
              include: { user: { select: { fullName: true, department: true, groupName: true } } },
            },
          },
        },
      },
    });

    const result = invitations.map(inv => ({
      id: inv.id,
      teamId: inv.teamId,
      teamName: inv.team?.name || '',
      fromName: inv.from?.fullName || '',
      fromDepartment: inv.from?.department || '',
      createdAt: inv.createdAt,
      members: (inv.team?.members || []).map(m => ({
        name: m.user?.fullName || '',
        department: m.user?.department || '',
        group: m.user?.groupName || '',
        role: m.role,
        status: m.status,
      })),
    }));
    res.json(result);
  }));

  // отправить приглашение в команду (use case 2 "Send Team Invitation")
  app.post('/invitations', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'student') throw createError(403, 'Only students can send team invitations.');

    const parsed = createInvitationSchema.safeParse(req.body);
    if (!parsed.success) throw createError(400, parsed.error.issues?.[0]?.message || 'Invalid invitation payload');

    if (parsed.data.toUserId === userPayload.sub) throw createError(400, 'You cannot invite yourself.');

    const target = await prisma.user.findFirst({ where: { id: parsed.data.toUserId, role: 'student' } });
    if (!target) throw createError(404, 'Student not found.');

    // #3 — нельзя приглашать студента, который уже состоит в команде или назначен супервайзеру
    const committed = await getCommittedStudentIds();
    if (committed.has(parsed.data.toUserId)) {
      throw createError(409, 'This student is already part of a team or assigned to a supervisor.');
    }

    // определяем команду: либо переданную (лидер), либо команду по умолчанию у приглашающего
    let teamId = parsed.data.teamId || null;
    if (teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) throw createError(404, 'Team not found.');
      if (team.leaderUserId !== userPayload.sub) throw createError(403, 'Only the team leader can invite to this team.');
    } else {
      // ищем команду, которую пользователь возглавляет; если нет — создаём «My Team»
      let team = await prisma.team.findFirst({ where: { leaderUserId: userPayload.sub } });
      if (!team) {
        const me = await prisma.user.findUnique({ where: { id: userPayload.sub } });
        team = await prisma.team.create({
          data: {
            name: me ? `${me.fullName}'s Team` : 'My Team',
            leaderUserId: userPayload.sub,
            members: { create: [{ userId: userPayload.sub, role: 'leader', status: 'accepted' }] },
          },
        });
      }
      teamId = team.id;
    }

    // защита от дублей (@@unique([teamId, toUserId]) тоже подстрахует)
    const existing = await prisma.teamInvitation.findUnique({
      where: { teamId_toUserId: { teamId, toUserId: parsed.data.toUserId } },
    });
    if (existing) {
      if (existing.status === 'pending') throw createError(400, 'This student already has a pending invitation to your team.');
      // повторно приглашаем — реактивируем
      await prisma.teamInvitation.update({ where: { id: existing.id }, data: { status: 'pending', fromUserId: userPayload.sub } });
    } else {
      await prisma.teamInvitation.create({
        data: { teamId, fromUserId: userPayload.sub, toUserId: parsed.data.toUserId, status: 'pending' },
      });
    }

    // заводим (или реактивируем) запись участника со статусом pending
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId: parsed.data.toUserId } },
      create: { teamId, userId: parsed.data.toUserId, role: 'member', status: 'pending' },
      update: { status: 'pending' },
    });

    res.json({ ok: true, teamId });
  }));

  // принять / отклонить приглашение
  app.patch('/invitations/:id', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const parsed = respondInvitationSchema.safeParse(req.body);
    if (!parsed.success) throw createError(400, 'Invalid response payload');

    const invitation = await prisma.teamInvitation.findUnique({ where: { id: (req as any).params.id } });
    if (!invitation) throw createError(404, 'Invitation not found.');
    if (invitation.toUserId !== userPayload.sub) throw createError(403, 'This invitation is not addressed to you.');

    const newStatus = parsed.data.action === 'accept' ? 'accepted' : 'declined';

    // 1 команда = 1 слот, поэтому вступление/выход участника НЕ меняет вместимость супервайзера —
    // дополнительная проверка слотов и пересчёт здесь не нужны.
    await prisma.teamInvitation.update({ where: { id: invitation.id }, data: { status: newStatus } });
    await prisma.teamMember.updateMany({
      where: { teamId: invitation.teamId, userId: userPayload.sub },
      data: { status: newStatus },
    });

    res.json({ ok: true, status: newStatus });
  }));

  // ==================== ПРОЕКТЫ ====================

  // настраиваем multer для сохранения файлов проекта на диск
  const projectStorage = multer.diskStorage({
    destination: (req: any, file: any, cb: any) => {
      const dir = path.join(process.cwd(), 'uploads', 'projects', req.params.id);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req: any, file: any, cb: any) => {
      // добавляем timestamp чтобы не было конфликтов имён
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  });
  const projectUpload = multer({ storage: projectStorage, limits: { fileSize: 20 * 1024 * 1024 } });

  // список проектов текущего юзера
  app.get('/projects', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);

    let projects;
    if (userPayload.role === 'student') {
      // #4 — проект виден лидеру И подтверждённым участникам команды.
      // собираем команды, где пользователь — accepted-участник, и их принятые заявки
      const memberships = await prisma.teamMember.findMany({
        where: { userId: userPayload.sub, status: 'accepted' },
        select: { teamId: true },
      });
      const teamIds = [...new Set(memberships.map((m) => m.teamId))];
      let teamRequestIds: string[] = [];
      if (teamIds.length) {
        const teamReqs = await prisma.request.findMany({
          where: { teamId: { in: teamIds }, status: 'accepted' },
          select: { id: true },
        });
        teamRequestIds = teamReqs.map((r) => r.id);
      }

      projects = await prisma.project.findMany({
        where: {
          OR: [
            { studentUserId: userPayload.sub },
            ...(teamRequestIds.length ? [{ requestId: { in: teamRequestIds } }] : []),
          ],
        },
        include: { files: true, supervisor: { select: { name: true, avatar: true } } },
        orderBy: { updatedAt: 'desc' },
      });
    } else {
      const supervisor = await prisma.supervisor.findUnique({ where: { userId: userPayload.sub } });
      if (!supervisor) { res.json([]); return; }
      projects = await prisma.project.findMany({
        where: { supervisorId: supervisor.id },
        include: { files: true, student: { select: { fullName: true, avatar: true } } },
        orderBy: { updatedAt: 'desc' },
      });
    }

    res.json(projects);
  }));

  // детали проекта — только для участников
  app.get('/projects/:id', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const project = await prisma.project.findUnique({
      where: { id: (req as any).params.id },
      include: {
        files: { orderBy: { createdAt: 'desc' } },
        student: { select: { id: true, fullName: true, avatar: true, email: true } },
        supervisor: { select: { id: true, name: true, avatar: true, userId: true } },
        topic: { select: { id: true, title: true, area: true, description: true, status: true } },
      },
    });
    if (!project) throw createError(404, 'Project not found.');

    // #2 — доступ у супервайзера и у всех подтверждённых участников команды
    const canAccess = await userCanAccessProject(project, userPayload.sub);
    if (!canAccess) throw createError(403, 'You are not a member of this project.');

    // #2 — отдаём полный список участников (лидер/студент + accepted-члены команды)
    const participants = await getProjectParticipants(project);

    res.json({ ...project, participants });
  }));

  // обновить название/описание проекта
  app.patch('/projects/:id', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const project = await prisma.project.findUnique({
      where: { id: (req as any).params.id },
      include: { supervisor: { select: { userId: true } } },
    });
    if (!project) throw createError(404, 'Project not found.');

    const canAccess = await userCanAccessProject(project, userPayload.sub);
    if (!canAccess) throw createError(403, 'You are not a member of this project.');

    const { title, description } = req.body as any;
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && { description: String(description).trim() }),
      },
    });

    res.json(updated);
  }));

  // загрузить файл в проект
  app.post('/projects/:id/files', requireAuth, projectUpload.single('file'), asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const project = await prisma.project.findUnique({
      where: { id: (req as any).params.id },
      include: { supervisor: { select: { userId: true } } },
    });
    if (!project) throw createError(404, 'Project not found.');

    const canAccess = await userCanAccessProject(project, userPayload.sub);
    if (!canAccess) throw createError(403, 'You are not a member of this project.');

    if (!(req as any).file) throw createError(400, 'No file uploaded.');
    const file = (req as any).file;

    const name = String((req.body as any).name || file.originalname).trim();

    const projectFile = await prisma.projectFile.create({
      data: {
        projectId: project.id,
        name,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: userPayload.sub,
      },
    });

    // обновляем updatedAt у проекта
    await prisma.project.update({ where: { id: project.id }, data: {} });

    res.json(projectFile);
  }));

  // скачать файл из проекта
  app.get('/projects/:id/files/:fileId/download', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const project = await prisma.project.findUnique({
      where: { id: (req as any).params.id },
      include: { supervisor: { select: { userId: true } } },
    });
    if (!project) throw createError(404, 'Project not found.');

    const canAccess = await userCanAccessProject(project, userPayload.sub);
    if (!canAccess) throw createError(403, 'You are not a member of this project.');

    const file = await prisma.projectFile.findUnique({ where: { id: (req as any).params.fileId } });
    if (!file || file.projectId !== project.id) throw createError(404, 'File not found.');

    if (!fs.existsSync(file.filePath)) throw createError(404, 'File not found on disk.');

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.fileName)}"`);
    res.setHeader('Content-Type', file.mimeType);
    const stream = fs.createReadStream(file.filePath);
    stream.pipe(res as any);
  }));

  // удалить файл из проекта
  app.delete('/projects/:id/files/:fileId', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const project = await prisma.project.findUnique({
      where: { id: (req as any).params.id },
      include: { supervisor: { select: { userId: true } } },
    });
    if (!project) throw createError(404, 'Project not found.');

    const canAccess = await userCanAccessProject(project, userPayload.sub);
    if (!canAccess) throw createError(403, 'You are not a member of this project.');

    const file = await prisma.projectFile.findUnique({ where: { id: (req as any).params.fileId } });
    if (!file || file.projectId !== project.id) throw createError(404, 'File not found.');

    // удаляем файл с диска
    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }

    await prisma.projectFile.delete({ where: { id: file.id } });
    res.json({ ok: true });
  }));

  // расформировать проект — удаляет проект, файлы с диска и из БД, сбрасывает заявку
  app.delete('/projects/:id', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const project = await prisma.project.findUnique({
      where: { id: (req as any).params.id },
      include: {
        files: true,
        supervisor: { select: { id: true, userId: true } },
      },
    });
    if (!project) throw createError(404, 'Project not found.');

    // расформировать может только лидер/автор заявки или супервайзер — не рядовой участник
    const canDisband = project.studentUserId === userPayload.sub || project.supervisor.userId === userPayload.sub;
    if (!canDisband) throw createError(403, 'Only the team leader or supervisor can disband this project.');

    // удаляем физические файлы с диска
    for (const file of project.files) {
      if (fs.existsSync(file.filePath)) {
        try { fs.unlinkSync(file.filePath); } catch { /* файл мог быть уже удалён */ }
      }
    }

    // пытаемся удалить папку проекта (если пустая)
    const projectDir = path.join(process.cwd(), 'uploads', 'projects', project.id);
    if (fs.existsSync(projectDir)) {
      try { fs.rmdirSync(projectDir); } catch { /* папка не пустая — ничего страшного */ }
    }

    // сбрасываем статус заявки на rejected, чтобы студент мог подать заново
    await prisma.request.update({
      where: { id: project.requestId },
      data: { status: 'rejected' },
    }).catch(() => { });

    // #7 — освобождаем тему: проект распущен, тема снова доступна для назначения
    if (project.topicId) {
      await prisma.topic
        .update({ where: { id: project.topicId }, data: { status: 'Available' } })
        .catch(() => {});
    }

    // удаляем проект (каскадно удалятся ProjectFile записи из БД)
    await prisma.project.delete({ where: { id: project.id } });

    // пересчитываем загрузку супервайзера из источника правды (заявка теперь rejected)
    await recountSupervisor(project.supervisor.id);

    res.json({ ok: true });
  }));
}
