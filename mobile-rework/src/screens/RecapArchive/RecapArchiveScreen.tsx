// Sprint 67 T458 — RecapArchive view. Reachable from Profile via the
// "Lưu trữ recap" SettingsRow. Two lists (months + weeks) with tap
// → respective recap screen.

import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { SafeScreen } from '@/components';
import { useAppColors } from '@/theme/ThemeProvider';

import {
  type ArchiveMonthEntry,
  type ArchiveWeekEntry,
  useRecapArchiveViewModel,
} from './useRecapArchiveViewModel';

export function RecapArchiveScreen() {
  const vm = useRecapArchiveViewModel();
  const router = useRouter();
  const { t } = useTranslation();
  const c = useAppColors();

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  return (
    <SafeScreen edges={['top']}>
      <View className="flex-row items-center gap-2 px-4 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          className="h-9 w-9 items-center justify-center rounded-full bg-surface-alt active:opacity-70"
        >
          <ChevronLeft size={20} color={c.ink} strokeWidth={2.2} />
        </Pressable>
        <Text className="font-displayMedium text-[20px] text-ink">
          {t('recapArchive.title')}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mx-5 mt-1 font-body text-[13px] leading-[19px] text-ink-soft">
          {vm.introBody}
        </Text>

        <SectionHeader title={vm.monthsTitle} />
        <View className="mx-5 overflow-hidden rounded-2xl border border-line bg-surface">
          {vm.months.map((m, i) => (
            <MonthRow
              key={m.monthStr}
              entry={m}
              isLast={i === vm.months.length - 1}
              onPress={() => vm.onOpenMonth(m.monthStr)}
            />
          ))}
        </View>

        <SectionHeader title={vm.weeksTitle} />
        <View className="mx-5 overflow-hidden rounded-2xl border border-line bg-surface">
          {vm.weeks.map((w, i) => (
            <WeekRow
              key={w.weekStr}
              entry={w}
              isLast={i === vm.weeks.length - 1}
              onPress={() => vm.onOpenWeek(w.weekStr)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="mx-5 mb-2 mt-7 font-displayItalic text-[11px] uppercase tracking-[2px] text-ink-mute">
      {title}
    </Text>
  );
}

function MonthRow({
  entry,
  isLast,
  onPress,
}: {
  entry: ArchiveMonthEntry;
  isLast: boolean;
  onPress: () => void;
}) {
  const c = useAppColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={
        isLast
          ? 'flex-row items-center gap-3 px-4 py-4 active:opacity-70'
          : 'flex-row items-center gap-3 border-b border-line-soft-on-surface px-4 py-4 active:opacity-70'
      }
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft">
        <Text className="font-displayBold text-[14px] text-primary">
          {entry.title.charAt(entry.title.length - 1) === '2' ||
          entry.title.startsWith('Tháng')
            ? entry.monthStr.slice(-2)
            : entry.title.slice(0, 3)}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-bodySemibold text-[15px] text-ink">{entry.title}</Text>
        <Text className="mt-0.5 font-body text-[12px] text-ink-mute">{entry.sub}</Text>
      </View>
      <ChevronRight size={18} color={c.inkMute} strokeWidth={2} />
    </Pressable>
  );
}

function WeekRow({
  entry,
  isLast,
  onPress,
}: {
  entry: ArchiveWeekEntry;
  isLast: boolean;
  onPress: () => void;
}) {
  const c = useAppColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={
        isLast
          ? 'flex-row items-center gap-3 px-4 py-4 active:opacity-70'
          : 'flex-row items-center gap-3 border-b border-line-soft-on-surface px-4 py-4 active:opacity-70'
      }
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft">
        <Text className="font-displayBold text-[14px] text-accent">
          {entry.weekStr.slice(-2)}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-bodySemibold text-[15px] text-ink">{entry.title}</Text>
        <Text className="mt-0.5 font-body text-[12px] text-ink-mute">{entry.sub}</Text>
      </View>
      <ChevronRight size={18} color={c.inkMute} strokeWidth={2} />
    </Pressable>
  );
}
