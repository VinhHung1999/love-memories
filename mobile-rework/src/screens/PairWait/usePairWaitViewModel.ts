import { CommonActions } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
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
  const pushPermAsked = useAuthStore((s) => s.pushPermAsked);
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

  // 1) Permission popup (once per session) + initial fetch + start polling.
  useEffect(() => {
    let cancelled = false;

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

      if (!pushPermAsked) {
        try {
          await Notifications.requestPermissionsAsync();
        } catch {
          // User declining is fine; in-app polling still works.
        }
        if (!cancelled) setPushPermAsked(true);
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
  }, [cleanup, goPaired, pushPermAsked, setPushPermAsked]);

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

  return {
    inviteCode,
    slogan,
    copied,
    onCopyCode,
    onShareToZalo,
  };
}
