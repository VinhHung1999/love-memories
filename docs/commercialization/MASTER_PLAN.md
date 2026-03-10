# Love Memories — Commercial Launch Master Plan

**Date:** 2026-03-10
**Goal:** Launch on App Store + Google Play as freemium commercial app
**Estimated timeline:** 7-8 sprints (~7-8 weeks)

---

## Tổng quan 3 mảng việc

| Mảng | Sprints | Ghi chú |
|------|---------|---------|
| A. RN Features chưa xong | 2 sprints | Backlog B13-B16 + Daily Questions |
| B. Backend Security & Commercial | 3 sprints | Data isolation, rate limit, account deletion, subscription |
| C. App Store Submission | 2 sprints | Signing, assets, legal, submit |

**Một số sprint có thể chạy song song (FE + BE).**

---

## Sprint Roadmap

### Sprint 44 — BE Security Critical Fixes
**Priority: CRITICAL — Phải fix trước khi multi-user**

| # | Task | Effort |
|---|------|--------|
| 1 | **Fix coupleId enforcement trên tất cả GET-by-ID endpoints** — Moments, FoodSpots, Goals, Sprints, Letters, Recipes, DatePlans, DateWishes, Expenses, CookingSessions | L |
| 2 | **Fix Notification access control** — markRead/delete phải verify userId | S |
| 3 | **CORS whitelist** — chỉ allow production + dev domains | S |
| 4 | **Rate limiting** — express-rate-limit trên auth, AI, upload endpoints | M |
| 5 | **Helmet security headers** | S |
| 6 | **Request body size limit** — `express.json({ limit: '1mb' })` | S |
| 7 | **Env var validation on startup** — fail fast nếu thiếu config | S |

---

### Sprint 45 — BE Commercial Features
**Priority: HIGH — Required for Store**

| # | Task | Effort |
|---|------|--------|
| 1 | **Account deletion endpoint** — `DELETE /api/auth/account` + cascade delete all data + CDN cleanup (Apple requirement) | L |
| 2 | **Email verification** — send verification email on register, block unverified | M |
| 3 | **Subscription endpoints** — `GET /api/subscription/status`, webhook handler for RevenueCat | M |
| 4 | **Free tier limit checking** — middleware/service to count records per couple, return limit info | M |
| 5 | **Legacy token cleanup** — remove old token system, keep only accessToken + refreshToken | S |
| 6 | **Refresh token expiry** — reduce from 30 days to 7 days | S |

---

### Sprint 46 — RN Subscription Infrastructure
**Priority: HIGH — No money without this**

| # | Task | Effort |
|---|------|--------|
| 1 | **RevenueCat SDK integration** — setup, configure products | M |
| 2 | **Paywall screen** — beautiful upgrade screen, trigger at free limit | L |
| 3 | **Free tier limit enforcement** — check limits on Moments(10), FoodSpots(10), Expenses(10), Sprints(1 active) | M |
| 4 | **Lock premium modules** — Recipes, Love Letters, Date Planner, Photo Booth, Recaps, Achievements, What to Eat show paywall for free users | M |
| 5 | **Plus badge** — indicator in Profile for subscribers | S |
| 6 | **Restore purchases** — button in Profile/Settings | S |

---

### Sprint 47 — RN Missing Features (Part 1)
**Priority: P1 — Key features for launch**

| # | Task | Effort |
|---|------|--------|
| 1 | **Daily Questions (NEW)** — BE: model + 50 starter questions + API. FE: daily card on Dashboard, answer flow, history | L |
| 2 | **Monthly Recap (B16)** — RN Stories-style full-screen viewer (port from web) | L |
| 3 | **Error Boundary** — global crash handler, friendly error screen | S |

---

### Sprint 48 — RN Missing Features (Part 2)
**Priority: P2 — Complete the app**

| # | Task | Effort |
|---|------|--------|
| 1 | **Goals & Sprints Kanban (B13)** — RN drag-and-drop kanban board | L |
| 2 | **Weekly Recap (B15)** — stat grid with week navigation | M |
| 3 | **Photo Booth (B14)** — camera + couple frames | M |

---

### Sprint 49 — App Store Prep
**Priority: HIGH — Submission blocking**

| # | Task | Effort |
|---|------|--------|
| 1 | **Apple Developer Account** — enroll ($99/year) | S |
| 2 | **Google Play Developer** — register ($25) | S |
| 3 | **iOS release signing** — certificates + provisioning profile | M |
| 4 | **Android release signing** — keystore setup | M |
| 5 | **App icon redesign** — "Love Memories" branding, all sizes | M |
| 6 | **10 App Store screenshots** — device mockups + headline text (VN + EN) | L |
| 7 | **Privacy Policy** — host at lovememories.app/privacy | M |
| 8 | **Terms of Service** — host at lovememories.app/terms | M |
| 9 | **Fill Google Client ID** in App.tsx | S |
| 10 | **Add google-services.json** for Android FCM | S |
| 11 | **Crash reporting** — Sentry integration | M |

---

### Sprint 50 — Submit & Launch
**Priority: FINAL**

| # | Task | Effort |
|---|------|--------|
| 1 | **Full QA** — test all 23+ screens on real iOS + Android devices | L |
| 2 | **Performance audit** — startup < 3s, no memory leaks | M |
| 3 | **App Store metadata** — name, description, keywords, category, age rating | M |
| 4 | **Build & upload iOS** — Xcode archive → App Store Connect | M |
| 5 | **Build & upload Android** — signed AAB → Google Play Console | M |
| 6 | **Submit for review** | S |
| 7 | **Analytics setup** — Mixpanel/Amplitude for user tracking | M |

---

## Parallelization Opportunity

```
Week 1-2:  Sprint 44 (BE Security) ──────────────────────┐
Week 2-3:  Sprint 45 (BE Commercial) ────────────────────┤
Week 3-4:  Sprint 46 (RN Subscription) ──────────────────┤ ← BE + FE can overlap
Week 4-5:  Sprint 47 (RN Features P1: Daily Q + Recap)   │
Week 5-6:  Sprint 48 (RN Features P2: Goals + Booth)     │
Week 6-7:  Sprint 49 (Store Prep) ← can start Week 5 ────┘
Week 7-8:  Sprint 50 (Submit & Launch)
```

**Nếu chạy song song BE + FE: có thể rút xuống ~6 weeks.**

---

## Free Tier Summary (Boss approved)

| Module | Free | Plus |
|--------|------|------|
| Dashboard | Full | Full |
| Moments | 10 | Unlimited |
| Food Spots | 10 | Unlimited |
| Expenses | 10 | Unlimited |
| Goals/Sprints | 1 active | Unlimited |
| Recipes | Locked | Full |
| Love Letters | Locked | Full |
| Date Planner | Locked | Full |
| Photo Booth | Locked | Full |
| Weekly Recap | Locked | Full |
| Monthly Recap | Locked | Full |
| Achievements | Locked | Full |
| What to Eat | Locked | Full |
| Daily Questions | Locked | Full |

**Pricing:**
- Plus Monthly: 49,000 VND / $3.99
- Plus Annual: 399,000 VND / $29.99
- Lifetime: 999,000 VND / $79.99

---

## Decisions Still Needed from Boss

| # | Decision | Deadline |
|---|----------|----------|
| 1 | Confirm brand name "Love Memories" | Before Sprint 49 |
| 2 | Purchase domain (lovememories.app?) | Before Sprint 49 |
| 3 | Apple Developer Account ($99) + Google Play ($25) | Before Sprint 49 |
| 4 | Marketing budget ($15K-$20K) | Before launch |
| 5 | Build Daily Questions or defer? | Before Sprint 47 |
| 6 | Hire contractor or solo? | Anytime |
