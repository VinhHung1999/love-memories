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
import { apiClient } from '@/lib/apiClient';
import { parseMemouraUrl } from '@/lib/deepLink';
import { initI18n } from '@/locales/i18n';
import { useAuthStore } from '@/stores/authStore';
import { fontMap } from '@/theme/fonts';
import { ThemeProvider } from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontMap);
  const [i18nReady, setI18nReady] = useState(false);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    initI18n()
      .catch(() => {})
      .finally(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    void useAuthStore.getState().hydrate();
  }, []);

  const ready = (fontsLoaded || fontError) && i18nReady && hydrated;

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
  useOnboardingResume();
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
// Sprint 60 T284: gate is now keyed on `onboardingComplete`, not `coupleId`.
// During onboarding the user transiently has coupleId=set but pairing isn't
// done; routing to (tabs) on coupleId would break the resume path. T286
// OnboardingDone is the explicit commit that flips onboardingComplete=true.
function useAuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const accessToken = useAuthStore((s) => s.accessToken);
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete);

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const authed = !!accessToken;

    if (!authed && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (authed && !onboardingComplete && inTabsGroup) {
      router.replace('/(auth)/pair-create');
    } else if (authed && onboardingComplete && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [accessToken, onboardingComplete, segments, router]);
}

// Reinstall edge case (sprint-60-pairing.md §"Edge case — reinstall with
// existing couple"): hydrate restores tokens but onboardingComplete defaults
// to false on a fresh install. Lazy-probe GET /api/couple once when authed +
// has coupleId + onboardingComplete is still false; if the couple is full
// (memberCount === 2) the user previously finished onboarding, so flip the
// flag and let useAuthGate route to (tabs).
//
// Lazy (here, after auth state is known) instead of eager (in hydrate)
// because: (a) launch must stay offline-tolerant, (b) we only care once
// authed, (c) if offline the user lingers on /(auth)/pair-create and the
// next probe attempt fixes them when reconnected.
function useOnboardingResume() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const coupleId = useAuthStore((s) => s.user?.coupleId ?? null);
  const onboardingComplete = useAuthStore((s) => s.onboardingComplete);
  const probedRef = useRef(false);

  useEffect(() => {
    if (!accessToken || !coupleId || onboardingComplete) {
      probedRef.current = false; // arm again if user signs out + back in
      return;
    }
    if (probedRef.current) return;
    probedRef.current = true;
    (async () => {
      try {
        const res = await apiClient.get<{ memberCount: number }>('/api/couple');
        if (res.memberCount >= 2) {
          await useAuthStore.getState().setOnboardingComplete(true);
        }
      } catch {
        // network down or 401 — leave flag false, gate keeps user in (auth);
        // probedRef stays true so we don't hammer; next state change re-arms.
      }
    })();
  }, [accessToken, coupleId, onboardingComplete]);
}

// Catches `memoura://pair?code=…` and `https://memoura.app/pair?code=…` whether
// the app cold-started from the link or was already running. Pre-fills the join
// form via T285's `?code=` route param.
function useDeepLink() {
  const router = useRouter();
  const handledInitial = useRef(false);

  useEffect(() => {
    function handle(url: string | null | undefined) {
      const route = parseMemouraUrl(url);
      if (!route) return;
      if (route.name === 'pair-join') {
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
