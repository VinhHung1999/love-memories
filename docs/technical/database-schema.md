# Database Schema

**Database:** PostgreSQL
**ORM:** Prisma 6.4 with TypeScript
**Production DB:** `love_scrum` at `postgresql://hungphu@localhost:5432/love_scrum`
**Development DB:** `love_scrum_dev` at `postgresql://hungphu@localhost:5432/love_scrum_dev`

---

## Enums

### SprintStatus
```
PLANNING | ACTIVE | COMPLETED | CANCELLED
```

### GoalStatus
```
TODO | IN_PROGRESS | DONE
```

### GoalPriority
```
LOW | MEDIUM | HIGH
```

### LetterStatus
```
DRAFT | SCHEDULED | DELIVERED | READ
```

---

## Models (34 tables)

### User (`users`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | Primary key |
| email | String | `@unique` | Login email |
| password | String? | | Bcrypt hash; null for Google-only users (Sprint 33) |
| googleId | String? | `@unique` | Google OAuth sub (Sprint 33) |
| name | String | | Display name |
| avatar | String? | | Avatar CDN URL |
| coupleId | String? | FK → Couple | Sprint 32: Couple association |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

**Relations:** comments[], notifications[], pushSubscriptions[], sentLetters[], receivedLetters[], refreshTokens[], couple

---

### Couple (`couples`) — Sprint 32

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | Primary key |
| name | String? | | Couple name/nickname |
| anniversaryDate | DateTime? | | Relationship anniversary |
| inviteCode | String? | `@unique` | 8-char code for partner signup |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

**Relations:** users[]

---

### RefreshToken (`refresh_tokens`) — Sprint 32

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | Primary key |
| userId | String | FK → User | Token owner |
| token | String | `@unique` | JWT refresh token |
| expiresAt | DateTime | | Token expiration time |
| revokedAt | DateTime? | | Logout timestamp (if revoked) |
| createdAt | DateTime | `@default(now())` | |

**Relations:** user

---

### ShareLink (`share_links`) — Sprint 32

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | Primary key |
| token | String | `@unique` | Public share token (8–16 chars) |
| type | String | | "moment" / "recipe" / "letter" |
| targetId | String | | ID of moment/recipe/letter |
| coupleId | String | FK → Couple | Owner couple |
| expiresAt | DateTime? | | Optional expiration (null = no expiry) |
| viewCount | Int | `@default(0)` | Public access counter |
| createdAt | DateTime | `@default(now())` | |

**Relations:** couple

---

### Moment (`moments`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| title | String | | |
| caption | String? | | |
| date | DateTime | | Date of the moment |
| latitude | Float? | | -90 to 90 |
| longitude | Float? | | -180 to 180 |
| location | String? | | Address/place name |
| tags | String[] | | Array of tag strings |
| spotifyUrl | String? | | Spotify track URL |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

**Relations:** photos[], audios[], comments[], reactions[]
**Cascade on delete:** photos, audios, comments, reactions

---

### MomentPhoto (`moment_photos`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| momentId | String | FK → Moment | |
| filename | String | | CDN filename |
| url | String | | CDN URL |
| createdAt | DateTime | `@default(now())` | |

**On parent delete:** Cascade

---

### MomentAudio (`moment_audios`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| momentId | String | FK → Moment | |
| filename | String | | CDN filename |
| url | String | | CDN URL |
| duration | Float? | | Seconds |
| createdAt | DateTime | `@default(now())` | |

**On parent delete:** Cascade

---

### MomentComment (`moment_comments`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| momentId | String | FK → Moment | |
| userId | String? | FK → User | Optional (guest comments) |
| author | String | | Author display name |
| content | String | | Comment text |
| createdAt | DateTime | `@default(now())` | |

**On Moment delete:** Cascade
**On User delete:** SetNull

---

### MomentReaction (`moment_reactions`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| momentId | String | FK → Moment | |
| emoji | String | | Emoji character |
| author | String | | Person who reacted |
| createdAt | DateTime | `@default(now())` | |

**Unique constraint:** `@@unique([momentId, emoji, author])` — One reaction per emoji per author per moment
**On parent delete:** Cascade

---

### FoodSpot (`food_spots`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| name | String | | Restaurant/venue name |
| description | String? | | |
| rating | Float | `@default(0)` | 0–5 stars |
| latitude | Float? | | |
| longitude | Float? | | |
| location | String? | | Address |
| tags | String[] | | Food type tags |
| priceRange | Int | `@default(2)` | 1–4 ($ to $$$$) |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

**Relations:** photos[], recipes[]
**Cascade on delete:** photos

---

### FoodSpotPhoto (`food_spot_photos`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| foodSpotId | String | FK → FoodSpot | |
| filename | String | | |
| url | String | | |
| createdAt | DateTime | `@default(now())` | |

**On parent delete:** Cascade

---

### Recipe (`recipes`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| title | String | | Recipe name |
| description | String? | | |
| ingredients | String[] | | Ingredient list |
| ingredientPrices | Float[] | `@default([])` | VND price per ingredient |
| steps | String[] | | Cooking instructions |
| stepDurations | Int[] | `@default([])` | Seconds per step |
| tags | String[] | | Recipe tags |
| notes | String? | | Chef notes |
| tutorialUrl | String? | | YouTube tutorial link |
| cooked | Boolean | `@default(false)` | Has been cooked |
| foodSpotId | String? | FK → FoodSpot | Origin food spot |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

**Relations:** photos[], cookingSessions[]
**On FoodSpot delete:** Cascade

---

### RecipePhoto (`recipe_photos`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| recipeId | String | FK → Recipe | |
| filename | String | | |
| url | String | | |
| createdAt | DateTime | `@default(now())` | |

**On parent delete:** Cascade

---

### CookingSession (`cooking_sessions`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| status | String | `@default("selecting")` | selecting/shopping/cooking/photo/completed |
| startedAt | DateTime? | | When cooking started |
| completedAt | DateTime? | | When session finished |
| totalTimeMs | Int? | | Total cooking time (ms) |
| notes | String? | | |
| rating | Int? | | 1–5 stars |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

**Relations:** recipes[], items[], steps[], photos[]
**Cascade on delete:** all child records

---

### CookingSessionRecipe (`cooking_session_recipes`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| sessionId | String | FK → CookingSession | |
| recipeId | String | FK → Recipe | |
| order | Int | | Order in session |
| completedAt | DateTime? | | |

**On CookingSession delete:** Cascade

---

### CookingSessionItem (`cooking_session_items`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| sessionId | String | FK → CookingSession | |
| ingredient | String | | Ingredient name |
| price | Float? | | Cost |
| checked | Boolean | `@default(false)` | Bought/prepared |
| checkedAt | DateTime? | | |

**On parent delete:** Cascade

---

### CookingSessionStep (`cooking_session_steps`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| sessionId | String | FK → CookingSession | |
| recipeId | String | | Source recipe reference |
| stepIndex | Int | | Step number |
| content | String | | Instruction text |
| durationSeconds | Int? | | Time for step |
| checked | Boolean | `@default(false)` | Completed |
| checkedBy | String? | | Who completed |
| checkedAt | DateTime? | | |

**On parent delete:** Cascade

---

### CookingSessionPhoto (`cooking_session_photos`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| sessionId | String | FK → CookingSession | |
| filename | String | | |
| url | String | | |
| createdAt | DateTime | `@default(now())` | |

**On parent delete:** Cascade

---

### Sprint (`sprints`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| name | String | | Sprint name |
| description | String? | | |
| startDate | DateTime | | |
| endDate | DateTime | | |
| status | SprintStatus | `@default(PLANNING)` | |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

**Relations:** goals[]

---

### Goal (`goals`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| title | String | | |
| description | String? | | |
| status | GoalStatus | `@default(TODO)` | |
| priority | GoalPriority | `@default(MEDIUM)` | |
| assignee | String? | | Person assigned |
| dueDate | DateTime? | | |
| order | Int | `@default(0)` | Kanban display order |
| sprintId | String? | FK → Sprint | Null = backlog |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

**On Sprint delete:** Cascade

---

### LoveLetter (`love_letters`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| senderId | String | FK → User | |
| recipientId | String | FK → User | |
| title | String | | Letter subject |
| content | String | | Letter body |
| mood | String? | | Emotion tag |
| status | LetterStatus | `@default(DRAFT)` | |
| scheduledAt | DateTime? | | Future delivery time |
| deliveredAt | DateTime? | | Actual delivery time |
| readAt | DateTime? | | When read by recipient |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

**Relations:** photos[], audio[]
**Named relations:** sender @relation("SentLetters"), recipient @relation("ReceivedLetters")
**Cascade on delete:** photos, audio

---

### LetterPhoto (`letter_photos`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| letterId | String | FK → LoveLetter | |
| filename | String | | |
| url | String | | |
| createdAt | DateTime | `@default(now())` | |

**On parent delete:** Cascade

---

### LetterAudio (`letter_audio`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| letterId | String | FK → LoveLetter | |
| filename | String | | |
| url | String | | |
| duration | Float? | | Seconds |
| createdAt | DateTime | `@default(now())` | |

**On parent delete:** Cascade

---

### DateWish (`date_wishes`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| title | String | | |
| description | String? | | |
| category | String | | eating/travel/entertainment/cafe/shopping |
| address | String? | | |
| latitude | Float? | | |
| longitude | Float? | | |
| url | String? | | External link |
| tags | String[] | `@default([])` | |
| done | Boolean | `@default(false)` | |
| doneAt | DateTime? | | |
| linkedMomentId | String? | | Linked after completion |
| linkedFoodSpotId | String? | | Linked after completion |
| createdBy | String | | Creator identifier |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

---

### DatePlan (`date_plans`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| title | String | | Plan name |
| date | DateTime | | Date of the plan |
| notes | String? | | |
| status | String | `@default("planned")` | planned/active/completed |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

**Relations:** stops[]
**Cascade on delete:** stops

---

### DatePlanStop (`date_plan_stops`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| planId | String | FK → DatePlan | |
| time | String | | HH:MM format |
| title | String | | Stop name |
| description | String? | | |
| address | String? | | |
| latitude | Float? | | |
| longitude | Float? | | |
| url | String? | | |
| tags | String[] | `@default([])` | |
| category | String? | | Stop type |
| notes | String? | | |
| order | Int | | Itinerary order |
| done | Boolean | `@default(false)` | |
| doneAt | DateTime? | | |
| wishId | String? | | Link to DateWish |
| linkedMomentId | String? | | Link to Moment |
| linkedFoodSpotId | String? | | Link to FoodSpot |
| cost | Float? | | Expense at stop |
| createdAt | DateTime | `@default(now())` | |

**Relations:** spots[]
**On DatePlan delete:** Cascade
**Cascade on delete:** spots

---

### DatePlanSpot (`date_plan_spots`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| stopId | String | FK → DatePlanStop | |
| title | String | | Spot name |
| address | String? | | |
| latitude | Float? | | |
| longitude | Float? | | |
| url | String? | | |
| notes | String? | | |
| order | Int | | Order among alternatives |
| createdAt | DateTime | `@default(now())` | |

**On DatePlanStop delete:** Cascade

---

### Expense (`expenses`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| amount | Float | | Amount in VND |
| description | String | | What was purchased |
| category | String | | food/dating/shopping/transport/gifts/other |
| date | DateTime | | Date of expense |
| note | String? | | |
| receiptUrl | String? | | Receipt photo CDN URL |
| foodSpotId | String? | | Associated food spot |
| datePlanId | String? | | Associated date plan |
| createdAt | DateTime | `@default(now())` | |
| updatedAt | DateTime | `@updatedAt` | |

---

### Notification (`notifications`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| userId | String | FK → User | Recipient |
| type | String | | Notification type |
| title | String | | |
| message | String | | |
| link | String? | | Deep link |
| read | Boolean | `@default(false)` | |
| createdAt | DateTime | `@default(now())` | |

**On User delete:** Cascade

---

### PushSubscription (`push_subscriptions`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| userId | String | FK → User | |
| endpoint | String | `@unique` | Push service URL |
| p256dh | String | | VAPID public key |
| auth | String | | Auth secret |
| createdAt | DateTime | `@default(now())` | |

**On User delete:** Cascade

---

### Tag (`tags`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| name | String | `@unique` | Tag label |
| icon | String | `@default("🏷️")` | Emoji icon |
| color | String? | | Hex color |

---

### Achievement (`achievements`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| key | String | `@unique` | Achievement identifier |
| unlockedAt | DateTime | `@default(now())` | |
| createdAt | DateTime | `@default(now())` | |

---

### CustomAchievement (`custom_achievements`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| title | String | | |
| description | String? | | |
| icon | String | `@default("🏅")` | Emoji icon |
| unlocked | Boolean | `@default(false)` | |
| unlockedAt | DateTime? | | |
| createdAt | DateTime | `@default(now())` | |

---

### AppSetting (`app_settings`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | `@id @default(uuid())` | |
| key | String | `@unique` | Setting key |
| value | String | | Setting value (string/JSON) |
| updatedAt | DateTime | `@updatedAt` | |

**Common keys:** `relationship-start-date`, `tour_done__{module}__{userId}`, `expense_limits`, `app_name`, `ai_recipe_created`

---

## Relations Diagram

```
Couple ────┬──── User (coupleId)
           └──── ShareLink (coupleId)

User ──────┬──── Couple (coupleId)
           ├──── RefreshToken (userId)
           ├──── MomentComment (userId, onDelete: SetNull)
           ├──── Notification (userId, onDelete: Cascade)
           ├──── PushSubscription (userId, onDelete: Cascade)
           ├──── LoveLetter (senderId, "SentLetters")
           └──── LoveLetter (recipientId, "ReceivedLetters")

Moment ────┬──── MomentPhoto (momentId, onDelete: Cascade)
           ├──── MomentAudio (momentId, onDelete: Cascade)
           ├──── MomentComment (momentId, onDelete: Cascade)
           └──── MomentReaction (momentId, onDelete: Cascade)

FoodSpot ──┬──── FoodSpotPhoto (foodSpotId, onDelete: Cascade)
           └──── Recipe (foodSpotId, onDelete: Cascade)

Recipe ────┬──── RecipePhoto (recipeId, onDelete: Cascade)
           └──── CookingSessionRecipe (recipeId)

CookingSession ─┬── CookingSessionRecipe (sessionId, onDelete: Cascade)
                ├── CookingSessionItem (sessionId, onDelete: Cascade)
                ├── CookingSessionStep (sessionId, onDelete: Cascade)
                └── CookingSessionPhoto (sessionId, onDelete: Cascade)

Sprint ────────── Goal (sprintId, onDelete: Cascade)

LoveLetter ─┬──── LetterPhoto (letterId, onDelete: Cascade)
            └──── LetterAudio (letterId, onDelete: Cascade)

DatePlan ──────── DatePlanStop (planId, onDelete: Cascade)

DatePlanStop ──── DatePlanSpot (stopId, onDelete: Cascade)
```

---

## Unique Constraints

| Model | Fields | Type |
|-------|--------|------|
| User | email | `@unique` |
| Couple | inviteCode | `@unique` |
| RefreshToken | token | `@unique` |
| ShareLink | token | `@unique` |
| PushSubscription | endpoint | `@unique` |
| MomentReaction | [momentId, emoji, author] | `@@unique` |
| Tag | name | `@unique` |
| Achievement | key | `@unique` |
| AppSetting | key | `@unique` |

---

## Migration History (35 migrations)

| # | Date | Migration | Description |
|---|------|-----------|-------------|
| 1 | 2026-02-18 | `init` | Initial: Users, Moments, MomentPhotos, FoodSpots, Sprints, Goals |
| 2 | 2026-02-19 | `add_goal_description_duedate_backlog` | Goal: description, dueDate fields |
| 3 | 2026-02-20 | `add_user_auth` | User: password field |
| 4 | 2026-02-21 | `add_moment_audio` | MomentAudio model |
| 5 | 2026-02-21 | `add_app_settings` | AppSetting model |
| 6 | 2026-02-21 | `add_spotify_url` | Moment: spotifyUrl field |
| 7 | 2026-02-21 | `add_tag_model` | Tag model |
| 8 | 2026-02-21 | `add_user_avatar` | User: avatar field |
| 9 | 2026-02-21 | `add_recipes` | Recipe + RecipePhoto models |
| 10 | 2026-02-21 | `add_recipe_tutorial_url` | Recipe: tutorialUrl field |
| 11 | 2026-02-21 | `add_recipe_cooked_status` | Recipe: cooked boolean |
| 12 | 2026-02-21 | `add_cooking_sessions` | CookingSession + related models |
| 13 | 2026-02-21 | `add_step_durations` | Recipe: stepDurations array |
| 14 | 2026-02-21 | `add_ingredient_prices` | Recipe: ingredientPrices array |
| 15 | 2026-02-23 | `add_achievements` | Achievement model |
| 16 | 2026-02-23 | `add_custom_achievements` | CustomAchievement model |
| 17 | 2026-02-23 | `add_comments_reactions` | MomentComment + MomentReaction models |
| 18 | 2026-02-23 | `add_comment_user_link` | MomentComment: userId relation |
| 19 | 2026-02-23 | `add_notifications` | Notification model |
| 20 | 2026-02-23 | `add_push_subscriptions` | PushSubscription model |
| 21 | 2026-02-23 | `add_date_planner` | DateWish, DatePlan, DatePlanStop |
| 22 | 2026-02-23 | `add_wish_address_url_tags` | DateWish: address, url, tags |
| 23 | 2026-02-23 | `add_wish_coordinates` | DateWish: latitude, longitude |
| 24 | 2026-02-23 | `add_stop_details` | DatePlanStop: category, notes, cost |
| 25 | 2026-02-23 | `add_date_plan_spots` | DatePlanSpot model |
| 26 | 2026-02-23 | `add_stop_linked_moment` | DatePlanStop: linkedMomentId |
| 27 | 2026-02-23 | `add_stop_linked_food_spot` | DatePlanStop: linkedFoodSpotId |
| 28 | 2026-02-24 | `add_love_letters` | LoveLetter, LetterPhoto, LetterAudio |
| 29 | 2026-02-26 | `add_expense_model` | Expense model |
| 30 | 2026-02-26 | `add_expense_fields_and_session_rating` | CookingSession: rating; Expense refinements |
| 31 | 2026-02-26 | `add_cost_to_date_plan_stop` | DatePlanStop: cost field |
| 32 | 2026-02-27 | `add_letter_media` | Letter media schema refinement |
| 33 | 2026-02-28 | `add_couple_profile` | Couple model, User.coupleId relation |
| 34 | 2026-02-28 | `add_refresh_tokens` | RefreshToken model for JWT auth |
| 35 | 2026-03-01 | `add_share_links` | ShareLink model for public sharing |

---

## Dev Seed Data

Seed script: `backend/prisma/seed.ts` (run via `npm run seed:dev`)

**Creates:**
- 2 Users: `dev@love-scrum.local` + `partner@love-scrum.local` (password: `dev123`)
- 2 Moments with basic data
- 2 FoodSpots (Pho restaurants)
- 1 Sprint with 3 Goals (TODO, IN_PROGRESS, DONE)
- 5 Vietnamese Recipes (Pho Bo, Bun Bo Hue, Com Tam, Banh Xeo, Goi Cuon) with full ingredients, steps, durations, YouTube tutorials
- Weekly recap test data (W08 2026): 3 moments with photos, 1 cooking session, 1 food spot, 1 date plan, 2 love letters
