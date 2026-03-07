# Team Whiteboard

**Sprint:** 43 ACTIVE
**Goal:** Backend Refactor — 3-layer clean architecture (Routes -> Controllers -> Services)

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | ACTIVE | Sprint 43 spec written, assigning to DEV | 2026-03-07 |
| DEV  | IDLE   | Awaiting Sprint 43 assignment | 2026-03-07 |

---

## Sprint 43 Spec

**Spec:** `docs/specs/sprint-43-backend-refactor.md`

**Summary:** Refactor backend from monolithic routes (27 files, 4500+ LOC) to 3-layer architecture:
- **Routes** — thin wiring only (path + method + middleware)
- **Controllers** — HTTP layer (parse req, call service, send res)
- **Services** — business logic (no req/res, pure functions, calls Prisma)

**Key deliverables:**
- Infrastructure: asyncHandler, errorHandler, validate middleware, AppError class
- 24 controller files + 23 service files + 17 validator files
- Cron jobs extracted to CronService
- Merge proxy-image+proxy-audio, geocode+resolveLocation
- Zero behavior change — all 160+ endpoints preserved

**Phases:** 0-Infrastructure -> 1-Template -> 2-Simple -> 3-Medium -> 4-Complex -> 5-Heavy -> 6-Cleanup -> 7-Verify

---

## Product Backlog

| # | Feature | Priority |
|---|---------|----------|
| B13 | RN: Goals & Sprints (Kanban) | P1 |
| B14 | RN: Photo Booth | P2 |
| B15 | RN: Weekly Recap | P2 |
| B16 | RN: Monthly Recap | P2 |

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

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements -> PO reviews on sprint branch
2. PO deploys to dev environment for Boss review
3. Boss approves -> merge to main -> production
