---
paths:
  - "backend/**/*"
---

# Backend — Express 5 + Prisma

Express 4.21 types, Zod 3, Prisma 6, JWT, PostgreSQL. Shared by frontend PWA and
mobile-rework. CommonJS module system (jest config must be `.js`, not `.ts`).

## 3-layer architecture

```
routes/<domain>.ts        — thin router: wire middleware + validate + controller
  ↓
controllers/<Name>Controller.ts  — HTTP layer: parse req, call service, send res
  ↓
services/<Name>Service.ts        — business logic + Prisma calls (the only layer that touches Prisma)
validators/<domain>Schemas.ts    — Zod schemas (one file per domain)
```

- **Never** put Prisma calls in routes or controllers.
- **Never** put HTTP concerns (res.json, req.params) in services. Services throw
  `AppError(status, message)` from `types/errors.ts` — errorHandler translates.

## Required middleware pattern

Every async route handler in a controller wraps in `asyncHandler`:

```ts
router.post('/', requireAuth, validate(createSchema), asyncHandler(controller.create));
```

- `asyncHandler` (src/middleware/asyncHandler.ts) — routes rejections to Express `next()`.
  No try/catch in controllers.
- `validate(schema)` — runs `schema.safeParse(req.body)`, sets `req.body = result.data`
  on success, forwards `ZodError` to errorHandler on failure.
- `errorHandler` (src/middleware/errorHandler.ts) — `ZodError → 400`,
  `AppError → statusCode`, anything else → `500 "Internal server error"`. Logs
  method+path+stack on 500.
- `requireAuth` (src/middleware/auth.ts) — JWT middleware; adds `req.user`.

## Express 5 params gotcha

`req.params.id` is typed `string | string[]` without a generic. Always:

```ts
asyncHandler<{ id: string }>(async (req, res) => { ... })
// or
(req: AuthRequest & Request<{ id: string }>, res) => { ... }
```

## Entry point guard

`src/index.ts` wraps `app.listen` in `if (require.main === module)` so Supertest can
import `app` without binding a port. **Keep this guard** — breaks all integration tests
if removed.

## File uploads

Multer → `uploads/` (local disk, UUID filename, 10MB limit, images only) →
`uploadToCdn()` (src/utils/cdn.ts) → delete local file. Never serve `/uploads` in
production — only CDN URLs.

`src/middleware/upload.ts` MIME whitelist: `image/jpeg | png | webp | gif | heic |
heif`. **Keep `heic` + `heif`** — iOS camera defaults to HEIC and dropping them
re-introduces the Sprint 64 D38 silent-500 upload failure. Audio whitelist
similarly covers `webm | mp4 | mpeg | ogg | wav`.

## Auth

- JWT access tokens (15 min) + refresh tokens. Refresh endpoint at `/api/auth/refresh`.
- Google OAuth verify (`google-auth-library`) — **verifyIdToken `audience` MUST be an
  array of all platform client IDs**. Adding a new OAuth platform (iOS/Android/Web)
  → update the audience array. Single string causes `400 "Audience is not a valid
  client ID"`.
- Apple Sign In (`apple-signin-auth`).

## Database

- Prisma client singleton in `src/utils/prisma.ts`. Import from there — never
  `new PrismaClient()`.
- Schema at `prisma/schema.prisma`. After changes: `npx prisma migrate dev` +
  `npx prisma generate`.
- **After `schema.prisma` edit or `prisma generate` — `pm2 restart memoura-dev-api`
  manually.** `tsx watch` only watches `src/`, not `node_modules/.prisma/client/`.
  The process keeps the old Prisma engine loaded → every query on a touched model
  hits a schema the engine no longer knows about → Postgres 500 → mobile sees
  "Mạng đang trục trặc". Reverting the schema file alone does NOT fix it — the
  engine is still cached in the running process. Sprint 61 2026-04-20 incident:
  commit 6a5796d added `User.notificationsEnabled`, e895f78 reverted; dev-api
  kept crashing until PM2 restart.
- **Seed has `deleteMany()`**. Guard at top of `prisma/seed.ts`:
  `if (!process.env.DATABASE_URL!.includes('_dev')) process.exit(1)`.
- When making a FK nullable, add a guard middleware on every route that assumed it was
  set — otherwise existing code path-matches `undefined`.
- **Adding a NOT NULL FK to a populated table — never one shot.** Use the 4-step
  pattern shown by `prisma/migrations/20260424080000_add_moment_author_id/migration.sql`
  (Sprint 64 T387): (1) add column nullable, (2) backfill rows with the right
  source row (e.g. earliest-joined user of the couple via `ORDER BY createdAt ASC
  LIMIT 1`), (3) `DO $$ ... RAISE EXCEPTION` sanity check that aborts if any row
  is still NULL, (4) `ALTER ... SET NOT NULL` + add the FK + index. Apply manually
  on prod (`psql -p 5433 -f migration.sql`) and register in `_prisma_migrations`
  with a hand-rolled UUID — `deploy up` does NOT run `prisma migrate deploy`.

## Cron jobs

Registered in `src/services/CronService.ts` via `CronService.registerCrons()`:

| Job            | Schedule         | Timezone         |
| -------------- | ---------------- | ---------------- |
| Letter delivery| every minute     | Asia/Ho_Chi_Minh |
| Date reminder  | 6 AM daily       | Asia/Ho_Chi_Minh |
| Monthly recap  | last day 9 AM    | Asia/Ho_Chi_Minh |
| Weekly recap   | Mon 9 AM         | Asia/Ho_Chi_Minh |
| Daily Q reminder | 8 AM daily     | Asia/Ho_Chi_Minh |
| Daily Q streak | midnight daily   | Asia/Ho_Chi_Minh |

All crons use `Asia/Ho_Chi_Minh`.

## VN day-number math (Sprint 66 T429)

Use `src/utils/dateVN.ts` for ANY feature keyed on the VN calendar day —
streak counters, daily question rotation, day-bucketed records, "today vs
yesterday" comparisons. Helpers:

| Function          | Purpose                                              |
| ----------------- | ---------------------------------------------------- |
| `dayNumberVN(d?)` | Days-since-epoch in VN (UTC+7 fixed offset)          |
| `toLocalIso(d?)`  | `'YYYY-MM-DD'` for the VN day containing `d`         |
| `parseLocalIso`   | UTC instant of VN midnight on a given ISO date       |
| `startOfDayVN(d?)`| UTC instant of VN midnight (round-trip via toLocalIso)|

**Why:** raw `Date.now() / msPerDay` is UTC-keyed. A cron at VN midnight
(`Asia/Ho_Chi_Minh '0 0 * * *'`) fires at UTC 17:00 of the previous UTC
day, so `floor(Date.now()/msPerDay) - 1` points at the WRONG question /
record for "yesterday VN." The `dayNumberVN` helper applies +7h offset
before the floor; cron and realtime paths now agree on which VN day they
mean. Sprint 66 streak reset bug — couples in VN had their streak reset
to 0 every night because the cron used UTC day numbers.

**Race-safe streak pattern:** wrap upserts in `prisma.$transaction` and
guard idempotency on `lastAnsweredDate.getTime() === <expectedVN>.getTime()`
so realtime + cron paths can both fire for the same logical event without
double-incrementing. See `DailyQuestionService.updateStreakOnBothAnswered`
+ `updateStreaksForAllCouples` for the canonical shape.

VN has no DST → fixed +7h offset is sufficient. If we ever need
non-VN couples, swap to `Intl.DateTimeFormat` with the requested zone.

## Push notifications (Sprint 65 — shipped)

`src/services/PushService.ts` — Lazy singleton apn.Provider using `node-apn` v2 + Apple `.p8` key for iOS native APNs delivery. Web push retains VAPID + Firebase Admin (kept for browser PWA). `sendMobilePushNotification(userId, title, body, link)` sends to all `mobile_push_tokens` rows for user, prunes BadDeviceToken / Unregistered automatically.

**Required env vars** (BE prod + dev):
```
APNS_KEY_PATH=/Users/.../AuthKey.p8     # absolute path to .p8
APNS_KEY_ID=<10-char Key ID from filename AuthKey_<id>.p8>
APNS_TEAM_ID=DHGY59PZWW
APNS_BUNDLE_ID=com.hungphu.memoura
APNS_PRODUCTION=true                    # match IPA build type, NOT BE env!
FIREBASE_SERVICE_ACCOUNT_JSON='{...}'   # web push fallback only
```

**`APNS_PRODUCTION` rule:** matches IPA build TYPE, not BE environment.
- Ad-hoc / TestFlight / Release IPA users install → `APNS_PRODUCTION=true` even on dev BE
- Xcode debug build (developer "Run" only) → `APNS_PRODUCTION=false`
- Mismatch returns `BadDeviceToken` 400 silently — push never lands.

**Mobile token format:** `getDevicePushTokenAsync()` on iOS returns RAW APNs hex token (64 chars). NOT compatible with Firebase Admin `admin.messaging().send({ token })` (needs FCM registration token). Sprint 65 D75 swap from Firebase Admin → node-apn direct because of this.

**APNs payload format for deep-link:**
```ts
note.payload = { link: '/letters/<id>', type: 'love_letter' };  // root-level custom keys
```
node-apn emits `{ link, type, aps: {...} }` JSON. iOS expo-notifications stores these at `notification.request.trigger.payload`, NOT `content.data` (which is null for raw APNs delivery — only Expo Push Service tokens populate `content.data`).

## ⚠️ deploy CLI clobbers `.env`

`deploy up memoura-api --env <env>` REPLACES `~/deployments/<env>/memoura-api/.env` from source `.env.development` / `.env` — **manually appended env vars are LOST**. After any `deploy up`, RE-APPEND `FIREBASE_SERVICE_ACCOUNT_JSON` + `APNS_*` vars and `pm2 restart memoura-api` (or `memoura-dev-api`). Sprint 65 hit this 3× — wrap deploy step in helper script that re-applies sensitive env. Backlog: **B-deploy-mobile-rework-wrapper** addresses this.

**Test failure on `deploy up prod`** — pre-deploy tests run with shell-inherited `DATABASE_URL` from PO test scripts (e.g., `DATABASE_URL="postgresql+asyncpg://..."` from sibling Python project). Fix: `unset DATABASE_URL` before `deploy up memoura-api --env prod`. Memory has prior lesson `feedback_shell_database_url_overrides_dotenv`.

## AI

`xAI` calls use `grok-4-1-fast-non-reasoning` (Boss preference, not `grok-3-mini`).
OpenAI fallback in `src/services/AiService.ts`.

## Tests

- `src/__tests__/api.test.ts` — Supertest integration against real dev DB.
- Run `npm test` after backend changes; CI won't catch what tests don't cover.
- Re-seed after restarting `dev-api` if tests depend on seeded data: tsx watch restarts
  may lose in-memory-ish state.
- Never mock the DB — Boss rule, run against `love_scrum_dev`.

## Scripts

```bash
npm run dev          # tsx watch, port 5006
npm run build        # tsc → dist/
npm test             # Jest + Supertest (dev DB)
npm run lint         # ESLint
npm run seed:dev     # Seed dev DB
```

## AI model choice

Use `grok-4-1-fast-non-reasoning` for xAI calls. OpenAI is fallback only.
