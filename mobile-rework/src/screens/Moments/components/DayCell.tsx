import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { DayCell as DayCellModel } from '../useMomentsViewModel';

// T384 — single cell in the calendar date grid. Hard rule (NativeWind v4
// conditional-className crash): `className` is a SINGLE STATIC STRING; every
// runtime-varying value (bg color, border color/width, text color) goes on
// `style` prop via `useAppColors()`. The only className branches are
// emptiness (null cell) and whether the cell is pressable — both static for
// the lifetime of the cell.

type Props = {
  cell: DayCellModel | null;
  onPress: (dateKey: string) => void;
};

export function DayCellView({ cell, onPress }: Props) {
  const c = useAppColors();

  if (!cell) {
    return <View className="flex-1 aspect-square" />;
  }

  const { day, dateKey, hasMoments, count, isToday, isSelected } = cell;

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
