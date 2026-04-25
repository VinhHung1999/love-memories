import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerMobilePushToken } from '@/api/push';

// D69 + D71 (Sprint 65 Build 93 hot-fix) — push notifications client
// helper. BE writes to MobilePushToken via /api/push/mobile-subscribe;
// the BE-side cron / event hooks dispatch via Firebase Service Account
// (Lu wired the env on dev + prod backends, 2026-04-26).
//
// Token flow:
//   1. Caller (post-login or app boot) invokes `registerDevicePushToken`.
//   2. We check + request notification permissions (D71 also runs the
//      auto-prompt from Dashboard mount).
//   3. `getDevicePushTokenAsync` returns the native APNs / FCM token.
//   4. POST { token, deviceType } to BE.
//
// We dedupe registration by caching the last-registered token in
// AsyncStorage; if the device returns the same token on the next
// register call we skip the BE round-trip. expo-notifications fires
// `addPushTokenListener` when iOS rotates the APNs token — we
// re-register through the same path.

const LAST_TOKEN_KEY = '@memoura/push/lastToken/v1';
const PERM_PROMPTED_KEY = '@memoura/push/permPrompted/v1';

type PermStatus = 'granted' | 'denied' | 'undetermined';

export async function getNotificationPermissionStatus(): Promise<PermStatus> {
  const res = await Notifications.getPermissionsAsync();
  if (res.granted) return 'granted';
  if (res.canAskAgain) return 'undetermined';
  return 'denied';
}

export async function requestNotificationPermission(): Promise<PermStatus> {
  const res = await Notifications.requestPermissionsAsync();
  if (res.granted) return 'granted';
  if (res.canAskAgain) return 'undetermined';
  return 'denied';
}

// D71 — auto-prompt on Dashboard mount (once per install). The
// AsyncStorage flag prevents nagging the user every time they hit
// home; if they actively decline iOS hides the prompt anyway, but the
// flag stops us from spinning on `requestPermissionsAsync` repeatedly.
export async function maybePromptNotificationPermissionOnce(): Promise<void> {
  try {
    const flag = await AsyncStorage.getItem(PERM_PROMPTED_KEY);
    if (flag === 'true') return;
    const status = await getNotificationPermissionStatus();
    if (status !== 'undetermined') {
      // Either already granted or denied — flip the flag without prompting.
      await AsyncStorage.setItem(PERM_PROMPTED_KEY, 'true');
      return;
    }
    await requestNotificationPermission();
    await AsyncStorage.setItem(PERM_PROMPTED_KEY, 'true');
  } catch {
    /* swallow — perm prompt isn't critical-path */
  }
}

// D69 — fetch + register the native push token with the BE. Safe to
// call multiple times; cached token short-circuits the BE round-trip.
export async function registerDevicePushToken(): Promise<void> {
  try {
    const status = await getNotificationPermissionStatus();
    if (status !== 'granted') return;
    const tokenRes = await Notifications.getDevicePushTokenAsync();
    const token = tokenRes.data;
    if (!token) return;
    const cached = await AsyncStorage.getItem(LAST_TOKEN_KEY);
    if (cached === token) return;
    await registerMobilePushToken({
      token,
      deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    await AsyncStorage.setItem(LAST_TOKEN_KEY, token);
  } catch {
    /* swallow — push registration shouldn't break app boot */
  }
}

// D69 — wire the iOS token-rotation listener so a refreshed APNs token
// auto-re-registers. Returns the disposer so the caller can unsubscribe
// on logout if needed.
export function subscribeToPushTokenRotation(): () => void {
  const sub = Notifications.addPushTokenListener(() => {
    void registerDevicePushToken();
  });
  return () => sub.remove();
}

// Helper used at logout to invalidate the cached token so the next
// login re-registers cleanly.
export async function clearCachedPushToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_TOKEN_KEY);
  } catch {
    /* swallow */
  }
}
