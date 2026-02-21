# Architecture

System structure, module boundaries, and key patterns. Read this before major refactoring or adding new modules.

## System Overview

_(Record high-level architecture: monolith, microservices, modules, etc.)_

## Module Boundaries

_(Record key modules and their responsibilities)_

```markdown
### Module: name
- Purpose: What it does
- Dependencies: What it depends on
- Exports: What other modules use from it
```

## Key Patterns

_(Record architectural patterns used: repository pattern, event-driven, etc.)_

## Cross-Cutting Concerns

_(Record how logging, error handling, auth, etc. are implemented across the system)_

## Z-Index Hierarchy (Sprint 4)

Established layering order for overlapping UI elements:
- `z-50` — bottom nav (`Layout.tsx`)
- `z-[60]` — modals (`Modal.tsx`)
- `z-[70]` — full-screen gallery overlay (`PhotoGallery.tsx`)

Always respect this order when adding new overlay or panel components.

## PhotoGallery Pattern (Sprint 4)

- Component: `src/components/PhotoGallery.tsx` — fullscreen overlay with swipe, pinch-to-zoom, and keyboard nav.
- Always render the gallery container in the DOM and toggle visibility via CSS `opacity`/`pointer-events` (not conditional JSX mounting), so `useRef` references to DOM nodes stay live throughout the component's lifecycle.
- Touch swipe implemented with `onTouchStart`/`onTouchEnd` delta; pinch-to-zoom uses two-finger distance delta on `onTouchMove`.
- Supports keyboard navigation (ArrowLeft/ArrowRight/Escape) via `useEffect` event listener on `document`.

## Auth Pattern (Sprint 5)

- Backend: bcryptjs + jsonwebtoken, requireAuth middleware on all routes except /api/auth/*
- Frontend: AuthProvider in main.tsx wraps app, useAuth() hook, token key 'love-scrum-token' in localStorage
- api.ts: getToken() reads localStorage, injects Bearer header on every request, 401 → removeItem + window.location.href = '/login'
- App.tsx: isLoading spinner → !isAuthenticated shows LoginPage → authenticated shows Layout+Routes
- .env is gitignored — never commit JWT_SECRET; add manually after clone

## Photo Booth (Sprint 6 + Sprint 7 + Sprint 8)

- Purely client-side Canvas 2D feature — no backend except CORS proxy
- Files: `lib/photobooth/` (canvas-utils, filters, frames, stickers, overlays, useCamera) + `components/photobooth/` (9 components) + `pages/PhotoBoothPage.tsx`
- **Sprint 6 Gallery Mode**: 5-step wizard: Frame → Photos → Filter → Stickers → Preview & Download. 8 frames, 8 filters, 20 stickers (3 categories: love/fun/text)
- **Sprint 7 Camera Mode**: 4-step wizard: Layout → Camera Capture (countdown) → Customize → Preview/Share
- **Sprint 8 Upgrades**: Canvas 2D overlays (overlays.ts — 9 designs), Canvas 2D prop stickers (heart/star/crown/fire/sparkles drawn natively), cover-crop fix in captureFrame + renderFilteredImage
- `FrameDef.mode: 'frame' | 'strip'` separates gallery frames from strip layouts
- 4 strip layouts: Classic (4 photos, 600×1800), Duo (2, 600×900), Triple (3, 600×1350), Grid 2×2 (4, 600×720)
- Composite pipeline: `frame.render()` (base, empty stickers) → overlay → stickers → `setResultCanvas()` (useState, not useRef)
- `useCamera` hook: getUserMedia, front/rear toggle, captureFrame with cover-crop mirror + CSS filter
- SharePanel: Web Share API (feature-detected) + Clipboard API + Download PNG
- CORS proxy: `/api/proxy-image?url=` routes CDN images through backend to avoid canvas taint
- data: URL fast-path in loadImage() for camera captures (bypasses fetch)
- Entry point: Dashboard CTA only (no nav tab)

## Environment Separation (Sprint 6)

- **Production**: DB `love_scrum` / port 5005 (backend) + 3337 (frontend) / `.env` / PM2 `npm run start` + `npm run preview`
- **Dev**: DB `love_scrum_dev` / port 5006 (backend) + 3338 (frontend) / `.env.development` / PM2 or `npm run dev`
- `dotenv-cli` used in package.json scripts to load correct env file
- Vite: `server.proxy` → :5006 (dev), `preview.proxy` → :5005 (prod) — these are independent configs
- Cloudflare Tunnel: `love-scrum.hungphu.work` (prod), `dev-love-scrum.hungphu.work` (dev)
- Seed script: `npm run seed:dev` populates dev DB only
