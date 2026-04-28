// Sprint 67 T456 — WeeklyRecapScreen.
// Compact 5-section editorial scroll. Reuses Monthly's primitives:
// RecapCover, BigStatCard, HeatmapGrid (with weekday labels via the new
// `labels` prop), TopMomentCard, RecapSection. The closing block is
// inline (smaller than Monthly's full ClosingNoteCard) with a single
// Send-to-partner CTA — sized for the "1-screen scroll on most devices"
// brief in the spec.

import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useAppColors } from '@/theme/ThemeProvider';

import {
  BigStatCard,
  CloseFloatingButton,
  HeatmapGrid,
  RecapCover,
  RecapSection,
  TopMomentCard,
} from './components';
import { useWeeklyRecapViewModel } from './useWeeklyRecapViewModel';

export function WeeklyRecapScreen() {
  const vm = useWeeklyRecapViewModel();
  const c = useAppColors();
  const showSections = vm.stage === 'ready';

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
        showsVerticalScrollIndicator={false}
      >
        {vm.cover ? <RecapCover cover={vm.cover} /> : null}

        {vm.stage === 'loading' ? (
          <View className="items-center px-6 py-16">
            <ActivityIndicator size="small" />
            <Text className="mt-4 font-body text-[13px] text-ink-soft">
              {vm.loadingLabel}
            </Text>
          </View>
        ) : null}

        {vm.stage === 'empty' ? (
          <View className="mx-4 mt-8 rounded-3xl border border-line bg-surface px-6 py-10">
            <Text className="font-displayMedium text-[22px] leading-[26px] text-ink">
              {vm.emptyTitle}
            </Text>
            <Text className="mt-3 font-body text-[14px] leading-[22px] text-ink-soft">
              {vm.emptyBody}
            </Text>
          </View>
        ) : null}

        {vm.stage === 'error' ? (
          <View className="mx-4 mt-8 rounded-3xl border border-line bg-surface px-6 py-10">
            <Text className="font-displayMedium text-[22px] leading-[26px] text-ink">
              {vm.errorTitle}
            </Text>
            <Text className="mt-3 font-body text-[14px] leading-[22px] text-ink-soft">
              {vm.errorBody}
            </Text>
            <Text
              className="mt-5 self-start rounded-full border border-line bg-bg px-4 py-2 font-bodyBold text-[12px] text-ink active:opacity-70"
              onPress={vm.refresh}
            >
              {vm.retryLabel}
            </Text>
          </View>
        ) : null}

        {showSections && vm.byNumbers ? (
          <RecapSection kicker={vm.byNumbers.kicker} title={vm.byNumbers.title}>
            <View className="mt-3.5 flex-row" style={{ gap: 10 }}>
              {vm.byNumbers.stats.map((stat, i) => (
                <View key={i} className="flex-1">
                  <BigStatCard
                    value={stat.value}
                    label={stat.label}
                    bgClassName={stat.bgClassName}
                    colorClassName={stat.colorClassName}
                    circleClassName={stat.circleClassName}
                  />
                </View>
              ))}
            </View>
          </RecapSection>
        ) : null}

        {showSections && vm.heatmap ? (
          <RecapSection kicker={vm.heatmap.kicker} title={vm.heatmap.title}>
            <HeatmapGrid
              heatmap={vm.heatmap.data}
              hint={vm.heatmap.hint}
              legendLess={vm.heatmap.legendLess}
              legendMore={vm.heatmap.legendMore}
              busiestPrefix={vm.heatmap.busiestPrefix}
              momentsLabel={vm.heatmap.momentsLabel}
              labels={vm.heatmap.labels}
            />
          </RecapSection>
        ) : null}

        {showSections && vm.topMoment ? (
          <RecapSection kicker={vm.topMoment.kicker} title={vm.topMoment.title}>
            {vm.topMoment.card ? (
              <View className="mt-3.5">
                <TopMomentCard
                  id={vm.topMoment.card.id}
                  rank={vm.topMoment.card.rank}
                  palette={vm.topMoment.card.palette}
                  title={vm.topMoment.card.title}
                  sub={vm.topMoment.card.sub}
                  size="big"
                />
              </View>
            ) : (
              <View className="mt-3.5 rounded-[20px] border border-dashed border-line bg-surface px-5 py-6">
                <Text className="font-body text-[13px] leading-[20px] text-ink-soft">
                  {vm.topMoment.emptyBody}
                </Text>
              </View>
            )}
          </RecapSection>
        ) : null}

        {showSections && vm.closing ? (
          <View className="mx-4 mt-7 overflow-hidden rounded-3xl">
            <LinearGradient
              colors={[c.heroA, c.heroB, c.heroC]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
            >
              <View className="px-5 pb-5 pt-6">
                <Text className="font-bodyMedium text-[14px] leading-[21px] text-white/90">
                  {vm.closing.body}
                </Text>
                <Text className="mt-3 font-script text-[18px] text-white/85">
                  {vm.closing.signature}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={vm.closing.onShare}
                  className="mt-5 flex-row items-center justify-center gap-2 self-start rounded-full bg-white/20 px-5 py-2.5 active:opacity-80"
                >
                  <Text className="font-bodyBold text-[12px] text-white">
                    {vm.closing.shareLabel}
                  </Text>
                  <ChevronRight size={14} color="#FFFFFF" strokeWidth={2.4} />
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        ) : null}
      </ScrollView>

      <CloseFloatingButton
        onPress={vm.onClose}
        accessibilityLabel={vm.closeLabel}
      />
    </View>
  );
}
