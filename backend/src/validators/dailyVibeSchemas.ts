import { z } from 'zod';
import { VIBE_KEYS } from '../services/DailyVibeService';

export const setVibeSchema = z.object({
  vibeKey: z.enum(VIBE_KEYS),
});
