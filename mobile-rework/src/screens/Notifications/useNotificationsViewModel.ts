import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from '@/api/notifications';
import { ApiError } from '@/lib/apiClient';
import { useNotificationsStore } from '@/stores/notificationsStore';

// T425 (Sprint 65) — Notifications VM. Single fetch on mount, refetches
// on `notificationsStore.version` bumps. Bucketing into today /
// yesterday / earlier happens client-side off `createdAt`. Tab filter
// (all / us / reminders) maps the loose BE `type` string into the
// prototype's "kind" abstraction; unknown types fall back to the
// generic 'reminder' bucket so they show up under Reminders rather
// than disappear.

export type NotifKind =
  | 'moment'
  | 'letter'
  | 'reaction'
  | 'comment'
  | 'place'
  | 'recap'
  | 'daily'
  | 'streak'
  | 'invite'
  | 'anniv'
  | 'fallback';

export type NotifGroup = 'today' | 'yesterday' | 'earlier';

export type NotifTab = 'all' | 'us' | 'reminders';

export type NotificationView = NotificationRow & {
  kind: NotifKind;
  group: NotifGroup;
};

const US_KINDS: NotifKind[] = [
  'moment',
  'letter',
  'reaction',
  'comment',
  'place',
];
const REMINDER_KINDS: NotifKind[] = [
  'recap',
  'daily',
  'streak',
  'invite',
  'anniv',
  'fallback',
];

// BE notification type (loose string) → mobile kind. Unknown types fall
// through to 'fallback' under Reminders. See Sprint 65 T425 plan recall.
function kindFromType(type: string): NotifKind {
  switch (type) {
    case 'love_letter':
      return 'letter';
    case 'new_moment':
      return 'moment';
    case 'new_comment':
      return 'comment';
    case 'new_reaction':
      return 'reaction';
    case 'weekly_recap':
    case 'monthly_recap':
      return 'recap';
    case 'daily_plan_reminder':
      return 'daily';
    case 'achievement_unlocked':
    case 'new_recipe':
    case 'new_date_wish':
    default:
      return 'fallback';
  }
}

function groupFromCreatedAt(iso: string): NotifGroup {
  const created = new Date(iso);
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  if (created >= todayStart) return 'today';
  if (created >= yesterdayStart) return 'yesterday';
  return 'earlier';
}

type ErrorReason = 'network' | 'unknown';

type State = {
  rows: NotificationRow[];
  loading: boolean;
  refreshing: boolean;
  error: ErrorReason | null;
};

const INITIAL: State = {
  rows: [],
  loading: true,
  refreshing: false,
  error: null,
};

function reasonFor(err: unknown): ErrorReason {
  return err instanceof ApiError && err.status === 0 ? 'network' : 'unknown';
}

export function useNotificationsViewModel() {
  const version = useNotificationsStore((s) => s.version);
  const invalidate = useNotificationsStore((s) => s.invalidate);
  const [state, setState] = useState<State>(INITIAL);
  const [activeTab, setActiveTab] = useState<NotifTab>('all');

  const fetchAll = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    } else {
      setState((prev) => ({ ...prev, refreshing: true, error: null }));
    }
    try {
      const rows = await listNotifications();
      setState({
        rows,
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

  const onRefresh = useCallback(() => {
    void fetchAll('refresh');
  }, [fetchAll]);

  const enriched = useMemo<NotificationView[]>(
    () =>
      state.rows.map((row) => ({
        ...row,
        kind: kindFromType(row.type),
        group: groupFromCreatedAt(row.createdAt),
      })),
    [state.rows],
  );

  const filtered = useMemo(() => {
    if (activeTab === 'all') return enriched;
    const allowedKinds = activeTab === 'us' ? US_KINDS : REMINDER_KINDS;
    return enriched.filter((n) => allowedKinds.includes(n.kind));
  }, [enriched, activeTab]);

  const grouped = useMemo(() => {
    const buckets: Record<NotifGroup, NotificationView[]> = {
      today: [],
      yesterday: [],
      earlier: [],
    };
    for (const row of filtered) buckets[row.group].push(row);
    return buckets;
  }, [filtered]);

  const unreadCount = useMemo(
    () => state.rows.filter((r) => !r.read).length,
    [state.rows],
  );

  const markRead = useCallback(
    async (id: string) => {
      // Optimistic local update so the dot disappears immediately;
      // BE call runs in the background and a failure leaves the row
      // displayed-as-read locally — acceptable trade-off versus a
      // jittery UI.
      setState((prev) => ({
        ...prev,
        rows: prev.rows.map((r) =>
          r.id === id ? { ...r, read: true } : r,
        ),
      }));
      try {
        await markNotificationRead(id);
      } catch {
        /* swallow */
      }
      invalidate();
    },
    [invalidate],
  );

  const markAllRead = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      rows: prev.rows.map((r) => ({ ...r, read: true })),
    }));
    try {
      await markAllNotificationsRead();
    } catch {
      /* swallow */
    }
    invalidate();
  }, [invalidate]);

  return {
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    onRefresh,
    reload: () => fetchAll('initial'),

    activeTab,
    setActiveTab,

    rows: enriched,
    filtered,
    grouped,
    unreadCount,

    markRead,
    markAllRead,
  };
}
