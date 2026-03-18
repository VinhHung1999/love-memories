import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Body, Caption, Cursive, Heading } from '../../components/Typography';
import { useAppColors } from '../../navigation/theme';
import Animated, {
  FadeInDown,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { Images } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useDashboardViewModel } from './useDashboardViewModel';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { HeroMomentCard } from './components/HeroMomentCard';
import { SectionHeader } from './components/SectionHeader';
import { QuickActionButton } from './components/QuickActionButton';
// MVP-HIDDEN: v1.1 — kept for v1.1 re-enable
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ActiveCookingBanner } from './components/ActiveCookingBanner';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ExpenseWidget } from './components/ExpenseWidget';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CompactRecapCard } from './components/CompactRecapCard';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CompactDateCard } from './components/CompactDateCard';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FoodHighlightCard } from './components/FoodHighlightCard';
import { NotificationBell } from './components/NotificationBell';
import { RelationshipTimer } from './components/RelationshipTimer';
import DailyQAStreakCard from './components/DailyQAStreakCard';
import { UnreadLetterCard } from './components/UnreadLetterCard';
import OverlayHeader from '@/components/OverlayHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRequestNotificationPermission } from '../../hooks/useRequestNotificationPermission';
import { useDashboardTour } from './useDashboardTour';
import DashboardTourOverlay from './components/DashboardTourOverlay';
import DatePickerSheet from '../../components/DatePickerSheet';
import NoPartnerBanner from '../../components/NoPartnerBanner';

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const { t } = useTranslation();
  useRequestNotificationPermission();
  const vm = useDashboardViewModel();
  const colors = useAppColors();
  const tour = useDashboardTour();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });
  const insects = useSafeAreaInsets();

  return (
    <>
      <View className="flex-1 bg-baseBg dark:bg-darkBaseBg" style={{ paddingTop: insects.top }}>
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
                    paddingTop: 10
                  }}
                >
                  {/* ── Title ── */}
                  <Heading size="xl" className="text-textDark dark:text-darkTextDark leading-none">
                    {vm.headerTitle}
                  </Heading>
                </View>
                {vm.slogan ? (
                  <Cursive className="text-[11px] text-textLight dark:text-darkTextLight mt-2">
                    {vm.slogan}
                  </Cursive>
                ) : null}
              </View>

              {/* ── 1. RelationshipTimer + Stats (merged, WOW) ── */}
              <View ref={tour.timerRef}>
                <RelationshipTimer
                  duration={vm.relationshipDuration}
                  userAvatar={vm.user?.avatar}
                  userInitials={vm.user?.name?.charAt(0).toUpperCase() ?? '?'}
                  partnerAvatar={vm.partner?.avatar}
                  partnerInitials={vm.partner?.name?.charAt(0).toUpperCase() ?? '?'}
                  hasCouple={vm.hasCouple}
                  momentsCount={vm.momentsCount}
                  onInvitePartner={vm.handleInvitePartner}
                  onSetAnniversary={() => vm.setShowAnniversaryPicker(true)}
                  onMomentsPress={() => vm.navigateTo('MomentsTab')}
                />
              </View>

              {/* ── No-partner banner — shown until partner joins ── */}
              {vm.hasCouple && !vm.hasPartner ? (
                <NoPartnerBanner
                  inviteCode={vm.coupleInviteCode}
                  onShare={vm.handleShareInviteCode}
                />
              ) : null}

              {/* ── 2. Daily Q&A + Streak (merged) ── */}
              <Animated.View entering={FadeInDown.delay(110).duration(500)}>
                <DailyQAStreakCard
                  currentStreak={vm.currentStreak}
                  answeredToday={vm.answeredToday}
                  completedToday={vm.completedToday}
                />
              </Animated.View>

              {/* ── 3. Recent Moments horizontal strip ── */}
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
                <Pressable
                  onPress={() => vm.navigateTo('MomentsTab')}
                  className="h-[160px] rounded-2xl bg-white/60 dark:bg-darkBgCard/60 items-center justify-center gap-2">
                  <Images size={28} color={colors.primary} strokeWidth={1.5} />
                  <Body size="sm" className="text-textMid dark:text-darkTextMid">{t('dashboard.noMomentsYet')}</Body>
                  <Caption className="text-primary">{t('dashboard.addFirstMemory')}</Caption>
                </Pressable>
              )}

              {/* ── 4. Quick Actions ── */}
              <Animated.View entering={FadeInDown.delay(130).duration(500)}>
                <SectionHeader title={t('dashboard.sections.quickActions')} />
                <View className="flex-row gap-3">
                  {vm.quickActions.map((action, idx) => (
                    <QuickActionButton key={idx} {...action} />
                  ))}
                </View>
              </Animated.View>

              {/* ── 5. Unread Letter Card ── */}
              {vm.unreadLettersCount > 0 ? (
                <Animated.View entering={FadeInDown.delay(135).duration(500)}>
                  <UnreadLetterCard
                    count={vm.unreadLettersCount}
                    onPress={vm.navigateToLetters}
                  />
                </Animated.View>
              ) : null}

              {/* MVP-HIDDEN: v1.1 — Active Cooking Banner */}
              {/* {vm.activeSession ? (
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                  <ActiveCookingBanner
                    recipeTitles={vm.activeSession.recipes.map(r => r.recipe.title).join(' + ')}
                    onPress={vm.handleActiveCookingPress}
                  />
                </Animated.View>
              ) : null} */}

              {/* MVP-HIDDEN: v1.1 — Expense widget + Recap card + Date card */}
              {/* <Animated.View entering={FadeInDown.delay(120).duration(500)}>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <ExpenseWidget stats={vm.expenseStats} onPress={vm.navigateToExpenses} />
                  </View>
                  {vm.showMonthlyRecapBanner ? (
                    <CompactRecapCard onPress={vm.navigateToMonthlyRecap} />
                  ) : null}
                  <CompactDateCard plans={vm.upcomingPlans} onPress={vm.navigateToDatePlanner} />
                </View>
              </Animated.View> */}

              {/* MVP-HIDDEN: v1.1 — Food Highlights */}
              {/* {vm.recentFoodSpots.length > 0 ? (
                <Animated.View entering={FadeInDown.delay(220).duration(500)}>
                  <SectionHeader title={t('dashboard.sections.foodHighlights')} onSeeAll={vm.handleFoodSpotListPress} />
                  <View className="gap-3">
                    {vm.recentFoodSpots.map(spot => (
                      <FoodHighlightCard key={spot.id} spot={spot} onPress={() => vm.handleFoodSpotPress(spot.id)} />
                    ))}
                  </View>
                </Animated.View>
              ) : null} */}
            </View>
          </Animated.ScrollView>
        )}
      </View>
      <OverlayHeader
        scrollY={scrollY}
        title={vm.headerTitle}
        fadeStart={20}
        fadeEnd={50}
        right={() => {
          return <NotificationBell onPress={vm.navigateToNotifications} />;
        }}
      />
      {tour.tourStep !== null && tour.steps.length > 0 && (
        <DashboardTourOverlay
          step={tour.tourStep}
          steps={tour.steps}
          onAdvance={tour.advanceTour}
          onDismiss={tour.dismissTour}
        />
      )}
      {vm.showAnniversaryPicker && (
        <DatePickerSheet
          value={new Date()}
          onChange={vm.handleSetAnniversary}
          label={t('dashboard.setAnniversary.title')}
          maximumDate={new Date()}
          onClose={() => vm.setShowAnniversaryPicker(false)}
        />
      )}
    </>
  );
}
