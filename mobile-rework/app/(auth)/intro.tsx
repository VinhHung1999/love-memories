import { Text, View } from 'react-native';
import { SafeScreen } from '@/components';

export default function Intro() {
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center">
        <Text className="font-bodyMedium text-ink">Intro — placeholder</Text>
      </View>
    </SafeScreen>
  );
}
