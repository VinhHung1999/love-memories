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
    usesAppleSignIn: true,
    // T289 — Universal Link for /join/<code>. The matching AASA file is served
    // at https://memoura.app/.well-known/apple-app-site-association by the web
    // surface. Cold-start handling: Expo Router parses the inbound URL via
    // Linking and pair-join.tsx reads `code` from the route params.
    associatedDomains: ['applinks:memoura.app'],
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
    [
      'expo-notifications',
      {
        // T286 — native APNS perm prompt + foreground-presentation defaults.
        // Tint colour matches brand primary so iOS uses it for the notification
        // accent. APNS prompt copy is provided by the OS itself.
        color: '#E8788A',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'Memoura cần quyền truy cập ảnh để em chọn ảnh khi thêm khoảnh khắc.',
        cameraPermission: 'Memoura cần quyền camera khi em chụp khoảnh khắc.',
      },
    ],
    [
      'expo-camera',
      {
        // T289 — used by pair-join "Scan their QR code" to read the partner's
        // QR (8-hex code or https://memoura.app/join/<code> URL). Only granted
        // permissions interaction is the OS prompt on first scan tap.
        cameraPermission: 'Memoura cần camera để em quét mã QR của người ấy.',
        recordAudioAndroid: false,
      },
    ],
    'expo-apple-authentication',
    [
      '@react-native-google-signin/google-signin',
      {
        // REVERSED iOS OAuth client ID — must match the Google Cloud iOS client
        // for bundle `com.hungphu.memoura`. Backend audience array must include
        // both this iOS client and the web client below.
        iosUrlScheme:
          'com.googleusercontent.apps.1066031301719-mll9pttl9b3pucs1fgu88mojievri330',
      },
    ],
    // Custom plugin — injects `GIDSignIn.sharedInstance.handle(url)` into the
    // Swift AppDelegate. RN 0.77+ no longer auto-swizzles URL handlers, and the
    // google-signin plugin above only writes Info.plist. Must run AFTER
    // google-signin so the AppDelegate already exists when we patch it.
    './plugins/withGoogleSigninUrlHandler',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    appBaseUrl: process.env.EXPO_PUBLIC_APP_BASE_URL,
    googleIosClientId:
      '1066031301719-mll9pttl9b3pucs1fgu88mojievri330.apps.googleusercontent.com',
    googleWebClientId:
      '1066031301719-jmep5e8c5hksosc9j47668at4urpln4c.apps.googleusercontent.com',
    eas: {
      projectId: '',
    },
  },
};

export default config;
