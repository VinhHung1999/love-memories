// All types are now maintained in shared/src/types/index.ts
// Re-exported here so existing imports (@/types, ../types) continue to work unchanged.
export * from '@shared/types';

// ── Subscription ──────────────────────────────────────────────────────────────

export interface SubscriptionLimitItem {
  used: number;
  max: number;
}

export interface SubscriptionLimits {
  moments: SubscriptionLimitItem;
  foodspots: SubscriptionLimitItem;
  expenses: SubscriptionLimitItem;
  sprints: SubscriptionLimitItem;
}

export interface SubscriptionStatus {
  status: string;
  plan: 'free' | 'plus';
  expiresAt: string | null;
  limits: SubscriptionLimits | null; // null = unlimited (plus plan)
}
