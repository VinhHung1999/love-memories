import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MomentsStackParamList } from '../../navigation';
import { momentsApi } from '../../lib/api';
import type { Moment } from '../../types';

type Nav = NativeStackNavigationProp<MomentsStackParamList>;

const pad = (n: number) => String(n).padStart(2, '0');
const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function useMomentsViewModel() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  // ── Calendar state ─────────────────────────────────────────────────────────

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: moments = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['moments'],
    queryFn: momentsApi.list,
    staleTime: 30_000,
  });

  // ── Derived: moments for selected month ───────────────────────────────────

  const monthMoments = useMemo(() => {
    return moments.filter(m => {
      const d = new Date(m.date);
      return d.getFullYear() === selectedMonth.year && d.getMonth() === selectedMonth.month;
    });
  }, [moments, selectedMonth]);

  // ── Derived: days that have moments (Set of 'YYYY-MM-DD') ─────────────────

  const daysWithMoments = useMemo(() => {
    const s = new Set<string>();
    monthMoments.forEach(m => s.add(m.date.slice(0, 10)));
    return s;
  }, [monthMoments]);

  // ── Derived: timeline groups newest first ─────────────────────────────────

  const timelineGroups = useMemo(() => {
    const map = new Map<string, Moment[]>();
    monthMoments.forEach(m => {
      const key = m.date.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateStr, items]) => ({
        dateStr,
        label: dateStr.slice(8, 10) + '/' + dateStr.slice(5, 7),
        moments: items.sort((a, b) => b.date.localeCompare(a.date)),
      }));
  }, [monthMoments]);

  // ── Derived: 42-cell calendar grid (Mon-first) ────────────────────────────

  const calendarCells = useMemo(() => {
    const { year, month } = selectedMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = (firstDay + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [selectedMonth]);

  // ── Today string ──────────────────────────────────────────────────────────

  const todayStr = useMemo(() => toDateStr(new Date()), []);

  // ── Auto-select today's day when month matches ────────────────────────────

  useEffect(() => {
    const now = new Date();
    if (
      selectedMonth.year === now.getFullYear() &&
      selectedMonth.month === now.getMonth()
    ) {
      setSelectedDay(todayStr);
    } else {
      setSelectedDay(null);
    }
  }, [selectedMonth, todayStr]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const goToPrevMonth = () => setSelectedMonth(prev => {
    const m = prev.month === 0 ? 11 : prev.month - 1;
    const y = prev.month === 0 ? prev.year - 1 : prev.year;
    return { year: y, month: m };
  });

  const goToNextMonth = () => setSelectedMonth(prev => {
    const m = prev.month === 11 ? 0 : prev.month + 1;
    const y = prev.month === 11 ? prev.year + 1 : prev.year;
    return { year: y, month: m };
  });

  const handleDayPress = (day: number) => {
    const dateStr = `${selectedMonth.year}-${pad(selectedMonth.month + 1)}-${pad(day)}`;
    setSelectedDay(prev => prev === dateStr ? null : dateStr);
  };

  const handleMomentPress = (momentId: string) => {
    navigation.navigate('MomentDetail', { momentId });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['moments'] });
  };

  return {
    isLoading,
    isRefetching,
    selectedMonth,
    selectedDay,
    calendarCells,
    daysWithMoments,
    timelineGroups,
    monthMoments,
    todayStr,
    isEmpty: monthMoments.length === 0,
    goToPrevMonth,
    goToNextMonth,
    handleDayPress,
    handleMomentPress,
    handleRefresh,
    refetch,
  };
}
