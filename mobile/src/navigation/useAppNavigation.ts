import React from 'react';
import { useNavigation } from '@react-navigation/native';

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
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

// ── useAppNavigation ──────────────────────────────────────────────────────────

/**
 * Wraps useNavigation() and adds showBottomSheet / showAlert convenience methods.
 * All screens and ViewModels should prefer this over raw useNavigation().
 */
export function useAppNavigation() {
  const navigation = useNavigation<any>();

  return Object.assign(navigation, {
    showBottomSheet: (
      component: React.ComponentType<any>,
      props?: Record<string, any>,
    ) => {
      // navigate (not push) so it finds the single BottomSheet route in AppStack
      // regardless of how deeply nested the current screen is
      navigation.navigate('BottomSheet', { component, props });
    },

    showAlert: (params: AlertParams) => {
      navigation.navigate('Alert', params);
    },
  });
}
