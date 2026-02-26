import { z } from 'zod';

export const createMomentSchema = z.object({
  title: z.string().min(1).max(200),
  caption: z.string().optional(),
  date: z.string().transform((s) => new Date(s)),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  spotifyUrl: z.string().url().startsWith('https://open.spotify.com/').optional().or(z.literal('')),
});

export const updateMomentSchema = createMomentSchema.partial();

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

export const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional().default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
  assignee: z.string().optional(),
  dueDate: z.string().transform((s) => new Date(s)).optional(),
  order: z.number().optional().default(0),
});

export const updateGoalSchema = createGoalSchema.partial();

export const updateGoalStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
});

export const assignGoalSchema = z.object({
  sprintId: z.string().nullable(),
});

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

export const EXPENSE_CATEGORIES = ['food', 'dating', 'shopping', 'transport', 'gifts', 'other'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const createExpenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  category: z.enum(EXPENSE_CATEGORIES),
  date: z.string().transform((s) => new Date(s)),
  note: z.string().optional(),
  receiptUrl: z.string().url().optional().nullable(),
  foodSpotId: z.string().uuid().optional().nullable(),
  datePlanId: z.string().uuid().optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
});

export const reorderGoalsSchema = z.object({
  goals: z.array(z.object({
    id: z.string(),
    order: z.number(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  })),
});
