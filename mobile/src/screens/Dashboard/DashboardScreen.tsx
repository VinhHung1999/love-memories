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
import { Card } from '../../components/Card';

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
      <View className="pt-[124px] pb-[100px] px-4 gap-5">
        {/* Moments carousel — FIRST, bigger cards */}
        <View>
          <Skeleton className="w-36 h-4 rounded-md mb-3" />
          <View className="flex-row gap-3">
            <Skeleton className="w-[210px] h-[250px] rounded-3xl" />
            <Skeleton className="w-[210px] h-[250px] rounded-3xl" />
          </View>
        </View>
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

// ── MomentCarouselCard ────────────────────────────────────────────────────────

function MomentCarouselCard({ moment, onPress }: { moment: Moment; onPress: () => void }) {
  const colors = useAppColors();
  const coverPhoto = moment.photos[0];
  const dateLabel = new Date(moment.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <Pressable onPress={onPress} className="w-[210px] h-[250px] rounded-3xl overflow-hidden shadow-lg">
      {/* Background — photo or gradient placeholder */}
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

      {/* Dark gradient overlay for text readability */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.72)']}
        start={{ x: 0, y: 0.35 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
      />

      {/* Date badge — top right */}
      <View className="absolute top-3 right-3 bg-black/35 rounded-xl px-2.5 py-1">
        <Text className="text-[10px] font-bold text-white">{dateLabel}</Text>
      </View>

      {/* Info at bottom */}
      <View className="absolute bottom-0 left-0 right-0 px-4 pb-4">
        <Text className="text-white font-bold text-sm leading-snug" numberOfLines={2}>
          {moment.title}
        </Text>
        {moment.tags.length > 0 ? (
          <Text className="text-white/70 text-[10px] mt-1" numberOfLines={1}>
            {moment.tags[0]}
          </Text>
        ) : null}
      </View>
    </Pressable>
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

// ── FoodHighlightCard ─────────────────────────────────────────────────────────

function FoodHighlightCard({ spot, onPress }: { spot: FoodSpot; onPress: () => void }) {
  const colors = useAppColors();
  const coverPhoto = spot.photos[0];

  return (
    <Pressable onPress={onPress} className="bg-white rounded-3xl overflow-hidden shadow-sm flex-row">
      {/* Photo */}
      <View className="w-[80px] h-[80px] bg-secondary/10 items-center justify-center flex-shrink-0">
        {coverPhoto ? (
          <Animated.Image
            source={{ uri: coverPhoto.url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Icon name="food-fork-drink" size={24} color={colors.secondary} />
        )}
      </View>
      {/* Info */}
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

  // expandedHeight=180, collapsedHeight=56 → scrollRange=124
  const EXPANDED_H = 180;
  const COLLAPSED_H = 56;

  return (
    <View className="flex-1 bg-gray-50">

      {/* ── Collapsible Header — vibrant gradient ── */}
      <CollapsibleHeader
        title={vm.headerTitle}
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
          <View className="items-center pb-2">
            {/* Couple / user names */}
            <View className="flex-row items-center gap-2 mb-1.5">
              {vm.couple?.name ? (
                <Text className="text-xl font-bold text-white tracking-tight">
                  {vm.couple.name}
                </Text>
              ) : (
                <>
                  <Text className="text-xl font-bold text-white">{vm.user?.name ?? '—'}</Text>
                  <Icon name="heart" size={16} color="rgba(255,255,255,0.8)" />
                  {vm.partner ? (
                    <Text className="text-xl font-bold text-white">{vm.partner.name}</Text>
                  ) : null}
                </>
              )}
            </View>

            {/* Slogan */}
            {vm.slogan ? (
              <Text className="text-[11px] text-white/70 italic mb-2" numberOfLines={1}>
                {vm.slogan}
              </Text>
            ) : null}

            {/* Live relationship timer pill */}
            {vm.relationshipDuration ? (
              <View className="bg-white/20 rounded-2xl px-4 py-1.5 flex-row items-center gap-1.5">
                <Icon name="heart-pulse" size={11} color="rgba(255,255,255,0.9)" />
                <Text className="text-xs font-semibold text-white">
                  {t.dashboard.couple.togetherFor}{' '}
                  {vm.relationshipDuration.years > 0
                    ? `${vm.relationshipDuration.years}${t.dashboard.couple.years} `
                    : ''}
                  {vm.relationshipDuration.months > 0
                    ? `${vm.relationshipDuration.months}${t.dashboard.couple.months} `
                    : ''}
                  {vm.relationshipDuration.days}{t.dashboard.couple.days}
                </Text>
              </View>
            ) : (
              <View className="bg-white/20 rounded-2xl px-4 py-1.5">
                <Text className="text-xs text-white/70">{t.dashboard.couple.noAnniversary}</Text>
              </View>
            )}
          </View>
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
          {/* paddingTop = scrollRange (180-56=124) */}
          <View className="pt-[124px] pb-[120px] px-4 gap-5">

            {/* ── 1. Recent Moments Carousel — FIRST, editorial full-bleed ── */}
            <Animated.View entering={FadeInDown.delay(40).duration(500)}>
              <SectionHeader
                title={t.dashboard.sections.recentMoments}
                onSeeAll={() => vm.navigateTo('MomentsTab')}
              />
              {vm.recentMoments.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="-mx-4"
                  contentContainerClassName="px-4 gap-3">
                  {vm.recentMoments.map(moment => (
                    <MomentCarouselCard
                      key={moment.id}
                      moment={moment}
                      onPress={() => vm.handleMomentPress(moment.id)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <Card>
                  <View className="items-center py-6">
                    <Icon name="image-multiple-outline" size={32} color={colors.primaryLight} />
                    <Text className="text-sm text-textLight text-center mt-2 leading-relaxed">
                      {t.dashboard.noMomentsYet}
                    </Text>
                  </View>
                </Card>
              )}
            </Animated.View>

            {/* ── 2. Stats Row ── */}
            <Animated.View entering={FadeInDown.delay(160).duration(500)}>
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

            {/* ── 3. Quick Actions ── */}
            <Animated.View entering={FadeInDown.delay(280).duration(500)}>
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
                  icon="map-outline"
                  label={t.dashboard.quickActions.map}
                  iconColor={colors.accent}
                  bgClass="bg-accent/10"
                  onPress={() => vm.navigateTo('MapTab')}
                />
                <QuickActionButton
                  icon="account-circle-outline"
                  label={t.dashboard.quickActions.profile}
                  iconColor={colors.textMid}
                  bgClass="bg-gray-100"
                  onPress={() => vm.navigateTo('ProfileTab')}
                />
              </View>
            </Animated.View>

            {/* ── 4. Food Highlights ── */}
            {vm.recentFoodSpots.length > 0 ? (
              <Animated.View entering={FadeInDown.delay(400).duration(500)}>
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
