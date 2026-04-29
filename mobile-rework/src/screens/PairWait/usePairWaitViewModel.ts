import { CommonActions } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, BackHandler, Platform } from 'react-native';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// Sprint 68 T467 — Wait screen logic.
//
// Three independent paths can flip the user from waiting → paired:
//   1. 4s GET /api/couple poll (catches the case where push is missing /
//      delayed / device offline at the redeem moment).
//   2. Foreground push listener watching for type='partner_joined' (instant
//      transition without waiting for the next poll tick).
//   3. The push tap itself (cold-start / warm-tap), handled by T469's
//      central deep-link router — not this VM.
//
// Both 1 and 2 funnel through `goPaired()`, which is idempotent (cleans
// up timers + listeners and only dispatches once).
//
// useAppColors() is consumed in the View, NOT here — Reanimated worklets
// can't safely read theme tokens (memory feedback_reanimated_worklet_colors).

type CoupleResponse = {
  id: string;
  name: string | null;
  inviteCode: string | null;
  paired: boolean;
};

type SettingResponse = { key: string; value: string | null };

const POLL_INTERVAL_MS = 4000;

export function usePairWaitViewModel() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const setPushPermAsked = useAuthStore((s) => s.setPushPermAsked);

  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [slogan, setSlogan] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Refs let nested callbacks (interval ticks, listener fires) read the
  // current state without re-creating the effect on every render.
  const navigatedRef = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const copyToastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (copyToastRef.current) {
      clearTimeout(copyToastRef.current);
      copyToastRef.current = null;
    }
  }, []);

  const goPaired = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    cleanup();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'onboarding-done' }],
      }),
    );
  }, [cleanup, navigation]);

  // 1) Permission popup ASAP + initial fetch + start polling.
  // Sprint 68 PW-1 (Boss build 135 directive 2026-04-29): fire the notif-
  // perm prompt SYNCHRONOUSLY on mount before any network call so a slow
  // /api/couple fetch can't delay the system popup off-screen. iOS still
  // dedups internally — the OS only ever shows the dialog once per install
  // — so dropping the authStore.pushPermAsked gate is safe and removes a
  // re-render cycle (the gate flipped pushPermAsked which re-fired this
  // effect). The store flag is still updated for analytics consistency.
  useEffect(() => {
    let cancelled = false;

    // Fire-and-forget. Don't await — the popup is resolved by iOS on its
    // own thread and doesn't gate the rest of the bootstrap.
    void (async () => {
      try {
        await Notifications.requestPermissionsAsync();
      } catch {
        // Decline / unsupported / no-op iOS dedup — all silent.
      }
      if (!cancelled) setPushPermAsked(true);
    })();

    async function bootstrap() {
      try {
        const couple = await apiClient.get<CoupleResponse>('/api/couple');
        if (cancelled) return;
        setInviteCode(couple.inviteCode);
        if (couple.paired) {
          // Race window — joiner redeemed between CoupleForm submit and
          // Wait mount. Fast-forward instead of polling.
          goPaired();
          return;
        }
      } catch {
        // Ignore — the poll loop will retry on the next tick.
      }

      try {
        const setting = await apiClient.get<SettingResponse>('/api/settings/app_slogan');
        if (cancelled) return;
        setSlogan(setting.value);
      } catch {
        // Slogan is optional — fall back to generic copy below.
      }

      if (cancelled) return;
      pollRef.current = setInterval(async () => {
        try {
          const couple = await apiClient.get<CoupleResponse>('/api/couple');
          if (couple.paired) goPaired();
        } catch {
          // Network blip — try again next tick.
        }
      }, POLL_INTERVAL_MS);
    }

    void bootstrap();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [cleanup, goPaired, setPushPermAsked]);

  // 2) Foreground push listener — fires the moment APNs delivers the push
  // while the app is in the foreground. Handles both `data.type` (Android /
  // future Expo SDK normalisation) and `trigger.payload.type` (current iOS
  // raw APNs path — same extraction shape as Sprint 65 D80).
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const content = notification.request.content as {
        data?: { type?: string } | null;
      };
      const trigger = notification.request.trigger as {
        payload?: { type?: string } | null;
      } | null;
      const type = content.data?.type ?? trigger?.payload?.type;
      if (type === 'partner_joined') goPaired();
    });
    return () => sub.remove();
  }, [goPaired]);

  // 3) Hardware back (Android) — pairing is one-way. The (auth)/_layout
  // already locks gestureEnabled:false on this route; this catches the
  // physical button case which gestureEnabled doesn't cover. iOS has no
  // hardware back so the BackHandler is effectively Android-only.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const onCopyCode = useCallback(async () => {
    if (!inviteCode) return;
    try {
      await Clipboard.setStringAsync(inviteCode);
      void Haptics.selectionAsync();
      setCopied(true);
      if (copyToastRef.current) clearTimeout(copyToastRef.current);
      copyToastRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard occasionally throws on simulator — silent.
    }
  }, [inviteCode]);

  // Spec: the bottom CTA "Mở Zalo gửi mã" re-shares the code; it does NOT
  // navigate. Today that's a code copy + light haptic — the user pivots to
  // Zalo themselves. Future: native share sheet via `expo-sharing` if Boss
  // wants it deep-linked.
  const onShareToZalo = onCopyCode;

  // Sprint 68 PW-2 (Boss build 135 directive 2026-04-29) — the layout
  // locks gestureEnabled / headerBackVisible because pairing is one-way
  // for the *couple*. But the CREATOR personally can still bail out
  // (e.g. signed up under the wrong account, mistyped CoupleForm) and
  // their only escape today is the OS task switcher + force-kill. Wire
  // the back-circle to a destructive Alert: confirm → wipe auth + reset
  // to (auth)/welcome. Same root-navigator dispatch pattern as
  // Profile/signOut (Sprint 61). The OnboardingDone equivalent is the
  // gate's natural cleanup, so this is the only entry point that needs
  // a manual exit.
  const onBackPress = useCallback(() => {
    Alert.alert(
      t('onboarding.pairWait.signOutTitle'),
      t('onboarding.pairWait.signOutBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('onboarding.pairWait.signOutConfirm'),
          style: 'destructive',
          onPress: () => {
            cleanup();
            void useAuthStore.getState().clear();
            const root = navigation.getParent();
            root?.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  {
                    name: '(auth)',
                    state: { index: 0, routes: [{ name: 'welcome' }] },
                  },
                ],
              }),
            );
          },
        },
      ],
    );
  }, [cleanup, navigation, t]);

  return {
    inviteCode,
    slogan,
    copied,
    onCopyCode,
    onShareToZalo,
    onBackPress,
  };
}
