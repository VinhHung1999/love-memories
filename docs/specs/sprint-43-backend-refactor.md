# Sprint 43 — Backend Refactor: Clean Architecture

**Goal:** Refactor backend from monolithic routes to 3-layer architecture (Routes -> Controllers -> Services). Zero behavior change — all existing API contracts preserved.

---

## 1. Current State (Problems)

```
src/
  routes/         <-- 27 files, 4500+ LOC, ALL logic here
  controllers/    <-- EMPTY folder
  middleware/     <-- 2 files (auth, upload)
  utils/          <-- 6 files (prisma, validation, cdn, auth, geo, notifications)
```

**Issues:**
- Routes contain validation + business logic + DB queries + response formatting
- No separation of concerns
- Hard to test business logic in isolation
- `controllers/` exists but empty
- Cron jobs inline in `index.ts` (60+ lines)
- No global error handling — each route has its own try/catch
- Validation schemas mixed in single `utils/validation.ts`

---

## 2. Target Structure

```
backend/src/
  index.ts                     # Express app, middleware registration, route mounting

  routes/                      # THIN — only path + method + middleware chain
    index.ts                   # Master router (mounts all sub-routers)
    moments.ts
    foodspots.ts
    loveLetters.ts
    recipes.ts
    cookingSessions.ts
    auth.ts
    expenses.ts
    datePlans.ts
    dateWishes.ts
    goals.ts
    sprints.ts
    profile.ts
    couple.ts
    notifications.ts
    push.ts
    achievements.ts
    recap.ts
    ai.ts
    settings.ts
    tags.ts
    share.ts
    map.ts
    proxy.ts                   # Merge proxy-image + proxy-audio
    geo.ts                     # Merge geocode + resolveLocation

  controllers/                 # HTTP layer — parse req, call service, send res
    MomentController.ts
    FoodSpotController.ts
    LoveLetterController.ts
    RecipeController.ts
    CookingSessionController.ts
    AuthController.ts
    ExpenseController.ts
    DatePlanController.ts
    DateWishController.ts
    GoalController.ts
    SprintController.ts
    ProfileController.ts
    CoupleController.ts
    NotificationController.ts
    PushController.ts
    AchievementController.ts
    RecapController.ts
    AiController.ts
    SettingController.ts
    TagController.ts
    ShareController.ts
    MapController.ts
    ProxyController.ts
    GeoController.ts

  services/                    # Business logic — NO req/res, pure functions
    MomentService.ts
    FoodSpotService.ts
    LoveLetterService.ts
    RecipeService.ts
    CookingSessionService.ts
    AuthService.ts
    ExpenseService.ts
    DatePlanService.ts
    DateWishService.ts
    GoalService.ts
    SprintService.ts
    ProfileService.ts
    CoupleService.ts
    NotificationService.ts
    PushService.ts
    AchievementService.ts
    RecapService.ts
    AiService.ts
    ShareService.ts
    MapService.ts
    ProxyService.ts
    GeoService.ts
    CronService.ts             # Extracted from index.ts

  middleware/
    auth.ts                    # JWT requireAuth (existing)
    upload.ts                  # Multer config (existing)
    errorHandler.ts            # NEW: global error handler
    asyncHandler.ts            # NEW: async wrapper for controllers
    validate.ts                # NEW: Zod validation middleware factory

  validators/                  # Zod schemas — one per module
    momentSchemas.ts
    foodspotSchemas.ts
    loveLetterSchemas.ts
    recipeSchemas.ts
    cookingSessionSchemas.ts
    authSchemas.ts
    expenseSchemas.ts
    datePlanSchemas.ts
    dateWishSchemas.ts
    goalSchemas.ts
    sprintSchemas.ts
    profileSchemas.ts
    coupleSchemas.ts
    settingSchemas.ts
    tagSchemas.ts
    shareSchemas.ts
    aiSchemas.ts

  types/
    errors.ts                  # AppError class
    express.d.ts               # req.user augmentation (if needed)

  utils/
    prisma.ts                  # Singleton (keep)
    cdn.ts                     # CDN upload/delete (keep)
    auth.ts                    # JWT + Google OAuth helpers (keep)
    geo.ts                     # Geocoding helpers (keep)
    notifications.ts           # createNotification helper (keep)

  __tests__/
    api.test.ts                # Integration tests (keep, update imports if needed)
```

---

## 3. Architecture Flow

```
                     REQUEST
                        |
                        v
+---------------------------------------------------+
|                    index.ts                        |
|  app.use(cors, json, static)                      |
|  app.use(errorHandler)  <-- LAST middleware        |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|               routes/index.ts                      |
|  Mounts all sub-routers with prefixes              |
|  /api/moments  -> momentRoutes                     |
|  /api/auth     -> authRoutes                       |
|  ...                                               |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|            routes/moments.ts                       |
|                                                    |
|  router.get('/', MomentController.list)            |
|  router.get('/:id', MomentController.getOne)       |
|  router.post('/',                                  |
|    upload.array('photos', 10),                     |
|    validate(momentSchemas.create),                 |
|    MomentController.create                         |
|  )                                                 |
|                                                    |
|  NO logic here — only wiring                       |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|         controllers/MomentController.ts            |
|                                                    |
|  export const list = asyncHandler(async (req,res) =|
|    const coupleId = req.user.coupleId              |
|    const moments = await MomentService.list(       |
|      coupleId)                                     |
|    res.json(moments)                               |
|  })                                                |
|                                                    |
|  Extracts HTTP data -> calls service -> sends res  |
|  NO try/catch (asyncHandler + errorHandler do it)  |
+---------------------------------------------------+
                        |
                        v
+---------------------------------------------------+
|           services/MomentService.ts                |
|                                                    |
|  export async function list(coupleId: string) {    |
|    return prisma.moment.findMany({                 |
|      where: { coupleId },                          |
|      include: { photos: true, ... },               |
|      orderBy: { date: 'desc' },                    |
|    })                                              |
|  }                                                 |
|                                                    |
|  Pure business logic — no req/res knowledge        |
|  Throws AppError for error cases                   |
|  Calls prisma directly (no repo layer)             |
+---------------------------------------------------+
                        |
                   (if error)
                        v
+---------------------------------------------------+
|          middleware/errorHandler.ts                 |
|                                                    |
|  ZodError -> 400 { error, details }                |
|  AppError -> err.statusCode { error, code }        |
|  Unknown  -> 500 { error: 'Internal error' }      |
+---------------------------------------------------+
```

---

## 4. Database Schema (Current — 28 Models)

```
Couple (root)
  |-- User (1:N)
  |     |-- MomentComment (1:N)
  |     |-- Notification (1:N)
  |     |-- PushSubscription (1:N)
  |     |-- MobilePushToken (1:N)
  |     |-- RefreshToken (1:N)
  |     |-- LoveLetter (sent, 1:N)
  |     +-- LoveLetter (received, 1:N)
  |
  |-- Moment (1:N)
  |     |-- MomentPhoto (1:N, cascade)
  |     |-- MomentAudio (1:N, cascade)
  |     |-- MomentComment (1:N, cascade)
  |     +-- MomentReaction (1:N, cascade)
  |
  |-- FoodSpot (1:N)
  |     |-- FoodSpotPhoto (1:N, cascade)
  |     +-- Recipe (1:N)
  |
  |-- Recipe (1:N)
  |     |-- RecipePhoto (1:N, cascade)
  |     +-- CookingSessionRecipe (1:N)
  |
  |-- CookingSession (1:N)
  |     |-- CookingSessionRecipe (1:N, cascade)
  |     |-- CookingSessionItem (1:N, cascade)
  |     |-- CookingSessionStep (1:N, cascade)
  |     +-- CookingSessionPhoto (1:N, cascade)
  |
  |-- LoveLetter (1:N)
  |     |-- LetterPhoto (1:N, cascade)
  |     +-- LetterAudio (1:N, cascade)
  |
  |-- Sprint (1:N)
  |     +-- Goal (1:N, cascade)
  |
  |-- Goal (1:N)
  |
  |-- DatePlan (1:N)
  |     +-- DatePlanStop (1:N, cascade)
  |           +-- DatePlanSpot (1:N, cascade)
  |
  |-- DateWish (1:N)
  |-- Expense (1:N)
  |-- Tag (1:N, unique [name, coupleId])
  |-- AppSetting (1:N, unique [key, coupleId])
  |-- Achievement (1:N, unique [key, coupleId])
  |-- CustomAchievement (1:N)
  +-- ShareLink (1:N)
```

**Key relationships:**
- ALL data scoped by `coupleId` (multi-tenant)
- Cascade delete on child media (photos, audio)
- `Sprint -> Goal` cascade delete
- `DatePlan -> DatePlanStop -> DatePlanSpot` cascade chain
- `User` linked to `LoveLetter` via sender/recipient (2 relations)
- `Recipe` optionally linked to `FoodSpot`

---

## 5. Complete API Reference (160+ endpoints)

### AUTH `/api/auth` (PUBLIC)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /register | `{email, password, name, inviteCode?, coupleName?}` | `{token, accessToken, refreshToken, user}` |
| POST | /login | `{email, password}` | `{token, accessToken, refreshToken, user}` |
| POST | /refresh | `{refreshToken}` | `{token, accessToken, refreshToken, user}` |
| POST | /logout | `{refreshToken?}` | `{ok: true}` |
| GET | /me | - | `{id, email, name, avatar, coupleId, googleId}` |
| POST | /google | `{idToken}` | `{needsCouple, googleProfile}` OR `{token, ...user}` |
| POST | /google/complete | `{idToken, inviteCode?, coupleName?}` | `{token, ...user}` |
| POST | /google/link | `{idToken}` | `{ok: true, googleId}` |

### MOMENTS `/api/moments` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | / | - | `Moment[]` (with photos, audios, comments, reactions) |
| GET | /:id | - | `Moment` (full) |
| POST | / | `{title, description, date, location?, lat?, lng?, tags?}` | `Moment` |
| PUT | /:id | `{title?, description?, date?, location?, lat?, lng?, tags?}` | `Moment` |
| DELETE | /:id | - | `{message}` |
| POST | /:id/photos | multipart `photos[]` (max 10) | `MomentPhoto[]` |
| DELETE | /:id/photos/:photoId | - | `{message}` |
| POST | /:id/audio | multipart `audio` + `duration?` | `MomentAudio` |
| DELETE | /:id/audio/:audioId | - | `{message}` |
| GET | /:id/comments | - | `MomentComment[]` |
| POST | /:id/comments | `{author, content}` | `MomentComment` |
| DELETE | /:id/comments/:commentId | - | 204 |
| POST | /:id/reactions | `{emoji, author}` | `MomentReaction[]` |

### FOOD SPOTS `/api/foodspots` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | / | - | `FoodSpot[]` (with photos) |
| GET | /random | `?lat&lng&radius` | `FoodSpot` + distance |
| GET | /:id | - | `FoodSpot` (with photos) |
| POST | / | `{name, description?, location?, lat?, lng?, rating?, tags?}` | `FoodSpot` |
| PUT | /:id | same fields optional | `FoodSpot` |
| DELETE | /:id | - | `{message}` |
| POST | /:id/photos | multipart `photos[]` (max 10) | `FoodSpotPhoto[]` |
| DELETE | /:id/photos/:photoId | - | `{message}` |

### LOVE LETTERS `/api/love-letters` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /received | - | `LoveLetter[]` (DELIVERED+READ only) |
| GET | /sent | - | `LoveLetter[]` (any status) |
| GET | /unread-count | - | `{count}` |
| GET | /:id | - | `LoveLetter` (auto-mark READ if recipient) |
| POST | / | `{title, content, mood?, scheduledAt?, sendNow?}` | `LoveLetter` |
| PUT | /:id | `{title?, content?, mood?, scheduledAt?}` | `LoveLetter` |
| PUT | /:id/send | - | `LoveLetter` (DELIVERED) |
| DELETE | /:id | - | 204 |
| POST | /:id/photos | multipart `photos[]` (max 5) | `LetterPhoto[]` |
| DELETE | /:id/photos/:photoId | - | 204 |
| POST | /:id/audio | multipart `audio` + `duration?` | `LetterAudio` |
| DELETE | /:id/audio/:audioId | - | 204 |

### RECIPES `/api/recipes` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | / | - | `Recipe[]` (with photos, foodSpot) |
| GET | /:id | - | `Recipe` (full) |
| POST | / | `{title, description?, ingredients[], ingredientPrices?, steps[], stepDurations?, tags?, notes?, foodSpotId?}` | `Recipe` |
| PUT | /:id | same fields optional | `Recipe` |
| DELETE | /:id | - | `{message}` |
| POST | /:id/photos | multipart `photos[]` (max 10) | `RecipePhoto[]` |
| DELETE | /:id/photos/:photoId | - | `{message}` |

### COOKING SESSIONS `/api/cooking-sessions` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /active | - | `CookingSession` or null |
| GET | / | - | `CookingSession[]` (with recipes, items, steps, photos) |
| GET | /:id | - | `CookingSession` (full) |
| POST | / | `{recipeIds[]}` | `CookingSession` (auto-gen items+steps) |
| PUT | /:id/status | `{status, notes?}` | `CookingSession` |
| PUT | /:id/items/:itemId | `{checked}` | `CookingSessionItem` |
| PUT | /:id/steps/:stepId | `{checked, checkedBy?}` | `CookingSessionStep` |
| POST | /:id/photos | multipart `photos[]` (max 10) | `CookingSessionPhoto[]` |
| PATCH | /:id/rate | `{rating: 1-5}` | `CookingSession` |
| DELETE | /:id | - | `{message}` |

### DATE PLANS `/api/date-plans` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | / | - | `DatePlan[]` (with stops, auto-update statuses) |
| GET | /:id | - | `DatePlan` (with stops) |
| POST | / | `{title, date, notes?, stops[]}` | `DatePlan` |
| PUT | /:id | `{title?, date?, notes?, stops?}` | `DatePlan` |
| PUT | /:id/status | `{status}` | `DatePlan` |
| PUT | /:id/stops/:stopId/moment | `{momentId}` | `DatePlanStop` |
| PUT | /:id/stops/:stopId/foodspot | `{foodSpotId}` | `DatePlanStop` |
| PUT | /:id/stops/:stopId/cost | `{cost}` | `DatePlanStop` |
| PUT | /:id/stops/:stopId/done | - | `DatePlan` |
| POST | /:id/stops/:stopId/spots | `{title, address?, lat?, lng?, url?, notes?, order?}` | `DatePlanSpot` |
| DELETE | /:id/stops/:stopId/spots/:spotId | - | 204 |
| DELETE | /:id | - | 204 |

### DATE WISHES `/api/date-wishes` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | / | - | `DateWish[]` |
| POST | / | `{title, description?, category, address?, lat?, lng?, url?, tags?}` | `DateWish` |
| PUT | /:id | same fields optional | `DateWish` |
| PUT | /:id/done | `{linkedMomentId?, linkedFoodSpotId?}` | `DateWish` |
| DELETE | /:id | - | 204 |

### EXPENSES `/api/expenses` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | / | `?month=YYYY-MM&datePlanId=uuid` | `Expense[]` |
| GET | /stats | `?month=YYYY-MM` | `{total, byCategory, count, month}` |
| GET | /daily-stats | `?month=YYYY-MM` | `{month, days[]}` |
| GET | /limits | - | `{category: limit}` |
| PUT | /limits | `{category: limit}` | limits object |
| POST | /upload-receipt | multipart `photo` | `{url}` |
| GET | /:id | - | `Expense` |
| POST | / | `{amount, description, category, date, datePlanId?, receiptUrl?, notes?}` | `Expense` |
| PUT | /:id | same fields optional | `Expense` |
| DELETE | /:id | - | `{message}` |

### GOALS `/api/goals` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /backlog | - | `Goal[]` |
| GET | /sprint/:sprintId | - | `Goal[]` |
| POST | / | `{title, description?, priority?}` | `Goal` |
| POST | /sprint/:sprintId | `{title, description?, priority?}` | `Goal` |
| PATCH | /reorder | `{goals: [{id, order, status?}]}` | `{message}` |
| PUT | /:id | `{title?, description?, priority?, status?}` | `Goal` |
| PATCH | /:id/status | `{status}` | `Goal` |
| PATCH | /:id/assign | `{sprintId}` | `Goal` |
| DELETE | /:id | - | `{message}` |

### SPRINTS `/api/sprints` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | / | - | `Sprint[]` (with goals) |
| GET | /active | - | `Sprint` or 404 |
| GET | /:id | - | `Sprint` (with goals) |
| POST | / | `{title, description?, startDate?, endDate?, status?}` | `Sprint` |
| PUT | /:id | same fields optional | `Sprint` |
| PATCH | /:id/status | `{status}` | `Sprint` |
| DELETE | /:id | - | `{message}` |

### RECAP `/api/recap` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /weekly | `?week=YYYY-Www` | `{week, startDate, endDate, moments, cooking, ...}` |
| GET | /monthly | `?month=YYYY-MM` | `{month, startDate, endDate, moments, cooking, ...}` |
| GET | /monthly/caption | `?month=YYYY-MM` | `{intro, outro}` |

### MAP `/api/map` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /pins | - | `Pin[]` `{type, lat, lng, title, thumbnail, tags}` |

### ACHIEVEMENTS `/api/achievements` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | / | - | `Achievement[]` (auto-unlock new ones) |

### NOTIFICATIONS `/api/notifications` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | / | - | `Notification[]` (max 50, newest first) |
| GET | /unread-count | - | `{count}` |
| PUT | /read-all | - | `{ok: true}` |
| PUT | /:id/read | - | `Notification` |
| DELETE | /:id | - | 204 |

### PUSH `/api/push` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /vapid-key | - | `{publicKey}` |
| POST | /subscribe | `{endpoint, keys: {p256dh, auth}}` | `{ok: true}` |
| POST | /unsubscribe | `{endpoint}` | `{ok: true}` |
| POST | /mobile-subscribe | `{token, deviceType}` | `{ok: true}` |
| POST | /mobile-unsubscribe | `{token}` | `{ok: true}` |

### AI `/api/ai` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | /generate-recipe | `{mode, input}` | `Recipe JSON` |
| POST | /scan-receipt | multipart `photo` | `{amount, description, category, date, items?}` |

### PROFILE `/api/profile` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| PUT | / | `{name}` | `User` |
| POST | /avatar | multipart `avatar` | `User` |

### COUPLE `/api/couple` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | / | - | `Couple` (with users) |
| PUT | / | `{name?, anniversaryDate?}` | `Couple` |
| POST | /generate-invite | - | `{inviteCode}` |

### SETTINGS `/api/settings` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /:key | - | `{key, value}` |
| PUT | /:key | `{value}` | `Setting` |

### TAGS `/api/tags` (AUTH)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | / | - | `Tag[]` |
| PUT | /:name | `{icon?, color?}` | `Tag` |

### SHARE `/api/share` (MIXED)

| Method | Path | Body | Auth? | Response |
|--------|------|------|-------|----------|
| POST | / | `{type, targetId}` | AUTH | `ShareLink` |
| GET | / | - | AUTH | `ShareLink[]` |
| DELETE | /:token | - | AUTH | `{message}` |
| GET | /:token/image | `?url=` | PUBLIC | image binary |
| GET | /:token | - | PUBLIC | `{type, data, coupleName, sharedAt}` |

### PROXY (PUBLIC/AUTH)

| Method | Path | Auth? | Response |
|--------|------|-------|----------|
| GET | /api/proxy-image?url= | AUTH | image binary |
| GET | /api/proxy-audio?url= | PUBLIC | audio binary |

### GEO (PUBLIC)

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | /api/geocode/forward | `?q&proximity&limit` | Mapbox features |
| GET | /api/geocode/reverse | `?lat&lng` | Mapbox features |
| POST | /api/resolve-location | `{url}` | `{latitude, longitude, name}` |

### HEALTH (PUBLIC)

| Method | Path | Response |
|--------|------|----------|
| GET | /api/health | `{status: "ok", timestamp}` |

---

## 6. Cron Jobs (Extract to CronService)

| Schedule | Timezone | What |
|----------|----------|------|
| `* * * * *` | - | Deliver SCHEDULED love letters where `scheduledAt <= now` |
| `0 6 * * *` | Asia/Ho_Chi_Minh | Daily date plan reminder notification |
| `0 9 28-31 * *` | Asia/Ho_Chi_Minh | Monthly recap notification (last day check) |
| `0 9 * * 1` | Asia/Ho_Chi_Minh | Weekly recap notification (Monday) |

---

## 7. Refactor Plan (Phases)

### Phase 0: Infrastructure (no logic changes)
1. Create `middleware/asyncHandler.ts` — async wrapper
2. Create `middleware/errorHandler.ts` — global error handler
3. Create `middleware/validate.ts` — Zod validation middleware factory
4. Create `types/errors.ts` — `AppError` class
5. Register `errorHandler` as last middleware in `index.ts`
6. Create `routes/index.ts` — master router (move all `app.use` from index.ts)

### Phase 1: Template module (1 module as reference)
- Pick `expenses` (medium complexity, 231 LOC)
- Create `controllers/ExpenseController.ts`
- Create `services/ExpenseService.ts`
- Create `validators/expenseSchemas.ts`
- Refactor `routes/expenses.ts` to thin router
- Run tests — verify zero behavior change

### Phase 2: Simple modules
- `settings`, `tags`, `profile`, `couple`, `notifications`, `map`, `achievements`
- These are small (50-150 LOC), fast to migrate

### Phase 3: Medium modules
- `sprints`, `goals`, `dateWishes`, `recipes`, `push`
- 100-250 LOC each

### Phase 4: Complex modules
- `moments` (304 LOC) — photos, audio, comments, reactions
- `foodspots` (184 LOC) — photos
- `loveLetters` (375 LOC) — photos, audio, status machine
- `datePlans` (368 LOC) — stops, spots, auto-complete
- `cookingSessions` (280 LOC) — multi-recipe merge, steps

### Phase 5: Heavy/special modules
- `auth` (381 LOC) — Google OAuth, JWT, refresh tokens
- `recap` (369 LOC) — complex queries, aggregation
- `ai` (241 LOC) — external API calls
- `share` (172 LOC) — mixed public/auth

### Phase 6: Cleanup
- Merge `proxy-image` + `proxy-audio` -> `routes/proxy.ts` + `ProxyController`
- Merge `geocode` + `resolveLocation` -> `routes/geo.ts` + `GeoController`
- Extract cron jobs from `index.ts` -> `services/CronService.ts`
- Move Zod schemas from `utils/validation.ts` -> `validators/` (split per module)
- Delete empty/unused files
- Update `backend/CLAUDE.md` with new structure

### Phase 7: Verify
- Run full test suite: `npm test`
- Run lint: `npm run lint`
- Run build: `npm run build`
- Manual smoke test on dev environment
- Verify all 160+ endpoints still work (use API reference above)

---

## 8. Key Rules

1. **ZERO behavior change** — same request in, same response out
2. **No new dependencies** — `express-async-errors` optional, can use custom `asyncHandler`
3. **No DB changes** — schema stays exactly the same
4. **No repository layer** — services call Prisma directly (don't over-engineer)
5. **Tests must pass at every phase** — refactor incrementally
6. **Each phase = 1 commit** — easy to revert if needed

---

## 9. Example: Before vs After

### BEFORE (`routes/expenses.ts` — everything in one file)
```ts
router.get('/', async (req, res) => {
  try {
    const coupleId = req.user.coupleId;
    const { month, datePlanId } = req.query;
    // ... 30 lines of query building + prisma call
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch' });
  }
});
```

### AFTER (3 files, each with single responsibility)

**`routes/expenses.ts`**
```ts
router.get('/', ExpenseController.list);
router.post('/', validate(expenseSchemas.create), ExpenseController.create);
```

**`controllers/ExpenseController.ts`**
```ts
export const list = asyncHandler(async (req, res) => {
  const { month, datePlanId } = req.query;
  const expenses = await ExpenseService.list(req.user.coupleId, { month, datePlanId });
  res.json(expenses);
});
```

**`services/ExpenseService.ts`**
```ts
export async function list(coupleId: string, filters: ExpenseFilters) {
  const where: any = { coupleId };
  if (filters.month) { /* date range */ }
  if (filters.datePlanId) { where.datePlanId = filters.datePlanId; }
  return prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
}
```

---

## 10. Acceptance Criteria

- [ ] All 160+ endpoints return identical responses before/after
- [ ] All existing tests pass
- [ ] Lint passes
- [ ] Build passes
- [ ] `controllers/` folder has 24 controller files (no empty folder)
- [ ] `services/` folder has 23 service files
- [ ] `validators/` folder has 17 schema files
- [ ] `routes/` files are thin (< 50 LOC each, only wiring)
- [ ] No try/catch in routes or controllers (global errorHandler handles it)
- [ ] Cron jobs extracted to `CronService.ts`
- [ ] `utils/validation.ts` schemas moved to `validators/`
- [ ] `proxy-image` + `proxy-audio` merged
- [ ] `geocode` + `resolveLocation` merged
- [ ] `backend/CLAUDE.md` updated with new structure
