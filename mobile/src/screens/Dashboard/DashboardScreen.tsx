import React from 'react';
import { ScrollView, View, Text } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { Images } from 'lucide-react-native';
import t from '../../locales/en';
import { useDashboardViewModel } from './useDashboardViewModel';
import DailyQuestionCard from '../DailyQuestions/DailyQuestionCard';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { HeroMomentCard } from './components/HeroMomentCard';
import { SectionHeader } from './components/SectionHeader';
import { QuickActionButton } from './components/QuickActionButton';
import { ActiveCookingBanner } from './components/ActiveCookingBanner';
import { ExpenseWidget } from './components/ExpenseWidget';
import { CompactRecapCard } from './components/CompactRecapCard';
import { CompactDateCard } from './components/CompactDateCard';
import { FoodHighlightCard } from './components/FoodHighlightCard';
import { NotificationBell } from './components/NotificationBell';
import { DashboardStatsCard } from './components/DashboardStatsCard';
import { RelationshipTimer } from './components/RelationshipTimer';
import OverlayHeader from '@/components/OverlayHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const vm = useDashboardViewModel();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });
  const insects = useSafeAreaInsets();

  return (
    <>
      <View className="flex-1 bg-baseBg" style={{ top: insects.top }}>
        {vm.isLoading ? (
          <DashboardSkeleton />
        ) : (
          <Animated.ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
          >
            <View className="pb-[120px] px-4 gap-4">
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  {/* ── Title ── */}
                  <Text className='text-[32px] font-heading text-textDark leading-none"'>
                    {vm.headerTitle}
                  </Text>
                </View>
                {vm.slogan ? (
                  <Text className="text-[11px] font-bodyLight text-textLight italic">
                    {vm.slogan}
                  </Text>
                ) : null}
              </View>

              {/* ── 2. Daily Question Card ── */}
              <Animated.View entering={FadeInDown.delay(110).duration(500)}>
                <DailyQuestionCard />
              </Animated.View>

              {/* ── Recent moments horizontal strip ── */}
              {vm.recentMoments.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="-mx-4"
                  contentContainerClassName="px-4 gap-2.5"
                >
                  {vm.recentMoments.map(moment => (
                    <HeroMomentCard
                      key={moment.id}
                      moment={moment}
                      onPress={() => vm.handleMomentPress(moment.id)}
                    />
                  ))}
                </ScrollView>
              ) : (
                <View className="h-[160px] rounded-2xl bg-white/60 items-center justify-center">
                  <Images size={28} strokeWidth={1.5} />
                </View>
              )}

              {/* ── 0. Relationship Timer ── */}
              <RelationshipTimer
                duration={vm.relationshipDuration}
                userAvatar={vm.user?.avatar}
                userInitials={vm.user?.name?.charAt(0).toUpperCase() ?? '?'}
                partnerAvatar={vm.partner?.avatar}
                partnerInitials={
                  vm.partner?.name?.charAt(0).toUpperCase() ?? '?'
                }
              />

              {/* ── 0b. Stats Overview ── */}
              <DashboardStatsCard
                duration={vm.relationshipDuration}
                momentsCount={vm.momentsCount}
                foodSpotsCount={vm.foodSpotsCount}
                onMomentsPress={() => vm.navigateTo('MomentsTab')}
                onFoodSpotsPress={vm.navigateToFoodSpots}
              />

              {/* ── 1b. Active Cooking Banner ── */}
              {vm.activeSession ? (
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                  <ActiveCookingBanner
                    recipeTitles={vm.activeSession.recipes
                      .map(r => r.recipe.title)
                      .join(' + ')}
                    onPress={vm.handleActiveCookingPress}
                  />
                </Animated.View>
              ) : null}

              {/* ── 2b. Expense + Compact cards row ── */}
              <Animated.View entering={FadeInDown.delay(120).duration(500)}>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <ExpenseWidget
                      stats={vm.expenseStats}
                      onPress={vm.navigateToExpenses}
                    />
                  </View>
                  {vm.showMonthlyRecapBanner ? (
                    <CompactRecapCard onPress={vm.navigateToMonthlyRecap} />
                  ) : null}
                  <CompactDateCard
                    plans={vm.upcomingPlans}
                    onPress={vm.navigateToDatePlanner}
                  />
                </View>
              </Animated.View>

              {/* ── 3. Quick Actions ── */}
              <Animated.View entering={FadeInDown.delay(140).duration(500)}>
                <SectionHeader title={t.dashboard.sections.quickActions} />
                <View className="flex-row gap-3">
                  {vm.quickActions.slice(0, 4).map((action, idx) => (
                    <QuickActionButton key={idx} {...action} />
                  ))}
                </View>
                <View className="flex-row gap-3 mt-3">
                  {vm.quickActions.slice(4, 8).map((action, idx) => (
                    <QuickActionButton key={idx} {...action} />
                  ))}
                </View>
              </Animated.View>

              {/* ── 4. Food Highlights ── */}
              {vm.recentFoodSpots.length > 0 ? (
                <Animated.View entering={FadeInDown.delay(220).duration(500)}>
                  <SectionHeader
                    title={t.dashboard.sections.foodHighlights}
                    onSeeAll={vm.handleFoodSpotListPress}
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
      <OverlayHeader
        scrollY={scrollY}
        title={vm.headerTitle}
        right={() => {
          return <NotificationBell onPress={vm.navigateToNotifications} />;
        }}
      />
    </>
  );
}
