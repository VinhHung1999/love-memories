import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';

type Props = {
  onPress?: () => void;
  accessibilityLabel?: string;
  children: ReactNode;
};

// T396 (Sprint 63) — Circular 36x36 frosted glass button for MomentDetail
// hero chrome (back, share, more). `expo-blur` native props (intensity, tint)
// aren't className-able; the pill clip requires an inline borderRadius +
// overflow per the BlurView carve-out documented in .claude/rules/mobile-rework.md.
export function GlassButton({ onPress, accessibilityLabel, children }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="w-9 h-9 active:opacity-75"
    >
      <BlurView
        intensity={45}
        tint="systemMaterialDark"
        style={{ borderRadius: 9999, overflow: 'hidden' }}
        className="w-9 h-9 items-center justify-center border border-white/30 bg-black/10"
      >
        {children}
      </BlurView>
    </Pressable>
  );
}
