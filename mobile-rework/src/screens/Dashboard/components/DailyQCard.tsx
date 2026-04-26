import { Pressable, Text, View } from 'react-native';

import { HeaderChip } from '@/components/HeaderChip';
import type { DailyQuestionToday } from '@/api/dailyQuestions';
import { useAppColors } from '@/theme/ThemeProvider';

// Sprint 66 T426 — Dashboard "Daily Q" card. Bám 1:1 prototype
// `dashboard.jsx` lines 471-555 (DailyQCard).
//
// Layout per prototype:
//   • Top row — left: 28×28 accent ?-circle + "Daily Q" label;
//                right: 🔥 streak HeaderChip
//   • Question text — display italic 19px, quoted
//   • Action row — primary "Trả lời" CTA (flex-1) + partner-pending pill
//                   (or "Both answered ✓" when complete; hidden if user solo)
//   • Corner accent — 120px accentSoft circle, top-right −30/−30
//
// The card hides itself entirely when `today` is null (couple not paired,
// BE empty, or the daily-questions endpoint errored). Tapping anywhere on
// the card OR the CTA navigates to the full DailyQuestionsScreen.

type Props = {
  today: DailyQuestionToday | null;
  streakCount: number;
  myHasAnswered: boolean;
  partnerHasAnswered: boolean;
  partnerName: string | null;
  // Translated strings injected from the parent (keeps the component
  // i18n-free so it remains a pure presentational unit).
  labels: {
    title: string;
    cta: string;
    streak: string;
    partnerPending: string;
    bothAnswered: string;
    youPending: string;
  };
  onPress: () => void;
};

export function DailyQCard({
  today,
  streakCount: _streakCount,
  myHasAnswered,
  partnerHasAnswered,
  partnerName,
  labels,
  onPress,
}: Props) {
  const c = useAppColors();
  if (!today) return null;

  const questionText = today.question.textVi ?? today.question.text;

  const partnerPill = (() => {
    if (myHasAnswered && partnerHasAnswered) {
      return labels.bothAnswered;
    }
    if (!myHasAnswered && partnerHasAnswered && partnerName) {
      return labels.youPending;
    }
    if (myHasAnswered && !partnerHasAnswered && partnerName) {
      return labels.partnerPending;
    }
    return null;
  })();

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={labels.title}>
      <View
        className="mx-5 mt-4 px-5 py-5 rounded-[22px] bg-surface border border-line-on-surface shadow-card overflow-hidden relative"
      >
        {/* Corner accent — abs positioned 120×120 circle, partial overlap top-right. */}
        <View
          className="absolute rounded-full"
          style={{
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            backgroundColor: c.accentSoft,
            opacity: 0.7,
          }}
        />

        {/* Foreground */}
        <View className="relative">
          {/* Top row — ?-circle + label · streak chip */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View
                className="w-7 h-7 rounded-full items-center justify-center"
                style={{ backgroundColor: c.accent }}
              >
                <Text className="font-bodyBold text-white text-[14px] leading-[16px]">?</Text>
              </View>
              <Text
                className="font-bodySemibold text-[13px]"
                style={{ color: c.inkSoft, letterSpacing: 0.2 }}
              >
                {labels.title}
              </Text>
            </View>
            <HeaderChip label={`🔥 ${labels.streak}`} variant="accent" />
          </View>

          {/* Question text */}
          <Text
            className="font-displayItalic text-[19px] leading-[25px] text-ink mt-3"
            numberOfLines={3}
          >
            {`"${questionText}"`}
          </Text>

          {/* Action row */}
          <View className="flex-row items-center gap-2.5 mt-4">
            <View
              className="flex-1 rounded-[14px] py-3 px-4 items-center"
              style={{
                backgroundColor: c.primary,
                shadowColor: c.primary,
                shadowOpacity: 0.4,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Text className="font-bodyBold text-white text-[14px]">{labels.cta}</Text>
            </View>
            {partnerPill ? (
              <View
                className="flex-1 flex-row items-center gap-2 px-3 py-[11px] rounded-[14px]"
                style={{ backgroundColor: c.surfaceAlt }}
              >
                <View
                  className="w-[22px] h-[22px] rounded-full items-center justify-center"
                  style={{ backgroundColor: c.primary }}
                >
                  <Text className="font-bodyBold text-white text-[10px]">
                    {(partnerName?.trim()[0] ?? 'M').toUpperCase()}
                  </Text>
                </View>
                <Text
                  className="flex-1 font-body text-[12px]"
                  style={{ color: c.inkSoft }}
                  numberOfLines={1}
                >
                  {partnerPill}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
