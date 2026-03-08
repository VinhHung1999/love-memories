import { z } from 'zod';

export const createFoodSpotSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  rating: z.number().min(0).max(5).optional().default(0),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  priceRange: z.number().min(1).max(4).optional().default(2),
});

export const updateFoodSpotSchema = createFoodSpotSchema.partial();
