# Data Model

Database schema, ORM patterns, and migrations. Read this before changing the schema.

## Schema Overview

_(Record key tables/collections and their relationships)_

## ORM Patterns

_(Record ORM conventions, query patterns, performance considerations)_

## Migrations

_(Record significant schema changes and their context)_

```markdown
### Migration: Short title
- **Date:** YYYY-MM-DD
- What changed and why
- Any data migration steps
```

## Date Planner Models (Sprint 21)

### DateWish (`date_wishes`)
- Fields: title, description?, category (eating/travel/entertainment/cafe/shopping), done, doneAt?, linkedMomentId?, linkedFoodSpotId?, address?, latitude?, longitude?, url?, tags[], createdBy
- CRUD + PUT /:id/done (mark done + link moment/foodspot)

### DatePlan (`date_plans`)
- Fields: title, date, notes?, status (planned/active/completed)
- Auto-status: planned→active on date, active→completed when all stops done (backend handles in GET / and PUT /stops/:stopId/done)

### DatePlanStop (`date_plan_stops`)
- Fields: planId (→DatePlan cascade), time, title, description?, address?, lat/lng?, url?, tags[], category?, notes?, order, done, doneAt?, wishId?, linkedMomentId?, linkedFoodSpotId?
- Has sub-spots relation

### DatePlanSpot (`date_plan_spots`)
- Fields: stopId (→DatePlanStop cascade), title, address?, lat/lng?, url?, notes?, order
- Sub-locations within a stop

## Indexing Strategy

_(Record indexes, their purpose, and performance impact)_
