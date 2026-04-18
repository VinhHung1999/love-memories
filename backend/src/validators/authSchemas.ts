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

export const deleteAccountSchema = z.object({
  password: z.string(),
});

export const appleAuthSchema = z.object({
  idToken: z.string().min(1),
  name: z.string().optional(), // nameHint — Apple sends fullName only on first sign-in
});

export const appleCompleteSchema = z.object({
  idToken: z.string().min(1),
  name: z.string().optional(),
  inviteCode: z.string().optional(),
  coupleName: z.string().optional(),
});

export const generateRecipeSchema = z.object({
  mode: z.enum(['text', 'youtube', 'url']),
  input: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6),
});
