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

## Sprint 9 Features (2026-02-21)

### Dashboard Timer
- Component: `src/components/RelationshipTimer.tsx` — compact inline single-row timer
- Stores start date in DB via `GET/PUT /api/settings/relationship-start-date` (not localStorage)
- Uses `useQuery` + `useMutation` from react-query; syncs across devices automatically

### Voice Recording (MomentAudio)
- DB model: `MomentAudio` (id, momentId, filename, url, duration, createdAt) in `moment_audios` table
- API: `POST /api/moments/:id/audio` (multer uploadAudio), `DELETE /api/moments/:id/audio/:audioId`
- Frontend: MediaRecorder API in `MomentDetail.tsx` — live timer, play/pause toggle via `new Audio(url)`

### Map Tag Filter
- `MapPage.tsx`: `selectedTags: Set<string>` state, `allTags` from `validPins.flatMap(p => p.tags)`
- Multi-select chip UI; combines with existing type filter (All/Moments/Food)

### Swiper Carousel (Recent Moments)
- Library: `swiper` v12 with Pagination module
- Mobile: `slidesPerView: 1.15`, `centeredSlides`, `spaceBetween: 12` — natural peek effect
- Desktop (≥768px): `slidesPerView: 3`, `spaceBetween: 16` — 3 cards visible
- Pagination color via CSS vars: `--swiper-pagination-color: #E8788A`

### FAB Speed Dial
- Component: `src/components/FAB.tsx` — fixed bottom-right, `z-[55]` (above bottom nav z-50, below modal z-[60])
- Actions: Moment, Food Spot, Photo Booth — AnimatePresence slide-in, Plus rotates 45° → ×
- Mounted in `Dashboard.tsx` only (not global Layout)
- `bottom: calc(5rem + env(safe-area-inset-bottom))` for safe-area awareness

### AppSettings Model
- DB: `app_settings` table (key String @unique, value String)
- API: `GET/PUT /api/settings/:key` — upsert pattern, protected route
- Frontend: `settingsApi` in `api.ts`; used by RelationshipTimer for cross-device sync

## Z-Index Hierarchy (updated Sprint 26)

- `z-50` — bottom nav (`Layout.tsx`)
- `z-[54]` — FAB backdrop (closes speed dial)
- `z-[55]` — FAB component (`FAB.tsx`)
- `z-[60]` — modals (`Modal.tsx`)
- `z-[70]` — full-screen overlays (`PhotoGallery.tsx`, `MonthlyRecapPage.tsx`)
- `z-[71..73]` — internal layers within full-screen overlay (bg, content, controls)

### Instagram Stories pattern (MonthlyRecapPage.tsx, Sprint 26)
- `fixed inset-0 z-[70]` for the page root; bg z-[70], slide content z-[71], tap zones z-[72], progress+controls z-[73]
- Progress bars: CSS `@keyframes progressFill` (width 0%→100%), restart by changing React key
- Hold-to-pause: `setTimeout(200ms)` sets `isHoldRef.current = true` + `setIsPaused(true)`; pointerUp clears timer, resumes, and skips tap if hold
- Tap zones: two flex buttons (w-[35%] / w-[65%]) spanning `top: 5rem` to `bottom: 5rem`
- Auto-advance: `setTimeout(SLIDE_DURATION)` in useEffect, deps `[currentIdx, isPaused, slides.length]`
- AnimatedNumber: `setInterval` count-up (30 steps × 50ms), `useEffect([value])` resets to 0 on each new slide

## Environment Separation (Sprint 6)

- **Production**: DB `love_scrum` / port 5005 (backend) + 3337 (frontend) / `.env` / PM2 `npm run start` + `npm run preview`
- **Dev**: DB `love_scrum_dev` / port 5006 (backend) + 3338 (frontend) / `.env.development` / PM2 or `npm run dev`
- `dotenv-cli` used in package.json scripts to load correct env file
- Vite: `server.proxy` → :5006 (dev), `preview.proxy` → :5005 (prod) — these are independent configs
- Cloudflare Tunnel: `love-scrum.hungphu.work` (prod), `dev-love-scrum.hungphu.work` (dev)
- Seed script: `npm run seed:dev` populates dev DB only

## Date Planner (Sprint 21)

### Pages
- `DatePlannerPage.tsx` — 2 tabs: "Muốn đi" (wishlist) + "Kế hoạch" (plans). WishFormModal, PlanFormModal with StopEditor + LocationPicker
- `DatePlanDetailPage.tsx` — Plan timeline: progress bar (active only), current stop highlight, Google Maps directions, Thêm Moment/FoodSpot per stop. Completed: gallery carousel at top

### Shared Components (extracted Sprint 21)
- `MomentCard.tsx` — Photo card with gradient overlay, location badge, date. Used in Dashboard + DatePlanDetailPage
- `FoodSpotCard.tsx` — Same pattern for food spots. Used in DatePlanDetailPage
- `ActionButtons.tsx` — ActionLink (text link), ActionPill (pill button), DirectionsLink (Google Maps shortcut). Used in WishCard + StopCard
- `CreateFoodSpotModal.tsx` — Create food spot from within plan stop (pre-fills location from stop)

### Auto-status Pattern
- Backend GET /date-plans: planned→active if date=today, active→completed if past+all done
- Backend PUT /stops/:stopId/done: marks stop done, checks all done → auto-completes plan atomically (no frontend chaining)
- Dashboard: ActiveDatePlanPin shows only when `status === 'active' && isToday`

### DatePlan Expense Linking (Sprint 28)
- AddExpenseModal accepts `datePlanId` via `AddExpenseDefaults`; carried through `buildForm` + `handleSave` payload
- Backend: `GET /api/expenses?datePlanId=` filters server-side; `expensesApi.listByPlan(id)` in frontend
- `onSaved` must invalidate 4 keys: `['expenses-plan',id]`, `['expenses']`, `['expenses-stats']`, `['expenses-daily-stats']`
- Per-stop expense display: filter `planExpenses` by `e.description.includes(stop.title)`

### Dashboard Bento Grid (Sprint 29)
- Shared modules constant: `frontend/src/lib/modules.ts` — 9-entry array (`to/icon/label/description/color`), typed with `LucideIcon`. Both Dashboard and any future consumer import from here; MorePage no longer owns it.
- Dashboard layout order (Boss-approved): Recent Moments → Hero Card → Bento Row → Modules Grid
- Hero Card live timer: Boss requires `useState(new Date()) + useEffect setInterval(1s)` even on Dashboard — do NOT ship static/no-clock version. Full `calcDiff` must return `{ years, months, days, hours, minutes, seconds }`.

## JWT Auth + Shared Links + Couple Profile (Sprint 32)

### JWT Auth Upgrade
- **Access token (15min):** `generateAccessToken(userId, coupleId)` in `utils/auth.ts` — JWT with `type: 'access'`
- **Refresh token (30 days):** `RefreshToken` model in DB, rotated on each refresh. `generateRefreshTokenValue()` = `crypto.randomBytes(64).toString('hex')`
- **Backward compat:** Old 30-day `generateToken()` still works. Login/register returns `{ token, accessToken, refreshToken }`
- **Routes:** POST `/auth/refresh` (rotate), POST `/auth/logout` (revoke)
- **Frontend interceptor:** `api.ts` `tryRefreshToken()` mutex — on 401, try refresh once before redirecting to /login. Stores `love-scrum-token` + `love-scrum-refresh-token` in localStorage

### Couple Profile
- **Backend:** `routes/couple.ts` — GET/PUT /api/couple, POST /api/couple/generate-invite
- **Couple model:** Added `anniversaryDate DateTime?`, `inviteCode String? @unique`
- **Backward compat:** PUT /api/couple syncs `anniversaryDate` back to `AppSetting('relationship-start-date')` for existing timer
- **Invite code:** `crypto.randomBytes(4).toString('hex')` — 8 hex chars. Register with `inviteCode` param joins that couple
- **Frontend:** MorePage "Hồ sơ cặp đôi" section with modal — couple name, anniversary, partner info, invite code (copy/generate)

### Shared Links
- **Backend:** `routes/share.ts` — mixed auth: POST/GET-list/DELETE use requireAuth, GET /:token is public
- **ShareLink model:** token (unique, 64-byte hex), type (moment|letter|recipe), targetId, coupleId, viewCount
- **Letter restriction:** Only DELIVERED/READ letters can be shared (DRAFT/SCHEDULED → 400)
- **Image proxy:** GET /api/share/:token/image — validates share token, proxies CDN image with `Cache-Control: public, max-age=86400`
- **Frontend viewer:** `/s/:token` route (public, outside auth gate). Uses raw `fetch()` for public API. Images via share proxy
- **Share buttons:** MomentDetail, RecipeDetail, LetterReadOverlay — `navigator.share()` with clipboard fallback

## React Native Mobile App (Sprint 34+)

### Architecture — MVVM Pattern (Boss mandated)
- **Models:** `src/types/` — data interfaces (AuthUser, CoupleProfile, etc.)
- **Screens = folders:** Each screen is a folder with view + viewmodel co-located:
  ```
  src/screens/
  ├── Login/
  │   ├── LoginScreen.tsx          # View — pure UI rendering
  │   └── useLoginViewModel.ts     # ViewModel — logic, state, API calls
  ├── Profile/
  │   ├── ProfileScreen.tsx
  │   └── useProfileViewModel.ts
  └── Dashboard/
      ├── DashboardScreen.tsx
      └── useDashboardViewModel.ts
  ```
- **Components:** `src/components/` — reusable UI (Input, Button, etc.)

### Key Conventions
- **Theme:** `src/lib/theme.ts` — centralized colors, spacing, fonts. NO hardcoded hex values in screens/components
- **i18n:** `src/locales/en.ts` — all UI strings extracted. Prepared for multi-language support
- **NativeWind v4:** Metro config only (`withNativeWind`), NOT babel plugin. `'nativewind/babel'` in babel.config causes `.plugins is not a valid Plugin property` error on RN 0.84
- **Token storage:** react-native-keychain (NOT AsyncStorage)
- **API base:** `__DEV__` → dev-love-scrum-api.hungphu.work, prod → love-scrum-api.hungphu.work
- **Google Sign-In:** `@react-native-google-signin/google-signin`, native. Needs Web + iOS + Android Client IDs

### Project Location
- Folder: `mobile/` in monorepo (alongside `frontend/` and `backend/`)
- `shared/` for types, API paths, validation (shared between web + mobile)
