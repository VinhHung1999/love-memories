import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';
import { parseMemouraUrl } from '@/lib/deepLink';
import { configureGoogleSignIn } from '@/lib/socialAuth';
import { initI18n } from '@/locales/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { fontMap } from '@/theme/fonts';
import { ThemeProvider } from '@/theme/ThemeProvider';

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
  }, []);

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
          <RootStack />
          <StatusBar style="auto" />
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
// The remaining (auth) screens (pair-create / pair-invite / pair-join /
// personalize / permissions / onboarding-done) are pairing/onboarding steps,
// so an authed-not-onboarded user is allowed to stay on those.
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
    // and shouldn't trigger a routing decision — leave them alone.
    if (inModalGroup) return;

    if (!onboardingComplete) {
      // Authed but onboarding incomplete: must be inside the post-auth
      // (auth) wizard (pair-create / pair-invite / pair-join / personalize /
      // permissions / onboarding-done). Tabs, pre-auth screens, /index, and
      // unknown groups all funnel back to pair-create.
      const inWizard = inAuthGroup && !onPreAuthScreen;
      if (!inWizard) router.replace('/(auth)/pair-create');
      return;
    }

    // Authed + onboarded: belongs in (tabs). Anywhere else (auth group,
    // /index from a fresh cold-start, unknown) → tabs.
    if (!inTabsGroup) router.replace('/(tabs)');
  }, [accessToken, onboardingComplete, hasSeenOnboarding, segments, router]);
}

// Catches `memoura://pair?code=…` and `https://memoura.app/pair?code=…` whether
// the app cold-started from the link or was already running. Pre-fills the join
// form via T285's `?code=` route param.
//
// Sprint 60 T285: if the user isn't authed yet (cold-start from share link
// before they've ever signed in), stash the code in authStore.pendingPairCode
// and let useAuthGate route to /(auth)/welcome. After signup/login the gate
// drops them on /(auth)/pair-create, which consumes pendingPairCode and
// router.replace's into pair-join with the code as a route param.
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
