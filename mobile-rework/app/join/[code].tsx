import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

// T312 — Universal Link / custom-scheme landing.
//
// Catches `https://memoura.app/join/<code>`, `https://dev.memoura.app/join/<code>`,
// and `memoura://join/<code>`. Without this file, Expo Router's file-tree routing
// matches nothing for `/join/*` and the built-in "unknown route" screen fires
// BEFORE `useDeepLink` in `_layout.tsx` can intercept the URL — Boss saw that
// screen on Build 21 when Camera.app scanned the widget QR.
//
// Redirect rules:
//   - Invalid / too-short code → replace('/') and let useAuthGate do its thing.
//   - Unauthed user → stash `pendingPairCode`, replace('/'). After signup/login,
//     PairCreate consumes the stashed code and forwards to pair-join.
//   - Authed user → replace('/(auth)/pair-join') with the code as a route param.
//
// This file is the canonical handler for /join/* URLs; `useDeepLink` short-circuits
// navigation for those paths to avoid double-push (see _layout.tsx).

function sanitizeHex(raw: string | undefined): string {
  if (!raw) return '';
  const out: string[] = [];
  for (const ch of raw) {
    if (/[0-9a-f]/i.test(ch)) out.push(ch);
    if (out.length >= 8) break;
  }
  return out.join('').toUpperCase();
}

export default function JoinDeepLink() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const router = useRouter();

  useEffect(() => {
    const raw = Array.isArray(params.code) ? params.code[0] : params.code;
    const sanitized = sanitizeHex(raw);

    if (sanitized.length !== 8) {
      router.replace('/');
      return;
    }

    const authed = !!useAuthStore.getState().accessToken;
    if (!authed) {
      useAuthStore.getState().setPendingPairCode(sanitized);
      router.replace('/');
      return;
    }

    router.replace({
      pathname: '/(auth)/pair-join',
      params: { code: sanitized },
    });
  }, [params.code, router]);

  return null;
}
