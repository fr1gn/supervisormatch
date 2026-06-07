// Общая доменная логика: вместимость супервайзера и участники проекта.
// Источник правды — реальные принятые заявки и подтверждённые участники команд,
// а НЕ хранимые счётчики. Это устраняет дрейф currentStudents и рассинхрон доступа.
import { prisma } from './prisma';

type RequestLike = {
  id?: string;
  applicationType?: string | null;
  teamId?: string | null;
  studentUserId?: string;
};

// сколько слотов занимает заявка: ОДНА заявка (команда или одиночка) = 1 слот,
// независимо от числа участников команды
export async function getRequestSeatCount(_request: RequestLike): Promise<number> {
  return 1;
}

// авторитетная загрузка супервайзера: число ПРИНЯТЫХ заявок (1 заявка = 1 слот)
export async function computeSupervisorLoad(supervisorId: string): Promise<number> {
  return prisma.request.count({
    where: { supervisorId, status: 'accepted' },
  });
}

// пересчитываем и сохраняем currentStudents из источника правды.
// зажимаем в [0, capacity] — значение никогда не превышает максимум.
export async function recountSupervisor(supervisorId: string): Promise<number> {
  const supervisor = await prisma.supervisor.findUnique({
    where: { id: supervisorId },
    select: { capacity: true, currentStudents: true },
  });
  if (!supervisor) return 0;
  const load = await computeSupervisorLoad(supervisorId);
  const clamped = Math.max(0, Math.min(load, supervisor.capacity));
  if (clamped !== supervisor.currentStudents) {
    await prisma.supervisor
      .update({ where: { id: supervisorId }, data: { currentStudents: clamped } })
      .catch(() => {});
  }
  return clamped;
}

// userId всех участников проекта: автор/лидер + подтверждённые члены команды
export async function getProjectParticipantIds(project: {
  studentUserId: string;
  requestId: string;
}): Promise<string[]> {
  const ids = new Set<string>([project.studentUserId]);
  const request = await prisma.request.findUnique({
    where: { id: project.requestId },
    select: { applicationType: true, teamId: true },
  });
  if (request?.applicationType === 'team' && request.teamId) {
    const members = await prisma.teamMember.findMany({
      where: { teamId: request.teamId, status: 'accepted' },
      select: { userId: true },
    });
    members.forEach((m) => ids.add(m.userId));
  }
  return [...ids];
}

// участники проекта в виде объектов для отображения
export async function getProjectParticipants(project: {
  studentUserId: string;
  requestId: string;
}): Promise<Array<{ userId: string; fullName: string; avatar: string | null; role: string }>> {
  const request = await prisma.request.findUnique({
    where: { id: project.requestId },
    select: { applicationType: true, teamId: true },
  });

  if (request?.applicationType === 'team' && request.teamId) {
    const members = await prisma.teamMember.findMany({
      where: { teamId: request.teamId, status: 'accepted' },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map((m) => ({
      userId: m.userId,
      fullName: m.user?.fullName || '',
      avatar: m.user?.avatar || null,
      role: m.role === 'leader' ? 'leader' : 'member',
    }));
  }

  const student = await prisma.user.findUnique({
    where: { id: project.studentUserId },
    select: { fullName: true, avatar: true },
  });
  return [
    {
      userId: project.studentUserId,
      fullName: student?.fullName || '',
      avatar: student?.avatar || null,
      role: 'student',
    },
  ];
}

// может ли пользователь видеть/трогать проект (студент-участник или супервайзер проекта)
export async function userCanAccessProject(
  project: { studentUserId: string; requestId: string; supervisor: { userId: string } },
  userId: string,
): Promise<boolean> {
  if (project.supervisor.userId === userId) return true;
  if (project.studentUserId === userId) return true;
  const participantIds = await getProjectParticipantIds(project);
  return participantIds.includes(userId);
}

// студенты, которые уже «заняты» и не должны показываться в Find Teammates
export async function getCommittedStudentIds(): Promise<Set<string>> {
  const ids = new Set<string>();

  // 1) приняли приглашение и вступили в чью-то команду (role member, status accepted)
  const joined = await prisma.teamMember.findMany({
    where: { status: 'accepted', role: 'member' },
    select: { userId: true },
  });
  joined.forEach((m) => ids.add(m.userId));

  // 2) любой подтверждённый участник команды, у которой уже есть принятая заявка (включая лидера)
  const acceptedTeamReqs = await prisma.request.findMany({
    where: { status: 'accepted', teamId: { not: null } },
    select: { teamId: true },
  });
  const teamIds = acceptedTeamReqs.map((r) => r.teamId!).filter(Boolean);
  if (teamIds.length) {
    const committed = await prisma.teamMember.findMany({
      where: { teamId: { in: teamIds }, status: 'accepted' },
      select: { userId: true },
    });
    committed.forEach((m) => ids.add(m.userId));
  }

  // 3) студенты с принятой индивидуальной заявкой (у них уже есть супервайзер)
  const indivAccepted = await prisma.request.findMany({
    where: { status: 'accepted', applicationType: 'individual' },
    select: { studentUserId: true },
  });
  indivAccepted.forEach((r) => ids.add(r.studentUserId));

  return ids;
}

// уже ли назначены этот студент/команда другому супервайзеру (для блокировки повторного принятия)
export async function findExistingAssignment(
  request: { id: string; studentUserId: string; teamId?: string | null },
): Promise<string | null> {
  if (request.teamId) {
    const otherTeam = await prisma.request.findFirst({
      where: { teamId: request.teamId, status: 'accepted', id: { not: request.id } },
    });
    if (otherTeam) return 'This team has already been accepted by a supervisor.';
  }
  const otherStudent = await prisma.request.findFirst({
    where: { studentUserId: request.studentUserId, status: 'accepted', id: { not: request.id } },
  });
  if (otherStudent) return 'This student has already been accepted by a supervisor.';
  return null;
}

// ==================== TOPIC LAYER ====================

// сколько у супервайзера АКТИВНЫХ тем (не архивных и не завершённых).
// именно это число ограничено вместимостью супервайзера.
export async function countActiveTopics(supervisorId: string): Promise<number> {
  return prisma.topic.count({
    where: { supervisorId, archived: false, status: { not: 'Completed' } },
  });
}

// проверяем, что супервайзер может создать ещё одну активную тему.
// бросаем ошибку, если лимит (= capacity) исчерпан.
export async function assertTopicCapacity(supervisor: {
  id: string;
  capacity: number;
}): Promise<void> {
  const active = await countActiveTopics(supervisor.id);
  if (active >= supervisor.capacity) {
    const err = new Error(
      `Active topic limit reached (${active}/${supervisor.capacity}). Archive or complete a topic before adding a new one.`,
    ) as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }
}

// связываем тему с проектом заявки. центральная точка topic-assignment:
//  - проверяет эксклюзивность темы (одна тема = один активный проект)
//  - записывает снимок темы в проект (topicTitle / topicDescription)
//  - переводит тему в статус Assigned
// требует, чтобы проект для заявки уже существовал (создаётся при принятии).
export async function assignTopicToRequest(params: {
  supervisorId: string;
  requestId: string;
  topicId: string;
}): Promise<any> {
  const { supervisorId, requestId, topicId } = params;

  const project = await prisma.project.findUnique({ where: { requestId } });
  if (!project) {
    const err = new Error('No project exists for this request yet. Accept the request first.') as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) {
    const err = new Error('Topic not found.') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  if (topic.supervisorId !== supervisorId) {
    const err = new Error('You can only assign your own topics.') as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  // #7 — тема не может принадлежать двум активным проектам одновременно
  const conflicting = await prisma.project.findFirst({
    where: { topicId, status: 'active', id: { not: project.id } },
  });
  if (conflicting) {
    const err = new Error('This topic is already assigned to another active project.') as Error & { statusCode: number };
    err.statusCode = 409;
    throw err;
  }

  // если у проекта раньше была другая тема — освобождаем её
  if (project.topicId && project.topicId !== topicId) {
    await prisma.topic
      .update({ where: { id: project.topicId }, data: { status: 'Available' } })
      .catch(() => {});
  }

  const updatedProject = await prisma.project.update({
    where: { id: project.id },
    data: {
      topicId: topic.id,
      topicTitle: topic.title,
      topicDescription: topic.description,
    },
  });

  await prisma.topic.update({ where: { id: topic.id }, data: { status: 'Assigned' } });

  return updatedProject;
}

// после принятия — гасим конкурирующие заявки того же студента/команды
export async function invalidateCompetingRequests(
  request: { id: string; studentUserId: string; teamId?: string | null },
): Promise<void> {
  const orConds: Array<Record<string, any>> = [{ studentUserId: request.studentUserId }];
  if (request.teamId) orConds.push({ teamId: request.teamId });
  await prisma.request.updateMany({
    where: {
      id: { not: request.id },
      status: { in: ['pending', 'under review'] },
      OR: orConds,
    },
    data: { status: 'rejected' },
  });
}
