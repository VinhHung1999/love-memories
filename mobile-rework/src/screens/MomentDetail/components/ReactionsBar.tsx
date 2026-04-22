import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { ReactionAggregate } from '../useMomentDetailViewModel';

// T400 (Sprint 63) — Reactions row below the hero + caption block on
// MomentDetail. Renders exactly the 6 prototype emoji (moments.jsx L625-645).
// Each pill toggles the current user's reaction for that emoji via
// `useMomentDetailViewModel.react(emoji)`. Selected state flips background
// to `primarySoft` — count is hidden when 0 so unreacted pills read as
// clean emoji chips.
//
// T407 — prototype cross-check (Build 55):
//   Prototype wraps the row in a divider band — `borderTop + borderBottom
//   1px c.line` + `padding: 12px 0` — and pills use `bg c.surfaceAlt`
//   (not c.surface) + `border c.line`. Ported both bits. Kept the
//   bg-flip-on-selection instead of prototype's 1.5px border bump because
//   changing borderWidth at runtime shifts layout by 0.5px and looks
//   jittery on RN; bg flip reads cleaner and was PO-approved in T400.
//   Kept count visible when > 0 (prototype mockup omits it, but the
//   feature exists for partner interaction — losing count loses the
//   signal of "partner also reacted").
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
    <View className="flex-row flex-wrap items-center gap-1.5 py-3 border-t border-b border-line">
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
    : { backgroundColor: c.surfaceAlt, borderColor: c.line };
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
          className="font-bodySemibold text-[13px]"
          style={{ color: reactedByMe ? c.primaryDeep : c.inkSoft }}
        >
          {count}
        </Text>
      ) : null}
    </Pressable>
  );
}
