import { z } from 'zod';

export const updateCoupleSchema = z.object({
  name: z.string().min(1).optional(),
  anniversaryDate: z.string().nullable().optional(),
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
