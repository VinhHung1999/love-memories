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
5. **Fonts via Tailwind class** — `font-body`, `font-display`, `font-displayItalic`, `font-script`. Dancing Script scope: **Letters screen** + **Dashboard Timer Hero accents** (timerLabel row + anniversary countdown footer, per prototype `dashboard.jsx` L266 + L333 — Sprint 64 T415 carve-out).
6. **Prototype > memory rules > DEV judgment.** Always cross-check `docs/design/prototype/memoura-v2/`. Ask PO before deviating.
7. **`style` prop is banned** even for quick hacks — file an issue, don't work around NativeWind.

## Environment

Sprint 67 T448 — **dual flavor**. `app.config.ts` resolves the active flavor
from `process.env.APP_VARIANT` (or `NODE_ENV` for local Metro), then sets
bundle ID, display name, scheme, associated domains, and API URL accordingly.

| Variant | Bundle ID                  | Display name | Scheme       | API host                    |
| ------- | -------------------------- | ------------ | ------------ | --------------------------- |
| `prod`  | `com.hungphu.memoura`      | Memoura      | `memoura`    | `api.memoura.app`           |
| `dev`   | `com.hungphu.memoura.dev`  | Memoura Dev  | `memouradev` | `dev-api.memoura.app`       |

Same icon for both — Boss directive 2026-04-27. Distinguishing only via
display name keeps the build pipeline simple and lets both binaries coexist
on a device for side-by-side QA.

Internal app store (`app-store.hungphu.work`) hosts both. Apple Developer
Portal must have an ad-hoc provisioning profile for `com.hungphu.memoura.dev`
with the target test device UDIDs registered (Boss confirmed it does,
2026-04-27 Q1).

Variant resolution order (in `app.config.ts → resolveVariant()`):
1. `APP_VARIANT='dev'` or `'prod'` → forced.
2. `NODE_ENV !== 'production'` → `dev` (local Metro convenience).
3. fallback → `prod` (release builds default to prod).

Local LAN override: set `EXPO_PUBLIC_API_URL=http://192.168.x.x:5006` in the
shell before `npm run ios` to point Metro at a LAN backend. **Do not commit
this to `.env`** — it overrides the variant default and breaks prod release
builds. Sprint 67 cleaned `.env` to leave it blank.

Version bumped to 2.0.0 in Sprint 59 so rework builds are visibly distinct
from `mobile/`'s 1.0 (40) history on TestFlight.

## iOS signing

- Team ID: `DHGY59PZWW`
- Build path: local `xcodebuild` via `ios/build-testflight.sh` (no EAS).
- `DEVELOPMENT_TEAM` is injected into the build command so `expo prebuild --clean` can wipe `ios/` without reconfiguring Xcode.

## Design defaults (locked)

- Palette: **Evolve light** (deep rose `#C23B4E`) — flipped from Brand in Sprint 60 (T291). Existing users keep saved prefs.
- Mode: system
- Type system: **serif** (Fraunces display + Be Vietnam Pro body)
- Density: **airy**
- Language: **vi**
- Dancing Script: **Letters screen + Dashboard Timer Hero accents** (Sprint 64 T415)

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
