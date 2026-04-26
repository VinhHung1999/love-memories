import { apiClient } from '@/lib/apiClient';

// Sprint 66 T436 — typed wrappers around BE daily-vibes routes
// (mounted at /api/daily-vibes in backend/src/routes/index.ts).
// Returns null when no vibe has been set for today VN.

export const VIBE_KEYS = ['coffee', 'rain', 'missing', 'trinh', 'sun'] as const;
export type VibeKey = (typeof VIBE_KEYS)[number];

export type DailyVibeRow = {
  vibeKey: VibeKey;
  createdById: string;
  dayKey: string;
};

export function getTodayVibe() {
  return apiClient.get<DailyVibeRow | null>('/api/daily-vibes/today');
}

export function setTodayVibe(vibeKey: VibeKey) {
  return apiClient.post<DailyVibeRow>('/api/daily-vibes/today', { vibeKey });
}
