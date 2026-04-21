import { useMemo } from 'react';

import {
  type MomentRow,
  useMomentsViewModel,
} from '@/screens/Moments/useMomentsViewModel';
import { useAuthStore } from '@/stores/authStore';

// T375 (Sprint 62) — Dashboard VM. Thin wrapper over useMomentsViewModel so
// the home tab reuses the same fetch/subscription pipeline as the Moments tab
// (T376). We only surface the first row — the list drives empty ↔ has-data
// branching in DashboardScreen. When T378 pushes a new moment, momentsStore
// version bumps → both tabs refetch automatically.

export type DashboardVM = {
  userName: string | null;
  latest: MomentRow | null;
  count: number;
  loading: boolean;
  error: 'network' | 'unknown' | null;
  reload: () => void;
};

export function useDashboardViewModel(): DashboardVM {
  const userName = useAuthStore((s) => s.user?.name ?? null);
  const moments = useMomentsViewModel();

  return useMemo(
    () => ({
      userName,
      latest: moments.moments[0] ?? null,
      count: moments.total,
      loading: moments.loading,
      error: moments.error,
      reload: moments.reload,
    }),
    [
      userName,
      moments.moments,
      moments.total,
      moments.loading,
      moments.error,
      moments.reload,
    ],
  );
}
