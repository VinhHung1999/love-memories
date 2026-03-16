/**
 * useFeatureGate — Task 6
 *
 * Layer 1 pre-flight subscription checks.
 * All create flows + module entry points call this before proceeding.
 * On block → navigates to Paywall automatically.
 */

import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSubscription } from '../contexts/SubscriptionContext';
import type { SubscriptionLimits } from '../types';

export type GatedFeature = 'moments' | 'foodspots' | 'expenses' | 'sprints';
export type PremiumModule =
  | 'love-letters'
  | 'recipes'
  | 'date-planner'
  | 'photo-booth'
  | 'achievements'
  | 'what-to-eat'
  | 'monthly-recap';

export function useFeatureGate() {
  const { isPremium, limits, isLoading } = useSubscription();
  const navigation = useNavigation<any>();

  /**
   * Check if user can create a countable resource (moments, foodspots, expenses, sprints).
   * - Returns true immediately for Plus users or while subscription is loading.
   * - Returns false + navigates to Paywall if free-tier limit reached.
   */
  const canCreate = useCallback(
    (feature: GatedFeature): boolean => {
      if (isPremium || isLoading) return true;
      if (!limits) return true;

      const limit = limits[feature as keyof SubscriptionLimits];
      if (!limit) return true;

      if (limit.used >= limit.max) {
        navigation.navigate('Paywall', { trigger: 'limit', blockedFeature: feature });
        return false;
      }
      return true;
    },
    [isPremium, isLoading, limits, navigation],
  );

  /**
   * Check if a premium-only module is locked (free tier).
   * Pure check — no side-effect navigation. Use requireModule() for guarded entry.
   */
  const isModuleLocked = useCallback(
    (_module: PremiumModule): boolean => {
      if (isLoading) return false;
      return !isPremium;
    },
    [isPremium, isLoading],
  );

  /**
   * Guard for premium module entry points.
   * - Returns true if accessible (Plus or loading).
   * - Returns false + navigates to Paywall with trigger='locked_module' if locked.
   */
  const requireModule = useCallback(
    (module: PremiumModule): boolean => {
      if (isLoading || isPremium) return true;
      navigation.navigate('Paywall', { trigger: 'locked_module', blockedFeature: module });
      return false;
    },
    [isPremium, isLoading, navigation],
  );

  return { canCreate, isModuleLocked, requireModule };
}
