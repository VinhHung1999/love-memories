# Love Scrum — React Native Roadmap

**Decision:** Rewrite frontend as React Native app for iOS + Android store release.
**Backend:** Express + Prisma + PostgreSQL (shared with web PWA).
**Started:** 2026-03-02
**Last updated:** 2026-03-07

---

## Tech Stack

- **Framework:** React Native (bare workflow, no Expo)
- **UI:** NativeWind (Tailwind CSS for RN)
- **Navigation:** React Navigation (native stack + bottom tabs)
- **Data:** @tanstack/react-query (same pattern as web)
- **Auth:** Google OAuth + email/password (same backend API)
- **Push:** Firebase Cloud Messaging (FCM) for iOS + Android
- **Audio:** react-native-audio-recorder-player v4.5.0 + react-native-nitro-modules

---

## Sprint History (Actual)

### Phase 1 — Core Setup (DONE)

| Sprint | Module | Status | Notes |
|--------|--------|--------|-------|
| 34 | **Project Setup + Auth** | DEPLOYED | RN init, navigation, login, register, couple flow, profile |
| 35 | **Login/Profile UI + BE auth fix** | DEPLOYED | UI polish, backend auth fixes |
| 36 | **Moments** | DEPLOYED | List, create, detail, photos, voice memo, comments, reactions, geocode proxy, skeleton loading |

### Phase 2 — Feature Modules (DONE)

| Sprint | Module | Status | Notes |
|--------|--------|--------|-------|
| 37 | **FoodSpots + Map** | DEPLOYED | FoodSpots stack, Mapbox native map, generic BottomSheet/Alert routes |
| 38 | **Dashboard WOW Redesign** | DEPLOYED | Editorial moments, vibrant header, complete visual overhaul |
| 39 | **Recipes + What to Eat** | DEPLOYED | RecipesScreen, RecipeDetail, CreateRecipe, CookingSession, CookingHistory, WhatToEat |
| 40 | **Notifications + Expenses** | DEPLOYED | Push notifications (FCM), ExpensesScreen, weekly chart |
| 41 | **Tab Cleanup + Dashboard Bell + Expense Widget** | DEPLOYED | Tab reorganization, notification bell, expense dashboard widget, icons |
| 42 | **Date Planner + Love Letters + Achievements** | DEPLOYED | 3 major modules in 1 sprint, CollapsibleHeader pattern |

### Phase 3 — Backend Cleanup (IN PROGRESS)

| Sprint | Module | Status | Notes |
|--------|--------|--------|-------|
| 43 | **Backend Refactor** | IN PROGRESS | 3-layer architecture (routes->controllers->services) |

### Remaining Backlog

| Module | Priority | Notes |
|--------|----------|-------|
| **Goals & Sprints** (Kanban) | P1 | Drag-drop, sprint management |
| **Photo Booth** | P2 | Camera, filters, countdown, gallery |
| **Weekly Recap** | P2 | Stat cards, week navigation |
| **Monthly Recap** | P2 | Stories-style animated slides |

### Cross-Cutting (Remaining)

- **Offline Support** — local cache / optimistic updates
- **Deep Linking** — share links open correct screen in app
- **App Store Compliance** — privacy policy, screenshots, metadata
- **Onboarding Tour** — native tooltip/walkthrough

---

## Key Decisions Made During Development

- **NativeWind only** — zero `style` prop (Boss rule), all styling via `className`
- **MVVM pattern** — every screen = View + ViewModel co-located in folder
- **ProfileScreen = design benchmark** — all screens follow same design language
- **Mobile UI independent from web** — same API, different UI optimized for native
- **CollapsibleHeader** — shared animated header component across all list screens
- **Theme centralized** — `useAppColors()` hook, no hardcoded hex values
- **i18n ready** — all strings in `src/locales/en.ts`

---

## Notes

- Web PWA maintained in parallel (for desktop users)
- Backend API shared — RN app calls same endpoints
- Sprint numbers diverged from original plan due to scope changes
- Each sprint: tests + PO code review + Boss approval before production
