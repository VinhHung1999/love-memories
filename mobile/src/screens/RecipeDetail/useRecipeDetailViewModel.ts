import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RecipesStackParamList } from '../../navigation';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { recipesApi, shareApi } from '../../lib/api';
import { Share } from 'react-native';

const APP_BASE_URL = __DEV__ ? 'https://dev-love-scrum.hungphu.work' : 'https://love-scrum.hungphu.work';
import type { RecipePhoto, MomentPhoto } from '../../types';
import { useTranslation } from 'react-i18next';
type Route = RouteProp<RecipesStackParamList, 'RecipeDetail'>;

export function useRecipeDetailViewModel() {
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const route = useRoute<Route>();
  const { recipeId } = route.params;
  const queryClient = useQueryClient();

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: recipe, isLoading } = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => recipesApi.get(recipeId),
    staleTime: 30_000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: () => recipesApi.delete(recipeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      navigation.goBack();
    },
    onError: () =>
      navigation.showAlert({ type: 'error', title: t('common.error'), message: t('recipes.errors.deleteFailed') }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBack = () => navigation.goBack();

  const handleDelete = () => {
    navigation.showAlert({
      type: 'destructive',
      title: t('recipes.detail.deleteTitle'),
      message: t('recipes.detail.deleteMessage'),
      confirmLabel: t('recipes.detail.deleteConfirm'),
      onConfirm: () => deleteMutation.mutate(),
    });
  };

  const handleOpenGallery = (photos: RecipePhoto[], initialIndex: number) => {
    navigation.navigate('RecipeGallery', {
      photos: photos as unknown as MomentPhoto[],
      initialIndex,
    });
  };

  const handleCookThis = () => {
    navigation.navigate('WhatToEat');
  };

  const handleShare = async () => {
    if (!recipeId) return;
    try {
      const { token } = await shareApi.create('recipe', recipeId);
      const url = `${APP_BASE_URL}/share/${token}`;
      await Share.share({ url, message: url });
    } catch {
      // Share cancelled or failed — no-op
    }
  };

  return {
    recipe,
    isLoading,
    isDeleting: deleteMutation.isPending,
    handleBack,
    handleDelete,
    handleOpenGallery,
    handleCookThis,
    handleShare,
  };
}
