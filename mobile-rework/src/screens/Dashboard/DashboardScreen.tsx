import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { SafeScreen, TabBarSpacer } from '@/components';

import { TimerHero } from './components/TimerHero';
import { ShareCodeCard } from './ShareCodeCard';
import { useDashboardViewModel } from './useDashboardViewModel';

// T307 (Sprint 60) — greeting + ShareCodeCard shell.
// T375 (Sprint 62) — empty ↔ latest-moment branch on hero slot.
// T415 (Sprint 64) — retired the EmptyHero / LatestMomentCard hero branch in
// favor of <TimerHero /> (cinematic count-up + avatars + anniversary clock).
// ShareCodeCard stays above and self-unmounts once the partner joins. Tapping
// a moment still happens in the Moments tab — Dashboard is now "how long have
// we been us" rather than "here's the newest photo".

export function DashboardScreen() {
  const { t } = useTranslation();
  const vm = useDashboardViewModel();

  const greeting = vm.userName
    ? t('home.greeting', { name: vm.userName })
    : t('tabs.home');

  return (
    <SafeScreen>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4">
          <Text className="font-displayMedium text-ink text-[22px] leading-[28px]">
            {greeting}
          </Text>
          <Text className="mt-1 font-body text-ink-mute text-[13px]">
            {t('home.greetingTime')}
          </Text>
        </View>

        <ShareCodeCard />

        <TimerHero
          you={vm.you}
          partner={vm.partner}
          anniversary={vm.anniversaryDate}
          timerLabel={t('home.timerLabel')}
          daysUnit={t('home.units.d')}
          yearsUnit={t('home.units.y')}
          monthsUnit={t('home.units.m')}
          countdownLabel={(n) => t('home.countdown', { n })}
        />

        <TabBarSpacer />
      </ScrollView>
    </SafeScreen>
  );
}
