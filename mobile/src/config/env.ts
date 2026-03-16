/**
 * Typed environment config from react-native-config.
 * Values are loaded from .env.dev (debug builds) or .env.prod (release builds).
 * See react-native-config for iOS scheme / Android flavor setup.
 */
import Config from 'react-native-config';

/** Backend API base URL — no trailing slash */
export const API_URL: string = Config.API_URL ?? (__DEV__
  ? 'https://dev-love-scrum-api.hungphu.work'
  : 'https://love-scrum-api.hungphu.work');

/** App web base URL — used for universal links, share messages, deep links */
export const APP_BASE_URL: string = Config.APP_BASE_URL ?? (__DEV__
  ? 'https://dev-love-scrum.hungphu.work'
  : 'https://love-scrum.hungphu.work');

export const GOOGLE_CLIENT_ID: string = Config.GOOGLE_CLIENT_ID ?? '';

export const REVENUECAT_API_KEY: string = Config.REVENUECAT_API_KEY ?? '';

export const MAPBOX_ACCESS_TOKEN: string = Config.MAPBOX_ACCESS_TOKEN ?? '';

export const FIREBASE_PROJECT_ID: string = Config.FIREBASE_PROJECT_ID ?? '';
