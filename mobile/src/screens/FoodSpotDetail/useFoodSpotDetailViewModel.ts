import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { FoodSpotsStackParamList } from '../../navigation';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { foodSpotsApi, shareApi } from '../../lib/api';
import { Share } from 'react-native';

const APP_BASE_URL = __DEV__ ? 'https://dev-love-scrum.hungphu.work' : 'https://love-scrum.hungphu.work';
import type { FoodSpotPhoto, MomentPhoto } from '../../types';
import { useTranslation } from 'react-i18next';
type Route = RouteProp<FoodSpotsStackParamList, 'FoodSpotDetail'>;

export function useFoodSpotDetailViewModel() {
  const { t } = useTranslation();
  const navigation = useAppNavigation();
  const route = useRoute<Route>();
  const { foodSpotId } = route.params;
  const queryClient = useQueryClient();

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: spot, isLoading } = useQuery({
    queryKey: ['foodspot', foodSpotId],
    queryFn: () => foodSpotsApi.get(foodSpotId),
    staleTime: 30_000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: () => foodSpotsApi.delete(foodSpotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foodspots'] });
      navigation.goBack();
    },
    onError: () =>
      navigation.showAlert({ type: 'error', title: t('common.error'), message: t('foodSpots.errors.deleteFailed') }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBack = () => navigation.goBack();

  const handleDeleteSpot = () => {
    navigation.showAlert({
      type: 'destructive',
      title: t('foodSpots.detail.deleteTitle'),
      message: t('foodSpots.detail.deleteMessage'),
      confirmLabel: t('foodSpots.detail.deleteConfirm'),
      onConfirm: () => deleteMutation.mutate(),
    });
  };

  const handleOpenGallery = (photos: FoodSpotPhoto[], initialIndex: number) => {
    // FoodSpotPhoto structurally matches what PhotoGalleryScreen needs (id + url)
    navigation.navigate('FoodSpotGallery', {
      photos: photos as unknown as MomentPhoto[],
      initialIndex,
    });
  };

  const handleShare = async () => {
    if (!foodSpotId) return;
    try {
      const { token } = await shareApi.create('foodspot', foodSpotId);
      const url = `${APP_BASE_URL}/share/${token}`;
      await Share.share({ url, message: url });
    } catch {
      // Share cancelled or failed — no-op
    }
  };

  return {
    spot,
    isLoading,
    isDeleting: deleteMutation.isPending,
    handleBack,
    handleDeleteSpot,
    handleOpenGallery,
    handleShare,
  };
}
