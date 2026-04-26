import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, ScrollView, Text, View } from 'react-native';

import { BellButton } from '@/components/BellButton';
import { LinearGradient, SafeScreen, TabBarSpacer } from '@/components';
import {
  maybePromptNotificationPermissionOnce,
  registerDevicePushToken,
} from '@/lib/pushNotifications';
import { useAppColors } from '@/theme/ThemeProvider';
import type { HeroPerson } from './useDashboardViewModel';
import { DailyQCard } from './components/DailyQCard';
import {
  LatestMomentCard,
  formatRelative,
} from './components/LatestMomentCard';
import { TimerHero } from './components/TimerHero';
import { ShareCodeCard } from './ShareCodeCard';
import { useDashboardViewModel } from './useDashboardViewModel';

// T307 (Sprint 60) — greeting + ShareCodeCard shell.
// T375 (Sprint 62) — empty ↔ latest-moment branch on hero slot.
// T415 (Sprint 64) — TimerHero (cinematic count-up + avatars + anniversary) added
// ABOVE LatestMomentCard. Both are now visible: TimerHero always, LatestMomentCard
// only when there is at least one moment (guard: vm.latest != null).
// Build-61 hotfix: D5 CoupleAvatars + greeting row, D6 LatestMomentCard restored.

export function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const vm = useDashboardViewModel();

  // D71 (Sprint 65 Build 93 hot-fix): one-shot auto-prompt for
  // notification permission on Dashboard mount. The helper persists a
  // flag so we never re-prompt — iOS hides the prompt anyway after the
  // first denial, but the flag stops `requestPermissionsAsync` spinning
  // on every Home tab visit. After the prompt resolves we attempt token
  // registration so a freshly-granted user starts receiving pushes
  // without a relaunch.
  useEffect(() => {
    void (async () => {
      await maybePromptNotificationPermissionOnce();
      await registerDevicePushToken();
    })();
  }, []);

  const greeting = vm.userName
    ? t('home.greeting', { name: vm.userName })
    : t('tabs.home');

  const openDetail = useCallback(
    (id: string) => {
      router.push({ pathname: '/moment-detail', params: { id } });
    },
    [router],
  );

  const justNow = t('moments.detail.justNow');
  const relativeLabel = useMemo(() => {
    if (!vm.latest) return '';
    return formatRelative(new Date(vm.latest.createdAt), i18n.language, justNow);
  }, [vm.latest, i18n.language, justNow]);

  return (
    <SafeScreen>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* D5a: greeting row — CoupleAvatars left + text right (flex-1 min-w-0 so long names truncate).
            T425 (Sprint 65) — BellButton appended trailing slot per Lu Q1 (no separate top bar). */}
        <View className="px-5 pt-4 flex-row items-center gap-[10px]">
          <CoupleAvatars you={vm.you} partner={vm.partner} />
          <View className="flex-1 min-w-0">
            <Text
              className="font-displayMedium text-ink text-[22px] leading-[28px]"
              numberOfLines={1}
            >
              {greeting}
            </Text>
            <Text className="mt-1 font-body text-ink-mute text-[13px]">
              {t('home.greetingTime')}
            </Text>
          </View>
          <BellButton />
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

        {/* T426 (Sprint 66) — DailyQCard renders between TimerHero and
            LatestMomentCard. Hides itself if vm.todayQuestion is null
            (couple unpaired, BE empty, or fetch error). */}
        <DailyQCard
          today={vm.todayQuestion}
          streakCount={vm.streakCount}
          myHasAnswered={vm.myHasAnswered}
          partnerHasAnswered={vm.partnerHasAnswered}
          partnerName={vm.partner?.name ?? null}
          labels={{
            title: t('home.dailyQTitle'),
            cta: t('home.dailyQCta'),
            streak: t('home.dailyQStreak', { days: vm.streakCount }),
            partnerPending: t('home.dailyQPartnerPending', {
              partner: vm.partner?.name ?? '',
            }),
            bothAnswered: t('home.dailyQBothAnswered'),
            youPending: t('home.dailyQYouPending', {
              partner: vm.partner?.name ?? '',
            }),
          }}
          onPress={() => router.push('/daily-questions')}
        />

        {/* D6: LatestMomentCard restored below TimerHero. Only shown when there is
            at least one moment. Empty state is intentionally omitted on Dashboard —
            the Moments tab handles the empty-first-moment CTA. */}
        {vm.latest ? (
          <LatestMomentCard
            moment={vm.latest}
            eyebrow={t('home.latestFrom', { partner: vm.partner?.name ?? '' })}
            relativeLabel={relativeLabel}
            onPress={openDetail}
          />
        ) : null}

        <TabBarSpacer />
      </ScrollView>
    </SafeScreen>
  );
}

// D5b: CoupleAvatars — 50×36 container with two 32×32 overlapping circles.
// Shows real avatar photos when available (you.avatarUrl / partner.avatarUrl),
// falls back to gradient initial circles matching prototype L62-80.
function CoupleAvatars({
  you,
  partner,
}: {
  you: HeroPerson;
  partner: HeroPerson | null;
}) {
  const c = useAppColors();

  return (
    <View className="w-[50px] h-[36px]">
      {/* L circle — left:0, top:0 */}
      <View
        className="absolute w-8 h-8 rounded-full overflow-hidden items-center justify-center"
        style={{ left: 0, top: 0, borderWidth: 2, borderColor: c.bg }}
      >
        <LinearGradient
          colors={[c.heroA, c.heroB]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        {you.avatarUrl ? (
          <Image source={{ uri: you.avatarUrl }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="font-bodyBold text-white text-[13px] relative">{you.initial}</Text>
        )}
      </View>

      {/* M circle — right:0, top:4 */}
      <View
        className="absolute w-8 h-8 rounded-full overflow-hidden items-center justify-center"
        style={{ right: 0, top: 4, borderWidth: 2, borderColor: c.bg }}
      >
        <LinearGradient
          colors={[c.secondary, c.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="absolute inset-0"
        />
        {partner?.avatarUrl ? (
          <Image source={{ uri: partner.avatarUrl }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
        ) : (
          <Text className="font-bodyBold text-white text-[13px] relative">
            {partner?.initial ?? '·'}
          </Text>
        )}
      </View>
    </View>
  );
}
