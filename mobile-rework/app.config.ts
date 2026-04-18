import type { ExpoConfig } from 'expo/config';

// APP_VARIANT controls bundle IDs + display name so dev and prod builds
// can live side-by-side on one device.
const IS_DEV = process.env.APP_VARIANT === 'development';

const bundleId = IS_DEV ? 'com.hungphu.memoura.dev' : 'com.hungphu.memoura';
const name = IS_DEV ? 'Memoura Dev' : 'Memoura';
const scheme = IS_DEV ? 'memoura-dev' : 'memoura';

const config: ExpoConfig = {
  name,
  slug: 'memoura',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: bundleId,
    buildNumber: '1',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: bundleId,
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#FFFFFF',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-localization',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FFFFFF',
        dark: { backgroundColor: '#0B0B0F' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    appVariant: process.env.APP_VARIANT ?? 'production',
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    appBaseUrl: process.env.EXPO_PUBLIC_APP_BASE_URL,
    eas: {
      projectId: '',
    },
  },
};

export default config;
