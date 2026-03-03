import React from 'react';
import { ActivityIndicator, Modal, View } from 'react-native';
import { useLoading } from '../contexts/LoadingContext';
import { useAppColors } from '../navigation/theme';

/**
 * Full-screen loading overlay.
 *
 * - Semi-transparent backdrop (rgba 0,0,0,0.35)
 * - White pill with large spinner centred
 * - Blocks all touches via Modal (rendered above everything)
 * - Controlled by useLoading() context
 *
 * Rendered once inside NavigationContainer (in RootNavigator) so it has
 * access to both LoadingContext and NavigationContext (for useAppColors).
 */
export function LoadingOverlay() {
  const { isLoading } = useLoading();
  const colors = useAppColors();

  return (
    <Modal
      transparent
      visible={isLoading}
      animationType="fade"
      statusBarTranslucent>
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
        pointerEvents="auto">
        <View
          className="bg-white rounded-2xl p-6 items-center justify-center"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 15,
          }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    </Modal>
  );
}
