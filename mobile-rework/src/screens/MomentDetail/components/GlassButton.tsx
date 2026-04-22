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
//
// T405 — ported exactly to prototype moments.jsx:701 GlassBtn:
//   background rgba(255,255,255,0.22) + backdrop blur(12) + border white/30.
// Previous build used tint='systemMaterialDark' + bg-black/10 which smoked
// the pill out so the white/30 border looked wispy and the photo bled
// through the center. Light tint + white fill keeps the pill visibly
// detached from the photo below on both light and dark hero images.
export function GlassButton({ onPress, accessibilityLabel, children }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      className="w-9 h-9 active:opacity-75"
    >
      <BlurView
        intensity={50}
        tint="light"
        style={{ borderRadius: 9999, overflow: 'hidden' }}
        className="w-9 h-9 items-center justify-center border border-white/30 bg-white/20"
      >
        {children}
      </BlurView>
    </Pressable>
  );
}
