import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword, generateToken, generateAccessToken, generateRefreshTokenValue } from '../utils/auth';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  inviteCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const REFRESH_TOKEN_EXPIRY_DAYS = 30;

async function createRefreshToken(userId: string) {
  const tokenValue = generateRefreshTokenValue();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, token: tokenValue, expiresAt },
  });
  return tokenValue;
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, inviteCode } = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    const hashed = await hashPassword(password);

    let couple;
    if (inviteCode) {
      couple = await prisma.couple.findUnique({ where: { inviteCode } });
      if (!couple) {
        res.status(400).json({ error: 'Invalid invite code' });
        return;
      }
    } else {
      couple = await prisma.couple.findFirst();
      if (!couple) {
        couple = await prisma.couple.create({ data: { name: 'Love Scrum' } });
      }
    }

    const user = await prisma.user.create({
      data: { email, password: hashed, name, coupleId: couple.id },
    });

    const accessToken = generateAccessToken(user.id, user.coupleId);
    const legacyToken = generateToken(user.id, user.coupleId);
    const refreshToken = await createRefreshToken(user.id);

    res.status(201).json({
      token: legacyToken,
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, coupleId: user.coupleId },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const valid = await comparePassword(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const accessToken = generateAccessToken(user.id, user.coupleId);
    const legacyToken = generateToken(user.id, user.coupleId);
    const refreshToken = await createRefreshToken(user.id);

    res.json({
      token: legacyToken,
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, coupleId: user.coupleId },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0]?.message || 'Invalid input' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// POST /api/auth/refresh — exchange refresh token for new token pair
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string') {
      res.status(400).json({ error: 'refreshToken required' });
      return;
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { id: true, coupleId: true, email: true, name: true } } },
    });

    if (!stored || stored.revokedAt) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    if (stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Refresh token expired' });
      return;
    }

    // Rotate: revoke old, create new
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const newAccessToken = generateAccessToken(stored.user.id, stored.user.coupleId);
    const newLegacyToken = generateToken(stored.user.id, stored.user.coupleId);
    const newRefreshToken = await createRefreshToken(stored.user.id);

    res.json({
      token: newLegacyToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: { id: stored.user.id, email: stored.user.email, name: stored.user.name, coupleId: stored.user.coupleId },
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout — revoke refresh token
router.post('/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken && typeof refreshToken === 'string') {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId: req.user!.userId },
        data: { revokedAt: new Date() },
      });
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, avatar: true, coupleId: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export const authRoutes = router;
