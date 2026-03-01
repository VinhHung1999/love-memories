import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { OAuth2Client } from 'google-auth-library';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword, generateToken, generateAccessToken, generateRefreshTokenValue } from '../utils/auth';
import { requireAuth, AuthRequest } from '../middleware/auth';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  inviteCode: z.string().optional(),
  coupleName: z.string().optional(),
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
    const { email, password, name, inviteCode, coupleName } = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    if (!inviteCode && !coupleName) {
      res.status(400).json({ error: 'Must either create a new couple (coupleName) or join one (inviteCode)' });
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
      couple = await prisma.couple.create({ data: { name: coupleName!.trim() } });
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
    if (!user.password) {
      res.status(401).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' });
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
      select: { id: true, email: true, name: true, avatar: true, coupleId: true, googleId: true, createdAt: true },
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

// ── Google OAuth helpers ──────────────────────────────────────────────────────

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

async function verifyGoogleToken(idToken: string): Promise<GoogleProfile> {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new Error('Invalid Google token');
    }
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || '',
    };
  } catch (err) {
    throw new Error('Invalid Google token');
  }
}

function buildAuthResponse(user: { id: string; email: string; name: string; avatar: string | null; coupleId: string; googleId: string | null }, accessToken: string, legacyToken: string, refreshToken: string) {
  return {
    token: legacyToken,
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, coupleId: user.coupleId, googleId: user.googleId },
  };
}

// POST /api/auth/google — verify Google ID token, auto-link or return needsCouple
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
      res.status(400).json({ error: 'idToken required' });
      return;
    }

    const profile = await verifyGoogleToken(idToken);

    // 1. Look up by googleId
    let user = await prisma.user.findUnique({ where: { googleId: profile.googleId } });

    // 2. Auto-link by email match
    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email: profile.email } });
      if (byEmail) {
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: {
            googleId: profile.googleId,
            avatar: byEmail.avatar ?? (profile.picture || null),
          },
        });
      }
    }

    // 3. No user found — new Google user needs couple setup
    if (!user) {
      res.json({ needsCouple: true, googleProfile: profile });
      return;
    }

    const accessToken = generateAccessToken(user.id, user.coupleId);
    const legacyToken = generateToken(user.id, user.coupleId);
    const refreshToken = await createRefreshToken(user.id);

    res.json(buildAuthResponse(user, accessToken, legacyToken, refreshToken));
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid Google')) {
      res.status(401).json({ error: 'Invalid Google token' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// POST /api/auth/google/complete — new Google user sets up couple
router.post('/google/complete', async (req: Request, res: Response) => {
  try {
    const { idToken, inviteCode, coupleName } = req.body;
    if (!idToken || typeof idToken !== 'string') {
      res.status(400).json({ error: 'idToken required' });
      return;
    }
    if (!inviteCode && !coupleName) {
      res.status(400).json({ error: 'Must either create a new couple (coupleName) or join one (inviteCode)' });
      return;
    }

    const profile = await verifyGoogleToken(idToken);

    // Guard: don't create duplicate
    const existing = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
    });
    if (existing) {
      res.status(409).json({ error: 'Account already exists. Please use the Google login button.' });
      return;
    }

    let couple;
    if (inviteCode) {
      couple = await prisma.couple.findUnique({ where: { inviteCode } });
      if (!couple) {
        res.status(400).json({ error: 'Invalid invite code' });
        return;
      }
    } else {
      couple = await prisma.couple.create({ data: { name: coupleName.trim() } });
    }

    const user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatar: profile.picture || null,
        googleId: profile.googleId,
        password: null,
        coupleId: couple.id,
      },
    });

    const accessToken = generateAccessToken(user.id, user.coupleId);
    const legacyToken = generateToken(user.id, user.coupleId);
    const refreshToken = await createRefreshToken(user.id);

    res.status(201).json(buildAuthResponse(user, accessToken, legacyToken, refreshToken));
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid Google')) {
      res.status(401).json({ error: 'Invalid Google token' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// POST /api/auth/google/link — logged-in user links their Google account
router.post('/google/link', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken || typeof idToken !== 'string') {
      res.status(400).json({ error: 'idToken required' });
      return;
    }

    const profile = await verifyGoogleToken(idToken);

    // Check googleId not already used by another user
    const existing = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
    if (existing && existing.id !== req.user!.userId) {
      res.status(409).json({ error: 'This Google account is already linked to another user' });
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { googleId: profile.googleId },
    });

    res.json({ ok: true, googleId: user.googleId });
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid Google')) {
      res.status(401).json({ error: 'Invalid Google token' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

export const authRoutes = router;
