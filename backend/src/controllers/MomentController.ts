import type { Response } from 'express';
import type { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { asyncHandler } from '../middleware/asyncHandler';
import { validate } from '../middleware/validate';
import { createMomentSchema, updateMomentSchema } from '../validators/momentSchemas';
import { commentSchema, reactionSchema } from '../validators/momentSchemas';
import type { AuthRequest } from '../middleware/auth';
import * as MomentService from '../services/MomentService';

type IdParam = { id: string };
type PhotoParam = { id: string; photoId: string };
type AudioParam = { id: string; audioId: string };
type CommentParam = { id: string; commentId: string };

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  const moments = await MomentService.list(coupleId);
  res.json(moments);
});

export const getOne = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  const moment = await MomentService.getOne(req.params.id, coupleId);
  res.json(moment);
});

export const create = [
  validate(createMomentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
    const moment = await MomentService.create(coupleId, userId, req.body as Record<string, unknown>);
    res.status(201).json(moment);
  }),
];

export const update = [
  validate(updateMomentSchema),
  asyncHandler<IdParam>(async (req, res) => {
    const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
    const moment = await MomentService.update(req.params.id, coupleId, req.body as Record<string, unknown>);
    res.json(moment);
  }),
];

export const remove = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  await MomentService.remove(req.params.id, coupleId);
  res.json({ message: 'Moment deleted' });
});

export const uploadPhotos = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  const files = req.files as Express.Multer.File[];
  const photos = await MomentService.uploadPhotos(req.params.id, coupleId, files);
  res.status(201).json(photos);
});

export const deletePhoto = asyncHandler(
  async (req: Request<PhotoParam & ParamsDictionary>, res: Response) => {
    const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
    await MomentService.deletePhoto(req.params.photoId, coupleId);
    res.json({ message: 'Photo deleted' });
  },
);

export const uploadAudio = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  const file = req.file;
  if (!file) { res.status(400).json({ error: 'No audio file uploaded' }); return; }
  const body = req.body as { duration?: string };
  const duration = body.duration ? parseFloat(body.duration) : null;
  const audio = await MomentService.uploadAudio(req.params.id, coupleId, file, duration);
  res.status(201).json(audio);
});

export const deleteAudio = asyncHandler(
  async (req: Request<AudioParam & ParamsDictionary>, res: Response) => {
    const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
    await MomentService.deleteAudio(req.params.audioId, coupleId);
    res.json({ message: 'Audio deleted' });
  },
);

export const listComments = asyncHandler<IdParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  const comments = await MomentService.listComments(req.params.id, coupleId);
  res.json(comments);
});

export const addComment = [
  validate(commentSchema),
  asyncHandler<IdParam>(async (req, res) => {
    const { author, content } = req.body as { author: string; content: string; };
    const userId = (req as AuthRequest).user?.userId ?? null;
    const coupleId = (req as AuthRequest).user?.coupleId ?? null;
    const comment = await MomentService.addComment(req.params.id, userId, coupleId, author, content);
    res.status(201).json(comment);
  }),
];

export const deleteComment = asyncHandler(
  async (req: Request<CommentParam & ParamsDictionary>, res: Response) => {
    const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
    await MomentService.deleteComment(req.params.commentId, coupleId);
    res.status(204).send();
  },
);

export const toggleReaction = [
  validate(reactionSchema),
  asyncHandler<IdParam>(async (req, res) => {
    const { emoji, author } = req.body as { emoji: string; author: string };
    const userId = (req as AuthRequest).user?.userId;
    const coupleId = (req as AuthRequest).user?.coupleId ?? undefined;
    const reactions = await MomentService.toggleReaction(
      req.params.id, emoji, author, userId, coupleId,
    );
    res.json(reactions);
  }),
];
