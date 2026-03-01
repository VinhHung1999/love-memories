# Deployment Guide

## 1. Infrastructure Overview

```
Internet → Cloudflare Tunnel (ai-teams) → localhost services → PostgreSQL
```

| Component | Production | Development |
|-----------|-----------|-------------|
| Frontend URL | `love-scrum.hungphu.work` | `dev-love-scrum.hungphu.work` |
| API URL | `love-scrum-api.hungphu.work` | `dev-love-scrum-api.hungphu.work` |
| Frontend port | 3337 | 3338 |
| Backend port | 5005 | 5006 |
| Database | `love_scrum` | `love_scrum_dev` |
| Env file | `backend/.env` | `backend/.env.development` |

## 2. PM2 Process Management

### Process Names

| Process | PM2 ID | Command | Port |
|---------|--------|---------|------|
| `love-scrum-api` | 3 | `npm run start` (node dist/index.js) | 5005 |
| `love-scrum-web` | 4 | `npm run preview` (vite preview) | 3337 |
| `love-scrum-dev-api` | 5 | `npm run dev` (tsx watch) | 5006 |
| `love-scrum-dev-web` | 6 | `npm run dev` (vite dev) | 3338 |

**Common mistake:** Process is `love-scrum-web`, NOT `love-scrum-frontend`.

### Commands

```bash
# Status
pm2 status

# Restart production
pm2 restart love-scrum-api love-scrum-web

# Restart dev
pm2 restart love-scrum-dev-api love-scrum-dev-web

# Logs
pm2 logs love-scrum-api --lines 50
pm2 logs love-scrum-web --lines 50

# Monitor
pm2 monit
```

## 3. Cloudflare Tunnel

Tunnel name: `ai-teams`

### Route Configuration

| Hostname | Service |
|----------|---------|
| `love-scrum.hungphu.work` | `http://localhost:3337` |
| `love-scrum-api.hungphu.work` | `http://localhost:5005` |
| `dev-love-scrum.hungphu.work` | `http://localhost:3338` |
| `dev-love-scrum-api.hungphu.work` | `http://localhost:5006` |

### Vite Allowed Hosts

Both frontend Vite configs include:
```typescript
server: { allowedHosts: ['love-scrum.hungphu.work', 'dev-love-scrum.hungphu.work'] }
```

## 4. Database Management

### Connection Strings

```
# Production
DATABASE_URL="postgresql://hungphu@localhost:5432/love_scrum"

# Development
DATABASE_URL="postgresql://hungphu@localhost:5432/love_scrum_dev"
```

### Migrations

```bash
cd backend

# Run migrations (production - uses .env)
npx prisma migrate deploy

# Run migrations (development - CRITICAL: do this after every schema change!)
DATABASE_URL="postgresql://hungphu@localhost:5432/love_scrum_dev" npx prisma migrate deploy

# Create new migration (dev workflow)
npx prisma migrate dev --name add_feature_name

# Regenerate Prisma client
npx prisma generate

# Visual DB browser
npx prisma studio
```

**CRITICAL:** After every schema migration, ALWAYS run migrate on dev DB too. This has caused recurring 500 errors (see bugs-and-lessons).

### Seed Data

```bash
cd backend

# Seed development database
npm run seed:dev

# Re-seed after dev-api restart (tsx watch restart may lose seeded data)
npm run seed:dev
```

Seed creates: 2 users, moments, food spots, sprint with goals, 5 Vietnamese recipes, weekly recap test data.

## 5. Build Commands

### Backend

```bash
cd backend

# Development (auto-reload)
npm run dev                     # tsx watch, port 5006, .env.development

# Production build
npm run build                   # tsc → dist/

# Production run
npm run start                   # node dist/index.js, port 5005, .env

# Tests
npm test                        # Jest --forceExit --detectOpenHandles

# Lint
npm run lint                    # ESLint
```

### Frontend

```bash
cd frontend

# Development (HMR)
npm run dev                     # Vite dev server, port 3338

# Production build
npm run build                   # tsc -b && vite build → dist/

# Production serve
npm run preview                 # Vite preview, port 3337

# Tests
npm test                        # Vitest

# Lint
npm run lint                    # ESLint
```

## 6. Production Deployment Checklist

```bash
# 1. Build backend
cd backend
npm run build
npm test

# 2. Build frontend
cd frontend
npm run build

# 3. Run migrations (BOTH databases!)
cd backend
npx prisma migrate deploy
DATABASE_URL="postgresql://hungphu@localhost:5432/love_scrum_dev" npx prisma migrate deploy

# 4. Restart PM2 processes
pm2 restart love-scrum-api love-scrum-web

# 5. Verify
pm2 logs love-scrum-api --lines 20
pm2 logs love-scrum-web --lines 20
curl https://love-scrum-api.hungphu.work/api/auth/me  # Should return 401
curl https://love-scrum.hungphu.work                   # Should return HTML
```

## 7. Dev Deployment Checklist

```bash
# 1. Build (if needed — tsx watch auto-reloads, but Vite needs rebuild for preview)
cd frontend
npm run build      # Only if using vite preview for dev

# 2. Run migrations on dev DB
cd backend
DATABASE_URL="postgresql://hungphu@localhost:5432/love_scrum_dev" npx prisma migrate deploy

# 3. Restart dev processes
pm2 restart love-scrum-dev-api love-scrum-dev-web

# 4. Seed data (optional, but recommended after restart)
cd backend
npm run seed:dev

# 5. Verify
pm2 logs love-scrum-dev-api --lines 20
```

## 8. Environment Files

### backend/.env (Production)

```env
PORT=5005
DATABASE_URL="postgresql://hungphu@localhost:5432/love_scrum"
JWT_SECRET=<secret>
CDN_BASE_URL=<cdn-url>
CDN_API_KEY=<cdn-api-key>
CDN_PROJECT=love-scrum
XAI_API_KEY=<xai-key>
VAPID_EMAIL=mailto:admin@love-scrum.hungphu.work
VAPID_PUBLIC_KEY=<vapid-public>
VAPID_PRIVATE_KEY=<vapid-private>
ALLOWED_EMAILS=phuvinhhung1999@gmail.com,khnhu26@gmail.com
```

### backend/.env.development

Same structure as `.env` but with:
```env
PORT=5006
DATABASE_URL="postgresql://hungphu@localhost:5432/love_scrum_dev"
```

### frontend (Vite env)

```env
VITE_MAPBOX_TOKEN=<mapbox-token>
```

### Env Loading

`dotenv-cli` loads correct env file per npm script:
```json
{
  "dev": "dotenv -e .env.development -- tsx watch src/index.ts",
  "start": "node dist/index.js",
  "seed:dev": "dotenv -e .env.development -- tsx prisma/seed.ts"
}
```

## 9. Vite Proxy Configuration

### Development (`server.proxy`)

```typescript
server: {
  port: 3338,
  proxy: {
    '/api': 'http://localhost:5006',
    '/uploads': 'http://localhost:5006',
  }
}
```

### Production (`preview.proxy`)

```typescript
preview: {
  port: 3337,
  proxy: {
    '/api': 'http://localhost:5005',
    '/uploads': 'http://localhost:5005',
  }
}
```

**IMPORTANT:** `server.proxy` only works for `vite dev`. `preview.proxy` only works for `vite preview`. These are independent config blocks — configure both!

## 10. Deployment Workflow (Team)

```
1. DEV implements on feature branch → commits
2. PO code reviews (run tests, check code quality)
3. PO deploys to DEV environment for Boss to test
4. Boss tests on dev → APPROVE or REQUEST CHANGES
5. ONLY when Boss approves → PO merges to main + deploys production
```

**CRITICAL:** Never deploy production without Boss approval. Fix bugs on dev first — never push directly to production.

## 11. Troubleshooting

### Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| 500 on all writes | Migration not applied to dev DB | Run `DATABASE_URL=...dev npx prisma migrate deploy` |
| API returns 404 | Vite proxy not configured for `preview` | Add `preview.proxy` block to vite.config.ts |
| Audio won't play on iOS | CDN serving as `application/octet-stream` | Ensure MIME type passed in Blob constructor |
| CORS error on Canvas | CDN images loaded without proxy | Use `/api/proxy-image?url=` endpoint |
| PM2 process not found | Wrong process name | Use `love-scrum-web` not `love-scrum-frontend` |
| Seeded data missing | tsx watch restarted | Re-run `npm run seed:dev` |

### Log Locations

```bash
# PM2 logs
pm2 logs love-scrum-api --lines 100
pm2 logs love-scrum-web --lines 100

# PM2 log files
~/.pm2/logs/love-scrum-api-out.log
~/.pm2/logs/love-scrum-api-error.log
```
