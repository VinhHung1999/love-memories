# Team Whiteboard

**Sprint:** 22
**Goal:** Date Planner Notifications + Address Search Fix

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | Done | Sprint 22 deployed to production | 2026-02-23 |
| DEV  | Done | Sprint 22 all tasks complete | 2026-02-23 |

---

## Sprint 22 Spec

### Task 1: Backend — Date Planner Notifications (Event-driven)
**Priority:** P0

Add notifications when wishes/plans are created (follow existing pattern in `backend/src/utils/notifications.ts`).

**New notification types:**

| Type | Trigger | Title | Message |
|------|---------|-------|---------|
| `new_date_wish` | POST /api/date-wishes | "Ước mơ mới" | "{creator} thêm ước mơ: {title}" |
| `new_date_plan` | POST /api/date-plans | "Kế hoạch hẹn hò mới" | "{creator} tạo kế hoạch: {title}" |

**Implementation:**
- In `date-wishes.ts` POST handler: call `createNotification()` for partner
- In `date-plans.ts` POST handler: call `createNotification()` for partner
- Link: `/date-planner` for both types

**Frontend:**
- Add type icons in `NotificationsPage.tsx`: `new_date_wish: '💫'`, `new_date_plan: '📅'`

**Acceptance Criteria:**
- [ ] Creating a wish sends notification to partner
- [ ] Creating a plan sends notification to partner
- [ ] Notifications appear in NotificationsPage with correct icons
- [ ] Web push works for both types
- [ ] Build + lint pass

---

### Task 2: Backend — 6 AM Daily Plan Reminder (Scheduled)
**Priority:** P0

Send a notification at 6:00 AM if there's an active/planned DatePlan for today.

**Implementation:**
- Install `node-cron` package
- Create `backend/src/cron/dailyPlanReminder.ts`:
  - Cron expression: `0 6 * * *` (6:00 AM daily, Asia/Ho_Chi_Minh timezone)
  - Query: find DatePlans where `date` = today AND `status` in ('planned', 'active')
  - For each matching plan: send notification to ALL users
- Notification type: `daily_plan_reminder`
- Title: "Hôm nay có hẹn!"
- Message: "{plan.title} — {stops count} điểm đến"
- Link: `/date-planner`
- Register cron in `src/index.ts` (only when `require.main === module` to avoid running in tests)

**Frontend:**
- Add type icon: `daily_plan_reminder: '⏰'`

**Acceptance Criteria:**
- [ ] Cron job runs at 6 AM Asia/Ho_Chi_Minh
- [ ] Only triggers if there's a plan for today
- [ ] Sends to all users (both partners)
- [ ] Notification + web push sent
- [ ] Does NOT run during tests
- [ ] Build + lint pass

---

### Task 3: Frontend — Fix Address Search (LocationPicker proximity bias)
**Priority:** P0

**Problem:** Searching "10 Nguyễn An Ninh" shows results from random cities, not from the user's local area (Ho Chi Minh City). Root cause: Mapbox Geocoding API call has no `proximity` parameter.

**Current API call** (`LocationPicker.tsx` line ~67):
```
/geocoding/v5/mapbox.places/{query}.json?access_token=...&limit=5&language=vi&country=vn
```

**Fix — add `proximity` parameter:**
- Use the **map's current center** as proximity bias
- Format: `&proximity={lng},{lat}`
- This tells Mapbox to prefer results near the map center
- Default center is already HCM: `[106.6297, 10.8231]`

**Also add `types` filter:**
- `&types=address,poi,place` to prioritize addresses and POIs over regions/districts

**Acceptance Criteria:**
- [ ] Searching "10 Nguyễn An Ninh" shows HCM results first
- [ ] Proximity uses map's current center (updates when map is panned)
- [ ] Results are more relevant for local addresses
- [ ] Build + lint pass

---

## Sprint Backlog

| # | Task | Priority | Status | Assignee |
|---|------|----------|--------|----------|
| 1 | Backend: Date Planner notifications | P0 | DONE ✅ | DEV |
| 2 | Backend: 6 AM daily plan reminder | P0 | DONE ✅ | DEV |
| 3 | Frontend: Fix address search proximity | P0 | DONE ✅ | DEV |
| H1 | Fix: Strip postcode from address display | P0 | DONE ✅ | PO |

---

## Backlog (Sprint 22+)

| # | Feature | Notes |
|---|---------|-------|
| 1 | What to Eat — Rating & Stats | Rate experience, cooking stats over time |
| 2 | Photo Booth — Fun Effects | Stickers, filters, AR effects |
| 3 | Love Letters | Gửi thư bất ngờ cho nhau, hẹn giờ gửi |
| 4 | Mood Check-in | Check-in tâm trạng hàng ngày, xem trend theo tuần/tháng |
| 5 | Weekly Recap | Auto-generated summary cuối tuần: moments, cooking, achievements |
| 6 | Onboarding Tutorial | Hướng dẫn sử dụng app cho user mới, walkthrough các tính năng |

---

## Notes

_Sprint 7 — PicaPica Booth: APPROVED & MERGED (2026-02-20)_
_Sprint 8 — Bug Fix + Sticker Upgrade: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 9 — Dashboard Timer + Voice Recording + Map Tag Filter + Swiper Carousel + FAB: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 10 — Dashboard UI Redesign: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 11 — Spotify Embed + Map Tag Icons + Goal Edit Bug Fix + Emoji Picker: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 12 — Timer Realtime h:m:s + Spotify Layout + Timezone Fix: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 13 — Nav Restructure (More tab) + More Page + Dashboard Stats Expand: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 14 — Recipes Module + Logout + Auto-focus + Cooked Status: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 15 — What to Eat Today (Gamified Cooking Session): APPROVED & DEPLOYED (2026-02-22)_
_Sprint 16 — AI Recipe Creator + Ingredient Pricing + Confetti: APPROVED & DEPLOYED (2026-02-23)_
_Sprint 17 — Custom App Name + Achievements System + Profile Edit: APPROVED & DEPLOYED (2026-02-23)_
_Sprint 18 — Comments & Reactions on Moments: APPROVED & DEPLOYED (2026-02-23)_
_Sprint 19 — In-App Notification System + Web Push: APPROVED & DEPLOYED (2026-02-23)_
_Sprint 20 — Image Upload Optimization: APPROVED & DEPLOYED (2026-02-23)_
_Sprint 21 — Date Planner (Wishlist + Itinerary + Gallery): APPROVED & DEPLOYED (2026-02-23)_
_Sprint 22 — Date Planner Notifications + Address Search Fix: APPROVED & DEPLOYED (2026-02-23)_

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements → PO reviews on sprint branch
2. PO deploys to dev environment for Boss review
3. Boss approves → merge to main → production
