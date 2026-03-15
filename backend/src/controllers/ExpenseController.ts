import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as ExpenseService from '../services/ExpenseService';
import type { AuthRequest } from '../middleware/auth';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { coupleId } = req.user! as { userId: string; coupleId: string };
  const { month, datePlanId } = req.query;
  const expenses = await ExpenseService.list(coupleId, {
    month: typeof month === 'string' ? month : undefined,
    datePlanId: typeof datePlanId === 'string' ? datePlanId : undefined,
  });
  res.json(expenses);
});

export const getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { coupleId } = req.user! as { userId: string; coupleId: string };
  const { month } = req.query;
  const result = await ExpenseService.stats(coupleId, typeof month === 'string' ? month : undefined);
  res.json(result);
});

export const getDailyStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { coupleId } = req.user! as { userId: string; coupleId: string };
  const { month } = req.query;
  const result = await ExpenseService.dailyStats(coupleId, typeof month === 'string' ? month : undefined);
  res.json(result);
});

export const getLimits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { coupleId } = req.user! as { userId: string; coupleId: string };
  const limits = await ExpenseService.getLimits(coupleId);
  res.json(limits);
});

export const setLimits = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { coupleId } = req.user! as { userId: string; coupleId: string };
  const limits = await ExpenseService.setLimits(coupleId, req.body);
  res.json(limits);
});

export const uploadReceipt = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) { res.status(400).json({ error: 'No photo uploaded' }); return; }
  const result = await ExpenseService.uploadReceipt(file);
  res.json(result);
});

export const getOne = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  const { coupleId } = req.user! as { userId: string; coupleId: string };
  const expense = await ExpenseService.getOne(req.params.id, coupleId);
  res.json(expense);
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { coupleId } = req.user! as { userId: string; coupleId: string };
  const expense = await ExpenseService.create(coupleId, req.body);
  res.status(201).json(expense);
});

export const update = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  const { coupleId } = req.user! as { userId: string; coupleId: string };
  const expense = await ExpenseService.update(req.params.id, coupleId, req.body);
  res.json(expense);
});

export const remove = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  const { coupleId } = req.user! as { userId: string; coupleId: string };
  await ExpenseService.remove(req.params.id, coupleId);
  res.json({ message: 'Expense deleted' });
});
