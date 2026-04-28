import { z } from 'zod';

// Sprint 68 T471: color is the per-user accent token key matching mobile-rework
// SWATCH_FROM. Stored as string to keep the column flexible if we move to hex
// later. Nullable so the user can clear it; absence (undefined) means "don't
// touch". Both fields optional so callers can patch one without sending both.
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  color: z
    .enum(['primary', 'accent', 'secondary', 'primaryDeep'])
    .nullable()
    .optional(),
});

// Kept for back-compat with any external import — same shape, name-only.
// Prefer updateProfileSchema for new code.
export const updateNameSchema = updateProfileSchema;
