import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  inviteCode: z.string().optional(),
  coupleName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const generateRecipeSchema = z.object({
  mode: z.enum(['text', 'youtube', 'url']),
  input: z.string().min(1),
});
