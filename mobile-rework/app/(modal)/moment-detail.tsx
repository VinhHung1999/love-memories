import { useLocalSearchParams } from 'expo-router';

import { MomentDetailScreen } from '@/screens/MomentDetail/MomentDetailScreen';

// T379 (Sprint 62) — Expo Router modal for viewing one moment. `id` is passed
// as a search param from Dashboard (T375) and Moments list (T376). Route is a
// thin wrapper so the MVVM screen can be tested/previewed in isolation.

export default function MomentDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  return <MomentDetailScreen id={params.id} />;
}
