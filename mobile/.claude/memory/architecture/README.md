# Architecture

System structure, module boundaries, and key patterns. Read this before major refactoring or adding new modules.

## System Overview

React Native 0.84 mobile app (iOS + Android). Connects to the shared Memoura backend API. No local database — all data from API via React Query cache.

Auth state drives root navigation: unauthenticated → AuthStack, authenticated without couple → OnboardingStack, authenticated with couple → AppStack.

## Module Boundaries

### `src/config/env.ts` — Environment Config
- Purpose: Typed access to `react-native-config` values
- Rule: NEVER import from `react-native-config` directly — always go through this file
- Values: `API_URL`, `APP_BASE_URL`, `GOOGLE_CLIENT_ID`, `REVENUECAT_API_KEY`, `MAPBOX_ACCESS_TOKEN`

### `src/lib/api.ts` — API Client
- Purpose: All HTTP calls to backend; token storage; auto-refresh on 401
- Exports: `apiFetch()`, `storeTokens()`, `getStoredTokens()`, `clearStoredTokens()`, `setOnUnauthenticated()`
- Token refresh uses mutex to prevent concurrent races
- Tokens stored in iOS Keychain / Android Keystore via `react-native-keychain` (service: `"memoura"`)

### `src/lib/auth.tsx` — Auth Context
- Purpose: `AuthContext` + `AuthProvider` — global auth state
- Exports: `useAuth()` hook with `user`, `isAuthenticated`, `isLoading`, `login`, `logout`, etc.
- Special onboarding flow: `beginEmailOnboarding()` / `beginGoogleOnboarding()` register user but don't set auth state — caller does extra setup then calls `completeOnboarding()`

### `src/navigation/` — Navigation + Theme
- `index.tsx` — all navigators, param list types, deep linking config
- `theme.ts` — `AppTheme` + `DarkAppTheme` + `useAppColors()` hook
- `useAppNavigation.ts` — wraps `useNavigation()` + adds `showBottomSheet()` / `showAlert()`

### `src/screens/` — MVVM Screens
- Each screen = folder with `XxxScreen.tsx` (View) + `useXxxViewModel.ts` (ViewModel)
- Screen renders UI only via `className`; ViewModel has all state/API/logic
- New screens MUST follow this pattern

### `src/components/` — Shared Components
- `AppBottomSheet` — all bottom sheets; forwardRef to `BottomSheetModal`
- `CurvedTabBar` — custom tab bar with SVG notch
- `Typography` — `Heading`, `Body`, `Label` text components
- `DetailScreenLayout` — standard detail page layout
- `LetterOverlay` — global love letter overlay, rendered at NavigationContainer level
- `UploadProgressFloat` — global upload progress, rendered at NavigationContainer level

## Key Patterns

### Modal Routes Pattern
Every stack navigator includes `BottomSheet` and `Alert` as navigation screens (not true modals). Uses `containedTransparentModal` presentation. Access via `useAppNavigation().showBottomSheet()` and `.showAlert()`. This enables full navigation stack awareness for modals.

### MVP-HIDDEN Screens (v1.1)
Several full-screen stacks are commented out in `AppNavigator`: RecipesTab, ExpensesTab, DatePlannerTab, FoodSpotsTab, MapTab, Achievements, MonthlyRecap. They exist as screen components but are not in the live navigation tree.

### Deep Linking
Prefixes: `https://memoura.app`, `https://dev.memoura.app`, `lovescrum://`
- `/share/:token` → ShareViewer screen
- `/invite/:code` → JoinCouple screen (invite code cached via `setPendingInviteCode()` before auth state loads)

### Upload Queue
File uploads never block UI. Background queue with progress tracked via `UploadProgressFloat`. Pattern used for all media: moments, letters, profile avatar.

### Subscription Gate
`SubscriptionContext` + `useSubscription()`. Free tier limits checked both client-side and via API 403 (`FREE_LIMIT_REACHED`, `PREMIUM_REQUIRED`). Paywall accessible as `AppStack.Screen` with `slide_from_bottom` modal presentation.

## Cross-Cutting Concerns

### i18n
All user-facing strings in `src/locales/en.ts`. `useTranslation()` hook. Double-brace interpolation: `{{variableName}}`.

### Dark Mode
System color scheme only (`useColorScheme()`). Theme switches in `RootNavigator` — passes `AppTheme` or `DarkAppTheme` to `NavigationContainer`. Components use `dark:` prefix NativeWind classes for dark-specific styles.

### Push Notifications
FCM via `@react-native-firebase/messaging`. `usePushNotifications()` called in `AppNavigator` (only when authenticated). Token registered on login, unregistered on logout.
