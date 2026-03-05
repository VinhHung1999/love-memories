# Sprint 42 — RN: Date Planner + Love Letters + Achievements

**Goal:** Implement 3 new mobile modules — Date Planner (wishes + plans), Love Letters (inbox/sent/compose/read), Achievements (badge grid).

**Backend:** NO changes — all API endpoints already exist.

**Branch:** `feature_rn_sprint42`

---

## New Files (22)

### Achievements (2 files)
| File | Purpose |
|------|---------|
| `screens/Achievements/AchievementsScreen.tsx` | Badge grid grouped by category + progress bar |
| `screens/Achievements/useAchievementsViewModel.ts` | Fetch + group by category |

### Love Letters (7 files)
| File | Purpose |
|------|---------|
| `screens/Letters/LettersScreen.tsx` | Inbox/Sent tabs + letter cards + FAB |
| `screens/Letters/useLettersViewModel.ts` | Tab state, queries, compose/delete |
| `screens/Letters/components/LetterCard.tsx` | Mood emoji + title + preview + date |
| `screens/Letters/components/ComposeLetterSheet.tsx` | AppBottomSheet: title, content, mood, photos |
| `screens/Letters/components/useComposeLetterViewModel.ts` | Draft-first flow, media upload |
| `screens/LetterRead/LetterReadScreen.tsx` | Full-screen letter + photos + audio |
| `screens/LetterRead/useLetterReadViewModel.ts` | Fetch letter (auto-mark READ) |

### Date Planner (13 files)
| File | Purpose |
|------|---------|
| `screens/DateWishes/WishesScreen.tsx` | Wish list + category/status filters + FAB |
| `screens/DateWishes/useWishesViewModel.ts` | CRUD wishes, filter, mark done |
| `screens/DateWishes/components/WishCard.tsx` | Category emoji + title + location + tags |
| `screens/DateWishes/components/WishFormSheet.tsx` | AppBottomSheet: create/edit wish |
| `screens/DateWishes/components/useWishFormViewModel.ts` | Form state + validation |
| `screens/DatePlans/PlanListScreen.tsx` | Plan list + status badges + progress |
| `screens/DatePlans/usePlanListViewModel.ts` | Fetch plans, sort, navigate |
| `screens/DatePlans/components/PlanCard.tsx` | Date + stops count + status badge |
| `screens/DatePlans/components/PlanFormSheet.tsx` | AppBottomSheet: plan + dynamic stops editor |
| `screens/DatePlans/components/usePlanFormViewModel.ts` | Dynamic stops array + validation |
| `screens/PlanDetail/PlanDetailScreen.tsx` | Vertical timeline + stop cards |
| `screens/PlanDetail/usePlanDetailViewModel.ts` | Fetch plan, mark stops done, delete |
| `screens/PlanDetail/components/StopCard.tsx` | Timeline dot + time + title + done toggle |

## Files to Modify (4)
| File | Changes |
|------|---------|
| `navigation/index.tsx` | Add DatePlannerStack, LettersStack, Achievements to AppStack |
| `lib/api.ts` | Add dateWishesApi, datePlansApi, loveLettersApi, achievementsApi |
| `locales/en.ts` | Add datePlanner, loveLetters, achievements sections |
| `screens/Dashboard/DashboardScreen.tsx` | Add 3 quick action buttons for new modules |

---

## Navigation

```
AppStack (add 3 new entries)
├── DatePlannerTab → DatePlannerStack
│   ├── WishesList
│   ├── PlansList
│   ├── PlanDetail { planId }
│   ├── BottomSheet + Alert
├── LettersTab → LettersStack
│   ├── LettersList
│   ├── LetterRead { letterId }
│   ├── BottomSheet + Alert
└── Achievements → single screen (no stack needed)
```

---

## Screens

### 1. AchievementsScreen
- CollapsibleHeader (dark gradient, back arrow)
- Progress pill: "12/42 unlocked" + horizontal progress bar
- SectionList by category (moments, cooking, recipes, foodspots, goals, time)
- Section header: category emoji + label + "3/5"
- Achievement row: icon | title + description | unlock date or lock icon
- Locked achievements: `opacity-40`

### 2. LettersScreen
- CollapsibleHeader (dark gradient, back arrow)
- renderFooter: Inbox / Sent tab chips
- FlatList of LetterCard
- LetterCard: mood emoji circle | title + preview + date | unread dot or status badge
- FAB: compose icon → ComposeLetterSheet

### 3. ComposeLetterSheet
- AppBottomSheet scrollable
- Input(title), Input(content, multiline large), mood picker (emoji row), photo section (after draft saved)
- Save Draft / Send Now buttons

### 4. LetterReadScreen
- Full-screen SafeAreaView, soft gradient bg
- Back arrow + sender info
- Paper card: title + mood emoji + content
- Photos: horizontal scroll thumbnails
- Audio: play/progress bar (reuse VoiceMemoSection pattern)

### 5. WishesScreen
- CollapsibleHeader (dark gradient, back arrow, calendar icon → PlansList)
- renderFooter: All | Pending | Done + category emoji chips
- FlatList of WishCard
- WishCard: category emoji | title + description + tags | done checkmark
- FAB: plus → WishFormSheet

### 6. PlanListScreen
- CollapsibleHeader (dark gradient, back arrow, heart icon → WishesList)
- FlatList of PlanCard (active pinned top)
- PlanCard: date badge | title + "2/4 stops" + mini progress | status TagBadge
- FAB: plus → PlanFormSheet

### 7. PlanDetailScreen
- CollapsibleHeader (dark gradient, back arrow, edit + delete)
- Plan title + date + status badge
- Vertical timeline: connected dots + line
- StopCard: dot (green=done, gray=pending) | time | title | done button

---

## API Endpoints (backend already exists)

### dateWishesApi
- `GET /api/date-wishes` — list all wishes
- `POST /api/date-wishes` — create wish
- `PUT /api/date-wishes/:id` — update wish
- `PATCH /api/date-wishes/:id/done` — mark done
- `DELETE /api/date-wishes/:id` — delete wish

### datePlansApi
- `GET /api/date-plans` — list all plans
- `GET /api/date-plans/:id` — get plan with stops
- `POST /api/date-plans` — create plan
- `PUT /api/date-plans/:id` — update plan
- `PATCH /api/date-plans/:id/status` — update status
- `PATCH /api/date-plans/:id/stops/:stopId/done` — mark stop done
- `DELETE /api/date-plans/:id` — delete plan

### loveLettersApi
- `GET /api/love-letters/received` — inbox
- `GET /api/love-letters/sent` — sent letters
- `GET /api/love-letters/unread-count` — unread count
- `GET /api/love-letters/:id` — get letter (auto-mark READ)
- `POST /api/love-letters` — create draft
- `PUT /api/love-letters/:id` — update draft
- `PATCH /api/love-letters/:id/send` — send letter
- `DELETE /api/love-letters/:id` — delete letter
- `POST /api/love-letters/:id/photos` — upload photo
- `DELETE /api/love-letters/:id/photos/:photoId` — delete photo
- `POST /api/love-letters/:id/audio` — upload audio
- `DELETE /api/love-letters/:id/audio/:audioId` — delete audio

### achievementsApi
- `GET /api/achievements` — list all achievements

---

## MVP Scope Cuts (v2)
- Sub-spots (DatePlanSpot) within stops
- Cost tracking + linking stops to Moments/FoodSpots
- Linking wishes on mark-done
- Scheduled letter delivery (only draft + send now)
- Achievement confetti animation
- Letter photo lightbox

---

## Implementation Order
1. `api.ts` + `en.ts` + `navigation/index.tsx` — foundation
2. Achievements (2 files) — simplest, validates pattern
3. Love Letters (7 files) — LettersScreen → ComposeSheet → LetterRead
4. Date Planner (13 files) — Wishes → Plans → PlanDetail
5. Dashboard quick action buttons
6. `npx tsc --noEmit` — verify zero errors

## Reference Patterns (copy from)
- `screens/Recipes/RecipesScreen.tsx` — CollapsibleHeader + filter chips + FlatList + FAB
- `screens/CreateMoment/CreateMomentSheet.tsx` — AppBottomSheet scrollable + photo/audio
- `screens/MomentDetail/components/VoiceMemoSection.tsx` — Audio playback
- `screens/Recipes/useRecipesViewModel.ts` — MVVM query + filter pattern

## Rules
- MVVM: Screen = UI, ViewModel = all logic/state/API
- NativeWind className only (style prop only for Animated transforms)
- All strings from en.ts, all colors from useAppColors()
- ProfileScreen = design benchmark
- Query keys: `['entity']` for lists, `['entity', id]` for detail
- **Must use frontend-design skill** for every new screen UI

## Verification
1. `npx tsc --noEmit` — zero errors
2. Navigate from Dashboard quick actions → each screen loads
3. Achievements: categories grouped, progress bar correct
4. Letters: inbox/sent tabs, compose draft, send, read auto-marks READ
5. Wishes: create, filter, mark done
6. Plans: create with stops, view timeline, mark stops done
