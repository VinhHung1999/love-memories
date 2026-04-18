import { z } from 'zod';

// Sprint 60 T286: `color` is the couple's accent palette (Personalize swatch
// index 0–3 stored as a string — keeps the column flexible if we move to hex
// later). Nullable so the user can clear it; absence means "don't touch".
export const updateCoupleSchema = z.object({
  name: z.string().min(1).optional(),
  anniversaryDate: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

// Sprint 60 T284: name optional. Mobile-rework's PairCreate flow needs to
// create a couple immediately after signup so /generate-invite (requireCouple)
// works, but the user hasn't entered a couple name yet — that's collected in
// Personalize (T286) via PUT /api/couple. Web PWA legacy callers may still
// pass a name and that path is preserved.
export const createCoupleSchema = z.object({
  name: z.string().min(1).optional(),
});

export const joinCoupleSchema = z.object({
  inviteCode: z.string().min(1),
});
