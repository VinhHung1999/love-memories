import { z } from 'zod';

export const createCookingSessionSchema = z.object({
  recipeIds: z.array(z.string().uuid()).min(1),
});

export const updateCookingSessionStatusSchema = z.object({
  status: z.enum(['selecting', 'shopping', 'cooking', 'photo', 'completed']),
  notes: z.string().optional(),
});

export const toggleCookingItemSchema = z.object({
  checked: z.boolean(),
});

export const toggleCookingStepSchema = z.object({
  checked: z.boolean(),
  checkedBy: z.string().optional(),
});

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
});
