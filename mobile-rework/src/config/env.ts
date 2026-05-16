import Constants from 'expo-constants';

// Sprint 67 T448 — `extra` is populated by `app.config.ts` per build flavor.
// `variant` lets feature code branch on the active flavor when needed (e.g.
// a "DEV" badge somewhere in the UI), but the runtime API URLs come straight
// from `extra.apiUrl` / `extra.appBaseUrl` set by app.config.ts.
//
// Precedence (intentional):
//   1. process.env.EXPO_PUBLIC_API_URL — local LAN override only. DO NOT pin
//      this in committed `.env`; if set there it overrides the flavor default
//      and breaks prod builds. Sprint 67 cleaned `.env` to leave it blank.
//   2. extra.apiUrl from app.config.ts — variant-driven default (prod / dev).
//   3. Hardcoded prod fallback for safety.
type Variant = 'dev' | 'prod';

type Extra = {
  variant?: Variant;
  apiUrl?: string;
  appBaseUrl?: string;
  googleIosClientId?: string;
  googleWebClientId?: string;
  // T472 (Sprint 70) — Memory Map.
  mapboxToken?: string;
  mapboxStyleUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
  variant: extra.variant ?? 'prod',
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ??
    extra.apiUrl ??
    'https://api.memoura.app',
  appBaseUrl:
    process.env.EXPO_PUBLIC_APP_BASE_URL ??
    extra.appBaseUrl ??
    'https://memoura.app',
  googleIosClientId: extra.googleIosClientId ?? '',
  googleWebClientId: extra.googleWebClientId ?? '',
  // T472 — Memory Map. Token must be non-empty before MapScreen mount; the
  // ViewModel renders an "operator needs to set MAPBOX_ACCESS_TOKEN" dev
  // fallback when blank, so prod builds without the token still boot rather
  // than crash. Style URL defaults to mapbox standard outdoors-v12 until
  // Boss/designer ships the custom "memoura-paper" Studio URL (PO verdict
  // Q1=A 2026-05-16).
  mapboxToken: extra.mapboxToken ?? '',
  mapboxStyleUrl: extra.mapboxStyleUrl ?? 'mapbox://styles/mapbox/outdoors-v12',
  isDev: __DEV__,
};
