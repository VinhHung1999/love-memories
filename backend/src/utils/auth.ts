import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'memoura-jwt-secret-2026';
const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Legacy 30-day token — no longer issued by API, kept for test utilities and
 *  backward compat (old clients' already-issued tokens still accepted by middleware) */
export function generateToken(userId: string, coupleId: string): string {
  return jwt.sign({ userId, coupleId }, JWT_SECRET, { expiresIn: '30d' });
}

/** Short-lived access token (15 min) */
export function generateAccessToken(userId: string, coupleId: string | null): string {
  return jwt.sign({ userId, coupleId, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });
}

/** Cryptographically random refresh token value */
export function generateRefreshTokenValue(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function verifyToken(token: string): { userId: string; coupleId?: string; type?: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; coupleId?: string; type?: string };
}
