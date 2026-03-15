import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import type { AuthRequest } from '../middleware/auth';
import * as SubscriptionService from '../services/SubscriptionService';

export const getStatus = asyncHandler(async (req: Request, res: Response) => {
  const { coupleId } = (req as AuthRequest).user! as { userId: string; coupleId: string };
  const status = await SubscriptionService.getStatus(coupleId);
  res.json(status);
});

export const webhook = asyncHandler(async (req: Request, res: Response) => {
  const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== secret) {
      res.status(401).json({ error: 'Invalid webhook secret' });
      return;
    }
  }

  const body = req.body as { event?: { type?: string } & Record<string, unknown> };
  const eventType = body.event?.type as SubscriptionService.RevenueCatEvent | undefined;

  if (!eventType) {
    res.status(400).json({ error: 'Missing event.type in payload' });
    return;
  }

  await SubscriptionService.handleWebhook(eventType, body.event ?? {});
  res.json({ ok: true });
});
