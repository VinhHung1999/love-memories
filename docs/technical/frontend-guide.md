# Frontend Architecture Guide

## 1. File Structure

```
frontend/
├── public/
│   ├── manifest.json              # PWA config
│   ├── icon-192.png, icon-512.png # App icons
│   └── sw.js                      # Service worker stub
├── src/
│   ├── main.tsx                   # Entry: providers (QueryClient, Router, Auth, Toast)
│   ├── App.tsx                    # Route definitions (24 routes)
│   ├── index.css                  # Tailwind @theme + custom utilities
│   ├── pages/                     # 24 page components
│   ├── components/                # 35+ shared components
│   │   └── photobooth/            # 9 photo booth sub-components
│   ├── lib/                       # Hooks, utilities, API client
│   │   └── photobooth/            # Canvas utils, filters, frames, stickers, overlays
│   └── types/
│       └── index.ts               # All TypeScript interfaces (30+ types)
├── index.html                     # HTML template with PWA meta, Mapbox CSS, fonts
├── vite.config.ts                 # Vite + React + Tailwind v4 + proxy config
├── tsconfig.json                  # ES2020, strict, no emit
└── package.json
```

## 2. Routes (24 pages)

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Dashboard | Home: timer, carousel, modules, FAB |
| `/moments` | MomentsPage | Memory list with filters |
| `/moments/:id` | MomentDetail | Single moment: photos, audio, comments, reactions |
| `/foodspots` | FoodSpotsPage | Food venue list with ratings |
| `/foodspots/:id` | FoodSpotDetail | Single food spot: photos, map |
| `/map` | MapPage | Mapbox interactive map with pins |
| `/goals` | GoalsPage | Kanban board with sprints |
| `/goals/sprint/:id` | SprintDetail | Sprint detail with 3-column Kanban |
| `/recipes` | RecipesPage | Recipe collection |
| `/recipes/:id` | RecipeDetail | Recipe: ingredients, steps, photos |
| `/what-to-eat` | CookingSessionPage | Cooking session: select recipes |
| `/what-to-eat/:id` | CookingSessionFlow | Active session: shopping → cooking → photos |
| `/what-to-eat/history` | CookingSessionHistory | Past sessions with ratings |
| `/photobooth` | PhotoBoothPage | Photo editor: camera, filters, frames |
| `/achievements` | AchievementsPage | Badge grid with unlock status |
| `/notifications` | NotificationsPage | Notification feed |
| `/date-planner` | DatePlannerPage | Wishes + date plans |
| `/date-planner/plans/:id` | DatePlanDetailPage | Plan timeline with stops |
| `/love-letters` | LoveLettersPage | Inbox/sent letters |
| `/weekly-recap` | WeeklyRecapPage | Weekly stats dashboard |
| `/monthly-recap` | MonthlyRecapPage | Instagram Stories viewer |
| `/expenses` | ExpensesPage | Budget tracking with charts |
| `/more` | MorePage | Settings, profile, tour reset |
| (no route) | LoginPage | Auth: login/register |

## 3. Shared Components (35+)

### Core Layout

| Component | File | Purpose |
|-----------|------|---------|
| **Layout** | `components/Layout.tsx` | Desktop sidebar (w-64) + mobile bottom nav (z-50). Safe area insets. 5 nav items. |
| **Modal** | `components/Modal.tsx` | Bottom-sheet (mobile) / centered (desktop). z-[60]. Framer Motion. Sticky header. |
| **FAB** | `components/FAB.tsx` | Floating action button (z-[55]). Speed dial: Moment, Food Spot, Photo Booth. Dashboard only. |

### Form Modals

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| **CreateMomentModal** | Create moment form | `isOpen`, `onClose`, `onCreated` |
| **MomentEditModal** | Edit existing moment | `moment`, `isOpen`, `onClose`, `onUpdated` |
| **CreateFoodSpotModal** | Create food spot form | `isOpen`, `onClose`, `onCreated`, `defaultLocation?` |
| **FoodSpotEditModal** | Edit food spot | `foodSpot`, `isOpen`, `onClose`, `onUpdated` |
| **GoalDetailModal** | Create/edit goal | `goal?`, `sprintId?`, `isOpen`, `onClose`, `onSaved` |
| **PlanFormModal** | Date plan with stops | `plan?`, `isOpen`, `onClose`, `onSaved` |
| **AddExpenseModal** | Expense with receipt | `expense?`, `defaults?`, `isOpen`, `onClose`, `onSaved` |

### Media Components

| Component | Purpose |
|-----------|---------|
| **PhotoUpload** | Dropzone for image selection with progress |
| **PhotoGallery** | Fullscreen image lightbox/carousel (z-[70]) with pinch-to-zoom, swipe |
| **VoiceMemoSection** | Audio playback with waveform, iOS-compatible proxy URLs |
| **LetterReadOverlay** | Full-screen letter viewer (z-[80]) with photo slideshow + audio |
| **LocationPicker** | Mapbox geocoding (Vietnam), click-on-map, browser geolocation |

### UI Utilities

| Component | Purpose |
|-----------|---------|
| **ActionButtons** | ActionLink, ActionPill, DirectionsLink (Google Maps) |
| **EmptyState** | Placeholder for empty lists |
| **LoadingSkeleton** | Grid skeleton loading states |
| **RatingStars** | 5-star rating display/input |
| **MomentCard** | Moment preview card (photo, title, date, tags) |
| **FoodSpotCard** | Food spot preview (photo, rating, tags) |
| **UploadProgressBar** | Global upload progress tracking |
| **UploadToast** | Toast notifications for upload status (success/error/retry) |
| **RelationshipTimer** | Live countdown (years/months/days/hours/minutes/seconds) |
| **RandomFoodPicker** | Random nearby food spot recommendation |
| **OnboardingOverlay** | First-time user guide |

### Photo Booth Sub-Components (`components/photobooth/`)

| Component | Purpose |
|-----------|---------|
| **CameraCapture** | Camera stream (video → canvas capture) |
| **PhotoSelector** | Gallery photo picker |
| **FilterSelector** | Filter preview grid (8 filters) |
| **StickerPanel** | Emoji sticker selector + drag placement |
| **OverlaySelector** | Frame overlay picker (9 designs) |
| **FrameSelector** | Frame layout picker (Polaroid, strip, gallery) |
| **ColorPicker** | Frame color customization |
| **CanvasPreview** | Final canvas preview + download |
| **SharePanel** | Web Share API + Clipboard + Download |

## 4. API Client (`lib/api.ts`)

Organized by domain. All functions use `fetch` with Bearer token from localStorage.

| Domain | Functions | Key Operations |
|--------|-----------|----------------|
| **momentsApi** | `list`, `get`, `create`, `update`, `delete`, `uploadPhotos`, `deletePhoto`, `uploadAudio`, `deleteAudio`, `getComments`, `addComment`, `deleteComment`, `toggleReaction` | Full CRUD + media |
| **foodSpotsApi** | `list`, `get`, `create`, `update`, `delete`, `uploadPhotos`, `deletePhoto`, `getRandom` | CRUD + random picker |
| **mapApi** | `getPins` | Combined moment+foodspot pins |
| **tagsApi** | `list`, `upsert` | Tag icon/color management |
| **sprintsApi** | `list`, `get`, `getActive`, `create`, `update`, `updateStatus`, `delete` | Sprint CRUD |
| **goalsApi** | `getBacklog`, `getBySprint`, `create`, `createForSprint`, `update`, `updateStatus`, `assign`, `reorder`, `delete` | Kanban operations |
| **settingsApi** | `get`, `set` | Key-value settings |
| **recipesApi** | `list`, `get`, `create`, `update`, `delete`, `uploadPhotos`, `deletePhoto` | Recipe CRUD |
| **cookingSessionsApi** | `getActive`, `list`, `get`, `create`, `updateStatus`, `toggleItem`, `toggleStep`, `uploadPhotos`, `rate`, `delete` | Session flow |
| **achievementsApi** | `getAll` | Auto-evaluate + list |
| **profileApi** | `updateName`, `uploadAvatar` | User profile |
| **aiApi** | `generateRecipe`, `scanReceipt` | AI features |
| **notificationsApi** | `list`, `getUnreadCount`, `markRead`, `markAllRead`, `delete` | Notification management |
| **dateWishesApi** | `list`, `create`, `update`, `markDone`, `delete` | Wish CRUD |
| **datePlansApi** | `list`, `get`, `create`, `update`, `updateStatus`, `markStopDone`, `linkMoment`, `linkFoodSpot`, `updateStopCost`, `addSpot`, `deleteSpot`, `delete` | Plan management |
| **loveLettersApi** | `getReceived`, `getSent`, `getUnreadCount`, `get`, `create`, `update`, `send`, `delete`, `uploadPhotos`, `deletePhoto`, `uploadAudio`, `deleteAudio` | Letter flow |
| **expensesApi** | `list`, `listByPlan`, `get`, `create`, `update`, `delete`, `getStats`, `getDailyStats`, `getLimits`, `setLimits`, `uploadReceipt`, `scanReceipt` | Budget tracking |
| **recapApi** | `getWeekly`, `getMonthly`, `getMonthlyCaption` | Recap data + AI captions |

### Token Handling

```typescript
function getToken(): string | null {
  return localStorage.getItem('love-scrum-token');
}

// All requests include:
headers: { 'Authorization': `Bearer ${getToken()}` }

// 401 response handler:
if (res.status === 401) {
  localStorage.removeItem('love-scrum-token');
  window.location.href = '/login';
}
```

## 5. TypeScript Types (`types/index.ts`)

### Core Entities

| Type | Key Fields |
|------|-----------|
| `Moment` | id, title, caption, date, latitude, longitude, location, tags, spotifyUrl, photos[], audios[], comments[], reactions[] |
| `FoodSpot` | id, name, description, rating, latitude, longitude, location, tags, priceRange, photos[] |
| `Recipe` | id, title, description, ingredients[], ingredientPrices[], steps[], stepDurations[], tags, notes, tutorialUrl, cooked, foodSpotId, photos[] |
| `Sprint` | id, name, description, startDate, endDate, status, goals[] |
| `Goal` | id, title, description, status, priority, assignee, dueDate, order, sprintId |
| `LoveLetter` | id, senderId, recipientId, title, content, mood, status, scheduledAt, deliveredAt, readAt, sender, recipient, photos[], audio[] |
| `DateWish` | id, title, description, category, address, latitude, longitude, url, tags, done, doneAt, linkedMomentId, linkedFoodSpotId |
| `DatePlan` | id, title, date, notes, status, stops[] |
| `DatePlanStop` | id, planId, time, title, description, address, latitude, longitude, category, order, done, cost, spots[] |
| `Expense` | id, amount, description, category, date, note, receiptUrl, foodSpotId, datePlanId |
| `CookingSession` | id, status, startedAt, completedAt, totalTimeMs, notes, rating, recipes[], items[], steps[], photos[] |

### Enums (as TypeScript union types)

| Type | Values |
|------|--------|
| `SprintStatus` | `'PLANNING' \| 'ACTIVE' \| 'COMPLETED' \| 'CANCELLED'` |
| `GoalStatus` | `'TODO' \| 'IN_PROGRESS' \| 'DONE'` |
| `GoalPriority` | `'LOW' \| 'MEDIUM' \| 'HIGH'` |
| `LetterStatus` | `'DRAFT' \| 'SCHEDULED' \| 'DELIVERED' \| 'READ'` |
| `CookingSessionStatus` | `'selecting' \| 'shopping' \| 'cooking' \| 'photo' \| 'completed'` |
| `ExpenseCategory` | `'food' \| 'dating' \| 'shopping' \| 'transport' \| 'gifts' \| 'other'` |

### Sub-Types

| Type | Parent | Fields |
|------|--------|--------|
| `MomentPhoto` | Moment | id, momentId, filename, url, createdAt |
| `MomentAudio` | Moment | id, momentId, filename, url, duration, createdAt |
| `MomentComment` | Moment | id, momentId, author, content, createdAt, user? |
| `MomentReaction` | Moment | id, momentId, emoji, author, createdAt |
| `FoodSpotPhoto` | FoodSpot | id, foodSpotId, filename, url, createdAt |
| `RecipePhoto` | Recipe | id, recipeId, filename, url, createdAt |
| `LetterPhoto` | LoveLetter | id, letterId, filename, url, createdAt |
| `LetterAudio` | LoveLetter | id, letterId, filename, url, duration, createdAt |
| `DatePlanSpot` | DatePlanStop | id, stopId, title, address, latitude, longitude, url, notes, order |
| `CookingSessionRecipe` | CookingSession | id, sessionId, recipeId, recipe, order, completedAt |
| `CookingSessionItem` | CookingSession | id, sessionId, ingredient, price, checked, checkedAt |
| `CookingSessionStep` | CookingSession | id, sessionId, recipeId, stepIndex, content, durationSeconds, checked, checkedBy, checkedAt |
| `MapPin` | — | id, type, title, latitude, longitude, location, tags, tagIcon, thumbnail |

### Data Types

| Type | Purpose |
|------|---------|
| `Achievement` | key, title, description, icon, category, unlocked, unlockedAt |
| `AppNotification` | id, userId, type, title, message, link, read, createdAt |
| `TagMetadata` | id, name, icon, color |
| `WeeklyRecap` | week, startDate, endDate, moments, cooking, foodSpots, datePlans, loveLetters, goalsCompleted, achievementsUnlocked |
| `MonthlyRecap` | Same as weekly + photos per category |
| `ExpenseStats` | total, count, month, byCategory |
| `DailyStats` | month, days[] with date + total + byCategory |

## 6. Hooks & Utilities

### Authentication (`lib/auth.tsx`)

React Context provider wrapping entire app.

```typescript
const { user, isAuthenticated, isLoading, login, register, logout, updateUser } = useAuth();
```

- Token stored in `localStorage` key `love-scrum-token`
- Auto-verifies token on mount via `GET /api/auth/me`
- `isLoading` state for initial auth check
- On logout: clears token + redirects to login

### Module Tour (`lib/useModuleTour.ts`)

Driver.js integration for guided onboarding.

```typescript
const { replay } = useModuleTour('moments', [
  { element: '[data-tour="create-btn"]', popover: { title: '...', description: '...' } }
], 600); // 600ms delay
```

- Tracks completion in DB: `tour_done__{moduleKey}__{userId}`
- Auto-starts on first visit (when setting is null)
- `replay()` function for manual restart (MorePage button)
- 12 modules have tours

### Upload Queue (`lib/uploadQueue.ts`)

Singleton non-blocking upload manager.

```typescript
uploadQueue.enqueue(
  'moment-photos-123',           // unique ID
  'Uploading photos...',         // label for toast
  (onProgress) => api.upload(files, onProgress),  // upload function
  (result) => invalidateQueries()                  // success callback
);
```

States: `uploading` (progress 0–100%) → `success` (auto-dismiss 3s) → `error` (retry button)

### Upload With Progress (`lib/uploadWithProgress.ts`)

XMLHttpRequest wrapper for file uploads with progress events.

```typescript
const response = await uploadWithProgress(formData, token, (percent) => setProgress(percent));
```

- 5-minute timeout
- Uses XHR (not fetch) for `onprogress` support

### Voice Recorder (`lib/useVoiceRecorder.ts`)

MediaRecorder hook for audio recording.

```typescript
const { isRecording, duration, start, stop } = useVoiceRecorder();
// stop() returns: { file: File, duration: number }
```

- MIME type detection: prefers `audio/mp4`, falls back to `audio/ogg`, `audio/webm`
- Returns `.m4a` File for iOS compatibility

### Achievement Check (`lib/achievements.ts`)

```typescript
const checkAchievements = useCheckAchievements();
// Call after any action that might unlock achievements:
await checkAchievements();
```

- Diffs unlocked achievements before/after
- Fires confetti + toast for new unlocks
- Deduplication via localStorage

### App Name (`lib/useAppName.ts`)

```typescript
const appName = useAppName(); // Default: 'Love Scrum'
```

Uses React Query deduplication — multiple components share one fetch.

### Unread Count (`lib/useUnreadCount.ts`)

```typescript
const count = useUnreadCount();
```

Refetches every 10s + on window focus.

### Dashboard Modules (`lib/modules.ts`)

```typescript
export const modules: Module[] = [
  { to: '/what-to-eat', icon: ChefHat, label: 'What to Eat', description: '...', color: '...' },
  // ... 9 modules total
];
```

Shared between Dashboard and any consumer. Each has: route, Lucide icon, label, description, gradient color.

## 7. State Management

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,  // 30 seconds
      retry: 1,
    },
  },
});
```

### Query Key Patterns

| Key | Data |
|-----|------|
| `['moments']` | All moments list |
| `['moments', id]` | Single moment detail |
| `['foodspots']` | All food spots |
| `['foodspots', id]` | Single food spot |
| `['recipes']` | All recipes |
| `['sprints']` | All sprints |
| `['goals', 'backlog']` | Backlog goals |
| `['goals', 'sprint', id]` | Sprint goals |
| `['date-wishes']` | All wishes |
| `['date-plans']` | All plans |
| `['date-plans', id]` | Single plan |
| `['love-letters', 'received']` | Inbox |
| `['love-letters', 'sent']` | Sent letters |
| `['love-letters', 'unread-count']` | Unread badge |
| `['expenses']` | Expense list |
| `['expenses-stats']` | Monthly stats |
| `['expenses-daily-stats']` | Daily breakdown |
| `['expenses-plan', id]` | Plan-linked expenses |
| `['cooking-session', 'active']` | Active session |
| `['cooking-sessions']` | Session history |
| `['achievements']` | All achievements |
| `['notifications']` | Notification list |
| `['notifications', 'unread-count']` | Unread count |
| `['settings', key]` | Single setting |
| `['recap', 'weekly', week]` | Weekly recap |
| `['recap', 'monthly', month]` | Monthly recap |

### Cache Invalidation Pattern

On every mutation (create/update/delete):
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['entities'] });      // list
  queryClient.invalidateQueries({ queryKey: ['entities', id] });  // detail (if applicable)
}
```

On login: `queryClient.invalidateQueries()` — clears all caches for fresh data.

## 8. Styling

### Tailwind CSS v4

Configured via Vite plugin (not PostCSS):
```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
plugins: [react(), tailwindcss()]
```

### Theme (`index.css` @theme block)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#E8788A` | Main pink — buttons, links, active states |
| `--color-primary-light` | `#F2A5B0` | Hover states |
| `--color-primary-dark` | `#D45A6E` | Pressed states |
| `--color-secondary` | `#F4A261` | Orange accent |
| `--color-secondary-light` | `#F7BE8F` | |
| `--color-accent` | `#7EC8B5` | Teal accent |
| `--color-accent-dark` | `#5BAA97` | |
| `--color-bg` | `#FFF8F6` | Page background (off-white) |
| `--color-bg-card` | `#FFFFFF` | Card background |
| `--color-text` | `#2D2D2D` | Primary text |
| `--color-text-light` | `#6B7280` | Secondary text |
| `--color-border` | `#F0E6E3` | Border color |
| `--font-heading` | `'Playfair Display', serif` | Headings (`font-heading`) |
| `--font-body` | `'Inter', sans-serif` | Body text (`font-body`) |

### Z-Index Hierarchy

| Z-Index | Element | File |
|---------|---------|------|
| `z-50` | Bottom navigation | `Layout.tsx` |
| `z-[54]` | FAB backdrop | `FAB.tsx` |
| `z-[55]` | FAB button | `FAB.tsx` |
| `z-[60]` | Modals | `Modal.tsx` |
| `z-[70]` | Full-screen overlays | `PhotoGallery.tsx`, `MonthlyRecapPage.tsx` |
| `z-[71–73]` | Overlay internal layers | `MonthlyRecapPage.tsx` |
| `z-[80]` | Letter lightbox | `LetterReadOverlay.tsx` |

### Custom CSS Utilities

| Class/Keyframe | Purpose |
|----------------|---------|
| `.shimmer-overlay` | Gradient sweep animation (2.4s infinite) for card sparkle |
| `@keyframes progressFill` | Width 0%→100% for Stories progress bars |
| `.hide-scrollbar` | Hide scrollbar (webkit + Firefox) |
| `input, textarea, select { font-size: 16px !important }` | Prevents iOS auto-zoom |

### Driver.js Custom Styles

```css
.driver-popover { border-radius: 16px; padding: 20px; }
.driver-popover-title { font-family: 'Playfair Display'; color: primary; }
.driver-popover-prev-btn, .driver-popover-next-btn {
  background: primary; text-shadow: none !important; /* Prevents double text */
}
```

**CSS import:** `import 'driver.js/dist/driver.css'` in `main.tsx` (NOT in `index.css` — Tailwind v4 PostCSS conflict).

### Mapbox CSS

Loaded via `<link>` tag in `index.html` (NOT CSS `@import` — PostCSS conflict with Tailwind v4).

## 9. PWA Configuration

### manifest.json

```json
{
  "name": "Love Scrum",
  "short_name": "Love Scrum",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFF8F6",
  "theme_color": "#E8788A",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192" },
    { "src": "/icon-512.png", "sizes": "512x512" }
  ]
}
```

### HTML Meta Tags (`index.html`)

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Love Scrum" />
```

## 10. Provider Stack (`main.tsx`)

```
StrictMode
  └── QueryClientProvider (React Query)
        └── BrowserRouter (React Router v7)
              └── AuthProvider (Custom auth context)
                    └── App (Routes)
                    └── Toaster (react-hot-toast, bottom-right)
```

CSS imports in `main.tsx`:
```typescript
import './index.css';              // Tailwind theme + custom utilities
import 'driver.js/dist/driver.css'; // Driver.js styles
```

## 11. Dependencies

### Runtime

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` (v19) | UI framework |
| `react-router-dom` (v7) | Routing |
| `@tanstack/react-query` (v5) | Data fetching + cache |
| `framer-motion` (v12) | Animations |
| `react-hot-toast` | Toast notifications |
| `lucide-react` | Icon library |
| `swiper` (v12) | Carousel (Dashboard) |
| `recharts` (v3) | Charts (Expenses) |
| `canvas-confetti` | Achievement celebration |
| `@hello-pangea/dnd` (v17) | Drag-and-drop (Kanban) |
| `mapbox-gl` (v3) | Maps |
| `react-dropzone` | File upload dropzone |
| `driver.js` | Guided tours |
| `date-fns` (v4) | Date formatting |
| `tailwindcss` (v4) | Styling |

### Dev

| Package | Purpose |
|---------|---------|
| `vite` (v6) | Build tool + dev server |
| `vitest` (v3) | Test runner |
| `@testing-library/react` (v16) | React testing |
| `eslint` (v9) | Linting |
| `@tailwindcss/vite` | Tailwind v4 Vite plugin |

## 12. Driver.js Tour System

### Architecture

1. Each page defines tour steps with `data-tour` attributes on key elements
2. `useModuleTour(moduleKey, steps)` hook handles:
   - Check if tour completed: `GET /api/settings/tour_done__{moduleKey}__{userId}`
   - If not completed: show tour after 600ms DOM delay
   - On complete: `PUT /api/settings/tour_done__{moduleKey}__{userId}` with value `'true'`

### All 12 Module Tours

| Module Key | Page |
|-----------|------|
| `dashboard` | Dashboard |
| `moments` | MomentsPage |
| `map` | MapPage |
| `goals` | GoalsPage |
| `recipes` | RecipesPage |
| `love-letters` | LoveLettersPage |
| `date-planner` | DatePlannerPage |
| `photobooth` | PhotoBoothPage |
| `weekly-recap` | WeeklyRecapPage |
| `monthly-recap` | MonthlyRecapPage |
| `achievements` | AchievementsPage |
| `what-to-eat` | CookingSessionPage |

### Tour Reset

MorePage has "Xem lai huong dan" button that deletes all `tour_done__*` settings, stored in `TOUR_KEYS` array.

## 13. Photo Booth Architecture

Entirely client-side Canvas 2D — no backend storage.

### Utilities (`lib/photobooth/`)

| File | Purpose |
|------|---------|
| `canvas-utils.ts` | `createCanvas()`, `loadImage()` (handles data: URLs + CORS proxy), `drawImageCover()`, `roundRect()`, `downloadCanvas()`, `renderFilteredImage()` |
| `filters.ts` | 8 filters: Grayscale, Sepia, Brightness, Saturation, Contrast, Warm, Cool, Vintage. Each has CSS string + Canvas apply function. |
| `frames.ts` | Frame definitions with `render()` function. Gallery frames (Polaroid, 2x2, collage) + strip layouts (Classic 4-photo, Duo, Triple, Grid). |
| `stickers.ts` | 21 stickers in 3 categories (love/fun/text). `PlacedSticker` with position, scale, rotation. |
| `overlays.ts` | 9 overlay designs drawn on Canvas 2D (hearts, stars, borders). |
| `useCamera.ts` | Camera stream hook: getUserMedia, front/rear toggle, captureFrame with cover-crop + mirror. |

### Compositing Pipeline

```
frame.render(photos, filter, []) → base canvas (no stickers)
  → apply overlay
    → draw stickers on top
      → final result canvas (download/share)
```

### CORS Handling

CDN images → `/api/proxy-image?url=` → same-origin response → canvas not tainted.
Camera captures → `data:` URL → loaded directly (no fetch needed).
