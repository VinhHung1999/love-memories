import { z } from 'zod';

// Sprint 68 T471 (Sprint 68 D1prime — Boss build 132 prototype sync):
// `color` is the per-user accent token key matching mobile-rework's
// avatar-style swatches. Stored as string for column flexibility. The
// enum was extended from 4 → 6 to match the new prototype Personalize
// grid (`pairing.jsx` L975-982): primary / accent / secondary /
// primaryDeep + sunset (heroA→heroC) + mint (#7EC8B5→accent). Nullable
// so the user can clear it; absence (undefined) means "don't touch".
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  color: z
    .enum(['primary', 'accent', 'secondary', 'primaryDeep', 'sunset', 'mint'])
    .nullable()
    .optional(),
});

// Kept for back-compat with any external import — same shape, name-only.
// Prefer updateProfileSchema for new code.
export const updateNameSchema = updateProfileSchema;
