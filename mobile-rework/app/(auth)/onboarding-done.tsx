import { Text, View } from 'react-native';
import { SafeScreen } from '@/components';

// T286 fills this in — keep a placeholder so the auth Stack lists every
// onboarding screen up front and the route resolves immediately.
export default function OnboardingDone() {
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center">
        <Text className="font-bodyMedium text-ink">OnboardingDone — placeholder</Text>
      </View>
    </SafeScreen>
  );
}
