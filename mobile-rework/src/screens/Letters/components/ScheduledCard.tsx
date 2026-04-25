import { Clock } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

// T421 (Sprint 65) — summary banner on the Scheduled tab. Prototype
// `letters.jsx` L260-288. Pure presentation: count + next-delivery copy come
// from the VM (which knows the earliest scheduledAt across the SCHEDULED
// list).
//
// Border is dashed accent + linear-style accent-soft → surface gradient feel.
// We avoid a real LinearGradient here because the prototype's 110° fade is
// barely visible at small sizes; flat accent-soft reads cleaner on RN.

type Props = {
  title: string;
  subtitle: string;
};

export function ScheduledCard({ title, subtitle }: Props) {
  const c = useAppColors();
  return (
    <View
      className="flex-row items-center gap-3 px-4 py-3.5 rounded-2xl bg-accent-soft mb-3.5"
      style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: c.accent }}
    >
      <View
        className="w-9 h-9 rounded-full items-center justify-center"
        style={{ backgroundColor: c.accent }}
      >
        <Clock size={16} strokeWidth={2.2} color="#ffffff" />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="font-bodyBold text-ink text-[13px]">{title}</Text>
        <Text
          numberOfLines={1}
          className="font-body text-ink-mute text-[11px] mt-0.5"
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
