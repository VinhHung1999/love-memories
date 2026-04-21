import { useLocalSearchParams } from 'expo-router';

import { MomentDetailScreen } from '@/screens/MomentDetail/MomentDetailScreen';

// T386.7 (Sprint 62) — moved out of `(modal)` group so the detail route pushes
// as a standard card onto the tabs stack (Boss feedback Build 44: modal sheet
// presentation felt detached; full-screen card better fits the "deep-dive"
// reading mode). The screen header already renders its own back chevron
// (MomentDetailScreen L69) so edge-swipe + chevron both work.

export default function MomentDetailRoute() {
  const params = useLocalSearchParams<{ id?: string }>();
  return <MomentDetailScreen id={params.id} />;
}
