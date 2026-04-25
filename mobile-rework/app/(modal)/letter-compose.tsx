import { Text, View } from 'react-native';
import { SafeScreen } from '@/components';

// T421 (Sprint 65) — placeholder so the LettersScreen Write button + draft
// edit nav have a target while T423 (Letter Compose) is still in the queue.
// T423 replaces this stub with the real compose screen.

export default function LetterCompose() {
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center">
        <Text className="font-bodyMedium text-ink">
          LetterCompose — coming in T423
        </Text>
      </View>
    </SafeScreen>
  );
}
