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
├── index.ts              # Express app, cron jobs, app.listen guard
├── routes/               # Route handlers (one file per domain)
│   ├── moments.ts        # CRUD moments + photos + audio
│   ├── profile.ts        # User profile + avatar
│   ├── couple.ts         # Couple info + partner
│   ├── loveLetters.ts    # Letters + media
│   ├── recipes.ts        # Recipes + cooking sessions
│   ├── goals.ts          # Goals + sprints (kanban)
│   ├── map.ts            # Map pins
│   ├── datePlans.ts      # Date planner
│   ├── recap.ts          # Weekly + monthly recap
│   ├── achievements.ts   # Gamification badges
│   ├── notifications.ts  # In-app notifications
│   ├── push.ts           # Web push subscriptions
│   ├── settings.ts       # Key-value settings store
│   ├── ai.ts             # AI features (OpenAI)
│   ├── share.ts          # Public share links
│   ├── proxy-image.ts    # CDN image proxy
│   └── proxy-audio.ts    # CDN audio proxy
├── middleware/
│   ├── auth.ts           # JWT auth middleware
│   └── upload.ts         # Multer file upload (10MB, images only)
├── utils/
│   ├── prisma.ts         # Singleton Prisma client
│   ├── validation.ts     # Zod schemas for all entities
│   ├── cdn.ts            # Upload/delete from CDN
│   ├── auth.ts           # JWT helpers, Google OAuth verify
│   ├── geo.ts            # Geocoding utilities
│   └── notifications.ts  # Create notification helpers
└── __tests__/
    └── api.test.ts       # Integration tests (real DB)
```

## Key Patterns
- **Express 5 params**: Always use `Request<{id: string}>` — `req.params.id` typed as `string | string[]`
- **Entry point guard**: `require.main === module` for `app.listen` — allows test imports without port conflicts
- **File uploads**: Multer → `uploads/` dir → `uploadToCdn()` → delete local file
- **Validation**: Zod schemas in `utils/validation.ts` — validate request body before DB ops
- **DB**: PostgreSQL via Prisma ORM. Schema at `prisma/schema.prisma`
- **Cron**: Weekly recap Mon 9AM + Monthly recap 1st of month 9AM (Asia/Ho_Chi_Minh)
- **Auth**: JWT tokens, Google OAuth verify via `google-auth-library`

## Environment
- Dev: `.env.development` (port 5006, DB `love_scrum_dev`)
- Prod: `.env` (port 5005, DB `love_scrum`)
- `dotenv-cli` loads correct env per script

## PM2 Process Names
- Production: `love-scrum-api`
- Dev: `love-scrum-dev-api`
