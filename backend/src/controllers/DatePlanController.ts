import type { Response } from 'express';
import type { Request } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import { asyncHandler } from '../middleware/asyncHandler';
import type { AuthRequest } from '../middleware/auth';
import * as DatePlanService from '../services/DatePlanService';

type IdParam = { id: string };
type PlanStopParam = { id: string; stopId: string };
type PlanSpotParam = { id: string; stopId: string; spotId: string };

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { coupleId } = (req as AuthRequest).user!;
  const plans = await DatePlanService.list(coupleId);
  res.json(plans);
});

export const getOne = asyncHandler<IdParam>(async (req, res) => {
  const plan = await DatePlanService.getOne(req.params.id);
  res.json(plan);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { userId, coupleId } = (req as AuthRequest).user!;
  const plan = await DatePlanService.create(coupleId, userId, req.body);
  res.status(201).json(plan);
});

export const update = asyncHandler<IdParam>(async (req, res) => {
  const plan = await DatePlanService.update(req.params.id, req.body as Parameters<typeof DatePlanService.update>[1]);
  res.json(plan);
});

export const updateStatus = asyncHandler<IdParam>(async (req, res) => {
  const { status } = req.body as { status: string };
  const plan = await DatePlanService.updateStatus(req.params.id, status);
  res.json(plan);
});

export const linkMoment = asyncHandler(
  async (req: Request<PlanStopParam & ParamsDictionary>, res: Response) => {
    const { momentId } = req.body as { momentId: string | null };
    const stop = await DatePlanService.linkMoment(req.params.stopId, momentId);
    res.json(stop);
  },
);

export const linkFoodSpot = asyncHandler(
  async (req: Request<PlanStopParam & ParamsDictionary>, res: Response) => {
    const { foodSpotId } = req.body as { foodSpotId: string | null };
    const stop = await DatePlanService.linkFoodSpot(req.params.stopId, foodSpotId);
    res.json(stop);
  },
);

export const updateStopCost = asyncHandler(
  async (req: Request<PlanStopParam & ParamsDictionary>, res: Response) => {
    const { cost } = req.body as { cost: number | null };
    const stop = await DatePlanService.updateStopCost(req.params.stopId, cost);
    res.json(stop);
  },
);

export const markStopDone = asyncHandler(
  async (req: Request<PlanStopParam & ParamsDictionary>, res: Response) => {
    const plan = await DatePlanService.markStopDone(req.params.id, req.params.stopId);
    res.json(plan);
  },
);

export const addSpot = asyncHandler(
  async (req: Request<PlanStopParam & ParamsDictionary>, res: Response) => {
    const spot = await DatePlanService.addSpot(req.params.stopId, req.body);
    res.status(201).json(spot);
  },
);

export const deleteSpot = asyncHandler(
  async (req: Request<PlanSpotParam & ParamsDictionary>, res: Response) => {
    await DatePlanService.deleteSpot(req.params.spotId);
    res.status(204).send();
  },
);

export const remove = asyncHandler<IdParam>(async (req, res) => {
  await DatePlanService.remove(req.params.id);
  res.status(204).send();
});
