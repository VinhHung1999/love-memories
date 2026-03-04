# Mobile Architecture

## Navigation Setup
- **React Navigation v7** — `@react-navigation/native@^7.1.31`, `@react-navigation/native-stack@^7.14.2`, `@react-navigation/bottom-tabs@^7.15.3`
- **Structure:** Root `NavigationContainer` → Auth flow (NativeStack, Login only) → Main flow (BottomTabs: Dashboard, Moments stack, Profile)
- **Moments stack:** Nested NativeStack → MomentsList, MomentDetail, PhotoGallery (fullScreenModal + fade)
- **All navigators:** `headerShown: false` — headers are custom-built, not React Navigation native

## Key Libraries
- `react-native-reanimated@^4.2.2` + `react-native-worklets@^0.7.4`
- `react-native-screens@^4.24.0`
- `react-native-safe-area-context` (useSafeAreaInsets)
- `expo-linear-gradient` for gradient backgrounds
- NativeWind for styling (className only, zero style prop)

## Shared CollapsibleHeader

### Decision
Custom build with Reanimated v4 — NOT React Navigation native header.

**Why not React Navigation header:**
- App already `headerShown: false` globally — turning it back on = big refactor
- Design needs: gradient bg, custom subtitle, avatar shrink, tag filter bar → native header can't do this
- `largeTitle` only works well on iOS, Android behavior differs
- Native header not compatible with NativeWind className

### Component: `mobile/src/components/CollapsibleHeader.tsx`

**Props:**
```typescript
interface CollapsibleHeaderProps {
  title: string;
  subtitle?: string;              // e.g. "Our Story"
  expandedHeight?: number;        // default ~120
  collapsedHeight?: number;       // default ~56
  renderExpandedContent?: () => ReactNode;  // avatar, badges, etc.
  renderRight?: () => ReactNode;  // action buttons
  scrollY: SharedValue<number>;   // from parent's Animated.ScrollView
}
```

**Animation (Reanimated v4, UI thread = 60fps):**
- `useAnimatedScrollHandler` for scroll tracking
- Title: `interpolate()` fontSize 28→18 + translateY
- Expanded content: fade out (opacity 1→0) over first 60px scroll
- Header height: interpolate expandedHeight → collapsedHeight
- Gradient stays, opacity adjusts
- `scrollEventThrottle={16}` for smooth 60fps

**Gradient palette:** `#FFE4EA → #FFF0F6 → #FFF5EE`

### Per-Screen Usage

| Screen | Header Content | Notes |
|--------|---------------|-------|
| MomentsScreen | Title "Moments" + subtitle "Our Story" + tag filter bar + FAB | Tag bar stays visible in collapsed state |
| ProfileScreen | Title user name + avatar + couple badge | Avatar shrinks on collapse |
| DashboardScreen | Title "Dashboard" | Simple — just title |
| MomentDetailScreen | Hero photo pattern | NOT CollapsibleHeader — different UX pattern |
| LoginScreen | No header | Auth flow |

## Create/Edit Forms Pattern
- **Use navigation push (full screen)** instead of BottomSheet modals for Create/Edit forms
- Route params: `{ momentId?: string }` — undefined = create, has ID = edit
- ViewModel fetches data fresh via useQuery — no stale state from parent props
- Save → goBack() + invalidate queries
- BottomSheet reserved for simple modals only (EditName, EditCouple — 1-2 fields)

## Header Patterns

### Existing Custom Headers (before CollapsibleHeader)
Both ProfileScreen and MomentsScreen already had custom gradient headers:
- `SafeAreaView` with `edges={['top']}` for iPhone notch
- `LinearGradient` colors `['#FFE4EA', '#FFF0F6', '#FFF5EE']`
- Title hierarchy with optional subtitle
- Action buttons integrated
- NativeWind className only
