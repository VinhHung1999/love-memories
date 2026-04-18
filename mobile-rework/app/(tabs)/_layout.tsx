import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppColors } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useAppColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMute,
        tabBarStyle: { backgroundColor: colors.bgElev, borderTopColor: colors.line },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="moments" options={{ title: t('tabs.moments') }} />
      <Tabs.Screen name="letters" options={{ title: t('tabs.letters') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
