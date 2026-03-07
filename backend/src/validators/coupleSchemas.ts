import { z } from 'zod';

export const updateCoupleSchema = z.object({
  name: z.string().min(1).optional(),
  anniversaryDate: z.string().nullable().optional(),
});
