import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import type { AuthRequest } from '../middleware/auth';
import * as ShareService from '../services/ShareService';

type TokenParam = { token: string };

export const create = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { type?: string; targetId?: string };
  const { coupleId } = (req as AuthRequest).user!;
  const link = await ShareService.create(body.type ?? '', body.targetId ?? '', coupleId);
  res.status(201).json(link);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { coupleId } = (req as AuthRequest).user!;
  const links = await ShareService.list(coupleId);
  res.json(links);
});

export const revoke = asyncHandler<TokenParam>(async (req, res) => {
  const { coupleId } = (req as AuthRequest).user!;
  await ShareService.revoke(req.params.token, coupleId);
  res.json({ message: 'Share link revoked' });
});

export const getToken = asyncHandler<TokenParam>(async (req, res) => {
  const result = await ShareService.getToken(req.params.token);
  res.json(result);
});

export const getTokenImage = asyncHandler<TokenParam>(async (req, res) => {
  const url = req.query.url as string;
  const validatedUrl = await ShareService.getTokenImage(req.params.token, url);

  const upstream = await fetch(validatedUrl);
  if (!upstream.ok) {
    res.status(upstream.status).json({ error: 'CDN fetch failed' });
    return;
  }
  const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  const buffer = await upstream.arrayBuffer();
  res.send(Buffer.from(buffer));
});
