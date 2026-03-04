import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RecipesStackParamList } from '../../navigation';
import { recipesApi } from '../../lib/api';
import type { Recipe } from '../../types';

type Nav = NativeStackNavigationProp<RecipesStackParamList>;

export type RecipeFilter = 'all' | 'cooked' | 'uncooked';

export function useRecipesViewModel() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<RecipeFilter>('all');

  // ── Data ────────────────────────────────────────────────────────────────────

  const { data: recipes = [], isLoading, isRefetching } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesApi.list,
    staleTime: 30_000,
  });

  // ── Derived ─────────────────────────────────────────────────────────────────

  const filtered = useMemo<Recipe[]>(() => {
    if (filter === 'cooked') return recipes.filter(r => r.cooked);
    if (filter === 'uncooked') return recipes.filter(r => !r.cooked);
    return recipes;
  }, [recipes, filter]);

  const { leftColumn, rightColumn } = useMemo(() => {
    const left: Recipe[] = [];
    const right: Recipe[] = [];
    filtered.forEach((r, i) => {
      if (i % 2 === 0) left.push(r);
      else right.push(r);
    });
    return { leftColumn: left, rightColumn: right };
  }, [filtered]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRecipePress = (recipeId: string) => {
    navigation.navigate('RecipeDetail', { recipeId });
  };

  const handleWhatToEat = () => {
    navigation.navigate('WhatToEat');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
  };

  return {
    isLoading,
    isRefetching,
    filter,
    setFilter,
    leftColumn,
    rightColumn,
    isEmpty: filtered.length === 0,
    totalCount: recipes.length,
    handleRecipePress,
    handleWhatToEat,
    handleRefresh,
  };
}
