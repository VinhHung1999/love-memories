import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MomentsStackParamList } from '../../navigation';
import { momentsApi } from '../../lib/api';
import type { Moment } from '../../types';

type Nav = NativeStackNavigationProp<MomentsStackParamList>;

export function useMomentsViewModel() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const [activeTag, setActiveTag] = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: moments = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['moments'],
    queryFn: momentsApi.list,
    staleTime: 30_000,
  });

  // ── Derived: unique tags ───────────────────────────────────────────────────

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    moments.forEach(m => m.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [moments]);

  // ── Derived: filtered list ─────────────────────────────────────────────────

  const filteredMoments = useMemo<Moment[]>(() => {
    if (!activeTag) return moments;
    return moments.filter(m => m.tags.includes(activeTag));
  }, [moments, activeTag]);

  // ── Derived: two columns for masonry layout ───────────────────────────────

  const { leftColumn, rightColumn } = useMemo(() => {
    const left: Moment[] = [];
    const right: Moment[] = [];
    filteredMoments.forEach((m, i) => {
      if (i % 2 === 0) left.push(m);
      else right.push(m);
    });
    return { leftColumn: left, rightColumn: right };
  }, [filteredMoments]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTagPress = (tag: string | null) => setActiveTag(tag);

  const handleMomentPress = (momentId: string) => {
    navigation.navigate('MomentDetail', { momentId });
  };

  const handleCreatePress = () => {
    navigation.navigate('CreateMoment', {});
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['moments'] });
  };

  return {
    isLoading,
    isRefetching,
    allTags,
    activeTag,
    leftColumn,
    rightColumn,
    isEmpty: filteredMoments.length === 0,
    handleTagPress,
    handleMomentPress,
    handleCreatePress,
    handleRefresh,
    refetch,
  };
}
