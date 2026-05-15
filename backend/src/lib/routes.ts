import { Response } from 'express';
import { z } from 'zod';
import {
  hashValue,
  normalizeEmail,
  requireAuth,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './auth';
import { AuthedRequest, JwtPayload } from './types';
import { prisma } from './prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
});

const updateSupervisorSchema = z.object({
  name: z.string().trim().min(2),
  title: z.string().trim().optional(),
  department: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  areas: z.array(z.string().trim().min(1)).min(1),
  avatar: z.string().trim().optional(),
});

const addTopicSchema = z.object({
  title: z.string().trim().min(1),
  area: z.string().trim().min(1),
  description: z.string().trim().min(1),
});

const createRequestSchema = z.object({
  supervisorId: z.string().trim().min(1),
  message: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || 'I would like to discuss potential supervision opportunities.'),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'under review', 'accepted', 'rejected']),
});

function sanitizeUser(user: any) {
  const { password, refreshTokenHash, ...safeUser } = user;
  return safeUser;
}

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

function createError(statusCode: number, message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}

function mustUser(req: AuthedRequest): JwtPayload {
  if (!req.user) {
    throw createError(401, 'Unauthorized');
  }
  return req.user;
}

export function registerRoutes(app: any, store: any): void {
  // upload
  app.post('/upload', requireAuth, upload.single('file'), (req: any, res: any) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const base64 = req.file.buffer.toString('base64');
    const url = `data:${req.file.mimetype};base64,${base64}`;
    res.json({ url });
  });

  // auth/register
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

    const newUser = await prisma.user.create({
      data: {
        fullName: input.fullName,
        email,
        role: input.role,
        password: hashValue(input.password),
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

  // auth/login
  app.post('/auth/login', asyncRoute(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid login payload');
    }

    const email = normalizeEmail(parsed.data.email);
    const incomingHash = hashValue(parsed.data.password);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== incomingHash) {
      throw createError(401, 'Invalid email or password.');
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

  // auth/refresh
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

  // auth/logout
  app.post('/auth/logout', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    
    await prisma.user.update({
      where: { id: userPayload.sub },
      data: { refreshTokenHash: null }
    }).catch(() => {}); // ignore if user not found

    res.clearCookie('refreshToken');
    res.json({ ok: true });
  }));

  // users/me
  app.get('/users/me', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const user = await prisma.user.findUnique({ where: { id: userPayload.sub } });
    if (!user) {
      throw createError(404, 'User not found.');
    }
    res.json(sanitizeUser(user));
  }));

  // users/me (PATCH)
  app.patch('/users/me', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid profile update payload');
    }

    const updates = parsed.data as any;

    // Build user update data — only include defined fields (Prisma rejects undefined)
    const userData: Record<string, any> = {};
    for (const key of ['fullName', 'department', 'groupName', 'phone', 'studyLevel', 'interests', 'bio', 'avatar']) {
      if (updates[key] !== undefined) {
        userData[key] = updates[key];
      }
    }

    // update user
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
        }).catch(() => {});
      }
    }

    res.json(sanitizeUser(updatedUser));
  }));

  // supervisors
  app.get('/supervisors', asyncRoute(async (req, res) => {
    const keyword = String((req as any).query.keyword || '').trim().toLowerCase();
    const department = String((req as any).query.department || '').trim();
    const area = String((req as any).query.area || '').trim();
    const availableOnly = String((req as any).query.availableOnly || '').toLowerCase() === 'true';

    const supervisors = await prisma.supervisor.findMany({
      include: { topics: true }
    });

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

  // supervisors/:id
  app.get('/supervisors/:id', asyncRoute(async (req, res) => {
    const supervisor = await prisma.supervisor.findUnique({
      where: { id: (req as any).params.id },
      include: { topics: true }
    });
    if (!supervisor) {
      throw createError(404, 'Supervisor not found.');
    }
    res.json(supervisor);
  }));

  // supervisors/:id/profile (PATCH)
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

  // supervisors/:id/topics
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

  // supervisors/:id/topics/:topicId
  app.delete('/supervisors/:id/topics/:topicId', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') throw createError(403, 'Only supervisors can remove topics.');

    const supervisor = await prisma.supervisor.findUnique({ where: { id: (req as any).params.id } });
    if (!supervisor) throw createError(404, 'Supervisor not found.');
    if (supervisor.userId !== userPayload.sub) throw createError(403, 'You can only remove topics from your own profile.');

    try {
      await prisma.topic.delete({ where: { id: (req as any).params.topicId } });
    } catch {
      throw createError(404, 'Topic not found.');
    }

    res.json({ ok: true });
  }));

  // requests
  app.post('/requests', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'student') throw createError(403, 'Only student accounts can send requests.');

    const parsed = createRequestSchema.safeParse(req.body);
    if (!parsed.success) throw createError(400, 'Invalid request payload');

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

    const request = await prisma.request.create({
      data: {
        studentUserId: student.id,
        studentEmail: student.email,
        studentName: student.fullName,
        supervisorId: supervisor.id,
        message: parsed.data.message,
        status: 'pending'
      }
    });

    res.json(request);
  }));

  // requests/student
  app.get('/requests/student', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'student') throw createError(403, 'Only student accounts can view this list.');

    const requests = await prisma.request.findMany({
      where: { studentUserId: userPayload.sub },
      orderBy: { createdAt: 'desc' }
    });
    res.json(requests);
  }));

  // requests/supervisor
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
      include: { student: { select: { avatar: true } } },
    });

    // Flatten student avatar onto each request object
    const result = requests.map(r => ({
      ...r,
      studentAvatar: r.student?.avatar || null,
      student: undefined, // remove the nested object
    }));

    res.json(result);
  }));

  // requests/:id/status
  app.patch('/requests/:id/status', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') throw createError(403, 'Only supervisor accounts can update request status.');

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) throw createError(400, 'Invalid status payload');

    const supervisor = await prisma.supervisor.findUnique({ where: { userId: userPayload.sub } });
    if (!supervisor) throw createError(404, 'Supervisor profile not found.');

    const request = await prisma.request.findUnique({ where: { id: (req as any).params.id } });
    if (!request) throw createError(404, 'Request not found.');

    if (request.supervisorId !== supervisor.id) throw createError(403, 'You can only update requests assigned to you.');

    if (parsed.data.status === 'accepted' && request.status !== 'accepted') {
      if (supervisor.currentStudents >= supervisor.capacity) {
        throw createError(400, 'Supervisor has no remaining capacity.');
      }
      await prisma.supervisor.update({
        where: { id: supervisor.id },
        data: { currentStudents: { increment: 1 } }
      });
    }

    const updatedRequest = await prisma.request.update({
      where: { id: request.id },
      data: { status: parsed.data.status }
    });

    res.json(updatedRequest);
  }));
}
