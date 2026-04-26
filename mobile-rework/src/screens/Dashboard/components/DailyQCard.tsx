import { Pressable, Text, View } from 'react-native';

import { HeaderChip } from '@/components/HeaderChip';
import type { DailyQuestionToday } from '@/api/dailyQuestions';
import { useAppColors } from '@/theme/ThemeProvider';

// Sprint 66 T426 — Dashboard "Daily Q" card. Bám 1:1 prototype
// `dashboard.jsx` lines 471-555 (DailyQCard).
//
// Layout:
//   • Top row — left: 28×28 accent ?-circle + "Daily Q" label;
//                right: 🔥 streak HeaderChip (T434 — hidden when streak=0)
//   • Question text — display italic 19px, quoted
//   • Action row (T434 swap):
//       !myHasAnswered → primary "Trả lời" CTA (flex-1) + optional
//                        youPending pill ("X answered first") if partner
//                        already answered.
//       myHasAnswered  → full-width neutral state pill (surfaceAlt bg,
//                        inkSoft text). Either "Đã trả lời · chờ X" or
//                        "Cả hai đã trả lời ✓". CTA button is hidden.
//   • Corner accent — 120px accentSoft circle, top-right −30/−30
//
// The card hides itself entirely when `today` is null (couple not paired,
// BE empty, or the daily-questions endpoint errored). Tapping anywhere on
// the card navigates to the full DailyQuestionsScreen.

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
  streakCount,
  myHasAnswered,
  partnerHasAnswered,
  partnerName,
  labels,
  onPress,
}: Props) {
  const c = useAppColors();
  if (!today) return null;

  const questionText = today.question.textVi ?? today.question.text;
  const showStreakChip = streakCount > 0;

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
          {/* Top row — ?-circle + label · streak chip (T434: hidden when 0) */}
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
            {showStreakChip ? (
              <HeaderChip label={`🔥 ${labels.streak}`} variant="accent" />
            ) : null}
          </View>

          {/* Question text */}
          <Text
            className="font-displayItalic text-[19px] leading-[25px] text-ink mt-3"
            numberOfLines={3}
          >
            {`"${questionText}"`}
          </Text>

          {/* Action row — T434: split paths so myHasAnswered hides the
              CTA entirely and shows a single full-width state pill. */}
          {myHasAnswered ? (
            <View
              className="flex-row items-center justify-center gap-2 mt-4 px-3 py-3 rounded-[14px]"
              style={{ backgroundColor: c.surfaceAlt }}
            >
              <Text
                className="font-body text-[13px] text-center"
                style={{ color: c.inkSoft }}
                numberOfLines={1}
              >
                {partnerHasAnswered ? labels.bothAnswered : labels.partnerPending}
              </Text>
            </View>
          ) : (
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
              {partnerHasAnswered && partnerName ? (
                <View
                  className="flex-1 flex-row items-center gap-2 px-3 py-[11px] rounded-[14px]"
                  style={{ backgroundColor: c.surfaceAlt }}
                >
                  <View
                    className="w-[22px] h-[22px] rounded-full items-center justify-center"
                    style={{ backgroundColor: c.primary }}
                  >
                    <Text className="font-bodyBold text-white text-[10px]">
                      {(partnerName.trim()[0] ?? 'M').toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    className="flex-1 font-body text-[12px]"
                    style={{ color: c.inkSoft }}
                    numberOfLines={1}
                  >
                    {labels.youPending}
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
