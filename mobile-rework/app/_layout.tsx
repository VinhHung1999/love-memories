import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { setAudioModeAsync } from 'expo-audio';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { router as imperativeRouter, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import { CameraActionSheet } from '@/components/CameraActionSheet';
import { UploadProgressToast } from '@/components/UploadProgressToast';
import { parseMemouraUrl } from '@/lib/deepLink';
import {
  registerDevicePushToken,
  subscribeToPushTokenRotation,
} from '@/lib/pushNotifications';
import { configureGoogleSignIn } from '@/lib/socialAuth';
import { initI18n } from '@/locales/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useThemeStore } from '@/stores/themeStore';
import { fontMap } from '@/theme/fonts';
import { ThemeProvider } from '@/theme/ThemeProvider';

// D70 (Sprint 65 Build 93 hot-fix): foreground notification behaviour.
// Without an explicit handler, expo-notifications swallows incoming
// pushes when the app is foregrounded — the user only sees them on the
// Notifications screen after a refetch. Setting `shouldShowBanner: true`
// keeps the iOS native banner showing even with the app open, matching
// what Boss expects when Hùng + Như are both inside the app and one
// posts a moment / letter.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

SplashScreen.preventAutoHideAsync().catch(() => {});

// T288: hard cap on splash. If fonts/i18n/auth/theme can't all settle in 3s
// (corrupt AsyncStorage, missing font file, etc.) we proceed with whatever
// state we have and log a warning. Without this, a single failing async
// boot step holds the splash forever and the user sees a permanent splash
// — same blank-screen symptom as the gate hole T288 also fixes.
const HYDRATION_TIMEOUT_MS = 3000;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontMap);
  const [i18nReady, setI18nReady] = useState(false);
  const [timeoutFired, setTimeoutFired] = useState(false);
  const authHydrated = useAuthStore((s) => s.hydrated);
  const themeHydrated = useThemeStore((s) => s.hydrated);

  useEffect(() => {
    initI18n()
      .catch(() => {})
      .finally(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    void useAuthStore.getState().hydrate();
    void useThemeStore.getState().hydrate();
    // Configure Google Sign-In once at boot. Idempotent — repeats no-op.
    configureGoogleSignIn();
    // D57 (Sprint 65 Build 82 hot-fix): seed the iOS audio session category
    // at app boot so AVPlayer routes to the device speaker even when the
    // hardware silent switch is on. Without this, expo-audio playback
    // appeared to do nothing on Boss's device for letters with audio
    // attachments — the player loaded the asset (BE proxy + file are
    // valid) but iOS's default Ambient/undefined category silently muted
    // output. AudioRecordSheet flips `allowsRecording: true` while
    // recording and resets to `false` on dismiss; the playback baseline
    // sits here so every entry point inherits a consistent session.
    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    }).catch(() => {
      /* swallow: bad audio session at boot shouldn't crash the app */
    });
  }, []);

  // D69 + D70 (Sprint 65 Build 93 hot-fix): push notifications.
  //   • Register the native APNs / FCM token with the BE once the
  //     auth store hydrates and the user is signed in. The helper
  //     short-circuits when the cached token matches the current
  //     device token, so the call is safe to fire on every cold
  //     boot and after re-login.
  //   • Subscribe to iOS APNs token rotation — re-register through
  //     the same path automatically.
  //   • addNotificationResponseReceivedListener handles deep-links
  //     when the user taps a push (background → foreground). Payload
  //     is `data: { link, type }` from the BE PushService FCM send;
  //     parse `/letters/<id>` → /letter-read, `/moments/<id>` →
  //     /moment-detail, `/monthly-recap` → /monthly-recap.
  //   • addNotificationReceivedListener invalidates the in-app
  //     notifications inbox so a new push refreshes the bell badge
  //     immediately even if the user is already looking at the
  //     screen.
  const accessToken = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    if (!authHydrated) return;
    if (!accessToken) return;
    void registerDevicePushToken();
    const dispose = subscribeToPushTokenRotation();
    return dispose;
  }, [authHydrated, accessToken]);

  // D76 (Sprint 65 Build 95 hot-fix): map BE notification.link strings
  // (e.g. `/letters/{id}`, `/moments/{id}`, `/monthly-recap`) to the
  // app's actual Expo Router paths. The earlier code passed the BE
  // link straight to `router.push`, which doesn't match any registered
  // route — push silently falls back to the initial tabs entry, so
  // Boss saw every notification tap drop him on Home regardless of
  // origin.
  //
  // Also wires the cold-start path: if the user taps a push while the
  // app is killed, Expo doesn't fire `addNotificationResponseReceived
  // Listener` — it stashes the response and we fetch it via
  // `getLastNotificationResponseAsync()` once the navigation tree is
  // mounted. Run it inside the same effect, deferred by one
  // animation frame so the Stack has finished its initial render.
  // D77 (Sprint 65 Build 96 hot-fix): verbose logging at every step so
  // a Console.app capture from Boss's device pinpoints whether the
  // listener fires, what payload arrives, and which branch the
  // dispatcher hits. Build 96's deep-link dispatch silently fell
  // through to home for both letter + moment pushes; without device
  // logs we couldn't tell whether the listener fires, the regex
  // matches, or `router.push` silently no-ops. Also swap to the
  // imperative `router` from 'expo-router' so the dispatch isn't
  // sensitive to closure / re-render timing on the `useRouter` hook
  // — the imperative router is a singleton bound to the app navigator
  // so it's safe to call from any context.
  // D81 (Sprint 65 Build 100 verified) — production-clean push deep-link
  // dispatch. Keys to remember:
  //   • iOS expo-notifications stashes the custom APNs payload at
  //     `request.trigger.payload`, NOT `content.data` (always null)
  //     or `content.userInfo` (missing on the JS layer in SDK 54).
  //     `extractLink()` falls through data → userInfo → trigger.payload
  //     so the same code works on Android (which uses content.data) and
  //     any future Expo SDK that lifts the custom keys into data.
  //   • Imperative `router` from 'expo-router' (singleton) dispatches
  //     reliably from the listener context regardless of render timing.
  //   • `setTimeout(50)` cushion gives the navigator a tick after a
  //     warm-tap wake before the push completes.
  //   • `requestAnimationFrame` defer for cold-start drain so the Stack
  //     finishes its first render before we navigate.
  const dispatchNotificationLink = useCallback(
    (link: string | null | undefined) => {
      if (!link) return;
      const letterMatch = link.match(/^\/letters\/([\w-]+)$/);
      const momentMatch = link.match(/^\/moments\/([\w-]+)$/);
      // T455 (Sprint 67) — editorial recap lives at /recap/monthly[?month=...].
      // Accept BOTH the new path and the legacy `/monthly-recap` (still
      // emitted by BE CronService until B-be-monthly-recap-link-update
      // flips it).
      const recapMonthMatch = link.match(
        /^\/recap\/monthly(?:\?month=(\d{4}-\d{2}))?$/,
      );
      // T457 (Sprint 67) — weekly recap deep-link. ISO week format
      // YYYY-Www captured into the route param.
      const recapWeekMatch = link.match(
        /^\/recap\/weekly(?:\?week=(\d{4}-W\d{2}))?$/,
      );
      if (letterMatch) {
        setTimeout(() => {
          imperativeRouter.push({
            pathname: '/letter-read',
            params: { id: letterMatch[1] },
          });
        }, 50);
      } else if (momentMatch) {
        setTimeout(() => {
          imperativeRouter.push({
            pathname: '/moment-detail',
            params: { id: momentMatch[1] },
          });
        }, 50);
      } else if (recapMonthMatch) {
        const month = recapMonthMatch[1];
        setTimeout(() => {
          imperativeRouter.push(
            month
              ? { pathname: '/recap/monthly', params: { month } }
              : '/recap/monthly',
          );
        }, 50);
      } else if (recapWeekMatch) {
        const week = recapWeekMatch[1];
        setTimeout(() => {
          imperativeRouter.push(
            week
              ? { pathname: '/recap/weekly', params: { week } }
              : '/recap/weekly',
          );
        }, 50);
      } else if (link === '/monthly-recap') {
        // Legacy alias — same destination, no month param (ViewModel falls
        // back to previous full month). Drop this branch once BE flips.
        setTimeout(() => imperativeRouter.push('/recap/monthly'), 50);
      } else if (link === '/weekly-recap') {
        // T457 legacy alias — BE CronService still emits this path until
        // B-be-weekly-recap-link-update flips it.
        setTimeout(() => imperativeRouter.push('/recap/weekly'), 50);
      } else if (link === '/notifications') {
        setTimeout(() => imperativeRouter.push('/notifications'), 50);
      } else if (link === '/daily-questions') {
        // Sprint 66 T428 — `daily_question_reminder` (cron 8AM VN) and
        // `daily_question_partner_answered` (BE submitAnswer realtime)
        // both ship payload.link='/daily-questions'.
        setTimeout(() => imperativeRouter.push('/daily-questions'), 50);
      } else if (link === '/(auth)/onboarding-done') {
        // Sprint 68 T469 — partner_joined push (T463). The creator was
        // sitting on the Wait screen polling for the joiner; the push
        // signals "they're in" and the tap fast-forwards to OnboardingDone.
        // If the user has already moved past onboarding (e.g. inbox tap
        // on a stale notification, or they reopened the app after the
        // poll already fired the reset), the auth gate sees
        // onboardingComplete=true and bounces them straight to (tabs).
        // setTimeout(50) cushions warm-tap navigator timing — same shape
        // as letters/moments/recap. Cold-start drain runs through the
        // same dispatcher under requestAnimationFrame in the effect below.
        setTimeout(() => imperativeRouter.push('/(auth)/onboarding-done'), 50);
      }
      // Unknown links no-op — better than dropping the user on a
      // mismatched route. Daily-plan etc still land here.
    },
    [],
  );

  const extractLink = (
    req: Notifications.NotificationRequest,
  ): string | undefined => {
    const content = req.content as {
      data?: { link?: string } | null;
      userInfo?: { link?: string } | null;
    };
    const trigger = req.trigger as {
      payload?: { link?: string } | null;
    } | null;
    return (
      content.data?.link ??
      content.userInfo?.link ??
      trigger?.payload?.link
    );
  };

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(() => {
      useNotificationsStore.getState().invalidate();
    });
    const response = Notifications.addNotificationResponseReceivedListener(
      (resp) => {
        const link = extractLink(resp.notification.request);
        dispatchNotificationLink(link);
      },
    );

    // Cold-start: app killed → tap push → app launches with the response
    // stashed. Drain it after the next frame so the Stack is mounted.
    let cancelled = false;
    void Notifications.getLastNotificationResponseAsync().then((resp) => {
      if (cancelled || !resp) return;
      const link = extractLink(resp.notification.request);
      requestAnimationFrame(() => dispatchNotificationLink(link));
    });

    return () => {
      cancelled = true;
      received.remove();
      response.remove();
    };
  }, [dispatchNotificationLink]);

  const allReady =
    (fontsLoaded || fontError) && i18nReady && authHydrated && themeHydrated;
  const ready = allReady || timeoutFired;

  useEffect(() => {
    if (allReady) return;
    const id = setTimeout(() => {
      console.warn(
        `[RootLayout] hydration timed out after ${HYDRATION_TIMEOUT_MS}ms — proceeding with partial state`,
        { fontsLoaded, fontError: !!fontError, i18nReady, authHydrated, themeHydrated },
      );
      setTimeoutFired(true);
    }, HYDRATION_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [allReady, fontsLoaded, fontError, i18nReady, authHydrated, themeHydrated]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <ThemeProvider>
          {/* BottomSheetModalProvider must wrap any screen that spawns a
              @gorhom/bottom-sheet BottomSheetModal. Sits inside ThemeProvider so
              sheets inherit the same `vars()` scope descendants consume. First
              needed by Sprint 61 T344 ComingSoonSheet; additional sheets in
              T340–T342 reuse the same provider. */}
          {/* T397/T398 (Sprint 63) — @expo/react-native-action-sheet renders
              native UIAlertController on iOS / BottomSheetDialog on Android.
              Sits inside ThemeProvider + above BottomSheetModalProvider so
              Detail's more-dots menu (Edit/Delete) uses a true native sheet,
              not a @gorhom/bottom-sheet portal. */}
          <ActionSheetProvider>
            <BottomSheetModalProvider>
              <RootStack />
              {/* T377: single global instance. Any screen calls
                  useCameraSheetStore.getState().open() to present it — no ref
                  drilling through the nav tree. */}
              <CameraActionSheet />
              {/* T378: single global toast that tracks uploadQueue entries so
                  photo uploads keep flagging progress / errors after the
                  composer modal dismisses. Mounted inside
                  BottomSheetModalProvider and above RootStack so it floats over
                  every route (tabs + modals). */}
              <UploadProgressToast />
              <StatusBar style="auto" />
            </BottomSheetModalProvider>
          </ActionSheetProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootStack() {
  useDeepLink();
  useAuthGate();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(modal)" options={{ presentation: 'modal' }} />
      {/* T386.7 — moment-detail lives outside (modal) as a full-screen card
          push (Boss Build-44 feedback). Default stack card presentation. */}
      <Stack.Screen name="moment-detail" />
      {/* PB5 — photobooth must be fullScreenModal (no rounded corners, covers
          status bar). Inside (modal) group the fullScreenModal override is
          ignored because the parent group is already presentation:'modal'.
          Promoted to root stack, same pattern as moment-detail. */}
      <Stack.Screen name="photobooth" options={{ presentation: 'fullScreenModal' }} />
      {/* D42 (Build 76 hot-fix) — letter-read promoted out of (modal) so it
          pushes as a full-screen card (Boss feedback: read mode shouldn't be
          a modal sheet). Same pattern as moment-detail. */}
      <Stack.Screen name="letter-read" />
      {/* T425 (Sprint 65) — Notifications inbox top-level route. Push
          transition (not modal) per Lu Q4. Reuses the same back-gesture
          + auth-gate skip wiring as moment-detail / letter-read. */}
      <Stack.Screen name="notifications" />
      {/* T428 (Sprint 66) — Daily Q&A full screen. Top-level route entered
          from DailyQCard tap on Dashboard or via push deep-link
          (`/daily-questions`). Same auth-gate skip pattern as notifications. */}
      <Stack.Screen name="daily-questions" />
      {/* T458 (Sprint 67) — RecapArchive list (12 months + 12 weeks).
          Reachable from Profile "Lưu trữ recap" row. Push transition. */}
      <Stack.Screen name="recap-archive" />
      {/* D4 (Sprint 67 hot-fix 2026-04-27) — Stories monthly + weekly
          promoted out of `(modal)` group so `fullScreenModal` actually
          wins (parent group's `presentation: 'modal'` would otherwise
          force a sheet card). Same lesson as Photobooth PB5 + letter-read
          D42 + moment-detail T386.7. */}
      <Stack.Screen
        name="recap/monthly/index"
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <Stack.Screen
        name="recap/weekly/index"
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </Stack>
  );
}

// Routes the user to the right segment whenever auth state itself changes
// (sign in, sign out, onboarding complete). Once they're already in the right
// segment we leave them alone — they can navigate freely inside `(auth)`
// without the gate yanking them to a different screen mid-form.
//
// Sprint 60 T284: gate is keyed on `onboardingComplete`, not `coupleId`.
// During onboarding the user transiently has coupleId=set but pairing isn't
// done; routing to (tabs) on coupleId would break the resume path. T286
// OnboardingDone is the explicit commit that flips onboardingComplete=true.
//
// Sprint 60 T288: explicit branch for the initial `/` (`/index`) route.
// On a cold-start with `authed=T, onboardingComplete=T` Expo Router lands the
// user on the root index (segments[0]===undefined → not in (auth), not in
// (tabs)). The pre-T288 four-branch gate had no match for that case and the
// blank `/index` placeholder rendered forever — Boss's white-screen bug.
// Fix: collapse routing into three exhaustive auth states; any time the user
// is NOT in the correct group (including unknown groups like /index), push
// them to the right destination.
//
// PRE_AUTH_SCREENS = the (auth) screens shown BEFORE the user has a session.
// The remaining (auth) screens (personalize / pair-create / couple-create /
// pair-wait / pair-join / onboarding-done) are post-auth wizard steps, so an
// authed-not-onboarded user is allowed to stay on those. The standalone
// permissions screen was retired in Sprint 68 T470 — notif-perm is now
// prompted inline at the Wait screen (creator) and at PairJoin redeem
// (joiner) instead of forcing a wizard wall.
const PRE_AUTH_SCREENS: readonly string[] = [
  'welcome',
  'intro',
  'signup',
  'login',
  'forgot-password',
];

function useAuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const accessToken = useAuthStore((s) => s.accessToken);
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete);
  const hasSeenOnboarding = useAuthStore((s) => s.hasSeenOnboarding);
  // Sprint 68 T470 hot-fix — gate must re-run when coupleId flips so a
  // cold-start mid-onboarding (CoupleForm submitted, Wait pending) lands on
  // pair-wait instead of bouncing back to personalize. Subscribing to just
  // the field (not the whole user object) keeps the effect from firing on
  // unrelated user mutations like avatarUrl / color edits.
  const coupleId = useAuthStore((s) => s.user?.coupleId ?? null);

  useEffect(() => {
    // expo-router types segments as a narrow tuple inferred from the app
    // tree, so segments[1] trips TS even though it exists at runtime.
    const seg = segments as readonly string[];
    const inAuthGroup = seg[0] === '(auth)';
    const inTabsGroup = seg[0] === '(tabs)';
    const inModalGroup = seg[0] === '(modal)';
    const authed = !!accessToken;
    const screen = seg[1];
    const onPreAuthScreen =
      inAuthGroup && typeof screen === 'string' && PRE_AUTH_SCREENS.includes(screen);

    if (!authed) {
      // Unauthed: only allowed inside the (auth) group. Anything else
      // (tabs, modals, /index, unknown) → /login if the user has previously
      // completed onboarding on this install (T288 Boss bug #15), otherwise
      // /welcome (true first-run).
      if (!inAuthGroup) {
        router.replace(hasSeenOnboarding ? '/(auth)/login' : '/(auth)/welcome');
      }
      return;
    }

    // Authed past this point. Modals are layered over either tabs or auth
    // and shouldn't trigger a routing decision — leave them alone. Same
    // treatment for root-level card-push routes (T386.7: moment-detail,
    // PB5: photobooth fullScreenModal).
    if (inModalGroup) return;
    if (seg[0] === 'moment-detail') return;
    if (seg[0] === 'photobooth') return;
    if (seg[0] === 'letter-read') return;
    if (seg[0] === 'notifications') return;
    if (seg[0] === 'daily-questions') return;
    if (seg[0] === 'recap-archive') return;
    if (seg[0] === 'recap') return;

    if (!onboardingComplete) {
      // Authed but onboarding incomplete. Sprint 68 T470 wizard:
      //   personalize → pair-create → couple-create → pair-wait → onboarding-done
      //                                                ↘ pair-join → onboarding-done
      //
      // Sprint 68 T470 hot-fix (Boss build 131): the resume target
      // depends on whether the user has a couple yet.
      //   coupleId === null → /(auth)/personalize (wizard start)
      //   coupleId !== null → /(auth)/pair-wait (creator already submitted
      //     CoupleForm and is waiting for the joiner — bouncing them back
      //     to Personalize would 409 the next CoupleForm submit and lose
      //     their place in the queue). T467 Wait bootstrap re-fetches
      //     /api/couple on mount, so a joiner who redeemed while the app
      //     was killed gets fast-forwarded to onboarding-done from there.
      //
      // Tabs, pre-auth screens, /index, and unknown groups all bounce to
      // the resume target above.
      const targetWizardEntry = coupleId
        ? '/(auth)/pair-wait'
        : '/(auth)/personalize';
      const inWizard = inAuthGroup && !onPreAuthScreen;
      if (!inWizard) router.replace(targetWizardEntry);
      return;
    }

    // Authed + onboarded: belongs in (tabs). Anywhere else (auth group,
    // /index from a fresh cold-start, unknown) → tabs.
    if (!inTabsGroup) router.replace('/(tabs)');
  }, [accessToken, onboardingComplete, hasSeenOnboarding, coupleId, segments, router]);
}

// Catches `memoura://pair?code=…` and `https://memoura.app/pair?code=…` whether
// the app cold-started from the link or was already running. Pre-fills the join
// form via T285's `?code=` route param.
//
// Sprint 60 T285 (Sprint 68 T470 update): if the user isn't authed yet
// (cold-start from share link before they've ever signed in), stash the
// code in authStore.pendingPairCode and let useAuthGate route to
// /(auth)/welcome. After signup/login the gate drops them on
// /(auth)/personalize (wizard entry). Once they walk Personalize and land
// on PairChoice (`/(auth)/pair-create`), that screen consumes
// pendingPairCode and router.replace's into pair-join with the code as a
// route param.
function useDeepLink() {
  const router = useRouter();
  const handledInitial = useRef(false);

  useEffect(() => {
    function handle(url: string | null | undefined) {
      const route = parseMemouraUrl(url);
      if (!route) return;
      if (route.name === 'pair-join') {
        const code = route.params?.code;
        const authed = !!useAuthStore.getState().accessToken;
        if (!authed) {
          // Stash + let the gate take them through the auth wizard. Don't push
          // pair-join itself — the user can't join without a JWT, and we don't
          // want a half-functional pair-join screen flashing.
          if (code) useAuthStore.getState().setPendingPairCode(code);
          return;
        }
        // T312: /join/<code> URLs are owned by `app/join/[code].tsx` — that
        // file-route handles the authed redirect to pair-join. Skip push here
        // so we don't stack two pair-join entries. Legacy /pair?code=… still
        // needs this branch because there's no file route for it.
        const urlStr = (url ?? '').toString().toLowerCase();
        const isJoinFileRoute =
          urlStr.includes('/join/') || urlStr.startsWith('memoura://join/');
        if (isJoinFileRoute) return;
        router.push({ pathname: '/(auth)/pair-join', params: route.params });
      }
    }

    if (!handledInitial.current) {
      handledInitial.current = true;
      Linking.getInitialURL()
        .then(handle)
        .catch(() => {});
    }

    const sub = Linking.addEventListener('url', (event) => handle(event.url));
    return () => sub.remove();
  }, [router]);
}
