import type { ExpoConfig } from 'expo/config';

// Sprint 67 T448 / T449 — Dual flavor (prod / dev) for the internal app store.
// Boss directive 2026-04-27: prod points at api.memoura.app; dev (`com.hungphu.
// memoura.dev`, "Memoura Dev") points at dev-api.memoura.app for safe testing
// of unreleased BE changes side-by-side. Same icon for both — only the display
// name distinguishes (Boss confirm 2026-04-27, Q2). Internal app store
// (app-store.hungphu.work) doesn't need ASC registration; only the ad-hoc
// provisioning profile for the .dev bundle ID has to exist in Apple Developer
// Portal — Boss confirmed it does (2026-04-27, Q1).
//
// Variant resolution (in priority order):
//   1. APP_VARIANT='dev' or APP_VARIANT='prod' → forced.
//   2. fallback → 'prod' (per T448 acceptance: "Default (no flavor flag) =
//      prod = https://api.memoura.app"). This means any release build /
//      prebuild without an explicit flag points at prod — safe for accidental
//      releases, the operator must opt INTO dev.
//
// Local dev convenience: `npm run ios` / `npm run android` / `npm start` all
// pass `APP_VARIANT=dev` to expo start so Metro points at dev-api by default
// without the developer having to remember. Override on the shell to test a
// prod-pointing local build (`APP_VARIANT=prod npm run ios`).
//
// Local LAN override: set `EXPO_PUBLIC_API_URL=http://192.168.x.x:5006` in
// the shell before `npm run ios` to point Metro at a LAN backend. The env.ts
// precedence honours that override above the variant default — but the var
// must NOT be pinned in committed `.env`, otherwise prod builds bake in the
// wrong host.

type Variant = 'dev' | 'prod';

function resolveVariant(): Variant {
  const explicit = process.env.APP_VARIANT;
  if (explicit === 'dev') return 'dev';
  if (explicit === 'prod') return 'prod';
  return 'prod';
}

const variant: Variant = resolveVariant();

type VariantConfig = {
  name: string;
  bundleId: string;
  scheme: string;
  apiUrl: string;
  appBaseUrl: string;
  associatedDomains: string[];
};

const VARIANT_CONFIG: Record<Variant, VariantConfig> = {
  prod: {
    name: 'Memoura',
    bundleId: 'com.hungphu.memoura',
    scheme: 'memoura',
    apiUrl: 'https://api.memoura.app',
    appBaseUrl: 'https://memoura.app',
    associatedDomains: ['applinks:memoura.app'],
  },
  dev: {
    name: 'Memoura Dev',
    bundleId: 'com.hungphu.memoura.dev',
    scheme: 'memouradev',
    apiUrl: 'https://dev-api.memoura.app',
    appBaseUrl: 'https://dev.memoura.app',
    associatedDomains: ['applinks:dev.memoura.app'],
  },
};

const cfg = VARIANT_CONFIG[variant];

const config: ExpoConfig = {
  name: cfg.name,
  slug: 'memoura',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: cfg.scheme,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: cfg.bundleId,
    buildNumber: '1',
    usesAppleSignIn: true,
    // T289 — Universal Link for /join/<code>. AASA file served at
    // https://memoura.app/.well-known/apple-app-site-association by the web
    // surface. Cold-start handling: Expo Router parses the inbound URL via
    // Linking and pair-join.tsx reads `code` from the route params.
    // T304 — dev.memoura.app added so dev-pointing builds can verify the
    // Universal Link → pair-join flow without rebuilding for prod hostname.
    // T448 (Sprint 67) — split per flavor so each binary only opens links for
    // its own host: prod = applinks:memoura.app, dev = applinks:dev.memoura.app.
    associatedDomains: cfg.associatedDomains,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: cfg.bundleId,
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
      'expo-media-library',
      {
        // T406 — Download from photo lightbox saves the current photo to the
        // iOS Photos app. Read permission reuses the existing photo-picker
        // copy; add-only permission gets its own prompt the first time the
        // user taps Download.
        photosPermission:
          'Memoura cần quyền truy cập ảnh để em chọn ảnh khi thêm khoảnh khắc.',
        savePhotosPermission: 'Memoura cần quyền lưu ảnh để tải khoảnh khắc về máy em.',
        isAccessMediaLocationEnabled: false,
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
    [
      'expo-location',
      {
        // T399 — used by the moment compose location picker only. Foreground-
        // only (when-in-use) is sufficient; we never background-track, never
        // store lat/lng (place name only per Sprint 63 spec).
        locationWhenInUsePermission:
          'Memoura cần vị trí khi em muốn tự động điền địa điểm cho khoảnh khắc.',
        isIosBackgroundLocationEnabled: false,
        isAndroidBackgroundLocationEnabled: false,
      },
    ],
    'expo-apple-authentication',
    [
      'expo-audio',
      {
        // T422 (Sprint 65) — Letter Read overlay plays back voice memos
        // attached to letters. Recording permission is wired here too so
        // T423 Letter Compose's voice-memo recorder doesn't need a second
        // plugin entry. Foreground-only; no background audio.
        microphonePermission:
          'Memoura cần quyền micro để em ghi âm giọng nói cho lá thư.',
      },
    ],
    [
      '@react-native-google-signin/google-signin',
      {
        // REVERSED iOS OAuth client ID — must match the Google Cloud iOS client
        // for bundle `com.hungphu.memoura`. Backend audience array must include
        // both this iOS client and the web client below.
        // T448 (Sprint 67): same iOS client ID is reused across both flavors.
        // The dev bundle (`com.hungphu.memoura.dev`) needs its own Google
        // Cloud iOS OAuth client registered before Google Sign-In works
        // there — tracked under T449 follow-up; until then dev build's
        // Google login will fail with "Audience is not a valid client ID".
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
    // T448 (Sprint 67): variant-driven config. env.ts reads these values via
    // expo-constants. Local override possible via shell EXPO_PUBLIC_API_URL.
    variant,
    apiUrl: cfg.apiUrl,
    appBaseUrl: cfg.appBaseUrl,
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
