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

import { LinearGradient, SafeScreen, TabBarSpacer } from '@/components';
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
// T385 item 6 (Sprint 62 polish) — when the couple has 0 moments, render the
// dedicated EmptyMomentsScreen layout from
// docs/design/prototype/memoura-v2/empty-states.jsx L190-385:
//   Header (no view toggle)
//   Dimmed CalendarCard (isEmpty=true, floating pill)
//   Illustration block (NOT carded — 3 frames + title + subtitle + CTA pill)
//   Partner whisper card (accent-soft bg, heroA→heroB gradient avatar)
// Non-empty branch is UNCHANGED from T384.
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

  const isLoading = vm.loading && vm.total === 0;
  const isError = vm.error && vm.total === 0;
  const isEmpty = !isLoading && !isError && vm.total === 0;

  if (isLoading) {
    return (
      <SafeScreen edges={['top']}>
        <HeaderDefault
          eyebrow={t('moments.list.eyebrow')}
          title={t('moments.list.title')}
          viewMode={vm.viewMode}
          onSetViewMode={vm.setViewMode}
          monthLabel={t('moments.list.view.month')}
          weekLabel={t('moments.list.view.week')}
        />
        <CenterFill>
          <ActivityIndicator color={c.primary} />
        </CenterFill>
      </SafeScreen>
    );
  }

  if (isError) {
    return (
      <SafeScreen edges={['top']}>
        <HeaderDefault
          eyebrow={t('moments.list.eyebrow')}
          title={t('moments.list.title')}
          viewMode={vm.viewMode}
          onSetViewMode={vm.setViewMode}
          monthLabel={t('moments.list.view.month')}
          weekLabel={t('moments.list.view.week')}
        />
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
      </SafeScreen>
    );
  }

  if (isEmpty) {
    return (
      <SafeScreen edges={['top']}>
        <HeaderEmpty
          eyebrow={t('moments.list.empty.eyebrow')}
          title={t('moments.list.title')}
        />
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
            isEmpty
            emptyPillLabel={t('moments.list.empty.calendarWaiting')}
          />
          <EmptyIllustrationBlock
            title={t('moments.list.empty.title')}
            subtitle={t('moments.list.empty.subtitle')}
            ctaLabel={t('moments.list.empty.cta')}
            onCta={openCameraSheet}
          />
          <PartnerWhisperCard
            hasPartner={vm.hasCouple && !!vm.partnerName}
            partnerName={vm.partnerName ?? ''}
            partnerInitial={vm.partnerInitial}
          />
          <TabBarSpacer />
        </ScrollView>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen edges={['top']}>
      <HeaderDefault
        eyebrow={t('moments.list.eyebrow')}
        title={t('moments.list.title')}
        viewMode={vm.viewMode}
        onSetViewMode={vm.setViewMode}
        monthLabel={t('moments.list.view.month')}
        weekLabel={t('moments.list.view.week')}
      />
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
            <EmptyDay
              title={t('moments.list.selected.emptyTitle')}
              subtitle={t('moments.list.selected.emptySubtitle')}
            />
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
    </SafeScreen>
  );
}

type HeaderDefaultProps = {
  eyebrow: string;
  title: string;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  monthLabel: string;
  weekLabel: string;
};

function HeaderDefault({
  eyebrow,
  title,
  viewMode,
  onSetViewMode,
  monthLabel,
  weekLabel,
}: HeaderDefaultProps) {
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

function HeaderEmpty({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View className="px-5 pt-2 pb-3">
      <Text className="font-body text-ink-mute text-[12px] uppercase tracking-widest">
        {eyebrow}
      </Text>
      <Text className="font-displayMedium text-ink text-[32px] leading-[36px] mt-1">
        {title}
      </Text>
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
      className="rounded-[22px] py-10 px-5 items-center bg-surface"
      style={{
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: c.lineOnSurface,
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

type EmptyIllustrationBlockProps = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onCta: () => void;
};

// T385 item 6 — prototype empty-states.jsx L289-357. The polaroid stack is
// NOT wrapped in a bordered card (vibe: illustration floats on bg). 3 frames
// — outer pair rotated ±7° with "+", center elevated with heart. CTA pill is
// filled primary with a soft deep shadow.
function EmptyIllustrationBlock({
  title,
  subtitle,
  ctaLabel,
  onCta,
}: EmptyIllustrationBlockProps) {
  const c = useAppColors();
  return (
    <View className="items-center mt-10 px-5">
      <View className="w-[180px] h-[130px] items-center justify-center mb-5">
        {/* frame 1 — left, rotated -7° */}
        <View
          className="absolute left-0 top-[14px] w-20 h-[100px] rounded-[10px] bg-surface items-center justify-center -rotate-6"
          style={{ borderWidth: 1.5, borderColor: c.line }}
        >
          <Text
            className="font-displayMedium text-[28px]"
            style={{ color: c.inkMute }}
          >
            +
          </Text>
        </View>
        {/* frame 3 — right, rotated +7° */}
        <View
          className="absolute right-0 top-[14px] w-20 h-[100px] rounded-[10px] bg-surface items-center justify-center rotate-6"
          style={{ borderWidth: 1.5, borderColor: c.line }}
        >
          <Text
            className="font-displayMedium text-[28px]"
            style={{ color: c.inkMute }}
          >
            +
          </Text>
        </View>
        {/* frame 2 — center, elevated */}
        <View
          className="absolute top-0 w-[100px] h-[120px] rounded-[12px] bg-surface items-center justify-center shadow-lg"
          style={{ borderWidth: 1.5, borderColor: c.line }}
        >
          <Text className="text-[40px]" style={{ color: c.primary }}>
            ♡
          </Text>
        </View>
      </View>

      <Text
        className="font-displayMedium text-ink text-[24px] leading-[28px] text-center"
        style={{ maxWidth: 260 }}
      >
        {title}
      </Text>
      <Text
        className="font-body text-ink-mute text-[13.5px] leading-[21px] text-center mt-2.5"
        style={{ maxWidth: 280 }}
      >
        {subtitle}
      </Text>

      <Pressable
        onPress={onCta}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}
        className="mt-6 flex-row items-center px-7 h-[46px] rounded-full bg-primary shadow-lg active:bg-primary-deep"
      >
        <Plus size={18} strokeWidth={2.5} color="#ffffff" />
        <Text className="font-bodySemibold text-white text-[14.5px] ml-2">
          {ctaLabel}
        </Text>
      </Pressable>
    </View>
  );
}

type PartnerWhisperCardProps = {
  hasPartner: boolean;
  partnerName: string;
  partnerInitial: string;
};

// T385 item 6 — prototype empty-states.jsx L359-380. accent-soft bg, 34×34
// heroA→heroB gradient avatar with partner's first initial. Text is prefix +
// **bold tail**. Solo branch (no partner) uses a different copy pair so the
// card never reads weird ("undefined hasn't added anything").
function PartnerWhisperCard({
  hasPartner,
  partnerName,
  partnerInitial,
}: PartnerWhisperCardProps) {
  const c = useAppColors();
  const { t } = useTranslation();

  const prefix = hasPartner
    ? t('moments.list.empty.whisperPrefix', { name: partnerName })
    : t('moments.list.empty.whisperSoloPrefix');
  const tail = hasPartner
    ? t('moments.list.empty.whisperTail')
    : t('moments.list.empty.whisperSoloTail');

  return (
    <View className="mx-5 mt-6 p-3.5 rounded-2xl bg-accent-soft flex-row items-center">
      <LinearGradient
        colors={[c.heroA, c.heroB]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-[34px] h-[34px] rounded-full items-center justify-center"
      >
        <Text className="font-displayMedium text-white text-[14px]">
          {hasPartner ? partnerInitial : '♡'}
        </Text>
      </LinearGradient>
      <View className="flex-1 min-w-0 ml-2.5">
        <Text className="font-body text-ink text-[12.5px] leading-[18px]">
          {prefix}
          <Text className="font-bodyBold">{tail}</Text>
        </Text>
      </View>
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
