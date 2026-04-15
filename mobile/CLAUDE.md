# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
npm run start        # Metro bundler only (no simulator)
npm run lint         # tsc --noEmit + ESLint (run before every commit)
npm test             # Jest
npx jest path/to/file.test.ts  # Run single test file
cd ios && pod install          # After adding native dependencies

# TestFlight builds
cd ios && ./build-testflight.sh dev     # Dev only
cd ios && ./build-testflight.sh prod    # Prod only
cd ios && ./build-testflight.sh all     # Both (default)
cd ios && ./build-testflight.sh dev --skip-upload  # Archive only
```

## Environment Setup

Config loaded via `react-native-config` from `.env.dev` (debug) or `.env.prod` (release). Copy `.env.example` → `.env.dev` and `.env.prod` and fill in real values. Typed access via `src/config/env.ts` — never read `Config.*` directly, always import from there.

| Key | Purpose |
|-----|---------|
| `API_URL` | Backend base URL (no trailing slash) |
| `APP_BASE_URL` | Web app URL — universal links, share messages |
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `REVENUECAT_API_KEY` | Subscription purchases |
| `MAPBOX_ACCESS_TOKEN` | Map rendering |
| `FIREBASE_PROJECT_ID` | Push notifications |

## Architecture

### MVVM Pattern (mandatory)

Every screen = one folder under `src/screens/` containing:
- `XxxScreen.tsx` — View: renders UI only via `className`, zero logic
- `useXxxViewModel.ts` — ViewModel: all state, API calls, side effects

Never put business logic in the Screen component.

### Navigation Structure

```
NavigationContainer (dark/light theme via useColorScheme)
└── BottomSheetModalProvider
    ├── AuthNavigator → LoginScreen
    ├── OnboardingNavigator → OnboardingCouple → Anniversary → Invite → Celebration → Avatar
    └── AppNavigator (AppStackParamList)
        ├── MainTabs (CurvedTabBar — SVG notch + floating camera button)
        │   ├── Dashboard → DashboardHome, DailyQuestions
        │   ├── MomentsTab → MomentsList, MomentDetail, PhotoGallery
        │   ├── CameraTab (no screen — CurvedTabBar handles the floating button)
        │   ├── LettersTab → LettersList, LetterRead
        │   └── ProfileTab → ProfileMain
        ├── NotificationsTab (full-screen, no tab bar)
        ├── Paywall (fullScreenModal, slide_from_bottom)
        ├── ShareViewer
        └── JoinCouple
```

**MVP-HIDDEN screens** (commented out, v1.1): RecipesTab, ExpensesTab, DatePlannerTab, FoodSpotsTab, MapTab, Achievements, MonthlyRecap.

**`headerShown: false` on ALL navigators** — always.

**Modal routes pattern**: Each stack has `BottomSheet` and `Alert` screens using `containedTransparentModal`. Use `useAppNavigation()` (not raw `useNavigation`) — it adds `.showBottomSheet()` and `.showAlert()` convenience methods.

### Auth Flow

`AuthContext` (`src/lib/auth.tsx`) manages auth state. Navigation switches on `isAuthenticated` + `user?.coupleId`:
- No auth → AuthNavigator
- Auth but no couple → OnboardingNavigator
- Auth + couple → AppNavigator

`apiFetch()` in `src/lib/api.ts` auto-refreshes tokens on 401 using a mutex (no concurrent refresh races). Tokens stored in iOS Keychain / Android Keystore via `react-native-keychain` under service `"memoura"`.

**Auth methods in `auth.tsx`:**
- `login(email, password)` — email/password
- `loginWithGoogle(idToken)` — Google OAuth, `needsCouple` → onboarding
- `loginWithApple(idToken, nameHint?)` — Apple Sign-In (iOS only), `needsCouple` → onboarding
- `beginEmailOnboarding` / `beginGoogleOnboarding` / `beginAppleOnboarding` — register without setting user; caller calls `completeOnboarding(user)` after extra setup

**Apple Sign-In (Sprint 58 — [271]):**
- Package: `@invertase/react-native-apple-authentication` v2+
- iOS only (`Platform.OS === 'ios'` guard in LoginScreen)
- **HIG strict**: Use `AppleButton` component from library (NOT custom). `buttonType: SIGN_IN`, placed ABOVE Google button.
- Entitlement: `com.apple.developer.applesignin = ["Default"]` in `LoveScrum.entitlements`
- Apple only sends `email` + `fullName` on FIRST sign-in — pass as `nameHint` to backend
- Cancel code `1001` is silent (user dismissed sheet)

### Theme System

Two sources of truth that must stay in sync:

1. **`src/navigation/theme.ts`** — `AppTheme` + `DarkAppTheme`. Import `useAppColors()` for runtime color access. Used in `style` props and anywhere className can't be used (Animated transforms, gorhom API, etc.).
2. **`tailwind.config.js`** — Same color tokens for `className` usage in NativeWind. Dark mode via `dark:` prefix with `darkMode: 'class'`.

Font family: **Be Vietnam Pro** (all weights). Configured in both files. Access via `font-heading`, `font-body`, `font-bodyMedium` etc. in className or `AppTheme.fonts.*` in style props.

Dark mode colors use `dark:bg-darkBgCard`, `dark:text-darkTextDark` etc.

### Styling Rules

- **NativeWind only** — `className` for everything. ZERO `StyleSheet.create()`, ZERO `style` prop.
- Only exception: `Animated.Value` transforms/opacity (technically impossible as className), and gorhom BottomSheet API requirements.
- `contentContainerStyle` on ScrollView → wrap content in `<View className="min-h-full ...">` instead.
- Shadows → use `shadow-sm` / `shadow-lg` className.

### Key Components

| Component | Purpose |
|-----------|---------|
| `AppBottomSheet` | Shared bottom sheet wrapper (forwardRef to `BottomSheetModal`). Props: `scrollable`, `snapPoints`, `onSave`/`onDismiss`, sticky footer button. Always use this, never raw `BottomSheetModal`. |
| `CurvedTabBar` | Custom tab bar with SVG notch cutout and floating camera FAB. |
| `DetailScreenLayout` | Standard detail screen layout with back button, scroll content. |
| `ScreenHeader` | Header with title + optional right action icon. |
| `AlertModal` | Replaces `Alert.alert()` — navigate to `Alert` route via `useAppNavigation().showAlert()`. |
| `Typography` | `Heading`, `Body`, `Label` — typed text components with theme colors. |
| `SpringPressable` | Pressable with spring scale animation via Reanimated. |
| `UploadProgressFloat` | Floating upload progress indicator (global, always rendered). |
| `LetterOverlay` | Global love letter overlay (rendered in NavigationContainer). |

### Upload Pattern

**Never block UI with `await` for file uploads.** Use the upload queue pattern — enqueue upload, update optimistically, show progress via `UploadProgressFloat`.

### Subscription / Paywall

`SubscriptionContext` + `useSubscription()` hook. Free tier limits enforced both client-side and via API 403 responses (`FREE_LIMIT_REACHED`, `PREMIUM_REQUIRED`). Navigate to Paywall with trigger reason: `'limit' | 'locked_module' | 'browse'`.

### i18n

All user-facing strings in `src/locales/en.ts`. Use `useTranslation()` hook. Interpolation uses `{{variableName}}` (double braces — single braces render literally).

### Push Notifications

`src/lib/pushNotifications.ts` — FCM via `@react-native-firebase/messaging`. Token registered on login, unregistered on logout. `usePushNotifications()` called inside `AppNavigator`.

## Known Gotchas

- **`BottomSheetTextInput` required** — Inside `@gorhom/bottom-sheet`, use `BottomSheetTextInput` (or `Input` with `bottomSheet` prop) instead of plain `TextInput`. Plain `TextInput` won't trigger keyboard avoiding inside bottom sheets.
- **`@rnmapbox/maps` + Reanimated v4** — Set `animated={false}` on `<UserLocation>` — the `animated` prop triggers `Animated.Value.addListener()` which conflicts with Reanimated v4.
- **`BottomSheetModal` on iOS requires `FullWindowOverlay`** — `AppBottomSheet.tsx` uses `containerComponent` with `FullWindowOverlay` from `react-native-screens` (iOS only) to prevent `transparentModal` native screen from intercepting touches.
- **`useAppColors()` + Reanimated worklets** — Capture `useAppColors()` values in component scope before `useAnimatedStyle`. Never call hooks inside worklets.
- **Deep links** — Prefixes: `https://memoura.app`, `https://dev.memoura.app`, `lovescrum://`. Invite codes use `setPendingInviteCode()` to persist across navigation state loading.
- **`react-native-config` values** — Never use `Config.*` directly; always go through `src/config/env.ts`.

## Project Memory

Project memories are stored in `.claude/memory/`. Use `--project-recall` before complex tasks, `--project-store` after meaningful work.

| Topic | Content |
|-------|---------|
| [bugs-and-lessons](.claude/memory/bugs-and-lessons/README.md) | RN crashes, gotchas, non-obvious fixes |
| [design-decisions](.claude/memory/design-decisions/README.md) | UI/UX decisions, color palette, component patterns |
| [architecture](.claude/memory/architecture/README.md) | Navigation structure, module boundaries, key patterns |
