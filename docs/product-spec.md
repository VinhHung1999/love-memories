# Love Scrum — Product Specification

## 1. Overview

**Love Scrum** is a personal couples app for saving moments/memories, tracking food spots with map pins, managing shared goals via scrum sprints, planning dates, exchanging love letters, cooking together, and tracking expenses. It is designed as a two-user private app for a couple — no public profiles, no social features, no third-party access.

### Vision

A single app that replaces scattered tools (Google Photos, Notes, Maps, Trello, spreadsheets) with a unified, beautifully designed experience tailored for two people in a relationship.

### Target Users

- **Primary:** A couple (2 users) sharing daily life activities
- **Device:** iPhone (PWA installed to homescreen), with desktop support
- **Language:** Vietnamese UI labels throughout

### Key Principles

- **No authentication complexity** — whitelist-only registration (2 allowed emails)
- **Offline-friendly** — PWA with standalone display mode
- **Mobile-first** — bottom navigation, safe-area-aware, touch-optimized
- **Non-blocking uploads** — all file uploads happen in the background via upload queue
- **Guided onboarding** — every module has a Driver.js tour on first visit

---

## 2. Modules

Love Scrum has **14 modules**, each accessible from the dashboard or navigation.

---

### 2.1 Dashboard (`/`)

The home screen showing a summary of the couple's activity.

**Components:**
- **Relationship Timer** — live countdown showing years, months, days, hours, minutes, seconds since the relationship start date (stored in DB, syncs across devices)
- **Recent Moments Carousel** — Swiper horizontal scroll showing latest moments with photos
- **Active Cooking Session** — card linking to in-progress cooking session (if any)
- **Monthly Recap Pin** — eye-catching gradient card with floating hearts + shimmer, shown days 1–3 of each month
- **Love Letter Inbox Preview** — unread letter count with quick access
- **Module Grid** — 9 bento-style cards linking to all major features (What to Eat, Food Spots, Recipes, Photo Booth, Achievements, Date Planner, Love Letters, Monthly Recap, Budget)
- **FAB (Floating Action Button)** — speed dial for quick-create: Moment, Food Spot, Photo Booth

**Business Rules:**
- Relationship start date is persisted in `app_settings` table (not localStorage)
- Timer updates every second via `setInterval`
- Monthly recap card only appears on days 1–3 of each month

---

### 2.2 Moments (`/moments`, `/moments/:id`)

Save and browse memories/moments with photos, voice memos, location, tags, and Spotify links.

**User Flow:**
1. Tap "+" or FAB → Create Moment modal
2. Fill in: title, caption (optional), date, location (via LocationPicker), tags, Spotify URL
3. Save → moment created (photos uploaded in background)
4. View moment detail → see photos (gallery with pinch-to-zoom), play voice memos, read/add comments, add emoji reactions

**Features:**
- Up to 10 photos per moment (background upload via queue)
- Voice memo recording (MediaRecorder API) with duration tracking
- Comments with author name
- Emoji reactions (8 preset emojis, toggle on/off) — unique per emoji+author
- Tag filtering on list page
- Spotify URL integration for song-of-the-moment
- Location displayed on map pin

**Business Rules:**
- Photos uploaded to CDN, stored as `MomentPhoto` records
- Audio uploaded to CDN as `.m4a` files for iOS compatibility
- Deleting a moment cascades to all photos, audios, comments, reactions
- Notifications sent to partner on new moment, comment, or reaction

---

### 2.3 Food Spots (`/foodspots`, `/foodspots/:id`)

Track restaurants and food venues the couple has visited.

**User Flow:**
1. Tap "+" → Create Food Spot modal
2. Fill in: name, description, rating (1–5 stars), location, tags, price range (1–4)
3. Upload photos
4. View on map or in list

**Features:**
- Star rating (0–5, displayed with `RatingStars` component)
- Price range indicator ($ to $$$$)
- Location with map preview
- Photo gallery
- Tag-based filtering
- **Random Food Picker** — "What should we eat?" feature recommending a random spot within a configurable radius from current location (haversine distance)

**Business Rules:**
- Photos uploaded to CDN via background queue
- Cascade delete on photos
- Random picker uses GPS + haversine distance calculation on backend

---

### 2.4 Map (`/map`)

Interactive Mapbox map showing all moments and food spots as pins.

**User Flow:**
1. Open Map → see all pins clustered by location
2. Filter by type (All / Moments / Food Spots)
3. Filter by tags (multi-select chip UI)
4. Tap pin → see popup with photo thumbnail, title, link to detail page
5. Tap geolocate button → center on current location

**Features:**
- Mapbox GL JS with custom emoji markers per tag
- Combined pins from both moments and food spots
- Tag filter with emoji icons (via `EmojiPickerPopup`)
- `GeolocateControl` for current-location centering
- Invalid coordinates filtered before rendering

**Business Rules:**
- Only items with valid lat/lng appear on map
- Backend `/api/map/pins` combines both data sources

---

### 2.5 Goals & Sprints (`/goals`, `/goals/sprint/:id`)

Kanban-style goal management using scrum methodology.

**User Flow:**
1. Create a Sprint (name, dates, description)
2. Add Goals to sprint or backlog
3. Drag-and-drop goals between TODO → IN_PROGRESS → DONE columns
4. Complete sprint when all goals are done

**Features:**
- Sprint statuses: PLANNING → ACTIVE → COMPLETED / CANCELLED
- Goal priorities: LOW, MEDIUM, HIGH (color-coded)
- Assignee field (for which person in the couple)
- Due dates
- Backlog for unassigned goals
- Drag-and-drop via `@hello-pangea/dnd`
- Bulk reorder API for efficient position updates

**Business Rules:**
- Goals can be moved between sprints or back to backlog
- Sprint status transitions are manual (not auto)
- Goal order preserved via `order` field, updated on drag-drop

---

### 2.6 Recipes (`/recipes`, `/recipes/:id`)

Recipe collection with ingredients, cooking steps, costs, and tutorial videos.

**User Flow:**
1. Add recipe manually or generate via AI (text description, YouTube URL, or recipe URL)
2. View recipe: ingredients with prices, step-by-step instructions with durations, photos, tutorial link
3. Optionally link to a Food Spot
4. Start a Cooking Session from selected recipes

**Features:**
- Ingredient list with individual prices (VND)
- Step-by-step instructions with per-step duration
- YouTube tutorial URL
- AI recipe generation via xAI Grok (text/YouTube/URL input)
- Photo gallery
- "Cooked" status toggle
- Link recipe to food spot origin

**Business Rules:**
- AI generation extracts structured data (title, ingredients, steps, tags, prices, durations)
- YouTube mode fetches transcript first, then sends to AI
- URL mode scrapes page HTML via cheerio, extracts recipe text
- Prices reference a static `ingredient-prices.txt` file
- Portions always scaled for 2 people

---

### 2.7 What to Eat / Cooking Sessions (`/what-to-eat`, `/what-to-eat/:id`, `/what-to-eat/history`)

Guided cooking experience from recipe selection to plating.

**User Flow:**
1. Select 1+ recipes → Create Cooking Session
2. **Shopping phase:** checklist of merged ingredients (deduplicated across recipes)
3. **Cooking phase:** step-by-step checklist with per-step timers
4. **Photo phase:** capture dish photos
5. **Rate & complete:** give 1–5 star rating

**Session Statuses:** `selecting` → `shopping` → `cooking` → `photo` → `completed`

**Features:**
- Auto-merges ingredients from multiple recipes (case-insensitive dedup)
- Shopping item checkbox tracking
- Cooking step checkbox with `checkedBy` attribution
- Per-step timer based on `durationSeconds`
- Session photo upload
- Rating (1–5 stars)
- History view of all completed sessions
- Active session indicator on Dashboard

**Business Rules:**
- Only 1 active session allowed at a time
- `totalTimeMs` auto-calculated on completion
- Creating session auto-generates items + steps from selected recipes
- Cascade delete on photos, items, steps, recipe links

---

### 2.8 Photo Booth (`/photobooth`)

Client-side photo editor with camera capture, filters, frames, stickers, and overlays.

**Two Modes:**

**Gallery Mode (5 steps):**
1. Choose Frame (Polaroid, strips, gallery layouts)
2. Select Photos from device
3. Apply Filter (Grayscale, Sepia, Warm, Cool, Vintage, etc.)
4. Add Stickers (21 stickers in 3 categories: love/fun/text)
5. Preview & Download

**Camera Mode (4 steps):**
1. Choose Strip Layout (Classic 4-photo, Duo, Triple, Grid 2x2)
2. Camera Capture with countdown timer
3. Customize (filter + stickers)
4. Preview, Share, Download

**Features:**
- 8 image filters implemented as CSS/Canvas operations
- 8 gallery frames + 4 strip layouts
- 9 overlay designs drawn on Canvas 2D
- 21 stickers (emoji-based, draggable placement)
- Canvas 2D compositing pipeline (base → overlay → stickers)
- Web Share API + Clipboard API + Download PNG
- Cover-crop with mirror for selfie camera
- CORS proxy for CDN images to avoid canvas taint

**Business Rules:**
- Entirely client-side (Canvas 2D) — no backend storage
- Backend only provides `/api/proxy-image` for CORS bypass
- Entry point: Dashboard FAB + CTA card only (no main nav tab)

---

### 2.9 Achievements (`/achievements`)

Gamification system with auto-unlocking badges.

**Achievement Categories (42 total):**
- **Moments:** first, 10, 50, 100
- **Cooking:** first, 5, 10, 20, 50 sessions
- **Recipes:** first, 10, 25, AI-generated
- **Food Spots:** first, 10, 25
- **Goals:** first sprint, 10 done, 25 done
- **Time-based:** week 1, month 1, month 6, year 1, year 2

**User Flow:**
1. Visit Achievements page → auto-check triggers evaluation
2. Newly unlocked achievements show confetti + toast notification
3. Browse all achievements with locked/unlocked status

**Business Rules:**
- Auto-unlock evaluated on page visit (not in real-time)
- Deduplication via localStorage to prevent repeat confetti
- Notification sent to partner when achievement unlocked
- `Achievement` table stores key + unlockedAt
- `CustomAchievement` table allows user-defined badges

---

### 2.10 Date Planner (`/date-planner`, `/date-planner/plans/:id`)

Plan dates with a wishlist and detailed itineraries.

**Two Tabs:**

**Wishes Tab ("Muon di"):**
- Add places/activities the couple wants to try
- Fields: title, description, category (eating/travel/entertainment/cafe/shopping), location, URL, tags
- Mark as done (optionally link to created Moment or Food Spot)

**Plans Tab ("Ke hoach"):**
- Create date plans with ordered stops
- Each stop: time, title, description, location, category, notes, cost
- Sub-spots (alternative options within a stop)
- Link stops to Moments or Food Spots after visiting
- Google Maps directions between stops

**Plan Detail Page:**
- Timeline view with progress bar (active plans only)
- Current stop highlighted
- Mark stops as done
- Cost tracking per stop
- Gallery carousel for completed plans (photos from linked moments)

**Plan Statuses:** `planned` → `active` → `completed`

**Business Rules:**
- Auto-status: planned → active on the plan date, active → completed when all stops done
- Stop cost tracked for budget integration
- Expenses can be linked to a date plan via `datePlanId`
- Cascade delete: plan → stops → spots

---

### 2.11 Love Letters (`/love-letters`)

Send and receive love letters with photos and voice memos.

**User Flow (Sending):**
1. Compose letter: title, content (rich text), mood emoji
2. Optionally attach photos (up to 5) and voice memo
3. Choose: Send Now or Schedule for later
4. Draft saved until sent

**User Flow (Receiving):**
1. See unread count in inbox
2. Open letter → full-screen read overlay with photo slideshow + audio playback
3. Letter auto-marked as READ when opened by recipient

**Letter Statuses:** `DRAFT` → `SCHEDULED` → `DELIVERED` → `READ`

**Features:**
- Full-screen letter reader overlay (z-[80])
- Photo lightbox with slide navigation
- Voice memo playback (iOS-compatible via `<video playsInline>`)
- Mood tags (happy, grateful, missing, romantic, etc.)
- Scheduled delivery via cron job (checks every minute)
- Unread count badge on Dashboard

**Business Rules:**
- Only sender can edit/delete DRAFT or SCHEDULED letters
- Scheduled letters auto-delivered when `scheduledAt <= now` (cron every minute)
- Reading marks letter as READ with timestamp
- Media deletion only allowed on DRAFT/SCHEDULED letters
- Notification sent to recipient on delivery

---

### 2.12 Weekly Recap (`/weekly-recap`)

Dashboard showing weekly activity statistics.

**Stats Displayed:**
- Moments created + photo count + highlights
- Cooking sessions + recipes cooked + total cooking time
- Food spots visited
- Date plans completed
- Love letters sent/received
- Goals completed
- Achievements unlocked

**Features:**
- Week navigation (previous/next)
- Defaults to previous week
- Stat cards with icons and counts

**Business Rules:**
- Data aggregated on-demand via backend query (not pre-computed)
- 7 parallel database queries via `Promise.all`

---

### 2.13 Monthly Recap (`/monthly-recap`)

Instagram Stories-style full-screen viewer showing monthly activity.

**Slide Structure (up to 8 slides):**
1. **Intro** — month name, AI-generated welcome text
2. **Moments** (if count > 0) — photo highlights
3. **Cooking** (if count > 0) — recipes cooked, time spent
4. **Food Spots** (if count > 0) — new venues visited
5. **Love Letters** (if count > 0) — sent/received counts
6. **Date Plans** (if count > 0) — dates completed
7. **Goals** (if count > 0) — goals achieved
8. **Outro** — AI-generated closing message

**Interaction:**
- Auto-advance: 6 seconds per slide
- Tap right (65% of screen): next slide
- Tap left (35%): previous slide
- Hold to pause (200ms threshold)
- Progress bars at top (CSS `progressFill` animation)

**Features:**
- Each category has its own gradient palette
- AnimatedNumber count-up effect (30 steps x 50ms = 1.5s)
- AI-generated intro/outro via xAI Grok (Vietnamese)
- Skips empty data categories automatically

**Business Rules:**
- Defaults to previous month
- Dashboard pin card shown days 1–3 of month
- Cron notification sent at 9 AM on 1st of month
- Photos included in monthly (not weekly) recap

---

### 2.14 Expenses / Budget (`/expenses`)

Track spending by category with budget limits and receipt scanning.

**Features:**
- Add expenses: amount, description, category, date, receipt photo, notes
- Link to Food Spot or Date Plan
- **AI Receipt Scanner** — upload receipt photo → xAI extracts amount, description, category, date
- Monthly view with daily breakdown chart (Recharts)
- Budget limits per category with visual indicators
- Category stats (total + count per category)

**Categories:** food, dating, shopping, transport, gifts, other

**Business Rules:**
- Budget limits stored in `app_settings` as JSON
- Receipt upload to CDN
- AI scan uses xAI Grok vision model
- Monthly filtering via `?month=YYYY-MM` query param
- Expenses linkable to date plans for per-date-plan cost tracking

---

## 3. Navigation Structure

### Mobile (< 768px)

**Bottom Navigation Bar** (z-50, fixed bottom):
| Icon | Label | Route |
|------|-------|-------|
| Home | Home | `/` |
| Camera | Moments | `/moments` |
| Map | Map | `/map` |
| Target | Goals | `/goals` |
| User | Profile | `/more` |

**FAB Speed Dial** (z-[55], Dashboard only):
- Moment (quick-create)
- Food Spot (quick-create)
- Photo Booth (launch)

### Desktop (>= 768px)

**Left Sidebar** (w-64, fixed):
- App logo + name
- Notification bell with unread badge
- Same 5 nav links as mobile
- User name + logout button

### Secondary Navigation

Modules not in main nav are accessed via:
- Dashboard module grid (9 cards)
- FAB speed dial
- Direct URL routing
- Notification deep links

---

## 4. Notification System

### Types

| Type | Trigger | Icon |
|------|---------|------|
| `moment` | New moment created | Camera |
| `comment` | Comment on moment | MessageCircle |
| `reaction` | Reaction on moment | Heart |
| `love_letter` | Letter delivered | Mail |
| `achievement` | Achievement unlocked | Trophy |
| `weekly_recap` | Monday 9 AM cron | Chart |
| `monthly_recap` | 1st of month 9 AM cron | Calendar |
| `date_plan_reminder` | Daily 6 AM for today's plans | MapPin |

### Delivery

1. **In-app:** Notification record in DB, shown on `/notifications` page
2. **Push:** Web Push via VAPID keys to all registered `PushSubscription` endpoints
3. **Badge:** Unread count shown on notification bell (refetched every 10s + on window focus)

### Notification Page (`/notifications`)

- List up to 50 notifications (newest first)
- Mark individual or all as read
- Delete individual notifications
- Deep link to related content

---

## 5. PWA Behavior

### Installation

- `manifest.json` with `display: standalone`
- Apple meta tags for iOS homescreen
- Icons: 192x192 and 512x512
- Theme color: `#E8788A` (primary pink)
- Background color: `#FFF8F6` (off-white)

### iOS Optimizations

- `viewport-fit=cover` for full-screen rendering
- `env(safe-area-inset-*)` for notch + home bar spacing
- `maximum-scale=1.0, user-scalable=no` to prevent double-tap zoom
- All inputs at `font-size: 16px` to prevent iOS auto-zoom
- Audio playback via `<video playsInline>` to bypass iOS `<audio>` MIME restrictions

### Offline Behavior

- Service worker stub (`sw.js`) — basic caching not yet implemented
- React Query caches data for 30s stale time
- Upload queue retries failed uploads

---

## 6. Onboarding (Driver.js Tours)

Every module has a guided tour that runs on first visit:

| Module | Tour Steps | Key Elements |
|--------|-----------|--------------|
| Dashboard | Relationship timer, module grid, FAB | `data-tour` attributes |
| Moments | Create button, card layout, filters | |
| Map | Tag filter, emoji picker, pin popups | |
| Goals | Sprint creation, Kanban columns | |
| Recipes | Recipe creation, AI generation | |
| Love Letters | Compose, mood, send/schedule | |
| Date Planner | Wishes, plans, stops | |
| Photo Booth | Camera/gallery, frames, filters | |
| Weekly Recap | Stat cards, navigation | |
| Monthly Recap | Stories viewer, interaction | |
| Achievements | Badge grid, unlock | |
| What to Eat | Recipe select, shopping, cooking | |

**Completion Tracking:** `tour_done__{moduleKey}__{userId}` stored in `app_settings` table.

**Replay:** "Xem lai huong dan" button on More/Profile page resets all tour keys.

---

## 7. Sprint 32 — JWT Authentication & Couple Profile & Public Sharing

### 7.1 JWT Authentication Upgrade

**Problem:** Original single `token` was long-lived and had no revocation mechanism. Security risk for PWA on shared devices.

**Solution:** Two-token authentication:
- **Access Token** — short-lived (15 minutes), issued on login/register or refresh
- **Refresh Token** — long-lived (7 days), stored in `RefreshToken` table for server-side revocation

**Flow:**
1. User logs in → server issues `accessToken` + `refreshToken` (refreshToken stored in DB)
2. Client stores both in secure storage (secure httpOnly cookie preferred, or localStorage)
3. API requests use `Authorization: Bearer <accessToken>`
4. When token expires (401 response) → client calls `POST /api/auth/refresh` with `refreshToken`
5. Server validates refresh token exists in DB + not revoked + not expired
6. Server issues new `accessToken` + optionally rotates `refreshToken`
7. On logout → `POST /api/auth/logout` revokes the refresh token (sets `revokedAt`)

**Models:**
- **RefreshToken table:** id, userId (FK), token (unique), expiresAt, revokedAt?, createdAt
- **Modified auth endpoints:** `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh` (new), `/api/auth/logout` (new)

**Benefits:**
- Access token short-lived = minimal exposure window
- Refresh token can be revoked centrally = logout immediately effective across all devices
- Stateless validation with JWT, but revocation list keeps server-side control

---

### 7.2 Couple Profile

**Problem:** Two users need to share a "couple name", anniversary date, and invitation mechanism.

**Solution:** Introduce `Couple` model as parent entity for User.

**Data Model:**
- **Couple table:** id, name?, anniversaryDate?, inviteCode (8-char unique), createdAt, updatedAt
- **User modification:** Add coupleId (FK → Couple), inviteCode acceptance on registration

**User Flow:**
1. First user registers without couple (inviteCode not required)
2. First user generates invite code via `POST /api/couple/generate-invite` → returns 8-char code (e.g., "ABC12345")
3. First user shares code with partner (out-of-band: SMS, messaging, in-person)
4. Partner registers with email + password + inviteCode → auto-joins couple
5. Both can edit couple name + anniversary via `PUT /api/couple`
6. Both can view partner info via `GET /api/couple`

**New Endpoints:**
- `GET /api/couple` — view couple info + both users
- `PUT /api/couple` — edit couple name/anniversary
- `POST /api/couple/generate-invite` — create 8-char code (expires in 7 days)

**Business Rules:**
- Invite code must be unique, case-insensitive, 8 chars
- Invite code expires after 7 days
- Once partner registers with code, couple is finalized
- Both users in couple have same coupleId

---

### 7.3 Public Sharing (Share Links)

**Problem:** User may want to share a specific moment/recipe/letter with external people (family, friends not in app).

**Solution:** Create public, time-limited share links with read-only viewer.

**Data Model:**
- **ShareLink table:** id, token (unique, 8–16 char), type (moment/recipe/letter), targetId, coupleId, expiresAt?, viewCount, createdAt
- **Share Link Viewer:** Public route `/s/:token` (read-only view, no auth required)

**User Flow (Sender):**
1. Open moment/recipe/letter detail
2. Tap "Share" button → modal to choose expiration (7 days, 30 days, never)
3. System generates unique token → creates ShareLink record
4. Return shareable URL: `https://love-scrum.hungphu.work/s/abc123def456`
5. User copies link and shares externally (WhatsApp, email, etc.)

**User Flow (Recipient - no login required):**
1. Tap/visit share link → `/s/:token` page
2. Public API `GET /api/share/:token` decodes token, checks expiry, returns item data
3. Item rendered read-only: view moment photos, read recipe ingredients, listen to letter
4. View counter incremented on each access
5. If link expired → 410 Gone error

**New Endpoints:**
- `POST /api/share` — create share link (auth required)
- `GET /api/share` — list couple's share links (auth required)
- `DELETE /api/share/:token` — revoke link (auth required)
- `GET /api/share/:token` — get shared item (public, no auth)
- `GET /api/share/:token/image` — proxy CDN image (public, CORS bypass)

**Frontend Pages:**
- **Share Modal:** Dialog with expiration picker, copy-to-clipboard button
- **Shared Item Viewer (`/s/:token`):** Read-only view with photos/audio, watermark "Shared by [couple name]"

**Business Rules:**
- Link token: base64url-encoded 64-bit random ID (8–16 chars)
- Expiration optional (null = never expires)
- ViewCount incremented on each public API call (analytics)
- Shared item includes couple name as watermark for attribution
- Deleting original moment/recipe/letter auto-invalidates share link
- Media (photos, audio) accessed via `/api/share/:token/image` to handle CORS
