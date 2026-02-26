# Team Whiteboard

**Sprint:** 27
**Goal:** Budget Tracker Core

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | SPRINT CLOSED | Sprint 27 merged to main + deployed to production | 2026-02-26 |
| DEV  | IDLE | Sprint 27 closed | 2026-02-26 |

---

## Sprint 27 Spec

### Task 1: Expense Model + CRUD API + Stats Endpoint (Backend)

**What:** New `Expense` Prisma model with full CRUD REST API, Zod validation, and a stats aggregation endpoint for monthly summary by category.

**Prisma model (`backend/prisma/schema.prisma`):**

```prisma
model Expense {
  id          String   @id @default(uuid())
  amount      Float
  description String
  category    String
  date        DateTime
  note        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("expenses")
}
```

**Categories (hardcoded constants, NOT a separate table):**

| Key | Label | Icon | Color (hex) |
|-----|-------|------|-------------|
| food | Ăn uống | 🍜 | #F97316 (orange) |
| dating | Hẹn hò | 💑 | #EC4899 (pink) |
| shopping | Mua sắm | 🛍️ | #8B5CF6 (purple) |
| transport | Di chuyển | 🚗 | #3B82F6 (blue) |
| gifts | Quà tặng | 🎁 | #EF4444 (red) |
| other | Khác | 📦 | #6B7280 (gray) |

**New file: `backend/src/routes/expenses.ts`**

| Method | Path | Purpose |
|--------|------|---------|
| GET | /api/expenses?month=YYYY-MM&category=food | List expenses (filter by month, category). Default: current month. Sorted by date DESC |
| GET | /api/expenses/stats?month=YYYY-MM | Monthly stats: total + breakdown by category. Default: current month |
| GET | /api/expenses/:id | Get single expense |
| POST | /api/expenses | Create expense |
| PUT | /api/expenses/:id | Update expense |
| DELETE | /api/expenses/:id | Delete expense |

**Stats response shape (`GET /api/expenses/stats`):**
```json
{
  "month": "2026-02",
  "total": 2500000,
  "byCategory": [
    { "category": "food", "total": 1200000, "count": 15 },
    { "category": "dating", "total": 800000, "count": 3 },
    { "category": "transport", "total": 300000, "count": 8 },
    { "category": "gifts", "total": 200000, "count": 1 }
  ],
  "count": 27
}
```

**Zod schemas (`backend/src/utils/validation.ts`):**
```
createExpenseSchema:
  amount: z.number().positive()
  description: z.string().min(1).max(500)
  category: z.enum(['food','dating','shopping','transport','gifts','other'])
  date: z.string().transform → Date
  note: z.string().max(1000).optional()

updateExpenseSchema: createExpenseSchema.partial()
```

**Register in `backend/src/index.ts`:**
```
app.use('/api/expenses', requireAuth, expenseRoutes)
```

**Acceptance criteria:**
- [ ] Prisma migration creates `expenses` table
- [ ] All 6 CRUD endpoints work
- [ ] Stats endpoint returns correct totals by category
- [ ] Month filter defaults to current month
- [ ] Category filter works (optional query param)
- [ ] Zod validation rejects invalid data (bad category, negative amount, missing fields)
- [ ] Tests pass

---

### Task 2: Expenses Frontend Page (Frontend)

**What:** New page to list, add, edit, and delete expenses with month navigation and category filter.

**New file: `frontend/src/pages/ExpensesPage.tsx`**

**Layout:**

1. **Header:** "Chi tiêu" + month navigation (← tháng trước / tháng sau →) showing "Tháng 2, 2026"
2. **Month summary card:** Total amount (formatted VND: `1.500.000₫`) + number of expenses
3. **Category filter:** Horizontal scrollable chips (All + 6 categories). Each chip = icon + label. Active chip highlighted with category color.
4. **Expense list:** Grouped by date (headers like "Hôm nay", "Hôm qua", "24/02/2026"). Each item shows:
   - Category icon (left)
   - Description + category label (center)
   - Amount in VND (right, bold)
   - Tap to edit
5. **FAB (Floating Action Button):** Bottom-right "+" button to add new expense
6. **Empty state:** "Chưa có chi tiêu nào tháng này. Thêm chi tiêu đầu tiên! 💰"

**Add/Edit form (Modal — bottom sheet on mobile):**
- Amount input (number, VND — large, prominent)
- Description input (text)
- Category selector (grid of 6 category buttons with icon + label)
- Date picker (default today)
- Note (optional textarea)
- Save / Delete buttons

**Currency formatting:**
- Use `Intl.NumberFormat('vi-VN')` for VND display
- Input: raw number, no currency symbol during typing
- Display: `1.500.000₫` format

**Types (`frontend/src/types/index.ts`):**
```ts
export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseStats {
  month: string;
  total: number;
  byCategory: { category: string; total: number; count: number }[];
  count: number;
}
```

**API client (`frontend/src/lib/api.ts`):**
```ts
export const expensesApi = {
  list: (month?: string, category?: string) => request<Expense[]>(`/expenses?${params}`),
  stats: (month?: string) => request<ExpenseStats>(`/expenses/stats?month=${month}`),
  get: (id: string) => request<Expense>(`/expenses/${id}`),
  create: (data) => request<Expense>('/expenses', { method: 'POST', body }),
  update: (id, data) => request<Expense>(`/expenses/${id}`, { method: 'PUT', body }),
  delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
};
```

**Routing (`frontend/src/App.tsx`):**
- Add: `<Route path="/expenses" element={<ExpensesPage />} />`
- Import `ExpensesPage`

**Acceptance criteria:**
- [ ] Expense list renders with correct VND formatting
- [ ] Month navigation works (prev/next)
- [ ] Category filter chips filter the list
- [ ] Add expense via FAB + modal form works
- [ ] Edit expense by tapping list item works
- [ ] Delete expense from edit form works
- [ ] Empty state shows when no expenses
- [ ] Form validates required fields (amount, description, category)

---

### Task 3: Dashboard Budget Card + MorePage Entry + Driver.js Tour

**What:** Add budget summary to Dashboard, entry in MorePage modules list, and driver.js tour for the expenses module.

**Dashboard (`frontend/src/pages/Dashboard.tsx`):**
- New card section between existing stats: "Chi tiêu tháng này"
- Show: total VND this month (large number) + mini horizontal bar showing top 3 categories with colors
- Tap navigates to `/expenses`
- Use `expensesApi.stats()` (current month)
- If total is 0, show subtle "Chưa có chi tiêu" instead of hiding

**MorePage (`frontend/src/pages/MorePage.tsx`):**
- Add new module entry in the `modules` array:
  - `to: '/expenses'`
  - `icon: Wallet` (from lucide-react)
  - `label: 'Budget'`
  - `description: 'Theo dõi chi tiêu'`
  - `color: 'bg-emerald-500/10 text-emerald-500'`
- Position: after "Monthly Recap" entry

**Driver.js tour (`ExpensesPage.tsx`):**
- Module key: `expenses`
- Add `data-tour` attributes to: month nav, summary card, category filters, expense list, FAB
- Steps:
  1. Month nav: "Chuyển tháng để xem chi tiêu từng tháng"
  2. Summary card: "Tổng chi tiêu tháng này"
  3. Category filters: "Lọc theo danh mục: ăn uống, hẹn hò, mua sắm..."
  4. Expense list: "Danh sách chi tiêu, chạm để sửa"
  5. FAB: "Thêm chi tiêu mới"
- Add `'expenses'` to TOUR_KEYS in MorePage

**NotificationsPage:** Add `expense` icon type (Wallet icon) for future use.

**Acceptance criteria:**
- [ ] Dashboard shows budget card with current month total
- [ ] MorePage has Budget entry navigating to /expenses
- [ ] Driver.js tour runs on first visit (5 steps)
- [ ] Tour key `expenses` added to TOUR_KEYS reset list
- [ ] Build passes, no lint errors

---

## Sprint 27 Backlog

| # | Task | Priority | Status | Assignee |
|---|------|----------|--------|----------|
| 1 | Expense Model + CRUD API + Stats Endpoint | P0 | DONE - PO Approved ✅ | DEV |
| 2 | Expenses Frontend Page | P0 | DONE - PO Approved ✅ | DEV |
| 3 | Dashboard Card + MorePage + Driver.js Tour | P0 | DONE - PO Approved ✅ | DEV |
| 4 | Remove Weekly Recap entry from MorePage (keep Monthly Recap) | P1 | DONE - PO Approved ✅ | DEV |

---

## Upcoming Sprints

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
_Sprint 26 — Weekly/Monthly Recap + Onboarding + Driver.js Tours + Stories UI: CLOSED (2026-02-26)_

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements → PO reviews on sprint branch
2. PO deploys to dev environment for Boss review
3. Boss approves → merge to main → production
