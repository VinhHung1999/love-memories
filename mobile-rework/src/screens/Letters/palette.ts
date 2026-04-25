// T421 (Sprint 65) — Letter palette derivation. BE has no `palette` column on
// LoveLetter, only `mood` (an optional emoji string). Each letter still needs
// a stable colour identity for the envelope hero gradient + compact row tile,
// so we derive it deterministically:
//   1. If letter.mood is one of the 8 prototype mood emojis, map directly.
//   2. Otherwise hash letter.id char-codes mod 6 → fallback PALETTE_KEYS[idx].
// Stable across renders + sessions because it's pure (id + mood are immutable
// for delivered letters; SCHEDULED/DRAFT only edit title/body/mood, not id).
//
// Gradients ported 1:1 from prototype `moments.jsx` L86-93 (PAL_GRADIENTS).

export type LetterPaletteKey =
  | 'sunset'
  | 'butter'
  | 'night'
  | 'lilac'
  | 'rose'
  | 'mint';

export const PAL_GRADIENTS: Record<
  LetterPaletteKey,
  readonly [string, string, string]
> = {
  sunset: ['#F5C8B6', '#E8788A', '#8B5A7E'],
  butter: ['#FDE1A8', '#F4A261', '#C17A3A'],
  night: ['#4A3B6B', '#E8788A', '#1F1430'],
  lilac: ['#E8D5F0', '#A98AC4', '#5B3F7A'],
  rose: ['#F8C5CE', '#E8788A', '#8E1F34'],
  mint: ['#D8EFE8', '#7EC8B5', '#2F6F5E'],
};

const PALETTE_KEYS: LetterPaletteKey[] = [
  'sunset',
  'butter',
  'night',
  'lilac',
  'rose',
  'mint',
];

const MOOD_TO_PALETTE: Record<string, LetterPaletteKey> = {
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
}): LetterPaletteKey {
  if (letter.mood && MOOD_TO_PALETTE[letter.mood]) {
    return MOOD_TO_PALETTE[letter.mood]!;
  }
  let h = 0;
  for (let i = 0; i < letter.id.length; i++) {
    h = (h * 31 + letter.id.charCodeAt(i)) >>> 0;
  }
  return PALETTE_KEYS[h % PALETTE_KEYS.length] ?? 'sunset';
}
