import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as GoalService from '../services/GoalService';
import type { AuthRequest } from '../middleware/auth';

export const backlog = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await GoalService.backlog(req.user!.coupleId));
});

export const listBySprint = asyncHandler(async (req: Request<{ sprintId: string }>, res: Response) => {
  res.json(await GoalService.listBySprint(req.params.sprintId));
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const goal = await GoalService.create(req.user!.coupleId, req.body);
  res.status(201).json(goal);
});

export const createInSprint = asyncHandler(async (req: AuthRequest & Request<{ sprintId: string }>, res: Response) => {
  const goal = await GoalService.create(req.user!.coupleId, req.body, req.params.sprintId);
  res.status(201).json(goal);
});

export const reorder = asyncHandler(async (req: Request, res: Response) => {
  res.json(await GoalService.reorder(req.body));
});

export const update = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  res.json(await GoalService.update(req.params.id, req.body));
});

export const updateStatus = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  res.json(await GoalService.updateStatus(req.params.id, req.body));
});

export const assign = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  res.json(await GoalService.assign(req.params.id, req.body));
});

export const remove = asyncHandler(async (req: Request<{ id: string }>, res: Response) => {
  await GoalService.remove(req.params.id);
  res.json({ message: 'Goal deleted' });
});
