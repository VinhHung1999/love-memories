# Love Scrum — Mobile App Setup

React Native 0.84 · NativeWind v4 · React Navigation v7

---

## Prerequisites

- macOS with Xcode 15+ and iOS Simulator (for iOS)
- JDK 17 + Android Studio (for Android)
- Node.js 18+
- CocoaPods: `brew install cocoapods`

## First-time Setup

### 1. Install JS dependencies
```bash
cd mobile
npm install
```

### 2. iOS — install native pods
```bash
cd ios
bundle install   # installs CocoaPods Ruby gem
bundle exec pod install
cd ..
```

### 3. Set Google Client ID
Open `App.tsx` and replace the empty `webClientId` string:
```ts
GoogleSignin.configure({
  webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
});
```
This is the same `GOOGLE_CLIENT_ID` used in the backend `.env`.

Also register your iOS bundle ID (`com.lovescrum`) in Google Cloud Console → OAuth → Authorized app.

### 4. Run on iOS Simulator
```bash
npx react-native run-ios
```

### 5. Run on Android
```bash
npx react-native run-android
```

---

## Project Structure

```
mobile/
├── src/
│   ├── screens/          # LoginScreen, DashboardScreen, ProfileScreen
│   ├── lib/              # api.ts (fetch client + token refresh), auth.tsx (context)
│   ├── navigation/       # RootNavigator (auth stack ↔ main tabs)
│   └── types/            # Shared TypeScript interfaces
├── App.tsx               # Root component — QueryClient, SafeAreaProvider, AuthProvider
├── tailwind.config.js    # NativeWind theme (matches web colors)
├── babel.config.js       # NativeWind babel plugin + module-resolver
└── metro.config.js       # NativeWind metro integration
```

## API

Points to `https://dev-love-scrum-api.hungphu.work` in dev mode and
`https://love-scrum-api.hungphu.work` in production (`__DEV__` flag).

## Auth Flow

1. App starts → check keychain for stored tokens → verify with `/api/auth/me`
2. Valid token → show main tabs (Dashboard + Profile)
3. No token / expired → show Login screen
4. Login: email/password OR Google Sign-In (native)
5. New Google user → couple setup screen (create new / join with invite code)
6. Tokens stored in iOS Keychain / Android Keystore via `react-native-keychain`
7. 401 on any request → auto-refresh token → retry → if still 401, logout
