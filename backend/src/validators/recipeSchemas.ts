import { z } from 'zod';

export const createRecipeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  ingredients: z.array(z.string()).optional().default([]),
  ingredientPrices: z.array(z.number().min(0)).optional().default([]),
  steps: z.array(z.string()).optional().default([]),
  stepDurations: z.array(z.number().int().min(0)).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional(),
  tutorialUrl: z.string().url().optional().nullable().or(z.literal('')),
  cooked: z.boolean().optional().default(false),
  foodSpotId: z.string().uuid().optional().nullable(),
});

export const updateRecipeSchema = createRecipeSchema.partial();
