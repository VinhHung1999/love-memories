# Team Whiteboard

**Sprint:** 53
**Goal:** Hoàn thiện MVP + Phân chia môi trường Dev/Prod

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | ACTIVE | Sprint 53 QA APPROVED — ready for dev deploy | 2026-03-16 |
| TL   | DONE   | All 4 phases approved | 2026-03-16 |
| WEB  | IDLE   | — | 2026-03-16 |
| BE   | IDLE   | — | 2026-03-16 |
| MOBILE | DONE  | Sprint 53 — GlassTabBar dark mode fix (bfac45f) | 2026-03-17 |

---

## Sprint 53 Tasks

### Phase 1: Bug Fixes & UX (DONE — pushed to sprint_53)

| # | Task | Effort | Status | Assignee |
|---|------|--------|--------|----------|
| 1 | **MOBILE: react-native-config setup** — `.env.dev` + `.env.prod` with `API_URL`, `GOOGLE_CLIENT_ID`, `REVENUECAT_API_KEY`, `MAPBOX_ACCESS_TOKEN`, `APP_BASE_URL`. Replace `__DEV__` / hardcoded values | M | DONE | MOBILE |
| 11 | **MOBILE: Camera BottomSheet — dismiss on save success** | S | DONE | MOBILE |
| 12 | **MOBILE: AppBottomSheet — sticky bottom primary button** (toàn app) | M | DONE | MOBILE |
| 13a | **MOBILE: Create Moment — remove memo field** (giữ Title + Spotify URL per Boss) | S | DONE | MOBILE |
| 13b | **MOBILE: Create Moment — auto-fill location** if permission granted | S | DONE | MOBILE |
| 16 | **MOBILE: Share invite → universal link** with `Config.APP_BASE_URL` + fix hardcoded English in handleInvitePartner | S | DONE | MOBILE |

### Phase 2: Env Separation — iOS schemes + Android flavors + Firebase (IN PROGRESS)

| # | Task | Effort | Status | Assignee |
|---|------|--------|--------|----------|
| 2 | **MOBILE: iOS build schemes** — `LoveScrum-Dev` (bundle ID `.dev`) + `LoveScrum-Prod`. Each selects correct `GoogleService-Info.plist` | M | TODO | MOBILE |
| 3 | **MOBILE: Android build flavors** — `dev` + `prod` productFlavors, separate `google-services.json` | M | TODO | MOBILE |
| 4 | **MOBILE: Separate Firebase projects** — `love-memories-dev` for dev builds | M | TODO | MOBILE |
| 5 | **MOBILE: App display name per env** — Dev shows "Love Memories (Dev)" + different icon | S | TODO | MOBILE |

### Phase 3: Subscription Enforcement — Wire Paywall into App

| # | Task | Effort | Status | Assignee |
|---|------|--------|--------|----------|
| 6 | **MOBILE: `useFeatureGate` hook** — `canCreate(feature)` + `isModuleLocked(module)`. Auto-navigate to PaywallScreen | M | TODO | MOBILE |
| 7 | **MOBILE: Free tier limit checks on create flows** — Moments (10), FoodSpots (10), Expenses (10), Sprints (1). Also handle 403 FREE_LIMIT_REACHED from API | L | TODO | MOBILE |
| 8 | **MOBILE: Lock premium modules** — Recipes, Love Letters, Date Planner, Photo Booth, Achievements, What to Eat, Monthly Recap. Tap → Paywall. Also handle 403 PREMIUM_REQUIRED from API (currently only Love Letters catches it, just shows text) | M | TODO | MOBILE |
| 9 | **MOBILE: Plus badge in Profile** — Premium: "Love Memories Plus" badge + plan details. Free: upgrade button | S | TODO | MOBILE |
| 10 | **MOBILE: Restore purchases flow** — Wire in Profile + Paywall. RevenueCat `restorePurchases()` + refresh context | S | TODO | MOBILE |

### Phase 4: App Store Readiness

| # | Task | Effort | Status | Assignee |
|---|------|--------|--------|----------|
| 14 | **MOBILE: iOS Privacy manifest** — `PrivacyInfo.xcprivacy` | S | TODO | MOBILE |
| 15 | **MOBILE: Package name alignment** — Android `com.lovescrum` → `com.hungphu.lovememories` | S | TODO | MOBILE |

### Acceptance Criteria

- [ ] `npm run ios:dev` builds Dev app, `npm run ios:prod` builds Prod app
- [ ] Dev + Prod apps coexist on same device (different bundle IDs)
- [ ] Dev app shows "(Dev)" in name, connects to dev API
- [ ] Prod app connects to prod API
- [ ] All API keys loaded from `.env.*` files, zero hardcoded values
- [ ] Firebase: dev project for dev builds, prod project for prod builds
- [ ] Share invite gửi kèm universal link URL (env-aware)
- [ ] Camera bottomsheet dismisses after save success
- [ ] All AppBottomSheet instances have sticky bottom primary button
- [ ] Create Moment: no memo field, auto-fill location if permitted
- [ ] Free user hits limit → Paywall appears (all 7 endpoints handled)
- [ ] Free user taps locked module → Paywall (all 8 modules)
- [ ] Premium user has no limits, all modules accessible
- [ ] Profile shows Plus badge / Free + upgrade button
- [ ] Restore purchases works end-to-end
- [ ] `PrivacyInfo.xcprivacy` present and valid
- [ ] Android + iOS bundle IDs aligned: `com.hungphu.lovememories`
- [ ] Lint + build pass (both schemes/flavors)
- [ ] No regressions in functionality

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
| B14 | RN: Photo Booth — camera + filters + branded watermark ("Made with Memoura ❤️") + save to gallery + share + optionally attach to Moment | P0 |
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
| B33 | RN: Typography system refactor | P1 |
| B34 | Daily Q&A: Streak tracking — đếm ngày liên tục cả 2 trả lời, hiển thị Dashboard, reset khi miss. BE cron + MOBILE UI | P0 |
| B35 | Daily Q&A: Compatibility Score — tính % tương đồng câu trả lời, chia theo category. Cần design format câu hỏi (multiple choice?) | P1 |
| B36 | **Rename → Memoura**: MOBILE display name (iOS bundle, Android app name, splash), slogan 'Two people. One story.' | P1 |
| B37 | **Rename → Memoura**: WEB PWA (manifest.json, index.html, sw.js, useAppName.ts, Dashboard, ShareViewerPage, MorePage) | P1 |
| B38 | **Rename → Memoura**: BE AASA/assetlinks + Cloudflare Tunnel for memoura.app domain | P1 |
| B39 | **Rename → Memoura**: i18n update all 'Love Memories' references in en.ts + vi.ts (WEB + MOBILE) | P1 |
| B40 | **Rename → Memoura**: App Store metadata — title 'Memoura — Couples App', subtitle 'Memories, Goals & Milestones' | P1 |

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

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements -> PO reviews on sprint branch
2. PO deploys to dev environment for Boss review
3. Boss approves -> merge to main -> production

**Note:** `.env.dev` + `.env.prod` are gitignored. Boss needs to copy `mobile/.env.example` → `.env.dev` + `.env.prod` and fill in real API keys on local machine.
