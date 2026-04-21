import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  deleteMoment as apiDeleteMoment,
  toggleReaction as apiToggleReaction,
  type MomentReactionRow,
  getMoment,
} from '@/api/moments';
import { ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useMomentsStore } from '@/stores/momentsStore';

// T379 (Sprint 62) — ViewModel for MomentDetail. Reads `moments/:id` and
// subscribes to `useMomentsStore.version` so the detail page refetches when
// T378 enqueued photo uploads trickle in (the moment row exists before
// photos finish uploading — each photo success bumps the store).
//
// T398 (Sprint 63) — adds `remove()` for the more-dots → Delete flow.
// Success invalidates the moments store so the list refetches without the
// deleted card before the user navigates back.

export type MomentPhoto = {
  id: string;
  url: string;
  filename: string;
};

export type MomentDetail = {
  id: string;
  title: string;
  caption: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  photos: MomentPhoto[];
  tags: string[];
  location: string | null;
  reactions: MomentReactionRow[];
};

// T400 — prototype mobile picks 6 of the BE's 9-whitelist in this order.
// moments.jsx L625-645. Server still accepts the full 9 so legacy reactions
// from mobile/ don't 400 on fetch.
export const REACTION_EMOJIS: readonly string[] = [
  '❤️',
  '🥺',
  '😍',
  '😂',
  '🔥',
  '✨',
];

export type ReactionAggregate = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
};

type ErrorReason = 'network' | 'notFound' | 'unknown';

type State = {
  moment: MomentDetail | null;
  loading: boolean;
  error: ErrorReason | null;
};

export type RemoveResult =
  | { ok: true }
  | { ok: false; reason: 'network' | 'unknown' };

export function useMomentDetailViewModel(id: string | undefined) {
  const version = useMomentsStore((s) => s.version);
  const invalidate = useMomentsStore((s) => s.invalidate);
  const currentUserName = useAuthStore((s) => s.user?.name ?? null);
  const [state, setState] = useState<State>({
    moment: null,
    loading: true,
    error: null,
  });
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setState({ moment: null, loading: false, error: 'notFound' });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const row = await getMoment(id);
      const moment: MomentDetail = {
        ...row,
        reactions: row.reactions ?? [],
      };
      setState({ moment, loading: false, error: null });
    } catch (err) {
      let reason: ErrorReason = 'unknown';
      if (err instanceof ApiError) {
        if (err.status === 404) reason = 'notFound';
        else if (err.status >= 500) reason = 'network';
      }
      setState({ moment: null, loading: false, error: reason });
    }
  }, [id]);

  // T400 — aggregate raw reaction rows into per-emoji pills for the UI.
  // Server returns one row per (momentId, emoji, author); we group by emoji
  // and detect reactedByMe via author name (matches BE's author-keyed
  // toggle unique constraint: momentId + emoji + author).
  const reactionAggregates = useMemo<ReactionAggregate[]>(() => {
    const rows = state.moment?.reactions ?? [];
    return REACTION_EMOJIS.map((emoji) => {
      const matches = rows.filter((r) => r.emoji === emoji);
      return {
        emoji,
        count: matches.length,
        reactedByMe:
          currentUserName !== null &&
          matches.some((r) => r.author === currentUserName),
      };
    });
  }, [state.moment?.reactions, currentUserName]);

  const react = useCallback(
    async (emoji: string) => {
      const moment = state.moment;
      if (!moment || !currentUserName) return;
      if (!REACTION_EMOJIS.includes(emoji)) return;
      // Optimistic toggle: the server's unique constraint is
      // (momentId, emoji, author), so add if missing / remove if present.
      const rows = moment.reactions;
      const existing = rows.find(
        (r) => r.emoji === emoji && r.author === currentUserName,
      );
      const optimistic: MomentReactionRow[] = existing
        ? rows.filter((r) => r.id !== existing.id)
        : [
            ...rows,
            {
              id: `optimistic-${emoji}-${Date.now()}`,
              momentId: moment.id,
              emoji,
              author: currentUserName,
              createdAt: new Date().toISOString(),
            },
          ];
      setState((prev) =>
        prev.moment
          ? { ...prev, moment: { ...prev.moment, reactions: optimistic } }
          : prev,
      );
      try {
        const fresh = await apiToggleReaction(moment.id, emoji, currentUserName);
        setState((prev) =>
          prev.moment
            ? { ...prev, moment: { ...prev.moment, reactions: fresh } }
            : prev,
        );
      } catch {
        // Rollback on failure — restore the pre-toggle list.
        setState((prev) =>
          prev.moment
            ? { ...prev, moment: { ...prev.moment, reactions: rows } }
            : prev,
        );
      }
    },
    [state.moment, currentUserName],
  );

  const remove = useCallback(async (): Promise<RemoveResult> => {
    if (!id || removing) return { ok: false, reason: 'unknown' };
    setRemoving(true);
    try {
      await apiDeleteMoment(id);
      invalidate();
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiError) {
        return { ok: false, reason: err.status >= 500 ? 'network' : 'unknown' };
      }
      return { ok: false, reason: 'unknown' };
    } finally {
      setRemoving(false);
    }
  }, [id, invalidate, removing]);

  useEffect(() => {
    void load();
  }, [load, version]);

  return {
    ...state,
    reload: load,
    remove,
    removing,
    react,
    reactions: reactionAggregates,
  };
}
