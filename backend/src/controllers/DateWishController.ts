import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as DateWishService from '../services/DateWishService';
import type { AuthRequest } from '../middleware/auth';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await DateWishService.list(req.user!.coupleId));
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const wish = await DateWishService.create(req.user!.coupleId, req.user!.userId, req.body);
  res.status(201).json(wish);
});

export const update = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  res.json(await DateWishService.update(req.params.id, req.user!.coupleId, req.body));
});

export const markDone = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  res.json(await DateWishService.markDone(req.params.id, req.user!.coupleId, req.body));
});

export const remove = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  await DateWishService.remove(req.params.id, req.user!.coupleId);
  res.status(204).send();
});
