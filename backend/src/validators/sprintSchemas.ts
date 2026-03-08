import { z } from 'zod';

export const createSprintSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional().default('PLANNING'),
});

export const updateSprintSchema = createSprintSchema.partial();

export const updateSprintStatusSchema = z.object({
  status: z.enum(['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
});
