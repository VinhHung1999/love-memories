import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking, Platform } from 'react-native';

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as WebBrowser from 'expo-web-browser';

import { ApiError, apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';
import { useThemeControls } from '@/theme/ThemeProvider';

// T338 (Sprint 61) — Profile hero VM. Hydrates from GET /api/couple and
// exposes a compact shape the hero needs: me, partner, coupleName,
// anniversaryLabel, isSolo. Subsequent sprint-61 tasks (stats / settings /
// edit sheets) will stack more state on top of this same VM.

type CoupleUser = {
  id: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
};

type CoupleResponse = {
  id: string;
  name: string | null;
  color: string | null;
  anniversaryDate: string | null;
  inviteCode: string | null;
  users: CoupleUser[];
};

export type ProfileStage = 'loading' | 'ready' | 'error';

export type HeroPerson = {
  name: string;
  initial: string;
  avatarUrl: string | null;
};

export type ProfileStats = {
  moments: number;
  letters: number;
  questions: number;
};

const EMPTY_STATS: ProfileStats = { moments: 0, letters: 0, questions: 0 };

function toInitial(name?: string | null): string {
  if (!name) return '·';
  const trimmed = name.trim();
  if (!trimmed) return '·';
  return trimmed[0]!.toUpperCase();
}

function formatAnniversary(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function useProfileViewModel() {
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation();
  const { t } = useTranslation();
  // T356: theme detail label for the "Giao diện" settings row. The sheet
  // itself reads+writes mode directly via useThemeControls() — we only need
  // the label here to keep the row's right-hand caption in sync.
  const { mode: themeMode } = useThemeControls();
  const themeLabel = t(`profile.theme.current.${themeMode}` as const);

  const [stage, setStage] = useState<ProfileStage>('loading');
  const [couple, setCouple] = useState<CoupleResponse | null>(null);
  const [stats, setStats] = useState<ProfileStats>(EMPTY_STATS);

  // T354: `silent` skips the 'loading' → 'ready' stage transition so a focus
  // refetch doesn't flicker the hero card back to a spinner. Initial mount
  // still paints the spinner normally (silent=false).
  const load = useCallback(
    async (silent = false) => {
      // No coupleId → we're solo. No need to hit /api/couple or /api/profile/stats
      // (both gated by requireCouple → 400).
      if (!user?.coupleId) {
        setCouple(null);
        setStats(EMPTY_STATS);
        setStage('ready');
        return;
      }
      if (!silent) setStage('loading');
      try {
        // Stats are non-critical — treat a failure there as 0s rather than
        // dropping the whole screen to the error stage.
        const [coupleRes, statsRes] = await Promise.all([
          apiClient.get<CoupleResponse>('/api/couple'),
          apiClient.get<ProfileStats>('/api/profile/stats').catch(() => EMPTY_STATS),
        ]);
        setCouple(coupleRes);
        setStats(statsRes);
        setStage('ready');
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setCouple(null);
          setStats(EMPTY_STATS);
          setStage('ready');
          return;
        }
        // Silent refreshes must not knock the screen into 'error' — if the
        // hero is already painted we'd rather keep stale data than blank it.
        if (!silent) setStage('error');
      }
    },
    [user?.coupleId],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // T354: Profile VM originally loaded once on mount. If the user regenerates
  // the invite code from Dashboard (POST /api/couple/generate-invite), Profile
  // keeps rendering the stale code it fetched at mount. Refetch (silently) on
  // every Profile tab focus — /api/couple is a cheap single-couple lookup and
  // the silent flag keeps the hero card visible while the refresh is in flight.
  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const me: HeroPerson = {
    name: user?.name ?? '',
    initial: toInitial(user?.name),
    avatarUrl: user?.avatarUrl ?? null,
  };

  const partnerUser = couple?.users.find((u) => u.id !== user?.id) ?? null;
  const partner: HeroPerson | null = partnerUser
    ? {
        name: partnerUser.name ?? '',
        initial: toInitial(partnerUser.name),
        avatarUrl: partnerUser.avatar ?? null,
      }
    : null;

  const isSolo = !couple || !partner;

  // T343: notifications toggle mirrors the OS push-permission status — the
  // switch is ON only when the OS has granted permission. There is no
  // server-side flag; push can't fire without OS permission anyway so the
  // OS is the only source of truth worth reading.
  //
  // Tap behavior:
  //   undetermined → trigger the native permission prompt
  //   granted | denied → open the Settings app (iOS/Android disallow a
  //     re-prompt once the user has decided)
  //
  // An AppState listener re-reads the permission when the app returns to
  // foreground so a user who toggled it in Settings sees the row update
  // without a manual reload.
  const [notificationPermission, setNotificationPermission] =
    useState<Notifications.PermissionStatus>('undetermined' as Notifications.PermissionStatus);

  const refreshNotificationPermission = useCallback(async () => {
    const res = await Notifications.getPermissionsAsync();
    setNotificationPermission(res.status);
  }, []);

  useEffect(() => {
    void refreshNotificationPermission();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshNotificationPermission();
    });
    return () => sub.remove();
  }, [refreshNotificationPermission]);

  const onNotificationsToggle = useCallback(async () => {
    if (notificationPermission === 'undetermined') {
      const res = await Notifications.requestPermissionsAsync();
      setNotificationPermission(res.status);
      return;
    }
    await Linking.openSettings();
  }, [notificationPermission]);

  const clearAuth = useAuthStore((s) => s.clear);
  // T345: sign-out must truncate the UIKit native stack, not just the JS
  // history. Clearing auth alone leaves the gate to fire
  // router.replace('/(auth)/login') (hasSeenOnboarding persists post-logout),
  // but router.replace keeps the prior tabs controller mounted beneath —
  // iOS edge-swipe would find it and pop the user back into Profile with
  // a stale VM + 401s. Mirrors the T335 rationale; nested-state form is
  // the tabs→auth cross-segment version. Target 'login' (not 'welcome')
  // because the user already has an account and knows their creds.
  const signOut = useCallback(async () => {
    await clearAuth();
    const root = navigation.getParent();
    root?.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: '(auth)',
            state: { index: 0, routes: [{ name: 'login' }] },
          },
        ],
      }),
    );
  }, [clearAuth, navigation]);

  // T348: Delete Account (App Store 5.1.1(v) mandatory). Two-phase: the
  // sheet catches the promise and renders inline error on failure, so we
  // deliberately let non-2xx bubble via apiClient's ApiError. Only order
  // that works: DELETE first (server-side teardown), then clearAuth (no
  // point clearing local state if the server call failed), then reset
  // to 'welcome' (account is gone — signup is the only way back in).
  const deleteAccount = useCallback(async () => {
    await apiClient.del('/api/auth/account');
    await clearAuth();
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
  }, [clearAuth, navigation]);

  // T342: optimistic couple-name patch. The PUT /api/couple response is the
  // full updated couple, but we only need the name to refresh the hero /
  // settings-row detail — keep the signature narrow so the sheet doesn't
  // leak response shape into the ViewModel's public API.
  const setCoupleName = useCallback((name: string) => {
    setCouple((prev) => (prev ? { ...prev, name } : prev));
  }, []);

  // T355: optimistic anniversary save. Sheet passes the YYYY-MM-DD string it
  // built from LOCAL parts — VM trusts it (no timezone recompute here) and
  // hits PUT /api/couple, which syncs both Couple.anniversaryDate AND
  // AppSetting['relationship-start-date'] so the web PWA sees it too.
  //
  // Optimistic + revert per Lu: snapshot the prior couple inside the
  // synchronous updater, patch in the new date, then on reject roll back
  // and re-throw so the sheet can render its inline error and stay open.
  const setAnniversary = useCallback(async (iso: string) => {
    let prev: CoupleResponse | null = null;
    setCouple((current) => {
      prev = current;
      return current ? { ...current, anniversaryDate: iso } : current;
    });
    try {
      const updated = await apiClient.put<CoupleResponse>('/api/couple', {
        anniversaryDate: iso,
      });
      setCouple(updated);
    } catch (err) {
      setCouple(prev);
      throw err;
    }
  }, []);

  // App version detail for the (eventual) "Memoura+" row — read once from
  // expo-constants. Falls back to the package.json version baked into the
  // config if nativeApplicationVersion is missing (iOS simulator in dev).
  const appVersion =
    Constants.nativeApplicationVersion ??
    (Constants.expoConfig?.version as string | undefined) ??
    null;

  // T347: native binary build number for the "Phiên bản" row — iOS and
  // Android expose it on different branches of Constants.platform. No
  // expo-application dep needed; both are populated by expo-constants.
  const appBuild =
    Platform.select<string | number | undefined>({
      ios: Constants.platform?.ios?.buildNumber ?? undefined,
      android: Constants.expoConfig?.android?.versionCode ?? undefined,
    }) ?? null;
  const appVersionLabel =
    appVersion && appBuild !== null ? `${appVersion} (${appBuild})` : appVersion;

  // T347: Privacy + Terms open in an in-app browser (SFSafariViewController
  // on iOS, Chrome Custom Tabs on Android) — App Store-friendly for static
  // third-party content and keeps the user inside the app.
  const onPrivacyPress = useCallback(async () => {
    await WebBrowser.openBrowserAsync('https://memoura.app/privacy');
  }, []);
  const onTermsPress = useCallback(async () => {
    await WebBrowser.openBrowserAsync('https://memoura.app/terms');
  }, []);

  // Couple-name detail for the "Tên gọi của mình" row. When a couple hasn't
  // set a custom name, we compose "Me & Them" from both avatars' display
  // names (same shape as the hero fallback).
  const coupleNameDetail =
    couple?.name ??
    (partnerUser
      ? `${user?.name ?? ''} & ${partnerUser.name ?? ''}`.trim().replace(/^&\s+|\s+&$/g, '')
      : null);

  return {
    stage,
    me,
    partner,
    coupleName: couple?.name ?? null,
    coupleNameDetail,
    anniversaryLabel: formatAnniversary(couple?.anniversaryDate),
    isSolo,
    inviteCode: couple?.inviteCode ?? null,
    stats,
    notificationsEnabled: notificationPermission === 'granted',
    onNotificationsToggle,
    signOut,
    deleteAccount,
    appVersion,
    appVersionLabel,
    onPrivacyPress,
    onTermsPress,
    setCoupleName,
    setAnniversary,
    anniversaryIso: couple?.anniversaryDate ?? null,
    themeLabel,
    refresh: load,
  };
}
