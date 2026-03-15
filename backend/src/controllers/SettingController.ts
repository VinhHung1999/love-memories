import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as SettingService from '../services/SettingService';
import type { AuthRequest } from '../middleware/auth';

type KeyParam = { key: string };

export const getOne = asyncHandler(async (req: AuthRequest & Request<KeyParam>, res: Response) => {
  const result = await SettingService.getOne(req.user!.coupleId!, req.params.key);
  res.json(result);
});

export const upsert = asyncHandler(async (req: AuthRequest & Request<KeyParam>, res: Response) => {
  const { value } = req.body as { value: string };
  const setting = await SettingService.upsert(req.user!.coupleId!, req.params.key, value);
  res.json(setting);
});
