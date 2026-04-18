import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  deleteAccountSchema,
  appleAuthSchema,
  appleCompleteSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authSchemas';
import type { AuthRequest } from '../middleware/auth';
import * as AuthService from '../services/AuthService';
import * as EmailService from '../services/EmailService';

export const register = [
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, inviteCode, coupleName } = req.body as {
      email: string;
      password: string;
      name: string;
      inviteCode?: string;
      coupleName?: string;
    };
    const result = await AuthService.register(email, password, name, inviteCode, coupleName);
    // Auto-send verification email (best-effort — don't fail registration if email fails)
    EmailService.sendVerificationEmail(result.user.id, result.user.email, result.user.name).catch((err) => {
      console.error('[Register] Failed to send verification email:', err.message);
    });
    res.status(201).json(result);
  }),
];

export const login = [
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as { email: string; password: string };
    const result = await AuthService.login(email, password);
    res.json(result);
  }),
];

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { refreshToken?: unknown };
  if (!body.refreshToken || typeof body.refreshToken !== 'string') {
    res.status(400).json({ error: 'refreshToken required' });
    return;
  }
  const result = await AuthService.refresh(body.refreshToken);
  res.json(result);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { refreshToken?: unknown };
  await AuthService.logout(
    (req as AuthRequest).user!.userId,
    typeof body.refreshToken === 'string' ? body.refreshToken : undefined,
  );
  res.json({ ok: true });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.me((req as AuthRequest).user!.userId);
  res.json(user);
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { idToken?: unknown };
  if (!body.idToken || typeof body.idToken !== 'string') {
    res.status(400).json({ error: 'idToken required' });
    return;
  }
  try {
    const result = await AuthService.googleAuth(body.idToken);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid Google')) {
      res.status(401).json({ error: 'Invalid Google token' });
    } else {
      throw err;
    }
  }
});

export const googleComplete = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { idToken?: unknown; inviteCode?: string; coupleName?: string };
  if (!body.idToken || typeof body.idToken !== 'string') {
    res.status(400).json({ error: 'idToken required' });
    return;
  }
  try {
    const result = await AuthService.googleComplete(body.idToken, body.inviteCode, body.coupleName);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid Google')) {
      res.status(401).json({ error: 'Invalid Google token' });
    } else {
      throw err;
    }
  }
});

export const sendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthRequest).user!;
  const user = await AuthService.me(userId);
  await EmailService.sendVerificationEmail(userId, user.email, user.name);
  res.json({ ok: true });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) {
    res.status(400).json({ error: 'token query param required' });
    return;
  }
  await EmailService.verifyEmail(token);
  res.json({ ok: true, emailVerified: true });
});

export const deleteAccount = [
  validate(deleteAccountSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
    const { password } = req.body as { password: string };
    await AuthService.deleteAccount(userId, coupleId, password);
    res.status(204).send();
  }),
];

export const appleAuth = [
  validate(appleAuthSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken, name } = req.body as { idToken: string; name?: string };
    try {
      const result = await AuthService.appleAuth(idToken, name);
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Invalid Apple')) {
        res.status(401).json({ error: 'Invalid Apple token' });
      } else {
        throw err;
      }
    }
  }),
];

export const appleComplete = [
  validate(appleCompleteSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken, name, inviteCode, coupleName } = req.body as {
      idToken: string;
      name?: string;
      inviteCode?: string;
      coupleName?: string;
    };
    try {
      const result = await AuthService.appleComplete(idToken, inviteCode, coupleName, name);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof Error && err.message.includes('Invalid Apple')) {
        res.status(401).json({ error: 'Invalid Apple token' });
      } else {
        throw err;
      }
    }
  }),
];

export const forgotPassword = [
  validate(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };
    // Always 200 — never reveal whether the email is registered (or rate-limited).
    try {
      await AuthService.forgotPassword(email);
    } catch (err) {
      console.error('[ForgotPassword] suppressed error:', (err as Error).message);
    }
    res.json({ ok: true });
  }),
];

export const resetPassword = [
  validate(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    await AuthService.resetPassword(token, newPassword);
    res.json({ ok: true });
  }),
];

export const googleLink = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { idToken?: unknown };
  if (!body.idToken || typeof body.idToken !== 'string') {
    res.status(400).json({ error: 'idToken required' });
    return;
  }
  try {
    const result = await AuthService.googleLink((req as AuthRequest).user!.userId, body.idToken);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Invalid Google')) {
      res.status(401).json({ error: 'Invalid Google token' });
    } else {
      throw err;
    }
  }
});
