import { useCallback, useEffect, useMemo, useState } from 'react';

import { listReceived, listSent, type LetterRow } from '@/api/letters';
import { apiClient, ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useLettersStore } from '@/stores/lettersStore';

// T421 (Sprint 65) — Letters Inbox VM. Mirrors useMomentsViewModel.
//
// Fetches /api/love-letters/received + /api/love-letters/sent in parallel
// on mount. Re-fetches when `lettersStore.version` bumps (T422/T423 flows).
//
// Tabs:
//   inbox     → received (BE returns DELIVERED + READ for the recipient)
//   sent      → sent.filter(DELIVERED|READ) — letters the user has actually mailed
//   scheduled → sent.filter(SCHEDULED)
//   drafts    → sent.filter(DRAFT)
//
// Tab badge count rule (Lu approved Q2 with "render only if >0"):
//   inbox     → unread DELIVERED-not-READ count
//   sent      → total DELIVERED + READ
//   scheduled → SCHEDULED count
//   drafts    → DRAFT count
//
// Partner identity: every LetterRow has full sender + recipient {id, name,
// avatar}. The "partner" is whichever side isn't the current user. When no
// letters exist yet (first install, paired but never wrote), fall back to
// /api/couple lookup so the empty-state copy + Write CTA still know who
// "the other person" is. Solo (unpaired) is OK — Letters tab never displayed
// without a couple in this UX, but fall back gracefully if it ever is.

export type LettersTab = 'inbox' | 'sent' | 'scheduled' | 'drafts';

type ErrorReason = 'network' | 'unknown';

type State = {
  received: LetterRow[];
  sent: LetterRow[];
  loading: boolean;
  refreshing: boolean;
  error: ErrorReason | null;
};

type CouplePartner = { id: string; name: string | null; avatar: string | null };

type CoupleResponseLite = {
  users: { id: string; name: string | null; avatar: string | null }[];
};

const INITIAL: State = {
  received: [],
  sent: [],
  loading: true,
  refreshing: false,
  error: null,
};

function reasonFor(err: unknown): ErrorReason {
  return err instanceof ApiError && err.status === 0 ? 'network' : 'unknown';
}

function deliveredAtKey(letter: LetterRow): number {
  // For DELIVERED + READ rows BE always populates deliveredAt; fall back to
  // createdAt only as a defensive default.
  const iso = letter.deliveredAt ?? letter.createdAt;
  return new Date(iso).getTime();
}

function scheduledAtKey(letter: LetterRow): number {
  const iso = letter.scheduledAt ?? letter.createdAt;
  return new Date(iso).getTime();
}

function updatedAtKey(letter: LetterRow): number {
  return new Date(letter.updatedAt).getTime();
}

export function useLettersViewModel() {
  const version = useLettersStore((s) => s.version);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const userName = useAuthStore((s) => s.user?.name ?? null);
  const coupleId = useAuthStore((s) => s.user?.coupleId ?? null);

  const [state, setState] = useState<State>(INITIAL);
  const [activeTab, setActiveTab] = useState<LettersTab>('inbox');
  const [partnerFromCouple, setPartnerFromCouple] =
    useState<CouplePartner | null>(null);

  const fetchAll = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    } else {
      setState((prev) => ({ ...prev, refreshing: true, error: null }));
    }
    try {
      const [received, sent] = await Promise.all([listReceived(), listSent()]);
      setState({
        received,
        sent,
        loading: false,
        refreshing: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: reasonFor(err),
      }));
    }
  }, []);

  useEffect(() => {
    void fetchAll('initial');
  }, [fetchAll, version]);

  // Derive the partner from any letter row first — fastest path, no extra
  // network call. Falls back to /api/couple only when both inboxes are empty
  // (paired but never corresponded yet).
  const partnerFromLetters = useMemo<CouplePartner | null>(() => {
    if (!userId) return null;
    for (const l of state.received) {
      if (l.sender.id !== userId) {
        return { id: l.sender.id, name: l.sender.name, avatar: l.sender.avatar };
      }
    }
    for (const l of state.sent) {
      if (l.recipient.id !== userId) {
        return {
          id: l.recipient.id,
          name: l.recipient.name,
          avatar: l.recipient.avatar,
        };
      }
    }
    return null;
  }, [state.received, state.sent, userId]);

  useEffect(() => {
    if (state.loading) return;
    if (partnerFromLetters) return;
    if (partnerFromCouple) return;
    if (!coupleId || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<CoupleResponseLite>('/api/couple');
        if (cancelled) return;
        const partner = res.users.find((u) => u.id !== userId) ?? null;
        setPartnerFromCouple(
          partner
            ? { id: partner.id, name: partner.name, avatar: partner.avatar }
            : null,
        );
      } catch {
        if (!cancelled) setPartnerFromCouple(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    state.loading,
    partnerFromLetters,
    partnerFromCouple,
    coupleId,
    userId,
  ]);

  const partner = partnerFromLetters ?? partnerFromCouple;

  const counts = useMemo(() => {
    const inboxUnread = state.received.filter(
      (l) => l.status === 'DELIVERED',
    ).length;
    const sentTotal = state.sent.filter(
      (l) => l.status === 'DELIVERED' || l.status === 'READ',
    ).length;
    const scheduledTotal = state.sent.filter(
      (l) => l.status === 'SCHEDULED',
    ).length;
    const draftTotal = state.sent.filter((l) => l.status === 'DRAFT').length;
    return {
      inbox: inboxUnread,
      sent: sentTotal,
      scheduled: scheduledTotal,
      drafts: draftTotal,
    } as const;
  }, [state.received, state.sent]);

  const inboxLetters = useMemo(
    () =>
      [...state.received].sort(
        (a, b) => deliveredAtKey(b) - deliveredAtKey(a),
      ),
    [state.received],
  );

  const sentLetters = useMemo(
    () =>
      state.sent
        .filter((l) => l.status === 'DELIVERED' || l.status === 'READ')
        .sort((a, b) => deliveredAtKey(b) - deliveredAtKey(a)),
    [state.sent],
  );

  const scheduledLetters = useMemo(
    () =>
      state.sent
        .filter((l) => l.status === 'SCHEDULED')
        .sort((a, b) => scheduledAtKey(a) - scheduledAtKey(b)),
    [state.sent],
  );

  const draftLetters = useMemo(
    () =>
      state.sent
        .filter((l) => l.status === 'DRAFT')
        .sort((a, b) => updatedAtKey(b) - updatedAtKey(a)),
    [state.sent],
  );

  const visibleLetters = useMemo(() => {
    switch (activeTab) {
      case 'inbox':
        return inboxLetters;
      case 'sent':
        return sentLetters;
      case 'scheduled':
        return scheduledLetters;
      case 'drafts':
        return draftLetters;
    }
  }, [activeTab, inboxLetters, sentLetters, scheduledLetters, draftLetters]);

  const onRefresh = useCallback(() => {
    void fetchAll('refresh');
  }, [fetchAll]);

  return {
    // request lifecycle
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    onRefresh,
    reload: () => fetchAll('initial'),

    // identity (Lu approved hero footer rule)
    currentUserId: userId,
    currentUserName: userName,
    partnerName: partner?.name ?? null,
    partnerAvatar: partner?.avatar ?? null,
    hasCouple: !!coupleId,

    // tabs
    activeTab,
    setActiveTab,
    counts,

    // tab letters
    inboxLetters,
    sentLetters,
    scheduledLetters,
    draftLetters,
    visibleLetters,

    // raw store (unused externally for now, exposed in case T422 mark-read
    // flow wants to peek without re-fetching)
    received: state.received,
    sent: state.sent,
  };
}
