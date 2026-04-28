import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as CoupleService from '../services/CoupleService';
import { createRefreshToken, buildAuthResponse } from '../services/AuthService';
import { generateAccessToken } from '../utils/auth';
import type { AuthRequest } from '../middleware/auth';

export const getCouple = asyncHandler(async (req: AuthRequest, res: Response) => {
  const couple = await CoupleService.getCouple(req.user!.coupleId!);
  const userId = req.user!.userId;
  const partner = couple.users.find((u) => u.id !== userId) ?? null;
  // Sprint 68 T464: `paired` is the cleanest flag for the mobile Wait screen
  // poll (T467) — `users.length === 2` lives client-side today and would
  // require shipping the partial `users` array forever. Centralising the
  // boolean here lets future BE changes (e.g. multi-couple) tweak the rule
  // in one place.
  res.json({
    ...couple,
    memberCount: couple.users.length,
    paired: couple.users.length === 2,
    partner: partner ? { name: partner.name, avatar: partner.avatar } : null,
  });
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, anniversaryDate, color } = req.body;
  const couple = await CoupleService.update(
    req.user!.coupleId!,
    name,
    anniversaryDate,
    color,
  );
  res.json(couple);
});

export const generateInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await CoupleService.generateInvite(req.user!.coupleId!);
  res.json(result);
});

export const getMyInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await CoupleService.getMyInvite(req.user!.userId);
  res.json(result);
});

export const validateInvite = asyncHandler(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).json({ valid: false, error: 'Missing invite code' });
    return;
  }
  const result = await CoupleService.validateInvite(code);
  res.json(result);
});

export const createCouple = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Sprint 68 T462: atomic create with name + anniversaryDate + slogan. The
  // service runs all three writes in one $transaction; we still re-issue
  // access/refresh tokens here because the user's coupleId just changed and
  // the old JWT carries `coupleId: null`. Without rotation the next request
  // 401s — see memory `bugs_refresh_token_rotation` (Sprint 63 T403).
  const { name, anniversaryDate, slogan } = req.body as {
    name: string;
    anniversaryDate?: string | null;
    slogan?: string | null;
  };
  const { user, couple } = await CoupleService.createCouple(req.user!.userId, {
    name,
    anniversaryDate,
    slogan,
  });
  const accessToken = generateAccessToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);

  const baseUrl = process.env.APP_URL || 'https://memoura.app';
  const inviteUrl = couple.inviteCode ? `${baseUrl}/join/${couple.inviteCode}` : null;

  res.status(201).json({
    ...buildAuthResponse(user, accessToken, refreshToken),
    couple,
    inviteUrl,
    // Legacy field kept for callers that still read top-level `inviteCode`.
    inviteCode: couple.inviteCode,
  });
});

export const joinCouple = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { inviteCode } = req.body;
  const { partnerName, ...user } = await CoupleService.joinCouple(req.user!.userId, inviteCode);
  const accessToken = generateAccessToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);
  res.json({ ...buildAuthResponse(user, accessToken, refreshToken), partnerName });
});
