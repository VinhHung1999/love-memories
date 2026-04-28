// Sprint 67 T453 — Streak callout under the by-numbers grid (prototype
// `recap.jsx` L164-193). Big square chip with the streak count, label
// row ("ngày trả lời liền"), Daily Q sub-line, and a row of mini growing
// vertical bars on the right.

import { Text, View } from 'react-native';

type Props = {
  streakLabel: string;       // 'ngày trả lời liền'
  questionsLabel: string;    // 'Daily Q · 89 câu hỏi'
  streakCount: number;
};

export function StreakCallout({ streakLabel, questionsLabel, streakCount }: Props) {
  // 12 bars with growing-then-shrinking heights. Mirrors prototype logic
  // (i % 3 === 0 → 14, i % 2 === 0 → 20, else → 10) + opacity climbing.
  const bars = Array.from({ length: 12 }).map((_, i) => ({
    height: i % 3 === 0 ? 14 : i % 2 === 0 ? 20 : 10,
    opacity: 0.3 + i / 14,
  }));

  return (
    <View className="mt-2.5 flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft">
        <Text className="font-displayBold text-[20px] text-accent">{streakCount}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-bodySemibold text-[14px] leading-[16px] text-ink">
          {streakLabel}
        </Text>
        <Text className="mt-0.5 font-body text-[12px] text-ink-mute">{questionsLabel}</Text>
      </View>
      <View className="flex-row items-end gap-[3px]">
        {bars.map((b, i) => (
          <View
            key={i}
            className="w-[5px] rounded-[2px] bg-accent"
            style={{ height: b.height, opacity: b.opacity }}
          />
        ))}
      </View>
    </View>
  );
}
