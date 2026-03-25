# Team Whiteboard

**Sprint:** 55
**Goal:** Photo Booth + Love Letters Redesign + Notification System

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | ACTIVE | Sprint 55 spec written — sending to TL | 2026-03-18 |
| TL   | IDLE   | — | 2026-03-18 |
| WEB  | IDLE   | — | 2026-03-18 |
| BE   | IDLE   | — | 2026-03-18 |
| MOBILE | IDLE | — | 2026-03-18 |

---

## Sprint 55 Tasks

### Phase 1: Photo Booth (B14)

| # | Task | Effort | Status | Assignee |
|---|------|--------|--------|----------|
| 1 | **CameraTabButton → ActionSheet** — Tap shows 2 options: "Quick Photo" (existing Moment flow) + "Photo Booth" (new screen). Keep existing CameraTabButton position/design | S | TODO | MOBILE |
| 2 | **PhotoBoothScreen — Camera mode** — Live camera preview with countdown timer, capture photos. Use `react-native-vision-camera` or `react-native-image-picker` | L | TODO | MOBILE |
| 3 | **PhotoBoothScreen — Gallery mode** — Select existing photos from device gallery | M | TODO | MOBILE |
| 4 | **Filters** — Port 8 filters from web (original, grayscale, sepia, warm, cool, rose, vintage, softglow). Use `react-native-image-filter-kit` or GL shaders | L | TODO | MOBILE |
| 5 | **Frames** — Port frames from web (strip frames + single-photo frames). Render with `react-native-skia` or Canvas | L | TODO | MOBILE |
| 6 | **Stickers** — Drag-to-reposition stickers (love, fun, text categories). Use `react-native-gesture-handler` for pan/pinch | L | TODO | MOBILE |
| 7 | **Watermark** — "Made with Memoura ❤️" branded watermark on final output | S | TODO | MOBILE |
| 8 | **Save/Share** — Save to gallery (`@react-native-camera-roll/camera-roll`) + native share sheet. Option to attach to Moment | M | TODO | MOBILE |

### Phase 2: Love Letters Redesign

| # | Task | Effort | Status | Assignee |
|---|------|--------|--------|----------|
| 9 | **Dashboard — Remove UnreadLetterCard** — Delete `UnreadLetterCard` component from Dashboard. Letter notification handled by Overlay + tab badge only | S | TODO | MOBILE |
| 10 | **CurvedTabBar — Unread badge** — Add badge count on Mail icon (Letters tab) showing unread letter count. Badge style: small red circle with count | S | TODO | MOBILE |
| 11 | **LetterOverlay — Show photos** — Display letter photos in overlay (horizontal scroll or hero image). Center the overlay card vertically on screen | M | TODO | MOBILE |
| 12 | **LetterReadScreen — Full redesign** — Redesign detail screen: beautiful typography, full-width photo gallery with tap-to-fullscreen lightbox (pinch-zoom, swipe), elegant mood display, voice memo player. Follow ProfileScreen design language | L | TODO | MOBILE |

### Phase 3: Notification System

| # | Task | Effort | Status | Assignee |
|---|------|--------|--------|----------|
| 13 | **Notification deep link — All types** — Tap push notification → navigate to correct screen (Love Letter → LetterReadScreen with letterId, Daily Q&A → DailyQuestionsScreen, Moment → MomentDetail, etc.). Handle both cold start (app killed) and background (app in memory) | L | TODO | MOBILE |
| 14 | **In-app notification banner** — Drop-down banner from top when receiving push while app is foreground. Show icon + title + body, auto-dismiss after 4s, tap → deep link to correct screen. iOS native style | M | TODO | MOBILE |

### Acceptance Criteria

- [ ] CameraTabButton tap → ActionSheet with "Quick Photo" + "Photo Booth"
- [ ] Photo Booth: capture photo (camera) or select from gallery
- [ ] Photo Booth: apply filters (8 filters), select frames, add stickers (drag/pinch)
- [ ] Photo Booth: "Made with Memoura ❤️" watermark on output
- [ ] Photo Booth: save to gallery + share + optional attach to Moment
- [ ] Dashboard: NO UnreadLetterCard (removed)
- [ ] CurvedTabBar: Mail icon shows unread badge count
- [ ] LetterOverlay: displays photos + centered layout
- [ ] LetterReadScreen: redesigned with full-width photo gallery + lightbox (pinch-zoom)
- [ ] Push notification tap → navigates to correct screen (all noti types)
- [ ] Push from outside app (cold start) → correct screen
- [ ] In-app banner drops from top on foreground notification
- [ ] In-app banner tap → correct screen
- [ ] MVVM pattern for all new screens
- [ ] NativeWind only (no style prop)
- [ ] i18n: all strings in en.ts
- [ ] Lint + build pass
- [ ] No regressions

---

## Sprint 52 Tasks (MERGED TO MAIN)

| # | Task | Status |
|---|------|--------|
| 1-5 | Universal Links (iOS + Android) | ALL DONE |
| 6-11 | Dark Mode / Light Mode | ALL DONE |
| 12-15 | Vietnamese Language (i18n) | ALL DONE |
| 16-19 | Invite Link → Onboarding Flow | ALL DONE |

---

## Product Backlog

| # | Feature | Priority |
|---|---------|----------|
| B8 | RN Love Letters: Use common BottomSheet component (S48 leftover) | P3 |
| ~~B14~~ | ~~RN: Photo Booth~~ | **Sprint 55** |
| B16 | RN: Monthly Recap | P2 |
| B17 | App Store: iOS signing (bundle ID, certs, provisioning profiles) | P0 |
| B18 | App Store: iOS GoogleService-Info.plist + APNS push cert | P0 |
| ~~B19~~ | ~~iOS Privacy manifest~~ | **Sprint 53** |
| B20 | Play Store: Android release keystore + signing config | P0 |
| ~~B21~~ | ~~Privacy Policy + Terms of Service~~ | **Sprint 50** |
| B22 | Both: App Store icons (1024x1024 iOS) + splash screen design | P1 |
| B23 | Both: App Store metadata (screenshots, descriptions, categories) | P1 |
| B24 | Both: EAS Build or Fastlane setup for build automation | P1 |
| B25 | Play Store: Data safety form | P1 |
| ~~B26~~ | ~~RevenueCat SDK~~ | **Sprint 50** |
| ~~B27~~ | ~~SubscriptionContext + useSubscription()~~ | **Sprint 50** |
| ~~B28~~ | ~~Paywall screen~~ | **Sprint 50** |
| ~~B29~~ | ~~Client-side free tier checks~~ | **Sprint 53** |
| ~~B30~~ | ~~Lock premium module navigation~~ | **Sprint 53** |
| ~~B31~~ | ~~Restore purchases + Plus badge~~ | **Sprint 53** |
| ~~B32~~ | ~~Dev/Prod environment separation~~ | **Sprint 53** |
| ~~B33~~ | ~~RN: Typography system refactor~~ | ~~Done~~ |
| ~~B34~~ | ~~Daily Q&A: Streak tracking~~ | ~~Done S54~~ |
| B35 | Daily Q&A: Compatibility Score — tính % tương đồng câu trả lời, chia theo category. Cần design format câu hỏi (multiple choice?) | P1 |
| ~~B36~~ | ~~**Rename → Memoura**: MOBILE display name~~ | ~~Done S54~~ |
| ~~B37~~ | ~~**Rename → Memoura**: WEB PWA~~ | ~~Done S54~~ |
| ~~B38~~ | ~~**Rename → Memoura**: BE AASA/assetlinks + Cloudflare Tunnel~~ | ~~Done S54~~ |
| ~~B39~~ | ~~**Rename → Memoura**: i18n update~~ | ~~Done S54~~ |
| ~~B40~~ | ~~**Rename → Memoura**: App Store metadata~~ | ~~Done S54~~ |

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
_Sprint 44 — Backend Security (coupleId enforcement, rate limiting, CORS, Helmet, env validation) + Couple max 2 members + Confirm password: DEPLOYED_
_Sprint 45 — Backend Commercial (Account Deletion, Email Verification, Subscription/RevenueCat, Free Tier Limits, Token Cleanup) + PWA Auth Refresh Fix: DEPLOYED_
_Sprint 46 — RN Monthly Recap Stories + Daily Questions (BE+RN+PWA) + Error Boundary + Remove Weekly Recap: DEPLOYED_
_Sprint 47 — BottomTab Refactor (PWA + RN) + Push Notifications (Daily Q&A) + Delete Account UI: DEPLOYED_
_Sprint 48 — App Bug Fixes (Dashboard, Moments, Daily Q&A, Love Letters, Delete Account RN) + Design System + Be Vietnam Pro font: DEPLOYED_
_Sprint 49 — RN Mobile UI Revamp (Design System, Header Refactor, DetailScreenLayout, Moments Calendar+Timeline, RelationshipTimer): MERGED TO MAIN_
_Sprint 50 — Subscription Flow + Love Letter Overlay + Privacy Policy: DEPLOYED_
_Sprint 51 — Onboarding v2, CurvedTabBar Camera, Input Limits, Dashboard Tour v2, requireCouple middleware: DEPLOYED_
_Sprint 52 — Universal Links, Dark Mode, Vietnamese i18n, Invite Link Flow: MERGED TO MAIN_
_Sprint 53 — MVP Completion (Subscription Enforcement, Bug Fixes, App Store Prep, react-native-config, Xcode crash fix): STABLE — awaiting Boss review_
_Sprint 54 — Streak Tracking, Rename Memoura, Domain Migration, Dashboard Redesign: MERGED TO MAIN_

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements -> PO reviews on sprint branch
2. PO deploys to dev environment for Boss review
3. Boss approves -> merge to main -> production

**Note:** `.env.dev` + `.env.prod` are gitignored. Boss needs to copy `mobile/.env.example` → `.env.dev` + `.env.prod` and fill in real API keys on local machine.
