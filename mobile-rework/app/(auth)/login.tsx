import { Text, View } from 'react-native';
import { SafeScreen } from '@/components';

export default function Login() {
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center">
        <Text className="font-bodyMedium text-ink">Login — placeholder</Text>
      </View>
    </SafeScreen>
  );
}
