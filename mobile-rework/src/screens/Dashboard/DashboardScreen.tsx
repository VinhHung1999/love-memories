import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeScreen } from '@/components';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useAuthStore } from '@/stores/authStore';
import { ShareCodeCard } from './ShareCodeCard';

// T307 (Sprint 60 Bundle 4) — minimal Dashboard stub. Sprint 61 will replace
// the placeholder block with the full home feed; for now we only need a
// surface that hosts ShareCodeCard so the creator has a way to share the
// invite code after Personalize commits the couple.

export function DashboardScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const tabBarBottomInsetClass = useTabBarBottomInset();
  const greeting = user?.name
    ? t('home.greeting', { name: user.name })
    : t('tabs.home');

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        contentContainerClassName={tabBarBottomInsetClass}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-4">
          <Text className="font-displayMedium text-ink text-[22px] leading-[28px]">
            {greeting}
          </Text>
          <Text className="mt-1 font-body text-ink-mute text-[13px]">
            {t('home.greetingTime')}
          </Text>
        </View>

        <ShareCodeCard />

        <View className="px-5 pt-8">
          <Text className="font-body text-ink-mute text-[13px] text-center">
            {t('tabs.home')}
          </Text>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
