# Frontend — React 19 + Vite + Tailwind CSS v4

PWA web app for iPhone homescreen. Desktop sidebar + mobile bottom nav.

## Commands
```bash
npm run dev          # Vite dev server (port 3338 dev / 3337 prod)
npm run build        # tsc + vite build
npm test             # Vitest
npm run lint         # ESLint
```

## Structure
```
src/
├── App.tsx               # React Router v7, 8 routes wrapped in Layout
├── main.tsx              # Entry point, driver.js CSS import
├── index.css             # Tailwind v4 @theme block, global styles
├── components/           # Shared components
│   ├── Layout.tsx        # Desktop sidebar + mobile bottom nav (z-50)
│   ├── Modal.tsx         # Bottom-sheet mobile / centered desktop (z-[60])
│   ├── EmptyState.tsx    # Reusable empty placeholder
│   ├── FAB.tsx           # Floating action button
│   ├── LocationPicker.tsx # Mapbox geocoding (Vietnam, Vietnamese)
│   ├── PhotoUpload.tsx   # Photo upload with preview
│   ├── PhotoGallery.tsx  # Lightbox gallery
│   ├── VoiceMemoSection.tsx
│   └── photobooth/       # Photo booth sub-components
├── pages/                # Page components (one per route)
│   ├── Dashboard.tsx
│   ├── MomentsPage.tsx
│   ├── MomentDetail.tsx
│   ├── MapPage.tsx       # Mapbox GL JS
│   ├── GoalsPage.tsx     # Kanban drag-and-drop
│   ├── SprintDetail.tsx
│   ├── FoodSpotsPage.tsx
│   ├── RecipesPage.tsx
│   ├── LoveLettersPage.tsx
│   ├── DatePlannerPage.tsx
│   ├── PhotoBoothPage.tsx
│   ├── WeeklyRecapPage.tsx
│   ├── MonthlyRecapPage.tsx  # Instagram Stories-style viewer
│   ├── AchievementsPage.tsx
│   ├── MorePage.tsx
│   ├── NotificationsPage.tsx
│   └── LoginPage.tsx
├── lib/
│   ├── api.ts            # API client + react-query (30s stale time)
│   ├── uploadQueue.ts    # Background upload queue with progress toast
│   └── useModuleTour.ts  # Driver.js tour hook
├── types/index.ts        # Shared TypeScript interfaces
└── test/                 # Vitest tests
```

## Key Patterns
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` (NOT PostCSS). Theme in `@theme` block in `index.css`
- **Colors**: primary `#E8788A`, secondary `#F4A261`, accent `#7EC8B5`
- **Fonts**: Playfair Display (headings `font-heading`), Inter (body `font-body`)
- **Data layer**: `@tanstack/react-query` for caching. API client in `lib/api.ts`
- **File uploads**: ALWAYS use `uploadQueue.enqueue()` — never `await` uploads
- **Tours**: Every module has driver.js tour via `useModuleTour()`. 12 modules covered
- **Modals**: z-[60] above bottom nav z-50. Full-screen overlays z-[70]
- **PWA**: `manifest.json`, Apple meta tags, `viewport-fit=cover`, safe areas via `env(safe-area-inset-*)`

## Gotchas
- Mapbox CSS: load via `<link>` in `index.html` (NOT CSS `@import` — Tailwind v4 conflict)
- iOS input zoom: all inputs `font-size: 16px !important`
- Driver.js CSS: import in `main.tsx` (NOT `index.css`)

## Environment
- Dev: port 3338, proxies `/api` → :5006
- Prod: port 3337, proxies `/api` → :5005

## PM2 Process Names
- Production: `love-scrum-web`
- Dev: `love-scrum-dev-web`
