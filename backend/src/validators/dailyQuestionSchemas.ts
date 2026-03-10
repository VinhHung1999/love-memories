import { z } from 'zod';

export const answerSchema = z.object({
  answer: z.string().min(1).max(500),
});

export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
