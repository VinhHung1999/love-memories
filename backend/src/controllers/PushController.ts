import type { Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as PushService from '../services/PushService';
import type { AuthRequest } from '../middleware/auth';

export const getVapidKey = (_req: AuthRequest, res: Response) => {
  res.json(PushService.getVapidPublicKey());
};

export const subscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { endpoint, keys } = req.body as { endpoint: string; keys: { p256dh: string; auth: string } };
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    res.status(400).json({ error: 'Invalid subscription' }); return;
  }
  await PushService.subscribe(req.user!.userId, endpoint, keys);
  res.status(201).json({ ok: true });
});

export const unsubscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { endpoint } = req.body as { endpoint: string };
  await PushService.unsubscribe(endpoint);
  res.json({ ok: true });
});

export const mobileSubscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, deviceType } = req.body as { token: string; deviceType: string };
  if (!token || !deviceType) {
    res.status(400).json({ error: 'token and deviceType required' }); return;
  }
  await PushService.mobileSubscribe(req.user!.userId, token, deviceType);
  res.status(201).json({ ok: true });
});

export const mobileUnsubscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token } = req.body as { token: string };
  await PushService.mobileUnsubscribe(token);
  res.json({ ok: true });
});
