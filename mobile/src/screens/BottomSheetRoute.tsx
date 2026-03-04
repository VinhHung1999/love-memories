import React, { useCallback, useRef } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { BottomSheetParams } from '../navigation/useAppNavigation';

/**
 * Generic transparent-modal route that renders any BottomSheet component.
 * Caller: navigation.push('BottomSheet', { screen: CreateMomentSheet, props: { moment } })
 * The rendered sheet receives onClose → navigation.goBack() automatically.
 *
 * closedRef guards against double goBack():
 *   onSuccess → onClose() → goBack() → screen pops → sheet unmounts → onDismiss → onClose() again
 */
export default function BottomSheetRoute() {
  const { screen: Screen, props = {} } = useRoute<any>().params as BottomSheetParams;
  const navigation = useNavigation();
  const closedRef = useRef(false);

  const handleClose = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    navigation.goBack();
  }, [navigation]);

  return <Screen {...props} onClose={handleClose} />;
}
