import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import FastImage from 'react-native-fast-image';
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
import type { ExpenseStats } from '../../lib/api';
import { useDashboardViewModel } from './useDashboardViewModel';
import { useUnreadCount } from '../Notifications/useNotificationsViewModel';
import CollapsibleHeader from '../../components/CollapsibleHeader';
import DailyQuestionCard from '../DailyQuestions/DailyQuestionCard';
import { formatMonthDisplay } from '../MonthlyRecap/useMonthlyRecapViewModel';
import Skeleton from '../../components/Skeleton';
import { formatVND, CATEGORY_EMOJI, EXPENSE_CATEGORIES } from '../Expenses/expensesConstants';
import type { DatePlan } from '../../types';

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
      <View className="pt-[204px] pb-[100px] px-4 gap-5">
        <Skeleton className="h-10 rounded-full self-center w-56" />
        <View className="flex-row gap-3">
          <Skeleton className="flex-1 h-[76px] rounded-3xl" />
          <Skeleton className="flex-1 h-[76px] rounded-3xl" />
        </View>
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

// ── HeroMomentCard ────────────────────────────────────────────────────────────

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
        <FastImage
          source={{ uri: coverPhoto.url, priority: FastImage.priority.normal }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <LinearGradient
          colors={[colors.primaryLight, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.70)']}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
        className="absolute inset-0"
      />
      <View className="absolute top-2.5 right-2.5 bg-black/30 rounded-lg px-2 py-0.5">
        <Text className="text-[9px] font-bold text-white">{dateLabel}</Text>
      </View>
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

// ── StatCard ──────────────────────────────────────────────────────────────────

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

// ── ExpenseWidget ─────────────────────────────────────────────────────────────

function ExpenseWidget({ stats, onPress }: { stats: ExpenseStats | null; onPress: () => void }) {
  const colors = useAppColors();
  const hasData = stats && stats.count > 0;

  const topCategories = hasData
    ? (Object.entries(stats.byCategory) as [string, { total: number; count: number }][])
        .filter(([, v]) => v.total > 0)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 2)
        .map(([cat, v]) => ({
          cat,
          pct: Math.round((v.total / stats.total) * 100),
        }))
    : [];

  // Use shared constants from expensesConstants (avoids duplicating emoji/label maps)
  const catEmoji = CATEGORY_EMOJI;
  const catLabel: Record<string, string> = Object.fromEntries(
    EXPENSE_CATEGORIES.filter(c => c.key !== 'all').map(c => [c.key, c.label]),
  );

  return (
    <Animated.View entering={FadeInDown.delay(180).duration(500)} className="rounded-3xl overflow-hidden shadow-sm">
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={[colors.expensePurple, colors.expensePurpleDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-5 pt-4 pb-5">
          {/* Label row */}
          <View className="flex-row items-center gap-2 mb-2">
            <View className="w-7 h-7 rounded-xl bg-white/15 items-center justify-center">
              <Icon name="cash-multiple" size={14} color="#fff" />
            </View>
            <Text className="text-[11px] font-semibold text-white/50 tracking-[0.8px] uppercase">
              {t.dashboard.expenseWidget.label}
            </Text>
          </View>

          {!hasData ? (
            <Text className="text-sm text-white/40 italic mt-1">
              {t.dashboard.expenseWidget.noData}
            </Text>
          ) : (
            <>
              <Text className="text-[28px] font-bold text-white leading-none">
                {formatVND(stats.total)}
              </Text>
              <Text className="text-xs text-white/50 mt-0.5 mb-4">
                {stats.count} {t.expenses.transactions}
              </Text>
              <View className="gap-2.5">
                {topCategories.map(({ cat, pct }) => (
                  <View key={cat}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-[11px] text-white/70 font-medium">
                        {catEmoji[cat]} {catLabel[cat]}
                      </Text>
                      <Text className="text-[10px] text-white/50 font-semibold">{pct}%</Text>
                    </View>
                    <View className="h-1 bg-white/15 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-white/60 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── DatePlannerWidget ─────────────────────────────────────────────────────────

function DatePlannerWidget({ plans, onPress }: { plans: DatePlan[]; onPress: () => void }) {
  const colors = useAppColors();
  const hasPlans = plans.length > 0;

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  const statusColor = (status: string) =>
    status === 'active' ? colors.primary :
    status === 'completed' ? colors.accent :
    colors.secondary;

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(500)} className="rounded-3xl overflow-hidden shadow-sm">
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={[colors.secondary, colors.secondaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-5 pt-4 pb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-7 h-7 rounded-xl bg-white/15 items-center justify-center">
              <Icon name="calendar-heart" size={14} color="#fff" />
            </View>
            <Text className="text-[11px] font-semibold text-white/50 tracking-[0.8px] uppercase">
              {t.dashboard.datePlannerWidget.label}
            </Text>
          </View>
          {!hasPlans ? (
            <Text className="text-sm text-white/40 italic">
              {t.dashboard.datePlannerWidget.noData}
            </Text>
          ) : (
            <View className="gap-2">
              {plans.map(plan => (
                <View key={plan.id} className="flex-row items-center gap-3">
                  <View className="w-1 h-full rounded-full bg-white/30" />
                  <View className="flex-1">
                    <Text className="text-[13px] font-semibold text-white" numberOfLines={1}>
                      {plan.title}
                    </Text>
                    <Text className="text-[11px] text-white/60 mt-0.5">{fmtDate(plan.date)}</Text>
                  </View>
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{ backgroundColor: statusColor(plan.status) + '40' }}>
                    <Text className="text-[10px] font-semibold text-white">
                      {t.dashboard.datePlannerWidget.stops.replace('{n}', String(plan.stops.length))}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ── MonthlyRecapBanner ────────────────────────────────────────────────────────

function MonthlyRecapBanner({ onPress }: { onPress: () => void }) {
  const prevMonth = (() => {
    const now = new Date();
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(500)} className="rounded-3xl overflow-hidden shadow-sm">
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={['#C3517A', '#E8788A', '#F4A261']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-5 pt-4 pb-5">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-7 h-7 rounded-xl bg-white/20 items-center justify-center">
              <Icon name="chart-bar" size={14} color="#fff" />
            </View>
            <Text className="text-[11px] font-semibold text-white/60 tracking-widest uppercase">
              {t.monthlyRecap.title}
            </Text>
            <View className="flex-1" />
            <View className="flex-row items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5">
              <Icon name="new-box" size={11} color="#fff" />
              <Text className="text-[10px] font-bold text-white">New</Text>
            </View>
          </View>
          <Text className="text-white font-bold text-[17px] leading-snug">
            {formatMonthDisplay(prevMonth)}
          </Text>
          <Text className="text-white/70 text-[13px] mt-1 mb-3">
            {t.monthlyRecap.dashboardCardSub}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-white/80 text-[13px] font-semibold">{t.monthlyRecap.viewRecap}</Text>
            <Icon name="arrow-right" size={14} color="rgba(255,255,255,0.80)" />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
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
          <FastImage source={{ uri: coverPhoto.url, priority: FastImage.priority.normal }} style={{ width: '100%', height: '100%' }} resizeMode={FastImage.resizeMode.cover} />
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

// ── NotificationBell — header right icon with unread badge ────────────────────

function NotificationBell({ onPress }: { onPress: () => void }) {
  const count = useUnreadCount();
  return (
    <Pressable onPress={onPress} className="w-9 h-9 items-center justify-center">
      <Icon name={count > 0 ? 'bell' : 'bell-outline'} size={22} color="#fff" />
      {count > 0 && (
        <View
          className="absolute top-0.5 right-0.5 bg-error rounded-full items-center justify-center"
          style={{ minWidth: 14, height: 14, paddingHorizontal: 3 }}>
          <Text className="text-white text-[9px] font-bold leading-none">
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      )}
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

  const EXPANDED_H = 260;
  const COLLAPSED_H = 56;

  return (
    <View className="flex-1 bg-gray-50">

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
        renderRight={() => (
          <NotificationBell onPress={vm.navigateToNotifications} />
        )}
        renderExpandedContent={() => (
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

      {vm.isLoading ? (
        <DashboardSkeleton />
      ) : (
        <Animated.ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}>
          <View className="pt-[220px] pb-[120px] px-4 gap-4">

            {/* ── 0. Timer + slogan ── */}
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

            {/* ── 2. Quick Actions (4 items) ── */}
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
                <QuickActionButton
                  icon="cash-multiple"
                  label={t.dashboard.quickActions.expenses}
                  iconColor={colors.expensePurple}
                  bgClass="bg-violet-100"
                  onPress={vm.navigateToExpenses}
                />
              </View>
              <View className="flex-row gap-3 mt-3">
                <QuickActionButton
                  icon="email-heart-outline"
                  label={t.dashboard.quickActions.letters}
                  iconColor={colors.primary}
                  bgClass="bg-primary/10"
                  onPress={vm.navigateToLetters}
                />
                <QuickActionButton
                  icon="calendar-heart"
                  label={t.dashboard.quickActions.datePlanner}
                  iconColor={colors.secondary}
                  bgClass="bg-secondary/10"
                  onPress={vm.navigateToDatePlanner}
                />
                <QuickActionButton
                  icon="trophy-outline"
                  label={t.dashboard.quickActions.achievements}
                  iconColor={colors.accent}
                  bgClass="bg-accent/10"
                  onPress={vm.navigateToAchievements}
                />
                <View className="flex-1" />
              </View>
            </Animated.View>

            {/* ── 3. Expense Summary Widget ── */}
            <ExpenseWidget stats={vm.expenseStats} onPress={vm.navigateToExpenses} />

            {/* ── 3b. Date Planner Widget ── */}
            <DatePlannerWidget plans={vm.upcomingPlans} onPress={vm.navigateToDatePlanner} />

            {/* ── 3c. Daily Question Card ── */}
            <DailyQuestionCard />

            {/* ── 3d. Monthly Recap Banner (days 1-3) ── */}
            {vm.showMonthlyRecapBanner ? (
              <MonthlyRecapBanner onPress={vm.navigateToMonthlyRecap} />
            ) : null}

            {/* ── 4. Food Highlights ── */}
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
