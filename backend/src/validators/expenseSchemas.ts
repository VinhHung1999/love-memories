import { z } from 'zod';

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
