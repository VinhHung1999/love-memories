import { useLocalSearchParams } from 'expo-router';

import { LocationPickerScreen } from '@/screens/LocationPicker/LocationPickerScreen';

// T412 — full-screen route for picking a location (search / GPS / Maps
// share link). Pushed via `router.push('/location-picker', { current })`
// from MomentCreateScreen. Result is delivered through the module bus in
// `src/screens/LocationPicker/locationPickerBus.ts` because expo-router
// doesn't forward params on `router.back`.

export default function LocationPickerRoute() {
  const { current } = useLocalSearchParams<{ current?: string }>();
  const initialValue = typeof current === 'string' && current.length > 0 ? current : null;
  return <LocationPickerScreen initialValue={initialValue} />;
}
