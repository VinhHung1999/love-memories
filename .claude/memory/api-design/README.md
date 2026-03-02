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

**JWT (Sprint 32):** Access token (15min, `type: 'access'`) + refresh token (stored in DB, 30d). Response shape: `{ token, accessToken, refreshToken, user }`. `token` = legacy 30d JWT kept for backward compat.

**Google OAuth (Sprint 33):**
- `POST /api/auth/google` — verify Google ID token (`google-auth-library` OAuth2Client.verifyIdToken), auto-link by email, return `{ needsCouple, googleProfile }` for new users
- `POST /api/auth/google/complete` — new Google user + couple setup
- `POST /api/auth/google/link` — requireAuth, link googleId to current user
- User.password is now `String?` (nullable) — Google-only users have no password
- Login returns 401 with message `"This account uses Google Sign-In"` if `user.password === null`
- `verifyGoogleToken()` helper normalizes all errors to `new Error('Invalid Google token')` — catch handles `err.message.includes('Invalid Google')`
- Frontend: `@react-oauth/google` GoogleOAuthProvider wraps app in `main.tsx`; `GoogleLogin` component used on LoginPage and MorePage

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

## xAI Integration Pattern (Sprint 26)

- Import: `import OpenAI from 'openai'`; instantiate inline: `new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' })`
- Model: `grok-4-1-fast-non-reasoning`; always wrap in try/catch and return `null` (non-critical endpoints)
- Non-critical AI endpoints: return `res.json({ caption: null })` on error — never 500

## Conventions

_(Record naming conventions, versioning strategy, rate limiting)_
