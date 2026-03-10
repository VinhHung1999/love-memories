# Sprint 45 — Backend Commercial Features

**Goal:** Backend sẵn sàng cho App Store launch (account deletion, email verify, subscription, free tier limits)

---

## Task 1: Account Deletion Endpoint [L]

**Endpoint:** `DELETE /api/auth/account`

**Requirements:**
- Authenticated user only (JWT middleware)
- Require password confirmation in request body: `{ password: string }`
- Cascade delete ALL user data in order:
  1. Delete CDN files (photos, audio) — collect all URLs first, batch delete
  2. Delete all records: MomentPhoto, MomentAudio, LetterPhoto, LetterAudio, Notification, ExpenseItem, Expense, CookingSession, DateWish, DatePlanItem, DatePlan, LoveLetter, Recipe, Achievement, SprintTask, Sprint, Goal, FoodSpot, Moment, CoupleProfile
  3. If user is last member of couple → delete Couple
  4. Delete User record
  5. Invalidate all refresh tokens
- Return `204 No Content` on success
- Log deletion event (userId, timestamp)

**Acceptance Criteria:**
- [ ] `DELETE /api/auth/account` with valid password → 204, all data gone
- [ ] Wrong password → 401
- [ ] Unauthenticated → 401
- [ ] CDN files cleaned up (no orphaned uploads)
- [ ] Partner's data NOT affected (only requesting user's data deleted)
- [ ] If couple has 1 member left after deletion, couple still exists (partner keeps access)

---

## Task 2: Email Verification [M]

**New model:** `EmailVerification { id, userId, token, expiresAt, verifiedAt, createdAt }`

**Endpoints:**
- `POST /api/auth/send-verification` — send/resend verification email
- `GET /api/auth/verify-email?token=xxx` — verify email, set `user.emailVerified = true`

**Requirements:**
- On register: auto-send verification email with 24h token
- Email template: simple HTML with verify button/link
- Use Nodemailer with configurable SMTP (env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)
- Rate limit: max 3 verification emails per hour per user
- **Do NOT block login for unverified users yet** — just track status. We'll enforce later.
- Add `emailVerified: Boolean @default(false)` to User model

**Acceptance Criteria:**
- [ ] Register → verification email sent
- [ ] Click link → emailVerified = true
- [ ] Expired token (>24h) → 400 error
- [ ] Resend works, old tokens invalidated
- [ ] Rate limited to 3/hour

---

## Task 3: Subscription Endpoints [M]

**New model:** `Subscription { id visibleName coupleId, platform, productId, status, expiresAt, originalTransactionId, createdAt, updatedAt }`

**Status enum:** `free`, `active`, `expired`, `cancelled`, `grace_period`

**Endpoints:**
- `GET /api/subscription/status` — returns current couple's subscription status + limits
- `POST /api/subscription/webhook` — RevenueCat webhook handler (no auth — uses webhook secret)

**Requirements:**
- Webhook validates `Authorization` header against `REVENUECAT_WEBHOOK_SECRET` env var
- Handle RevenueCat events: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`, `BILLING_ISSUE_DETECTED`
- Subscription is per-couple (not per-user) — both partners share one subscription
- Default status for all couples = `free`
- `GET /status` response: `{ status, plan, expiresAt, limits: { moments: { used, max }, foodspots: { used, max }, ... } }`

**Acceptance Criteria:**
- [ ] New couple → status = free
- [ ] Webhook INITIAL_PURCHASE → status = active
- [ ] Webhook EXPIRATION → status = expired
- [ ] GET /status returns correct limits with used counts
- [ ] Invalid webhook secret → 401

---

## Task 4: Free Tier Limit Middleware [M]

**New middleware:** `checkFreeLimit(resource: string)`

**Limits (free tier):**
| Resource | Free Max | Plus |
|----------|----------|------|
| moments | 10 | unlimited |
| foodspots | 10 | unlimited |
| expenses | 10 | unlimited |
| sprints (active) | 1 | unlimited |

**Locked modules (free = no access at all):**
recipes, love-letters, date-planner, photo-booth, weekly-recap, monthly-recap, achievements, what-to-eat

**Requirements:**
- Middleware checks couple's subscription status
- If `active` subscription → pass through
- If `free` → count existing records, reject with `403 { error: "FREE_LIMIT_REACHED", limit: 10, used: 10 }` if at limit
- For locked modules → reject with `403 { error: "PREMIUM_REQUIRED", module: "recipes" }`
- Apply to POST (create) endpoints only — reads always allowed
- Add `checkPremiumAccess(module: string)` for locked modules

**Acceptance Criteria:**
- [ ] Free user with 10 moments → POST /api/moments returns 403
- [ ] Plus user with 10 moments → POST /api/moments succeeds
- [ ] Free user GET /api/moments → works (reads always allowed)
- [ ] Free user POST /api/recipes → 403 PREMIUM_REQUIRED
- [ ] Plus user POST /api/recipes → works

---

## Task 5: Legacy Token Cleanup [S]

**Requirements:**
- Audit current token system — identify old/unused token patterns
- Remove any deprecated token fields or routes
- Keep only: accessToken (JWT, 15min) + refreshToken (DB-stored)
- Clean up related code in auth routes and middleware

**Acceptance Criteria:**
- [ ] Only accessToken + refreshToken system exists
- [ ] No dead code or unused token-related fields
- [ ] All existing auth tests still pass

---

## Task 6: Refresh Token Expiry Reduction [S]

**Requirements:**
- Change refresh token expiry from 30 days → 7 days
- Update token generation and validation logic
- Existing tokens: let them expire naturally (no forced logout)

**Acceptance Criteria:**
- [ ] New refresh tokens expire after 7 days
- [ ] Expired tokens correctly rejected
- [ ] Login flow still works end-to-end

---

## Technical Notes

- **Branch:** `sprint_45` from `main`
- **Prisma migrations:** 1 migration for all schema changes (User.emailVerified, EmailVerification model, Subscription model)
- **Env vars to add:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `REVENUECAT_WEBHOOK_SECRET`
- **No frontend changes** — backend only sprint
- **Tests:** integration tests for all new endpoints
- **Docs:** update api-reference.md and database-schema.md
