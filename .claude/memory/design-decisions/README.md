# Design Decisions

Key UI/UX decisions made during development. Read this before changing visual elements.

## Color & Theme

_(Record palette choices, theme decisions, and their evolution)_

## Animation Philosophy

_(Record animation approach: timing, easing, accessibility considerations)_

## Layout Decisions

_(Record layout patterns, responsive strategy, component structure)_

## Typography

_(Record font choices, sizing scale, readability decisions)_

## Edit Modal Pattern (Sprint 4)

- `MomentEditModal` and `FoodSpotEditModal` follow a consistent pattern: all fields editable inline including `LocationPicker`, tag input, and `RatingStars`.
- Modals reuse the shared `Modal` component (bottom-sheet on mobile, centered on desktop) and open from the detail page via an "Edit" button.
- "Add Photos" upload button is placed directly on detail pages (not inside the edit modal) to keep photo management separate from field editing.

## Gallery Overlay Approach (Sprint 4)

- Fullscreen photo gallery uses a CSS opacity toggle (not conditional rendering) so the overlay is always in the DOM and refs remain valid.
- On mobile the gallery slides over everything at `z-[70]`; background content is visually hidden but not unmounted.
- Swipe-to-navigate and pinch-to-zoom are implemented with native touch events rather than a third-party carousel library to minimise bundle size.

## Dashboard Recap Pin Card (Sprint 26)

- Monthly recap card uses vibrant gradient (pink→rose→orange) with floating emoji hearts and a `.shimmer-overlay` CSS sweep
- Floating hearts: 4 `motion.span` elements with absolute positioning inside `relative overflow-hidden` Link, staggered `animate={{ y, opacity, scale }}` infinite loops
- `.shimmer-overlay` in `index.css`: `position: absolute; inset: 0; background: linear-gradient(105deg, transparent, rgba(255,255,255,0.28), transparent); animation: shimmer 2.4s infinite`
- Weekly recap pin removed — only monthly shown (days 1–3 of month)

## Monthly Recap Stories Design (Sprint 26)

- Each data category gets its own slide with a distinct gradient palette (purple=moments, orange=cooking, green=food, pink=letters, cyan=dates, yellow=goals)
- Intro and Outro always shown; data slides skipped if count is 0
- Count-up numbers (`AnimatedNumber`) are the hero element — `text-8xl font-heading font-bold text-white`
- Hold-to-pause mirrors Instagram behavior: visual feedback is progress bar freezing in place

## Mapbox GeolocateControl (Sprint 4)

- Added Mapbox's built-in `GeolocateControl` to `MapPage` for current-location centering.
- No custom geolocation implementation — `GeolocateControl` handles permission prompts, accuracy circles, and iOS/Android quirks out of the box.
- Positioned `bottom-right` so it does not overlap the bottom nav on mobile.

## No `style` prop in React Native (Sprint 35 — Boss Rule) — UPDATED Sprint 41
- ALL styling via NativeWind `className` only. Zero `style` prop, zero `StyleSheet.create()`
- Shadows → `shadow-sm` / `shadow-lg` className. Dynamic positions → `top-[40%]`, etc.
- contentContainerStyle workaround: inner `<View className="min-h-full px-7 ...">` child
- **Exception 1**: `Animated.Value` transforms/opacity — literally impossible as className
- **Exception 2**: Dynamic className ternaries (`${cond ? 'a' : 'b'}`) MUST use `style` prop instead — NativeWind CssInterop crashes when `disabled` + dynamic className change simultaneously. Boss rule: ALL dynamic visual styles (bg, text color, opacity, border) → `style` prop. Static layout (rounded, flex, padding) stays in `className`.

## HeaderIconButton dark/light variant (Sprint 41)
- `HeaderIconButton` has `dark` prop (default `true`): dark=true → white icon on semi-transparent white bg (for dark headers with gradient/photo), dark=false → dark icon on semi-transparent dark bg (for light pink gradient headers)
- Screens with default light pink gradient header (no `dark` prop on CollapsibleHeader): MUST use `dark={false}` on HeaderIconButton
- Currently: ProfileScreen, ExpensesScreen use `dark={false}`; DashboardScreen, MomentDetailScreen, RecipeDetailScreen, FoodSpotDetailScreen use default `dark={true}` (correct — they have dark backgrounds)

## React Navigation Theme over custom theme.ts (Sprint 35)
- Custom theme.ts deleted; navigation/theme.ts extends DefaultTheme
- Benefit: NavigationContainer auto-applies colors to tab bars, headers, borders
- Dark mode ready: swap AppTheme for DarkAppTheme in one place
- Components access colors via useAppColors() hook, not direct import
