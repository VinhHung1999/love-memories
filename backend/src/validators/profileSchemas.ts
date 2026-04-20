import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    notificationsEnabled: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.notificationsEnabled !== undefined, {
    message: 'At least one field must be provided',
  });
