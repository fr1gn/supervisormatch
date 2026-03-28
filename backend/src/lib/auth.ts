import { createHash, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { NextFunction, Response } from 'express';
import { AuthedRequest, JwtPayload } from './types';

const ACCESS_TOKEN_TTL = '1h';
const REFRESH_TOKEN_TTL = '7d';

export function normalizeEmail(value: string): string {
  return String(value || '').trim().toLowerCase();
}

export function makeId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export function hashValue(raw: string): string {
  const salt = process.env.HASH_SALT || 'supervisormatch-dev-salt';
  return createHash('sha256').update(`${salt}:${String(raw || '')}`).digest('hex');
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

function getBearerToken(authorizationHeader?: string): string | null {
  const raw = String(authorizationHeader || '');
  const [scheme, token] = raw.split(' ');
  if (scheme && scheme.toLowerCase() === 'bearer' && token) {
    return token;
  }
  return null;
}

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
