import { z } from 'zod';

export const createDateWishSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  url: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
});

export const updateDateWishSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  url: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const markDoneSchema = z.object({
  linkedMomentId: z.string().nullable().optional(),
  linkedFoodSpotId: z.string().nullable().optional(),
});
