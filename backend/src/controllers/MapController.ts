import type { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as MapService from '../services/MapService';
import type { AuthRequest } from '../middleware/auth';

export const getPins = asyncHandler(async (req: AuthRequest, res: Response) => {
  const pins = await MapService.getPins(req.user!.coupleId!);
  res.json(pins);
});
