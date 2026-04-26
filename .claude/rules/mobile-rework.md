---
paths:
  - "mobile-rework/**/*"
---

# mobile-rework — Expo SDK 54 + NativeWind v4 (Memoura)

Active mobile surface. **Does NOT inherit code from `../mobile/`.** Reference prototype
is the SOURCE OF TRUTH for UI: `docs/design/prototype/memoura-v2/`. Always cross-check
prototype before coding a screen.

## Stack

- Expo SDK 54, RN 0.81.5, React 19.1 — bare workflow (`expo prebuild` regenerates `ios/`)
- Expo Router 6 (file-based, `app/`)
- NativeWind v4 + Tailwind 3.4
- Reanimated v4 + Worklets 0.5
- Zustand + AsyncStorage
- react-i18next + expo-localization
- @gorhom/bottom-sheet v5
- expo-audio v1.1.x — recorder only (Sprint 65 D62)
- react-native-audio-recorder-player v4.5 + react-native-nitro-modules — playback only (Sprint 65 D62 swap from expo-audio because expo-audio HTTPS streaming on iOS unreliable for remote CDN URLs)
- expo-notifications — push permissions + listeners (Sprint 65 D69-D80)

## Hard rules (Boss-enforced, non-negotiable)

1. **MVVM.** Screen = `XxxScreen.tsx` (view only) + `useXxxViewModel.ts` (logic,
   state, API). Co-locate in `src/screens/Xxx/`.
2. **NativeWind only — ZERO `style` prop.** No `StyleSheet.create()`. All styling via
   `className`. **Carve-outs (narrow, documented):**
   - `Animated.Value` transforms/opacity — technically impossible as className.
   - `expo-blur` `<BlurView>` — native props (`intensity`, `tint`) aren't class-able.
     Combined with `rounded-full` clipping, the blur needs an inline
     `style={{ borderRadius: 9999, overflow: 'hidden' }}` so the frost stays inside
     the pill shape; the rest of the styling stays on `className`. PillTabBar
     shipped this pattern in T360 then reverted to solid `bg-bg-elev` +
     `shadow-pill` in T361 (Boss preferred solid + soft shadow over frost).
     Keep the carve-out documented for future surfaces that need glass.
   - `@gorhom/bottom-sheet` — `backgroundStyle` / `handleIndicatorStyle` only accept
     style objects, not className. Keep them minimal (background color + handle
     color from `useAppColors()`).
   - **Conditional styling — `style` prop, never ternary in `className`.** Any value
     that flips at runtime (bg color, shadow, text color, visibility) goes on
     `style` resolved via `useAppColors()`. Keep `className` a SINGLE STATIC STRING
     for layout/typography only. Toggling classes — especially interactive
     modifiers (`active:`, `focus:`, `hover:`, `disabled:`) — across ternary
     branches crashes NativeWind v4 at re-render with a MISLEADING error
     `[Error: Couldn't find a navigation context. Have you wrapped your app with
     'NavigationContainer'?]` that points at React Navigation but has nothing to
     do with it. Burned AuthBigBtn Login flow, Sprint 61 2026-04-21. See
     `.claude/memory/bugs-and-lessons/nativewind-conditional-className-crash.md`.
     Right shape:
     ```tsx
     const c = useAppColors();
     const style = isDisabled ? { backgroundColor: c.surface } : { backgroundColor: c.ink };
     <Pressable className="rounded-full py-4 px-5 active:opacity-90" style={style} />
     ```
   Shadows → `shadow-sm`/`shadow-lg`. `contentContainerStyle` → wrap children in
   `<View className="min-h-full ...">`.
3. **Theme via `useAppColors()`.** No hardcoded hex outside `src/theme/tokens.ts`.
   The ONE exception: `ThemeProvider.tsx` uses `style={themeVars}` on the root
   `<View>` to declare NativeWind `vars()` — this is the theme-application surface
   itself.
4. **i18n double-brace interpolation — `{{n}}`, never `{n}`.** All strings in
   `src/locales/{vi,en}.ts`. Default lang `vi` (Boss-locked).
5. **Fonts via Tailwind class** — `font-body`, `font-display`, `font-displayItalic`,
   `font-script`. Dancing Script scope: **Letters screen** + **Dashboard Timer Hero
   accents** (timerLabel row + anniversary countdown footer, per prototype
   `dashboard.jsx` L266 + L333 — Sprint 64 T415 carve-out).
6. **Prototype > memory rules > DEV judgment.** Always cross-check
   `docs/design/prototype/memoura-v2/`. Ask PO before deviating.
7. **Mobile UI does NOT follow web.** Mobile has its own design language — same data
   + API, UI redesigned for native feel.
8. **DEV invokes `frontend-design` skill** for every new screen/component UI.

## Theme system (NativeWind v4 vars pattern)

```
src/theme/tokens.ts      — PALETTES, TYPE_SYSTEMS, DENSITIES (ported from prototype)
src/theme/cssVars.ts     — paletteToCssVars(): Palette → { --color-bg: "r g b", ... }
src/theme/ThemeProvider  — <View style={vars(themeVars)}>{children}</View>
src/theme/fonts.ts       — fontMap for useFonts() — keys match tailwind fontFamily 1:1
tailwind.config.js       — colors: themed('--color-X') → rgb(var(--color-X) / <alpha-value>)
```

Consume via className only: `bg-bg`, `text-ink`, `bg-primary`, `border-line`.
Alpha: `bg-primary/20`, not hardcoded rgba.

### Locked defaults

| Setting       | Default               |
| ------------- | --------------------- |
| Palette       | Evolve light (`#C23B4E`) — flipped from Brand in Sprint 60 (T291) |
| Mode          | system                |
| Type system   | serif (Fraunces + Be Vietnam Pro) |
| Density       | airy                  |
| Language      | vi                    |

Theme hooks: `useAppColors()`, `useTypeSystem()`, `useDensity()`, `useAppMode()`,
`useThemeControls()`. Persistence key `@memoura/theme/v1`.

## Directory map

```
app/                   — Expo Router screens (file = route)
  _layout.tsx          — root Stack + ThemeProvider + SafeAreaProvider + GHRootView
  (auth)/              — welcome, intro, signup, login, forgot-password,
                         pair-create, pair-join, personalize, permissions
  (tabs)/              — index, moments, letters, profile
  (modal)/             — camera-sheet, letter-read, moment-detail, monthly-recap
src/
  theme/               — tokens, ThemeProvider, cssVars, fonts
  components/          — Avatar, Button, Card, Input, SafeScreen, ScreenHeader (+ index.ts barrel)
  stores/              — authStore (zustand + AsyncStorage)
  lib/                 — apiClient.ts (refresh interceptor)
  locales/             — vi.ts, en.ts, i18n.ts
  config/              — env.ts (reads __DEV__ + expo-constants extra)
  screens/             — ViewModels co-located with screen folders
```

## API client

`src/lib/apiClient.ts` — `apiFetch<T>(path, options)` with:
- Auto JWT access-token refresh on 401 via `refreshInFlight` singleton (dedupes
  concurrent 401s into one refresh call).
- `skipAuth` option for public endpoints.
- Checks `res.status` BEFORE `res.json()` — plain-text 429/5xx responses don't
  crash parsing.
- Pulls tokens from `useAuthStore.getState()` — store at
  `src/stores/authStore.ts`, key `@memoura/auth/v1`.

Convenience methods: `apiClient.get/post/put/del`. Use the client — never raw
`fetch()` for authed requests.

## Environment

Single flavor — bundle ID `com.hungphu.memoura`, scheme `memoura`, name
`Memoura`, version `2.0.0`. Shares the App Store Connect app with `mobile/`'s
track (1.0 build 40 history). Version 2.0.0+ distinguishes rework builds on
TestFlight.

Dev flavor (`.dev` bundle) was intentionally dropped in Sprint 59 to avoid
registering a second ASC app.

### API URLs

| Env  | URL                           |
| ---- | ----------------------------- |
| dev  | `https://dev-api.memoura.app` |
| prod | `https://api.memoura.app`     |

Dev vs prod is detected via `__DEV__` in `src/config/env.ts`, not an env var.
`EXPO_PUBLIC_API_URL` in `.env` overrides; defaults to prod.

## iOS signing

- Team ID: `DHGY59PZWW` (NOT `V34473UPSP`)
- CSR for Apple Distribution cert must be **RSA 2048, not EC** — Apple rejects EC.
- Build via local `xcodebuild` (no EAS). `ios/build-testflight.sh` drives the archive
  + export + upload.
- `expo prebuild --clean` WIPES `ios/` — `DEVELOPMENT_TEAM` + `CODE_SIGN_STYLE` are
  injected into the xcodebuild command (not baked into pbxproj) so prebuild is safe.
- `exportArchive` requires an Apple ID logged into Xcode (API key alone is
  insufficient).
- `ExportOptions.plist` `teamID` must match Team ID exactly. Changes to signing
  config need Boss approval.
- `REACT_NATIVE_PRODUCTION=1` in Podfile crashes iOS 26 / Xcode 26 in
  SafeAreaProvider — **do NOT add this flag globally**.
- TestFlight daily upload limit ~10/bundle — batch fixes before rebuilding.
- **App icon stale trap.** `assets/images/icon.png` is the Expo source; the actual
  native asset is `ios/Memoura/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`.
  Changing the Expo source does NOT auto-update the native asset — that only happens
  via `expo prebuild`. Our `build-testflight.sh` / `deploy-appstore.sh` skip prebuild
  (to preserve Mapbox xcconfig + signing config), so after updating the icon source:
  **manually `cp assets/images/icon.png ios/.../AppIcon.appiconset/App-Icon-1024x1024@1x.png`**
  and MD5-verify before building. Sprint 61 Build 30 shipped with stale icon because
  this step was missed (T359 fix 2026-04-20). iOS 14+ uses single-size 1024 source
  and scales at runtime — no per-size PNGs needed.

### Internal ad-hoc distribution

`deploy-appstore.sh` builds ad-hoc IPA and uploads to `app-store.hungphu.work`.
ExportOptions `method=ad-hoc`, provisioning profile must include target UDIDs.

**Auto-bumps the build number** via `agvtool new-version -all "$((CURRENT+1))"`
before archiving. **Do NOT manually `agvtool next-version` before calling this
script** — your manual bump + script's auto-bump = net +2 (e.g. 30 → 31 → 32)
and a skipped TF build slot. Just call the script; it handles the bump. Sprint
61 Build 31 shipped as 32 because of this overlap (2026-04-20).

## Build / lint / scripts

```bash
npm install
npm run ios            # expo start --ios
npm run android        # expo start --android
npm run lint           # tsc --noEmit && expo lint
npm run prebuild       # regenerate native projects
```

Run `npm run lint` before every commit — catches type errors that bite in Xcode.

**Always `npx expo install <expo-*>`** for Expo-owned native modules. Raw
`npm install expo-foo` pulls the next SDK's version → ABI mismatch + cold-start
crash. Use npm for pure-JS deps (zustand, i18next); use `npx expo install` for
anything with native code.

## New Architecture

`newArchEnabled: true` in `app.config.ts`. If Android stops using Fabric, check
`android/gradle.properties` — `newArchEnabled=true` must be set there too after
every `expo prebuild`. `app.config.ts` alone is insufficient.

## expo-router entry gotcha (Android)

If adding a custom entry, add the polyfill BEFORE `import 'expo-router/entry'`:

```ts
if (typeof document === 'undefined') (global as any).document = undefined;
import 'expo-router/entry';
```

Otherwise `ReferenceError: document is not defined` at module load on Android.

## Push notifications (Sprint 65 — shipped)

End-to-end stack: BE direct APNs via `node-apn` + `.p8` key (Boss provides `AuthKey_<keyId>.p8` deployed at `~/deployments/<env>/memoura-api/AuthKey.p8`, env vars `APNS_KEY_PATH/APNS_KEY_ID/APNS_TEAM_ID/APNS_BUNDLE_ID/APNS_PRODUCTION`). Mobile registers iOS APNs hex token via `Notifications.getDevicePushTokenAsync()` → `POST /api/push/mobile-subscribe`. **APNS_PRODUCTION matches IPA build type, NOT backend env**: ad-hoc / TestFlight / Release IPA → `production: true`; Xcode debug build only → `production: false`. Mismatch returns `BadDeviceToken` 400 silently.

**Token register dedup (Sprint 65 D74)** — `addPushTokenListener` fires with same token immediately after `getDevicePushTokenAsync()` resolves, causing infinite re-register loop without guards. Use module-level `inFlight` boolean + `lastRegisteredToken` in-memory + 60s throttle + listener `next.data === lastRegisteredToken` skip. AsyncStorage cache check alone races and fails to dedup.

**Re-register on Dashboard mount (Sprint 66 push verify)** — iOS regenerates the APNs device token on every fresh install. The OLD token persists in BE `mobile_push_tokens` until APNs returns `BadDeviceToken` and PushService prunes. Symptom: in-app inbox shows the notif (DB save works), no out-app banner. Mitigation: Dashboard ViewModel calls `getDevicePushTokenAsync()` + `POST /api/push/mobile-subscribe` on mount (not first-launch only). BE side `PushService.sendMobilePushNotification` already prunes `BadDeviceToken`/`Unregistered` automatically. Diagnostic: `SELECT createdAt FROM mobile_push_tokens WHERE userId = '...'` — if latest row predates last reinstall, that's the bug; user just needs to open app once.

**Deep-link extraction (Sprint 65 D80)** — On iOS, expo-notifications exposes APNs custom payload at `notification.request.trigger.payload`, NOT `content.data` (which is `null`) and NOT `content.userInfo` (which doesn't exist on JS layer). Extract pattern:
```ts
const link = content.data?.link ?? trigger?.payload?.link;
```
Same for cold-start (`getLastNotificationResponseAsync()`) and warm tap (`addNotificationResponseReceivedListener`). Wrap router.push in `setTimeout(50)` for warm tap, `requestAnimationFrame` for cold start.

**In-app foreground banner** — `Notifications.setNotificationHandler({ shouldShowBanner: true, ... })` shows iOS native banner top when app foreground. Auto-prompt permission on Dashboard mount once via `AsyncStorage` flag `@memoura/push/permPrompted`.

**Diagnostic in release IPA** — `__DEV__ === false` so `console.log` doesn't fire. Use `Alert.alert('label', JSON.stringify({content, trigger, identifier}, null, 2).slice(0, 1500))` to inspect notification structure on a real-device release build when no Mac/Console.app available. Sweep-revert alerts after diagnosis.

## Audio recording + playback (Sprint 65 — shipped)

**Recording (Compose voice memo):** `expo-audio` v1.1.x `useAudioRecorder` + `RecordingPresets.HIGH_QUALITY` + `setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })`. iOS produces `.caf` underlying file; rename to `.m4a` via `FileSystem.copyAsync` before FormData upload (BE multer rejects `.caf` extension). Capture `recState.durationMillis` SYNCHRONOUSLY before `await recorder.stop()` — polled state hook lags and resets on stop.

**Playback (LetterRead inline + Compose preview):** `react-native-audio-recorder-player` v4.5 + `react-native-nitro-modules` peer. `expo-audio` `useAudioPlayer({ uri: httpsUrl })` on iOS fails silently for remote HTTPS audio (`status.isLoaded` never true) — RNARP works directly with raw CDN URL. Use Murmur-style `setInterval(100ms)` polling Date.now() for progress bar — RNARP `addPlayBackListener` may not fire reliably on SDK 54 + nitro.

**Upload (D38 + D52 + D55 carry):** mobile FormData append `audio` file with `name: 'memo.m4a'` + `type: 'audio/mp4'` + APNs hex tokens. iOS RN FormData ignores declared `type` and infers from file extension → `audio/x-m4a` variant for `.m4a`. BE multer whitelist must include `audio/x-m4a` + `audio/x-aac`. Append `duration` field to FormData (BE expects `req.body.duration` parseFloat → letter_audio.duration column). Always prepend `file://` to URI before FormData (RN iOS silently fails on raw paths).

## Drop list (NOT in scope for rework)

FoodSpots, Recipes, Expenses, Achievements, Date Planner, What-to-eat. Don't port
these from `mobile/` unless PO/Boss explicitly asks. (Photobooth IS in scope —
shipped Sprint 64 as standalone route `app/photobooth.tsx` + MVVM folder
`src/screens/Photobooth/`.)

## Photobooth (Sprint 64 — shipped)

Standalone route `app/photobooth.tsx` mounting `PhotoboothScreen` +
`usePhotoboothViewModel`. 4-step flow: **ModeStep** (count picker 2/3/4) →
**CaptureStep** → **EditStep** → **ShareStep**.

Navigation back-reset rule: `←` / `X` at steps 2-4 → `onReset()` returns to
ModeStep (clears capturedPhotos, captions, stickers, shotIndex, resets layout to
grid-4). `X` at ModeStep → exits Photobooth entirely (the only true dismiss).

Polaroid chin (caption + date row): `alignItems: 'baseline'` so DancingScript 14 +
Courier 9 sit on the same baseline, `lineHeight: 20` on the caption so the `♥`
ascender is not clipped, chin height 44 + `justifyContent: 'flex-end'` +
`paddingBottom: 10` so the row leans bottom. Filmstrip layouts skip the date row
entirely (Boss override of prototype).

Sticker drag uses PanResponder with a `latestRef` reassigned per render (cheaper
than recreating PanResponder each render; avoids the stale-closure bug where
drag-2 restarts from drag-1's origin instead of its drop position).

Dashboard Timer Hero (T415) uses Dancing Script font carve-out + a `HeartDot`
whose outer glow is an absolute sibling, not a child consuming flex width — keeps
the heart centered between the two `AvatarPair` portraits.

Haptic shutter feedback via `expo-haptics` (T420).

## AuthorPill — shared component

`src/screens/Moments/components/AuthorPill.tsx` is the one-and-only "By [name]"
badge. Used in `DayHeroCard`, `LatestMomentCard` (Dashboard RecentMoments), and
MomentDetail hero. Theme-aware (`bg-surface/[0.92]`) — **do NOT hardcode
`bg-white`**, otherwise it breaks dark mode (D37 regression). Same lesson applies
to the upload-progress toast: use `text-bg` / `c.bg` icons so it flips against
`bg-ink` in dark mode.

## Photo upload MIME (Sprint 64 D38)

iOS camera defaults to HEIC. `useMomentCreateViewModel` uses a `mimeFromExt()`
helper to map file extension → correct MIME before
`FormData.append('photo', { uri, name, type })`. **Do NOT fall back to
`image/jpeg`** — HEIC uploaded with a JPEG MIME fails on the CDN (format sniff)
and on the BE filter (see `backend.md`). Avatar uploads already consume
`asset.mimeType` from expo-image-picker so they didn't need the mobile change.

## Known bug patterns

- **TextInput height jitter from explicit `text-[size] leading-[N]` (Sprint 66 — RESOLVED 5997131)**:
  iOS RN re-derives the TextInput's content bbox between empty and typed states
  when both font size AND lineHeight are forced via NativeWind classes — 's' (no
  ascender) renders smaller than 'h' (ascender), height grows per keystroke.
  **Fix is one-liner**: drop `text-[15px] leading-[22px]` from the TextInput
  className. Keep `font-bodyMedium text-ink flex-1` only — let the font's
  intrinsic line metric decide. Boss applied to `src/components/AuthField.tsx`
  (Login/Signup) commit `5997131`. **Lesson** — Sprint 66 chased this for 5
  builds (T440-T444) on the wrong component (`Input.tsx` instead of
  `AuthField.tsx`); always grep where the broken screen actually imports from
  before iterating. Auth screens use `AuthField`; bottom-sheet edit forms use
  `Input`/`BottomSheetTextInput`; Daily Q answer field uses `AnswerInput`. The
  same one-liner fix applies if any of these regress: drop forced text-size +
  lineHeight on the TextInput when typing causes the row to breathe.
- **NativeWind v4 conditional `className` → "Couldn't find a navigation context"**:
  the most misleading error in this project. Toggling classes across ternary
  branches of a `className` template literal (especially interactive modifiers
  like `active:opacity-90`) crashes at re-render with a React-Navigation-shaped
  error that has NOTHING to do with nav — stack bottoms out at
  `CssInterop.Pressable` with no nav hooks in the tree. Fix: every conditional
  value on `style` prop via `useAppColors()`; `className` stays a single static
  string. See Hard Rule #2's conditional-styling carve-out and
  `.claude/memory/bugs-and-lessons/nativewind-conditional-className-crash.md`.
- **BottomSheet + keyboard**: inside `@gorhom/bottom-sheet` use `BottomSheetTextInput`
  or `Input` with `bottomSheet` prop — RN `TextInput` doesn't trigger keyboard avoid.
- **BottomSheetModal on fullScreenModal iOS**: touches blocked by `transparentModal`
  native screen container. Fix: `containerComponent={FullWindowOverlay}` from
  `react-native-screens` (iOS only).
- **Reanimated v4 worklet colors**: capture `useAppColors()` values OUTSIDE
  `useAnimatedStyle` — never call the hook inside a worklet.
- **Mapbox + Reanimated v4 on iOS 26**: `<UserLocation animated />` triggers
  `Animated.Value.addListener` conflict → crash. Use `animated={false}`.
- **Navigation to tabs** (legacy pattern, applies here too): direct `navigate('Tab')`
  from outside tabs silently fails — go `navigate('MainTabs', { screen: 'Tab' })`.
- **Commit-point nav — use `CommonActions.reset`, not `router.replace`**: on iOS,
  `router.replace` rewrites JS history but leaves the prior screen in the UIKit
  native stack — edge-swipe-right still pops back. For any screen where going back
  would be destructive (invite accepted, couple paired, onboarding done), use
  `useNavigation()` + `navigation.dispatch(CommonActions.reset({ index: 0, routes:
  [{ name: 'destination-file-name' }] }))`. Route `name` is the FILE name
  (`'onboarding-done'`), NOT path-style (`'(auth)/onboarding-done'`). Sprint 60
  T331 (PairJoin→Personalize) + T335 (Permissions/Personalize→OnboardingDone).
- **Nav-workaround debt**: when a transition flips between `router.replace` and
  `router.push` (Sprint 60 T327 creator-Personalize: replace→push), sweep for
  custom `onBack`/`onDismiss` handlers written to compensate for the old behavior.
  They become invisible bugs because they look like intentional "go prev screen"
  code. T332 took a full Build-28 round-trip to catch.
- **Hermes bundle-grep — presence, not count**: Hermes interns string literals
  once into a constant pool. `grep -o | wc -l` always returns 1 per literal
  regardless of call-site count. Don't write verification asserts like `count >= 2`.
  Bundle grep confirms presence; source grep confirms call-site count.
- **LinearGradient padding**: `react-native-linear-gradient` ignores padding/margin.
  Wrap content in inner `<View>`.
- **Mapbox token**: never commit real `pk.*` to Info.plist. Use `$(MAPBOX_ACCESS_TOKEN)`
  placeholder + xcconfig (gitignored).
- **i18n** `react-i18next` needs `{{n}}` double-brace — single braces render literally.
- **TabBarSpacer values (Sprint 61 locked)**: floating `PillTabBar` requires a
  static spacer at the bottom of every tab-scene `ScrollView` / `FlatList` — **120px
  is insufficient on iPhone 15 Pro Max**. Current values: **150px notched / 116px
  flat** (`src/components/TabBarSpacer.tsx`). Reached blind after LẦN 6 (Sprint
  61 T374) because no runtime telemetry — math said 120px cleared the 98px pill
  but device clipped anyway. If the pill layout changes, bump spacer first and
  verify on the actual iPhone 15 Pro Max before lowering.
- **Telemetry-first for device-specific layout bugs**: when a fix depends on
  runtime `useSafeAreaInsets()` + `useBottomTabBarHeight()` + `onLayout` numbers,
  bake an on-device log export path (AsyncStorage → "export log" button) BEFORE
  the 2nd fix attempt. Blind iteration past LẦN 3 = burn Boss trust + TestFlight
  slots. Sprint 61 LẦN 6 lesson.
- **Do NOT serve Metro through a Cloudflare tunnel for dev-client debugging**.
  Every layer of the RN+iOS toolchain fights this path:
  1. `react-native-xcode.sh` runs `ipconfig getifaddr en0` at archive time and
     writes that LAN IP into `Memoura.app/ip.txt` — silently ignoring
     `EXPO_PACKAGER_HOSTNAME` and `REACT_NATIVE_PACKAGER_HOSTNAME`. You have to
     patch `ip.txt` inside the `.xcarchive` between archive + export.
  2. `RCTBundleURLProvider` defaults to port `8081` and scheme `http` — but
     Cloudflare's edge only proxies `:80` and `:443`. `ip.txt` must include the
     port (`metro-dev.example.com:80`), otherwise RN preflights
     `http://host:8081/status`, times out, and crashes with
     `unsanitizedScriptURLString = (null)` / `"No script URL provided"`.
  3. Even with the port fixed, iOS App Transport Security blocks HTTP to non-
     localhost domains in Debug builds by default. `NSAllowsLocalNetworking=true`
     only whitelists `localhost` + RFC1918 LAN ranges — public hostnames need an
     explicit `NSExceptionDomains` entry with `NSExceptionAllowsInsecureHTTPLoads`.
  Prefer a simulator (LAN Metro works directly) or LAN Metro to a physical
  device on the same Wi-Fi. Reserve Cloudflare tunnels for proxying the **API**,
  not the Metro bundler. Sprint 61 lesson (Builds 37+38 dead).

## Sprint convention

DEV commits to `sprint_N` branch — no feature sub-branches. Sprint board in
Obsidian Kanban at brain2 vault (not this repo).
