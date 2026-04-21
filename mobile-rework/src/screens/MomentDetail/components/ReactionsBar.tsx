import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { ReactionAggregate } from '../useMomentDetailViewModel';

// T400 (Sprint 63) — Reactions row below the hero + caption block on
// MomentDetail. Renders exactly the 6 prototype emoji (moments.jsx L625-645).
// Each pill toggles the current user's reaction for that emoji via
// `useMomentDetailViewModel.react(emoji)`. Selected state flips background
// to `primarySoft` and bumps text weight — count is hidden when 0 so
// unreacted pills read as clean emoji chips.
//
// NativeWind carve-out: `style` prop ONLY for conditional colors that flip
// at runtime (bg + border) — rule #2 #3 per .claude/rules/mobile-rework.md.
// Static layout/typography stays on `className`.

type Props = {
  reactions: readonly ReactionAggregate[];
  onReact: (emoji: string) => void;
  disabled?: boolean;
};

export function ReactionsBar({ reactions, onReact, disabled }: Props) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {reactions.map((r) => (
        <ReactionPill
          key={r.emoji}
          emoji={r.emoji}
          count={r.count}
          reactedByMe={r.reactedByMe}
          onPress={() => onReact(r.emoji)}
          disabled={disabled}
        />
      ))}
    </View>
  );
}

type PillProps = {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  onPress: () => void;
  disabled?: boolean;
};

function ReactionPill({ emoji, count, reactedByMe, onPress, disabled }: PillProps) {
  const c = useAppColors();
  const pillStyle = reactedByMe
    ? { backgroundColor: c.primarySoft, borderColor: c.primary }
    : { backgroundColor: c.surface, borderColor: c.lineOnSurface };
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`React ${emoji}${count > 0 ? ` (${count})` : ''}`}
      accessibilityState={{ selected: reactedByMe, disabled: !!disabled }}
      className="flex-row items-center gap-1.5 px-3 h-9 rounded-full border active:opacity-80"
      style={pillStyle}
    >
      <Text className="text-[16px]">{emoji}</Text>
      {count > 0 ? (
        <Text
          className={
            reactedByMe
              ? 'font-bodySemibold text-[13px]'
              : 'font-bodyMedium text-[13px]'
          }
          style={{ color: reactedByMe ? c.primaryDeep : c.inkSoft }}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}
