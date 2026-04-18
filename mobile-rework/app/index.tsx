import { View } from 'react-native';

// Empty placeholder — root layout's auth gate redirects to `/(auth)/welcome`
// (no token), `/(auth)/pair-create` (token, no couple), or `/(tabs)` (paired).
// We render nothing here so there is no flash before the redirect lands.
export default function Index() {
  return <View className="flex-1 bg-bg" />;
}
