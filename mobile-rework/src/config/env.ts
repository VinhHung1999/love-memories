import Constants from 'expo-constants';

type Extra = {
  apiUrl?: string;
  appBaseUrl?: string;
  googleIosClientId?: string;
  googleWebClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
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
  isDev: __DEV__,
};
