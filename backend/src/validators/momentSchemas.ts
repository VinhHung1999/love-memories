import { z } from 'zod';

export const PRESET_EMOJIS = ['❤️', '😂', '😍', '🥺', '🔥', '👏', '😢', '🎉'];

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

export const commentSchema = z.object({
  author: z.string().min(1),
  content: z.string().min(1),
});

export const reactionSchema = z.object({
  emoji: z.string().refine((e) => PRESET_EMOJIS.includes(e), { message: 'Invalid emoji' }),
  author: z.string().min(1),
});
