import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { useAppColors } from '../../navigation/theme';
import { coupleApi, momentsApi, foodSpotsApi, settingsApi, cookingSessionsApi, expensesApi, datePlansApi } from '../../lib/api';
import type { ExpenseStats } from '../../lib/api';
import t from '../../locales/en';
import type { Moment, FoodSpot, CoupleProfile, CookingSession, DatePlan } from '../../types';
import { Heart, Utensils, ChefHat, Banknote, Mail, CalendarHeart, Trophy, Map } from 'lucide-react-native';

export interface RelationshipDuration {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export function useDashboardViewModel() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const colors = useAppColors();

  // ── Data queries ────────────────────────────────────────────────────────────

  const { data: couple, isLoading: coupleLoading } = useQuery<CoupleProfile>({
    queryKey: ['couple'],
    queryFn: coupleApi.get,
    enabled: !!user,
  });

  const { data: moments, isLoading: momentsLoading } = useQuery<Moment[]>({
    queryKey: ['moments'],
    queryFn: momentsApi.list,
    enabled: !!user,
  });

  const { data: foodSpots, isLoading: foodSpotsLoading } = useQuery<FoodSpot[]>({
    queryKey: ['foodspots'],
    queryFn: foodSpotsApi.list,
    enabled: !!user,
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: expenseStats } = useQuery<ExpenseStats>({
    queryKey: ['expenses-stats', currentMonth],
    queryFn: () => expensesApi.stats(currentMonth),
    enabled: !!user,
    staleTime: 60_000,
  });

  const today = new Date().toISOString().slice(0, 10);
  const { data: allPlans } = useQuery<DatePlan[]>({
    queryKey: ['plans'],
    queryFn: datePlansApi.list,
    enabled: !!user,
    staleTime: 60_000,
  });

  const { data: activeSession } = useQuery<CookingSession | null>({
    queryKey: ['cooking-session-active'],
    queryFn: cookingSessionsApi.active,
    enabled: !!user,
    staleTime: 10_000,
  });

  const { data: appNameSetting } = useQuery({
    queryKey: ['settings', 'app_name'],
    queryFn: () => settingsApi.get('app_name'),
    enabled: !!user,
  });

  const { data: sloganSetting } = useQuery({
    queryKey: ['settings', 'app_slogan'],
    queryFn: () => settingsApi.get('app_slogan'),
    enabled: !!user,
  });

  // ── Live clock — ticks every second for the relationship timer ──────────────

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Day-level granularity — tick once per minute is sufficient
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Derived data ────────────────────────────────────────────────────────────

  const partner = useMemo(
    () => couple?.users.find(u => u.id !== user?.id) ?? null,
    [couple, user],
  );

  const recentMoments = useMemo(
    () =>
      [...(moments ?? [])]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [moments],
  );

  const recentFoodSpots = useMemo(
    () =>
      [...(foodSpots ?? [])]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 2),
    [foodSpots],
  );

  const relationshipDuration = useMemo<RelationshipDuration | null>(() => {
    const startDate = couple?.anniversaryDate;
    if (!startDate) return null;
    const start = new Date(startDate);
    const diff = now.getTime() - start.getTime();
    if (diff < 0) return null;
    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const years = Math.floor(totalDays / 365);
    const remaining = totalDays - years * 365;
    const months = Math.floor(remaining / 30);
    const days = remaining % 30;
    return { years, months, days, totalDays };
  }, [couple?.anniversaryDate, now]);

  const upcomingPlans = useMemo<DatePlan[]>(
    () =>
      [...(allPlans ?? [])]
        .filter(p => p.date >= today && p.status !== 'completed')
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3),
    [allPlans, today],
  );

  // ── Navigation handlers ─────────────────────────────────────────────────────

  const handleMomentPress = (momentId: string) => {
    navigation.navigate('MomentsTab', {
      screen: 'MomentDetail',
      params: { momentId },
    });
  };

  const handleFoodSpotPress = (foodSpotId: string) => {
    navigation.navigate('FoodSpotsTab', {
      screen: 'FoodSpotDetail',
      params: { foodSpotId },
    });
  };

  const handleFoodSpotListPress = () => {
    navigation.navigate('FoodSpotsTab', { screen: 'FoodSpotsList' });
  };

  const navigateTo = useCallback((tab: string) => {
    navigation.navigate(tab);
  }, [navigation]);

  const handleActiveCookingPress = useCallback(() => {
    if (!activeSession) return;
    navigation.navigate('RecipesTab', {
      screen: 'CookingSession',
      params: { sessionId: activeSession.id },
    });
  }, [activeSession, navigation]);

  const handleAIRecipePress = useCallback(() => {
    navigation.navigate('RecipesTab', {
      screen: 'WhatToEat',
    });
  }, [navigation]);

  const navigateToExpenses = useCallback(() => navigation.navigate('ExpensesTab'), [navigation]);
  const navigateToMap = useCallback(() => navigation.navigate('MapTab'), [navigation]);
  const navigateToFoodSpots = useCallback(() => navigation.navigate('FoodSpotsTab'), [navigation]);
  const navigateToNotifications = useCallback(() => navigation.navigate('NotificationsTab'), [navigation]);
  const navigateToLetters = useCallback(() => navigation.navigate('LettersTab'), [navigation]);
  const navigateToDatePlanner = useCallback(() => navigation.navigate('DatePlannerTab'), [navigation]);
  const navigateToAchievements = useCallback(() => navigation.navigate('Achievements'), [navigation]);
  const navigateToDailyQuestions = useCallback(() => navigation.navigate('DailyQuestionsTab'), [navigation]);
  const navigateToMonthlyRecap = useCallback(() => navigation.navigate('MonthlyRecapTab'), [navigation]);

  // Show monthly recap banner on days 1-3 of each month
  const showMonthlyRecapBanner = now.getDate() <= 3;

  // ── Derived display values ──────────────────────────────────────────────────

  const headerTitle = couple?.name ?? appNameSetting?.value ?? t.app.name;
  const slogan = sloganSetting?.value ?? t.dashboard.defaultSlogan;

  const quickActions = useMemo(() => [
    {
      icon: Heart,
      label: t.dashboard.quickActions.moments,
      iconColor: colors.primary,
      bgClass: 'bg-primary/10',
      onPress: () => navigateTo('MomentsTab'),
    },
    {
      icon: Utensils,
      label: t.dashboard.quickActions.food,
      iconColor: colors.secondary,
      bgClass: 'bg-secondary/10',
      onPress: navigateToFoodSpots,
    },
    {
      icon: ChefHat,
      label: t.dashboard.quickActions.recipes,
      iconColor: colors.primary,
      bgClass: 'bg-primary/10',
      onPress: () => navigateTo('RecipesTab'),
    },
    {
      icon: Banknote,
      label: t.dashboard.quickActions.expenses,
      iconColor: '#8B5CF6',
      bgClass: 'bg-violet-100',
      onPress: navigateToExpenses,
    },
    {
      icon: Mail,
      label: t.dashboard.quickActions.letters,
      iconColor: colors.primary,
      bgClass: 'bg-primary/10',
      onPress: navigateToLetters,
    },
    {
      icon: CalendarHeart,
      label: t.dashboard.quickActions.datePlanner,
      iconColor: colors.secondary,
      bgClass: 'bg-secondary/10',
      onPress: navigateToDatePlanner,
    },
    {
      icon: Trophy,
      label: t.dashboard.quickActions.achievements,
      iconColor: colors.accent,
      bgClass: 'bg-accent/10',
      onPress: navigateToAchievements,
    },
    {
      icon: Map,
      label: t.dashboard.quickActions.map,
      iconColor: colors.accent,
      bgClass: 'bg-accent/10',
      onPress: navigateToMap,
    },
  ], [colors, navigateTo, navigateToFoodSpots, navigateToExpenses, navigateToLetters, navigateToDatePlanner, navigateToAchievements, navigateToMap]);

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    user,
    couple,
    partner,
    recentMoments,
    recentFoodSpots,
    momentsCount: moments?.length ?? 0,
    foodSpotsCount: foodSpots?.length ?? 0,
    relationshipDuration,
    headerTitle,
    slogan,
    isLoading: coupleLoading || momentsLoading || foodSpotsLoading,
    activeSession: activeSession ?? null,
    expenseStats: expenseStats ?? null,
    upcomingPlans,
    quickActions,
    handleMomentPress,
    handleFoodSpotPress,
    navigateTo,
    handleActiveCookingPress,
    handleAIRecipePress,
    navigateToExpenses,
    navigateToMap,
    navigateToFoodSpots,
    handleFoodSpotListPress,
    navigateToNotifications,
    navigateToLetters,
    navigateToDatePlanner,
    navigateToAchievements,
    navigateToDailyQuestions,
    navigateToMonthlyRecap,
    showMonthlyRecapBanner,
  };
}
