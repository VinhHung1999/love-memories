import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { SafeScreen } from '@/components';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useAppColors } from '@/theme/ThemeProvider';

import { relativeAgo } from '../Letters/relativeAgo';
import {
  AnnivBanner,
  EmptyState,
  GroupHeader,
  NotifRow,
} from './components';
import {
  type NotifTab,
  useNotificationsViewModel,
  type NotificationView,
} from './useNotificationsViewModel';

// T425 (Sprint 65) — Notifications inbox screen. Top-level Stack route
// (push transition, not modal — Lu Q4 / Q1 spec). Layout follows
// prototype `notifications.jsx` L139-227:
//
//   ScreenHeader (back chevron + title + dynamic subtitle + 3-dot)
//   Tabs row (All / Us / Reminders + spacer + "Mark all read")
//   AnnivBanner — client-derived from couple.anniversaryDate ≤ 14 days
//   Group sections (today / yesterday / earlier)
//   Empty state if filtered list empty
//   Footer: "Cài đặt thông báo" → Profile tab
//
// Tap routing (Lu Q4 approved):
//   letter            → /letter-read?id=…
//   moment/cmt/react  → /moment-detail?id=…
//   monthly_recap     → /monthly-recap
//   weekly_recap/daily/fallback → tab home (rework has no dedicated screen)

const TAB_ORDER: NotifTab[] = ['all', 'us', 'reminders'];
const ANNIV_THRESHOLD_DAYS = 14;

type CoupleResponseLite = {
  anniversaryDate: string | null;
};

function parseTrailingId(link: string | null): string | null {
  if (!link) return null;
  const segs = link.split('/').filter(Boolean);
  return segs[segs.length - 1] ?? null;
}

export default function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const c = useAppColors();
  const vm = useNotificationsViewModel();
  const locale = i18n.language;
  const coupleId = useAuthStore((s) => s.user?.coupleId ?? null);

  const [annivDaysLeft, setAnnivDaysLeft] = useState<number | null>(null);

  // Lazy-fetch couple.anniversaryDate (Lu Q2: client-derive anniv banner
  // until BE emits a real anniversary notification — backlog
  // B-anniv-notif-be P3).
  useEffect(() => {
    if (!coupleId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<CoupleResponseLite>('/api/couple');
        if (cancelled) return;
        if (!res.anniversaryDate) {
          setAnnivDaysLeft(null);
          return;
        }
        // Days until next anniversary (this year or next, whichever
        // comes after today).
        const ann = new Date(res.anniversaryDate);
        const now = new Date();
        const todayMid = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const annThisYear = new Date(
          now.getFullYear(),
          ann.getMonth(),
          ann.getDate(),
        );
        if (annThisYear < todayMid) {
          annThisYear.setFullYear(annThisYear.getFullYear() + 1);
        }
        const days = Math.round(
          (annThisYear.getTime() - todayMid.getTime()) / 86_400_000,
        );
        setAnnivDaysLeft(days);
      } catch {
        if (!cancelled) setAnnivDaysLeft(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [coupleId]);

  const showAnniv =
    annivDaysLeft !== null &&
    annivDaysLeft >= 0 &&
    annivDaysLeft <= ANNIV_THRESHOLD_DAYS;

  const subtitle =
    vm.unreadCount > 0
      ? t('notifications.subtitle.new', { count: vm.unreadCount })
      : t('notifications.subtitle.allCaught');

  const onTap = useCallback(
    (n: NotificationView) => {
      void vm.markRead(n.id);
      const tail = parseTrailingId(n.link);
      switch (n.kind) {
        case 'letter':
          if (tail) {
            router.push({ pathname: '/letter-read', params: { id: tail } });
          }
          return;
        case 'moment':
        case 'comment':
        case 'reaction':
          if (tail) {
            router.push({
              pathname: '/moment-detail',
              params: { id: tail },
            });
          }
          return;
        case 'recap':
          // weekly_recap maps the same route — rework has no dedicated
          // weekly recap screen yet, monthly is the closest analog.
          router.push('/monthly-recap');
          return;
        case 'qna':
          // T438 (Sprint 66) — daily-question reminders + partner-answered
          // both deep-link to the full Daily Q&A screen.
          router.push('/daily-questions');
          return;
        case 'daily':
        case 'streak':
        case 'invite':
        case 'place':
        case 'fallback':
        default:
          // No deep-link target — just mark-read in place.
          return;
      }
    },
    [router, vm],
  );

  const onAnnivTap = useCallback(() => {
    router.push('/monthly-recap');
  }, [router]);

  const onSettingsTap = useCallback(() => {
    router.push('/(tabs)/profile');
  }, [router]);

  if (vm.loading) {
    return (
      <SafeScreen edges={['top']}>
        <Header
          subtitle={subtitle}
          onBack={() => router.back()}
          backLabel="Back"
          title={t('notifications.title')}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={c.primary} />
        </View>
      </SafeScreen>
    );
  }

  if (vm.error) {
    return (
      <SafeScreen edges={['top']}>
        <Header
          subtitle={subtitle}
          onBack={() => router.back()}
          backLabel="Back"
          title={t('notifications.title')}
        />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="font-bodyMedium text-ink text-[15px] text-center">
            {t('notifications.error.message')}
          </Text>
          <Pressable
            onPress={() => void vm.reload()}
            className="mt-5 px-5 h-10 rounded-full bg-primary items-center justify-center active:bg-primary-deep"
          >
            <Text className="font-bodySemibold text-white text-[14px]">
              {t('notifications.error.retry')}
            </Text>
          </Pressable>
        </View>
      </SafeScreen>
    );
  }

  const todayHasContent =
    showAnniv || vm.grouped.today.length > 0;
  const yesterdayHasContent = vm.grouped.yesterday.length > 0;
  const earlierHasContent = vm.grouped.earlier.length > 0;
  const isCompletelyEmpty =
    !todayHasContent && !yesterdayHasContent && !earlierHasContent;

  return (
    <SafeScreen edges={['top']}>
      <Header
        subtitle={subtitle}
        onBack={() => router.back()}
        backLabel="Back"
        title={t('notifications.title')}
      />

      <View className="flex-row items-center px-5 mt-2 gap-1.5">
        {TAB_ORDER.map((key) => {
          const active = key === vm.activeTab;
          return (
            <Pressable
              key={key}
              onPress={() => vm.setActiveTab(key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className="h-9 px-3.5 rounded-full items-center justify-center active:opacity-80"
              style={{
                backgroundColor: active ? c.ink : 'transparent',
              }}
            >
              <Text
                className="font-bodySemibold text-[12px]"
                style={{ color: active ? c.bg : c.inkSoft }}
              >
                {t(`notifications.tabs.${key}`)}
              </Text>
            </Pressable>
          );
        })}
        <View className="flex-1" />
        {vm.unreadCount > 0 ? (
          <Pressable
            onPress={() => void vm.markAllRead()}
            accessibilityRole="button"
            className="h-9 px-3 items-center justify-center active:opacity-70"
          >
            <Text className="font-bodySemibold text-primary text-[12px]">
              {t('notifications.markAllRead')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerClassName="pt-4 pb-10"
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={vm.refreshing}
            onRefresh={vm.onRefresh}
            tintColor={c.primary}
          />
        }
      >
        {isCompletelyEmpty ? (
          <EmptyState
            title={t('notifications.empty.title')}
            subtitle={t('notifications.empty.subtitle')}
          />
        ) : (
          <>
            {todayHasContent ? (
              <View>
                <GroupHeader label={t('notifications.groups.today')} />
                {showAnniv ? (
                  <AnnivBanner
                    eyebrow={t('notifications.anniv.eyebrow')}
                    title={t('notifications.anniv.title', {
                      count: annivDaysLeft,
                    })}
                    subtitle={t('notifications.anniv.subtitle')}
                    ctaLabel={t('notifications.anniv.cta')}
                    onPress={onAnnivTap}
                  />
                ) : null}
                {vm.grouped.today.map((n) => (
                  <NotifRow
                    key={n.id}
                    notification={n}
                    agoLabel={relativeAgo(n.createdAt, locale)}
                    onPress={() => onTap(n)}
                  />
                ))}
              </View>
            ) : null}

            {yesterdayHasContent ? (
              <View>
                <GroupHeader
                  label={t('notifications.groups.yesterday')}
                />
                {vm.grouped.yesterday.map((n) => (
                  <NotifRow
                    key={n.id}
                    notification={n}
                    agoLabel={relativeAgo(n.createdAt, locale)}
                    onPress={() => onTap(n)}
                  />
                ))}
              </View>
            ) : null}

            {earlierHasContent ? (
              <View>
                <GroupHeader label={t('notifications.groups.earlier')} />
                {vm.grouped.earlier.map((n) => (
                  <NotifRow
                    key={n.id}
                    notification={n}
                    agoLabel={relativeAgo(n.createdAt, locale)}
                    onPress={() => onTap(n)}
                  />
                ))}
              </View>
            ) : null}

            <Pressable
              onPress={onSettingsTap}
              accessibilityRole="button"
              className="mx-5 mt-6 px-4 py-3.5 rounded-2xl bg-surface-alt flex-row items-center gap-3 active:opacity-80"
            >
              <View className="w-9 h-9 rounded-full bg-surface items-center justify-center">
                <Text className="text-[16px]">🔔</Text>
              </View>
              <View className="flex-1">
                <Text className="font-bodySemibold text-ink text-[13px]">
                  {t('notifications.settings.title')}
                </Text>
                <Text className="font-body text-ink-mute text-[11px] mt-0.5">
                  {t('notifications.settings.subtitle')}
                </Text>
              </View>
              <Text className="text-ink-mute text-[16px]">›</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeScreen>
  );
}

type HeaderProps = {
  subtitle: string;
  title: string;
  backLabel: string;
  onBack: () => void;
};

function Header({ subtitle, title, backLabel, onBack }: HeaderProps) {
  const c = useAppColors();
  return (
    <View className="flex-row items-center gap-3 px-4 pt-2.5 pb-3">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        className="w-10 h-10 rounded-2xl bg-surface border border-line-on-surface items-center justify-center shadow-chip active:opacity-80"
      >
        <ChevronLeft size={18} strokeWidth={2.3} color={c.ink} />
      </Pressable>
      <View className="flex-1 min-w-0">
        <Text className="font-displayMedium text-ink text-[24px] leading-[26px]">
          {title}
        </Text>
        <Text
          className="mt-1 font-body text-ink-mute text-[12px]"
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      {/* D82b (Sprint 65 Build 102) — drop 3-dot trailing button. Boss
          says no function, looked clickable. Trailing slot stays empty
          so the title row breathes; "Mark all read" lives in the tabs
          row below the header. */}
    </View>
  );
}
