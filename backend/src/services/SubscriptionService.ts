import prisma from '../utils/prisma';
import { AppError } from '../types/errors';

// Free tier limits
const FREE_LIMITS = {
  moments: 10,
  foodspots: 10,
  expenses: 10,
  sprints_active: 1,
} as const;

// Locked modules (no access on free tier)
const LOCKED_MODULES = new Set([
  'recipes',
  'love-letters',
  'date-planner',
  'photo-booth',
  'weekly-recap',
  'monthly-recap',
  'achievements',
  'what-to-eat',
]);

export type RevenueCatEvent =
  | 'INITIAL_PURCHASE'
  | 'RENEWAL'
  | 'CANCELLATION'
  | 'EXPIRATION'
  | 'BILLING_ISSUE_DETECTED';

export async function getOrCreateSubscription(coupleId: string) {
  const existing = await prisma.subscription.findUnique({ where: { coupleId } });
  if (existing) return existing;
  return prisma.subscription.create({ data: { coupleId } });
}

export async function getStatus(coupleId: string) {
  const sub = await getOrCreateSubscription(coupleId);
  const isActive = sub.status === 'active' || sub.status === 'grace_period';
  const plan = isActive ? 'plus' : 'free';

  if (isActive) {
    return {
      status: sub.status,
      plan,
      expiresAt: sub.expiresAt,
      limits: null, // unlimited
    };
  }

  // Count usage for free tier limits
  const [momentsUsed, foodspotsUsed, expensesUsed, activeSprints] = await Promise.all([
    prisma.moment.count({ where: { coupleId } }),
    prisma.foodSpot.count({ where: { coupleId } }),
    prisma.expense.count({ where: { coupleId } }),
    prisma.sprint.count({ where: { coupleId, status: 'ACTIVE' } }),
  ]);

  return {
    status: sub.status,
    plan,
    expiresAt: sub.expiresAt,
    limits: {
      moments: { used: momentsUsed, max: FREE_LIMITS.moments },
      foodspots: { used: foodspotsUsed, max: FREE_LIMITS.foodspots },
      expenses: { used: expensesUsed, max: FREE_LIMITS.expenses },
      sprints: { used: activeSprints, max: FREE_LIMITS.sprints_active },
    },
  };
}

export async function isSubscriptionActive(coupleId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({ where: { coupleId } });
  if (!sub) return false;
  return sub.status === 'active' || sub.status === 'grace_period';
}

export async function handleWebhook(event: RevenueCatEvent, payload: Record<string, unknown>): Promise<void> {
  // Extract coupleId from app_user_id (RevenueCat stores our coupleId as app_user_id)
  const appUserId =
    (payload.app_user_id as string) ||
    ((payload.subscriber_attributes as Record<string, { value: string }> | undefined)?.couple_id?.value ?? '');

  if (!appUserId) {
    throw new AppError(400, 'Missing app_user_id in webhook payload');
  }

  // Verify couple exists
  const couple = await prisma.couple.findUnique({ where: { id: appUserId } });
  if (!couple) {
    throw new AppError(404, `Couple not found: ${appUserId}`);
  }

  const expiresAt = payload.expiration_at_ms
    ? new Date(payload.expiration_at_ms as number)
    : null;

  let status: 'free' | 'active' | 'expired' | 'cancelled' | 'grace_period';

  switch (event) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
      status = 'active';
      break;
    case 'CANCELLATION':
      status = 'cancelled';
      break;
    case 'EXPIRATION':
      status = 'expired';
      break;
    case 'BILLING_ISSUE_DETECTED':
      status = 'grace_period';
      break;
    default:
      return; // Unknown event — ignore
  }

  await prisma.subscription.upsert({
    where: { coupleId: appUserId },
    create: {
      coupleId: appUserId,
      status,
      platform: payload.store as string | undefined,
      productId: payload.product_id as string | undefined,
      originalTransactionId: payload.original_transaction_id as string | undefined,
      expiresAt,
    },
    update: {
      status,
      platform: payload.store as string | undefined,
      productId: payload.product_id as string | undefined,
      originalTransactionId: payload.original_transaction_id as string | undefined,
      expiresAt,
    },
  });
}

export function isLockedModule(module: string): boolean {
  return LOCKED_MODULES.has(module);
}

export { FREE_LIMITS, LOCKED_MODULES };
