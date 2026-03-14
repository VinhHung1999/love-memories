# Team Whiteboard

**Sprint:** 50
**Goal:** Subscription Flow + Love Letter Overlay + Privacy Policy

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | ACTIVE | Sprint 50 spec sent to TL | 2026-03-13 |
| TL   | IDLE   | Awaiting sprint assignment | 2026-03-13 |
| WEB  | IDLE   | Awaiting tasks | 2026-03-13 |
| BE   | IDLE   | — | 2026-03-13 |
| MOBILE | IDLE | Awaiting tasks | 2026-03-13 |

---

## Sprint 50 Tasks

| # | Task | Effort | Status | Assignee |
|---|------|--------|--------|----------|
| 1 | Privacy Policy + Terms of Service — generate content + create static web pages hosted on domain. Include: data collected, usage, third-party services, contact info. Link from app settings | M | TODO | WEB |
| 2 | RevenueCat SDK — install `react-native-purchases`, init on app launch. API key placeholder (Boss provides later). Configure entitlements: "plus" with 3 products (monthly $3.99/49K VND, annual $29.99/399K VND, lifetime $79.99/999K VND) | M | TODO | MOBILE |
| 3 | SubscriptionContext + useSubscription() hook — fetch `/api/subscription/status` on app launch, cache plan status, expose `isPremium`, `plan`, `limits`. Refresh on app foreground | M | TODO | MOBILE |
| 4 | Paywall screen — triggered when hitting free limit or tapping locked module. Show 3 tiers with pricing, feature comparison, restore purchases button. Use frontend-design skill | L | TODO | MOBILE |
| 5 | Love Letter Overlay — on app open, if unread letters exist (GET /api/love-letters/unread-count > 0), show full-screen overlay. Swipeable list of unread letters. Tap letter → envelope open animation (flap rotateX 0→180° + letter content slideUp). Shows full letter content on overlay. Auto marks as READ via API. Must read all letters before dismiss. Use frontend-design skill | L | TODO | MOBILE |

---

## Sprint 49 Tasks

### Phase 1: Design System Foundation

| # | Task | Effort | Status | Assignee |
|---|------|--------|--------|----------|
| 1 | Align color palette to web: primary `#E8788A`, secondary `#F4A261`, accent `#7EC8B5`, bg `#FFF8F6`, text `#2D2D2D`, textLight `#6B7280`, border `#F0E6E3`. Update `tailwind.config.js` + `theme.ts` | S | TODO | MOBILE |
| 2 | Switch icon library: `react-native-vector-icons/MaterialCommunityIcons` → `lucide-react-native`. Update ALL icons across every screen + bottom tab bar. Use exact same icons as web (Lucide) | M | TODO | MOBILE |
| 3 | Tone down CollapsibleHeader: remove FloatingHearts, replace heavy gradients with flat or single soft tint (`#FFF0ED` → `#FFF8F6`), clean minimal style like web | M | TODO | MOBILE |
| 4 | Standardize card system: clean white bg + shadow-sm + subtle border. Remove gradient cards. Match web's `rounded-2xl` + `ring-1 ring-black/5` pattern | S | TODO | MOBILE |

### Phase 2: Screen-by-Screen Revamp

| # | Task | Effort | Status | Assignee |
|---|------|--------|--------|----------|
| 5 | Dashboard: clean bento layout, remove heavy gradients, web-style quick actions with Lucide icons | L | TODO | MOBILE |
| 6 | Moments: card style — rounded-3xl, subtle shadow, no gradient overlays, match web MomentCard | M | TODO | MOBILE |
| 7 | Love Letters: soft rose tones, clean list, match web letter card style | M | TODO | MOBILE |
| 8 | Daily Questions: clean card style, softened header | S | TODO | MOBILE |
| 9 | Profile: update colors + icons to new palette (already benchmark — minimal changes) | S | TODO | MOBILE |
| 10 | All other screens (Recipes, FoodSpots, Expenses, DatePlanner, Achievements): apply new design system | L | TODO | MOBILE |
| 11 | Bottom Tab Bar: Lucide icons, match web nav icon set, soft active tint | S | TODO | MOBILE |

### Phase 3: Header Refactor (Priority — do first)

| # | Task | Effort | Status | Assignee |
|---|------|--------|--------|----------|
| 12 | Refactor CollapsibleHeader into 3 simple components: **ScreenHeader** (simple title + back + right action), **ListHeader** (title + subtitle + add button + filter tabs + back), **HeroHeader** (cover image + title + back + actions). NO scrollY prop — keep it simple. Each component max 4-5 props, no render props | L | DONE | MOBILE |
| 13 | Migrate all 17 screens to use new headers: Simple screens (Notifications, PlanList, LetterRead) → ScreenHeader. List screens (Moments, FoodSpots, Recipes, Expenses, Letters, DailyQ, Wishes, Achievements) → ListHeader. Detail screens (MomentDetail, RecipeDetail, FoodSpotDetail, PlanDetail) → HeroHeader. Dashboard + Profile keep custom. Delete old CollapsibleHeader | L | DONE | MOBILE |
| 14 | Dashboard RelationshipTimer redesign: 2 avatars (user + partner) each side, animated pulsing heart in center, days count below. Use frontend-design skill. Gentle soothing style | M | DONE | MOBILE |
| 15 | Moments screen redesign: Calendar (monthly, dot indicators on days with moments, tap day → scroll) + Timeline (vertical progress line, grouped by day newest first, horizontal moment cards per day). Use frontend-design skill | L | DONE | MOBILE |
| 16 | GlassTabBar invisible tabs fix (white-on-white after Phase 3 header change) + ListHeader scroll-driven bg tint (#FFF→#FFF0F2 over 0-40px). Apply to DailyQ + Letters screens | S | DONE | MOBILE |
| 17 | RelationshipTimer avatar shimmer: dual opacity+scale pulse (1.0→0.55, 1.0→1.06), 2400ms cycle, half-phase 1200ms stagger between left/right avatars | S | DONE | MOBILE |

### Acceptance Criteria

- [ ] All colors match web palette exactly (no more `#FF6B6B`, `#2D1B3D`)
- [ ] All icons are Lucide (no MaterialCommunityIcons remaining)
- [ ] No FloatingHearts animation on headers
- [ ] No heavy multi-color gradients on cards/headers
- [ ] Cards use clean white + subtle shadow consistently
- [ ] Overall feel: gentle, soothing, elegant — matches web PWA
- [ ] Lint + build pass
- [ ] No regressions in functionality

---

## Product Backlog

| # | Feature | Priority |
|---|---------|----------|
| B8 | RN Love Letters: Use common BottomSheet component (S48 leftover) | P3 |
| B14 | RN: Photo Booth | P2 |
| B16 | RN: Monthly Recap | P2 |
| B17 | App Store: iOS signing (bundle ID, certs, provisioning profiles) | P0 |
| B18 | App Store: iOS GoogleService-Info.plist + APNS push cert | P0 |
| B19 | App Store: iOS Privacy manifest (PrivacyInfo.xcprivacy) | P0 |
| B20 | Play Store: Android release keystore + signing config | P0 |
| B21 | Both: Privacy Policy + Terms of Service pages | P0 |
| B22 | Both: App Store icons (1024x1024 iOS) + splash screen design | P1 |
| B23 | Both: App Store metadata (screenshots, descriptions, categories) | P1 |
| B24 | Both: EAS Build or Fastlane setup for build automation | P1 |
| B25 | Play Store: Data safety form | P1 |
| B26 | RN Subscription: Install RevenueCat SDK + configure | P0 |
| B27 | RN Subscription: SubscriptionContext + useSubscription() hook | P0 |
| B28 | RN Subscription: Paywall screen (triggered at free limit / locked module) | P0 |
| B29 | RN Subscription: Client-side free tier checks across all screens | P1 |
| B30 | RN Subscription: Lock premium module navigation | P1 |
| B31 | RN Subscription: Restore purchases + Plus badge in Profile | P1 |
| B32 | RN: Dev/Prod environment separation — iOS build schemes (Dev/Prod) + Android build flavors + react-native-config (.env.dev/.env.prod) + separate Firebase projects (2x GoogleService-Info.plist, 2x google-services.json) + RevenueCat sandbox/prod keys + Google OAuth client IDs | P1 |

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

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements -> PO reviews on sprint branch
2. PO deploys to dev environment for Boss review
3. Boss approves -> merge to main -> production
