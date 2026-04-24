import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  addComment as apiAddComment,
  deleteComment as apiDeleteComment,
  deleteMoment as apiDeleteMoment,
  listComments as apiListComments,
  toggleReaction as apiToggleReaction,
  type MomentCommentRow,
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

// T387 — author echoed from BE so the AuthorPill can pick its gradient
// variant (currentUser.id === author.id → heroA→heroB, else partner).
export type MomentAuthor = {
  id: string;
  name: string;
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
  author: MomentAuthor;
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

// T401 — polling cadence for the comments thread while MomentDetail is
// focused. Every 10s refetches `/api/moments/:id/comments`. Interval is
// cleared on blur (useFocusEffect cleanup) and on unmount so the timer
// doesn't fire past navigation.
const COMMENTS_POLL_MS = 10_000;

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
  const currentUserId = useAuthStore((s) => s.user?.id ?? null);
  const currentUserName = useAuthStore((s) => s.user?.name ?? null);
  const [state, setState] = useState<State>({
    moment: null,
    loading: true,
    error: null,
  });
  const [removing, setRemoving] = useState(false);
  const [comments, setComments] = useState<MomentCommentRow[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [posting, setPosting] = useState(false);

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

  // T401 — comments fetch + polling every 10s while focused. The
  // useFocusEffect cleanup clears the interval on blur (navigating to
  // another screen) and on unmount, so no timer fires past navigation.
  // The alivedRef guard also stops a late-response setState if the
  // fetch overlaps unmount.
  const alivedRef = useRef(true);
  useEffect(() => {
    alivedRef.current = true;
    return () => {
      alivedRef.current = false;
    };
  }, []);

  const loadComments = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!id) return;
      try {
        const rows = await apiListComments(id);
        if (!alivedRef.current) return;
        setComments(rows);
        setCommentsLoaded(true);
      } catch {
        if (!opts?.silent && alivedRef.current) {
          setCommentsLoaded(true);
        }
      }
    },
    [id],
  );

  useFocusEffect(
    useCallback(() => {
      if (!id) return undefined;
      void loadComments();
      const timer = setInterval(() => {
        void loadComments({ silent: true });
      }, COMMENTS_POLL_MS);
      return () => {
        clearInterval(timer);
      };
    }, [id, loadComments]),
  );

  const postComment = useCallback(
    async (content: string): Promise<boolean> => {
      const trimmed = content.trim();
      if (!id || !trimmed || !currentUserName || posting) return false;
      const tmpId = `tmp-${Date.now()}`;
      const optimistic: MomentCommentRow = {
        id: tmpId,
        momentId: id,
        userId: currentUserId,
        author: currentUserName,
        content: trimmed,
        createdAt: new Date().toISOString(),
        user: currentUserName
          ? { name: currentUserName, avatar: null }
          : null,
      };
      setComments((prev) => [...prev, optimistic]);
      setPosting(true);
      try {
        const row = await apiAddComment(id, currentUserName, trimmed);
        if (!alivedRef.current) return true;
        setComments((prev) =>
          prev.map((c) => (c.id === tmpId ? row : c)),
        );
        return true;
      } catch {
        if (alivedRef.current) {
          setComments((prev) => prev.filter((c) => c.id !== tmpId));
        }
        return false;
      } finally {
        if (alivedRef.current) setPosting(false);
      }
    },
    [id, currentUserId, currentUserName, posting],
  );

  const removeComment = useCallback(
    async (commentId: string): Promise<boolean> => {
      if (!id) return false;
      // Optimistic remove — snapshot for rollback on failure.
      const snapshot = comments;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      try {
        await apiDeleteComment(id, commentId);
        return true;
      } catch {
        if (alivedRef.current) setComments(snapshot);
        return false;
      }
    },
    [id, comments],
  );

  return {
    ...state,
    reload: load,
    remove,
    removing,
    react,
    reactions: reactionAggregates,
    comments,
    commentsLoaded,
    postComment,
    removeComment,
    posting,
    currentUserId,
  };
}
