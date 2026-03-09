import type { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { createFoodSpotSchema, updateFoodSpotSchema } from '../validators/foodspotSchemas';
import type { AuthRequest } from '../middleware/auth';
import * as FoodSpotService from '../services/FoodSpotService';

type IdParam = { id: string };
type PhotoParam = { id: string; photoId: string };

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { coupleId } = (req as AuthRequest).user!;
  const foodSpots = await FoodSpotService.list(coupleId);
  res.json(foodSpots);
});

export const getRandom = asyncHandler(async (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radius = parseFloat((req.query.radius as string) || '5');

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: 'lat and lng are required' });
    return;
  }

  const { coupleId } = (req as AuthRequest).user!;
  const pick = await FoodSpotService.getRandom(coupleId, lat, lng, radius);
  res.json(pick);
});

export const getOne = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user!;
  const foodSpot = await FoodSpotService.getOne(req.params.id, coupleId);
  res.json(foodSpot);
});

export const create = [
  validate(createFoodSpotSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, coupleId } = (req as AuthRequest).user!;
    const foodSpot = await FoodSpotService.create(coupleId, userId, req.body as Record<string, unknown>);
    res.status(201).json(foodSpot);
  }),
];

export const update = [
  validate(updateFoodSpotSchema),
  asyncHandler<IdParam>(async (req, res) => {
    const { coupleId } = (req as AuthRequest).user!;
    const foodSpot = await FoodSpotService.update(req.params.id, coupleId, req.body as Record<string, unknown>);
    res.json(foodSpot);
  }),
];

export const remove = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user!;
  await FoodSpotService.remove(req.params.id, coupleId);
  res.json({ message: 'Food spot deleted' });
});

export const uploadPhotos = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user!;
  const files = req.files as Express.Multer.File[];
  const photos = await FoodSpotService.uploadPhotos(req.params.id, coupleId, files);
  res.status(201).json(photos);
});

export const deletePhoto = asyncHandler(
  async (req: Request<PhotoParam & ParamsDictionary>, res: Response) => {
    const { coupleId } = (req as AuthRequest).user!;
    await FoodSpotService.deletePhoto(req.params.photoId, coupleId);
    res.json({ message: 'Photo deleted' });
  },
);
