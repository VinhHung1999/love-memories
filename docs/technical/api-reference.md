# API Reference

Base URL: `https://love-scrum-api.hungphu.work` (production) or `https://dev-love-scrum-api.hungphu.work` (dev)

All endpoints require `Authorization: Bearer <token>` unless marked as **Public**.

---

## Authentication

### `POST /api/auth/register` — Public

Register a new user (whitelist-only). **Sprint 32:** Now accepts optional `inviteCode` field.

**Request:**
```json
{ "email": "user@example.com", "password": "password123", "name": "User Name", "inviteCode": "8-char-code" }
```

**Response (201):**
```json
{ "accessToken": "jwt...", "refreshToken": "jwt...", "user": { "id": "uuid", "email": "...", "name": "..." } }
```

**Errors:** `400` invalid email/not in whitelist, `409` email already registered, `400` invalid invite code

---

### `POST /api/auth/login` — Public

**Sprint 32:** Now returns short-lived access token (15 min) + refresh token (7 days).

**Request:**
```json
{ "email": "user@example.com", "password": "password123" }
```

**Response (200):**
```json
{ "accessToken": "jwt...", "refreshToken": "jwt...", "user": { "id": "uuid", "email": "...", "name": "...", "avatar": "url|null" } }
```

**Errors:** `401` invalid credentials

---

### `POST /api/auth/refresh` — Public

Exchange refresh token for new access/refresh token pair.

**Request:**
```json
{ "refreshToken": "jwt..." }
```

**Response (200):**
```json
{ "accessToken": "jwt...", "refreshToken": "jwt..." }
```

**Errors:** `401` invalid/expired refresh token

---

### `POST /api/auth/logout`

Revoke refresh token on server (blacklist).

**Request:**
```json
{ "refreshToken": "jwt..." }
```

**Response (204)**

---

### `GET /api/auth/me`

Get current authenticated user profile.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "avatar": "https://cdn.../avatar.jpg",
  "coupleId": "uuid",
  "googleId": "string|null",
  "emailVerified": false,
  "createdAt": "2026-03-10T00:00:00.000Z"
}
```

**Sprint 33:** Now returns `googleId` field.
**Sprint 45:** Now returns `emailVerified` field.

---

## Google OAuth (Sprint 33)

### `POST /api/auth/google` — Public

Verify Google ID token. Returns tokens for existing users; returns `needsCouple` for new users.

**Request:**
```json
{ "idToken": "google-id-token-from-frontend" }
```

**Response — existing or auto-linked user (200):**
```json
{ "accessToken": "jwt...", "refreshToken": "...", "user": { "id": "uuid", "email": "...", "name": "...", "googleId": "..." } }
```

**Response — new Google user (200):**
```json
{ "needsCouple": true, "googleProfile": { "googleId": "...", "email": "...", "name": "...", "picture": "url" } }
```

**Errors:** `400` missing idToken, `401` invalid token, `500` server error

---

### `POST /api/auth/google/complete` — Public

Complete signup for a new Google user: creates account + couple.

**Request:**
```json
{ "idToken": "google-id-token", "coupleName": "Hung & Nhu" }
```
or
```json
{ "idToken": "google-id-token", "inviteCode": "abc12345" }
```

**Response (201):**
```json
{ "accessToken": "jwt...", "refreshToken": "...", "user": { "id": "uuid", "email": "...", "googleId": "..." } }
```

**Errors:** `400` missing idToken or couple info, `400` invalid invite code, `409` account already exists, `401` invalid token

---

### `POST /api/auth/google/link`

Link Google account to an already-logged-in user.

**Request:**
```json
{ "idToken": "google-id-token" }
```

**Response (200):**
```json
{ "ok": true, "googleId": "google-uid-123" }
```

**Errors:** `400` missing idToken, `401` invalid token, `409` Google account already linked to another user

---

## Account Deletion (Sprint 45)

### `DELETE /api/auth/account`

Permanently delete the authenticated user's account. Apple App Store required endpoint.

**Behavior:**
- If user is the **last member** of the couple: deletes all couple data (moments, foodspots, recipes, letters, sprints, date plans, etc.), all CDN files, then deletes the couple record.
- If user has a **partner**: deletes only user-specific data (love letters sent/received by this user, notifications, push subscriptions, refresh tokens). Couple and shared data remain for the partner.
- Refresh tokens invalidated automatically (cascade delete).
- CDN cleanup is best-effort (won't fail if CDN is unavailable).

**Request:**
```json
{ "password": "current-password" }
```
> Note: For Google-only accounts (no password), send empty string `""`.

**Response (204):** No content — account deleted.

**Errors:**
- `400` missing password field
- `401` wrong password
- `401` unauthenticated

---

## Email Verification (Sprint 45)

### `POST /api/auth/send-verification`

Send or resend email verification. Automatically called on registration.

**Request:** (no body required)

**Response (200):**
```json
{ "ok": true }
```

**Errors:**
- `401` unauthenticated
- `429` rate limit exceeded (max 3 emails/hour per user)

---

### `GET /api/auth/verify-email?token=xxx` — Public

Verify email address via token from the verification email link.

**Query param:** `token` — the verification token from the email.

**Response (200):**
```json
{ "ok": true, "emailVerified": true }
```

**Errors:**
- `400` missing token param
- `400` invalid or already-used token
- `400` token expired (tokens expire after 24 hours)

---

### `POST /api/auth/forgot-password` — Public (Sprint 60)

Request a password-reset email. Always returns `200` to avoid leaking whether an
account exists. Silently no-ops for unknown emails and for accounts that only have
Google/Apple Sign-In (no password to reset).

**Request:**
```json
{ "email": "you@example.com" }
```

**Response (200) — always:**
```json
{ "ok": true }
```

**Behaviour:**
- Issues a one-time reset token (random 32-byte hex), 1-hour expiry.
- Replaces any previously-unused token for the same user (only the newest is valid).
- Sends the token to the user via SMTP. If SMTP is unconfigured, logs the token to
  the server console (dev convenience).
- Rate limit: 3 requests per hour per user — excess requests still respond 200 but
  do not send email.

**Errors:**
- `400` missing or malformed `email`.

---

### `POST /api/auth/reset-password` — Public (Sprint 60)

Consume a password-reset token and set a new password. On success, all of the user's
active refresh tokens are revoked (forces a fresh login on every device).

**Request:**
```json
{ "token": "abc123…", "newPassword": "min-6-chars" }
```

**Response (200):**
```json
{ "ok": true }
```

**Errors:**
- `400` missing/short fields (`newPassword` must be ≥ 6 chars).
- `400` token unknown, expired, or already used.

---

## Subscription (Sprint 45)

### `GET /api/subscription/status`

Get the couple's current subscription status and usage limits.

**Response (200) — free tier:**
```json
{
  "status": "free",
  "plan": "free",
  "expiresAt": null,
  "limits": {
    "moments":   { "used": 3,  "max": 10 },
    "foodspots": { "used": 1,  "max": 10 },
    "expenses":  { "used": 0,  "max": 10 },
    "sprints":   { "used": 1,  "max": 1  }
  }
}
```

**Response (200) — active/plus tier:**
```json
{
  "status": "active",
  "plan": "plus",
  "expiresAt": "2027-03-10T00:00:00.000Z",
  "limits": null
}
```

**Status values:** `free` | `active` | `expired` | `cancelled` | `grace_period`

**Errors:** `401` unauthenticated

---

### `POST /api/subscription/webhook` — Public (webhook secret auth)

RevenueCat webhook handler. Called by RevenueCat on subscription events.

**Auth:** `Authorization` header must equal `REVENUECAT_WEBHOOK_SECRET` env var (if configured).

**Request — RevenueCat event payload:**
```json
{
  "event": {
    "type": "INITIAL_PURCHASE",
    "app_user_id": "<coupleId>",
    "store": "APP_STORE",
    "product_id": "love_memories_plus_monthly",
    "expiration_at_ms": 1772496000000,
    "original_transaction_id": "2000000123456789"
  }
}
```

**Handled event types:**

| Event | Resulting Status |
|-------|-----------------|
| `INITIAL_PURCHASE` | `active` |
| `RENEWAL` | `active` |
| `CANCELLATION` | `cancelled` |
| `EXPIRATION` | `expired` |
| `BILLING_ISSUE_DETECTED` | `grace_period` |

**Response (200):**
```json
{ "ok": true }
```

**Errors:**
- `400` missing `event.type`
- `401` invalid webhook secret
- `404` couple not found for given `app_user_id`

---

## Couple Profile (Sprint 32)

### `GET /api/couple`

Get couple information and both users' profiles.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Our Love",
  "anniversaryDate": "2024-01-15T00:00:00Z",
  "users": [
    { "id": "uuid", "email": "...", "name": "...", "avatar": "..." },
    { "id": "uuid", "email": "...", "name": "...", "avatar": "..." }
  ]
}
```

---

### `PUT /api/couple`

Update couple name and/or anniversary date.

**Request:**
```json
{
  "name": "Our Love Story",
  "anniversaryDate": "2024-01-15T00:00:00Z"
}
```

All fields optional.

**Response (200):** Updated couple object

---

### `POST /api/couple/generate-invite`

Generate or regenerate 8-character invite code for partner registration.

**Response (200):**
```json
{ "inviteCode": "ABC12345", "expiresAt": "2026-03-15T..." }
```

---

## Share Links (Sprint 32)

### `POST /api/share` — Auth required

Create a public share link for a moment, recipe, or love letter.

**Request:**
```json
{
  "type": "moment" | "recipe" | "letter",
  "targetId": "uuid",
  "expiresAt": "2026-03-15T00:00:00Z" | null
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "token": "abc123def456",
  "type": "moment",
  "targetId": "uuid",
  "coupleId": "uuid",
  "expiresAt": "2026-03-15T...",
  "viewCount": 0,
  "createdAt": "ISO"
}
```

---

### `GET /api/share` — Auth required

List all share links created by current couple.

**Response (200):** Array of share link objects with viewCount

---

### `DELETE /api/share/:token` — Auth required

Revoke share link.

**Response (204)**

---

### `GET /api/share/:token` — Public

Get shared item (moment, recipe, or letter) by share link token.

**Response (200):**
```json
{
  "type": "moment" | "recipe" | "letter",
  "data": { /* full item with media */ }
}
```

Increments `viewCount` on each access.

**Errors:** `404` token not found, `410` link expired

---

### `GET /api/share/:token/image` — Public

Proxy CDN image for shared item (CORS bypass).

**Query params:** `url` (encoded CDN URL)

**Response:** Binary image data with appropriate `Content-Type`

**Errors:** `404` token not found, `400` invalid URL

---

## Moments

### `GET /api/moments`

List all moments, newest first, with photos and audios.

**Response (200):**
```json
[{
  "id": "uuid", "title": "...", "caption": "...", "date": "ISO",
  "latitude": 10.8, "longitude": 106.7, "location": "...",
  "tags": ["tag1"], "spotifyUrl": "...",
  "photos": [{ "id": "uuid", "filename": "...", "url": "...", "createdAt": "ISO" }],
  "audios": [{ "id": "uuid", "filename": "...", "url": "...", "duration": 15.5, "createdAt": "ISO" }],
  "createdAt": "ISO", "updatedAt": "ISO"
}]
```

---

### `GET /api/moments/:id`

Get single moment with comments, reactions, photos, audios.

**Response (200):** Same as list item plus:
```json
{
  "comments": [{ "id": "uuid", "author": "...", "content": "...", "createdAt": "ISO", "user": { "id": "uuid", "name": "..." } }],
  "reactions": [{ "id": "uuid", "emoji": "❤️", "author": "...", "createdAt": "ISO" }]
}
```

---

### `POST /api/moments`

Create a new moment.

**Request:**
```json
{
  "title": "Our Date",
  "caption": "...",
  "date": "2026-02-27T00:00:00.000Z",
  "latitude": 10.8,
  "longitude": 106.7,
  "location": "Ho Chi Minh City",
  "tags": ["romantic", "dinner"],
  "spotifyUrl": "https://open.spotify.com/track/..."
}
```

All fields except `title` and `date` are optional.

**Response (201):** Created moment object

**Notification:** Sends to partner

---

### `PUT /api/moments/:id`

Update moment fields. Same body as create (all fields optional).

**Response (200):** Updated moment object

---

### `DELETE /api/moments/:id`

Delete moment and all associated photos/audios from CDN.

**Response (204)**

---

### `POST /api/moments/:id/photos`

Upload photos. Multipart form: `photos` field, up to 10 files, max 10MB each.

**Response (200):** Array of created photo records

---

### `DELETE /api/moments/:id/photos/:photoId`

Delete single photo from CDN + DB.

**Response (204)**

---

### `POST /api/moments/:id/audio`

Upload voice memo. Multipart form: `audio` field (1 file) + optional `duration` field.

**Response (200):** Created audio record

---

### `DELETE /api/moments/:id/audio/:audioId`

Delete audio recording.

**Response (204)**

---

### `GET /api/moments/:id/comments`

List comments for moment.

**Response (200):** Array of comment objects with user info

---

### `POST /api/moments/:id/comments`

Add comment.

**Request:**
```json
{ "author": "Hung", "content": "Great memory!" }
```

**Response (201):** Created comment

**Notification:** Sends to moment creator (if different user)

---

### `DELETE /api/moments/:id/comments/:commentId`

Delete comment.

**Response (204)**

---

### `POST /api/moments/:id/reactions`

Toggle emoji reaction (add if not exists, remove if exists).

**Request:**
```json
{ "emoji": "❤️", "author": "Hung" }
```

**Allowed emojis:** ❤️, 😍, 🥰, 😘, 💕, 🔥, 😢, 😂

**Response (200):**
```json
{ "action": "added" | "removed", "reaction": { ... } | null }
```

**Notification:** Sends to partner when reaction added (not removed)

---

## Food Spots

### `GET /api/foodspots`

List all food spots, newest first, with photos.

---

### `GET /api/foodspots/random?lat=10.8&lng=106.7&radius=5`

Get random food spot within radius (km) from given coordinates.

**Query params:** `lat` (required), `lng` (required), `radius` (optional, default 5km)

**Response (200):** Single food spot object or `null`

---

### `GET /api/foodspots/:id`

Get single food spot with photos.

---

### `POST /api/foodspots`

Create food spot.

**Request:**
```json
{
  "name": "Pho 2000",
  "description": "Best pho in town",
  "rating": 4.5,
  "latitude": 10.8,
  "longitude": 106.7,
  "location": "District 1",
  "tags": ["pho", "vietnamese"],
  "priceRange": 2
}
```

Validation: `rating` 0–5, `priceRange` 1–4, `latitude` -90 to 90, `longitude` -180 to 180

**Response (201):** Created food spot

---

### `PUT /api/foodspots/:id`

Update food spot. Same body as create (all fields optional).

---

### `DELETE /api/foodspots/:id`

Delete food spot + all photos from CDN.

---

### `POST /api/foodspots/:id/photos`

Upload photos. Multipart form: `photos` field, up to 10 files.

---

### `DELETE /api/foodspots/:id/photos/:photoId`

Delete single photo.

---

## Map

### `GET /api/map/pins`

Get all map pins (moments + food spots with valid coordinates).

**Response (200):**
```json
[{
  "id": "uuid",
  "type": "moment" | "foodspot",
  "title": "...",
  "latitude": 10.8,
  "longitude": 106.7,
  "location": "...",
  "tags": ["tag1"],
  "tagIcon": "🏷️",
  "thumbnail": "photo-url"
}]
```

---

## Sprints

### `GET /api/sprints`

List all sprints with goals.

---

### `GET /api/sprints/active`

Get current active sprint (status = ACTIVE).

---

### `GET /api/sprints/:id`

Get sprint with all goals.

---

### `POST /api/sprints`

Create sprint.

**Request:**
```json
{
  "name": "Sprint 1",
  "description": "First sprint goals",
  "startDate": "2026-02-27",
  "endDate": "2026-03-13",
  "status": "PLANNING"
}
```

Status values: `PLANNING`, `ACTIVE`, `COMPLETED`, `CANCELLED`

---

### `PUT /api/sprints/:id`

Update sprint fields.

---

### `PATCH /api/sprints/:id/status`

Update sprint status only.

**Request:**
```json
{ "status": "ACTIVE" }
```

---

### `DELETE /api/sprints/:id`

Delete sprint (goals cascade deleted).

---

## Goals

### `GET /api/goals/backlog`

Get unassigned goals (no sprint), ordered by `order` field.

---

### `GET /api/goals/sprint/:sprintId`

Get goals in specific sprint.

---

### `POST /api/goals`

Create goal in backlog.

**Request:**
```json
{
  "title": "Cook pho together",
  "description": "Try the recipe from YouTube",
  "priority": "MEDIUM",
  "assignee": "Hung",
  "dueDate": "2026-03-01"
}
```

Priority values: `LOW`, `MEDIUM`, `HIGH`

---

### `POST /api/goals/sprint/:sprintId`

Create goal directly in a sprint.

---

### `PATCH /api/goals/reorder`

Bulk reorder goals (used by drag-and-drop Kanban).

**Request:**
```json
{
  "goals": [
    { "id": "uuid", "order": 0, "status": "TODO", "sprintId": "uuid" },
    { "id": "uuid", "order": 1, "status": "IN_PROGRESS", "sprintId": "uuid" }
  ]
}
```

---

### `PUT /api/goals/:id`

Update goal fields.

---

### `PATCH /api/goals/:id/status`

Update goal status.

**Request:**
```json
{ "status": "DONE" }
```

Status values: `TODO`, `IN_PROGRESS`, `DONE`

---

### `PATCH /api/goals/:id/assign`

Assign goal to sprint or move to backlog.

**Request:**
```json
{ "sprintId": "uuid" | null }
```

---

### `DELETE /api/goals/:id`

Delete goal.

---

## Recipes

### `GET /api/recipes`

List all recipes with photos.

---

### `GET /api/recipes/:id`

Get single recipe with photos and food spot relation.

---

### `POST /api/recipes`

Create recipe.

**Request:**
```json
{
  "title": "Pho Bo",
  "description": "Traditional beef pho",
  "ingredients": ["500g beef bones", "200g rice noodles"],
  "ingredientPrices": [45000, 15000],
  "steps": ["Boil bones for 2 hours", "Cook noodles 3 minutes"],
  "stepDurations": [7200, 180],
  "tags": ["pho", "vietnamese", "soup"],
  "notes": "Use star anise for authentic flavor",
  "tutorialUrl": "https://youtube.com/watch?v=...",
  "foodSpotId": "uuid-or-null"
}
```

---

### `PUT /api/recipes/:id`

Update recipe fields.

---

### `DELETE /api/recipes/:id`

Delete recipe + photos.

---

### `POST /api/recipes/:id/photos`

Upload photos (up to 10).

---

### `DELETE /api/recipes/:id/photos/:photoId`

Delete photo.

---

## Cooking Sessions

### `GET /api/cooking-sessions/active`

Get active (non-completed, non-cancelled) session.

**Response (200):** Session object or `null`

---

### `GET /api/cooking-sessions`

List all sessions (history), newest first.

---

### `GET /api/cooking-sessions/:id`

Get session with recipes, items, steps, photos.

---

### `POST /api/cooking-sessions`

Create session from recipe IDs. Auto-generates shopping items + cooking steps.

**Request:**
```json
{ "recipeIds": ["uuid1", "uuid2"] }
```

**Error:** `400` if active session already exists

---

### `PUT /api/cooking-sessions/:id/status`

Update session status.

**Request:**
```json
{ "status": "cooking" }
```

Status flow: `selecting` → `shopping` → `cooking` → `photo` → `completed`

On `completed`: auto-calculates `totalTimeMs` from `startedAt`.

---

### `PUT /api/cooking-sessions/:id/items/:itemId`

Toggle shopping item checked status.

**Request:**
```json
{ "checked": true }
```

---

### `PUT /api/cooking-sessions/:id/steps/:stepId`

Toggle cooking step checked status.

**Request:**
```json
{ "checked": true, "checkedBy": "Hung" }
```

---

### `POST /api/cooking-sessions/:id/photos`

Upload session photos (up to 10).

---

### `PATCH /api/cooking-sessions/:id/rate`

Rate completed session.

**Request:**
```json
{ "rating": 5 }
```

Validation: 1–5

---

### `DELETE /api/cooking-sessions/:id`

Delete session + photos.

---

## Love Letters

### `GET /api/love-letters/received`

List inbox letters (DELIVERED + READ only), newest first. Includes photos and audio.

---

### `GET /api/love-letters/sent`

List all sent letters (all statuses), newest first.

---

### `GET /api/love-letters/unread-count`

Count DELIVERED (unread) letters for current user.

**Response (200):**
```json
{ "count": 3 }
```

---

### `GET /api/love-letters/:id`

Get letter with sender/recipient info, photos, audio. Auto-marks as READ if current user is recipient.

---

### `POST /api/love-letters`

Create letter.

**Request:**
```json
{
  "title": "Missing you",
  "content": "Long letter text...",
  "mood": "missing",
  "scheduledAt": "2026-03-01T08:00:00.000Z",
  "sendNow": false
}
```

**Status logic:**
- `sendNow: true` → DELIVERED immediately
- `scheduledAt` in future → SCHEDULED (cron delivers later)
- `scheduledAt` in past → DELIVERED immediately
- Neither → DRAFT

**Notification:** Sends to recipient on delivery

---

### `PUT /api/love-letters/:id`

Edit letter (DRAFT or SCHEDULED only).

---

### `PUT /api/love-letters/:id/send`

Send a DRAFT letter immediately (moves to DELIVERED).

---

### `DELETE /api/love-letters/:id`

Delete letter (DRAFT or SCHEDULED only).

---

### `POST /api/love-letters/:id/photos`

Upload photos (up to 5). Multipart form: `photos` field.

---

### `DELETE /api/love-letters/:id/photos/:photoId`

Delete photo (DRAFT/SCHEDULED only).

---

### `POST /api/love-letters/:id/audio`

Upload voice memo (1 file). Multipart form: `audio` field + optional `duration`.

---

### `DELETE /api/love-letters/:id/audio/:audioId`

Delete audio (DRAFT/SCHEDULED only).

---

## Date Wishes

### `GET /api/date-wishes`

List all wishes, newest first.

---

### `POST /api/date-wishes`

Create wish.

**Request:**
```json
{
  "title": "Try that new cafe",
  "description": "The one near Ben Thanh",
  "category": "cafe",
  "address": "123 Le Loi, D1",
  "latitude": 10.77,
  "longitude": 106.7,
  "url": "https://maps.google.com/...",
  "tags": ["cafe", "weekend"]
}
```

Categories: `eating`, `travel`, `entertainment`, `cafe`, `shopping`

---

### `PUT /api/date-wishes/:id`

Update wish fields.

---

### `PUT /api/date-wishes/:id/done`

Mark wish as fulfilled, optionally link to Moment or Food Spot.

**Request:**
```json
{
  "done": true,
  "linkedMomentId": "uuid",
  "linkedFoodSpotId": "uuid"
}
```

---

### `DELETE /api/date-wishes/:id`

Delete wish.

---

## Date Plans

### `GET /api/date-plans`

List all plans with stops. Auto-updates statuses (planned → active on plan date, active → completed when past + all stops done).

---

### `GET /api/date-plans/:id`

Get plan with stops (ordered by `order`) and sub-spots.

---

### `POST /api/date-plans`

Create plan with stops.

**Request:**
```json
{
  "title": "Weekend Date",
  "date": "2026-03-01",
  "notes": "Bring umbrella",
  "stops": [
    {
      "time": "10:00",
      "title": "Brunch at Cafe X",
      "address": "...",
      "latitude": 10.8,
      "longitude": 106.7,
      "category": "eating",
      "notes": "Try the egg benedict",
      "order": 0
    }
  ]
}
```

---

### `PUT /api/date-plans/:id`

Update plan + upsert/delete stops (transaction: delete removed stops, upsert remaining).

---

### `PUT /api/date-plans/:id/status`

Update plan status.

**Request:**
```json
{ "status": "completed" }
```

---

### `PUT /api/date-plans/:id/stops/:stopId/done`

Mark stop as done. If all stops done → auto-completes plan.

**Request:**
```json
{ "done": true }
```

**Response (200):** Full updated plan

---

### `PUT /api/date-plans/:id/stops/:stopId/moment`

Link a moment to a stop.

**Request:**
```json
{ "momentId": "uuid" }
```

---

### `PUT /api/date-plans/:id/stops/:stopId/foodspot`

Link a food spot to a stop.

**Request:**
```json
{ "foodSpotId": "uuid" }
```

---

### `PUT /api/date-plans/:id/stops/:stopId/cost`

Update stop cost.

**Request:**
```json
{ "cost": 250000 }
```

---

### `POST /api/date-plans/:id/stops/:stopId/spots`

Add sub-spot to a stop.

**Request:**
```json
{
  "title": "Alternative: Cafe Y",
  "address": "...",
  "latitude": 10.8,
  "longitude": 106.7,
  "url": "...",
  "notes": "Backup option",
  "order": 0
}
```

---

### `DELETE /api/date-plans/:id/stops/:stopId/spots/:spotId`

Delete sub-spot.

---

### `DELETE /api/date-plans/:id`

Delete plan (cascade deletes stops and spots).

---

## Expenses

### `GET /api/expenses?month=2026-02&datePlanId=uuid`

List expenses with optional month and date plan filters.

---

### `GET /api/expenses/stats?month=2026-02`

Get expense statistics by category.

**Response (200):**
```json
{
  "total": 1500000,
  "count": 15,
  "month": "2026-02",
  "byCategory": {
    "food": { "total": 800000, "count": 8 },
    "dating": { "total": 500000, "count": 5 }
  }
}
```

---

### `GET /api/expenses/daily-stats?month=2026-02`

Get per-day expense breakdown.

**Response (200):**
```json
{
  "month": "2026-02",
  "days": [
    { "date": "2026-02-01", "total": 150000, "byCategory": { "food": 100000 } }
  ]
}
```

---

### `GET /api/expenses/limits`

Get budget limits per category.

**Response (200):**
```json
{ "food": 3000000, "dating": 2000000, "shopping": null }
```

---

### `PUT /api/expenses/limits`

Set budget limits.

**Request:**
```json
{ "food": 3000000, "dating": 2000000, "shopping": null }
```

---

### `POST /api/expenses/upload-receipt`

Upload receipt photo to CDN.

**Response (200):**
```json
{ "url": "https://cdn.../receipt.jpg" }
```

---

### `GET /api/expenses/:id`

Get single expense.

---

### `POST /api/expenses`

Create expense.

**Request:**
```json
{
  "amount": 150000,
  "description": "Lunch at Pho 2000",
  "category": "food",
  "date": "2026-02-27",
  "note": "Very good!",
  "receiptUrl": "https://cdn.../receipt.jpg",
  "foodSpotId": "uuid",
  "datePlanId": "uuid"
}
```

Categories: `food`, `dating`, `shopping`, `transport`, `gifts`, `other`

---

### `PUT /api/expenses/:id`

Update expense.

---

### `DELETE /api/expenses/:id`

Delete expense.

---

## Notifications

### `GET /api/notifications`

List notifications for current user (max 50), newest first.

---

### `GET /api/notifications/unread-count`

**Response (200):**
```json
{ "count": 5 }
```

---

### `PUT /api/notifications/read-all`

Mark all notifications as read.

---

### `PUT /api/notifications/:id/read`

Mark single notification as read.

---

### `DELETE /api/notifications/:id`

Delete notification.

---

## Push Notifications

### `GET /api/push/vapid-key` — Public

Get VAPID public key for client push subscription.

**Response (200):**
```json
{ "publicKey": "BBase64..." }
```

---

### `POST /api/push/subscribe`

Register push subscription.

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "base64...",
    "auth": "base64..."
  }
}
```

---

### `POST /api/push/unsubscribe`

Unregister push subscription.

**Request:**
```json
{ "endpoint": "https://fcm.googleapis.com/..." }
```

---

## Settings

### `GET /api/settings/:key` — Public

Get setting value by key.

**Response (200):**
```json
{ "key": "relationship-start-date", "value": "2024-01-15" }
```

Returns `404` if key not found.

---

### `PUT /api/settings/:key`

Set/upsert setting value.

**Request:**
```json
{ "value": "2024-01-15" }
```

---

## Profile

### `PUT /api/profile`

Update user name.

**Request:**
```json
{ "name": "New Name" }
```

---

### `POST /api/profile/avatar`

Upload avatar image. Multipart form: `avatar` field. Deletes old avatar from CDN.

**Response (200):** Updated user object with new avatar URL

---

## Achievements

### `GET /api/achievements`

Auto-evaluate + unlock new achievements. Returns all achievements with unlock status.

**Response (200):**
```json
[{
  "key": "first_moment",
  "title": "First Memory",
  "description": "Save your first moment",
  "icon": "📸",
  "category": "moments",
  "unlocked": true,
  "unlockedAt": "2026-02-20T..."
}]
```

---

## Tags

### `GET /api/tags`

List all tags with icons and colors.

---

### `PUT /api/tags/:name`

Upsert tag icon/color.

**Request:**
```json
{ "icon": "🍜", "color": "#E8788A" }
```

---

## AI

### `POST /api/ai/generate-recipe`

Generate structured recipe from text, YouTube URL, or recipe URL.

**Request:**
```json
{ "mode": "text" | "youtube" | "url", "input": "Pho Bo recipe" }
```

**Response (200):**
```json
{
  "title": "Pho Bo",
  "description": "...",
  "ingredients": ["500g beef bones", "..."],
  "ingredientPrices": [45000, ...],
  "steps": ["Boil bones...", "..."],
  "stepDurations": [7200, ...],
  "tags": ["pho"],
  "notes": "...",
  "tutorialUrl": "..."
}
```

---

### `POST /api/ai/scan-receipt`

Extract expense data from receipt photo. Multipart form: `receipt` field.

**Response (200):**
```json
{
  "amount": 150000,
  "description": "Lunch items",
  "category": "food",
  "date": "2026-02-27",
  "items": ["Pho Bo x1", "Tra Da x2"]
}
```

---

## Recap

### `GET /api/recap/weekly?week=2026-W09`

Weekly activity stats. Defaults to previous week.

**Response (200):**
```json
{
  "week": "2026-W09",
  "startDate": "2026-02-23",
  "endDate": "2026-03-01",
  "moments": { "count": 5, "photoCount": 12, "highlights": [...] },
  "cooking": { "count": 2, "totalTimeMs": 7200000, "recipes": [...] },
  "foodSpots": { "count": 3, "names": [...] },
  "datePlans": { "count": 1, "titles": [...] },
  "loveLetters": { "sent": 2, "received": 1 },
  "goalsCompleted": 4,
  "achievementsUnlocked": [...]
}
```

---

### `GET /api/recap/monthly?month=2026-02`

Monthly activity stats with photos. Defaults to previous month.

Same structure as weekly plus photo arrays (moment highlights, cooking session photos, food spot photos).

---

### `GET /api/recap/monthly/caption?month=2026-02`

AI-generated Vietnamese intro/outro for monthly recap.

**Response (200):**
```json
{ "intro": "Thang 2 cua chung minh that tuyet voi...", "outro": "Cam on anh/em..." }
```

---

## Daily Questions — Sprint 46

All endpoints require authentication (`Authorization: Bearer <token>`).

### `GET /api/daily-questions/today`

Returns today's deterministic question for the couple. Both partners always receive the same question on the same day (`hash(coupleId + dayNumber) % totalQuestions`). Partner's answer is hidden until the requesting user has submitted their own answer.

**Response (200):**
```json
{
  "question": {
    "id": "uuid",
    "text": "What's one thing I do that always makes you smile?",
    "textVi": "Một điều tôi làm luôn khiến bạn mỉm cười là gì?",
    "category": "general"
  },
  "myAnswer": "You always make coffee just the way I like it.",
  "partnerAnswer": null,
  "partnerName": "Linh"
}
```

- `myAnswer` — null if user hasn't answered yet
- `partnerAnswer` — null until user submits their own answer (prevents copying)
- `partnerName` — null if user has no partner

---

### `POST /api/daily-questions/:id/answer`

Submit an answer to a question. One answer per user per question per couple.

**Request:**
```json
{ "answer": "You always make coffee just the way I like it." }
```
- `answer`: required, max 500 characters

**Response (201):**
```json
{
  "id": "uuid",
  "questionId": "uuid",
  "coupleId": "string",
  "userId": "string",
  "answer": "You always make coffee just the way I like it.",
  "createdAt": "2026-03-10T...",
  "question": { "id": "uuid", "text": "...", "textVi": "...", "category": "general" }
}
```

**Error responses:**
- `409 Conflict` — user already answered this question

---

### `GET /api/daily-questions/history?page=1&limit=20`

Paginated history of questions the couple has answered, with both partners' responses.

**Query params:** `page` (default 1), `limit` (default 20, max 100)

**Response (200):**
```json
{
  "items": [
    {
      "question": { "id": "uuid", "text": "...", "textVi": "...", "category": "deep" },
      "myAnswer": "My answer here",
      "myAnsweredAt": "2026-03-09T...",
      "partnerAnswer": "Partner's answer here",
      "partnerName": "Linh"
    }
  ],
  "total": 14,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## Utility Endpoints

### `POST /api/resolve-location`

Follow Google Maps short links, extract coordinates.

**Request:**
```json
{ "url": "https://maps.app.goo.gl/abc123" }
```

**Response (200):**
```json
{ "latitude": 10.8, "longitude": 106.7, "name": "Restaurant Name" }
```

---

### `GET /api/proxy-image?url=<encoded-cdn-url>`

Server-side CDN image proxy (CORS bypass for canvas). Validates URL starts with CDN_BASE_URL.

---

### `GET /api/proxy-audio?url=<encoded-cdn-url>` — Public

Server-side CDN audio proxy. Fixes content-type for iOS audio playback. Validates URL starts with CDN_BASE_URL.

---

## Error Response Format

All errors return:
```json
{
  "error": "Human-readable error message"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | Deleted (no content) |
| 400 | Validation error (Zod) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden — free tier limit or premium required (see below) |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limited |
| 500 | Internal server error |

### 403 Free Tier Responses (Sprint 45)

Applied to **POST (create) endpoints only**. GET/read endpoints always allowed.

**FREE_LIMIT_REACHED** — returned when free couple hits the resource cap:
```json
{ "error": "FREE_LIMIT_REACHED", "limit": 10, "used": 10, "resource": "moments" }
```

Affected endpoints and limits:
| Endpoint | Free Limit |
|----------|-----------|
| `POST /api/moments` | 10 moments |
| `POST /api/foodspots` | 10 food spots |
| `POST /api/expenses` | 10 expenses |
| `POST /api/sprints` | 1 active sprint |

**PREMIUM_REQUIRED** — returned when free couple tries to access a locked module:
```json
{ "error": "PREMIUM_REQUIRED", "module": "recipes" }
```

Locked modules (POST blocked for free tier):
- `recipes` → `POST /api/recipes`
- `love-letters` → `POST /api/love-letters`
- `date-planner` → `POST /api/date-plans`
