import type { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as CoupleService from '../services/CoupleService';
import type { AuthRequest } from '../middleware/auth';

export const getCouple = asyncHandler(async (req: AuthRequest, res: Response) => {
  const couple = await CoupleService.getCouple(req.user!.coupleId);
  res.json(couple);
});

export const update = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, anniversaryDate } = req.body;
  const couple = await CoupleService.update(req.user!.coupleId, name, anniversaryDate);
  res.json(couple);
});

export const generateInvite = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await CoupleService.generateInvite(req.user!.coupleId);
  res.json(result);
});
