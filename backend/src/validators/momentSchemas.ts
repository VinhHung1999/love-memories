import { z } from 'zod';

// T400 (Sprint 63) — mobile-rework renders 6 of these as the reactions row
// per prototype moments.jsx L625-645: ❤️, 🥺, 😍, 😂, 🔥, ✨. The 9-wide
// server whitelist keeps the extra legacy entries (👏, 😢, 🎉) valid so
// the old mobile/ app's existing reactions don't 400 when refetched.
export const PRESET_EMOJIS = ['❤️', '😂', '😍', '🥺', '🔥', '👏', '😢', '🎉', '✨'];

export const createMomentSchema = z.object({
  title: z.string().min(1).max(200),
  // D31 (Sprint 64 Build 71): caption is `.nullable()` too so PUT callers
  // can send `null` to CLEAR a previously-set caption. Mobile-rework's
  // edit-moment flow does exactly this — `caption: description.trim().length > 0
  //   ? description.trim() : null`. Without `.nullable()` the Zod 400 was
  //   silently surfacing as "save doesn't work unless there's a description".
  //   `.partial()` on updateMomentSchema already makes the KEY optional
  //   (omit-to-skip), but the VALUE type still has to allow `null` here.
  caption: z.string().nullable().optional(),
  date: z.string().transform((s) => new Date(s)),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  location: z.string().max(120).nullable().optional(),
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
