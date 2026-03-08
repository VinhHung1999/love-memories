import { z } from 'zod';

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

export const reorderGoalsSchema = z.object({
  goals: z.array(z.object({
    id: z.string(),
    order: z.number(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  })),
});
