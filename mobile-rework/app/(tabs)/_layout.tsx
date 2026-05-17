import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PillTabBar } from '@/components/navigation/PillTabBar';
import { useCameraSheetStore } from '@/stores/cameraSheetStore';

export default function TabsLayout() {
  const { t } = useTranslation();

  // T377: camera pill now opens the global CameraActionSheet (mounted in
  // app/_layout.tsx). Store toggle instead of ref drilling so Dashboard +
  // Moments empty-state CTAs can share the same affordance.
  const handleCameraPress = () => {
    useCameraSheetStore.getState().open();
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // T372 — absolute-positioned tabBarStyle tells React Navigation to
        // stop reserving scene space for its default tab-bar slot. Our
        // floating PillTabBar (rendered below via the `tabBar` prop) can
        // then overlay the full-height Scene without the ~83px reserved
        // band that was clipping scroll content on Build 35. Boss-approved
        // config 2026-04-21 — 4 keys only, no `height: 0` override.
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      tabBar={(props) => <PillTabBar {...props} onCameraPress={handleCameraPress} />}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="moments" options={{ title: t('tabs.moments') }} />
      <Tabs.Screen name="letters" options={{ title: t('tabs.letters') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
