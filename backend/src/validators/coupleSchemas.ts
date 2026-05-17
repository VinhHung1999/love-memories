import { z } from 'zod';

// Sprint 60 T286: `color` is the couple's accent palette (Personalize swatch
// index 0–3 stored as a string — keeps the column flexible if we move to hex
// later). Nullable so the user can clear it; absence means "don't touch".
export const updateCoupleSchema = z.object({
  name: z.string().min(1).optional(),
  anniversaryDate: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

// Sprint 68 T462: combined create. Replaces the Sprint 60 lazy-create flow
// (where name was optional and slogan/anniversary came in via PUT later).
// New onboarding gathers all three on CoupleForm and submits atomically so
// the slogan persists in AppSetting inside the same transaction as the
// couple row + user.coupleId update. Web Dashboard reads slogan from the
// existing `app_slogan` AppSetting key, so downstream UIs are unchanged.
export const createCoupleSchema = z.object({
  name: z.string().min(1).max(60),
  anniversaryDate: z.string().nullable().optional(),
  slogan: z.string().max(120).nullable().optional(),
});

export const joinCoupleSchema = z.object({
  inviteCode: z.string().min(1),
});
