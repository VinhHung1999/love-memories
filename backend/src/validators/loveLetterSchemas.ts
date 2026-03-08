import { z } from 'zod';

export const createLetterSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  mood: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  sendNow: z.boolean().optional(),
});

export const updateLetterSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  mood: z.string().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});
