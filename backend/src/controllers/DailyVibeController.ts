import type { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as DailyVibeService from '../services/DailyVibeService';
import type { AuthRequest } from '../middleware/auth';

export const getToday = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { coupleId } = req.user! as { coupleId: string };
  const result = await DailyVibeService.getTodayVibe(coupleId);
  res.json(result);
});

export const setToday = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, coupleId } = req.user! as { userId: string; coupleId: string };
  const { vibeKey } = req.body as { vibeKey: string };
  const result = await DailyVibeService.setTodayVibe(coupleId, userId, vibeKey);
  res.status(200).json(result);
});
