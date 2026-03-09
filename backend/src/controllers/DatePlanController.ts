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
  const { coupleId } = (req as AuthRequest).user!;
  const plan = await DatePlanService.getOne(req.params.id, coupleId);
  res.json(plan);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { userId, coupleId } = (req as AuthRequest).user!;
  const plan = await DatePlanService.create(coupleId, userId, req.body);
  res.status(201).json(plan);
});

export const update = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user!;
  const plan = await DatePlanService.update(req.params.id, coupleId, req.body as Parameters<typeof DatePlanService.update>[2]);
  res.json(plan);
});

export const updateStatus = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user!;
  const { status } = req.body as { status: string };
  const plan = await DatePlanService.updateStatus(req.params.id, coupleId, status);
  res.json(plan);
});

export const linkMoment = asyncHandler(
  async (req: Request<PlanStopParam & ParamsDictionary>, res: Response) => {
    const { coupleId } = (req as AuthRequest).user!;
    const { momentId } = req.body as { momentId: string | null };
    const stop = await DatePlanService.linkMoment(req.params.stopId, coupleId, momentId);
    res.json(stop);
  },
);

export const linkFoodSpot = asyncHandler(
  async (req: Request<PlanStopParam & ParamsDictionary>, res: Response) => {
    const { coupleId } = (req as AuthRequest).user!;
    const { foodSpotId } = req.body as { foodSpotId: string | null };
    const stop = await DatePlanService.linkFoodSpot(req.params.stopId, coupleId, foodSpotId);
    res.json(stop);
  },
);

export const updateStopCost = asyncHandler(
  async (req: Request<PlanStopParam & ParamsDictionary>, res: Response) => {
    const { coupleId } = (req as AuthRequest).user!;
    const { cost } = req.body as { cost: number | null };
    const stop = await DatePlanService.updateStopCost(req.params.stopId, coupleId, cost);
    res.json(stop);
  },
);

export const markStopDone = asyncHandler(
  async (req: Request<PlanStopParam & ParamsDictionary>, res: Response) => {
    const { coupleId } = (req as AuthRequest).user!;
    const plan = await DatePlanService.markStopDone(req.params.id, req.params.stopId, coupleId);
    res.json(plan);
  },
);

export const addSpot = asyncHandler(
  async (req: Request<PlanStopParam & ParamsDictionary>, res: Response) => {
    const { coupleId } = (req as AuthRequest).user!;
    const spot = await DatePlanService.addSpot(req.params.stopId, coupleId, req.body);
    res.status(201).json(spot);
  },
);

export const deleteSpot = asyncHandler(
  async (req: Request<PlanSpotParam & ParamsDictionary>, res: Response) => {
    const { coupleId } = (req as AuthRequest).user!;
    await DatePlanService.deleteSpot(req.params.spotId, coupleId);
    res.status(204).send();
  },
);

export const remove = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user!;
  await DatePlanService.remove(req.params.id, coupleId);
  res.status(204).send();
});
