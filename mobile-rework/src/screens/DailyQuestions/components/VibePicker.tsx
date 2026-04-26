import { Pressable, Text, View } from 'react-native';

import { VIBE_KEYS, type VibeKey } from '@/api/dailyVibes';
import { useAppColors } from '@/theme/ThemeProvider';

// Sprint 66 T436 — single-select chip row. 5 fixed presets matching
// prototype `recap.jsx:1242` and BE VIBE_KEYS. Static className for
// layout/typography; conditional `style` prop for colors so we don't
// hit the NativeWind v4 conditional-className crash (Sprint 61 lesson +
// Sprint 65 MoodPicker precedent).

type Props = {
  label: string;
  active: VibeKey | null;
  vibeLabels: Record<VibeKey, string>;
  onSelect: (vibe: VibeKey) => void;
};

export function VibePicker({ label, active, vibeLabels, onSelect }: Props) {
  const c = useAppColors();
  return (
    <View className="mx-5 mt-6">
      <Text
        className="font-bodyBold text-[11px] uppercase mb-2.5"
        style={{ color: c.inkMute, letterSpacing: 1.4 }}
      >
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        {VIBE_KEYS.map((key) => {
          const isActive = active === key;
          return (
            <Pressable
              key={key}
              onPress={() => onSelect(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              className="px-3 py-1.5 rounded-full active:opacity-80"
              style={{
                backgroundColor: isActive ? c.primarySoft : c.surface,
                borderWidth: 1,
                borderColor: isActive ? c.primary : c.lineOnSurface,
              }}
            >
              <Text
                className="font-body text-[12px]"
                style={{ color: isActive ? c.primaryDeep : c.inkSoft }}
              >
                {vibeLabels[key]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
