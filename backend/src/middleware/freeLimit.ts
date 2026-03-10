import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './auth';
import prisma from '../utils/prisma';
import { isSubscriptionActive, FREE_LIMITS, LOCKED_MODULES } from '../services/SubscriptionService';

type CountableResource = keyof typeof FREE_LIMITS;

const resourceCounters: Record<CountableResource, (coupleId: string) => Promise<number>> = {
  moments: (coupleId) => prisma.moment.count({ where: { coupleId } }),
  foodspots: (coupleId) => prisma.foodSpot.count({ where: { coupleId } }),
  expenses: (coupleId) => prisma.expense.count({ where: { coupleId } }),
  sprints_active: (coupleId) => prisma.sprint.count({ where: { coupleId, status: 'ACTIVE' } }),
};

export function checkFreeLimit(resource: CountableResource) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const { coupleId } = req.user!;

    const active = await isSubscriptionActive(coupleId);
    if (active) {
      next();
      return;
    }

    const max = FREE_LIMITS[resource];
    const counter = resourceCounters[resource];
    const used = await counter(coupleId);

    if (used >= max) {
      res.status(403).json({
        error: 'FREE_LIMIT_REACHED',
        limit: max,
        used,
        resource,
      });
      return;
    }

    next();
  };
}

export function checkPremiumAccess(module: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!LOCKED_MODULES.has(module)) {
      next();
      return;
    }

    const { coupleId } = req.user!;
    const active = await isSubscriptionActive(coupleId);

    if (!active) {
      res.status(403).json({
        error: 'PREMIUM_REQUIRED',
        module,
      });
      return;
    }

    next();
  };
}
