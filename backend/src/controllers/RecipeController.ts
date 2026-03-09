import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as RecipeService from '../services/RecipeService';
import type { AuthRequest } from '../middleware/auth';

export const list = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json(await RecipeService.list(req.user!.coupleId));
});

export const getOne = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  res.json(await RecipeService.getOne(req.params.id, req.user!.coupleId));
});

export const create = asyncHandler(async (req: AuthRequest, res: Response) => {
  const recipe = await RecipeService.create(req.user!.coupleId, req.user!.userId, req.body);
  res.status(201).json(recipe);
});

export const update = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  res.json(await RecipeService.update(req.params.id, req.user!.coupleId, req.body));
});

export const remove = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  await RecipeService.remove(req.params.id, req.user!.coupleId);
  res.json({ message: 'Recipe deleted' });
});

export const addPhotos = asyncHandler(async (req: AuthRequest & Request<{ id: string }>, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const photos = await RecipeService.addPhotos(req.params.id, req.user!.coupleId, files);
  res.status(201).json(photos);
});

export const deletePhoto = asyncHandler(async (req: AuthRequest & Request<{ id: string; photoId: string }>, res: Response) => {
  await RecipeService.deletePhoto(req.params.photoId, req.user!.coupleId);
  res.json({ message: 'Photo deleted' });
});
