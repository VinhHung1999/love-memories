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

// D74 (Sprint 65 Build 94 EMERGENCY hot-fix): module-level guards to
// prevent the infinite-loop that hammered the BE with 30+ POST
// /api/push/mobile-subscribe calls per second on Build 94.
//
// Root cause: `Notifications.getDevicePushTokenAsync()` synchronously
// dispatches the registered `addPushTokenListener` callback with the
// same token. Our listener called `registerDevicePushToken()` again,
// which fetched the token, which dispatched the listener, which …
// Cache short-circuit lived behind an `await AsyncStorage.getItem`
// that the racing call out-paced — all callers entered the POST
// branch before any of them set the cache, and the BE rate limiter
// kicked in at 429.
//
// Defence in depth:
//   1. `inFlight` — module flag so concurrent callers return early.
//   2. `lastRegisteredToken` — in-memory cache, sync read before any
//      await, populated immediately after a successful POST.
//   3. `lastRegisterAt` — 60-second throttle as a belt-and-suspenders
//      against any future race we miss.
//   4. The token-rotation listener now compares against
//      `lastRegisteredToken` before re-firing register, so the
//      `getDevicePushTokenAsync`-triggered self-fire short-circuits at
//      the listener, not deeper inside register().
let inFlight = false;
let lastRegisteredToken: string | null = null;
let lastRegisterAt = 0;
const MIN_REGISTER_INTERVAL_MS = 60_000;

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
// call multiple times; cached token + in-flight flag short-circuit
// duplicate calls.
export async function registerDevicePushToken(): Promise<void> {
  // D74 — sync guards BEFORE any await. The infinite loop came from
  // multiple callers entering the body before the first cache write
  // landed; a sync flag closes the door immediately.
  if (inFlight) return;
  if (
    lastRegisteredToken !== null &&
    Date.now() - lastRegisterAt < MIN_REGISTER_INTERVAL_MS
  ) {
    return;
  }
  inFlight = true;
  try {
    const status = await getNotificationPermissionStatus();
    if (status !== 'granted') return;
    const tokenRes = await Notifications.getDevicePushTokenAsync();
    const token = tokenRes.data;
    if (!token) return;
    if (lastRegisteredToken === token) return;
    const cached = await AsyncStorage.getItem(LAST_TOKEN_KEY);
    if (cached === token) {
      // First call this session but token unchanged — populate the
      // in-memory cache so future calls bail at the sync guard.
      lastRegisteredToken = token;
      lastRegisterAt = Date.now();
      return;
    }
    await registerMobilePushToken({
      token,
      deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    lastRegisteredToken = token;
    lastRegisterAt = Date.now();
    await AsyncStorage.setItem(LAST_TOKEN_KEY, token);
  } catch {
    /* swallow — push registration shouldn't break app boot */
  } finally {
    inFlight = false;
  }
}

// D69 — wire the iOS token-rotation listener so a refreshed APNs token
// auto-re-registers. Returns the disposer so the caller can unsubscribe
// on logout if needed.
export function subscribeToPushTokenRotation(): () => void {
  const sub = Notifications.addPushTokenListener((next) => {
    // D74 — `getDevicePushTokenAsync()` dispatches this listener with
    // the same token, which re-triggered register() and infinite-
    // looped through the BE. Compare against the in-memory cache so
    // we only react when iOS actually rotates the token.
    if (lastRegisteredToken && next?.data === lastRegisteredToken) return;
    void registerDevicePushToken();
  });
  return () => sub.remove();
}

// Helper used at logout to invalidate the cached token so the next
// login re-registers cleanly.
export async function clearCachedPushToken(): Promise<void> {
  // D74 — also wipe the in-memory cache so a fresh login re-registers
  // immediately rather than waiting for the throttle window.
  lastRegisteredToken = null;
  lastRegisterAt = 0;
  try {
    await AsyncStorage.removeItem(LAST_TOKEN_KEY);
  } catch {
    /* swallow */
  }
}
