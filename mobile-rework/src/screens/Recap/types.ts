// Sprint 67 T451 / T452 — TypeScript shape mirroring the BE response from
// GET /api/recap/{monthly,weekly}. Kept colocated with the Recap screen
// because nothing else in the app consumes these — the BE owns the canonical
// definition (`backend/src/services/RecapService.ts`).
//
// Augment-key derivation rules live in `docs/technical/api-reference.md` →
// "Recap" section. Note moodBuckets is intentionally always [] for v1
// (Vibes idle per Sprint 66 Boss directive); kept in the type so consumers
// can still render a placeholder section card without conditional shape.

import type { PaletteKey } from '@/theme/palettes';

export type RecapTopMoment = {
  id: string;
  title: string;
  date: string;
  location: string | null;
  photoCount: number;
  reactionCount: number;
  palette: PaletteKey;
  thumbnail: string | null;
};

export type RecapPlace = {
  name: string;
  latitude: number | null;
  longitude: number | null;
  count: number;
};

export type RecapTopQuestion = {
  id: string;
  text: string;
  textVi: string | null;
  count: number;
};

export type RecapLetterHighlight = {
  id: string;
  title: string;
  excerpt: string;
  // Sprint 67 D7 — full body alongside the truncated excerpt so the
  // Stories letter slide can render the whole letter inside a
  // ScrollView (read-screen style). Web editorial scroll keeps using
  // `excerpt`.
  content: string;
  // Sprint 67 D8 — attached photo URLs (BE caps at 4 per letter).
  // LettersCollection slide shows them as a thumbnail strip and the
  // BigStat letters backdrop pools them across all letters.
  photos: string[];
  senderId: string;
  senderName: string;
  deliveredAt: string | null;
};

// Sprint 67 D2 — top 4 letters in the period (longest content). The
// editorial scroll keeps using `letterHighlight` (= letters[0]) for
// backward compat; the Stories shell renders ONE slide per entry with
// a deterministic visual variant.
export type RecapLetter = RecapLetterHighlight;

export type RecapFirst = {
  id: string;
  title: string;
  date: string;
};

// Common augment fields shared by both monthly + weekly responses (Sprint 67
// T451). Endpoints also return existing keys (cooking/foodSpots/etc.) but
// mobile-rework doesn't consume those.
export type RecapAugment = {
  streak: { current: number; longest: number };
  questions: { count: number };
  words: { count: number };
  trips: number;
  totalPhotoCount: number;
  heatmap: number[];
  topMoments: RecapTopMoment[];
  places: RecapPlace[];
  topQuestion: RecapTopQuestion | null;
  letterHighlight: RecapLetterHighlight | null;
  letters: RecapLetter[];
  firsts: RecapFirst[];
  moodBuckets: never[];
};

export type RecapMomentHighlightMonthly = {
  id: string;
  title: string;
  date: string;
  photos: string[];
};

export type RecapMomentHighlightWeekly = {
  id: string;
  title: string;
  date: string;
  photoUrl: string;
};

export type MonthlyRecapResponse = RecapAugment & {
  month: string; // YYYY-MM
  startDate: string;
  endDate: string;
  moments: { count: number; photoCount: number; highlights: RecapMomentHighlightMonthly[] };
  loveLetters: { sent: number; received: number };
  datePlans: { count: number; titles: string[] };
  goalsCompleted: number;
  achievementsUnlocked: string[];
};

export type WeeklyRecapResponse = RecapAugment & {
  week: string; // YYYY-Www
  startDate: string;
  endDate: string;
  moments: { count: number; photoCount: number; highlights: RecapMomentHighlightWeekly[] };
  loveLetters: { sent: number; received: number };
  datePlans: { count: number; titles: string[] };
  goalsCompleted: number;
  achievementsUnlocked: string[];
};
