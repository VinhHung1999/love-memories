import type { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as ProfileService from '../services/ProfileService';
import type { AuthRequest } from '../middleware/auth';

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Sprint 68 T471: validate(updateProfileSchema) at the route narrows req.body
  // to { name?, color? }. Service tolerates either being absent.
  const { name, color } = req.body as { name?: string; color?: string | null };
  const user = await ProfileService.updateProfile(req.user!.userId, { name, color });
  res.json(user);
});

// Kept as a named export so route file stays diff-minimal during the rename.
export const updateName = updateProfile;

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
