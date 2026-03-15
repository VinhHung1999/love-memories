/**
 * Module-level refs for the 3 measurable CurvedTabBar targets.
 * CurvedTabBar attaches these refs; useDashboardTour reads + measures them.
 * Module scope avoids prop-drilling through the navigation layer.
 */
import React from 'react';
import { View } from 'react-native';

export const tabBarRefs = {
  momentsTab:   React.createRef<View>(),
  cameraButton: React.createRef<View>(),
  lettersTab:   React.createRef<View>(),
};
