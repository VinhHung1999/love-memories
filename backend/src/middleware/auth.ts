import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import prisma from '../utils/prisma';

export interface AuthRequest extends Request {
  user?: { userId: string; coupleId: string };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    if (payload.coupleId) {
      req.user = { userId: payload.userId, coupleId: payload.coupleId };
    } else {
      // Legacy token without coupleId — DB fallback
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { coupleId: true },
      });
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }
      req.user = { userId: payload.userId, coupleId: user.coupleId };
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
