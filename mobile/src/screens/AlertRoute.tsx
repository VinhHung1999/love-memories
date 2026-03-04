import React from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import AlertModal from '../components/AlertModal';
import type { AlertParams } from '../navigation/useAppNavigation';

/**
 * Generic transparent-modal route that renders AlertModal.
 * Caller: navigation.push('Alert', { title, message, type, onConfirm })
 * All AlertModal dismiss paths (backdrop, cancel, confirm) call navigation.goBack().
 */
export default function AlertRoute() {
  const params = useRoute<any>().params as AlertParams;
  const navigation = useNavigation();
  const handleDismiss = () => navigation.goBack();

  return (
    <AlertModal
      visible={true}
      title={params.title}
      message={params.message}
      type={params.type}
      confirmLabel={params.confirmLabel}
      cancelLabel={params.cancelLabel}
      onConfirm={params.onConfirm}
      onCancel={params.onCancel}
      onDismiss={handleDismiss}
    />
  );
}
