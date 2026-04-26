import { Bell } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

// T425 (Sprint 65) — empty state for the inbox. Centred bell icon +
// Vietnamese copy "Chưa có thông báo nào". No CTA — the user can't
// fabricate notifications, they arrive from BE events.

type Props = {
  title: string;
  subtitle: string;
};

export function EmptyState({ title, subtitle }: Props) {
  const c = useAppColors();
  return (
    <View className="items-center mt-16 px-6">
      <View
        className="w-16 h-16 rounded-full items-center justify-center"
        style={{ backgroundColor: c.surfaceAlt }}
      >
        <Bell size={28} strokeWidth={1.8} color={c.inkMute} />
      </View>
      <Text className="mt-4 font-displayMedium text-ink text-[20px] leading-[24px] text-center">
        {title}
      </Text>
      <Text className="mt-2 font-body text-ink-mute text-[13px] leading-[19px] text-center max-w-[280px]">
        {subtitle}
      </Text>
    </View>
  );
}
