import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FoodSpotsStackParamList } from '../../navigation';
import { foodSpotsApi } from '../../lib/api';
import type { FoodSpot } from '../../types';

type Nav = NativeStackNavigationProp<FoodSpotsStackParamList>;

export function useFoodSpotsViewModel() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const [activeTag, setActiveTag] = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: foodSpots = [], isLoading, isRefetching } = useQuery({
    queryKey: ['foodspots'],
    queryFn: foodSpotsApi.list,
    staleTime: 30_000,
  });

  // ── Derived: unique tags ───────────────────────────────────────────────────

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    foodSpots.forEach(s => s.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [foodSpots]);

  // ── Derived: filtered ─────────────────────────────────────────────────────

  const filteredSpots = useMemo<FoodSpot[]>(() => {
    if (!activeTag) return foodSpots;
    return foodSpots.filter(s => s.tags.includes(activeTag));
  }, [foodSpots, activeTag]);

  // ── Derived: two columns for masonry layout ───────────────────────────────

  const { leftColumn, rightColumn } = useMemo(() => {
    const left: FoodSpot[] = [];
    const right: FoodSpot[] = [];
    filteredSpots.forEach((s, i) => {
      if (i % 2 === 0) left.push(s);
      else right.push(s);
    });
    return { leftColumn: left, rightColumn: right };
  }, [filteredSpots]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTagPress = (tag: string | null) => setActiveTag(tag);

  const handleSpotPress = (foodSpotId: string) => {
    navigation.navigate('FoodSpotDetail', { foodSpotId });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['foodspots'] });
  };

  return {
    isLoading,
    isRefetching,
    allTags,
    activeTag,
    leftColumn,
    rightColumn,
    isEmpty: filteredSpots.length === 0,
    handleTagPress,
    handleSpotPress,
    handleRefresh,
  };
}
