// Sprint 67 T452 — Floating glass-blur close pill that overlays the
// MonthlyRecap cover. Spec lifts from prototype `recap.jsx` L134-145:
// 36×36 circle, top-right, semi-transparent dark backdrop with backdrop-blur.
// Mobile-rework uses expo-blur for the frost; the rounded clip needs an inline
// `style` (the `style` prop carve-out documented in `mobile-rework.md` for
// BlurView).

import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useAppMode } from '@/theme/ThemeProvider';

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
  // Y position from screen top, sits inside SafeAreaView's top inset.
  topPx?: number;
  rightPx?: number;
};

export function CloseFloatingButton({
  onPress,
  accessibilityLabel,
  topPx = 16,
  rightPx = 16,
}: Props) {
  const mode = useAppMode();

  return (
    <View
      pointerEvents="box-none"
      className="absolute z-50"
      style={{ top: topPx, right: rightPx }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        className="active:opacity-70"
      >
        <BlurView
          intensity={28}
          tint={mode === 'dark' ? 'dark' : 'systemThinMaterialDark'}
          // BlurView clip carve-out — see mobile-rework.md Hard Rule #2.
          style={{ borderRadius: 18, overflow: 'hidden' }}
        >
          <View className="h-9 w-9 items-center justify-center border border-white/25">
            <X size={14} strokeWidth={2.5} color="#FFFFFF" />
          </View>
        </BlurView>
      </Pressable>
    </View>
  );
}
