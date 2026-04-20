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
  res.json({
    ...couple,
    memberCount: couple.users.length,
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
  const { name } = req.body;
  const { inviteCode, ...user } = await CoupleService.createCouple(req.user!.userId, name);
  const accessToken = generateAccessToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);
  res.status(201).json({ ...buildAuthResponse(user, accessToken, refreshToken), inviteCode });
});

export const joinCouple = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { inviteCode } = req.body;
  const { partnerName, ...user } = await CoupleService.joinCouple(req.user!.userId, inviteCode);
  const accessToken = generateAccessToken(user.id, user.coupleId);
  const refreshToken = await createRefreshToken(user.id);
  res.json({ ...buildAuthResponse(user, accessToken, refreshToken), partnerName });
});
