import type { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as AchievementService from '../services/AchievementService';
import type { AuthRequest } from '../middleware/auth';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const achievements = await AchievementService.list(req.user!.coupleId, req.user!.userId);
  res.json(achievements);
});
