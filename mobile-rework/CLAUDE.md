# CLAUDE.md — mobile-rework (Memoura)

Fresh RN rewrite of the Memoura iOS app. **Does NOT inherit code from `../mobile/`.**
Reference prototype: `../docs/design/prototype/memoura-v2/`.

## Stack

- Expo SDK 54 (bare workflow via `expo prebuild`)
- RN 0.81.5, React 19.1
- Expo Router (file-based) — `app/`
- NativeWind v4 + Tailwind 3.4
- Reanimated v4 + Worklets 0.5
- Zustand + AsyncStorage
- react-i18next + expo-localization
- @gorhom/bottom-sheet v5

## Directory map

```
app/                   — Expo Router screens (file = route)
  _layout.tsx          — root Stack
  (auth)/              — welcome, intro, signup, login, forgot, pair-*
  (tabs)/              — home, moments, letters, profile
  (modal)/             — camera-sheet, moment-detail, letter-read, monthly-recap
src/
  theme/               — tokens.ts, ThemeProvider.tsx, hooks (useAppColors…)
  components/          — SafeScreen, Button, Input, Card, Avatar, ScreenHeader…
  stores/              — authStore, themeStore (zustand)
  lib/                 — apiClient.ts (refresh interceptor)
  locales/             — vi.ts, en.ts, i18n.ts
  config/              — env.ts (reads Constants.expoConfig.extra)
  hooks/               — cross-cutting hooks
  screens/             — ViewModels co-located with screen folders
assets/
  fonts/               — Be Vietnam Pro, Fraunces, Dancing Script (OFL)
  images/              — icon, splash, adaptive
```

## Hard rules

1. **MVVM.** Screen = `XxxScreen.tsx` (view only) + `useXxxViewModel.ts` (logic/state/API). Co-locate in a folder per screen.
2. **NativeWind only — ZERO `style` prop.** No `StyleSheet.create`. All styling via `className`. Only exception: `Animated.Value` transforms/opacity.
3. **Theme via `useAppColors()` / `useTypeSystem()` / `useDensity()`.** No hardcoded hex values outside `src/theme/tokens.ts`.
4. **i18n double-brace interpolation** — `{{n}}`, never `{n}`. All strings in `src/locales/`.
5. **Fonts via Tailwind class** — `font-body`, `font-display`, `font-displayItalic`, `font-script`. Dancing Script is Letters-only.
6. **Prototype > memory rules > DEV judgment.** Always cross-check `docs/design/prototype/memoura-v2/`. Ask PO before deviating.
7. **`style` prop is banned** even for quick hacks — file an issue, don't work around NativeWind.

## Environments

| Variant | Bundle ID | Scheme | Display name |
|---|---|---|---|
| development | `com.hungphu.memoura.dev` | `memoura-dev` | Memoura Dev |
| production | `com.hungphu.memoura` | `memoura` | Memoura |

Switch via `APP_VARIANT` in `.env` (read by `app.config.ts`).
`EXPO_PUBLIC_*` vars are inlined at runtime; other config goes through `extra` + `expo-constants`.

## iOS signing

- Team ID: `DHGY59PZWW`
- Two App Store Connect apps: one per bundle ID
- Build path (EAS vs local `xcodebuild`) — TBD, see T279

## Design defaults (locked)

- Palette: **Brand light** (rose `#E8788A`)
- Mode: system
- Type system: **serif** (Fraunces display + Be Vietnam Pro body)
- Density: **airy**
- Language: **vi**
- Dancing Script: **Letters screen only**

## Drop list (NOT in scope)

FoodSpots, Recipes, Expenses, Achievements, Date Planner, What-to-eat, Photobooth frames.

## Scripts

```bash
npm install
npm run ios          # expo start --ios
npm run android      # expo start --android
npm run lint         # tsc --noEmit && expo lint
npm run prebuild     # regenerate native projects
```

## Sprint 59 tasks (T272–T279)

Tracked in Scrum MCP board. DEV commits to `sprint_59` branch. No feature sub-branches.
