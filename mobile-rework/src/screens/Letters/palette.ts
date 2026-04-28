// T421 (Sprint 65) — Letter palette derivation. BE has no `palette` column on
// LoveLetter, only `mood` (an optional emoji string). Each letter still needs
// a stable colour identity for the envelope hero gradient + compact row tile,
// so we derive it deterministically:
//   1. If letter.mood is one of the 8 prototype mood emojis, map directly.
//   2. Otherwise hash letter.id char-codes mod 6 → fallback PALETTE_KEYS[idx].
// Stable across renders + sessions because it's pure (id + mood are immutable
// for delivered letters; SCHEDULED/DRAFT only edit title/body/mood, not id).
//
// Sprint 67 T452: PAL_GRADIENTS + PALETTE_KEYS + the deterministic id hash
// were lifted into `src/theme/palettes.ts` so Recap + future surfaces share
// the same source of truth. Letter-specific stuff (mood→palette map +
// paletteFor() that combines mood + id-hash) stays here.

export {
  PAL_GRADIENTS,
  PALETTE_KEYS,
  paletteForId,
} from '@/theme/palettes';
export type { PaletteKey as LetterPaletteKey } from '@/theme/palettes';

import { paletteForId, type PaletteKey } from '@/theme/palettes';

const MOOD_TO_PALETTE: Record<string, PaletteKey> = {
  '💌': 'sunset',
  '❤️': 'rose',
  '🥺': 'lilac',
  '🌙': 'night',
  '🎂': 'rose',
  '☕': 'butter',
  '🌸': 'lilac',
  '✨': 'mint',
};

export function paletteFor(letter: {
  id: string;
  mood: string | null;
}): PaletteKey {
  if (letter.mood && MOOD_TO_PALETTE[letter.mood]) {
    return MOOD_TO_PALETTE[letter.mood]!;
  }
  return paletteForId(letter.id);
}
