import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { RecipesStackParamList } from '../../navigation';
import { useAppNavigation } from '../../navigation/useAppNavigation';
import { cookingSessionsApi } from '../../lib/api';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useUploadProgress } from '../../contexts/UploadProgressContext';
import { useAuth } from '../../lib/auth';
import type { CookingSessionStatus } from '../../types';
import t from '../../locales/en';

type Route = RouteProp<RecipesStackParamList, 'CookingSession'>;

export function useCookingSessionViewModel() {
  const navigation = useAppNavigation();
  const route = useRoute<Route>();
  const { sessionId } = route.params;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { startUpload, incrementUpload } = useUploadProgress();

  const [rating, setRating] = useState(0);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: session, isLoading } = useQuery({
    queryKey: ['cooking-session', sessionId],
    queryFn: () => cookingSessionsApi.get(sessionId),
    staleTime: 5_000,
  });

  // ── Derived ────────────────────────────────────────────────────────────────

  const allItemsChecked = useMemo(
    () => (session?.items.length ?? 0) > 0 && !!session?.items.every(i => i.checked),
    [session?.items],
  );

  const allStepsChecked = useMemo(
    () => (session?.steps.length ?? 0) > 0 && !!session?.steps.every(s => s.checked),
    [session?.steps],
  );

  const checkedItemCount = useMemo(
    () => session?.items.filter(i => i.checked).length ?? 0,
    [session?.items],
  );

  const checkedStepCount = useMemo(
    () => session?.steps.filter(s => s.checked).length ?? 0,
    [session?.steps],
  );

  // ── Status mutation ────────────────────────────────────────────────────────

  const statusMutation = useMutation({
    mutationFn: (status: CookingSessionStatus) =>
      cookingSessionsApi.updateStatus(sessionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooking-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['cooking-session-active'] });
    },
    onError: () =>
      navigation.showAlert({ type: 'error', title: t.common.error, message: t.whatToEat.errors.updateFailed }),
  });

  // ── Toggle item ────────────────────────────────────────────────────────────

  const toggleItemMutation = useMutation({
    mutationFn: ({ itemId, checked }: { itemId: string; checked: boolean }) =>
      cookingSessionsApi.toggleItem(sessionId, itemId, checked),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cooking-session', sessionId] }),
    onError: () =>
      navigation.showAlert({ type: 'error', title: t.common.error, message: t.whatToEat.errors.toggleFailed }),
  });

  // ── Toggle step ────────────────────────────────────────────────────────────

  const toggleStepMutation = useMutation({
    mutationFn: ({ stepId, checked }: { stepId: string; checked: boolean }) =>
      cookingSessionsApi.toggleStep(sessionId, stepId, checked, user?.name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cooking-session', sessionId] }),
    onError: () =>
      navigation.showAlert({ type: 'error', title: t.common.error, message: t.whatToEat.errors.toggleFailed }),
  });

  // ── Rate mutation ──────────────────────────────────────────────────────────

  const rateMutation = useMutation({
    mutationFn: (r: number) => cookingSessionsApi.rate(sessionId, r),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cooking-session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['cooking-session-active'] });
      queryClient.invalidateQueries({ queryKey: ['cooking-sessions'] });
      navigation.goBack();
    },
    onError: () =>
      navigation.showAlert({ type: 'error', title: t.common.error, message: t.whatToEat.errors.updateFailed }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleToggleItem = (itemId: string, checked: boolean) => {
    toggleItemMutation.mutate({ itemId, checked });
  };

  const handleToggleStep = (stepId: string, checked: boolean) => {
    toggleStepMutation.mutate({ stepId, checked });
  };

  const handleAdvance = (nextStatus: CookingSessionStatus) => {
    statusMutation.mutate(nextStatus);
  };

  const handleAddPhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 1, selectionLimit: 5 });
    if (result.didCancel || !result.assets) return;
    const pending = result.assets.filter(a => a.uri);
    if (pending.length === 0) return;
    startUpload(pending.length);
    Promise.all(
      pending.map(a =>
        cookingSessionsApi.uploadPhoto(sessionId, a.uri!, a.type ?? 'image/jpeg')
          .then(() => incrementUpload())
          .catch(() => incrementUpload()),
      ),
    ).then(() => queryClient.invalidateQueries({ queryKey: ['cooking-session', sessionId] }));
  };

  const handleAddPhotoFromCamera = async () => {
    const result = await launchCamera({ mediaType: 'photo', quality: 1 });
    if (result.didCancel || !result.assets?.[0]?.uri) return;
    const asset = result.assets[0];
    startUpload(1);
    cookingSessionsApi.uploadPhoto(sessionId, asset.uri!, asset.type ?? 'image/jpeg')
      .then(() => {
        incrementUpload();
        queryClient.invalidateQueries({ queryKey: ['cooking-session', sessionId] });
      })
      .catch(() => incrementUpload());
  };

  const handleFinish = () => {
    if (rating > 0) {
      rateMutation.mutate(rating);
    } else {
      // Skip rating, just complete
      statusMutation.mutate('completed');
      navigation.goBack();
    }
  };

  const handleBack = () => navigation.goBack();

  return {
    session,
    isLoading,
    rating,
    setRating,
    allItemsChecked,
    allStepsChecked,
    checkedItemCount,
    checkedStepCount,
    isAdvancing: statusMutation.isPending,
    isRating: rateMutation.isPending,
    handleToggleItem,
    handleToggleStep,
    handleAdvance,
    handleAddPhoto,
    handleAddPhotoFromCamera,
    handleFinish,
    handleBack,
  };
}
