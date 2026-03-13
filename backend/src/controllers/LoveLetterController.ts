import type { Response } from 'express';
import type { ParamsDictionary } from 'express-serve-static-core';
import type { Request } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { createLetterSchema, updateLetterSchema } from '../validators/loveLetterSchemas';
import type { AuthRequest } from '../middleware/auth';
import * as LoveLetterService from '../services/LoveLetterService';

type IdParam = { id: string };
type PhotoParam = { id: string; photoId: string };
type AudioParam = { id: string; audioId: string };

export const listReceived = asyncHandler(async (req: Request, res: Response) => {
  const letters = await LoveLetterService.listReceived((req as AuthRequest).user!.userId);
  res.json(letters);
});

export const listSent = asyncHandler(async (req: Request, res: Response) => {
  const letters = await LoveLetterService.listSent((req as AuthRequest).user!.userId);
  res.json(letters);
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await LoveLetterService.getUnreadCount((req as AuthRequest).user!.userId);
  res.json({ count });
});

export const getOne = asyncHandler<IdParam>(async (req, res) => {
  const letter = await LoveLetterService.getOne(
    req.params.id,
    (req as AuthRequest).user!.userId,
  );
  res.json(letter);
});

export const create = [
  validate(createLetterSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, coupleId } = (req as AuthRequest).user!;
    const letter = await LoveLetterService.create(userId, coupleId, req.body);
    res.status(201).json(letter);
  }),
];

export const update = [
  validate(updateLetterSchema),
  asyncHandler<IdParam>(async (req, res) => {
    const { userId, coupleId } = (req as AuthRequest).user!;
    const letter = await LoveLetterService.update(
      req.params.id,
      userId,
      coupleId,
      req.body as Parameters<typeof LoveLetterService.update>[3],
    );
    res.json(letter);
  }),
];

export const send = asyncHandler<IdParam>(async (req, res) => {
  const { userId, coupleId } = (req as AuthRequest).user!;
  const letter = await LoveLetterService.send(req.params.id, userId, coupleId);
  res.json(letter);
});

export const markRead = asyncHandler<IdParam>(async (req, res) => {
  const { userId, coupleId } = (req as AuthRequest).user!;
  const result = await LoveLetterService.markRead(req.params.id, userId, coupleId);
  res.json(result);
});

export const remove = asyncHandler<IdParam>(async (req, res) => {
  const { userId, coupleId } = (req as AuthRequest).user!;
  await LoveLetterService.remove(req.params.id, userId, coupleId);
  res.status(204).end();
});

export const uploadPhotos = asyncHandler<IdParam>(async (req, res) => {
  const { userId, coupleId } = (req as AuthRequest).user!;
  const files = req.files as Express.Multer.File[];
  const photos = await LoveLetterService.uploadPhotos(req.params.id, userId, coupleId, files);
  res.status(201).json(photos);
});

export const deletePhoto = asyncHandler(
  async (req: Request<PhotoParam & ParamsDictionary>, res: Response) => {
    const { userId, coupleId } = (req as AuthRequest).user!;
    await LoveLetterService.deletePhoto(req.params.id, userId, coupleId, req.params.photoId);
    res.status(204).end();
  },
);

export const uploadAudio = asyncHandler<IdParam>(async (req, res) => {
  const { userId, coupleId } = (req as AuthRequest).user!;
  const file = req.file;
  if (!file) { res.status(400).json({ error: 'No audio file uploaded' }); return; }
  const body = req.body as { duration?: string };
  const duration = body.duration ? parseFloat(body.duration) : undefined;
  const audio = await LoveLetterService.uploadAudio(req.params.id, userId, coupleId, file, duration);
  res.status(201).json(audio);
});

export const deleteAudio = asyncHandler(
  async (req: Request<AudioParam & ParamsDictionary>, res: Response) => {
    const { userId, coupleId } = (req as AuthRequest).user!;
    await LoveLetterService.deleteAudio(req.params.id, userId, coupleId, req.params.audioId);
    res.status(204).end();
  },
);
