import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTypeSystem } from '@/theme/ThemeProvider';

// Tailwind can't extract template-literal class names, so we fan out every
// possible font-* class the TypeSystem.display field may resolve to.
const DISPLAY_CLASS: Record<string, string> = {
  body: 'font-body',
  bodyMedium: 'font-bodyMedium',
  bodySemibold: 'font-bodySemibold',
  bodyBold: 'font-bodyBold',
  display: 'font-display',
  displayItalic: 'font-displayItalic',
  displayMedium: 'font-displayMedium',
  displayBold: 'font-displayBold',
  displayBoldItalic: 'font-displayBoldItalic',
  script: 'font-script',
  scriptBold: 'font-scriptBold',
};

type Props = {
  title?: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  className?: string;
};

export function ScreenBackBtn({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  const handle = onPress ?? (() => router.back());
  return (
    <Pressable
      onPress={handle}
      className="w-10 h-10 rounded-full items-center justify-center active:bg-surface-alt"
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
    >
      <Text className="font-bodyMedium text-xl text-ink">‹</Text>
    </Pressable>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  left,
  right,
  showBack,
  onBack,
  className,
}: Props) {
  const ts = useTypeSystem();
  return (
    <View className={`px-5 pt-2 pb-4 ${className ?? ''}`}>
      <View className="flex-row items-center justify-between">
        <View className="w-10">{left ?? (showBack ? <ScreenBackBtn onPress={onBack} /> : null)}</View>
        <View className="flex-1 items-center">
          {title ? (
            <Text
              className={`${DISPLAY_CLASS[ts.display]} text-lg text-ink`}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text className="font-body text-xs text-ink-mute mt-0.5" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View className="w-10 items-end">{right}</View>
      </View>
    </View>
  );
}
