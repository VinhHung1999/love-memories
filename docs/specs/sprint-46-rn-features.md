# Sprint 46 — RN Monthly Recap + Daily Questions + Error Boundary

**Goal:** Port Monthly Recap to mobile (Stories-style), build Daily Questions (new feature BE+FE), add global crash handler.

---

## Task 1: Daily Questions — Backend [L]

**New models:**

```prisma
model DailyQuestion {
  id        String   @id @default(uuid())
  text      String
  textVi    String?                    // Vietnamese translation
  category  String   @default("general") // general, deep, fun, intimacy, future
  order     Int      @default(0)
  createdAt DateTime @default(now())
  responses DailyQuestionResponse[]
  @@map("daily_questions")
}

model DailyQuestionResponse {
  id         String        @id @default(uuid())
  questionId String
  coupleId   String
  userId     String
  answer     String
  createdAt  DateTime      @default(now())
  question   DailyQuestion @relation(fields: [questionId], references: [id])
  @@unique([questionId, coupleId, userId])  // one answer per user per question per couple
  @@index([coupleId])
  @@map("daily_question_responses")
}
```

**Endpoints:**
- `GET /api/daily-questions/today` — returns today's question for the couple. Algorithm: hash(coupleId + dayNumber) % totalQuestions → deterministic, both partners get same Q. Include both partners' answers if already answered.
- `POST /api/daily-questions/:id/answer` — submit answer `{ answer: string }`. Max 500 chars.
- `GET /api/daily-questions/history?page=1&limit=20` — paginated history of answered questions with both partners' responses.

**Response shape — today:**
```json
{
  "question": { "id": "uuid", "text": "What's one thing...", "textVi": "Điều gì...", "category": "deep" },
  "myAnswer": "I love..." | null,
  "partnerAnswer": "She loves..." | null,
  "partnerName": "Linh"
}
```

**Seed data:** 50 starter questions across 5 categories (general, deep, fun, intimacy, future). Mix English + Vietnamese.

**Acceptance Criteria:**
- [ ] GET /today returns same question for both partners on same day
- [ ] POST answer succeeds, duplicate answer returns 409
- [ ] GET history returns paginated results with both answers
- [ ] Partner answer hidden until user has answered (prevent copying)
- [ ] 50 seed questions in migration/seed

---

## Task 2: Daily Questions — RN Screen [M]

**Screen:** `mobile/src/screens/DailyQuestions/DailyQuestionsScreen.tsx` + `useDailyQuestionsViewModel.ts`

**UI Flow:**
1. **Dashboard card** — "Today's Question" card on Dashboard. Shows question preview, tap to open.
2. **Question screen** — full question text, text input for answer, submit button.
3. **After answering** — reveal partner's answer (or "Waiting for [partner]..." if not yet answered).
4. **History tab** — list of past Q&As, tap to expand and see both answers.

**Design:**
- Follow ProfileScreen design language (clean, minimal)
- Use `frontend-design` skill for UI
- Question card: subtle gradient background, category icon
- Answer reveal: smooth animation (fade in partner's answer)

**Navigation:** Add as modal/full-screen route from Dashboard card tap.

**i18n:** Add all strings to `en.ts`.

**Acceptance Criteria:**
- [ ] Dashboard shows today's question card
- [ ] Can answer question, see own + partner's answer
- [ ] Partner answer hidden until user answers
- [ ] History shows past Q&As paginated
- [ ] MVVM pattern, NativeWind only, i18n ready

---

## Task 3: RN Monthly Recap (Stories-style) [L]

**Screen:** `mobile/src/screens/MonthlyRecap/MonthlyRecapScreen.tsx` + `useMonthlyRecapViewModel.ts`

Port web `MonthlyRecapPage.tsx` to React Native.

**Key behaviors (match web exactly):**
- Full-screen overlay (covers bottom tabs)
- Progress bars at top (one per slide, animated fill)
- Auto-advance 6 seconds per slide
- Tap left (35%) = previous, tap right (65%) = next
- Hold to pause (200ms threshold)
- Up to 8 slides: intro → moments → cooking → foodspots → letters → date plans → goals → outro
- Skip slides with zero data
- AnimatedNumber count-up (30 steps × 50ms)
- Close button (X) top-right
- Month navigation (< prev / next >)

**Slides:**
1. **Intro** — month name + "Your month together" (gradient bg)
2. **Moments** — photo count + photo strip (horizontal auto-scroll)
3. **Cooking** — session count + total time + recipe names
4. **Food Spots** — count + spot names
5. **Love Letters** — sent/received counts
6. **Date Plans** — count + titles
7. **Goals** — completed count
8. **Outro** — closing message, optional AI caption

**API:** Use existing `GET /api/recap/monthly?month=YYYY-MM` — same backend, no changes needed.

**Navigation:** Add as full-screen modal route. Entry point: Dashboard monthly recap card (already shows on days 1-3).

**Acceptance Criteria:**
- [ ] Full-screen Stories viewer with progress bars
- [ ] Tap navigation (left/right zones) + auto-advance 6s
- [ ] Hold to pause
- [ ] Slides skip empty data
- [ ] Photo strip horizontal scroll animation
- [ ] AnimatedNumber count-up
- [ ] Month navigation
- [ ] Close button
- [ ] MVVM, NativeWind, i18n

---

## Task 4: Error Boundary [S]

**Component:** `mobile/src/components/ErrorBoundary.tsx`

**Requirements:**
- React class component (lifecycle `componentDidCatch`)
- Wrap around `RootNavigator` in `App.tsx`
- Fallback UI: friendly error screen with app icon, "Something went wrong" message, "Try Again" button (resets state), "Go Home" button (navigates to Dashboard)
- Log error info: component stack, error message, timestamp
- NativeWind styling
- Does NOT catch native crashes (only JS errors)

**Acceptance Criteria:**
- [ ] Wraps RootNavigator in App.tsx
- [ ] Shows friendly fallback on JS crash
- [ ] "Try Again" resets error state
- [ ] Error info logged to console

---

## Technical Notes

- **Branch:** `sprint_46` from `main`
- **Prisma migration:** 1 migration for DailyQuestion + DailyQuestionResponse models
- **Seed:** 50 daily questions (separate seed file or in migration)
- **Backend changes:** New route `/daily-questions`, new controller + service + validator
- **Mobile changes:** 2 new screens (DailyQuestions, MonthlyRecap) + ErrorBoundary component + Dashboard card + navigation routes + i18n strings + API client additions
- **No web changes** — mobile only sprint (except backend)
- **Mandatory:** Use `frontend-design` skill for all UI work
- **Docs:** Update api-reference.md, database-schema.md, product-spec.md after completion
