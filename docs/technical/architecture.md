# System Architecture

## 1. Monorepo Structure

```
love-scrum/
├── backend/               # Express + TypeScript + Prisma (CommonJS)
│   ├── src/
│   │   ├── index.ts       # Express app entry, cron jobs, middleware
│   │   ├── routes/        # 20 route files (100+ endpoints)
│   │   ├── middleware/     # auth.ts, upload.ts
│   │   └── utils/         # auth, validation, cdn, notifications, geo, prisma
│   ├── prisma/
│   │   ├── schema.prisma  # 31 models, 4 enums
│   │   ├── migrations/    # 32 migrations
│   │   └── seed.ts        # Dev seed data
│   └── package.json
├── frontend/              # React 19 + Vite + TypeScript + Tailwind v4 (ESM)
│   ├── src/
│   │   ├── main.tsx       # Entry: providers (QueryClient, Router, Auth)
│   │   ├── App.tsx        # 24 routes
│   │   ├── pages/         # 24 page components
│   │   ├── components/    # 35+ shared components
│   │   ├── lib/           # API client, hooks, utilities, photobooth
│   │   ├── types/         # TypeScript interfaces (30+ types)
│   │   └── index.css      # Tailwind @theme, custom utilities
│   ├── public/            # PWA manifest, icons, service worker
│   └── package.json
├── docs/                  # Documentation (this folder)
├── uploads/               # Local file uploads (dev only)
└── CLAUDE.md              # AI assistant instructions
```

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 19.0 | UI framework |
| | TypeScript | 5.7 | Type safety |
| | Vite | 6.1 | Build tool + dev server |
| | Tailwind CSS | 4.0 | Utility-first styling (via Vite plugin) |
| | React Router | 7.2 | Client-side routing |
| | TanStack React Query | 5.66 | Data fetching + caching |
| | Framer Motion | 12.4 | Animations |
| | Mapbox GL JS | 3.9 | Interactive maps |
| | Driver.js | 1.4 | Guided tours |
| | @hello-pangea/dnd | 17.0 | Drag-and-drop (Kanban) |
| | Swiper | 12.1 | Carousel |
| | Recharts | 3.7 | Charts (expenses) |
| **Backend** | Express | 4.21 | HTTP server |
| | TypeScript | 5.7 | Type safety |
| | Prisma | 6.4 | ORM + migrations |
| | Zod | 3.24 | Request validation |
| | bcryptjs | 3.0 | Password hashing |
| | jsonwebtoken | 9.0 | JWT auth |
| | Multer | 1.4 | File upload handling |
| | node-cron | 4.2 | Scheduled jobs |
| | web-push | 3.6 | Push notifications |
| | sharp | 0.33 | Image processing |
| | openai SDK | 6.22 | xAI Grok API (OpenAI-compatible) |
| | cheerio | 1.2 | HTML scraping |
| **Database** | PostgreSQL | — | Primary data store |
| **Deployment** | PM2 | — | Process manager |
| | Cloudflare Tunnel | — | HTTPS exposure |

## 3. Data Flow

```
┌─────────────┐     HTTPS      ┌──────────────────┐
│   Browser    │ ◄────────────► │  Cloudflare      │
│   (React)    │                │  Tunnel          │
└──────┬───────┘                └────────┬─────────┘
       │                                 │
       │  /api/* proxy                   │ localhost:3337 (frontend)
       │  (Vite dev/preview)             │ localhost:5005 (backend)
       │                                 │
       ▼                                 ▼
┌─────────────┐                 ┌──────────────────┐
│   Vite      │ ────────────►   │  Express         │
│   Dev Server│   /api proxy    │  Backend         │
│   :3337     │                 │  :5005           │
└─────────────┘                 └────────┬─────────┘
                                         │
                        ┌────────────────┼────────────────┐
                        │                │                │
                        ▼                ▼                ▼
                 ┌─────────────┐  ┌───────────┐  ┌──────────────┐
                 │  PostgreSQL │  │  CDN       │  │  xAI Grok    │
                 │  (Prisma)   │  │  (files)   │  │  (AI tasks)  │
                 └─────────────┘  └───────────┘  └──────────────┘
```

### Request Lifecycle

1. Browser makes HTTP request to `/api/*`
2. Vite dev server proxies to Express backend (dev), or Cloudflare Tunnel routes directly (prod)
3. Express middleware chain: CORS → JSON parser → route matching
4. Protected routes: `requireAuth` middleware validates JWT Bearer token
5. Route handler: validates body with Zod → calls Prisma → returns JSON
6. File uploads: Multer parses multipart → buffer in memory → uploaded to CDN
7. Notifications: non-blocking side-effect after main operation

## 4. Authentication Flow

```
┌─────────┐  POST /api/auth/login   ┌──────────┐
│ Client  │ ─────────────────────►   │ Backend  │
│         │  { email, password }     │          │
│         │                          │          │
│         │  ◄─────────────────────  │          │
│         │  { token, user }         │          │
└────┬────┘                          └──────────┘
     │
     │  localStorage.setItem('love-scrum-token', token)
     │
     │  All subsequent requests:
     │  Authorization: Bearer <token>
     │
     ▼
┌─────────┐  GET /api/auth/me        ┌──────────┐
│ Client  │ ─────────────────────►   │ Backend  │
│         │  Bearer token            │          │
│         │                          │ requireAuth│
│         │  ◄─────────────────────  │ middleware │
│         │  { user }                │          │
└─────────┘                          └──────────┘
```

### Details

- **Registration:** Whitelist-only — `ALLOWED_EMAILS` env var (comma-separated, default: 2 emails)
- **Password:** bcryptjs with 10 salt rounds
- **Token:** JWT with 30-day expiry, secret from `JWT_SECRET` env var
- **Middleware:** `requireAuth` in `src/middleware/auth.ts` — extracts Bearer token, verifies, attaches `req.user.userId`
- **Frontend:** `AuthProvider` context wraps entire app, `useAuth()` hook provides `login()`, `register()`, `logout()`, `user`, `isAuthenticated`
- **Token storage:** `localStorage` key `love-scrum-token`
- **401 handling:** Frontend auto-clears token and redirects to `/login` on 401 response

## 5. File Upload Pipeline

```
┌──────────┐  FormData    ┌──────────┐  Buffer    ┌─────────┐
│ Browser  │ ──────────►  │ Multer   │ ────────►  │  CDN    │
│ (upload  │  multipart   │ (memory  │  POST      │  API    │
│  queue)  │              │  storage)│            │         │
└──────────┘              └──────────┘            └────┬────┘
                                                       │
                                                       ▼
                                                 ┌─────────┐
                                                 │ Returns  │
                                                 │ { url,   │
                                                 │  filename}│
                                                 └─────────┘
```

### Upload Types

| Upload | Route | Max Files | Max Size | Allowed MIME |
|--------|-------|-----------|----------|--------------|
| Photos (moments) | `POST /api/moments/:id/photos` | 10 | 10MB | image/jpeg, png, webp, gif |
| Photos (food spots) | `POST /api/foodspots/:id/photos` | 10 | 10MB | image/* |
| Photos (recipes) | `POST /api/recipes/:id/photos` | 10 | 10MB | image/* |
| Photos (cooking sessions) | `POST /api/cooking-sessions/:id/photos` | 10 | 10MB | image/* |
| Photos (love letters) | `POST /api/love-letters/:id/photos` | 5 | 10MB | image/* |
| Audio (moments) | `POST /api/moments/:id/audio` | 1 | 10MB | audio/webm, mp4, mpeg, ogg, wav |
| Audio (love letters) | `POST /api/love-letters/:id/audio` | 1 | 10MB | audio/* |
| Avatar | `POST /api/profile/avatar` | 1 | 10MB | image/* |
| Receipt | `POST /api/expenses/upload-receipt` | 1 | 10MB | image/* |

### CDN Integration

- **Upload:** `uploadToCdn(buffer, filename, mimeType?)` — POST with API key header, 2-minute timeout
- **Delete:** `deleteFromCdn(filename)` — DELETE, treats 404 as success
- **Config:** `CDN_BASE_URL`, `CDN_API_KEY`, `CDN_PROJECT` env vars
- **Audio MIME fix:** Always pass `file.mimetype` from Multer when creating Blob (prevents CDN serving as `application/octet-stream`)

### Frontend Upload Queue

All uploads use `uploadQueue.enqueue()` — non-blocking singleton that:
1. Accepts upload function + success callback
2. Shows progress toast via `UploadToast` component
3. Tracks state: uploading (0–100%) → success (auto-dismiss 3s) → error (retry button)
4. Uses `XMLHttpRequest` for progress events (not `fetch`)

## 6. Notification Pipeline

```
┌───────────┐     ┌────────────────────┐     ┌──────────────┐
│ Trigger   │ ──► │ createNotification │ ──► │ DB Record    │
│ (route    │     │ (non-blocking)     │     │ (Notification│
│  handler) │     │                    │     │  table)      │
└───────────┘     └────────┬───────────┘     └──────────────┘
                           │
                           ▼
                  ┌────────────────────┐     ┌──────────────┐
                  │ sendPushNotification│ ──►│ Web Push     │
                  │ (VAPID)            │     │ (browser)    │
                  └────────────────────┘     └──────────────┘
```

### How It Works

1. Route handler performs main operation (create moment, send letter, etc.)
2. Calls `createNotification(userId, type, title, message, link?)` — **non-blocking** (errors caught silently)
3. `createNotification` writes to `notifications` table + calls `sendPushNotification`
4. `sendPushNotification` sends to all user's `PushSubscription` endpoints via VAPID
5. Stale subscriptions (410 Gone) auto-cleaned
6. Frontend polls unread count every 10s + on window focus

### Partner Resolution

`getOtherUserId(currentUserId)` — finds the other user in the app (for 2-user couple app). Used to determine notification recipient.

## 7. Cron Jobs

All scheduled with `node-cron`, timezone: `Asia/Ho_Chi_Minh`.

| Schedule | Job | Description |
|----------|-----|-------------|
| `* * * * *` | Love Letter Delivery | Check SCHEDULED letters with `scheduledAt <= now`, move to DELIVERED, send notification |
| `0 6 * * *` | Daily Plan Reminder | Notify users of planned/active date plans today |
| `0 9 * * 1` | Weekly Recap | Send weekly recap notification to all users (Monday 9 AM) |
| `0 9 1 * *` | Monthly Recap | Send monthly recap notification to all users (1st of month 9 AM) |

## 8. AI Integration (xAI Grok)

### Pattern

Uses OpenAI SDK with xAI base URL:
```typescript
import OpenAI from 'openai';
const client = new OpenAI({
  apiKey: process.env.XAI_API_KEY,
  baseURL: 'https://api.x.ai/v1'
});
```

### Endpoints

| Endpoint | Model | Purpose |
|----------|-------|---------|
| `POST /api/ai/generate-recipe` | `grok-3-mini` | Generate structured recipe from text/YouTube/URL |
| `POST /api/ai/scan-receipt` | `grok-4-1-fast-non-reasoning` | Extract expense data from receipt photo (vision) |
| `GET /api/recap/monthly/caption` | `grok-4-1-fast-non-reasoning` | Generate Vietnamese intro/outro for monthly recap |

### Error Handling

All AI endpoints are **non-critical** — return `null` on failure, never 500. Try/catch wraps all AI calls.

## 9. Environment Variables

### Required

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Backend server port | `5005` (prod), `5006` (dev) |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user@localhost:5432/love_scrum` |
| `JWT_SECRET` | JWT signing secret | Random string |
| `CDN_BASE_URL` | CDN upload endpoint | `https://cdn.example.com` |
| `CDN_API_KEY` | CDN authentication | API key string |
| `CDN_PROJECT` | CDN project identifier | `love-scrum` |
| `XAI_API_KEY` | xAI Grok API key | `xai-...` |
| `VAPID_EMAIL` | Push notification contact | `mailto:admin@love-scrum.hungphu.work` |
| `VAPID_PUBLIC_KEY` | VAPID public key | Base64 string |
| `VAPID_PRIVATE_KEY` | VAPID private key | Base64 string |
| `ALLOWED_EMAILS` | Comma-separated registration whitelist | `email1@...,email2@...` |

### Frontend (Vite)

| Variable | Purpose |
|----------|---------|
| `VITE_MAPBOX_TOKEN` | Mapbox GL JS access token |

## 10. Deployment Architecture

```
                    Internet
                       │
                       ▼
              ┌──────────────────┐
              │  Cloudflare      │
              │  Tunnel          │
              │  (ai-teams)      │
              └────────┬─────────┘
                       │
         ┌─────────────┼──────────────┐
         │             │              │
         ▼             ▼              ▼
  love-scrum.      love-scrum-   dev-love-scrum.
  hungphu.work     api.hungphu.  hungphu.work
  :3337            work :5005    :3338
         │             │              │
         ▼             ▼              ▼
  ┌────────────┐ ┌──────────┐ ┌────────────┐
  │ PM2:       │ │ PM2:     │ │ PM2:       │
  │ love-scrum │ │ love-    │ │ love-scrum │
  │ -web       │ │ scrum-api│ │ -dev-web   │
  └────────────┘ └────┬─────┘ └────────────┘
                      │
                      ▼
               ┌─────────────┐
               │ PostgreSQL  │
               │ love_scrum  │
               │ love_scrum_ │
               │ dev         │
               └─────────────┘
```

### PM2 Processes

| Process Name | ID | Command | Port |
|-------------|-----|---------|------|
| `love-scrum-api` | 3 | `npm run start` | 5005 |
| `love-scrum-web` | 4 | `npm run preview` | 3337 |
| `love-scrum-dev-api` | 5 | `npm run dev` | 5006 |
| `love-scrum-dev-web` | 6 | `npm run dev` | 3338 |

### Cloudflare Tunnel Routing

| Hostname | Target |
|----------|--------|
| `love-scrum.hungphu.work` | `localhost:3337` |
| `love-scrum-api.hungphu.work` | `localhost:5005` |
| `dev-love-scrum.hungphu.work` | `localhost:3338` |
| `dev-love-scrum-api.hungphu.work` | `localhost:5006` |

## 11. Dev vs Production

| Aspect | Production | Development |
|--------|-----------|-------------|
| Database | `love_scrum` | `love_scrum_dev` |
| Backend port | 5005 | 5006 |
| Frontend port | 3337 | 3338 |
| Env file | `backend/.env` | `backend/.env.development` |
| PM2 backend cmd | `npm run start` | `npm run dev` |
| PM2 frontend cmd | `npm run preview` | `npm run dev` |
| URL (frontend) | `love-scrum.hungphu.work` | `dev-love-scrum.hungphu.work` |
| URL (API) | `love-scrum-api.hungphu.work` | `dev-love-scrum-api.hungphu.work` |
| Vite proxy target | `:5005` (via `preview.proxy`) | `:5006` (via `server.proxy`) |
| Hot reload | No (preview mode) | Yes (Vite HMR) |
| Env loader | `dotenv-cli` | `dotenv-cli -e .env.development` |
| Seed data | Real data | `npm run seed:dev` |

### Env File Loading

`dotenv-cli` loads the correct `.env` file per npm script:
```json
{
  "dev": "dotenv -e .env.development -- tsx watch src/index.ts",
  "start": "node dist/index.js"
}
```
