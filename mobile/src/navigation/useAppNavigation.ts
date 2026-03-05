import React, { useRef, useCallback, useMemo } from 'react';
import { NavigationContext } from '@react-navigation/core';

// ── AlertParams ───────────────────────────────────────────────────────────────

export interface AlertParams {
  title: string;
  message?: string;
  type?: 'info' | 'error' | 'confirm' | 'destructive';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

// ── BottomSheetParams ─────────────────────────────────────────────────────────

export interface BottomSheetParams {
  screen: React.ComponentType<any>;
  props?: Record<string, any>;
}

// ── useAppNavigation ──────────────────────────────────────────────────────────

/**
 * Safe navigation hook — uses React.useContext directly instead of useNavigation()
 * to avoid throwing when NavigationContext is temporarily unavailable during
 * screen transitions (react-native-screens Freeze/Suspense).
 *
 * Uses a ref so callbacks always reference the latest navigation object,
 * even if the context value changes between renders.
 */
export function useAppNavigation() {
  const navigation = React.useContext(NavigationContext) as any;
  const navRef = useRef(navigation);
  navRef.current = navigation;

  const showBottomSheet = useCallback(
    (screen: React.ComponentType<any>, props?: Record<string, any>) => {
      navRef.current?.push('BottomSheet', { screen, props });
    },
    [],
  );

  const showAlert = useCallback((params: AlertParams) => {
    navRef.current?.push('Alert', params);
  }, []);

  return useMemo(() => {
    if (!navigation) return { showBottomSheet, showAlert } as any;
    return Object.assign(navigation, { showBottomSheet, showAlert });
  }, [navigation, showBottomSheet, showAlert]);
}
