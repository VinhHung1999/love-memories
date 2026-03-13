import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { subscriptionApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { SubscriptionLimits, SubscriptionStatus } from '../types';

// ── Context shape ──────────────────────────────────────────────────────────────

interface SubscriptionContextValue {
  /** true when plan === 'plus' */
  isPremium: boolean;
  /** 'free' | 'plus' */
  plan: 'free' | 'plus';
  /** Usage limits for the free tier. null when plus (unlimited). */
  limits: SubscriptionLimits | null;
  /** Full status object from the backend */
  status: SubscriptionStatus | null;
  /** true while the initial fetch is in flight */
  isLoading: boolean;
  /** Manually refresh — call after a successful purchase */
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const fetchStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await subscriptionApi.getStatus();
      setStatus(data);
    } catch (err) {
      console.warn('[SubscriptionContext] fetchStatus failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch on mount / auth change
  useEffect(() => {
    setIsLoading(true);
    fetchStatus();
  }, [fetchStatus]);

  // Refresh on app foreground (AppState 'active')
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        fetchStatus();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [fetchStatus]);

  const isPremium = status?.plan === 'plus';
  const plan = status?.plan ?? 'free';
  const limits = status?.limits ?? null;

  return (
    <SubscriptionContext.Provider
      value={{ isPremium, plan, limits, status, isLoading, refresh: fetchStatus }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used inside SubscriptionProvider');
  }
  return ctx;
}
