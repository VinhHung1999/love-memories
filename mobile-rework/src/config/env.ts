import Constants from 'expo-constants';

type Extra = {
  apiUrl?: string;
  appBaseUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ??
    extra.apiUrl ??
    'https://love-scrum-api.hungphu.work',
  appBaseUrl:
    process.env.EXPO_PUBLIC_APP_BASE_URL ??
    extra.appBaseUrl ??
    'https://memoura.app',
  isDev: __DEV__,
};
