import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as SprintService from '../services/SprintService';
import type { AuthRequest } from '../middleware/auth';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await SprintService.list(req.user!.coupleId));
});

export const getActive = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await SprintService.getActive(req.user!.coupleId));
});

export const getOne = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  res.json(await SprintService.getOne(req.params.id, req.user!.coupleId));
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const sprint = await SprintService.create(req.user!.coupleId, req.body);
  res.status(201).json(sprint);
});

export const update = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  res.json(await SprintService.update(req.params.id, req.user!.coupleId, req.body));
});

export const updateStatus = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  res.json(await SprintService.updateStatus(req.params.id, req.user!.coupleId, req.body));
});

export const remove = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  await SprintService.remove(req.params.id, req.user!.coupleId);
  res.json({ message: 'Sprint deleted' });
});
