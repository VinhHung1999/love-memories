import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { DailyQuestionHistoryItem } from '@/api/dailyQuestions';
import { useAppColors } from '@/theme/ThemeProvider';

// Sprint 67 T445 — tap a history row to reveal both answers inline.
// Ported from legacy `mobile/src/screens/DailyQuestions/DailyQuestionsScreen.tsx`
// (`HistoryItemCard` lines 446-526) but rewritten against the rework's
// theme tokens (useAppColors + bg-surface/border-line-on-surface) and
// the local lang-driven date format.
//
// Each row owns its own `expanded` useState — multiple rows can sit
// open at once without any parent-side bookkeeping. The collapsed row
// matches the previous static layout 1:1 except for the trailing
// chevron next to the avatar pair.

type Props = {
  item: DailyQuestionHistoryItem;
  lang: string;
  myAnswerLabel: string;
  partnerAnswerLabel: (partner: string) => string;
  partnerFallback: string;
};

export function HistoryRow({
  item,
  lang,
  myAnswerLabel,
  partnerAnswerLabel,
  partnerFallback,
}: Props) {
  const c = useAppColors();
  const [expanded, setExpanded] = useState(false);
  const text = item.question.textVi ?? item.question.text;
  const date = item.myAnsweredAt ? new Date(item.myAnsweredAt) : null;
  const dateLabel = date
    ? lang === 'vi'
      ? `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`
      : date.toLocaleDateString('en', { month: 'short', day: '2-digit' })
    : '';

  const partnerName = item.partnerName?.trim() || partnerFallback;

  return (
    <Pressable
      onPress={() => setExpanded((e) => !e)}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      className="rounded-[14px] mb-2 overflow-hidden active:opacity-90"
      style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.lineOnSurface }}
    >
      {/* Collapsed header (always visible) */}
      <View className="flex-row items-center gap-2.5 px-3.5 py-3">
        <Text
          className="flex-1 font-body text-[13px]"
          style={{ color: c.inkSoft }}
          numberOfLines={expanded ? 2 : 1}
        >
          {`"${text}"`}
        </Text>
        <Text className="font-body text-[11px]" style={{ color: c.inkMute }}>
          {dateLabel}
        </Text>
        <AvatarPair size={16} overlap={-6} />
        {expanded ? (
          <ChevronUp size={16} strokeWidth={1.8} color={c.inkMute} />
        ) : (
          <ChevronDown size={16} strokeWidth={1.8} color={c.inkMute} />
        )}
      </View>

      {/* Expanded answers — entering animation only on open. */}
      {expanded ? (
        <Animated.View
          entering={FadeInDown.duration(250)}
          className="px-3.5 pb-3.5"
        >
          <View className="h-px mb-3" style={{ backgroundColor: c.lineOnSurface }} />
          {item.myAnswer ? (
            <View className="mb-3">
              <Text
                className="font-bodyBold text-[11px] uppercase mb-1.5"
                style={{ color: c.primary, letterSpacing: 1.4 }}
              >
                {myAnswerLabel}
              </Text>
              <Text
                className="font-body text-[14px] leading-[20px]"
                style={{ color: c.ink }}
              >
                {item.myAnswer}
              </Text>
            </View>
          ) : null}
          {item.partnerAnswer ? (
            <View>
              <Text
                className="font-bodyBold text-[11px] uppercase mb-1.5"
                style={{ color: c.accent, letterSpacing: 1.4 }}
              >
                {partnerAnswerLabel(partnerName)}
              </Text>
              <Text
                className="font-body text-[14px] leading-[20px]"
                style={{ color: c.ink }}
              >
                {item.partnerAnswer}
              </Text>
            </View>
          ) : null}
        </Animated.View>
      ) : null}
    </Pressable>
  );
}

function AvatarPair({ size = 16, overlap = -6 }: { size?: number; overlap?: number }) {
  const c = useAppColors();
  return (
    <View className="flex-row">
      <View
        className="rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: c.primary,
          borderWidth: 2,
          borderColor: c.surface,
        }}
      />
      <View
        className="rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor: c.secondary,
          borderWidth: 2,
          borderColor: c.surface,
          marginLeft: overlap,
        }}
      />
    </View>
  );
}
