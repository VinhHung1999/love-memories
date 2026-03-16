import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DatePlannerStackParamList } from '../../navigation';
import { dateWishesApi } from '../../lib/api';
import type { DateWish } from '../../types';
import { useTranslation } from 'react-i18next';
import type { AlertParams } from '../../navigation/useAppNavigation';

export type WishStatusFilter = 'all' | 'pending' | 'done';

type Nav = NativeStackNavigationProp<DatePlannerStackParamList>;

export function useWishesViewModel() {
  const { t } = useTranslation();

  const wishCategories = useMemo(() => [
    { key: 'food', emoji: '🍽️', label: t('datePlanner.categoryLabels.food') },
    { key: 'entertainment', emoji: '🎭', label: t('datePlanner.categoryLabels.entertainment') },
    { key: 'adventure', emoji: '🏕️', label: t('datePlanner.categoryLabels.adventure') },
    { key: 'romance', emoji: '💕', label: t('datePlanner.categoryLabels.romance') },
    { key: 'travel', emoji: '✈️', label: t('datePlanner.categoryLabels.travel') },
    { key: 'culture', emoji: '🎨', label: t('datePlanner.categoryLabels.culture') },
    { key: 'wellness', emoji: '🧘', label: t('datePlanner.categoryLabels.wellness') },
    { key: 'other', emoji: '⭐', label: t('datePlanner.categoryLabels.other') },
  ], [t]);
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<WishStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { data: wishes = [], isLoading, isRefetching } = useQuery({
    queryKey: ['wishes'],
    queryFn: dateWishesApi.list,
    staleTime: 30_000,
  });

  const markDoneMutation = useMutation({
    mutationFn: (id: string) => dateWishesApi.markDone(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishes'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dateWishesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishes'] }),
  });

  const filtered = useMemo<DateWish[]>(() => {
    let list = wishes;
    if (statusFilter === 'pending') list = list.filter(w => !w.done);
    else if (statusFilter === 'done') list = list.filter(w => w.done);
    if (categoryFilter) list = list.filter(w => w.category === categoryFilter);
    return list;
  }, [wishes, statusFilter, categoryFilter]);

  return {
    wishes: filtered,
    wishCategories,
    isLoading,
    isRefetching,
    isEmpty: filtered.length === 0,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    handleRefresh: () => queryClient.invalidateQueries({ queryKey: ['wishes'] }),
    handleMarkDone: (id: string) => markDoneMutation.mutate(id),
    handleDelete: (id: string) => deleteMutation.mutate(id),
    handleDeleteWithConfirm: (id: string, showAlert: (p: AlertParams) => void) => {
      showAlert({
        title: t('datePlanner.deleteWish'),
        message: t('datePlanner.deleteWishConfirm'),
        type: 'destructive',
        confirmLabel: t('common.delete'),
        onConfirm: () => deleteMutation.mutate(id),
      });
    },
    handleNavigatePlans: () => navigation.navigate('PlansList'),
    handleBack: () => navigation.goBack(),
  };
}

/** Standalone hook for components that need wish categories without the full VM */
export function useWishCategories() {
  const { t } = useTranslation();
  return useMemo(() => [
    { key: 'food', emoji: '🍽️', label: t('datePlanner.categoryLabels.food') },
    { key: 'entertainment', emoji: '🎭', label: t('datePlanner.categoryLabels.entertainment') },
    { key: 'adventure', emoji: '🏕️', label: t('datePlanner.categoryLabels.adventure') },
    { key: 'romance', emoji: '💕', label: t('datePlanner.categoryLabels.romance') },
    { key: 'travel', emoji: '✈️', label: t('datePlanner.categoryLabels.travel') },
    { key: 'culture', emoji: '🎨', label: t('datePlanner.categoryLabels.culture') },
    { key: 'wellness', emoji: '🧘', label: t('datePlanner.categoryLabels.wellness') },
    { key: 'other', emoji: '⭐', label: t('datePlanner.categoryLabels.other') },
  ], [t]);
}
