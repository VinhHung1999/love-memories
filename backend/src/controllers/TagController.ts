import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as TagService from '../services/TagService';
import type { AuthRequest } from '../middleware/auth';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const tags = await TagService.list(req.user!.coupleId);
  res.json(tags);
});

export const upsert = asyncHandler(async (req: AuthRequest & Request<{ name: string }>, res: Response) => {
  const { icon, color } = req.body as { icon?: string; color?: string };
  const tag = await TagService.upsert(req.user!.coupleId, req.params.name, icon, color);
  res.json(tag);
});
