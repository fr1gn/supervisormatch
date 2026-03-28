import { Response } from 'express';
import { z } from 'zod';
import {
  hashValue,
  makeId,
  normalizeEmail,
  requireAuth,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from './auth';
import {
  AuthedRequest,
  DatabaseSchema,
  JwtPayload,
  RequestRecord,
  SupervisorRecord,
  UserRecord,
} from './types';
import { DataStore } from './data-store';

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
});

const updateSupervisorSchema = z.object({
  name: z.string().trim().min(2),
  title: z.string().trim().optional(),
  department: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  bio: z.string().trim().optional(),
  areas: z.array(z.string().trim().min(1)).min(1),
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

function sanitizeUser(user: UserRecord): Omit<UserRecord, 'passwordHash' | 'refreshTokenHash'> {
  const { passwordHash, refreshTokenHash, ...safeUser } = user;
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

export function registerRoutes(app: any, store: DataStore): void {
  app.post('/auth/register', asyncRoute(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid register payload');
    }

    const input = parsed.data;
    const email = normalizeEmail(input.email);

    const user = await store.mutate((db: DatabaseSchema) => {
      const exists = db.users.some((item) => item.email === email);
      if (exists) {
        throw createError(409, 'An account with this email already exists.');
      }

      const now = new Date().toISOString();
      const newUser: UserRecord = {
        id: makeId('usr'),
        fullName: input.fullName,
        email,
        role: input.role,
        passwordHash: hashValue(input.password),
        department: input.department,
        groupName: input.groupName || '',
        phone: '',
        studyLevel: '',
        interests: '',
        bio: '',
        createdAt: now,
      };

      db.users.push(newUser);

      if (newUser.role === 'supervisor') {
        const newSupervisor: SupervisorRecord = {
          id: makeId('sup'),
          userId: newUser.id,
          email: newUser.email,
          phone: '',
          name: newUser.fullName,
          title: 'Supervisor',
          department: newUser.department,
          areas: newUser.department ? [newUser.department] : ['General Research'],
          capacity: 8,
          currentStudents: 0,
          avatar:
            'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=160&q=80',
          bio: 'Update your profile with your specialization and supervision preferences.',
          topics: [],
        };
        db.supervisors.unshift(newSupervisor);
      }

      return newUser;
    });

    res.json({ ok: true, user: sanitizeUser(user) });
  }));

  app.post('/auth/login', asyncRoute(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid login payload');
    }

    const email = normalizeEmail(parsed.data.email);
    const incomingHash = hashValue(parsed.data.password);

    const result = await store.mutate((db: DatabaseSchema) => {
      const user = db.users.find((item) => item.email === email);
      if (!user || user.passwordHash !== incomingHash) {
        throw createError(401, 'Invalid email or password.');
      }

      const payload: JwtPayload = {
        sub: user.id,
        role: user.role,
        email: user.email,
      };
      const refreshToken = signRefreshToken(payload);
      user.refreshTokenHash = hashValue(refreshToken);
      const accessToken = signAccessToken(payload);

      return { user, accessToken, refreshToken };
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ ok: true, accessToken: result.accessToken, user: sanitizeUser(result.user) });
  }));

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

    const db = await store.read();
    const user = db.users.find((item) => item.id === payload.sub);
    if (!user || user.refreshTokenHash !== hashValue(token)) {
      throw createError(401, 'Refresh token is invalid.');
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    res.json({ ok: true, accessToken });
  }));

  app.post('/auth/logout', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);

    await store.mutate((db) => {
      const user = db.users.find((item) => item.id === userPayload.sub);
      if (!user) {
        throw createError(404, 'User not found.');
      }
      delete user.refreshTokenHash;
    });

    res.clearCookie('refreshToken');
    res.json({ ok: true });
  }));

  app.get('/users/me', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const db = await store.read();
    const user = db.users.find((item) => item.id === userPayload.sub);
    if (!user) {
      throw createError(404, 'User not found.');
    }

    res.json(sanitizeUser(user));
  }));

  app.patch('/users/me', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid profile update payload');
    }

    const updated = await store.mutate((db) => {
      const user = db.users.find((item) => item.id === userPayload.sub);
      if (!user) {
        throw createError(404, 'User not found.');
      }

      const updates = parsed.data as any;
      for (const key of ['fullName', 'department', 'groupName', 'phone', 'studyLevel', 'interests', 'bio']) {
        if (updates[key] !== undefined) {
          (user as any)[key] = updates[key];
        }
      }

      if (user.role === 'supervisor') {
        const supervisor = db.supervisors.find((item) => item.userId === user.id);
        if (supervisor) {
          if (updates.fullName !== undefined) supervisor.name = updates.fullName;
          if (updates.department !== undefined) supervisor.department = updates.department;
          if (updates.phone !== undefined) supervisor.phone = updates.phone;
          if (updates.bio !== undefined) supervisor.bio = updates.bio;
          if (updates.title !== undefined) supervisor.title = updates.title || 'Supervisor';
          if (updates.areas !== undefined) {
            if (updates.areas.length === 0) {
              throw createError(400, 'areas must include at least one value.');
            }
            supervisor.areas = updates.areas;
          }
        }
      }

      return sanitizeUser(user);
    });

    res.json(updated);
  }));

  app.get('/supervisors', asyncRoute(async (req, res) => {
    const db = await store.read();
    const keyword = String((req as any).query.keyword || '').trim().toLowerCase();
    const department = String((req as any).query.department || '').trim();
    const area = String((req as any).query.area || '').trim();
    const availableOnly = String((req as any).query.availableOnly || '').toLowerCase() === 'true';

    const result = db.supervisors.filter((sup) => {
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

  app.get('/supervisors/:id', asyncRoute(async (req, res) => {
    const db = await store.read();
    const supervisor = db.supervisors.find((item) => item.id === (req as any).params.id);
    if (!supervisor) {
      throw createError(404, 'Supervisor not found.');
    }
    res.json(supervisor);
  }));

  app.patch('/supervisors/:id/profile', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') {
      throw createError(403, 'Only supervisors can update this profile.');
    }

    const parsed = updateSupervisorSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid supervisor profile payload');
    }

    const result = await store.mutate((db) => {
      const supervisor = db.supervisors.find((item) => item.id === (req as any).params.id);
      if (!supervisor) {
        throw createError(404, 'Supervisor not found.');
      }
      if (supervisor.userId !== userPayload.sub) {
        throw createError(403, 'You can only edit your own supervisor profile.');
      }

      supervisor.name = parsed.data.name;
      supervisor.title = parsed.data.title || 'Supervisor';
      supervisor.department = parsed.data.department;
      supervisor.phone = parsed.data.phone || '';
      supervisor.bio = parsed.data.bio || '';
      supervisor.areas = parsed.data.areas;

      const user = db.users.find((item) => item.id === userPayload.sub);
      if (user) {
        user.fullName = parsed.data.name;
        user.department = parsed.data.department;
        user.phone = parsed.data.phone || '';
        user.bio = parsed.data.bio || '';
      }

      return supervisor;
    });

    res.json(result);
  }));

  app.post('/supervisors/:id/topics', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') {
      throw createError(403, 'Only supervisors can add topics.');
    }

    const parsed = addTopicSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid topic payload');
    }

    const topic = await store.mutate((db) => {
      const supervisor = db.supervisors.find((item) => item.id === (req as any).params.id);
      if (!supervisor) {
        throw createError(404, 'Supervisor not found.');
      }
      if (supervisor.userId !== userPayload.sub) {
        throw createError(403, 'You can only add topics to your own profile.');
      }

      const nextTopic = {
        id: makeId('top'),
        title: parsed.data.title,
        area: parsed.data.area,
        description: parsed.data.description,
        createdAt: new Date().toISOString(),
      };

      if (!supervisor.areas.includes(nextTopic.area)) {
        supervisor.areas.push(nextTopic.area);
      }

      supervisor.topics = Array.isArray(supervisor.topics) ? supervisor.topics : [];
      supervisor.topics.unshift(nextTopic);
      return nextTopic;
    });

    res.json(topic);
  }));

  app.delete('/supervisors/:id/topics/:topicId', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') {
      throw createError(403, 'Only supervisors can remove topics.');
    }

    const result = await store.mutate((db) => {
      const supervisor = db.supervisors.find((item) => item.id === (req as any).params.id);
      if (!supervisor) {
        throw createError(404, 'Supervisor not found.');
      }
      if (supervisor.userId !== userPayload.sub) {
        throw createError(403, 'You can only remove topics from your own profile.');
      }

      const previousCount = (supervisor.topics || []).length;
      supervisor.topics = (supervisor.topics || []).filter((topic) => topic.id !== (req as any).params.topicId);

      if (previousCount === supervisor.topics.length) {
        throw createError(404, 'Topic not found.');
      }

      return { ok: true };
    });

    res.json(result);
  }));

  app.post('/requests', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'student') {
      throw createError(403, 'Only student accounts can send requests.');
    }

    const parsed = createRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid request payload');
    }

    const request = await store.mutate((db) => {
      const student = db.users.find((item) => item.id === userPayload.sub);
      if (!student) {
        throw createError(404, 'Student user not found.');
      }

      const supervisor = db.supervisors.find((item) => item.id === parsed.data.supervisorId);
      if (!supervisor) {
        throw createError(404, 'Supervisor not found.');
      }

      const duplicate = db.requests.some(
        (item) =>
          item.studentUserId === student.id &&
          item.supervisorId === supervisor.id &&
          item.status !== 'rejected',
      );

      if (duplicate) {
        throw createError(400, 'You already have an active request for this supervisor.');
      }

      const now = new Date().toISOString();
      const nextRequest: RequestRecord = {
        id: makeId('req'),
        studentUserId: student.id,
        studentEmail: student.email,
        studentName: student.fullName,
        supervisorId: supervisor.id,
        message: parsed.data.message,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      db.requests.unshift(nextRequest);
      return nextRequest;
    });

    res.json(request);
  }));

  app.get('/requests/student', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'student') {
      throw createError(403, 'Only student accounts can view this list.');
    }

    const db = await store.read();
    const result = db.requests.filter((item) => item.studentUserId === userPayload.sub);
    res.json(result);
  }));

  app.get('/requests/supervisor', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') {
      throw createError(403, 'Only supervisor accounts can view this list.');
    }

    const db = await store.read();
    const supervisor = db.supervisors.find((item) => item.userId === userPayload.sub);
    if (!supervisor) {
      res.json([]);
      return;
    }

    const result = db.requests.filter((item) => item.supervisorId === supervisor.id);
    res.json(result);
  }));

  app.patch('/requests/:id/status', requireAuth, asyncRoute(async (req, res) => {
    const userPayload = mustUser(req);
    if (userPayload.role !== 'supervisor') {
      throw createError(403, 'Only supervisor accounts can update request status.');
    }

    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      throw createError(400, 'Invalid status payload');
    }

    const updated = await store.mutate((db) => {
      const supervisor = db.supervisors.find((item) => item.userId === userPayload.sub);
      if (!supervisor) {
        throw createError(404, 'Supervisor profile not found.');
      }

      const request = db.requests.find((item) => item.id === (req as any).params.id);
      if (!request) {
        throw createError(404, 'Request not found.');
      }

      if (request.supervisorId !== supervisor.id) {
        throw createError(403, 'You can only update requests assigned to you.');
      }

      const wasAccepted = request.status === 'accepted';
      request.status = parsed.data.status;
      request.updatedAt = new Date().toISOString();

      if (parsed.data.status === 'accepted' && !wasAccepted) {
        if (supervisor.currentStudents >= supervisor.capacity) {
          throw createError(400, 'Supervisor has no remaining capacity.');
        }
        supervisor.currentStudents += 1;
      }

      return request;
    });

    res.json(updated);
  }));
}
