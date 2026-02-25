# Team Whiteboard

**Sprint:** 24
**Goal:** Recipe from URL + Love Letters

---

## Current Status

| Role | Status | Current Task | Last Update |
|------|--------|--------------|-------------|
| PO   | SPRINT COMPLETE | Sprint 24 — 10/10 tasks approved ✅ | 2026-02-25 |
| DEV  | IDLE | Awaiting Sprint 25 | 2026-02-25 |

---

## Sprint 24 Spec

### Task 1: Recipe from URL (extend existing AI recipe)

**What:** Add "URL" mode to AI recipe generation. User pastes a recipe webpage URL → app fetches content → AI extracts structured recipe.

**Acceptance Criteria:**
- [ ] New "URL" tab in AIRecipeModal (alongside Text + YouTube)
- [ ] Backend fetches HTML from URL, extracts text content (use cheerio)
- [ ] Extracted text sent to Grok for recipe JSON extraction
- [ ] Source URL saved as `tutorialUrl` on the recipe
- [ ] Works with Vietnamese recipe sites (e.g. bachhoaxanh.com, cooky.vn)
- [ ] Error handling: invalid URL, non-HTML, empty content, timeout (15s)

**Backend changes (`backend/src/routes/ai.ts`):**
- Install `cheerio`: `cd backend && npm install cheerio`
- Update Zod schema: `mode: z.enum(['text', 'youtube', 'url'])`
- Add `fetchUrlContent(url)` function:
  - Fetch with `Accept-Language: vi`, 15s timeout
  - cheerio: strip scripts/nav/ads, try recipe selectors (`[itemtype*="Recipe"]`, `article`, `main`)
  - Truncate to 8000 chars
- Add `else if (mode === 'url')` branch (same pattern as youtube branch)

**Frontend changes (`frontend/src/pages/RecipesPage.tsx`):**
- Add `Globe` icon import from lucide-react
- Add URL tab button (use blue color `bg-blue-500`)
- Add URL input: `<input type="url" placeholder="https://www.bachhoaxanh.com/...">`
- Update loading text: "Đang đọc trang web và tạo công thức..."
- Update `frontend/src/lib/api.ts`: mode type `'text' | 'youtube' | 'url'`

---

### Task 2: Love Letters

**What:** New module for sending surprise love letters to partner, with optional scheduled delivery.

**Acceptance Criteria:**
- [ ] Prisma model `LoveLetter` with status workflow (DRAFT → SCHEDULED → DELIVERED → READ)
- [ ] 8 backend endpoints (see below)
- [ ] Cron job delivers scheduled letters every minute
- [ ] Frontend page with Inbox/Sent tabs
- [ ] Compose modal with mood picker + schedule option
- [ ] Immersive read experience (full-screen overlay)
- [ ] Push notification on delivery
- [ ] Recipients cannot see DRAFT/SCHEDULED letters (surprise!)
- [ ] Accessible from MorePage

**Database (`backend/prisma/schema.prisma`):**
```prisma
enum LetterStatus { DRAFT  SCHEDULED  DELIVERED  READ }

model LoveLetter {
  id            String       @id @default(uuid())
  senderId      String
  recipientId   String
  title         String
  content       String
  mood          String?
  status        LetterStatus @default(DRAFT)
  scheduledAt   DateTime?
  deliveredAt   DateTime?
  readAt        DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  sender        User         @relation("SentLetters", fields: [senderId], references: [id])
  recipient     User         @relation("ReceivedLetters", fields: [recipientId], references: [id])
  @@map("love_letters")
}
```
+ Add `sentLetters`/`receivedLetters` to User model

**Backend endpoints (`backend/src/routes/loveLetters.ts`):**

| Method | Path | Purpose |
|--------|------|---------|
| GET | /received | Inbox (DELIVERED + READ) |
| GET | /sent | Sent letters (all statuses) |
| GET | /unread-count | Count DELIVERED letters |
| GET | /:id | Get letter (auto-mark READ if recipient) |
| POST | / | Create (DRAFT/SCHEDULED/immediate DELIVERED) |
| PUT | /:id | Edit DRAFT/SCHEDULED only |
| PUT | /:id/send | Send DRAFT immediately |
| DELETE | /:id | Delete DRAFT/SCHEDULED only |

**Cron (`backend/src/index.ts`):** Every minute, deliver SCHEDULED letters where `scheduledAt <= now`.

**Frontend (`frontend/src/pages/LoveLettersPage.tsx`):**
- Tabs: "Hộp thư" (Inbox) | "Thư đã gửi" (Sent)
- LetterCard: envelope metaphor, mood icon, unread dot
- ComposeLetterModal: title, content textarea, mood picker (6 moods), schedule toggle + datetime-local
- ReadLetterModal: full-screen overlay, warm gradient bg, paper card, framer-motion entrance
- Moods: romantic/grateful/playful/encouragement/apology/missing

**Other frontend files:**
- `types/index.ts`: Add LoveLetter + LetterStatus types
- `lib/api.ts`: Add loveLettersApi
- `App.tsx`: Add `/love-letters` route
- `MorePage.tsx`: Add module with Mail icon
- `NotificationsPage.tsx`: Add `love_letter` icon

---

### Task 3: AI Price Search + 2-Person Portions

**What:** Enhance AI recipe generation with real ingredient price lookup (prioritize Bach Hoa Xanh) and auto-adjust portions for 2 people.

**Acceptance Criteria:**
- [ ] AI uses real prices from Bach Hoa Xanh search (not guessed prices)
- [ ] Fallback: if BHX has no result, AI estimates price as before
- [ ] System prompt updated: adjust all ingredient quantities for 2-person portions
- [ ] Price lookup works for all 3 modes (text, youtube, url)

**Implementation approach — Price search tool for Grok:**

Use Grok's function/tool calling via OpenAI SDK. Give Grok a `search_ingredient_price` tool:

1. When generating a recipe, Grok calls the tool for each ingredient
2. Tool handler fetches `https://www.bachhoaxanh.com/tim-kiem?q={ingredient}` (BHX uses Next.js SSR so search HTML should contain product data)
3. Use cheerio to extract product name + price from the search results HTML
4. Return top 1-3 results with name + price to Grok
5. Grok uses real prices in the JSON output

**If BHX SSR doesn't contain product data in HTML:**
- Fallback: use Google search `{ingredient} giá site:bachhoaxanh.com` via web fetch
- Or try Shopee API: `https://shopee.vn/api/v4/search/search_items?keyword={ingredient}&limit=5` (unauthenticated, needs browser User-Agent + Referer headers)

**System prompt changes (`backend/src/routes/ai.ts`):**
- Add rule: "Điều chỉnh khẩu phần cho 2 người ăn (couple). Nếu công thức gốc cho nhiều người hơn, giảm nguyên liệu tương ứng."
- Add rule: "Sử dụng giá thực tế từ tool search_ingredient_price khi có. Chỉ ước tính khi tool không trả về kết quả."

**Files to change:**
- `backend/src/routes/ai.ts` — Add tool definition, tool handler, update system prompt

---

## Sprint Backlog

| # | Task | Priority | Status | Assignee |
|---|------|----------|--------|----------|
| 1 | Recipe from URL | P0 | DONE - PO Approved ✅ | DEV |
| 2 | Love Letters | P0 | DONE - PO Approved ✅ | DEV |
| 3 | Static price file (PO curated) + 2-person portions | P0 | DONE ✅ | PO+DEV |
| 4 | Bug fix: Love Letters migration on dev DB | P0 | DONE ✅ | DEV |
| 5 | Bug fix: Dev seed needs 2nd user for Love Letters | P0 | DONE - PO Verified ✅ | DEV |
| 6 | Love Letter auto-popup on Dashboard + swipe | P0 | DONE - PO Approved ✅ | DEV |
| 7 | Love Letter popup: fix centering + WOW effects | P1 | DONE - PO Approved ✅ | DEV |
| 8 | Shared LetterReadOverlay + envelope open animation | P0 | DONE - PO Approved ✅ | DEV |
| 9 | Fix: seal z-index + flap 3D clip-path + login letter popup | P0 | DONE - PO Approved ✅ | DEV |
| 10 | Fix: envelope flap visible open via clip-path animation | P0 | DONE - PO Approved ✅ | DEV |

---

## Backlog (Future)

| # | Feature | Notes |
|---|---------|-------|
| 1 | What to Eat — Rating & Stats | Rate experience, cooking stats over time |
| 2 | Photo Booth — Fun Effects | Stickers, filters, AR effects |
| 3 | Mood Check-in | Check-in tâm trạng hàng ngày, xem trend theo tuần/tháng |
| 4 | Weekly Recap | Auto-generated summary cuối tuần: moments, cooking, achievements |
| 5 | Onboarding Tutorial | Hướng dẫn sử dụng app cho user mới, walkthrough các tính năng |

---

## Notes

_Sprint 7 — PicaPica Booth: APPROVED & MERGED (2026-02-20)_
_Sprint 8 — Bug Fix + Sticker Upgrade: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 9 — Dashboard Timer + Voice Recording + Map Tag Filter + Swiper Carousel + FAB: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 10 — Dashboard UI Redesign: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 11 — Spotify Embed + Map Tag Icons + Goal Edit Bug Fix + Emoji Picker: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 12 — Timer Realtime h:m:s + Spotify Layout + Timezone Fix: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 13 — Nav Restructure (More tab) + More Page + Dashboard Stats Expand: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 14 — Recipes Module + Logout + Auto-focus + Cooked Status: APPROVED & DEPLOYED (2026-02-21)_
_Sprint 15 — What to Eat Today (Gamified Cooking Session): APPROVED & DEPLOYED (2026-02-22)_
_Sprint 16 — AI Recipe Creator + Ingredient Pricing + Confetti: APPROVED & DEPLOYED (2026-02-23)_
_Sprint 17 — Custom App Name + Achievements System + Profile Edit: APPROVED & DEPLOYED (2026-02-23)_
_Sprint 18 — Comments & Reactions on Moments: APPROVED & DEPLOYED (2026-02-23)_
_Sprint 19 — In-App Notification System + Web Push: APPROVED & DEPLOYED (2026-02-23)_
_Sprint 20 — Image Upload Optimization: APPROVED & DEPLOYED (2026-02-23)_
_Sprint 21 — Date Planner (Wishlist + Itinerary + Gallery): APPROVED & DEPLOYED (2026-02-23)_
_Sprint 22 — Date Planner Notifications + Address Search Fix: APPROVED & DEPLOYED (2026-02-23)_
_Sprint 23 — Plan Edit UX + Animation Fixes + Photo Upload: COMMITTED TO MAIN (2026-02-24)_
_Sprint 24 — Recipe from URL + Love Letters + Shared LetterReadOverlay + Envelope Animation + Bug Fixes: ALL 10 TASKS APPROVED (2026-02-25)_

---

## Process Reminder

**Production deployment requires Boss approval:**
1. DEV implements → PO reviews on sprint branch
2. PO deploys to dev environment for Boss review
3. Boss approves → merge to main → production
