import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DatePlannerStackParamList } from '../../navigation';
import { dateWishesApi } from '../../lib/api';
import type { DateWish } from '../../types';

export type WishStatusFilter = 'all' | 'pending' | 'done';

type Nav = NativeStackNavigationProp<DatePlannerStackParamList>;

export const WISH_CATEGORIES = [
  { key: 'food', emoji: '🍽️', label: 'Food' },
  { key: 'entertainment', emoji: '🎭', label: 'Entertainment' },
  { key: 'adventure', emoji: '🏕️', label: 'Adventure' },
  { key: 'romance', emoji: '💕', label: 'Romance' },
  { key: 'travel', emoji: '✈️', label: 'Travel' },
  { key: 'culture', emoji: '🎨', label: 'Culture' },
  { key: 'wellness', emoji: '🧘', label: 'Wellness' },
  { key: 'other', emoji: '⭐', label: 'Other' },
];

export function useWishesViewModel() {
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
    handleNavigatePlans: () => navigation.navigate('PlansList'),
    handleBack: () => navigation.goBack(),
  };
}
