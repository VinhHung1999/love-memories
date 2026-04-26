import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

// T423 (Sprint 65) — 8 emoji mood chips per prototype `letters.jsx` L494-505.
// 44×44 rounded-2xl tile; selected = bg-primary-soft + 2px primary border;
// unselected = bg-surface + 1px line border. Tap toggles select; tapping the
// same emoji again clears the selection (mood becomes null on the draft).

const MOODS = ['💌', '❤️', '🥺', '🌙', '🎂', '☕', '🌸', '✨'];

type Props = {
  label: string;
  active: string | null;
  onSelect: (mood: string | null) => void;
};

export function MoodPicker({ label, active, onSelect }: Props) {
  const c = useAppColors();
  return (
    <View className="mt-4">
      <Text className="font-bodyBold text-ink-mute text-[11px] tracking-[0.8px] uppercase mb-2 pl-1">
        {label}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-1.5"
      >
        {MOODS.map((m) => {
          const isActive = active === m;
          return (
            <Pressable
              key={m}
              onPress={() => onSelect(isActive ? null : m)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className="w-11 h-11 rounded-2xl items-center justify-center active:opacity-80"
              style={{
                backgroundColor: isActive ? c.primarySoft : c.surface,
                borderWidth: isActive ? 2 : 1,
                borderColor: isActive ? c.primary : c.lineOnSurface,
              }}
            >
              <Text className="text-[22px] leading-[24px]">{m}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
