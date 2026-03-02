# Love Scrum — React Native Roadmap

**Decision:** Rewrite frontend as React Native app for iOS + Android store release.
**Backend:** Giữ nguyên (Express + Prisma + PostgreSQL).
**Date:** 2026-03-02

---

## Tech Stack (TBD)

- **Framework:** React Native (Expo or bare — TBD)
- **UI:** NativeWind / Tamagui / RN StyleSheet — TBD
- **Navigation:** React Navigation
- **Data:** @tanstack/react-query (giữ nguyên pattern)
- **Auth:** Google OAuth + email/password (giữ nguyên API)

---

## Phase 1 — MVP (Store Release)

Mục tiêu: Ship lên App Store + Play Store với 5 modules core.

| Sprint | Module | Scope |
|--------|--------|-------|
| 34 | **Project Setup + Auth** | Init RN project, navigation, login (email + Google), register, couple flow, profile |
| 35 | **Dashboard** | Relationship timer, moments carousel, bento grid, FAB |
| 36 | **Moments** | List, create, detail, photos, voice memo, comments, reactions |
| 37 | **Love Letters** | Inbox/sent, compose, photos, voice memo, read overlay, schedule |
| 38 | **Food Spots** | List, create, detail, photos, rating, random picker |

**Milestone:** App Store + Play Store submission.

---

## Phase 2 — High Value

| Sprint | Module | Scope |
|--------|--------|-------|
| 39 | **Map** | Mapbox native, food spots + moments pins, filters |
| 40 | **Date Planner** | Plans list, detail, stops, wish list, map integration |
| 41 | **Recipes + Cooking** | Recipe CRUD, cooking session flow, timer, shopping list |

---

## Phase 3 — Expansion

| Sprint | Module | Scope |
|--------|--------|-------|
| 42 | **Expenses / Budget** | Expense tracking, categories, charts |
| 43 | **Goals & Sprints** | Kanban drag-drop, sprint management |
| 44 | **What to Eat** | Random picker, cooking session link |
| 45 | **Photo Booth** | Camera, filters, countdown, gallery |

---

## Phase 4 — Polish

| Sprint | Module | Scope |
|--------|--------|-------|
| 46 | **Weekly Recap** | Stat cards, week navigation |
| 47 | **Monthly Recap** | Stories-style animated slides, auto-advance |
| 48 | **Achievements** | System + custom achievements, unlock animations |

---

## Cross-Cutting Concerns (Address Throughout)

- **Push Notifications** — native push (FCM + APNs) thay web push
- **Background Upload** — native file upload queue
- **Offline Support** — local cache / optimistic updates
- **Deep Linking** — share links mở đúng screen trong app
- **App Store Compliance** — privacy policy, screenshots, metadata
- **Onboarding Tour** — thay driver.js bằng native tooltip/walkthrough

---

## Notes

- Sprint numbers are estimates, actual may vary based on complexity
- Each sprint includes tests + code review + Boss approval before merge
- Web PWA vẫn maintain song song (cho desktop users)
- Backend API không đổi — RN app gọi cùng endpoints
