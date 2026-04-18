import { Text, View } from 'react-native';
import { SafeScreen } from '@/components';

export default function Personalize() {
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center">
        <Text className="font-bodyMedium text-ink">Personalize — placeholder</Text>
      </View>
    </SafeScreen>
  );
}
