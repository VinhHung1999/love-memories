import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { SafeScreen, TabBarSpacer } from '@/components';
import { useCameraSheetStore } from '@/stores/cameraSheetStore';
import { useAppColors } from '@/theme/ThemeProvider';

import { CalendarCard } from './components/CalendarCard';
import { DayHeroCard } from './components/DayHeroCard';
import { MiniMomentCard } from './components/MiniMomentCard';
import { useMomentsViewModel, type ViewMode } from './useMomentsViewModel';

// T384 (Sprint 62) — Moments tab calendar view. Prototype source of truth:
// docs/design/prototype/memoura-v2/moments2.jsx. Tap a date → filter selected
// day's moments (DayHeroCard / hero + mini grid). Tap same day again → revert
// to today (decided with Lu: matches prototype intent, no extra clear chip).
//
// Layout:
//   Header (eyebrow + "Khoảnh khắc" + Month/Week pill toggle on the right)
//   CalendarCard (month nav ◀▶ + weekday header + 7-col grid + legend)
//   SelectedDayHeader (weekday name + ordinal day + count chip)
//   Selected content: empty-state | DayHeroCard | hero + 2-col mini grid
//   TabBarSpacer (floating pill clearance)
//
// Scroll is a plain ScrollView — filter model means the content below the
// calendar is always just one day's worth, so the FlatList virtualization
// from the timeline is unnecessary here.
//
// T385 item 6 (Sprint 62 polish): the calendar ALWAYS renders whenever the
// data layer isn't in initial loading/error. If the couple has 0 moments the
// grid is just empty dots + an in-card EmptyTotal block (polaroid hero +
// camera CTA). Previously this whole screen forked to MomentsEmpty which
// Boss read as "chưa hiển thị, đang là 1 khoảng trắng" on Build 42.
//
// Bomb-check receipts (pre-commit): className strings static, conditional
// values via style prop + useAppColors(). Every `active:` modifier lives on
// a className that never flips branches.

export function MomentsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();

  const vm = useMomentsViewModel();

  const openCameraSheet = useCallback(() => {
    useCameraSheetStore.getState().open();
  }, []);

  const openDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/moment-detail', params: { id } });
    },
    [router],
  );

  const grid = vm.viewMode === 'week' ? vm.weekGrid : vm.grid;
  const selectedMoments = vm.selectedDayMoments;

  const dayName = formatWeekday(vm.selectedDay, i18n.language);
  const dayOrdinal = formatDayOrdinal(vm.selectedDay, i18n.language);

  return (
    <SafeScreen edges={['top']}>
      <Header
        eyebrow={t('moments.list.eyebrow')}
        title={t('moments.list.title')}
        viewMode={vm.viewMode}
        onSetViewMode={vm.setViewMode}
        monthLabel={t('moments.list.view.month')}
        weekLabel={t('moments.list.view.week')}
      />

      {vm.loading && vm.total === 0 ? (
        <CenterFill>
          <ActivityIndicator color={c.primary} />
        </CenterFill>
      ) : vm.error && vm.total === 0 ? (
        <CenterFill>
          <Text className="font-bodyMedium text-ink text-[15px] text-center px-8">
            {t('moments.list.error')}
          </Text>
          <Pressable
            onPress={vm.reload}
            accessibilityRole="button"
            className="mt-5 px-5 h-10 rounded-full bg-primary items-center justify-center active:bg-primary-deep"
          >
            <Text className="font-bodySemibold text-white text-[14px]">
              {t('moments.list.retry')}
            </Text>
          </Pressable>
        </CenterFill>
      ) : (
        <ScrollView
          contentContainerClassName="pt-2"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={vm.refreshing}
              onRefresh={vm.onRefresh}
              tintColor={c.primary}
            />
          }
        >
          <CalendarCard
            grid={grid}
            monthAnchor={vm.monthAnchor}
            onPrevMonth={vm.prevMonth}
            onNextMonth={vm.nextMonth}
            onSelectDay={vm.setSelectedDay}
            daysWithMomentsCount={vm.daysWithMomentsCount}
          />

          <SelectedDayHeader
            dayName={dayName}
            dayOrdinal={dayOrdinal}
            count={selectedMoments.length}
            countLabel={t('moments.list.selected.count', {
              count: selectedMoments.length,
            })}
          />

          <View className="px-5 mt-3">
            {selectedMoments.length === 0 ? (
              vm.total === 0 ? (
                <EmptyTotal
                  title={t('moments.list.empty.title')}
                  subtitle={t('moments.list.empty.subtitle')}
                  ctaLabel={t('moments.list.empty.cta')}
                  onCta={openCameraSheet}
                />
              ) : (
                <EmptyDay
                  title={t('moments.list.selected.emptyTitle')}
                  subtitle={t('moments.list.selected.emptySubtitle')}
                />
              )
            ) : selectedMoments.length === 1 ? (
              <DayHeroCard moment={selectedMoments[0]} onPress={openDetail} />
            ) : (
              <>
                <DayHeroCard moment={selectedMoments[0]} onPress={openDetail} />
                <View className="flex-row flex-wrap mt-2.5 -mx-1">
                  {selectedMoments.slice(1).map((m) => (
                    <View key={m.id} className="w-1/2 p-1">
                      <MiniMomentCard moment={m} onPress={openDetail} />
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          <TabBarSpacer />
        </ScrollView>
      )}
    </SafeScreen>
  );
}

type HeaderProps = {
  eyebrow: string;
  title: string;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  monthLabel: string;
  weekLabel: string;
};

function Header({
  eyebrow,
  title,
  viewMode,
  onSetViewMode,
  monthLabel,
  weekLabel,
}: HeaderProps) {
  return (
    <View className="flex-row items-end justify-between px-5 pt-2 pb-3">
      <View>
        <Text className="font-body text-ink-mute text-[12px] uppercase tracking-widest">
          {eyebrow}
        </Text>
        <Text className="font-displayMedium text-ink text-[32px] leading-[36px] mt-1">
          {title}
        </Text>
      </View>
      <ViewToggle
        viewMode={viewMode}
        onSet={onSetViewMode}
        monthLabel={monthLabel}
        weekLabel={weekLabel}
      />
    </View>
  );
}

type ViewToggleProps = {
  viewMode: ViewMode;
  onSet: (mode: ViewMode) => void;
  monthLabel: string;
  weekLabel: string;
};

function ViewToggle({ viewMode, onSet, monthLabel, weekLabel }: ViewToggleProps) {
  return (
    <View className="flex-row bg-surface-alt rounded-xl p-0.5">
      <ToggleBtn active={viewMode === 'month'} onPress={() => onSet('month')}>
        {monthLabel}
      </ToggleBtn>
      <ToggleBtn active={viewMode === 'week'} onPress={() => onSet('week')}>
        {weekLabel}
      </ToggleBtn>
    </View>
  );
}

function ToggleBtn({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: string;
}) {
  const c = useAppColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="px-3 py-1.5 rounded-lg active:opacity-80"
      style={{
        backgroundColor: active ? c.bgElev : 'transparent',
      }}
    >
      <Text
        className="font-bodySemibold text-[12px]"
        style={{ color: active ? c.ink : c.inkMute }}
      >
        {children}
      </Text>
    </Pressable>
  );
}

type SelectedDayHeaderProps = {
  dayName: string;
  dayOrdinal: string;
  count: number;
  countLabel: string;
};

function SelectedDayHeader({
  dayName,
  dayOrdinal,
  count,
  countLabel,
}: SelectedDayHeaderProps) {
  const c = useAppColors();
  return (
    <View className="px-5 pt-6">
      <Text className="font-body text-ink-mute text-[11px] uppercase tracking-widest">
        {dayName}
      </Text>
      <View className="flex-row items-baseline mt-1">
        <Text className="font-displayMedium text-ink text-[26px] leading-[30px]">
          {dayOrdinal}
        </Text>
        {count > 0 ? (
          <Text
            className="font-body text-[14px] ml-2"
            style={{ color: c.inkMute }}
          >
            · {countLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function EmptyDay({ title, subtitle }: { title: string; subtitle: string }) {
  const c = useAppColors();
  return (
    <View
      className="rounded-3xl py-10 px-5 items-center bg-surface"
      style={{
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: c.line,
      }}
    >
      <Text className="text-[36px] mb-2">📷</Text>
      <Text className="font-bodySemibold text-ink-soft text-[14px] text-center">
        {title}
      </Text>
      <Text className="font-body text-ink-mute text-[12px] text-center mt-1">
        {subtitle}
      </Text>
    </View>
  );
}

type EmptyTotalProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
};

// T385 item 6 — in-calendar empty state for couples with 0 moments total.
// Polaroid hero copied from MomentsEmpty so the vibe survives the layout
// change (calendar always renders above, this card sits under SelectedDayHeader).
function EmptyTotal({ title, subtitle, ctaLabel, onCta }: EmptyTotalProps) {
  const c = useAppColors();
  return (
    <View
      className="rounded-3xl py-8 px-5 items-center bg-surface"
      style={{
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: c.line,
      }}
    >
      <View className="w-[200px] h-[140px] items-center justify-center mb-4">
        <View className="absolute left-0 top-3 w-[76px] h-[96px] rounded-xl bg-surface border border-line-on-surface -rotate-6 items-center justify-center">
          <Text className="font-displayMedium text-ink-mute text-[26px]">+</Text>
        </View>
        <View className="absolute right-0 top-3 w-[76px] h-[96px] rounded-xl bg-surface border border-line-on-surface rotate-6 items-center justify-center">
          <Text className="font-displayMedium text-ink-mute text-[26px]">+</Text>
        </View>
        <View className="absolute left-[50px] top-0 w-[100px] h-[120px] rounded-2xl bg-surface border border-line-on-surface items-center justify-center shadow-lg">
          <Text className="text-primary text-[40px]">♡</Text>
        </View>
      </View>

      <Text className="font-displayMedium text-ink text-[20px] leading-[26px] text-center max-w-[260px]">
        {title}
      </Text>
      <Text className="font-body text-ink-mute text-[13px] leading-[20px] text-center mt-2 max-w-[260px]">
        {subtitle}
      </Text>

      <Pressable
        onPress={onCta}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        className="mt-5 flex-row items-center px-6 h-11 rounded-full bg-primary shadow-lg active:bg-primary-deep"
      >
        <Plus size={16} strokeWidth={2.5} color="#ffffff" />
        <Text className="font-bodySemibold text-white text-[14px] ml-2">
          {ctaLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function CenterFill({ children }: { children: React.ReactNode }) {
  return <View className="flex-1 items-center justify-center">{children}</View>;
}

const VI_DAY_NAMES = [
  'Chủ nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

const EN_DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const VI_MONTH_SHORT = [
  'thg 1',
  'thg 2',
  'thg 3',
  'thg 4',
  'thg 5',
  'thg 6',
  'thg 7',
  'thg 8',
  'thg 9',
  'thg 10',
  'thg 11',
  'thg 12',
];

const EN_MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatWeekday(key: string, lang: string): string {
  const names = lang.startsWith('vi') ? VI_DAY_NAMES : EN_DAY_NAMES;
  return names[parseKey(key).getDay()];
}

function formatDayOrdinal(key: string, lang: string): string {
  const d = parseKey(key);
  const isVi = lang.startsWith('vi');
  const months = isVi ? VI_MONTH_SHORT : EN_MONTH_SHORT;
  return isVi
    ? `Ngày ${d.getDate()} ${months[d.getMonth()]}`
    : `${months[d.getMonth()]} ${d.getDate()}`;
}
