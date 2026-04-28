// Sprint 67 T452 — Cover hero rendered at the top of MonthlyRecapScreen
// (and reused by WeeklyRecapScreen in T456). Ports prototype `recap.jsx`
// L566-696 RecapCover() to RN.
//
// Translation notes vs prototype:
//   • SVG heart watermark + radial-gradient ambient skipped — pure decorative,
//     adds two more deps to thread + RN doesn't have native radial gradients.
//     Ship the gradient + heart can come back in a follow-up if Boss flags
//     the cover feels flat.
//   • Dancing Script use on the couple-name line follows prototype (rule #6).
//     CLAUDE.md scope previously was Letters + Dashboard Timer Hero only —
//     Sprint 67 expands to Recap cover + closing per the prototype. Flagged
//     to PO in the T452 commit; revert to font-displayItalic if Boss vetoes.
//   • Pulse + scroll-dot animations driven by Reanimated v4 worklets.
//     useAppColors() values captured OUTSIDE the worklet per the
//     reanimated-worklet-colors gotcha in MEMORY.md.

import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppColors } from '@/theme/ThemeProvider';

import type { CoverInlineStat, CoverPerson, CoverViewModel } from '../useMonthlyRecapViewModel';

type Props = {
  cover: CoverViewModel;
};

export function RecapCover({ cover }: Props) {
  const c = useAppColors();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[c.heroA, c.heroB, c.heroC]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      // Spec minHeight 540 + cover gradient bleeds into the status bar.
      // padding-top respects safe-area + extra 60px breathing room above the
      // RECAP kicker so it doesn't hug the close button.
      style={{ paddingTop: insets.top + 60 }}
    >
      <View className="min-h-[540px] px-6 pb-10">
        <View className="flex-row items-center gap-2">
          <Text className="font-bodyBold text-[11px] uppercase tracking-[1.2px] text-white/85">
            {cover.kicker}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center gap-3">
          <View className="h-9 w-[58px]">
            {cover.people.map((person, i) => (
              <PersonAvatar key={i} person={person} index={i} />
            ))}
          </View>
          <Text className="font-script text-[22px] text-white/90">
            {cover.coupleNamesScript}
          </Text>
        </View>

        <Text className="mt-9 font-displayMedium text-[72px] leading-[68px] text-white">
          {cover.titleLine1}
        </Text>
        <Text className="font-displayMedium text-[72px] leading-[68px] text-white">
          {cover.titleLine2}
        </Text>

        <CoverPill label={cover.coverKicker} />

        <View className="mt-8 flex-row gap-2">
          {cover.inlineStats.map((stat, i) => (
            <InlineStatCell key={i} stat={stat} />
          ))}
        </View>

        <ScrollHint label={cover.scrollHint} />
      </View>
    </LinearGradient>
  );
}

function PersonAvatar({ person, index }: { person: CoverPerson; index: number }) {
  const c = useAppColors();
  const offsetLeft = index * 18;
  const offsetTop = index * 2;

  // Two-tone gradient per person matches prototype L607-609.
  const gradientColors: readonly [string, string] =
    person.gradientKey === 'A' ? [c.heroA, c.secondary] : [c.secondary, c.primary];

  return (
    <View
      className="absolute h-8 w-8 overflow-hidden rounded-full border-2 border-white/60"
      style={{ left: offsetLeft, top: offsetTop }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text className="font-bodyBold text-[13px] text-white">{person.initial}</Text>
      </LinearGradient>
    </View>
  );
}

function CoverPill({ label }: { label: string }) {
  const dot = useSharedValue(0.3);

  useEffect(() => {
    dot.value = withRepeat(
      withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [dot]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: dot.value }));

  return (
    <View className="mt-5 flex-row items-center gap-2 self-start rounded-full border border-white/30 bg-white/15 px-3 py-1.5">
      <Animated.View
        className="h-1.5 w-1.5 rounded-full bg-white"
        style={dotStyle}
      />
      <Text className="font-bodyBold text-[11px] uppercase tracking-[1px] text-white">
        {label}
      </Text>
    </View>
  );
}

function InlineStatCell({ stat }: { stat: CoverInlineStat }) {
  return (
    <View className="flex-1 rounded-2xl border border-white/30 bg-white/15 px-3 py-3">
      <Text className="font-displayBold text-[30px] leading-[30px] text-white">
        {stat.value}
      </Text>
      <Text className="mt-1 font-bodySemibold text-[10px] uppercase tracking-[1px] text-white/80">
        {stat.label}
      </Text>
    </View>
  );
}

function ScrollHint({ label }: { label: string }) {
  const dot = useSharedValue(0);

  useEffect(() => {
    dot.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [dot]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dot.value * 8 }],
    opacity: 1 - dot.value * 0.3,
  }));

  return (
    <View className="mt-9 flex-row items-center gap-2">
      <View className="h-7 w-[18px] items-center rounded-full border border-white/70 pt-1">
        <Animated.View
          className="h-1.5 w-0.5 rounded-full bg-white"
          style={dotStyle}
        />
      </View>
      <Text className="font-bodySemibold text-[11px] uppercase tracking-[1.5px] text-white/70">
        {label}
      </Text>
    </View>
  );
}
