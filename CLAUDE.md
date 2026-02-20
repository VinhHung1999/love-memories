# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Love Scrum is a personal couples app for saving moments/memories, tracking food spots with map pins, and managing shared goals via scrum sprints. No authentication — single-user personal app. Deployed as PWA for iPhone homescreen use.

## Commands

### Backend (from `backend/`)
```bash
npm run dev          # Start dev server with tsx watch (port 5005)
npm run build        # TypeScript compile to dist/
npm test             # Jest tests (--forceExit --detectOpenHandles)
npm run lint         # ESLint
```

### Frontend (from `frontend/`)
```bash
npm run dev          # Vite dev server (port 3337)
npm run build        # tsc + vite build
npm test             # Vitest run
npm run lint         # ESLint
```

### Database
```bash
cd backend
npx prisma migrate dev     # Run migrations
npx prisma generate        # Regenerate client after schema changes
npx prisma studio          # Visual DB browser
```

Database: PostgreSQL `love_scrum` at `postgresql://hungphu@localhost:5432/love_scrum`

## Architecture

### Monorepo Structure
- `backend/` — Express + TypeScript + Prisma ORM (CommonJS)
- `frontend/` — React 19 + Vite + TypeScript + Tailwind CSS v4 (ESM)

### Backend
- **Entry**: `src/index.ts` — Express app with `require.main === module` guard for `app.listen` (allows test imports without port conflicts). Exports `app` for testing.
- **Routes**: `src/routes/{moments,foodspots,map,sprints,goals}.ts` — All route handlers use typed params `Request<{id: string}>` to fix Express 5 type issues with `req.params`.
- **Validation**: `src/utils/validation.ts` — Zod schemas for all entities. Lat/lng validated with min/max (-90/90, -180/180).
- **File uploads**: `src/middleware/upload.ts` — Multer to `uploads/` directory, UUID filenames, 10MB limit, images only.
- **DB client**: `src/utils/prisma.ts` — Singleton Prisma client.
- **Tests**: `src/__tests__/api.test.ts` — Jest + Supertest integration tests against real DB.

### Frontend
- **Routing**: `src/App.tsx` — React Router v7 with 8 routes, all wrapped in `Layout`.
- **Data layer**: `src/lib/api.ts` — API client functions organized by domain. Uses `@tanstack/react-query` for caching (30s stale time).
- **Types**: `src/types/index.ts` — Shared TypeScript interfaces mirroring Prisma models.
- **Layout**: `src/components/Layout.tsx` — Desktop sidebar + mobile bottom nav (z-50). Uses `env(safe-area-inset-*)` for PWA safe areas.
- **Modal**: `src/components/Modal.tsx` — Bottom-sheet on mobile (slides up), centered on desktop. z-[60] to stay above bottom nav.
- **Map**: `src/pages/MapPage.tsx` — Mapbox GL JS. Filters invalid coordinates before rendering. Token via `VITE_MAPBOX_TOKEN` env var.
- **Kanban**: `src/pages/GoalsPage.tsx` + `SprintDetail.tsx` — Drag-and-drop via `@hello-pangea/dnd`.
- **LocationPicker**: `src/components/LocationPicker.tsx` — Mapbox Geocoding API (Vietnam only, Vietnamese language), click-on-map, browser geolocation.

### API Proxy
Vite proxies `/api` and `/uploads` to `http://localhost:5005` in dev mode.

### Styling
- Tailwind CSS v4 with `@tailwindcss/vite` plugin (not PostCSS)
- Theme defined in `src/index.css` via `@theme` block: primary `#E8788A`, secondary `#F4A261`, accent `#7EC8B5`
- Fonts: Playfair Display (headings via `font-heading`), Inter (body via `font-body`)
- Mapbox CSS loaded via `<link>` tag in `index.html` (not CSS `@import` — causes PostCSS conflicts with Tailwind v4)

### PWA
- `public/manifest.json` — Standalone display mode
- `index.html` — Apple meta tags for homescreen PWA, `viewport-fit=cover` for safe areas
- Icons: `public/icon-192.png`, `public/icon-512.png`

## Known Gotchas

- **Express 5 params**: `req.params.id` is typed as `string | string[]`. Always use `Request<{id: string}>` generic on route handlers.
- **jest.config must be .js**: Backend uses CommonJS, `ts-node` is not installed, so jest config cannot be `.ts`.
- **Mapbox CSS**: Must be loaded via `<link>` in `index.html`, not `@import` in CSS files (Tailwind v4 PostCSS conflict).
- **iOS input zoom**: All inputs have `font-size: 16px !important` in `index.css` to prevent iOS auto-zoom.
- **Modal z-index**: Modal uses z-[60], bottom nav uses z-50. Keep this hierarchy when adding overlays.

## Environments

|  | Production | Dev |
|--|-----------|-----|
| DB | `love_scrum` | `love_scrum_dev` |
| Backend port | 5005 | 5006 |
| Frontend port | 3337 | 3338 |
| Env file | `backend/.env` | `backend/.env.development` |
| PM2 backend | `npm run start` | `npm run dev` |
| PM2 frontend | `npm run preview` | `npm run dev` |
| URL | `love-scrum.hungphu.work` | `dev-love-scrum.hungphu.work` |
| API URL | `love-scrum-api.hungphu.work` | `dev-love-scrum-api.hungphu.work` |

- `dotenv-cli` loads correct env file per script
- Vite `server.proxy` → :5006 (dev only), `preview.proxy` → :5005 (prod only)
- Seed dev data: `cd backend && npm run seed:dev`

## Deployment

Exposed via Cloudflare Tunnel (`ai-teams` tunnel):
- Frontend: `love-scrum.hungphu.work` → localhost:3337
- Backend API: `love-scrum-api.hungphu.work` → localhost:5005
- Dev Frontend: `dev-love-scrum.hungphu.work` → localhost:3338
- Dev API: `dev-love-scrum-api.hungphu.work` → localhost:5006
- Vite `allowedHosts` includes both `love-scrum.hungphu.work` and `dev-love-scrum.hungphu.work`

## Project Memory

Project memories are stored in `.claude/memory/`. Use `--project-recall` before complex tasks, `--project-store` after meaningful work.

| Topic | Content |
|-------|---------|
| [bugs-and-lessons](.claude/memory/bugs-and-lessons/README.md) | Bugs encountered and lessons learned |
| [design-decisions](.claude/memory/design-decisions/README.md) | UI/UX decisions, color palette, animation philosophy |
| [api-design](.claude/memory/api-design/README.md) | API endpoints, auth patterns, error handling |
| [data-model](.claude/memory/data-model/README.md) | Database schema, ORM patterns, migrations |
| [architecture](.claude/memory/architecture/README.md) | System structure, module boundaries, key patterns |
