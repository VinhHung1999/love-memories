import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PillTabBar } from '@/components/navigation/PillTabBar';

export default function TabsLayout() {
  const { t } = useTranslation();

  const handleCameraPress = () => {
    // T337: camera pill is a stub this sprint — modal camera sheet lands in a
    // later sprint. Log so QA can confirm the pill is responsive.
    console.log('camera-pill-press');
  };

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PillTabBar {...props} onCameraPress={handleCameraPress} />}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="moments" options={{ title: t('tabs.moments') }} />
      <Tabs.Screen name="letters" options={{ title: t('tabs.letters') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
