import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiClient, ApiError } from '@/lib/apiClient';
import { useMomentsStore } from '@/stores/momentsStore';

// T376 (Sprint 62) — Moments list VM. Backend `GET /api/moments` returns the
// full couple's timeline in one shot (no server pagination yet — Boss locked
// "no BE work this sprint"). We paginate client-side: fetch once, slice into
// pages of PAGE_SIZE as `onEndReached` fires. Pull-to-refresh re-fetches.
//
// Subscribes to `momentsStore.version` so the list auto-refreshes after a new
// moment is created (T378 upload flow bumps `version` after POST + again
// after first photo + on last photo).
//
// T384 (Sprint 62) — Calendar-view extension. Same fetch + version wiring,
// adds calendar state ON TOP of the existing signature. Kept `moments`,
// `total`, `hasMore`, `onEndReached`, `reload` returned so anyone still
// consuming the timeline flow keeps working. New returns:
//   viewMode / setViewMode — month | week toggle
//   monthOffset / prevMonth / nextMonth — navigate months (0 = today's)
//   monthLabel — localized "Tháng Ba 2026" / "March 2026"
//   grid — array of DayCell | null (leading nulls for weekday offset); null
//          slots let the View render <View /> placeholders to keep the
//          7-col grid aligned.
//   weekGrid — same shape, 7 cells containing selectedDay's week
//   selectedDay — YYYY-MM-DD local-time key (default = today)
//   setSelectedDay — tap twice same day = revert to today
//   selectedDayMoments — MomentRow[] for the selected day
//   daysWithMomentsCount — count of unique days with ≥1 moment (legend)
//
// Date-key rule: local-time `${y}-${mm}-${dd}`. Intl/UTC-based slicing caused
// off-by-one buckets in prior features — Lu's explicit reminder for T384.

export type MomentPhoto = {
  id: string;
  url: string;
  filename: string;
};

export type MomentRow = {
  id: string;
  title: string;
  caption: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  photos: MomentPhoto[];
};

export type DayCell = {
  day: number;
  dateKey: string;
  hasMoments: boolean;
  count: number;
  isToday: boolean;
  isSelected: boolean;
};

export type ViewMode = 'month' | 'week';

const PAGE_SIZE = 20;

type ErrorReason = 'network' | 'unknown';

type State = {
  all: MomentRow[];
  pageCount: number;
  loading: boolean;
  refreshing: boolean;
  error: ErrorReason | null;
};

const INITIAL: State = {
  all: [],
  pageCount: 1,
  loading: true,
  refreshing: false,
  error: null,
};

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return dateKey(new Date());
}

export function useMomentsViewModel() {
  const version = useMomentsStore((s) => s.version);
  const [state, setState] = useState<State>(INITIAL);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDayRaw] = useState<string>(() => todayKey());

  const fetchAll = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'initial') {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    } else {
      setState((prev) => ({ ...prev, refreshing: true, error: null }));
    }
    try {
      const rows = await apiClient.get<MomentRow[]>('/api/moments');
      setState({
        all: rows,
        pageCount: 1,
        loading: false,
        refreshing: false,
        error: null,
      });
    } catch (err) {
      const reason: ErrorReason =
        err instanceof ApiError && err.status === 0 ? 'network' : 'unknown';
      setState((prev) => ({
        ...prev,
        loading: false,
        refreshing: false,
        error: reason,
      }));
    }
  }, []);

  useEffect(() => {
    void fetchAll('initial');
  }, [fetchAll, version]);

  const onRefresh = useCallback(() => {
    void fetchAll('refresh');
  }, [fetchAll]);

  const onEndReached = useCallback(() => {
    setState((prev) => {
      const nextCount = prev.pageCount + 1;
      if (nextCount * PAGE_SIZE >= prev.all.length) {
        return { ...prev, pageCount: Math.ceil(prev.all.length / PAGE_SIZE) || 1 };
      }
      return { ...prev, pageCount: nextCount };
    });
  }, []);

  const visible = useMemo(
    () => state.all.slice(0, state.pageCount * PAGE_SIZE),
    [state.all, state.pageCount],
  );

  const hasMore = state.pageCount * PAGE_SIZE < state.all.length;

  const grouped = useMemo(() => {
    const map: Record<string, MomentRow[]> = {};
    for (const m of state.all) {
      // moment.date is an ISO string from BE. Parse + convert to local-time
      // YYYY-MM-DD so users in +07:00 see their local calendar, not UTC.
      const key = dateKey(new Date(m.date));
      if (!map[key]) map[key] = [];
      map[key].push(m);
    }
    return map;
  }, [state.all]);

  const daysWithMomentsCount = useMemo(
    () => Object.keys(grouped).length,
    [grouped],
  );

  const monthAnchor = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = useMemo(() => monthAnchor, [monthAnchor]);

  const grid = useMemo<(DayCell | null)[]>(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = todayKey();
    const cells: (DayCell | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const k = dateKey(new Date(year, month, d));
      const moments = grouped[k] ?? [];
      cells.push({
        day: d,
        dateKey: k,
        hasMoments: moments.length > 0,
        count: moments.length,
        isToday: k === today,
        isSelected: k === selectedDay,
      });
    }
    return cells;
  }, [monthAnchor, grouped, selectedDay]);

  const weekGrid = useMemo<(DayCell | null)[]>(() => {
    // Week containing `selectedDay`, Sun→Sat.
    const [y, m, d] = selectedDay.split('-').map((n) => parseInt(n, 10));
    const anchor = new Date(y, (m ?? 1) - 1, d ?? 1);
    const weekday = anchor.getDay(); // 0 = Sun
    const sunday = new Date(anchor);
    sunday.setDate(anchor.getDate() - weekday);
    const today = todayKey();
    const cells: (DayCell | null)[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(sunday);
      cur.setDate(sunday.getDate() + i);
      const k = dateKey(cur);
      const moments = grouped[k] ?? [];
      cells.push({
        day: cur.getDate(),
        dateKey: k,
        hasMoments: moments.length > 0,
        count: moments.length,
        isToday: k === today,
        isSelected: k === selectedDay,
      });
    }
    return cells;
  }, [selectedDay, grouped]);

  const selectedDayMoments = useMemo(
    () => grouped[selectedDay] ?? [],
    [grouped, selectedDay],
  );

  const setSelectedDay = useCallback((key: string) => {
    setSelectedDayRaw((prev) => (prev === key ? todayKey() : key));
  }, []);

  const prevMonth = useCallback(() => setMonthOffset((v) => v - 1), []);
  const nextMonth = useCallback(() => setMonthOffset((v) => v + 1), []);

  return {
    // timeline (existing contract — do not break)
    moments: visible,
    total: state.all.length,
    loading: state.loading,
    refreshing: state.refreshing,
    error: state.error,
    hasMore,
    onRefresh,
    onEndReached,
    reload: () => fetchAll('initial'),

    // calendar (T384)
    viewMode,
    setViewMode,
    monthOffset,
    monthAnchor: monthLabel,
    prevMonth,
    nextMonth,
    grid,
    weekGrid,
    selectedDay,
    setSelectedDay,
    selectedDayMoments,
    daysWithMomentsCount,
  };
}
