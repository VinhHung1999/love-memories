import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, type Expense, type ExpenseCategory } from '../../lib/api';
import { formatVND, getCategoryEmoji, EXPENSE_CATEGORIES } from './expensesConstants';

export type CategoryFilter = ExpenseCategory | 'all';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function useExpensesViewModel() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(new Date());
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const currentMonthKey = monthKey(new Date());
  const selectedMonthKey = monthKey(month);
  const isCurrentMonth = selectedMonthKey === currentMonthKey;

  const { data: expenses = [], isLoading, refetch } = useQuery({
    queryKey: ['expenses', selectedMonthKey],
    queryFn: () => expensesApi.list(selectedMonthKey),
  });

  const { data: stats } = useQuery({
    queryKey: ['expenses-stats', selectedMonthKey],
    queryFn: () => expensesApi.stats(selectedMonthKey),
  });

  const deleteMutation = useMutation({
    mutationFn: expensesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
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

  // Category breakdown for summary card
  const categoryBreakdown = useMemo(() => {
    if (!stats) return [];
    const total = stats.total || 1;
    return EXPENSE_CATEGORIES
      .filter(c => c.key !== 'all')
      .map(c => {
        const cat = stats.byCategory[c.key as ExpenseCategory];
        const amount = cat?.total ?? 0;
        return {
          key: c.key,
          emoji: c.emoji,
          label: c.label,
          amount,
          percentage: Math.round((amount / total) * 100),
          formattedAmount: formatVND(amount),
        };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [stats]);

  const prevMonth = useCallback(() => {
    setMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }, []);

  const nextMonth = useCallback(() => {
    if (isCurrentMonth) return;
    setMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }, [isCurrentMonth]);

  const handleExpensePress = useCallback((expense: Expense) => {
    setEditingExpense(expense);
    setShowAddSheet(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingExpense(null);
    setShowAddSheet(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setShowAddSheet(false);
    setEditingExpense(null);
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['expenses-stats'] });
  }, [queryClient]);

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  return {
    // state
    monthLabel: monthLabel(month),
    isCurrentMonth,
    activeCategory,
    setActiveCategory,
    editingExpense,
    showAddSheet,
    // data
    isLoading,
    refetch,
    groupedExpenses,
    isEmpty: filtered.length === 0 && !isLoading,
    totalAmount: stats?.total ?? 0,
    totalCount: stats?.count ?? 0,
    categoryBreakdown,
    formattedTotal: formatVND(stats?.total ?? 0),
    // actions
    prevMonth,
    nextMonth,
    handleExpensePress,
    handleAdd,
    handleSheetClose,
    handleDelete,
  };
}
