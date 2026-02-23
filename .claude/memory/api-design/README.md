# API Design

API endpoints, patterns, and conventions. Read this before designing new endpoints.

## Endpoints

_(Record API endpoints and their patterns)_

```markdown
### GET /api/resource
- Purpose: What it does
- Auth: Required/optional
- Notes: Pagination, filtering, etc.
```

## Authentication

_(Record auth strategy: JWT, session, API keys, etc.)_

## Error Handling

_(Record error response format, status code conventions)_

## Date Planner API (Sprint 21)

### DateWish — `/api/date-wishes`
- GET / — list all (newest first)
- POST / — create (title, description?, category, address?, lat/lng?, url?, tags[])
- PUT /:id — update fields
- PUT /:id/done — mark done + link momentId/foodSpotId
- DELETE /:id

### DatePlan — `/api/date-plans`
- GET / — list all + auto-status (planned→active if today, active→completed if past+all done)
- GET /:id — single plan with stops (ordered by order) + spots
- POST / — create with stops
- PUT /:id — update plan + replace stops (transaction: delete all + recreate)
- PUT /:id/status — update status only
- PUT /:id/stops/:stopId/done — mark stop done + auto-complete plan if all stops done (returns full plan)
- PUT /:id/stops/:stopId/moment — link moment to stop
- PUT /:id/stops/:stopId/foodspot — link foodspot to stop
- POST /:id/stops/:stopId/spots — add sub-spot
- DELETE /:id/stops/:stopId/spots/:spotId — delete sub-spot
- DELETE /:id — cascade deletes stops

## Conventions

_(Record naming conventions, versioning strategy, rate limiting)_
