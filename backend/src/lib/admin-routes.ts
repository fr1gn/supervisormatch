import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthedRequest } from './types';
import { prisma } from './prisma';


interface AdminJwtPayload {
  sub: string;
  role: 'super_admin';
  email: string;
}

function signAdminToken(payload: AdminJwtPayload): string {
  const secret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
  return jwt.sign(payload, secret, { expiresIn: '24h' });
}

function verifyAdminToken(token: string): AdminJwtPayload {
  const secret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
  return jwt.verify(token, secret) as AdminJwtPayload;
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): Response | void {
  const authHeader = req.headers.authorization as string | undefined;
  const raw = String(authHeader || '');
  const [scheme, token] = raw.split(' ');

  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  try {
    const payload = verifyAdminToken(token);
    if (payload.role !== 'super_admin') {
      return res.status(403).json({ message: 'Forbidden: admin access required' });
    }
    (req as any).adminUser = payload;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
}

function asyncRoute(handler: (req: AuthedRequest, res: Response) => Promise<any>) {
  return async (req: AuthedRequest, res: Response) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      const status = Number(error?.statusCode || error?.status || 500);
      const message = error?.message || 'Internal server error';
      res.status(status).json({ message });
    }
  };
}


function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const safePage = (!page || isNaN(page) || page < 1) ? 1 : page;
  const safePageSize = (!pageSize || isNaN(pageSize) || pageSize < 1) ? 10 : pageSize;
  const totalPages = Math.ceil(total / safePageSize);
  const start = (safePage - 1) * safePageSize;
  const data = items.slice(start, start + safePageSize);
  return {
    data,
    pagination: { page: safePage, pageSize: safePageSize, total, totalPages },
  };
}


export function registerAdminRoutes(app: any): void {

  // вход в админ панель
  app.post('/admin/auth/login', asyncRoute(async (req, res) => {
    const { email, password, login } = req.body || {};

    const inputLogin = (login || email || '').trim();
    const inputPassword = (password || '').trim();

    const adminLogin = process.env.ADMIN_LOGIN || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (inputLogin !== adminLogin || inputPassword !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const payload: AdminJwtPayload = {
      sub: 'admin-001',
      role: 'super_admin',
      email: `${adminLogin}@supervisormatch.local`,
    };

    const token = signAdminToken(payload);

    res.json({
      token,
      user: {
        id: 'admin-001',
        name: 'Administrator',
        email: payload.email,
        role: 'super_admin',
        avatar: null,
      },
      expiresIn: 86400,
    });
  }));

  app.post('/admin/auth/logout', requireAdmin, asyncRoute(async (_req, res) => {
    res.json({ success: true, message: 'Logged out' });
  }));

  app.get('/admin/auth/profile', requireAdmin, asyncRoute(async (req, res) => {
    const admin = (req as any).adminUser as AdminJwtPayload;
    res.json({
      data: {
        id: admin.sub,
        name: 'Administrator',
        email: admin.email,
        role: admin.role,
        avatar: null,
      },
    });
  }));

  // наши дашборды
  app.get('/admin/dashboard/stats', requireAdmin, asyncRoute(async (_req, res) => {
    const totalStudents = await prisma.user.count({ where: { role: 'student' } });
    const totalSupervisors = await prisma.supervisor.count();
    const pendingRequests = await prisma.request.count({ where: { status: 'pending' } });
    const totalRequests = await prisma.request.count();
    const acceptedRequests = await prisma.request.count({ where: { status: 'accepted' } });
    const matchRate = totalRequests > 0 ? ((acceptedRequests / totalRequests) * 100).toFixed(1) + '%' : '0%';

    res.json({
      data: [
        { id: 'total-students', label: 'Total Students', value: totalStudents, change: 0, period: 'all time', icon: 'GraduationCap', color: 'accent' },
        { id: 'active-supervisors', label: 'Active Supervisors', value: totalSupervisors, change: 0, period: 'all time', icon: 'Users', color: 'success' },
        { id: 'pending-applications', label: 'Pending Applications', value: pendingRequests, change: 0, period: 'current', icon: 'FileText', color: 'warning' },
        { id: 'match-rate', label: 'Match Rate', value: matchRate, change: 0, period: 'all time', icon: 'Target', color: 'info' },
      ],
    });
  }));

  app.get('/admin/dashboard/activity', requireAdmin, asyncRoute(async (_req, res) => {
    const recentRequests = await prisma.request.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { supervisor: true, student: { select: { avatar: true } } },
    });

    const activity = recentRequests.map((r) => ({
      id: r.id,
      user: r.studentName,
      action: r.status === 'accepted' ? 'was accepted by' :
        r.status === 'rejected' ? 'was rejected by' :
          r.status === 'pending' ? 'submitted an application to' : 'has update with',
      target: r.supervisor?.name || 'Unknown Supervisor',
      timestamp: r.updatedAt.toISOString(),
      type: r.status === 'accepted' ? 'approval' :
        r.status === 'rejected' ? 'rejection' :
          r.status === 'pending' ? 'application' : 'update',
      avatar: r.student?.avatar || null,
    }));

    res.json({ data: activity });
  }));

  // студенты 
  app.get('/admin/students', requireAdmin, asyncRoute(async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page) || '1'));
    const pageSize = Math.max(1, parseInt(String(req.query.pageSize) || '10'));
    const search = (String(req.query.search || '')).trim().toLowerCase();
    const status = String(req.query.status || '');
    const sortBy = String(req.query.sortBy || 'fullName');
    const sortDir = String(req.query.sortDir || 'asc');

    let students = await prisma.user.findMany({
      where: { role: 'student' },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        groupName: true,
        phone: true,
        studyLevel: true,
        interests: true,
        bio: true,
        avatar: true,
        createdAt: true,
        studentRequests: {
          select: { status: true, supervisorId: true, supervisor: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    let mapped = students.map((s, idx) => {
      const latestReq = s.studentRequests[0];
      const hasAccepted = s.studentRequests.some(r => r.status === 'accepted');
      return {
        id: s.id,
        name: s.fullName,
        email: s.email,
        studentId: `STU-${String(idx + 1).padStart(6, '0')}`,
        department: s.department,
        program: s.studyLevel || 'MSc',
        year: 1,
        gpa: 0,
        status: hasAccepted ? 'active' : (latestReq ? 'pending' : 'inactive'),
        supervisor: hasAccepted ? latestReq?.supervisor?.name || null : null,
        applicationDate: s.createdAt.toISOString().split('T')[0],
        avatar: s.avatar || null,
        researchInterests: s.interests ? s.interests.split(',').map((i: string) => i.trim()).filter(Boolean) : [],
      };
    });

    // фильтры
    if (search) {
      mapped = mapped.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search) ||
        s.department.toLowerCase().includes(search)
      );
    }
    if (status) {
      mapped = mapped.filter(s => s.status === status);
    }

    // сортировка
    mapped.sort((a: any, b: any) => {
      const aVal = a[sortBy] ?? '';
      const bVal = b[sortBy] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'desc' ? -cmp : cmp;
    });

    res.json(paginate(mapped, page, pageSize));
  }));

  app.get('/admin/students/:id', requireAdmin, asyncRoute(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      include: { studentRequests: { include: { supervisor: true } } },
    });
    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ data: user });
  }));

  app.patch('/admin/students/:id', requireAdmin, asyncRoute(async (req, res) => {
    const { status } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    const updated = await prisma.user.update({
      where: { id: req.params.id as string },
      data: {
        fullName: req.body.fullName || user.fullName,
        department: req.body.department || user.department,
      },
    });
    res.json({ data: updated });
  }));

  app.delete('/admin/students/:id', requireAdmin, asyncRoute(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user || user.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }
    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Student deleted' });
  }));

  // преподы
  app.get('/admin/supervisors', requireAdmin, asyncRoute(async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page) || '1'));
    const pageSize = Math.max(1, parseInt(String(req.query.pageSize) || '10'));
    const search = (String(req.query.search || '')).trim().toLowerCase();
    const status = String(req.query.status || '');

    let supervisors = await prisma.supervisor.findMany({
      include: { topics: true, user: { select: { createdAt: true } } },
    });

    let mapped = supervisors.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email || '',
      department: s.department,
      title: s.title,
      specializations: s.areas,
      totalSlots: s.capacity,
      availableSlots: Math.max(0, s.capacity - s.currentStudents),
      activeStudents: s.currentStudents,
      status: s.currentStudents >= s.capacity ? 'full' : 'available' as string,
      rating: 4.5,
      yearsExperience: 5,
      avatar: s.avatar || null,
    }));

    if (search) {
      mapped = mapped.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.department.toLowerCase().includes(search) ||
        s.specializations.some(sp => sp.toLowerCase().includes(search))
      );
    }
    if (status) {
      mapped = mapped.filter(s => s.status === status);
    }

    res.json(paginate(mapped, page, pageSize));
  }));

  app.get('/admin/supervisors/:id', requireAdmin, asyncRoute(async (req, res) => {
    const sup = await prisma.supervisor.findUnique({
      where: { id: req.params.id as string },
      include: { topics: true, requests: true },
    });
    if (!sup) {
      return res.status(404).json({ message: 'Supervisor not found' });
    }
    res.json({ data: sup });
  }));

  app.patch('/admin/supervisors/:id', requireAdmin, asyncRoute(async (req, res) => {
    const sup = await prisma.supervisor.findUnique({ where: { id: req.params.id as string } });
    if (!sup) {
      return res.status(404).json({ message: 'Supervisor not found' });
    }
    const updated = await prisma.supervisor.update({
      where: { id: req.params.id as string },
      data: {
        name: req.body.name || sup.name,
        title: req.body.title || sup.title,
        department: req.body.department || sup.department,
        capacity: req.body.totalSlots || sup.capacity,
      },
    });
    res.json({ data: updated });
  }));

  // заявки
  app.get('/admin/applications', requireAdmin, asyncRoute(async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page) || '1'));
    const pageSize = Math.max(1, parseInt(String(req.query.pageSize) || '10'));
    const search = (String(req.query.search || '')).trim().toLowerCase();
    const status = String(req.query.status || '');

    const requests = await prisma.request.findMany({
      orderBy: { createdAt: 'desc' },
      include: { supervisor: true },
    });

    let mapped = requests.map(r => ({
      id: r.id,
      student: { name: r.studentName, id: r.studentUserId, email: r.studentEmail },
      supervisor: { name: r.supervisor?.name || 'Unknown', id: r.supervisorId },
      department: r.supervisor?.department || '',
      researchTopic: r.message,
      status: r.status === 'accepted' ? 'approved' :
        r.status === 'under review' ? 'under-review' :
          r.status as string,
      priority: 'medium' as string,
      submittedAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      timeline: [
        { status: 'submitted', timestamp: r.createdAt.toISOString(), note: 'Application submitted' },
        ...(r.status !== 'pending' ? [{ status: r.status, timestamp: r.updatedAt.toISOString(), note: `Status changed to ${r.status}` }] : []),
      ],
      documents: [],
    }));

    if (search) {
      mapped = mapped.filter(a =>
        a.student.name.toLowerCase().includes(search) ||
        a.supervisor.name.toLowerCase().includes(search) ||
        a.researchTopic.toLowerCase().includes(search)
      );
    }
    if (status) {
      mapped = mapped.filter(a => a.status === status);
    }

    res.json(paginate(mapped, page, pageSize));
  }));

  app.get('/admin/applications/:id', requireAdmin, asyncRoute(async (req, res) => {
    const r = await prisma.request.findUnique({
      where: { id: req.params.id as string },
      include: { supervisor: true },
    });
    if (!r) {
      return res.status(404).json({ message: 'Application not found' });
    }
    res.json({
      data: {
        id: r.id,
        student: { name: r.studentName, id: r.studentUserId, email: r.studentEmail },
        supervisor: { name: r.supervisor?.name || 'Unknown', id: r.supervisorId },
        department: r.supervisor?.department || '',
        researchTopic: r.message,
        status: r.status === 'accepted' ? 'approved' : r.status,
        priority: 'medium',
        submittedAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        timeline: [
          { status: 'submitted', timestamp: r.createdAt.toISOString(), note: 'Application submitted' },
          ...(r.status !== 'pending' ? [{ status: r.status, timestamp: r.updatedAt.toISOString(), note: `Status changed to ${r.status}` }] : []),
        ],
        documents: [],
      },
    });
  }));

  app.post('/admin/applications/:id/approve', requireAdmin, asyncRoute(async (req, res) => {
    const r = await prisma.request.findUnique({ where: { id: req.params.id as string } });
    if (!r) return res.status(404).json({ message: 'Application not found' });

    await prisma.request.update({ where: { id: r.id }, data: { status: 'accepted' } });

    // увеличиваем счетчик студентов у препода
    await prisma.supervisor.update({
      where: { id: r.supervisorId },
      data: { currentStudents: { increment: 1 } },
    }).catch(() => { });

    // создаём проект если его ещё нет для этой заявки
    const existingProject = await prisma.project.findUnique({ where: { requestId: r.id } });
    if (!existingProject) {
      await prisma.project.create({
        data: {
          title: `Проект: ${r.studentName}`,
          description: '',
          requestId: r.id,
          studentUserId: r.studentUserId,
          supervisorId: r.supervisorId,
        }
      }).catch(() => { });
    }

    res.json({ success: true, message: 'Application approved successfully' });
  }));

  app.post('/admin/applications/:id/reject', requireAdmin, asyncRoute(async (req, res) => {
    const r = await prisma.request.findUnique({ where: { id: req.params.id as string } });
    if (!r) return res.status(404).json({ message: 'Application not found' });

    await prisma.request.update({ where: { id: r.id }, data: { status: 'rejected' } });

    res.json({ success: true, message: 'Application rejected' });
  }));

  // департаменты
  app.get('/admin/departments', requireAdmin, asyncRoute(async (_req, res) => {
    const supervisors = await prisma.supervisor.findMany();
    const students = await prisma.user.findMany({ where: { role: 'student' } });
    const requests = await prisma.request.findMany({ where: { status: 'accepted' } });

    const deptMap = new Map<string, { supervisors: number; students: number; projects: number }>();

    for (const s of supervisors) {
      const d = deptMap.get(s.department) || { supervisors: 0, students: 0, projects: 0 };
      d.supervisors++;
      d.projects += s.currentStudents;
      deptMap.set(s.department, d);
    }

    for (const st of students) {
      const d = deptMap.get(st.department) || { supervisors: 0, students: 0, projects: 0 };
      d.students++;
      deptMap.set(st.department, d);
    }

    const colors = ['#6366f1', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#f43f5e', '#14b8a6'];
    const departments = Array.from(deptMap.entries()).map(([name, data], i) => ({
      id: `dept-${i + 1}`,
      name,
      head: 'Department Head',
      totalSupervisors: data.supervisors,
      totalStudents: data.students,
      activeProjects: data.projects,
      color: colors[i % colors.length],
    }));

    res.json({ data: departments });
  }));

  app.post('/admin/departments', requireAdmin, asyncRoute(async (_req, res) => {
    res.json({ success: true, message: 'Department concept noted' });
  }));

  app.patch('/admin/departments/:id', requireAdmin, asyncRoute(async (_req, res) => {
    res.json({ success: true, message: 'Department updated' });
  }));

  // аналитика
  app.get('/admin/analytics', requireAdmin, asyncRoute(async (_req, res) => {
    const totalStudents = await prisma.user.count({ where: { role: 'student' } });
    const totalSupervisors = await prisma.supervisor.count();
    const totalRequests = await prisma.request.count();
    const acceptedRequests = await prisma.request.count({ where: { status: 'accepted' } });
    const rejectedRequests = await prisma.request.count({ where: { status: 'rejected' } });
    const pendingRequests = await prisma.request.count({ where: { status: 'pending' } });

    const supervisors = await prisma.supervisor.findMany();
    const students = await prisma.user.findMany({ where: { role: 'student' } });

    // распределение по департаментам
    const deptCounts = new Map<string, number>();
    for (const s of students) {
      deptCounts.set(s.department, (deptCounts.get(s.department) || 0) + 1);
    }
    const totalForDept = students.length || 1;
    const departmentDistribution = Array.from(deptCounts.entries()).map(([dept, count]) => ({
      department: dept,
      count,
      percentage: parseFloat(((count / totalForDept) * 100).toFixed(1)),
    }));

    // загрузка преподов
    const supervisorLoad = supervisors.map(s => ({
      name: s.name.length > 15 ? s.name.substring(0, 12) + '...' : s.name,
      load: s.capacity > 0 ? parseFloat(((s.currentStudents / s.capacity) * 100).toFixed(1)) : 0,
      capacity: s.capacity,
    }));

    const approvalRate = totalRequests > 0 ? ((acceptedRequests / totalRequests) * 100).toFixed(1) : '0';

    res.json({
      data: {
        monthlyApplications: [
          { month: 'Total', applications: totalRequests, approved: acceptedRequests, rejected: rejectedRequests },
        ],
        departmentDistribution,
        supervisorLoad,
        weeklyMetrics: {
          newStudents: totalStudents,
          completedMatches: acceptedRequests,
          avgResponseTime: 'N/A',
          satisfactionScore: 0,
        },
        summary: {
          totalApplications: totalRequests,
          approvalRate: approvalRate + '%',
          activeUsers: totalStudents + totalSupervisors,
          pendingReview: pendingRequests,
        },
      },
    });
  }));

  // уведы
  app.get('/admin/notifications', requireAdmin, asyncRoute(async (_req, res) => {
    const recentRequests = await prisma.request.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 15,
      include: { supervisor: true },
    });

    const notifications = recentRequests.map((r, i) => ({
      id: `notif-${r.id}`,
      title: r.status === 'pending' ? 'New Application Received' :
        r.status === 'accepted' ? 'Application Approved' :
          r.status === 'rejected' ? 'Application Rejected' : 'Application Updated',
      message: `${r.studentName} — ${r.supervisor?.name || 'Unknown supervisor'}: ${r.message.substring(0, 80)}`,
      type: r.status === 'pending' ? 'application' :
        r.status === 'accepted' ? 'success' :
          r.status === 'rejected' ? 'error' : 'info',
      read: i >= 3, // первые 3 не прочитаны
      timestamp: r.updatedAt.toISOString(),
    }));

    res.json({ data: notifications });
  }));

  app.post('/admin/notifications/:id/read', requireAdmin, asyncRoute(async (_req, res) => {
    res.json({ success: true });
  }));

  app.post('/admin/notifications/read-all', requireAdmin, asyncRoute(async (_req, res) => {
    res.json({ success: true });
  }));

}
