import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useAppColors } from '@/theme/ThemeProvider';

import type { DayCell as DayCellModel } from '../useMomentsViewModel';

// T384 — single cell in the calendar date grid. Hard rule (NativeWind v4
// conditional-className crash): `className` is a SINGLE STATIC STRING; every
// runtime-varying value (bg color, border color/width, text color) goes on
// `style` prop via `useAppColors()`. The only className branches are
// emptiness (null cell) and whether the cell is pressable — both static for
// the lifetime of the cell.
//
// T385 item 6 (Sprint 62 polish) — `isEmpty` dim mode for the
// EmptyMomentsScreen calendar (docs/design/prototype/memoura-v2/empty-states.jsx
// L245-270). All cells dim to `inkMute + 'aa'`, press is disabled, and
// today uses `primarySoft` bg + a pulsing 4x4 dot at the bottom.

type Props = {
  cell: DayCellModel | null;
  onPress: (dateKey: string) => void;
  isEmpty?: boolean;
};

export function DayCellView({ cell, onPress, isEmpty = false }: Props) {
  const c = useAppColors();

  if (!cell) {
    return <View className="flex-1 aspect-square" />;
  }

  const { day, dateKey, hasMoments, count, isToday, isSelected } = cell;

  if (isEmpty) {
    const bgColor = isToday ? c.primarySoft : 'transparent';
    const textColor = isToday ? c.primary : c.inkMute + 'aa';
    return (
      <View className="flex-1 aspect-square p-0.5">
        <View
          className="flex-1 rounded-[10px] items-center justify-center"
          style={{ backgroundColor: bgColor }}
        >
          <Text
            className="font-body text-[11px]"
            style={{
              color: textColor,
              fontWeight: isToday ? '700' : '400',
            }}
          >
            {day}
          </Text>
          {isToday ? <TodayPulseDot color={c.primary} /> : null}
        </View>
      </View>
    );
  }

  // Background: filled primary for days with moments; transparent otherwise.
  // Selected + hasMoments = primary-deep, Selected + empty = bordered only.
  // Today = primary-tinted border if neither selected nor has moments.
  const bgColor = hasMoments
    ? isSelected
      ? c.primaryDeep
      : c.primary
    : 'transparent';
  const borderColor = isSelected ? c.ink : isToday ? c.primary : 'transparent';
  const borderWidth = isSelected ? 2 : isToday ? 1.5 : 0;
  const textColor = hasMoments ? '#ffffff' : isSelected ? c.ink : c.inkSoft;

  return (
    <Pressable
      onPress={() => onPress(dateKey)}
      accessibilityRole="button"
      accessibilityLabel={dateKey}
      className="flex-1 aspect-square p-0.5 active:opacity-80"
    >
      <View
        className="flex-1 rounded-[10px] items-center justify-center"
        style={{
          backgroundColor: bgColor,
          borderColor,
          borderWidth,
        }}
      >
        <Text
          className="font-bodyBold text-[12px]"
          style={{ color: textColor }}
        >
          {day}
        </Text>
        {hasMoments && count > 1 ? (
          <View
            className="absolute top-1 right-1 w-[5px] h-[5px] rounded-full"
            style={{ backgroundColor: '#ffffff' }}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

// Reanimated v4 — opacity pulse 0.5 ↔ 0.9, infinite. Color captured outside
// the worklet per mobile-rework hard rule.
function TodayPulseDot({ color }: { color: string }) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.9, { duration: 1000 }),
      -1,
      true,
    );
  }, [opacity]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      className="absolute bottom-[3px] w-1 h-1 rounded-full"
      style={[{ backgroundColor: color }, animatedStyle]}
    />
  );
}
