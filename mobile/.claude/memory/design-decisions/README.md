# Design Decisions

Key UI/UX decisions made during development. Read this before changing visual elements.

## Color & Theme

### Palette: Gentle & Soothing (Sprint 49 design revamp)
- Primary: `#E8788A` (rose) — active tabs, buttons, links
- Secondary: `#F4A261` (warm orange) — accents, star ratings
- Accent: `#7EC8B5` (teal) — success states
- Background: `#FFF8F6` (soft blush white) — NOT pure white
- Rationale: Warm, intimate feel for a couples app; avoids clinical white

### Two sources of truth must stay in sync
- `src/navigation/theme.ts` — runtime colors via `useAppColors()` for `style` props and gorhom API
- `tailwind.config.js` — same tokens for `className` usage in NativeWind
- When updating colors, always update BOTH files

### Dark mode implementation
- System-only (no user toggle) — reads `useColorScheme()` from react-native
- Dark tokens are separate named tokens: `darkBaseBg`, `darkBgCard`, `darkTextDark`, etc.
- Not auto-inversion — each dark color is hand-tuned separately
- Dark background: `#121212`, cards: `#1E1E1E`

## Typography

### Be Vietnam Pro (Sprint 48 — Boss manual update)
- Replaces previous font system
- All weights: Thin → Black; Vietnamese diacritics support
- `font-heading` = Bold (700), `font-headingSemi` = SemiBold (600)
- `font-body` = Regular (400), `font-bodyMedium` = Medium (500)
- `font-cursive` = Borel-Regular (slogans only, not body text)
- Configured in both `tailwind.config.js` and `navigation/theme.ts`

## Layout & Component Patterns

### ProfileScreen = design benchmark (Sprint 49)
- All new screens MUST follow ProfileScreen's design language: clean, minimal, consistent
- No card + shadow overload
- Boss approved this style — use as reference for every new screen

### CurvedTabBar (Sprint 51)
- 5 tabs with SVG notch cutout for floating camera FAB
- `CameraTab` has no screen component — the floating button is rendered by `CurvedTabBar`
- `sceneStyle` has `paddingBottom: CONTAINER_H - CAMERA_SIZE / 2` to prevent content hiding under tab bar

### AppBottomSheet always has sticky footer button
- Primary action goes in `onSave` prop → renders as sticky bottom button
- Never float the primary button inside scrollable content
- `scrollable={true}` + `snapPoints={['92%']}` for long forms

## Animation Philosophy

### Reanimated v4 (UI thread)
- All animations run on UI thread via `useAnimatedStyle` + Worklets
- `SpringPressable` — spring scale on press (Reanimated)
- No JS-thread animations (`Animated.Value`) unless required by third-party API (gorhom)

### Gradient backgrounds
- `#FFE4EA → #FFF0F6 → #FFF5EE` — standard app gradient
- Applied via `react-native-linear-gradient` on screens with full-bleed gradient
- Dashboard uses `LinearGradient` wrapper for main background

### Dark mode required for every color used in components
- Every color added to a component MUST have a dark mode variant
- Use `dark:` prefix classes in NativeWind (e.g. `bg-bgCard dark:bg-darkBgCard`, `text-textDark dark:text-darkTextDark`)
- For dynamic colors via `useAppColors()`, both `AppTheme` and `DarkAppTheme` in `navigation/theme.ts` must define the token
- Never add a color to only one theme — always update both light and dark

### Shared components — MUST reuse, never duplicate
- Always use existing components from `src/components/` — never create inline versions or copy-paste
- Use `Button`, `Input`, `Card`, `AppBottomSheet`, `SpringPressable`, etc.
- To customize → extend via props, do not create a separate one-off component
