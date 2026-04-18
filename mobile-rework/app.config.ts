import type { ExpoConfig } from 'expo/config';

// Single flavor — bundle ID matches mobile/ so smoke builds upload as a new
// build of the existing App Store Connect app `com.hungphu.memoura`.
// Version bumped to 2.0.0 so Boss can distinguish the rework (2.0.0 build 1)
// from the old mobile/ track (1.0 build 40 at time of fork).
const bundleId = 'com.hungphu.memoura';
const name = 'Memoura';
const scheme = 'memoura';

const config: ExpoConfig = {
  name,
  slug: 'memoura',
  version: '2.0.0',
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
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    appBaseUrl: process.env.EXPO_PUBLIC_APP_BASE_URL,
    eas: {
      projectId: '',
    },
  },
};

export default config;
