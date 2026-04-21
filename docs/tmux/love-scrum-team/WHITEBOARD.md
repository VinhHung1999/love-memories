# Team Whiteboard

**Sprint:** IDLE — awaiting Sprint 62 goal.
**Last Completed:** Sprint 61 — Pill BottomTab + Profile (hero + 3 stats + 8 settings rows + edit flows) + Privacy/Terms/Delete Account + Notification state machine + T374 blind-buffer tab clearance — Boss approved via Build 39 (ad-hoc, app-store.hungphu.work) 2026-04-21. Board archived at `sprints/archive/sprint-7.md`. T367 + T368 deferred to backlog.

**Big direction (Boss 2026-04-18):** Mobile rebuild from scratch. New source at `mobile-rework/` based on prototype `docs/design/prototype/memoura-v2/`. Drop all modules not in prototype (FoodSpots / Recipes / Expenses / Achievements / Date Planner). BE + web-PWA unchanged. Plan: Sprints 59→65 (~7 sprints, ~80 pts).

---

## Team (Sprint 58+ — 2-pane: PO + DEV)

Team collapsed from 6 roles (PO/SM/TL/WEB/BE/MOBILE) to 2 roles (PO/DEV) to reduce coordination noise. Archived prompts in `prompts/_archive/`.

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO (Lu) | STAND BY | Sprint 61 closed, Build 39 ad-hoc approved. Retro logged, board archived, merged `sprint_61` → `main`. Awaiting Sprint 62 goal from Boss. | 2026-04-21 |
| DEV (Zu) | STAND BY | Sprint 61 final commit 356004a (T374 +30px spacer). Awaiting next sprint kickoff. | 2026-04-21 |

**Task tracking uses board MD files.** Read `~/Documents/Note/HungVault/brain2/wiki/projects/love-scrum/docs/board/sprints/active/sprint-{N}.md` for sprint board. Read `~/Documents/Note/HungVault/brain2/wiki/projects/love-scrum/docs/board/backlog.md` for product backlog.

---

## Product Backlog (~/Documents/Note/HungVault/brain2/wiki/projects/love-scrum/docs/board/backlog.md — source of truth)

| ID | Item | Priority | Points |
|----|------|----------|--------|
| 153 | B20: Play Store — Android release keystore + signing | P0 | 2 |
| T367 | BottomSheet A auto-reopen after close B (Profile stale state) | P1 | 3 |
| T368 | Airy spacing tokens — centralize into theme (Tailwind + vars) | P1 | 3 |
| 154 | B22: App Store icons (1024x1024) + splash screen | P1 | 3 |
| 155 | B23: App Store metadata (screenshots, descriptions) | P1 | 3 |
| 156 | B25: Play Store — Data safety form | P1 | 2 |
| 157 | B35: Daily Q&A — Compatibility Score | P1 | 5 |
| 152 | B16: RN Monthly Recap (Instagram Stories) | P2 | 8 |
| 151 | B8: RN Love Letters — common BottomSheet | P3 | 2 |

**Total: 9 items, 31 story points**

---

## Completed Items (done in code, removed from backlog)

- ~~B14~~ Photo Booth — Sprint 55
- ~~B17~~ iOS signing (bundle ID, certs, provisioning) — Done
- ~~B18~~ iOS GoogleService-Info.plist + APNS push cert — Done
- ~~B19~~ iOS Privacy manifest — Sprint 53
- ~~B21~~ Privacy Policy + Terms of Service — Sprint 50
- ~~B24~~ Build automation (build-testflight.sh) — Sprint 55
- ~~B26-B32~~ Subscription/RevenueCat/Free Tier — Sprint 50+53
- ~~B33~~ Typography system refactor — Done
- ~~B34~~ Daily Q&A Streak tracking — Sprint 54
- ~~B36-B40~~ Rename Memoura — Sprint 54

---

## Previous Sprints

_Sprint 7-28: See git history_
_Sprint 29 — Dashboard Bento Grid Refactor: DEPLOYED_
_Sprint 30 — Love Letters Photos & Voice Memo: DEPLOYED_
_Sprint 31 — Multi-Tenant coupleId Infrastructure: DEPLOYED_
_Sprint 32 — JWT Auth, Shared Links, Couple Profile: DEPLOYED_
_Sprint 33 — Google OAuth Login: DEPLOYED_
_Sprint 34 — React Native Project Setup + Auth: DEPLOYED_
_Sprint 35 — RN Login/Profile UI + BE auth fix: DEPLOYED_
_Sprint 36 — RN Moments: DEPLOYED_
_Sprint 37 — RN FoodSpots + Map: DEPLOYED_
_Sprint 38 — RN Dashboard WOW Redesign: DEPLOYED_
_Sprint 39 — RN Recipes + What to Eat: DEPLOYED_
_Sprint 40 — RN Notifications + Expenses: DEPLOYED_
_Sprint 41 — RN Tab Cleanup + Dashboard Bell + Expense Widget: DEPLOYED_
_Sprint 42 — RN Date Planner + Love Letters + Achievements: DEPLOYED_
_Sprint 43 — Backend 3-layer Refactor + CDN Fix + Rename Love Memories + Request Logging + DB Port Separation: DEPLOYED_
_Sprint 44 — Backend Security (coupleId enforcement, rate limiting, CORS, Helmet, env validation): DEPLOYED_
_Sprint 45 — Backend Commercial (Account Deletion, Email Verification, Subscription/RevenueCat, Free Tier Limits): DEPLOYED_
_Sprint 46 — RN Monthly Recap Stories + Daily Questions + Error Boundary: DEPLOYED_
_Sprint 47 — BottomTab Refactor + Push Notifications + Delete Account UI: DEPLOYED_
_Sprint 48 — App Bug Fixes + Design System + Be Vietnam Pro font: DEPLOYED_
_Sprint 49 — RN Mobile UI Revamp (Design System, Header, DetailScreenLayout, Moments): DEPLOYED_
_Sprint 50 — Subscription Flow + Love Letter Overlay + Privacy Policy: DEPLOYED_
_Sprint 51 — Onboarding v2, CurvedTabBar Camera, Input Limits, Dashboard Tour v2: DEPLOYED_
_Sprint 52 — Universal Links, Dark Mode, Vietnamese i18n, Invite Link Flow: DEPLOYED_
_Sprint 53 — MVP Completion (Subscription Enforcement, Bug Fixes, App Store Prep): DEPLOYED_
_Sprint 54 — Streak Tracking, Rename Memoura, Domain Migration, Dashboard Redesign: DEPLOYED_
_Sprint 55 — Photo Booth, Love Letters Redesign, Notification System: DEPLOYED_
_Sprint 56 — Deploy to Internal App Store, Android Bundle ID Rename (com.hungphu.memoura): DEPLOYED_
_Sprint 58 — Google Sign-In multi-platform audience fix (T270) + Sign in with Apple (T271, BE + MOBILE): CLOSED 2026-04-18 (Boss TestFlight E2E pending)_
_Sprint 59 — mobile-rework bootstrap (Expo SDK 54 scaffold, theme system, fonts, i18n, shared components, Expo Router nav, API client, internal ad-hoc deploy): CLOSED 2026-04-18 (Memoura 2.0.0 (4) on app-store.hungphu.work, approved by Boss)_
_Sprint 60 — Onboarding + Auth + Pairing (mobile-rework): CLOSED 2026-04-20 (Memoura 2.0.0 (29) + web /join/:code + BE password-reset endpoints, merged main, prod deployed)_
_Sprint 61 — Pill BottomTab + Profile + Legal/Delete Account (mobile-rework): CLOSED 2026-04-21 (Memoura 2.0.0 (39) ad-hoc — T374 blind +30px TabBarSpacer resolved LẦN 6 scroll-clip, compliance trio shipped, merged main). Board archived sprint-7.md_

---

## Process Reminder

**Sprint workflow (updated Sprint 56):**
1. DEV implements on `sprint_N` branch
2. PO reviews + deploys to internal App Store (`mobile/deploy-appstore.sh`)
3. Boss reviews on app-store.hungphu.work → APPROVE or REQUEST CHANGES
4. Boss approves → merge to main

**Deploy script:**
```bash
cd mobile
./deploy-appstore.sh all          # iOS + Android (both flavors)
./deploy-appstore.sh ios          # iOS only
./deploy-appstore.sh android dev  # Android dev only
./deploy-appstore.sh android prod # Android prod only
```
Note: APK > 100MB uploads via localhost (Cloudflare limit). Script uses `http://localhost:3457` by default.

**Note:** `.env.dev` + `.env.prod` are gitignored. Boss needs to copy `mobile/.env.example` -> `.env.dev` + `.env.prod` and fill in real API keys on local machine.
