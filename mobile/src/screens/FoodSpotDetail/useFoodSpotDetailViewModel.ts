import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { FoodSpotsStackParamList } from '../../navigation';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { foodSpotsApi } from '../../lib/api';
import type { FoodSpotPhoto, MomentPhoto } from '../../types';
import t from '../../locales/en';

type Route = RouteProp<FoodSpotsStackParamList, 'FoodSpotDetail'>;

export function useFoodSpotDetailViewModel() {
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
      navigation.showAlert({ type: 'error', title: t.common.error, message: t.foodSpots.errors.deleteFailed }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBack = () => navigation.goBack();

  const handleDeleteSpot = () => {
    navigation.showAlert({
      type: 'destructive',
      title: t.foodSpots.detail.deleteTitle,
      message: t.foodSpots.detail.deleteMessage,
      confirmLabel: t.foodSpots.detail.deleteConfirm,
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

  return {
    spot,
    isLoading,
    isDeleting: deleteMutation.isPending,
    handleBack,
    handleDeleteSpot,
    handleOpenGallery,
  };
}
