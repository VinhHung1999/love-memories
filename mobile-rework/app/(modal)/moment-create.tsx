import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { MomentCreateScreen } from '@/screens/MomentCreate/MomentCreateScreen';

// T378 (Sprint 62) — Expo Router modal for the new-moment composer.
// Receives `initialPhotos` as a JSON-encoded URI list from the camera sheet
// (T377 CameraActionSheet.navigateToCreate). Parse here and hand parsed
// strings to the screen so the MVVM layer only sees primitives.

export default function MomentCreateRoute() {
  const params = useLocalSearchParams<{ initialPhotos?: string }>();

  const initialPhotos = useMemo<string[]>(() => {
    if (!params.initialPhotos) return [];
    try {
      const parsed = JSON.parse(params.initialPhotos);
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
    } catch {
      return [];
    }
  }, [params.initialPhotos]);

  return <MomentCreateScreen initialPhotos={initialPhotos} />;
}
