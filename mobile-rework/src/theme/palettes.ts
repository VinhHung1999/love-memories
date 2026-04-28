// Sprint 67 T452 — Lifted from `src/screens/Letters/palette.ts` so Recap +
// Letters + future surfaces can share the prototype's PAL_GRADIENTS without
// the consumer importing from a sibling screen folder. Letters/palette.ts now
// re-exports from here and keeps its mood-emoji map + paletteFor() helper
// (those are letter-specific).
//
// Gradients ported 1:1 from prototype `moments.jsx` L86-93 (PAL_GRADIENTS) /
// `moments3.jsx` L22-30 (M3_PAL_GRAD).

export type PaletteKey =
  | 'sunset'
  | 'butter'
  | 'night'
  | 'lilac'
  | 'rose'
  | 'mint';

export const PAL_GRADIENTS: Record<
  PaletteKey,
  readonly [string, string, string]
> = {
  sunset: ['#F5C8B6', '#E8788A', '#8B5A7E'],
  butter: ['#FDE1A8', '#F4A261', '#C17A3A'],
  night: ['#4A3B6B', '#E8788A', '#1F1430'],
  lilac: ['#E8D5F0', '#A98AC4', '#5B3F7A'],
  rose: ['#F8C5CE', '#E8788A', '#8E1F34'],
  mint: ['#D8EFE8', '#7EC8B5', '#2F6F5E'],
};

export const PALETTE_KEYS: PaletteKey[] = [
  'sunset',
  'butter',
  'night',
  'lilac',
  'rose',
  'mint',
];

// Deterministic palette pick from any string id (moment id, letter id, etc.).
// Matches the BE RecapService.paletteForId logic so the mobile thumbnail
// palette agrees with what the BE returns in /api/recap topMoments[].palette.
export function paletteForId(id: string): PaletteKey {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE_KEYS[h % PALETTE_KEYS.length] ?? 'sunset';
}
