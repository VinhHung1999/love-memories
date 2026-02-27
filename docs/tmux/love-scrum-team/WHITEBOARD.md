# Team Whiteboard

**Sprint:** 29
**Goal:** Dashboard Bento Grid Refactor

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | IDLE | Sprint 29 DEPLOYED ✅ | 2026-02-27 |
| DEV  | IDLE | Sprint 29 complete | 2026-02-27 |

---

## Sprint 29 Spec

### Task 1: Dashboard Bento Grid Refactor

**Context:** Boss finds the current Dashboard too vertically stretched — RelationshipTimer (~250px) and AchievementSummary (~120px) take excessive space. Boss wants a compact bento grid layout that also brings all 9 modules from MorePage onto Dashboard for quick access.

**Boss's exact words:**
> "Chỗ Timer với achievement gom lại thành Hero Card thông minh, chỗ chi tiêu tháng với lại active sprint biến thành bento hàng 2. Move toàn bộ modules ra dashboard thành bento hàng 4."

**Boss's change request:**
> Hero card hiển thị dạng "4 năm 3 tháng 2 ngày bên nhau" (full năm/tháng/ngày breakdown), KHÔNG phải "285 ngày bên nhau".

#### Target Layout

```
[Header: Love Scrum + bell]              ← unchanged
[Active Cooking Pin]                      ← conditional, unchanged
[Active Date Plan Pin]                    ← conditional, unchanged
[Monthly Recap Pin]                       ← conditional (days 1-3), unchanged

ROW 1 — Hero Card (compact, ~72px)
┌───────────────────────────────────────┐
│ ❤️ 4 năm 3 tháng 2 ngày bên nhau     │
│ 🏆 12/20  · 📸 45 kỷ niệm · 🎯 3    │
└───────────────────────────────────────┘

ROW 2 — Bento 2-col
┌─────────────────┐ ┌─────────────────┐
│ 💰 Chi tiêu      │ │ 🎯 Sprint 26    │
│ 2,500,000₫      │ │ 3/5 · 60%       │
│ 5 khoản         │ │ ████░░░░        │
│ ██ Ăn · █ Hẹn   │ │ ⏳ 3d left       │
└─────────────────┘ └─────────────────┘

ROW 3 — Recent Moments Swiper           ← unchanged

ROW 4 — Modules Grid (3-col)
┌──────┐ ┌──────┐ ┌──────┐
│ 🍴   │ │ 🍜   │ │ 👨‍🍳   │
│W2Eat │ │Foods │ │Recip │
├──────┤ ├──────┤ ├──────┤
│ ✨   │ │ 🏆   │ │ 💕   │
│Photo │ │Achie │ │Date  │
├──────┤ ├──────┤ ├──────┤
│ 💌   │ │ 📅   │ │ 💰   │
│Love  │ │Recap │ │Budge │
└──────┘ └──────┘ └──────┘

[FAB]                                     ← unchanged
```

#### Sub-tasks

**1A. Create shared modules constant**

**New file:** `frontend/src/lib/modules.ts`

Extract the 9-module array from `MorePage.tsx` (lines 50-114) into a shared file. Each entry: `{ to, icon, label, description, color }`. Both Dashboard and MorePage import from here.

**1B. Refactor Dashboard.tsx**

**File:** `frontend/src/pages/Dashboard.tsx` (611 lines → major rewrite)

**Hero Card (replace RelationshipTimer + AchievementSummary):**
- Remove `<RelationshipTimer footer={statsFooter} />` and `<AchievementSummary>`
- Inline compact timer: query `relationship-start-date` setting (already available via settingsApi), compute years/months/days using `calcDiff` logic from RelationshipTimer.tsx
- **IMPORTANT:** Display as "❤️ 4 năm 3 tháng 2 ngày bên nhau" (full breakdown), NOT totalDays
  - If years=0, skip "X năm". If months=0 and years=0, skip "X tháng". Always show days.
- Single card with gradient bg (`from-primary/10 via-secondary/5 to-accent/10`), height ~72px
- Row 1: `❤️ {years} năm {months} tháng {days} ngày bên nhau` (Link to /more for settings)
- Row 2: `🏆 {unlocked}/{total}` (Link to /achievements) + stats footer (existing `primaryStats` + `extraStats` logic)
- No live h:m:s clock on dashboard (saves a 1s interval)
- `data-tour="hero-card"` attribute
- Edge case: no date → show "Chưa cấu hình" + Link to /more

**Bento Row 2 (replace old Budget + Sprint sections):**
- Wrap Budget + Sprint in `<div className="grid grid-cols-2 gap-3 mb-4">`
- **Budget card (left):** Compact version of current card
  - Violet gradient, `p-3`, font `text-lg` (was `text-2xl`)
  - Show total + count + top 2 category bars (was 3)
  - Empty state: "Chưa có 💸" shorter text
  - Entire card is Link to `/expenses`
- **Sprint card (right):** Compact version
  - Accent gradient border, `p-3`
  - Show: sprint name, `{done}/{total} · {pct}%`, progress bar, remaining days badge
  - Drop: date range, 3 goal items list
  - Link to `/goals/sprint/${id}`
  - When no active sprint: Budget card takes `col-span-2`
- `data-tour="bento-row"` on the grid container

**Modules Grid (new section, after Recent Moments):**
- Import modules array from `frontend/src/lib/modules.ts`
- Section heading: "Tất cả tính năng" with subtle text
- `<div className="grid grid-cols-3 gap-3 mb-4" data-tour="modules-grid">`
- Each card: compact `rounded-2xl bg-white shadow-sm p-3 text-center` with icon (w-8 h-8) + label (text-xs font-medium)
- Each card is a `<Link to={module.to}>`

**Remove unused code:**
- Delete inline `AchievementSummary` function (lines 417-464)
- Remove `import RelationshipTimer` (line 12)
- Clean up unused stats/expanded state if no longer needed

**Update driver.js tour — replace existing 3 steps with 5:**
1. General intro (no element)
2. `[data-tour="hero-card"]` — Timer + Achievement
3. `[data-tour="recent-moments"]` — Recent Moments (kept)
4. `[data-tour="bento-row"]` — Budget + Sprint
5. `[data-tour="modules-grid"]` — All modules

**1C. Update MorePage.tsx**

- Remove inline `modules` array (lines 50-114)
- Remove "Modules" heading + grid section (lines 296-308)
- Import from shared `modules.ts` only if needed (it won't be — grid is removed)
- MorePage becomes Settings & Profile only

**1D. Verify tour keys**

In `MorePage.tsx` line 123, verify `TOUR_KEYS` array includes all module keys.

#### Critical Files

| File | Change |
|------|--------|
| `frontend/src/pages/Dashboard.tsx` | Major rewrite — hero card, bento row, modules grid |
| `frontend/src/pages/MorePage.tsx` | Remove modules grid |
| `frontend/src/lib/modules.ts` | New — shared modules array |
| `frontend/src/components/RelationshipTimer.tsx` | Reference only for calcDiff logic |

#### Edge Cases

- **No relationship date set:** Hero card shows "Chưa cấu hình" with link to /more
- **No active sprint:** Budget card takes `col-span-2`
- **No expense stats:** Budget half shows "Chưa có chi tiêu 💸"
- **0 achievements:** Show "🏆 0/0" with "Bắt đầu khám phá!" text

#### Acceptance Criteria

- [ ] Dashboard loads with new bento layout, all 4 rows visible without excessive scrolling
- [ ] Hero card shows "X năm Y tháng Z ngày bên nhau" (full breakdown, not just totalDays)
- [ ] Navigation: All 9 module cards link to correct routes
- [ ] Data: Budget shows current month stats, Sprint shows active sprint progress
- [ ] Conditional pins: Cooking session, Date plan, Monthly recap pins still appear when active
- [ ] MorePage: No modules grid, only profile/settings/permissions/logout
- [ ] Tour: New 5-step tour triggers on first visit after reset
- [ ] Mobile: Test on 375px width — bento cards don't overflow, module grid fits 3 cols
- [ ] Build + lint pass, no regressions

---

## Sprint 29 Backlog

| # | Task | Priority | Status | Assignee |
|---|------|----------|--------|----------|
| 1 | Dashboard Bento Grid Refactor | P0 | ASSIGNED | DEV |

---

## Previous Sprints

_Sprint 7–27: See git history_
_Sprint 28 — Budget Tracker Advanced + What to Eat Rating: DEPLOYED_
_Sprint 29 — Dashboard Bento Grid Refactor: DEPLOYED_

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements → PO reviews on sprint branch
2. PO deploys to dev environment for Boss review
3. Boss approves → merge to main → production
