import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as NotificationService from '../services/NotificationService';
import type { AuthRequest } from '../middleware/auth';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const notifications = await NotificationService.list(req.user!.userId);
  res.json(notifications);
});

export const unreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await NotificationService.unreadCount(req.user!.userId);
  res.json(result);
});

export const markAllRead = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await NotificationService.markAllRead(req.user!.userId);
  res.json(result);
});

export const markRead = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  const notification = await NotificationService.markRead(req.params.id);
  res.json(notification);
});

export const remove = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  await NotificationService.remove(req.params.id);
  res.status(204).send();
});
