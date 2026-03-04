# Mobile — React Native 0.76 + NativeWind + TypeScript

Native mobile app. Shares backend API with web frontend but has independent UI design.

## Commands
```bash
npm run ios          # Run on iOS simulator
npm run android      # Run on Android emulator
npm run start        # Metro bundler
npm run lint         # tsc --noEmit + ESLint
npm test             # Jest
```

## Structure
```
src/
├── components/           # Shared reusable components
│   ├── AppBottomSheet    # Shared BottomSheet wrapper (Profile benchmark)
│   ├── AlertModal        # Modal popup replacing Alert.alert()
│   ├── CollapsibleHeader # iOS large-title style animated header
│   ├── Card + CardTitle  # White rounded card container
│   ├── AvatarCircle      # Image + initials + camera badge
│   ├── EmptyState        # Icon + title + CTA placeholder
│   ├── TagBadge          # Tag/chip (filter or display)
│   ├── Button            # Primary/outline + spring animation
│   ├── Input             # TextInput with focus state
│   ├── FieldLabel        # Form field label
│   ├── ErrorBox          # Error message display
│   ├── LoadingOverlay    # Full-screen spinner
│   └── SpringPressable   # Pressable with spring scale
├── screens/              # MVVM: Screen (View) + ViewModel per folder
│   ├── Dashboard/        # Home tab
│   ├── Moments/          # Moments list + tag filter
│   ├── MomentDetail/     # Full moment view + comments/reactions
│   ├── CreateMoment/     # BottomSheet form (scrollable)
│   ├── Profile/          # User profile + edit modals ← DESIGN BENCHMARK
│   ├── PhotoGallery/     # Full-screen lightbox
│   └── Login/            # Google OAuth
├── navigation/
│   ├── index.tsx         # Stack + BottomTabs, BottomSheetModalProvider
│   └── theme.ts          # AppTheme + useAppColors() hook
├── contexts/
│   └── LoadingContext.tsx # Global loading state
├── lib/
│   ├── api.ts            # API client + Keychain token storage
│   └── auth.tsx          # AuthContext + Google login
├── locales/
│   └── en.ts             # i18n strings (single source of truth)
└── types/
    └── index.ts          # Re-exports from @shared/types
```

## Mandatory Rules
1. **MVVM**: Screen = UI only, ViewModel = logic/state/API
2. **NativeWind only**: ZERO `style` prop. Exception: Animated transforms, gorhom API
3. **i18n**: ALL strings from `locales/en.ts`
4. **Theme**: `useAppColors()` — no hardcoded hex
5. **Shared components**: Use `components/` — don't duplicate inline
6. **ProfileScreen = design benchmark**: All screens follow this style
7. **frontend-design skill**: Must use when building UI

## Navigation
```
NavigationContainer (headerShown: false on ALL navigators)
└── BottomSheetModalProvider
    ├── AuthStack → Login
    └── MainTabs
        ├── Dashboard
        ├── MomentsStack → Moments → MomentDetail → PhotoGallery
        └── Profile
```

## Key Libraries
- `react-native-reanimated` v4.2 — animations (UI thread)
- `@gorhom/bottom-sheet` v5.2 — bottom sheets
- `nativewind` — Tailwind CSS for RN
- `react-native-linear-gradient` — gradient backgrounds
- `react-native-safe-area-context` — safe area insets
- `react-native-vector-icons` — MaterialCommunityIcons

## Design Language
- Gradient: `#FFE4EA → #FFF0F6 → #FFF5EE`
- Clean, minimal — no card+shadow overload
- Text: textDark `#1A1624`, textMid `#5C4E60`, textLight `#A898AD`
- Primary: `#E8788A` (rose)
