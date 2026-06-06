import { randomUUID, createHash } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextFunction, Response } from 'express';
import { AuthedRequest, JwtPayload } from './types';

const ACCESS_TOKEN_TTL = '1h';
const REFRESH_TOKEN_TTL = '7d';
const BCRYPT_ROUNDS = 12;

export function normalizeEmail(value: string): string {
  return String(value || '').trim().toLowerCase();
}

export function makeId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

// хешируем пароль через bcrypt — 12 раундов, соль генерится автоматически
export async function hashPassword(raw: string): Promise<string> {
  return bcrypt.hash(String(raw || ''), BCRYPT_ROUNDS);
}

// проверяем пароль, поддерживаем старые sha256 хеши для обратной совместимости
export async function comparePassword(raw: string, hash: string): Promise<boolean> {
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$')) {
    const legacyHash = legacySha256Hash(raw);
    return legacyHash === hash;
  }
  return bcrypt.compare(String(raw || ''), hash);
}

// старый sha256 — оставляем чтобы юзеры со старыми паролями могли залогиниться
function legacySha256Hash(raw: string): string {
  const salt = process.env.HASH_SALT || 'supervisormatch-dev-salt';
  return createHash('sha256').update(`${salt}:${String(raw || '')}`).digest('hex');
}

// sha256 хеш для всяких токенов (НЕ для паролей, для паролей юзаем bcrypt выше)
export function hashValue(raw: string): string {
  return createHash('sha256').update(String(raw || '')).digest('hex');
}

export function signAccessToken(payload: JwtPayload): string {
  const secret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_TTL });
}

export function signRefreshToken(payload: JwtPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
  return jwt.sign(payload, secret, { expiresIn: REFRESH_TOKEN_TTL });
}

export function verifyAccessToken(token: string): JwtPayload {
  const secret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
  return jwt.verify(token, secret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const secret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
  return jwt.verify(token, secret) as JwtPayload;
}

// вытаскиваем токен из заголовка Authorization: Bearer <token>
function getBearerToken(authorizationHeader?: string): string | null {
  const raw = String(authorizationHeader || '');
  const [scheme, token] = raw.split(' ');
  if (scheme && scheme.toLowerCase() === 'bearer' && token) {
    return token;
  }
  return null;
}

// мидлвейр авторизации — без токена не пускаем
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Response | void {
  const token = getBearerToken(req.headers.authorization as string | undefined);
  if (!token) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
}
