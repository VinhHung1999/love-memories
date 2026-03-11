import React from 'react';
import { ActivityIndicator, SectionList, SectionListData, Text, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<Achievement, SectionListData<Achievement>>);
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useAchievementsViewModel } from './useAchievementsViewModel';
import type { AchievementGroup } from './useAchievementsViewModel';
import type { Achievement } from '../../types';
import CollapsibleHeader from '../../components/CollapsibleHeader';

const CATEGORY_ICON: Record<string, string> = {
  moments: 'heart-multiple-outline',
  cooking: 'chef-hat',
  recipes: 'book-open-variant',
  foodspots: 'food-fork-drink',
  goals: 'flag-checkered',
  time: 'clock-heart-outline',
  general: 'star-outline',
};

function AchievementRow({ item }: { item: Achievement }) {
  const colors = useAppColors();
  return (
    <View
      className="flex-row items-center gap-3 px-4 py-3"
      style={{ opacity: item.unlocked ? 1 : 0.4 }}>
      <View
        className="w-11 h-11 rounded-2xl items-center justify-center"
        style={{ backgroundColor: item.unlocked ? colors.primaryMuted : colors.gray100 }}>
        <Text className="text-2xl">{item.icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-textDark">{item.title}</Text>
        <Text className="text-[12px] text-textLight mt-0.5" numberOfLines={2}>{item.description}</Text>
        {item.unlocked && item.unlockedAt ? (
          <Text className="text-[11px] mt-1" style={{ color: colors.accent }}>
            {t.achievements.unlockedOn} {new Date(item.unlockedAt).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
      {item.unlocked ? (
        <Icon name="check-circle" size={18} color={colors.accent} />
      ) : (
        <Icon name="lock-outline" size={16} color={colors.textLight} />
      )}
    </View>
  );
}

function SectionSeparator() {
  return <View className="h-px mx-4 bg-border/40" />;
}

export default function AchievementsScreen() {
  const colors = useAppColors();
  const vm = useAchievementsViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });

  const progressPct = Math.round(vm.progress * 100);

  return (
    <View className="flex-1 bg-background">
      <CollapsibleHeader
        title={t.achievements.title}
        subtitle={t.achievements.subtitle}
        expandedHeight={vm.totalCount > 0 ? 140 : 120}
        collapsedHeight={vm.totalCount > 0 ? 96 : 56}
        scrollY={scrollY}
        onBack={vm.handleBack}
        renderFooter={vm.totalCount > 0 && !vm.isLoading ? () => (
          <View className="px-5 pb-3">
            <Text className="text-[12px] text-white/70 mb-1.5">
              {t.achievements.progress
                .replace('{unlocked}', String(vm.unlockedCount))
                .replace('{total}', String(vm.totalCount))}
            </Text>
            <View className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <Animated.View
                entering={FadeInDown.duration(600)}
                className="h-full rounded-full"
                style={{ width: `${progressPct}%`, backgroundColor: colors.accent }}
              />
            </View>
          </View>
        ) : undefined}
      />

      {vm.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <AnimatedSectionList
          sections={vm.groups.map(g => ({ ...g, data: g.items }))}
          keyExtractor={(item: Achievement) => item.key}
          renderItem={({ item }: { item: Achievement }) => <AchievementRow item={item} />}
          ItemSeparatorComponent={SectionSeparator}
          renderSectionHeader={({ section }: { section: SectionListData<Achievement> }) => {
            const group = section as unknown as AchievementGroup;
            return (
              <View
                className="flex-row items-center gap-2 px-4 py-2.5"
                style={{ backgroundColor: colors.background }}>
                <Icon
                  name={CATEGORY_ICON[group.category] ?? 'star-outline'}
                  size={14}
                  color={colors.primary}
                />
                <Text className="text-[12px] font-bold text-textMid uppercase tracking-wider">
                  {group.label}
                </Text>
                <Text className="text-[11px] text-textLight ml-auto">
                  {group.unlocked}/{group.total}
                </Text>
              </View>
            );
          }}
          renderSectionFooter={() => (<View className="h-2" />)}
          onScroll={scrollHandler as any}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}
