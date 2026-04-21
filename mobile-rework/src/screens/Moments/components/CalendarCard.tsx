import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import type { DayCell } from '../useMomentsViewModel';
import { DayCellView } from './DayCell';

// T384 — calendar card: month nav row + weekday header + 7-col day grid +
// legend footer. Stateless — receives grid/onSelect/nav callbacks from the
// ViewModel. Per mobile-rework rule, className is a SINGLE STATIC STRING;
// conditional colors (weekend emphasis, legend swatch) go through the style
// prop with `useAppColors()`.
//
// Weekday labels are hardcoded per-locale (Lu's reminder: Intl weekday:short
// returns 'Th 2' flavors for vi-VN). Month label uses Intl long-month then
// reshapes to Vietnamese "Tháng X YYYY" vs English "Month YYYY".

type Props = {
  grid: (DayCell | null)[];
  monthAnchor: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (dateKey: string) => void;
  daysWithMomentsCount: number;
};

const VI_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const EN_WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const VI_MONTHS = [
  'Tháng Một',
  'Tháng Hai',
  'Tháng Ba',
  'Tháng Tư',
  'Tháng Năm',
  'Tháng Sáu',
  'Tháng Bảy',
  'Tháng Tám',
  'Tháng Chín',
  'Tháng Mười',
  'Tháng Mười Một',
  'Tháng Mười Hai',
];

const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatMonthLabel(d: Date, lang: string): string {
  const isVi = lang.startsWith('vi');
  const names = isVi ? VI_MONTHS : EN_MONTHS;
  return `${names[d.getMonth()]} ${d.getFullYear()}`;
}

export function CalendarCard({
  grid,
  monthAnchor,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  daysWithMomentsCount,
}: Props) {
  const { t, i18n } = useTranslation();
  const c = useAppColors();
  const isVi = i18n.language.startsWith('vi');
  const weekdays = isVi ? VI_WEEKDAYS : EN_WEEKDAYS;

  const rows: (DayCell | null)[][] = [];
  for (let i = 0; i < grid.length; i += 7) {
    rows.push(grid.slice(i, i + 7));
  }

  return (
    <View className="mx-5 rounded-3xl bg-surface border border-line p-4 shadow-sm">
      {/* Month nav */}
      <View className="flex-row items-center justify-between mb-3">
        <Pressable
          onPress={onPrevMonth}
          accessibilityRole="button"
          accessibilityLabel={t('moments.list.nav.prevMonth')}
          hitSlop={8}
          className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center active:opacity-80"
        >
          <ChevronLeft size={14} strokeWidth={2.5} color={c.ink} />
        </Pressable>
        <Text className="font-displayMedium text-ink text-[18px]">
          {formatMonthLabel(monthAnchor, i18n.language)}
        </Text>
        <Pressable
          onPress={onNextMonth}
          accessibilityRole="button"
          accessibilityLabel={t('moments.list.nav.nextMonth')}
          hitSlop={8}
          className="w-8 h-8 rounded-full bg-surface-alt items-center justify-center active:opacity-80"
        >
          <ChevronRight size={14} strokeWidth={2.5} color={c.ink} />
        </Pressable>
      </View>

      {/* Weekday header */}
      <View className="flex-row mb-1">
        {weekdays.map((label, i) => (
          <View key={i} className="flex-1 items-center py-1">
            <Text
              className="font-bodyBold text-[10px] uppercase tracking-wider"
              style={{ color: i === 0 || i === 6 ? c.primary : c.inkMute }}
            >
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Date grid — row-based so cells keep aspect-square */}
      {rows.map((row, r) => (
        <View key={r} className="flex-row">
          {row.map((cell, i) => (
            <DayCellView
              key={`${r}-${i}`}
              cell={cell}
              onPress={onSelectDay}
            />
          ))}
        </View>
      ))}

      {/* Legend */}
      <View
        className="flex-row items-center mt-3 pt-3 border-t"
        style={{ borderTopColor: c.line }}
      >
        <View className="flex-row items-center gap-1.5">
          <View
            className="w-[10px] h-[10px] rounded-[3px]"
            style={{ backgroundColor: c.primary }}
          />
          <Text className="font-body text-ink-mute text-[10px]">
            {t('moments.list.legend.hasMoments')}
          </Text>
        </View>
        <View className="w-3" />
        <View className="flex-row items-center gap-1.5">
          <View
            className="w-[5px] h-[5px] rounded-full"
            style={{ backgroundColor: c.ink }}
          />
          <Text className="font-body text-ink-mute text-[10px]">
            {t('moments.list.legend.multiple')}
          </Text>
        </View>
        <View className="flex-1" />
        <Text className="font-bodyBold text-ink text-[10px]">
          {t('moments.list.legend.dayCount', { count: daysWithMomentsCount })}
        </Text>
      </View>
    </View>
  );
}
