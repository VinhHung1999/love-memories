import { Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

// Sprint 66 T426/T427 — small rounded-full pill used in:
//   • DailyQCard streak indicator (Dashboard)
//   • DailyQuestionsScreen header trailing slot
//   • (future) Recap detail / share-screen
//
// Variants:
//   accent (default) — accentSoft bg + accent text. Reads as the secondary
//                      attention surface against `surface` cards.
//   primary          — primarySoft bg + primaryDeep text. Use for "active"
//                      or "you" emphasis.
//   surface          — surface bg + line border + ink-soft text. Quietest;
//                      good for neutral counters (Q · 89).
//
// Pure NativeWind for layout/typography; only the run-time bg/border/text
// colors come through `style` so the chip flips with palette + dark mode
// without ternary `className` (Sprint 61 NativeWind v4 crash class).

export type HeaderChipVariant = 'accent' | 'primary' | 'surface';

type Props = {
  label: string;
  icon?: React.ReactNode;
  variant?: HeaderChipVariant;
};

export function HeaderChip({ label, icon, variant = 'accent' }: Props) {
  const c = useAppColors();
  const palette = (() => {
    switch (variant) {
      case 'primary':
        return { bg: c.primarySoft, fg: c.primaryDeep, border: undefined };
      case 'surface':
        return { bg: c.surface, fg: c.inkSoft, border: c.lineOnSurface };
      case 'accent':
      default:
        return { bg: c.accentSoft, fg: c.accent, border: undefined };
    }
  })();

  return (
    <View
      className="flex-row items-center gap-1 px-2 py-[3px] rounded-full"
      style={{
        backgroundColor: palette.bg,
        borderWidth: palette.border ? 1 : 0,
        borderColor: palette.border,
      }}
    >
      {icon}
      <Text
        className="font-bodyBold text-[11px]"
        style={{ color: palette.fg }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}
