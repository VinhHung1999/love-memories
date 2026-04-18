import { Text, View } from 'react-native';
import { SafeScreen } from '@/components';

export default function CameraSheet() {
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center">
        <Text className="font-bodyMedium text-ink">CameraSheet — placeholder</Text>
      </View>
    </SafeScreen>
  );
}
