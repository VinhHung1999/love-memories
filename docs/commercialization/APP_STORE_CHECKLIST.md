# App Store Launch Checklist — Love Memories

**Target:** iOS App Store + Google Play Store
**Status:** In Progress
**Last Updated:** 2026-03-09

---

## Phase 1: Technical Fixes (Week 1)

### Blocking Issues
- [ ] Fill Google OAuth Web Client ID in `mobile/App.tsx` (webClientId)
- [ ] Add `google-services.json` to `mobile/android/app/` (Firebase Console)
- [ ] Add `GoogleService-Info.plist` to `mobile/ios/LoveScrum/` (Firebase Console)
- [ ] Fix unused variable `iconBgClass` in `mobile/src/components/AppBottomSheet.tsx`
- [ ] Add global ErrorBoundary wrapper in RootNavigator (prevent white screen crashes)

### Subscription Infrastructure (Freemium)
- [ ] Set up RevenueCat account + project
- [ ] Integrate RevenueCat SDK in React Native app
- [ ] Create subscription products:
  - Plus Monthly: 49,000 VND / $3.99
  - Plus Annual: 399,000 VND / $29.99
  - Lifetime: 999,000 VND / $79.99
- [ ] Implement free tier limits:
  - Moments: 10
  - Food Spots: 10
  - Expenses: 10
  - Goals/Sprints: 1 active sprint
- [ ] Build Paywall screen (trigger when user hits free limit)
- [ ] Build "Plus" badge/indicator in Profile for subscribers
- [ ] Lock premium modules for free users: Recipes, Love Letters, Date Planner, Photo Booth, Weekly Recap, Monthly Recap, Achievements, What to Eat

### Quality & Stability
- [ ] Integrate crash reporting (Sentry or Bugsnag)
- [ ] Test on real iOS device (iPhone 12+, iOS 16+)
- [ ] Test on real Android device (Pixel/Samsung, Android 12+)
- [ ] Performance audit: startup time < 3s, no memory leaks
- [ ] Test all 23 screens end-to-end on both platforms

---

## Phase 2: App Store Setup (Week 2)

### Apple Developer Account
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Create App ID (com.lovememories.app or similar)
- [ ] Create iOS Distribution Certificate
- [ ] Create App Store Provisioning Profile
- [ ] Configure App Store Connect listing

### Google Play Console
- [ ] Register Google Play Developer account ($25 one-time)
- [ ] Create app listing in Google Play Console
- [ ] Create Android release keystore (store password securely!)
- [ ] Configure signing in `android/app/build.gradle`

### App Metadata (Both Stores)
- [ ] **App Name:** Love Memories
- [ ] **Subtitle:** Your Relationship, One App
- [ ] **Category:** Lifestyle
- [ ] **Age Rating:** 12+
- [ ] **Description (Short):** Save moments, plan dates, track food spots — together.
- [ ] **Description (Long):** Write compelling 4000-char description (see ASO keywords in 05_go_to_market.md)
- [ ] **Keywords (iOS):** couples,relationship,memories,love,shared,goals,food,planner,letter,expense,album,date,recipe
- [ ] **What's New:** "Initial release — your complete couples companion app"

---

## Phase 3: Legal & Privacy (Week 2)

- [ ] Write Privacy Policy (host at lovememories.app/privacy or similar)
  - Data collected: email, name, photos, location, expenses
  - Data storage: PostgreSQL on private server
  - Third-party services: Google OAuth, Firebase FCM, Mapbox, Cloudflare
  - Data deletion: user can request account deletion
- [ ] Write Terms of Service (host at lovememories.app/terms)
- [ ] Add Privacy Policy URL in App Store Connect + Google Play Console
- [ ] Add "Delete Account" feature in Profile (Apple requirement since 2022)
- [ ] Add in-app Privacy Policy link in Profile/Settings
- [ ] Data Safety form (Google Play) — declare all data types collected

---

## Phase 4: Visual Assets (Week 2-3)

### App Icon
- [ ] Redesign app icon for "Love Memories" branding (not "Love Scrum")
- [ ] iOS icon: 1024x1024 (no transparency, no rounded corners — Apple auto-rounds)
- [ ] Android icon: 512x512 adaptive icon (foreground + background layers)
- [ ] Generate all required sizes via icon generator tool

### Screenshots (CRITICAL for conversion)
- [ ] iPhone 6.7" (1290x2796) — required, iPhone 15 Pro Max
- [ ] iPhone 6.5" (1242x2688) — required, iPhone 11 Pro Max
- [ ] iPad 12.9" (2048x2732) — if supporting iPad
- [ ] Android Phone (1080x1920 or similar)

**10 Screenshot Sequence:**
1. Dashboard — bento grid overview ("Your relationship at a glance")
2. Moments — photo grid with tags ("Save every precious moment")
3. Map — pins with food spots + moments ("Your places, mapped")
4. Food Spots — restaurant cards ("Never forget where you ate")
5. Recipes — recipe cards + cooking ("Cook together, grow together")
6. Love Letters — letter with voice memo ("Words that last forever")
7. Date Planner — itinerary view ("Plan perfect dates")
8. Monthly Recap — stories-style recap ("Relive your month together")
9. Expenses — spending breakdown ("Track spending, stress-free")
10. Achievements — unlocked badges ("Celebrate your milestones")

- [ ] Create screenshot frames with device mockup + headline text
- [ ] Localize screenshots for Vietnamese market

### Preview Video (Optional but recommended)
- [ ] 15-30s App Store preview video showing key flows
- [ ] Must start with app in use (no splash screens)

---

## Phase 5: Build & Submit (Week 3)

### iOS Submission
- [ ] Set version to 1.0.0 in `ios/LoveScrum/Info.plist`
- [ ] Archive build in Xcode (Product → Archive)
- [ ] Upload to App Store Connect via Xcode or Transporter
- [ ] Fill in all App Store Connect fields
- [ ] Submit for App Review
- [ ] Typical review time: 1-3 days

### Android Submission
- [ ] Set version to 1.0.0 in `android/app/build.gradle`
- [ ] Build signed APK/AAB: `cd android && ./gradlew bundleRelease`
- [ ] Upload AAB to Google Play Console
- [ ] Fill in all Play Store listing fields
- [ ] Complete Data Safety form
- [ ] Submit for review (Internal → Closed → Open → Production)
- [ ] Typical review time: 1-7 days

---

## Phase 6: Analytics & Monitoring (Week 3-4)

- [ ] Set up Mixpanel or Amplitude for user analytics
- [ ] Track key events:
  - Sign up, Login, Couple paired
  - Moment created, Food spot added, Recipe saved
  - Paywall shown, Subscription started, Subscription cancelled
  - Screen views, Session duration
- [ ] Set up RevenueCat dashboard for revenue tracking
- [ ] Set up Sentry/Bugsnag alerts for crash spikes
- [ ] Monitor App Store reviews daily (first 30 days)

---

## Phase 7: Post-Launch (Week 4+)

- [ ] Respond to all App Store reviews within 24h
- [ ] Fix critical bugs within 48h, submit update
- [ ] Collect user feedback via in-app survey (after 7 days of use)
- [ ] Plan first update (2-3 weeks after launch)
- [ ] Start ASO optimization based on keyword performance
- [ ] Begin social media content (TikTok + Instagram — see 05_go_to_market.md)

---

## Quick Reference

| Item | Value |
|------|-------|
| Bundle ID (iOS) | com.lovememories.app |
| Package Name (Android) | com.lovememories.app |
| App Name | Love Memories |
| Version | 1.0.0 |
| Min iOS | 16.0 |
| Min Android | API 24 (Android 7.0) |
| Pricing | Freemium + Subscription |
| Free Tier | Dashboard, Moments(10), FoodSpots(10), Expenses(10), Goals(1 sprint) |
| Plus Monthly | 49,000 VND / $3.99 |
| Plus Annual | 399,000 VND / $29.99 |
| Lifetime | 999,000 VND / $79.99 |
