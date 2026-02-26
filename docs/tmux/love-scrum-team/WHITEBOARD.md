# Team Whiteboard

**Sprint:** 26
**Goal:** Weekly Recap + Onboarding Tutorial

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | REVIEWING | Task 7 approved ✅ — awaiting Boss | 2026-02-26 |
| DEV  | IDLE | Task 7 complete + approved | 2026-02-26 |

---

## Sprint 26 Spec

### Task 1: Weekly Recap — Backend API

**What:** New backend endpoint that aggregates weekly activity data + cron job to send recap notification every Monday.

**Backend endpoint (`backend/src/routes/recap.ts` — NEW file):**

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/recap/weekly?week=2026-W09 | Get weekly recap data (defaults to last week) |

**Response shape:**
```json
{
  "week": "2026-W09",
  "startDate": "2026-02-23",
  "endDate": "2026-03-01",
  "moments": { "count": 5, "photoCount": 12, "highlights": [{ "id", "title", "date", "photoUrl" }] },
  "cooking": { "count": 3, "totalTimeMs": 7200000, "recipes": ["Phở bò", "Cơm tấm"] },
  "foodSpots": { "count": 2, "names": ["Bánh mì Huỳnh Hoa"] },
  "datePlans": { "count": 1, "titles": ["Cafe date"] },
  "loveLetters": { "sent": 2, "received": 1 },
  "goalsCompleted": 4,
  "achievementsUnlocked": ["First Recipe", "Cooking Streak"]
}
```

**Implementation:**
- Parse `week` param (ISO week format `YYYY-Www`) → compute startDate (Monday) + endDate (Sunday)
- Query each table with `createdAt/date BETWEEN startDate AND endDate`:
  - `prisma.moment.findMany({ where: { date: { gte, lte } } })` — count + first 3 with photos as highlights
  - `prisma.cookingSession.findMany({ where: { completedAt: { gte, lte }, status: 'completed' } })` — count + total time + recipe names
  - `prisma.foodSpot.findMany({ where: { createdAt: { gte, lte } } })` — count + names
  - `prisma.datePlan.findMany({ where: { date: { gte, lte } } })` — count + titles
  - `prisma.loveLetter.findMany({ where: { deliveredAt: { gte, lte }, status: { in: ['DELIVERED','READ'] } } })` — sent/received counts
  - `prisma.goal.findMany({ where: { status: 'DONE', updatedAt: { gte, lte } } })` — count
  - `prisma.achievement.findMany({ where: { unlockedAt: { gte, lte } } })` — names
- Return aggregated JSON

**Cron job (`backend/src/index.ts`):**
- Schedule: `0 9 * * 1` (9 AM every Monday, Asia/Ho_Chi_Minh)
- Create notification for all users: type `weekly_recap`, title `Recap tuần qua 📊`, link `/weekly-recap`

**Register:** `app.use('/api/recap', requireAuth, recapRoutes)`

---

### Task 2: Weekly Recap — Frontend Page

**What:** New page showing weekly stats with visual cards and highlights.

**New file: `frontend/src/pages/WeeklyRecapPage.tsx`**

**Layout:**
- Header: "Tuần của chúng mình 📊" + week navigation (← tuần trước / tuần sau →)
- Stats grid (2 columns): Each stat is a card with icon + number + label
  - 📸 Moments: count + photo count
  - 🍳 Cooking: count + total time (formatted)
  - 🍜 Food Spots: count
  - 💌 Love Letters: sent + received
  - 📅 Date Plans: count
  - 🎯 Goals: completed count
- Highlights section: Carousel of top moments with photos (reuse Swiper)
- Achievements section: List of newly unlocked achievements
- Empty state: "Tuần này chưa có hoạt động nào. Hãy tạo kỷ niệm mới! 💕"

**Other frontend changes:**
- `frontend/src/types/index.ts`: Add `WeeklyRecap` type
- `frontend/src/lib/api.ts`: Add `recapApi.weekly(week?: string)`
- `frontend/src/App.tsx`: Add route `/weekly-recap`
- `frontend/src/pages/NotificationsPage.tsx`: Add `weekly_recap` icon

---

### Task 3: Onboarding Tutorial — Frontend

**What:** Interactive step-by-step tutorial for new users. Shows on first login, can be replayed from More page.

**Approach:** Overlay-based spotlight tutorial (NOT separate pages). Use framer-motion for transitions.

**New file: `frontend/src/components/OnboardingOverlay.tsx`**

**Steps (5 total):**
1. **Welcome** — Full-screen welcome card: "Chào mừng đến với {appName}! 💕" + "Ứng dụng dành riêng cho hai bạn" + Bắt đầu button
2. **Moments** — Spotlight on Moments nav item: "Lưu lại kỷ niệm đáng nhớ — ảnh, ghi chú, địa điểm"
3. **Map** — Spotlight on Map nav item: "Bản đồ quán ăn yêu thích và nơi đã đi"
4. **Goals** — Spotlight on Goals nav item: "Theo dõi mục tiêu chung với scrum board"
5. **More** — Spotlight on More nav item: "Khám phá thêm: Photo Booth, Recipes, Love Letters, Date Planner..." + "Bắt đầu thôi! 🚀" button

**Spotlight mechanics:**
- Dark overlay (bg-black/60) with a "hole" around the target element
- Use `element.getBoundingClientRect()` to position the hole
- Info card below/above the spotlight with text + Next/Skip buttons
- Step indicators (dots) at bottom
- Skip button on all steps

**Trigger logic (in `App.tsx` or `Layout.tsx`):**
- On login, check `settingsApi.get('onboarding_completed__{userId}')`
- If not found → show OnboardingOverlay
- On complete/skip → `settingsApi.set('onboarding_completed__{userId}', 'true')`
- "Xem lại hướng dẫn" button in MorePage (Tùy chỉnh section) to replay

**Other changes:**
- `frontend/src/pages/MorePage.tsx`: Add "Xem lại hướng dẫn" button in Tùy chỉnh section

---

## Sprint 26 Backlog

| # | Task | Priority | Status | Assignee |
|---|------|----------|--------|----------|
| 1 | Weekly Recap — Backend API + Cron | P0 | DONE - PO Approved ✅ | DEV |
| 2 | Weekly Recap — Frontend Page | P0 | DONE - PO Approved ✅ | DEV |
| 3 | Onboarding Tutorial — Swiper (replaced by Task 4) | P0 | REPLACED | DEV |
| 4 | Per-Module Driver.js Tours | P0 | DONE - PO Approved ✅ | DEV |
| 5 | Missing tours (FoodSpots, Achievements, What to Eat) + button text fix | P0 | DONE - PO Approved ✅ | DEV |
| 6 | Fake seed data + Monthly Recap + Dashboard recap pins + MorePage entries | P0 | DONE - PO Approved ✅ | DEV |
| 7 | Monthly Recap Stories UI + Dashboard eye-catching card | P0 | DONE - PO Approved ✅ | DEV |

---

## Upcoming Sprints

**Sprint 27 — Budget Tracker Core**
| # | Task | Notes |
|---|------|-------|
| 1 | DB model Expense + CRUD API + Zod validation | Backend |
| 2 | Frontend page: danh sách chi tiêu, form thêm/sửa, filter | Frontend |
| 3 | Categories: 🍜 Ăn uống, 💑 Hẹn hò, 🛍️ Mua sắm, 🚗 Di chuyển, 🎁 Quà tặng, 📦 Khác | Icon + màu riêng |
| 4 | Dashboard stats (tổng tháng) + biểu đồ danh mục + MorePage entry | Frontend |

**Sprint 28 — Budget Tracker Advanced**
| # | Task | Notes |
|---|------|-------|
| 1 | Shared expenses: ai trả (mình/người yêu/chia đôi), balance ai nợ ai | Backend + Frontend |
| 2 | Budget limit: set ngân sách tháng, cảnh báo khi sắp vượt | Backend + Frontend |
| 3 | Integration: link chi tiêu với FoodSpots + Date Plans | Backend + Frontend |

---

## Backlog (Future)

| # | Feature | Notes |
|---|---------|-------|
| 1 | What to Eat — Rating & Stats | Rate experience, cooking stats over time |
| 2 | Photo Booth — Fun Effects | Stickers, filters, AR effects |
| 3 | Mood Check-in | Check-in tâm trạng hàng ngày, xem trend theo tuần/tháng |

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
_Sprint 23 — Plan Edit UX + Animation Fixes + Photo Upload: COMMITTED TO MAIN (2026-02-24)_
_Sprint 24 — Recipe from URL + Love Letters + Shared LetterReadOverlay + Envelope Animation + Bug Fixes: ALL 10 TASKS APPROVED (2026-02-25)_
_Sprint 25 — App Permissions Manager + Toggle Switches: DEPLOYED (2026-02-25)_
_Sprint 26 — Weekly Recap + Onboarding Tutorial: IN PROGRESS (2026-02-26)_

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements → PO reviews on sprint branch
2. PO deploys to dev environment for Boss review
3. Boss approves → merge to main → production
