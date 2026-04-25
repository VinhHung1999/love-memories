import { useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { useAppColors } from '@/theme/ThemeProvider';

// T425 (Sprint 65) — Dashboard bell + unread badge. Sits in the greeting
// row trailing slot per Lu Q1 (no separate top bar). Tap → push the
// /notifications route. Badge shows the unread count from the
// useUnreadNotifications hook (poll-on-focus); >99 collapses to "99+".

export function BellButton() {
  const c = useAppColors();
  const router = useRouter();
  const { count } = useUnreadNotifications();
  const display = count > 99 ? '99+' : String(count);

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      accessibilityRole="button"
      accessibilityLabel={`Notifications (${count} unread)`}
      className="w-10 h-10 rounded-full items-center justify-center bg-surface border border-line-on-surface active:opacity-80 shadow-chip"
    >
      <Bell size={18} strokeWidth={2.1} color={c.ink} />
      {count > 0 ? (
        <View
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full items-center justify-center"
          style={{
            backgroundColor: c.primary,
            borderWidth: 2,
            borderColor: c.bg,
          }}
        >
          <Text className="font-bodyBold text-white text-[10px] leading-[12px]">
            {display}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
