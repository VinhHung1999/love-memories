# Team Whiteboard

**Sprint:** 1 — "Foundation & Polish"
**Goal:** Fix build, initial commit, verify E2E flows, polish Dashboard

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | Active | Sprint planning & spec writing | 2026-02-20 00:30 |
| DEV  | Active | Task 1: Fix TS build error | 2026-02-20 00:31 |

---

## Sprint Backlog

| # | Task | Priority | Status | Assignee |
|---|------|----------|--------|----------|
| 1 | Fix TS build error in LocationPicker.tsx | P0 | TODO | DEV |
| 2 | Initial git commit (full codebase) | P0 | TODO | DEV |
| 3 | Verify all CRUD flows work E2E | P1 | TODO | DEV |
| 4 | Polish Dashboard with useful summary | P1 | TODO | DEV |

---

## Sprint Spec

### Task 1: Fix TypeScript Build Error (P0)
- **File:** `frontend/src/components/LocationPicker.tsx` line 27
- **Error:** `TS2554: Expected 1 arguments, but got 0`
- **Acceptance:** `npm run build` in frontend passes with zero errors

### Task 2: Initial Git Commit (P0)
- **Branch:** `feature_love_scrum_init` (already checked out)
- **Action:** Stage all project files, commit with meaningful message
- **Acceptance:** Clean git history with initial commit

### Task 3: Verify E2E CRUD Flows (P1)
- Start backend (`npm run dev`) and frontend (`npm run dev`)
- Verify these work without console errors:
  - Create/Read/Update/Delete a Moment
  - Create/Read/Update/Delete a Food Spot
  - Map page loads with pins
  - Create Sprint, add Goals, drag between columns
- **Acceptance:** All pages load, CRUD works, no console errors. Fix any issues found.

### Task 4: Polish Dashboard (P1)
- Dashboard should show useful summary:
  - Recent moments count
  - Total food spots count
  - Active sprint name + progress (X/Y goals done)
  - Quick links to add new moment/food spot
- **Acceptance:** Dashboard shows real data, not placeholder text

---

## Blockers

| Role | Blocker | Reported | Status |
|------|---------|----------|--------|
| | | | |

---

## Notes

Love Scrum project: React 19 + Vite + Tailwind v4 (frontend), Express + Prisma + PostgreSQL (backend).
Frontend port 3337, Backend port 5005.
DEV should do tasks in order: 1 → 2 → 3 → 4.

---

## Clear After Sprint

After Sprint Review, clear this whiteboard for next Sprint.
Keep only the template structure.
