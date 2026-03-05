import React from 'react';
import { SectionList, Text, View, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import { useAchievementsViewModel } from './useAchievementsViewModel';
import type { AchievementGroup } from './useAchievementsViewModel';
import type { Achievement } from '../../types';
import HeaderIconButton from '../../components/HeaderIconButton';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      {/* Icon circle */}
      <View
        className="w-11 h-11 rounded-2xl items-center justify-center"
        style={{ backgroundColor: item.unlocked ? colors.primaryMuted : colors.gray100 }}>
        <Text className="text-2xl">{item.icon}</Text>
      </View>
      {/* Text */}
      <View className="flex-1">
        <Text className="text-[14px] font-semibold text-textDark">{item.title}</Text>
        <Text className="text-[12px] text-textLight mt-0.5" numberOfLines={2}>{item.description}</Text>
        {item.unlocked && item.unlockedAt ? (
          <Text className="text-[11px] mt-1" style={{ color: colors.accent }}>
            {t.achievements.unlockedOn} {new Date(item.unlockedAt).toLocaleDateString()}
          </Text>
        ) : null}
      </View>
      {/* Lock / checkmark */}
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

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <LinearGradient
        colors={[colors.textDark, colors.textMid]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <SafeAreaView edges={['top']}>
          <View className="px-4 pt-2 pb-4">
            <View className="flex-row items-center gap-3 mb-3">
              <HeaderIconButton name="arrow-left" onPress={vm.handleBack} />
              <View className="flex-1">
                <Text className="text-2xl font-bold text-white">{t.achievements.title}</Text>
                <Text className="text-[11px] font-semibold tracking-widest text-white/50 mt-0.5">
                  {t.achievements.subtitle}
                </Text>
              </View>
            </View>
            {/* Progress */}
            {!vm.isLoading && vm.totalCount > 0 ? (
              <View className="gap-2">
                <Text className="text-[13px] text-white/80">
                  {t.achievements.progress
                    .replace('{unlocked}', String(vm.unlockedCount))
                    .replace('{total}', String(vm.totalCount))}
                </Text>
                <View className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <Animated.View
                    entering={FadeInDown.duration(600)}
                    className="h-full rounded-full"
                    style={{ width: `${Math.round(vm.progress * 100)}%`, backgroundColor: colors.accent }}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {vm.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={vm.groups.map(g => ({
            ...g,
            data: g.items,
          }))}
          keyExtractor={item => item.key}
          renderItem={({ item }) => <AchievementRow item={item} />}
          ItemSeparatorComponent={SectionSeparator}
          renderSectionHeader={({ section }) => {
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
          renderSectionFooter={() => <View className="h-2" />}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}
