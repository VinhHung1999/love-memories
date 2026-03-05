import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, type Expense, type ExpenseCategory, type DailyStats } from '../../lib/api';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { formatVND, EXPENSE_CATEGORIES } from './expensesConstants';
import AddExpenseSheet from './AddExpenseSheet';
import BudgetLimitsSheet from './BudgetLimitsSheet';

export type CategoryFilter = ExpenseCategory | 'all';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function useExpensesViewModel() {
  const queryClient = useQueryClient();
  const navigation = useAppNavigation();
  const [month, setMonth] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const currentMonthKey = useMemo(() => monthKey(new Date()), []);
  const selectedMonthKey = useMemo(() => monthKey(month), [month]);
  const isCurrentMonth = useMemo(() => selectedMonthKey === currentMonthKey, [selectedMonthKey, currentMonthKey]);

  const { data: expenses = [], isLoading, refetch } = useQuery({
    queryKey: ['expenses', selectedMonthKey],
    queryFn: () => expensesApi.list(selectedMonthKey),
  });

  const { data: stats } = useQuery({
    queryKey: ['expenses-stats', selectedMonthKey],
    queryFn: () => expensesApi.stats(selectedMonthKey),
  });

  // Always fetch current month daily stats for the weekly chart
  const { data: currentDailyStats } = useQuery<DailyStats>({
    queryKey: ['expenses-daily', currentMonthKey],
    queryFn: () => expensesApi.dailyStats(currentMonthKey),
    staleTime: 60_000,
  });

  const { data: limits = {} } = useQuery<Record<string, number | null>>({
    queryKey: ['expenses-limits'],
    queryFn: expensesApi.getLimits,
    staleTime: 60_000,
  });

  const deleteMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-daily'] });
    },
  });

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return expenses;
    return expenses.filter(e => e.category === activeCategory);
  }, [expenses, activeCategory]);

  // Group by date (newest first)
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    for (const e of filtered) {
      const d = e.date.slice(0, 10);
      if (!groups[d]) groups[d] = [];
      groups[d].push(e);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        dateLabel: new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric',
        }),
        dayTotal: items.reduce((s, e) => s + e.amount, 0),
        expenses: items,
      }));
  }, [filtered]);

  // Category breakdown for summary card — includes limit info
  const categoryBreakdown = useMemo(() => {
    if (!stats) return [];
    const total = stats.total || 1;
    return EXPENSE_CATEGORIES
      .filter(c => c.key !== 'all')
      .map(c => {
        const cat = stats.byCategory[c.key as ExpenseCategory];
        const amount = cat?.total ?? 0;
        const limit = limits[c.key] ?? null;
        const limitPct = limit !== null && limit > 0 ? Math.round((amount / limit) * 100) : null;
        return {
          key: c.key,
          emoji: c.emoji,
          label: c.label,
          amount,
          percentage: Math.round((amount / total) * 100),
          formattedAmount: formatVND(amount),
          limit,
          limitPct,
          overLimit: limit !== null && amount > limit,
        };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [stats, limits]);

  const prevMonth = useCallback(() => {
    setMonth(prev => {
      const d = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
      return d;
    });
  }, []);

  const nextMonth = useCallback(() => {
    if (isCurrentMonth) return;
    setMonth(prev => {
      const d = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
      return d;
    });
  }, [isCurrentMonth]);

  const handleExpensePress = useCallback((expense: Expense) => {
    navigation.showBottomSheet(AddExpenseSheet, { editingExpense: expense });
  }, [navigation]);

  const handleAdd = useCallback(() => {
    navigation.showBottomSheet(AddExpenseSheet);
  }, [navigation]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const handleOpenBudget = useCallback(() => {
    navigation.showBottomSheet(BudgetLimitsSheet);
  }, [navigation]);

  const handleBack = () => navigation.goBack();


  return {
    // state
    monthLabel: monthLabel(month),
    isCurrentMonth,
    activeCategory,
    setActiveCategory,
    // data
    isLoading,
    refetch,
    groupedExpenses,
    isEmpty: filtered.length === 0 && !isLoading,
    totalAmount: stats?.total ?? 0,
    totalCount: stats?.count ?? 0,
    categoryBreakdown,
    formattedTotal: formatVND(stats?.total ?? 0),
    currentDailyStats: currentDailyStats ?? null,
    limits,
    // actions
    handleBack,
    prevMonth,
    nextMonth,
    handleExpensePress,
    handleAdd,
    handleDelete,
    handleOpenBudget,
  };
}
