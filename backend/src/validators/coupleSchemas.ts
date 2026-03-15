import { z } from 'zod';

export const updateCoupleSchema = z.object({
  name: z.string().min(1).optional(),
  anniversaryDate: z.string().nullable().optional(),
});

export const createCoupleSchema = z.object({
  name: z.string().min(1),
});

export const joinCoupleSchema = z.object({
  inviteCode: z.string().min(1),
});
