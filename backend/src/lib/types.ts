import { Request } from 'express';

export type UserRole = 'student' | 'supervisor';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  email: string;
}

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  refreshTokenHash?: string;
  department: string;
  groupName: string;
  phone: string;
  studyLevel: string;
  interests: string;
  bio: string;
  createdAt: string;
}

export interface TopicRecord {
  id: string;
  title: string;
  area: string;
  description: string;
  status: 'Available' | 'Assigned' | 'Completed';
  archived: boolean;
  createdAt: string;
}

export interface SupervisorRecord {
  id: string;
  userId: string;
  email: string;
  phone: string;
  name: string;
  title: string;
  department: string;
  areas: string[];
  capacity: number;
  currentStudents: number;
  avatar: string;
  bio: string;
  topics: TopicRecord[];
}

export type RequestStatus = 'pending' | 'under review' | 'accepted' | 'rejected';

export interface RequestRecord {
  id: string;
  studentUserId: string;
  studentEmail: string;
  studentName: string;
  supervisorId: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  supervisors: SupervisorRecord[];
  requests: RequestRecord[];
}

export interface AuthedRequest extends Request {
  user?: JwtPayload;
}
