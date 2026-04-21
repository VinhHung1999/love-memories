import { MomentsScreen } from '@/screens/Moments/MomentsScreen';

// T376 (Sprint 62) — Moments tab. Thin route wrapper for MVVM screen so the
// screen folder can be tested/previewed in isolation.

export default function MomentsRoute() {
  return <MomentsScreen />;
}
