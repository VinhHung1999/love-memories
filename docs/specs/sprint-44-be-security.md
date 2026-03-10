# Sprint 44 — Backend Security Critical Fixes

**Priority:** CRITICAL
**Scope:** Backend only — no FE changes needed
**Branch:** `sprint_44`

---

## Task 1: coupleId Enforcement on ALL Service Methods (CRITICAL)

### What
Scan **100% of `backend/src/services/`** and fix every method that accesses a record by ID without validating coupleId ownership.

### How
1. Every service method that does `findUnique({ where: { id } })`, `update({ where: { id } })`, or `delete({ where: { id } })` MUST also include `coupleId` in the where clause.
2. Controllers in `backend/src/routes/` must pass `req.user.coupleId` to these service methods.
3. `req.user` already has `{ userId, coupleId }` from auth middleware — just pass it through.

### Pattern
```typescript
// BEFORE (vulnerable)
export async function getOne(id: string) {
  const record = await prisma.moment.findUnique({ where: { id } });
  if (!record) throw new AppError(404, 'Not found');
  return record;
}

// AFTER (secure)
export async function getOne(id: string, coupleId: string) {
  const record = await prisma.moment.findFirst({ where: { id, coupleId } });
  if (!record) throw new AppError(404, 'Not found');
  return record;
}
```

Note: Use `findFirst` instead of `findUnique` when adding coupleId (Prisma requires `findUnique` to use only unique fields).

### Known Vulnerable Services (audit confirmed 56 methods)
- MomentService — getOne, update, remove, uploadPhotos, deletePhoto, uploadAudio, deleteAudio, listComments, addComment, deleteComment, toggleReaction
- FoodSpotService — getOne, update, remove, uploadPhotos, deletePhoto
- LoveLetterService — update, send, remove, uploadPhotos, deletePhoto, uploadAudio, deleteAudio
- DatePlanService — getOne, update, updateStatus, linkMoment, linkFoodSpot, updateStopCost, markStopDone, addSpot, deleteSpot, remove
- RecipeService — getOne, update, remove, addPhotos, deletePhoto
- CookingSessionService — getOne, updateStatus, toggleItem, toggleStep, uploadPhotos, rate, remove
- ExpenseService — getOne, update, remove
- SprintService — getOne, update, updateStatus, remove
- DateWishService — update, markDone, remove

**DEV MUST scan ALL services — don't rely only on this list. There may be more.**

### For sub-resources (photos, audio, comments, etc.)
When deleting a photo/audio/comment by its own ID, verify the parent record belongs to the couple:
```typescript
// Example: deletePhoto
export async function deletePhoto(photoId: string, coupleId: string) {
  const photo = await prisma.momentPhoto.findUnique({
    where: { id: photoId },
    include: { moment: { select: { coupleId: true } } }
  });
  if (!photo || photo.moment.coupleId !== coupleId) {
    throw new AppError(404, 'Not found');
  }
  await prisma.momentPhoto.delete({ where: { id: photoId } });
}
```

### Acceptance Criteria
- [ ] 100% of service methods that access records by ID also validate coupleId
- [ ] Tests: create 2 couples, verify couple A CANNOT access couple B's data (return 404, not 403)
- [ ] Return 404 (not 403) to avoid revealing that the record exists

---

## Task 2: Notification Access Control

### What
`NotificationService.markRead()` and `remove()` must verify notification belongs to requesting user.

### How
Add `userId` parameter and include in where clause:
```typescript
export async function markRead(id: string, userId: string) {
  const notif = await prisma.notification.findFirst({ where: { id, userId } });
  if (!notif) throw new AppError(404, 'Not found');
  return await prisma.notification.update({ where: { id }, data: { read: true } });
}
```

### Acceptance Criteria
- [ ] markRead and remove verify userId ownership
- [ ] Test: user A cannot mark/delete user B's notifications

---

## Task 3: CORS Whitelist

### What
Restrict CORS to our domains only.

### How
```typescript
// backend/src/index.ts
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://love-scrum.hungphu.work',
  'https://dev-love-scrum.hungphu.work'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
```

Add `ALLOWED_ORIGINS` to `.env` and `.env.development`.

### Acceptance Criteria
- [ ] Requests from unlisted origins are blocked (browser)
- [ ] Mobile app (non-browser) still works fine
- [ ] Env var configurable

---

## Task 4: Rate Limiting

### What
Install `express-rate-limit` and apply to sensitive endpoints.

### How
```bash
cd backend && npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

// Global: 100 req/min per IP
const globalLimiter = rateLimit({ windowMs: 60_000, max: 100 });
app.use('/api', globalLimiter);

// Auth: 5 req/15min per IP
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 5 });
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/google', authLimiter);

// AI: 10 req/min per IP
const aiLimiter = rateLimit({ windowMs: 60_000, max: 10 });
app.use('/api/ai', aiLimiter);

// Upload: 30 req/min per IP
const uploadLimiter = rateLimit({ windowMs: 60_000, max: 30 });
app.use('/api/*/photos', uploadLimiter);
app.use('/api/*/audio', uploadLimiter);
```

### Acceptance Criteria
- [ ] Login endpoint: max 5 requests per 15 min per IP
- [ ] AI endpoints: max 10 requests per min per IP
- [ ] Global: max 100 requests per min per IP
- [ ] Returns 429 Too Many Requests when exceeded
- [ ] Test: verify rate limit triggers

---

## Task 5: Helmet Security Headers

### What
Install `helmet` for standard HTTP security headers.

### How
```bash
cd backend && npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### Acceptance Criteria
- [ ] Response includes: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security, etc.
- [ ] Existing functionality not broken (test all endpoints)

---

## Task 6: Request Body Size Limit

### What
Set explicit JSON body size limit.

### How
```typescript
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
```

### Acceptance Criteria
- [ ] Request > 1MB returns 413 Payload Too Large
- [ ] Normal requests still work

---

## Task 7: Environment Variable Validation

### What
Validate required env vars on startup. Fail fast if missing.

### How
Create `backend/src/utils/validateEnv.ts`:
```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CDN_ENDPOINT: z.string().optional(),
  CDN_ACCESS_KEY: z.string().optional(),
  CDN_SECRET_KEY: z.string().optional(),
  CDN_BUCKET: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Missing/invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }
}
```

Call `validateEnv()` at top of `index.ts`.

### Acceptance Criteria
- [ ] Server refuses to start if JWT_SECRET or DATABASE_URL missing
- [ ] Clear error message showing which vars are missing
- [ ] Existing valid configs still start normally

---

## Definition of Done

- [ ] All 7 tasks implemented
- [ ] `npm test` passes — including NEW tests for coupleId isolation
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No breaking changes to API responses (FE compatibility maintained)
