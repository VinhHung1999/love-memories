import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { env } from '@/config/env';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// ----- Apple credential persistence ---------------------------------------
// Apple only sends fullName + email on the FIRST sign-in for a given Apple ID.
// Subsequent sign-ins return only `user` (the stable Apple user ID) + token.
// We persist the first-time tuple keyed by Apple user ID so we can resend the
// nameHint to the backend on later sign-ins (e.g. re-login after sign-out).
//
// NOTE: This is a defensive cache only — the backend already creates the user
// row on first sign-in, so missing nameHint on subsequent calls just means the
// backend uses what's already in DB. Cache is best-effort.
const APPLE_CACHE_KEY = '@memoura/apple-credentials/v1';

type AppleCachedCreds = Record<
  string,
  { name: string | null; email: string | null }
>;

async function readAppleCache(): Promise<AppleCachedCreds> {
  try {
    const raw = await AsyncStorage.getItem(APPLE_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AppleCachedCreds) : {};
  } catch {
    return {};
  }
}

async function writeAppleCache(cache: AppleCachedCreds): Promise<void> {
  try {
    await AsyncStorage.setItem(APPLE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore — defensive cache, next sign-in retries
  }
}

async function persistAppleCreds(
  appleUserId: string,
  name: string | null,
  email: string | null,
): Promise<void> {
  if (!name && !email) return;
  const cache = await readAppleCache();
  const existing = cache[appleUserId] ?? { name: null, email: null };
  cache[appleUserId] = {
    name: name ?? existing.name,
    email: email ?? existing.email,
  };
  await writeAppleCache(cache);
}

async function readAppleCredsFor(
  appleUserId: string,
): Promise<{ name: string | null; email: string | null }> {
  const cache = await readAppleCache();
  return cache[appleUserId] ?? { name: null, email: null };
}

// ----- Google -------------------------------------------------------------

let googleConfigured = false;

export function configureGoogleSignIn(): void {
  if (googleConfigured) return;
  if (!env.googleIosClientId || !env.googleWebClientId) {
    return;
  }
  GoogleSignin.configure({
    iosClientId: env.googleIosClientId,
    webClientId: env.googleWebClientId,
    offlineAccess: false,
  });
  googleConfigured = true;
}

export type SocialSignInResult =
  | { kind: 'token'; idToken: string; nameHint?: string }
  | { kind: 'cancelled' };

export async function signInWithGoogle(): Promise<SocialSignInResult> {
  configureGoogleSignIn();
  try {
    await GoogleSignin.hasPlayServices();
    const result = await GoogleSignin.signIn();
    // v14+: result is `{ type: 'success' | 'cancelled', data?: User }`.
    if (result.type === 'cancelled') return { kind: 'cancelled' };
    const idToken = result.data?.idToken;
    if (!idToken) {
      throw new Error('Google sign-in returned no idToken');
    }
    return { kind: 'token', idToken };
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
      return { kind: 'cancelled' };
    }
    throw err;
  }
}

// ----- Apple --------------------------------------------------------------

export async function signInWithApple(): Promise<SocialSignInResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple sign-in is iOS only');
  }
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('Apple sign-in returned no identityToken');
    }

    const fullNameStr = credential.fullName
      ? [credential.fullName.givenName, credential.fullName.familyName]
          .filter(Boolean)
          .join(' ')
          .trim() || null
      : null;

    // First-login persistence — keyed by Apple's stable user id.
    await persistAppleCreds(
      credential.user,
      fullNameStr,
      credential.email ?? null,
    );

    // For subsequent logins where Apple sends null name/email, fall back to
    // the cached tuple so the backend gets a nameHint either way.
    let nameHint = fullNameStr ?? undefined;
    if (!nameHint) {
      const cached = await readAppleCredsFor(credential.user);
      nameHint = cached.name ?? undefined;
    }

    return { kind: 'token', idToken: credential.identityToken, nameHint };
  } catch (err) {
    // expo-apple-authentication throws ERR_REQUEST_CANCELED on user dismiss.
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code === 'ERR_REQUEST_CANCELED'
    ) {
      return { kind: 'cancelled' };
    }
    throw err;
  }
}

// ----- Shared completion: BE round-trip → setSession --------------------
//
// Both /auth/google and /auth/apple may return either a full AuthResponse
// (existing user) or `{needsCouple: true, ...Profile}` (brand-new user).
// On the needsCouple branch we immediately call /complete with no invite/
// coupleName so the user is created with `coupleId=null`. The auth gate in
// app/_layout.tsx then routes them to /(auth)/pair-create exactly like the
// email/password signup path.

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string | null;
    name: string | null;
    avatar: string | null;
    coupleId: string | null;
    onboardingComplete: boolean;
  };
};

type NeedsCoupleResponse =
  | { needsCouple: true; googleProfile: unknown }
  | { needsCouple: true; appleProfile: unknown };

type SocialAuthApiResponse = AuthResponse | NeedsCoupleResponse;

function isNeedsCouple(r: SocialAuthApiResponse): r is NeedsCoupleResponse {
  return (r as NeedsCoupleResponse).needsCouple === true;
}

export async function completeGoogleSignIn(idToken: string): Promise<void> {
  const init = await apiClient.post<SocialAuthApiResponse>(
    '/api/auth/google',
    { idToken },
    { skipAuth: true },
  );
  const final: AuthResponse = isNeedsCouple(init)
    ? await apiClient.post<AuthResponse>(
        '/api/auth/google/complete',
        { idToken },
        { skipAuth: true },
      )
    : init;
  await applyAuthResponse(final);
}

export async function completeAppleSignIn(
  idToken: string,
  nameHint?: string,
): Promise<void> {
  const init = await apiClient.post<SocialAuthApiResponse>(
    '/api/auth/apple',
    { idToken, ...(nameHint ? { name: nameHint } : {}) },
    { skipAuth: true },
  );
  const final: AuthResponse = isNeedsCouple(init)
    ? await apiClient.post<AuthResponse>(
        '/api/auth/apple/complete',
        { idToken, ...(nameHint ? { name: nameHint } : {}) },
        { skipAuth: true },
      )
    : init;
  await applyAuthResponse(final);
}

async function applyAuthResponse(res: AuthResponse): Promise<void> {
  await useAuthStore.getState().setSession({
    accessToken: res.accessToken,
    refreshToken: res.refreshToken,
    onboardingComplete: res.user.onboardingComplete,
    user: {
      id: res.user.id,
      email: res.user.email,
      name: res.user.name,
      avatarUrl: res.user.avatar,
      color: (res.user as { color?: string | null }).color ?? null,
      coupleId: res.user.coupleId,
    },
  });
}
