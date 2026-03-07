# Backend — Express + TypeScript + Prisma

## Commands
```bash
npm run dev          # Dev server (tsx watch, port 5006 dev / 5005 prod)
npm run build        # tsc → dist/
npm test             # Jest + Supertest (uses dev DB)
npm run lint         # ESLint
npm run seed:dev     # Seed dev database
```

## Structure
```
src/
├── index.ts              # Express app setup, app.listen guard
├── routes/               # Thin routers — wire middleware + controllers (one file per domain)
│   ├── index.ts          # Master router mounting all routes
│   ├── moments.ts        # CRUD moments + photos + audio
│   ├── profile.ts        # User profile + avatar
│   ├── couple.ts         # Couple info + partner
│   ├── loveLetters.ts    # Letters + media
│   ├── recipes.ts        # Recipes
│   ├── cookingSessions.ts # Cooking sessions
│   ├── goals.ts          # Goals (kanban)
│   ├── sprints.ts        # Sprint management
│   ├── map.ts            # Map pins
│   ├── datePlans.ts      # Date planner
│   ├── dateWishes.ts     # Date wishes bucket list
│   ├── recap.ts          # Weekly + monthly recap
│   ├── achievements.ts   # Gamification badges
│   ├── notifications.ts  # In-app notifications
│   ├── push.ts           # Web push subscriptions
│   ├── settings.ts       # Key-value settings store
│   ├── tags.ts           # Tags
│   ├── expenses.ts       # Expense tracking
│   ├── ai.ts             # AI features (xAI/OpenAI)
│   ├── auth.ts           # Authentication
│   ├── share.ts          # Public share links
│   ├── proxy.ts          # CDN image + audio proxy (both in one file)
│   └── location.ts       # Geocode + resolve-location (both in one file)
├── controllers/          # HTTP layer — parse req, call service, send res
│   ├── MomentController.ts
│   ├── FoodSpotController.ts
│   ├── LoveLetterController.ts
│   ├── DatePlanController.ts
│   ├── CookingSessionController.ts
│   ├── SprintController.ts
│   ├── GoalController.ts
│   ├── RecipeController.ts
│   ├── AchievementController.ts
│   ├── AuthController.ts
│   ├── RecapController.ts
│   ├── AiController.ts
│   ├── ShareController.ts
│   └── ... (one per domain)
├── services/             # Business logic + Prisma calls
│   ├── MomentService.ts
│   ├── FoodSpotService.ts
│   ├── LoveLetterService.ts
│   ├── DatePlanService.ts
│   ├── CookingSessionService.ts
│   ├── AuthService.ts
│   ├── RecapService.ts
│   ├── AiService.ts
│   ├── ShareService.ts
│   ├── CronService.ts    # All cron job registrations
│   ├── PushService.ts    # VAPID + Firebase Admin singleton
│   ├── AchievementService.ts  # ACHIEVEMENT_DEFS + unlock logic
│   └── ... (one per domain)
├── validators/           # Zod schemas (one file per domain)
│   ├── momentSchemas.ts
│   ├── foodspotSchemas.ts
│   ├── loveLetterSchemas.ts
│   ├── cookingSessionSchemas.ts
│   ├── expenseSchemas.ts
│   ├── sprintSchemas.ts
│   ├── goalSchemas.ts
│   ├── recipeSchemas.ts
│   ├── authSchemas.ts
│   └── ... (one per domain)
├── middleware/
│   ├── auth.ts           # JWT auth middleware (requireAuth)
│   ├── asyncHandler.ts   # Wraps async route handlers, routes errors to next()
│   ├── errorHandler.ts   # Global error handler (ZodError→400, AppError→code, 500)
│   ├── validate.ts       # Zod validation middleware
│   └── upload.ts         # Multer file upload (10MB, images only)
├── types/
│   └── errors.ts         # AppError class
├── utils/
│   ├── prisma.ts         # Singleton Prisma client
│   ├── cdn.ts            # Upload/delete from CDN
│   ├── auth.ts           # JWT helpers, Google OAuth verify
│   ├── geo.ts            # haversineDistance utility
│   └── notifications.ts  # createNotification + getPartnerUserId helpers
└── __tests__/
    └── api.test.ts       # Integration tests (real DB, 133 tests)
```

## Key Patterns
- **3-layer architecture**: Routes (thin wiring) → Controllers (HTTP layer) → Services (business logic + Prisma)
- **asyncHandler**: Wraps async controllers, routes errors to Express `next()` — no try/catch in controllers
- **errorHandler**: Global middleware — ZodError→400, AppError→statusCode, unknown→500
- **validate(schema)**: Middleware that runs Zod safeParse and sets req.body = result.data
- **AppError**: `throw new AppError(statusCode, message)` in services for known errors
- **Express 5 params**: Always use `Request<{id: string}>` — `req.params.id` typed as `string | string[]`
- **Typed params in controllers**: Use `asyncHandler<IdParam>` generic or `AuthRequest & Request<{id: string}>` intersection
- **Entry point guard**: `require.main === module` for `app.listen` — allows test imports without port conflicts
- **File uploads**: Multer → `uploads/` dir → `uploadToCdn()` → delete local file
- **Validation schemas**: Per-domain Zod schemas in `validators/` folder
- **DB**: PostgreSQL via Prisma ORM. Schema at `prisma/schema.prisma`
- **Cron**: Registered via `CronService.registerCrons()` — 4 jobs: letter delivery (1min), date reminder (6AM), monthly recap (last day), weekly recap (Mon 9AM). Timezone: Asia/Ho_Chi_Minh
- **Auth**: JWT tokens, Google OAuth verify via `google-auth-library`

## Environment
- Dev: `.env.development` (port 5006, DB `love_scrum_dev`)
- Prod: `.env` (port 5005, DB `love_scrum`)
- `dotenv-cli` loads correct env per script

## PM2 Process Names
- Production: `love-scrum-api`
- Dev: `love-scrum-dev-api`
