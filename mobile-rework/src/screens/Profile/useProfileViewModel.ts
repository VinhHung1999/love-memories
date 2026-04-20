import { useCallback, useEffect, useState } from 'react';

import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// T338 (Sprint 61) — Profile hero VM. Hydrates from GET /api/couple and
// exposes a compact shape the hero needs: me, partner, coupleName,
// anniversaryLabel, isSolo. Subsequent sprint-61 tasks (stats / settings /
// edit sheets) will stack more state on top of this same VM.

type CoupleUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
};

type CoupleResponse = {
  id: string;
  name: string | null;
  color: string | null;
  anniversaryDate: string | null;
  inviteCode: string | null;
  users: CoupleUser[];
};

export type ProfileStage = 'loading' | 'ready' | 'error';

export type HeroPerson = {
  name: string;
  initial: string;
  avatarUrl: string | null;
};

export type ProfileStats = {
  moments: number;
  letters: number;
  questions: number;
};

const EMPTY_STATS: ProfileStats = { moments: 0, letters: 0, questions: 0 };

function toInitial(name?: string | null): string {
  if (!name) return '·';
  const trimmed = name.trim();
  if (!trimmed) return '·';
  return trimmed[0]!.toUpperCase();
}

function formatAnniversary(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function useProfileViewModel() {
  const user = useAuthStore((s) => s.user);

  const [stage, setStage] = useState<ProfileStage>('loading');
  const [couple, setCouple] = useState<CoupleResponse | null>(null);
  const [stats, setStats] = useState<ProfileStats>(EMPTY_STATS);

  const load = useCallback(async () => {
    // No coupleId → we're solo. No need to hit /api/couple or /api/profile/stats
    // (both gated by requireCouple → 400).
    if (!user?.coupleId) {
      setCouple(null);
      setStats(EMPTY_STATS);
      setStage('ready');
      return;
    }
    setStage('loading');
    try {
      // Stats are non-critical — treat a failure there as 0s rather than
      // dropping the whole screen to the error stage.
      const [coupleRes, statsRes] = await Promise.all([
        apiClient.get<CoupleResponse>('/api/couple'),
        apiClient.get<ProfileStats>('/api/profile/stats').catch(() => EMPTY_STATS),
      ]);
      setCouple(coupleRes);
      setStats(statsRes);
      setStage('ready');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setCouple(null);
        setStats(EMPTY_STATS);
        setStage('ready');
        return;
      }
      setStage('error');
    }
  }, [user?.coupleId]);

  useEffect(() => {
    void load();
  }, [load]);

  const me: HeroPerson = {
    name: user?.name ?? '',
    initial: toInitial(user?.name),
    avatarUrl: user?.avatarUrl ?? null,
  };

  const partnerUser = couple?.users.find((u) => u.id !== user?.id) ?? null;
  const partner: HeroPerson | null = partnerUser
    ? {
        name: partnerUser.name ?? '',
        initial: toInitial(partnerUser.name),
        avatarUrl: partnerUser.avatar ?? null,
      }
    : null;

  const isSolo = !couple || !partner;

  return {
    stage,
    me,
    partner,
    coupleName: couple?.name ?? null,
    anniversaryLabel: formatAnniversary(couple?.anniversaryDate),
    isSolo,
    inviteCode: couple?.inviteCode ?? null,
    stats,
    refresh: load,
  };
}
