import jwt from 'jsonwebtoken';
import { requireJwtSecret } from './security-policy';

const JWT_SECRET = requireJwtSecret(process.env);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.userId !== 'string' ||
        typeof payload.email !== 'string' || typeof payload.role !== 'string') return null;
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}
