import { useState, useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { coupleApi, momentsApi, foodSpotsApi, settingsApi, cookingSessionsApi, expensesApi } from '../../lib/api';
import type { ExpenseStats } from '../../lib/api';
import t from '../../locales/en';
import type { Moment, FoodSpot, CoupleProfile, CookingSession } from '../../types';

export interface RelationshipDuration {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export function useDashboardViewModel() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

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

  const navigateTo = (tab: string) => {
    navigation.navigate(tab);
  };

  const handleActiveCookingPress = () => {
    if (!activeSession) return;
    navigation.navigate('RecipesTab', {
      screen: 'CookingSession',
      params: { sessionId: activeSession.id },
    });
  };

  const handleAIRecipePress = () => {
    navigation.navigate('RecipesTab', {
      screen: 'WhatToEat',
    });
  };

  const navigateToExpenses = () => navigation.navigate('ExpensesTab');
  const navigateToNotifications = () => navigation.navigate('NotificationsTab');
  const navigateToLetters = () => navigation.navigate('LettersTab');
  const navigateToDatePlanner = () => navigation.navigate('DatePlannerTab');
  const navigateToAchievements = () => navigation.navigate('Achievements');

  // ── Derived display values ──────────────────────────────────────────────────

  const headerTitle = couple?.name ?? appNameSetting?.value ?? t.app.name;
  const slogan = sloganSetting?.value ?? t.dashboard.defaultSlogan;

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
    handleMomentPress,
    handleFoodSpotPress,
    navigateTo,
    handleActiveCookingPress,
    handleAIRecipePress,
    navigateToExpenses,
    navigateToNotifications,
    navigateToLetters,
    navigateToDatePlanner,
    navigateToAchievements,
  };
}
