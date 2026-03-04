import React from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { BottomSheetParams } from '../navigation/useAppNavigation';

/**
 * Generic transparent-modal route that renders any BottomSheet component.
 * Caller: navigation.push('BottomSheet', { screen: CreateMomentSheet, props: { moment } })
 * The rendered sheet receives onClose → navigation.goBack() automatically.
 */
export default function BottomSheetRoute() {
  const { screen: Screen, props = {} } = useRoute<any>().params as BottomSheetParams;
  const navigation = useNavigation();

  return <Screen {...props} onClose={() => navigation.goBack()} />;
}
