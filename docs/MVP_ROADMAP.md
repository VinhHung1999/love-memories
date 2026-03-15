# Love Memories — MVP Roadmap

## v1.0 (MVP — App Store Launch)

### Core Features
- Dashboard (relationship timer, daily Q&A card, recent moments)
- Moments (photos, voice memo, tags, comments, reactions)
- Love Letters (compose, schedule, media, overlay on open)
- Daily Q&A
- Profile + Couple management
- Push Notifications (daily Q&A, letter delivery)
- Onboarding (setup wizard + tooltip tour)
- Auth (Google OAuth + Email/Password)
- Subscription / Paywall (RevenueCat)
- Privacy Policy + Terms of Service

### App Store Requirements
- [ ] Apple Developer Account ($99/year)
- [ ] App Store icons (1024x1024)
- [ ] App Store screenshots + descriptions
- [ ] Push Notifications certificate (APNS)
- [ ] iOS signing (bundle ID, certs, provisioning profiles)

---

## v1.1 (Post-Launch — Re-enable Hidden Features)

All code exists, just hidden with `// MVP-HIDDEN: v1.1` comments.

| Feature | Files | Notes |
|---------|-------|-------|
| Expenses | screens/Expenses/, Dashboard ExpenseWidget | Budget limits, category tracking |
| Recipes + Cooking | screens/Recipes/, CookingSession/, CookingHistory/, WhatToEat/ | AI recipe, cooking timer |
| Date Planner | screens/DateWishes/, DatePlans/, PlanDetail/ | Wishes + plans with stops |
| Achievements | screens/Achievements/ | Gamification badges |
| Monthly Recap | screens/MonthlyRecap/ | Instagram Stories-style recap |

---

## v1.2 (Future)

| Feature | Notes |
|---------|-------|
| FoodSpots + Map | Mapbox integration, map pins. Consider cost of Mapbox token |
| Photo Booth | Fun couple photo frames |
| Weekly Recap | Was removed in Sprint 46, could revive |

---

## How to Re-enable

Search codebase for `MVP-HIDDEN` comments:
```bash
grep -r "MVP-HIDDEN" mobile/src/
```

Each hidden feature has navigation entries, dashboard quick actions, and tab entries commented out. Uncomment to restore.
