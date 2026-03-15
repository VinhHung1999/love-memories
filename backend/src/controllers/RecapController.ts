import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import type { AuthRequest } from '../middleware/auth';
import * as RecapService from '../services/RecapService';
export const weekly = asyncHandler(async (req: Request, res: Response) => {
  const weekStr = req.query.week as string | undefined;

  if (weekStr) {
    try {
      RecapService.weekToRange(weekStr);
    } catch {
      res.status(400).json({ error: 'Invalid week format. Use YYYY-Www (e.g. 2026-W09)' });
      return;
    }
  }

  const { userId, coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  try {
    const data = await RecapService.getWeekly(weekStr, userId, coupleId);
    res.json(data);
  } catch (err) {
    console.error('[recap] weekly error:', err);
    throw err;
  }
});

export const monthly = asyncHandler(async (req: Request, res: Response) => {
  const monthStr = req.query.month as string | undefined;

  if (monthStr) {
    try {
      RecapService.monthToRange(monthStr);
    } catch {
      res.status(400).json({ error: 'Invalid month format. Use YYYY-MM (e.g. 2026-02)' });
      return;
    }
  }

  const { userId, coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  try {
    const data = await RecapService.getMonthly(monthStr, userId, coupleId);
    res.json(data);
  } catch (err) {
    console.error('[recap] monthly error:', err);
    throw err;
  }
});

export const monthlyCaption = asyncHandler(async (req: Request, res: Response) => {
  const monthStr = req.query.month as string | undefined;
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  try {
    const data = await RecapService.getMonthlyCaption(monthStr, coupleId);
    res.json(data);
  } catch (err) {
    console.error('[recap] caption error:', err);
    res.json({ intro: null, outro: null });
  }
});
