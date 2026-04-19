import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAppColors, useTypeSystem } from '@/theme/ThemeProvider';

// T290 (Sprint 60 polish) — header layout per docs/design/prototype/memoura-v2/
// screen-header.jsx: back button + title share a single horizontal row, title
// is left-aligned (not centered), subtitle stacks below the title inside the
// flex-1 column. Back button is the prototype's 40×40 surface chip with inset
// border + chevron stroke (NOT a centered "‹" glyph).

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

const ACCENT_CLASS: Record<string, string> = DISPLAY_CLASS;

type SubtitleKind = 'accent' | 'body';

type Props = {
  title?: string;
  subtitle?: string;
  subtitleKind?: SubtitleKind;
  right?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  className?: string;
};

export function ScreenBackBtn({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  const c = useAppColors();
  const handle = onPress ?? (() => router.back());
  return (
    <Pressable
      onPress={handle}
      className="w-10 h-10 rounded-2xl bg-surface border border-line items-center justify-center shadow-chip active:opacity-80"
      accessibilityRole="button"
      accessibilityLabel="Back"
      hitSlop={8}
    >
      {/* T291 (bug #6): hand-rolled SVG chevron swapped for lucide ChevronLeft.
          strokeWidth 2.3 keeps the same visual weight as the prior path. */}
      <ChevronLeft size={18} strokeWidth={2.3} color={c.ink} />
    </Pressable>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  subtitleKind = 'body',
  right,
  showBack,
  onBack,
  className,
}: Props) {
  const ts = useTypeSystem();
  return (
    <View className={`flex-row items-center gap-3 px-4 pt-2.5 pb-4 ${className ?? ''}`}>
      {showBack ? <ScreenBackBtn onPress={onBack} /> : null}
      <View className="flex-1 min-w-0">
        {title ? (
          <Text
            className={`${DISPLAY_CLASS[ts.display]} text-[26px] leading-none text-ink`}
            numberOfLines={1}
          >
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          subtitleKind === 'accent' ? (
            <Text
              className={`${ACCENT_CLASS[ts.accent]} mt-1 text-[11px] uppercase tracking-[1.5px] leading-none text-ink-mute`}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : (
            <Text
              className="mt-1.5 font-body text-[13px] text-ink-mute"
              numberOfLines={2}
            >
              {subtitle}
            </Text>
          )
        ) : null}
      </View>
      {right ? <View className="ml-2">{right}</View> : null}
    </View>
  );
}
