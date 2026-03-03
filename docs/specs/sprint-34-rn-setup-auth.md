# Sprint 34 — React Native Project Setup + Auth

## Goal
Init React Native project in `mobile/` folder with navigation, auth (email/password + Google), register with couple flow, and profile/settings screen.

---

## Tech Decisions

- **Framework:** Bare React Native (NOT Expo)
- **UI:** NativeWind v4 (Tailwind CSS for RN)
- **Navigation:** React Navigation v7 (@react-navigation/native + @react-navigation/native-stack)
- **Data:** @tanstack/react-query (same pattern as web)
- **Auth storage:** react-native-keychain (secure token storage, NOT AsyncStorage)
- **Google Sign-In:** @react-native-google-signin/google-signin
- **HTTP:** fetch (same as web, or axios if needed)

---

## Requirements

### 1. Project Init
- `npx @react-native-community/cli init LoveScrum` inside `mobile/`
- Configure NativeWind v4 (babel, tailwind.config, metro)
- Setup React Navigation (NavigationContainer, stack navigators)
- Setup @tanstack/react-query (QueryClientProvider, same 30s stale time)
- TypeScript strict mode
- Folder structure:
  ```
  mobile/
  ├── src/
  │   ├── screens/          # Screen components
  │   ├── components/       # Shared components
  │   ├── lib/              # API client, auth context, utils
  │   ├── navigation/       # Navigator definitions
  │   └── types/            # TypeScript interfaces
  ├── android/
  ├── ios/
  ├── tailwind.config.js
  └── package.json
  ```

### 2. API Client (`src/lib/api.ts`)
- Base URL configurable via env (dev: `https://dev-love-scrum-api.hungphu.work`, prod: `https://love-scrum-api.hungphu.work`)
- Attach Bearer token from secure storage
- Same pattern as web: functions per domain (authApi, momentsApi, etc.)
- Token refresh logic (same as web — on 401, try refresh, retry request)

### 3. Auth Context (`src/lib/auth.tsx`)
- Same shape as web AuthContext: user, token, isAuthenticated, isLoading
- Store tokens in react-native-keychain (NOT AsyncStorage — secure storage)
- On app start: check keychain for stored token → verify with /api/auth/me
- Functions: login, register, loginWithGoogle, completeGoogleSignup, logout
- Logout clears keychain

### 4. Login Screen
- Logo + app name (same design language as web)
- "Continue with Google" button (native Google Sign-In)
- Divider "or"
- Email + password form
- Toggle login / register
- Register mode: name field + couple selector (create new / join existing) + couple name / invite code
- Google flow: same as web — if needsCouple, show couple setup step
- Error display

### 5. Google Sign-In (Native)
- Use @react-native-google-signin/google-signin
- Configure with same GOOGLE_CLIENT_ID
- Get idToken from Google → send to POST /api/auth/google (same backend endpoint)
- Flow identical to web

### 6. Profile / Settings Screen
- User info: name, email, avatar
- Edit name
- Link Google account (same as web MorePage)
- "Google linked" badge if already linked
- Couple info: couple name, invite code (copy)
- Logout button

### 7. Navigation Structure
- **Auth Stack** (unauthenticated): LoginScreen
- **Main Stack** (authenticated): Dashboard (placeholder), Profile
- AuthContext controls which stack is shown
- Bottom tab navigator placeholder (for future modules)

### 8. Shared Types
- Copy relevant types from `frontend/src/types/index.ts` to `mobile/src/types/`
- Or create shared types package later (out of scope for now, just copy)

---

## Acceptance Criteria
- [ ] `npx react-native run-ios` and `npx react-native run-android` both work
- [ ] NativeWind styling works (className prop on RN components)
- [ ] Login with email/password works against dev API
- [ ] Login with Google works (native Google Sign-In)
- [ ] Register with couple create/join works
- [ ] Google auto-link for existing email works
- [ ] New Google user couple setup flow works
- [ ] Tokens stored securely in keychain
- [ ] Token refresh on 401 works
- [ ] Profile screen shows user info + couple info
- [ ] Link Google from profile works
- [ ] Logout clears tokens and returns to login
- [ ] Navigation: auth stack ↔ main stack based on auth state

---

## Out of Scope
- Dashboard content (Sprint 35)
- Push notifications setup
- App icons / splash screen (later sprint)
- App Store / Play Store submission config
- Offline support
