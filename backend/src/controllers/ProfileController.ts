import type { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as ProfileService from '../services/ProfileService';
import type { AuthRequest } from '../middleware/auth';

export const updateName = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await ProfileService.updateName(req.user!.userId, req.body.name);
  res.json(user);
});

export const uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const user = await ProfileService.updateAvatar(req.user!.userId, req.file);
  res.json(user);
});

export const stats = asyncHandler(async (req: AuthRequest, res: Response) => {
  // requireCouple at route level guarantees coupleId is set.
  const stats = await ProfileService.getStats(req.user!.coupleId!);
  res.json(stats);
});
