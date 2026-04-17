# Team Whiteboard

**Sprint:** 56 (DONE — pending Boss review)
**Last Completed:** Sprint 56 — Deploy to Internal App Store + Android Bundle ID Rename

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | DONE | Sprint 56 deployed to app store | 2026-03-26 |
| SM   | IDLE   | — | — |
| TL   | IDLE   | — | — |
| WEB  | IDLE   | — | — |
| BE   | IDLE   | — | — |
| MOBILE | IDLE | — | — |

**Task tracking uses board MD files.** Read `docs/board/sprints/active/sprint-{N}.md` for sprint board. Read `docs/board/backlog.md` for product backlog.

---

## Product Backlog (docs/board/backlog.md — source of truth)

| ID | Item | Priority | Points |
|----|------|----------|--------|
| 153 | B20: Play Store — Android release keystore + signing | P0 | 2 |
| 154 | B22: App Store icons (1024x1024) + splash screen | P1 | 3 |
| 155 | B23: App Store metadata (screenshots, descriptions) | P1 | 3 |
| 156 | B25: Play Store — Data safety form | P1 | 2 |
| 157 | B35: Daily Q&A — Compatibility Score | P1 | 5 |
| 152 | B16: RN Monthly Recap (Instagram Stories) | P2 | 8 |
| 151 | B8: RN Love Letters — common BottomSheet | P3 | 2 |

**Total: 7 items, 25 story points**

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
