import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as DailyQuestionService from '../services/DailyQuestionService';
import type { AuthRequest } from '../middleware/auth';
import { historyQuerySchema } from '../validators/dailyQuestionSchemas';

export const getToday = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, coupleId } = req.user! as { userId: string; coupleId: string };
  const result = await DailyQuestionService.getToday(coupleId, userId);
  res.json(result);
});

export const submitAnswer = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  const { userId, coupleId } = req.user! as { userId: string; coupleId: string };
  const { id: questionId } = req.params;
  const { answer } = req.body as { answer: string };
  const result = await DailyQuestionService.submitAnswer(questionId, coupleId, userId, answer);
  res.status(201).json(result);
});

export const getStreak = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { coupleId } = req.user! as { userId: string; coupleId: string };
  const result = await DailyQuestionService.getStreak(coupleId);
  res.json(result);
});

export const getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, coupleId } = req.user! as { userId: string; coupleId: string };
  const parsed = historyQuerySchema.safeParse(req.query);
  const { page, limit } = parsed.success ? parsed.data : { page: 1, limit: 20 };
  const result = await DailyQuestionService.getHistory(coupleId, userId, page, limit);
  res.json(result);
});
