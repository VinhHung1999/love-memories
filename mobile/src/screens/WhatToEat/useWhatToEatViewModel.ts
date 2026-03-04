import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RecipesStackParamList } from '../../navigation';
import { recipesApi, cookingSessionsApi } from '../../lib/api';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import type { Recipe } from '../../types';
import t from '../../locales/en';

type Nav = NativeStackNavigationProp<RecipesStackParamList>;

export function useWhatToEatViewModel() {
  const navigation = useNavigation<Nav>();
  const appNavigation = useAppNavigation();
  const queryClient = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Recipes ────────────────────────────────────────────────────────────────

  const { data: recipes = [], isLoading: recipesLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: recipesApi.list,
    staleTime: 30_000,
  });

  // ── Active session check ───────────────────────────────────────────────────

  const { data: activeSession, isLoading: sessionLoading } = useQuery({
    queryKey: ['cooking-session-active'],
    queryFn: cookingSessionsApi.active,
    staleTime: 10_000,
  });

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedRecipes = useMemo<Recipe[]>(() => {
    return recipes.filter(r => selectedIds.has(r.id));
  }, [recipes, selectedIds]);

  // ── Create session mutation ────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: () => cookingSessionsApi.create(Array.from(selectedIds)),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ['cooking-session-active'] });
      queryClient.invalidateQueries({ queryKey: ['cooking-sessions'] });
      navigation.navigate('CookingSession', { sessionId: session.id });
    },
    onError: (err: Error) =>
      appNavigation.showAlert({ type: 'error', title: t.common.error, message: err.message || t.whatToEat.errors.createFailed }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleRecipe = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = () => {
    if (selectedIds.size === 0) return;
    createMutation.mutate();
  };

  const handleResumeSession = () => {
    if (activeSession) {
      navigation.navigate('CookingSession', { sessionId: activeSession.id });
    }
  };

  const handleViewHistory = () => {
    navigation.navigate('CookingHistory');
  };

  const handleBack = () => navigation.goBack();

  return {
    recipes,
    isLoading: recipesLoading || sessionLoading,
    activeSession,
    selectedIds,
    selectedRecipes,
    isCreating: createMutation.isPending,
    toggleRecipe,
    handleStart,
    handleResumeSession,
    handleViewHistory,
    handleBack,
  };
}
