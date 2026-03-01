# Love Memories

A full-stack Progressive Web App for couples to capture memories, plan dates, track shared goals, and stay connected — all in one place.

Built as a personal project, deployed as a PWA optimized for iPhone homescreen use.

![Tech Stack](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

---

## Features

### Moments & Memories
- Photo journal with multi-image uploads, voice memos, and reactions
- Comment threads on each moment
- Background upload queue — never blocks the UI

### Interactive Map
- Mapbox GL JS map with pins for food spots and geotagged moments
- Location picker with geocoding (Vietnam locale) and browser geolocation
- Filter and explore by category

### Food Spots & Recipes
- Save restaurants with photos, ratings, GPS coordinates
- Full recipe manager with ingredients and step-by-step instructions
- Cooking session tracker — log what you cooked, rate the result, attach photos

### Love Letters
- Write and schedule letters with photos and voice memos
- Draft → Scheduled → Delivered → Read lifecycle with push notifications
- Instagram-style full-screen letter reader with audio playback

### Date Planner
- Plan dates with multiple stops on a map
- Date wishlist for future ideas
- AI-powered date suggestions (OpenAI integration)

### Shared Goals (Scrum Board)
- Kanban board with drag-and-drop (Backlog → To Do → In Progress → Done)
- Sprint management with goals and progress tracking
- Gamified achievements system with custom milestones

### Expense Tracker
- Log shared expenses with daily/monthly stats
- Spending limits with visual progress indicators
- Charts and breakdowns via Recharts

### Recaps
- **Weekly Recap** — stat cards with week-over-week navigation
- **Monthly Recap** — Instagram Stories-style full-screen viewer with animated progress bars, auto-advance, tap navigation, and count-up animations

### More
- Push notifications (Web Push API)
- Guided tours on every module (driver.js)
- Photo booth with canvas effects and confetti
- Dark-friendly color palette with Playfair Display + Inter typography
- Responsive: desktop sidebar + mobile bottom navigation with iOS safe areas

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| Tailwind CSS v4 | Styling (`@tailwindcss/vite` plugin) |
| React Router v7 | Client-side routing (24 pages) |
| TanStack React Query | Server state & caching |
| Framer Motion | Animations & page transitions |
| Mapbox GL JS | Interactive maps |
| @hello-pangea/dnd | Drag-and-drop kanban board |
| Recharts | Expense charts & stats |
| Swiper | Touch-friendly carousels |
| driver.js | Guided onboarding tours |

### Backend
| Technology | Purpose |
|-----------|---------|
| Express 5 | REST API server |
| TypeScript | Type safety |
| Prisma ORM | Database access (31 models) |
| PostgreSQL | Relational database |
| Zod | Request validation |
| JWT | Authentication |
| Multer + Sharp | Image upload & processing |
| Web Push | Push notifications |
| node-cron | Scheduled jobs (recaps, letter delivery) |
| OpenAI API | AI-powered date suggestions |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| PWA | Installable on iPhone homescreen |
| Cloudflare Tunnel | HTTPS exposure without port forwarding |
| PM2 | Process management (prod + dev) |

---

## Architecture

```
frontend/                    backend/
├── src/                     ├── src/
│   ├── pages/ (24)          │   ├── routes/ (23 route files)
│   ├── components/          │   ├── middleware/
│   ├── lib/                 │   ├── utils/
│   │   ├── api.ts           │   └── index.ts
│   │   ├── auth.tsx         ├── prisma/
│   │   ├── uploadQueue.ts   │   └── schema.prisma (31 models)
│   │   └── useModuleTour.ts └── uploads/
│   └── types/
└── public/
    └── manifest.json
```

- **Monorepo** with separate `frontend/` and `backend/` packages
- Frontend proxies `/api` and `/uploads` to backend in dev
- Background upload queue for all file uploads (never blocks UI)
- Singleton Prisma client with connection pooling
- UUID-based file storage with Sharp image processing

---

## Database Schema

31 Prisma models across these domains:

| Domain | Models |
|--------|--------|
| Users & Auth | User |
| Moments | Moment, MomentPhoto, MomentAudio, MomentComment, MomentReaction |
| Food | FoodSpot, FoodSpotPhoto, Recipe, RecipePhoto |
| Cooking | CookingSession, CookingSessionRecipe, CookingSessionItem, CookingSessionStep, CookingSessionPhoto |
| Letters | LoveLetter, LetterPhoto, LetterAudio |
| Dates | DatePlan, DatePlanStop, DatePlanSpot, DateWish |
| Goals | Sprint, Goal, Tag |
| Achievements | Achievement, CustomAchievement |
| Finance | Expense |
| System | AppSetting, Notification, PushSubscription |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Mapbox access token

### Setup

```bash
# Clone
git clone git@github.com:VinhHung1999/love-memories.git
cd love-memories

# Backend
cd backend
npm install
cp .env.example .env          # Configure DATABASE_URL, JWT_SECRET, etc.
npx prisma migrate dev
npm run dev                    # Starts on port 5005

# Frontend (new terminal)
cd frontend
npm install
npm run dev                    # Starts on port 3337, proxies /api to :5005
```

### Environment Variables

**Backend** (`.env`):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/love_memories
JWT_SECRET=your-secret-key
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
OPENAI_API_KEY=...            # Optional, for AI date suggestions
```

**Frontend** (`.env`):
```
VITE_MAPBOX_TOKEN=your-mapbox-token
```

---

## Scripts

```bash
# Backend
npm run dev          # Dev server with hot reload (tsx watch)
npm run build        # Compile TypeScript
npm test             # Jest + Supertest integration tests
npm run lint         # ESLint

# Frontend
npm run dev          # Vite dev server
npm run build        # Production build
npm test             # Vitest
npm run lint         # ESLint

# Database
npx prisma migrate dev     # Run migrations
npx prisma studio          # Visual DB browser
```

---

## Project Stats

- **277+ commits** across 30 sprints
- **31 database models** with full relational integrity
- **24 frontend pages** (~11K lines of React)
- **23 API route files** with Zod validation
- **12 guided tours** (driver.js onboarding)
- **Full test suite** with Jest + Supertest (backend) and Vitest (frontend)

---

## License

This is a personal project. All rights reserved.
