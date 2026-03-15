import type { Request, Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import {
  createCookingSessionSchema,
  updateCookingSessionStatusSchema,
  toggleCookingItemSchema,
  toggleCookingStepSchema,
  ratingSchema,
} from '../validators/cookingSessionSchemas';
import type { AuthRequest } from '../middleware/auth';
import * as CookingSessionService from '../services/CookingSessionService';
import { AppError } from '../types/errors';

type IdParam = { id: string };
type ItemParam = { id: string; itemId: string };
type StepParam = { id: string; stepId: string };

export const getActive = asyncHandler(async (req: Request, res: Response) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  const session = await CookingSessionService.getActive(coupleId);
  res.json(session ?? null);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  const sessions = await CookingSessionService.list(coupleId);
  res.json(sessions);
});

export const getOne = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  const session = await CookingSessionService.getOne(req.params.id, coupleId);
  res.json(session);
});

export const create = [
  validate(createCookingSessionSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { recipeIds } = req.body as { recipeIds: string[] };
    const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
    try {
      const session = await CookingSessionService.create(coupleId, recipeIds);
      res.status(201).json(session);
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 409) {
        // re-throw with sessionId in body — special case for 409
        const existing = await import('../utils/prisma').then((m) =>
          m.default.cookingSession.findFirst({
            where: { coupleId, status: { not: 'completed' } },
          }),
        );
        res.status(409).json({ error: err.message, sessionId: existing?.id });
        return;
      }
      throw err;
    }
  }),
];

export const updateStatus = [
  validate(updateCookingSessionStatusSchema),
  asyncHandler<IdParam>(async (req, res) => {
    const { userId, coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
    const session = await CookingSessionService.updateStatus(req.params.id, coupleId, req.body as { status: string; notes?: string }, userId);
    res.json(session);
  }),
];

export const toggleItem = [
  validate(toggleCookingItemSchema),
  asyncHandler(
    async (req: Request<ItemParam & ParamsDictionary>, res: Response) => {
      const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
      const { checked } = req.body as { checked: boolean };
      const item = await CookingSessionService.toggleItem(req.params.itemId, checked, coupleId);
      res.json(item);
    },
  ),
];

export const toggleStep = [
  validate(toggleCookingStepSchema),
  asyncHandler(
    async (req: Request<StepParam & ParamsDictionary>, res: Response) => {
      const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
      const { checked, checkedBy } = req.body as { checked: boolean; checkedBy?: string };
      const step = await CookingSessionService.toggleStep(req.params.stepId, checked, coupleId, checkedBy);
      res.json(step);
    },
  ),
];

export const uploadPhotos = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  const files = req.files as Express.Multer.File[];
  const photos = await CookingSessionService.uploadPhotos(req.params.id, coupleId, files);
  res.status(201).json(photos);
});

export const rate = [
  validate(ratingSchema),
  asyncHandler<IdParam>(async (req, res) => {
    const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
    const { rating } = req.body as { rating: number };
    const session = await CookingSessionService.rate(req.params.id, coupleId, rating);
    res.json(session);
  }),
];

export const remove = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  await CookingSessionService.remove(req.params.id, coupleId);
  res.json({ message: 'Session deleted' });
});
