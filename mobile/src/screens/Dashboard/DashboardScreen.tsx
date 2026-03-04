import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppColors } from '../../navigation/theme';
import t from '../../locales/en';
import type { Moment, FoodSpot } from '../../types';
import { useDashboardViewModel } from './useDashboardViewModel';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import Skeleton from '../../components/Skeleton';

// ── Count-up hook ─────────────────────────────────────────────────────────────

function useCountUp(target: number, durationMs = 900): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const steps = 36;
    const stepMs = durationMs / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCount(Math.round((step / steps) * target));
      if (step >= steps) clearInterval(timer);
    }, stepMs);
    return () => clearInterval(timer);
  }, [target, durationMs]);
  return count;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <ScrollView scrollEnabled={false} className="flex-1">
      {/* pt-[204] = expandedHeight(260) - collapsedHeight(56) */}
      <View className="pt-[204px] pb-[100px] px-4 gap-5">
        {/* Timer pill */}
        <Skeleton className="h-10 rounded-full self-center w-56" />
        {/* Stats */}
        <View className="flex-row gap-3">
          <Skeleton className="flex-1 h-[76px] rounded-3xl" />
          <Skeleton className="flex-1 h-[76px] rounded-3xl" />
        </View>
        {/* Quick actions */}
        <View>
          <Skeleton className="w-28 h-4 rounded-md mb-3" />
          <View className="flex-row gap-3">
            <Skeleton className="flex-1 h-[80px] rounded-3xl" />
            <Skeleton className="flex-1 h-[80px] rounded-3xl" />
            <Skeleton className="flex-1 h-[80px] rounded-3xl" />
            <Skeleton className="flex-1 h-[80px] rounded-3xl" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ── HeroMomentCard — large landscape card, lives inside the header ─────────────

function HeroMomentCard({ moment, onPress }: { moment: Moment; onPress: () => void }) {
  const colors = useAppColors();
  const coverPhoto = moment.photos[0];
  const dateLabel = new Date(moment.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Pressable onPress={onPress} className="w-[230px] h-[185px] rounded-2xl overflow-hidden">
      {coverPhoto ? (
        <Animated.Image
          source={{ uri: coverPhoto.url }}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={[colors.primaryLight, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
      )}
      {/* Gradient overlay for text */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.70)']}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
      />
      {/* Date badge */}
      <View className="absolute top-2.5 right-2.5 bg-black/30 rounded-lg px-2 py-0.5">
        <Text className="text-[9px] font-bold text-white">{dateLabel}</Text>
      </View>
      {/* Title */}
      <View className="absolute bottom-0 left-0 right-0 px-3.5 pb-3">
        <Text className="text-white font-semibold text-[13px] leading-snug" numberOfLines={2}>
          {moment.title}
        </Text>
        {moment.tags.length > 0 ? (
          <Text className="text-white/60 text-[10px] mt-0.5" numberOfLines={1}>
            {moment.tags[0]}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  count,
  iconColor,
  bgClass,
  onPress,
}: {
  icon: string;
  label: string;
  count: number;
  iconColor: string;
  bgClass: string;
  onPress: () => void;
}) {
  const displayCount = useCountUp(count);
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-white rounded-3xl px-4 py-4 shadow-sm flex-row items-center gap-3">
      <View className={`w-10 h-10 rounded-2xl items-center justify-center ${bgClass}`}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <View>
        <Text className="text-2xl font-bold text-textDark leading-tight">{displayCount}</Text>
        <Text className="text-[11px] text-textLight font-medium">{label}</Text>
      </View>
    </Pressable>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  const colors = useAppColors();
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-base font-bold text-textDark tracking-tight">{title}</Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} className="flex-row items-center gap-0.5">
          <Text className="text-xs font-semibold text-primary">{t.dashboard.sections.seeAll}</Text>
          <Icon name="chevron-right" size={14} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

// ── QuickActionButton ─────────────────────────────────────────────────────────

function QuickActionButton({
  icon,
  label,
  iconColor,
  bgClass,
  onPress,
}: {
  icon: string;
  label: string;
  iconColor: string;
  bgClass: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 bg-white rounded-3xl py-4 items-center justify-center gap-1.5 shadow-sm">
      <View className={`w-10 h-10 rounded-2xl items-center justify-center ${bgClass}`}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <Text className="text-[11px] font-semibold text-textMid">{label}</Text>
    </Pressable>
  );
}

// ── ActiveCookingBanner ───────────────────────────────────────────────────────

function ActiveCookingBanner({ recipeTitles, onPress }: { recipeTitles: string; onPress: () => void }) {
  const colors = useAppColors();
  return (
    <Pressable onPress={onPress} className="rounded-3xl overflow-hidden shadow-sm">
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="px-4 py-3.5 flex-row items-center gap-3">
        <View className="w-9 h-9 rounded-2xl bg-white/20 items-center justify-center">
          <Icon name="chef-hat" size={18} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-[13px]">{t.dashboard.activeCooking}</Text>
          <Text className="text-white/80 text-[11px] mt-0.5" numberOfLines={1}>{recipeTitles}</Text>
        </View>
        <Icon name="arrow-right" size={18} color="rgba(255,255,255,0.8)" />
      </LinearGradient>
    </Pressable>
  );
}

// ── FoodHighlightCard ─────────────────────────────────────────────────────────

function FoodHighlightCard({ spot, onPress }: { spot: FoodSpot; onPress: () => void }) {
  const colors = useAppColors();
  const coverPhoto = spot.photos[0];

  return (
    <Pressable onPress={onPress} className="bg-white rounded-3xl overflow-hidden shadow-sm flex-row">
      <View className="w-[80px] h-[80px] bg-secondary/10 items-center justify-center flex-shrink-0">
        {coverPhoto ? (
          <Animated.Image source={{ uri: coverPhoto.url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Icon name="food-fork-drink" size={24} color={colors.secondary} />
        )}
      </View>
      <View className="flex-1 px-3 py-3 justify-center">
        <Text className="text-sm font-semibold text-textDark mb-0.5" numberOfLines={1}>
          {spot.name}
        </Text>
        <View className="flex-row items-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Icon
              key={i}
              name={i <= Math.round(spot.rating) ? 'star' : 'star-outline'}
              size={10}
              color={colors.starRating}
            />
          ))}
          <Text className="text-[10px] text-textLight ml-0.5">{spot.rating}/5</Text>
        </View>
        {spot.location ? (
          <Text className="text-[10px] text-textLight mt-0.5" numberOfLines={1}>
            📍 {spot.location}
          </Text>
        ) : null}
      </View>
      <View className="items-center justify-center pr-3">
        <Icon name="chevron-right" size={16} color={colors.textLight} />
      </View>
    </Pressable>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const colors = useAppColors();
  const vm = useDashboardViewModel();

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  // expandedHeight=260, collapsedHeight=56 → scrollRange=204
  const EXPANDED_H = 260;
  const COLLAPSED_H = 56;

  return (
    <View className="flex-1 bg-gray-50">

      {/* ── Collapsible Header — pure photo carousel, no labels ── */}
      <CollapsibleHeader
        title={vm.headerTitle}
        subtitle={t.dashboard.headerSubtitle}
        expandedHeight={EXPANDED_H}
        collapsedHeight={COLLAPSED_H}
        scrollY={scrollY}
        dark
        renderBackground={() => (
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1.2 }}
            className="absolute inset-0"
          />
        )}
        renderExpandedContent={() => (
          // Pure photo strip — no title, no see-all, no timer
          vm.recentMoments.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-5"
              contentContainerClassName="px-5 gap-2.5">
              {vm.recentMoments.map(moment => (
                <HeroMomentCard
                  key={moment.id}
                  moment={moment}
                  onPress={() => vm.handleMomentPress(moment.id)}
                />
              ))}
            </ScrollView>
          ) : (
            <View className="h-[160px] rounded-2xl bg-white/10 items-center justify-center">
              <Icon name="image-multiple-outline" size={28} color="rgba(255,255,255,0.35)" />
            </View>
          )
        )}
      />

      {/* ── Body ── */}
      {vm.isLoading ? (
        <DashboardSkeleton />
      ) : (
        <Animated.ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}>
          {/* pt-[204px] = scrollRange (260-56) */}
          <View className="pt-[220px] pb-[120px] px-4 gap-4">

            {/* ── 0. Timer + slogan — right below header ── */}
            {(vm.relationshipDuration || vm.slogan) ? (
              <Animated.View entering={FadeInDown.delay(0).duration(400)} className="items-center gap-1.5">
                {vm.relationshipDuration ? (
                  <View className="bg-white rounded-full px-6 py-2.5 flex-row items-center gap-2 shadow-sm border border-primary/15">
                    <Icon name="heart-pulse" size={13} color={colors.primary} />
                    <Text className="text-[13px] font-semibold text-textDark">
                      {t.dashboard.couple.togetherFor}{' '}
                      {vm.relationshipDuration.years > 0
                        ? `${vm.relationshipDuration.years}${t.dashboard.couple.years} `
                        : ''}
                      {vm.relationshipDuration.months > 0
                        ? `${vm.relationshipDuration.months}${t.dashboard.couple.months} `
                        : ''}
                      {vm.relationshipDuration.days}{t.dashboard.couple.days}
                    </Text>
                    <Icon name="heart" size={10} color={colors.primary} />
                  </View>
                ) : null}
                {vm.slogan ? (
                  <Text className="text-[11px] text-textLight italic text-center">
                    {vm.slogan}
                  </Text>
                ) : null}
              </Animated.View>
            ) : null}

            {/* ── 1. Stats Row ── */}
            <Animated.View entering={FadeInDown.delay(60).duration(500)}>
              <View className="flex-row gap-3">
                <StatCard
                  icon="heart-multiple-outline"
                  label={t.dashboard.stats.moments}
                  count={vm.momentsCount}
                  iconColor={colors.primary}
                  bgClass="bg-primary/10"
                  onPress={() => vm.navigateTo('MomentsTab')}
                />
                <StatCard
                  icon="food-fork-drink"
                  label={t.dashboard.stats.foodSpots}
                  count={vm.foodSpotsCount}
                  iconColor={colors.secondary}
                  bgClass="bg-secondary/10"
                  onPress={() => vm.navigateTo('FoodSpotsTab')}
                />
              </View>
            </Animated.View>

            {/* ── 1b. Active Cooking Banner ── */}
            {vm.activeSession ? (
              <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                <ActiveCookingBanner
                  recipeTitles={vm.activeSession.recipes.map(r => r.recipe.title).join(' + ')}
                  onPress={vm.handleActiveCookingPress}
                />
              </Animated.View>
            ) : null}

            {/* ── 2. Quick Actions ── */}
            <Animated.View entering={FadeInDown.delay(140).duration(500)}>
              <SectionHeader title={t.dashboard.sections.quickActions} />
              <View className="flex-row gap-3">
                <QuickActionButton
                  icon="heart-multiple-outline"
                  label={t.dashboard.quickActions.moments}
                  iconColor={colors.primary}
                  bgClass="bg-primary/10"
                  onPress={() => vm.navigateTo('MomentsTab')}
                />
                <QuickActionButton
                  icon="food-fork-drink"
                  label={t.dashboard.quickActions.food}
                  iconColor={colors.secondary}
                  bgClass="bg-secondary/10"
                  onPress={() => vm.navigateTo('FoodSpotsTab')}
                />
                <QuickActionButton
                  icon="chef-hat"
                  label={t.dashboard.quickActions.recipes}
                  iconColor={colors.primary}
                  bgClass="bg-primary/10"
                  onPress={() => vm.navigateTo('RecipesTab')}
                />
              </View>
            </Animated.View>

            {/* ── 3. Food Highlights ── */}
            {vm.recentFoodSpots.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(220).duration(500)}>
                <SectionHeader
                  title={t.dashboard.sections.foodHighlights}
                  onSeeAll={() => vm.navigateTo('FoodSpotsTab')}
                />
                <View className="gap-3">
                  {vm.recentFoodSpots.map(spot => (
                    <FoodHighlightCard
                      key={spot.id}
                      spot={spot}
                      onPress={() => vm.handleFoodSpotPress(spot.id)}
                    />
                  ))}
                </View>
              </Animated.View>
            ) : null}

          </View>
        </Animated.ScrollView>
      )}

    </View>
  );
}
