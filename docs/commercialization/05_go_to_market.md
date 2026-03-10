# Go-to-Market Strategy: Love Memories

## 1. Pricing Model Recommendation

### Recommended: Freemium + Subscription

Based on market analysis (85% of App Store revenue is subscription-based [RevenueCat 2025, Tier1/Fresh]; 2-5% freemium conversion rate industry median; SEA price sensitivity requiring low entry barriers), the optimal model is a **generous free tier** with a **subscription unlock** for premium features.

### Pricing Tiers

| Tier | Price (Vietnam) | Price (Global) | Features |
|------|----------------|----------------|----------|
| **Free** | $0 | $0 | 5 modules: Dashboard, Moments (up to 10), Food Spots (up to 10), Goals (1 active sprint), Expenses (up to 10) |
| **Plus (Monthly)** | 49,000 VND (~$1.99) | $3.99/mo | All 14 modules, unlimited moments/food spots/goals, love letters, date planner, photo booth, monthly recap, achievements |
| **Plus (Annual)** | 399,000 VND (~$15.99) | $29.99/yr | Same as Plus Monthly, ~33% discount, best value badge |
| **Lifetime** | 999,000 VND (~$39.99) | $79.99 once | All features forever; limited-time launch offer |

### Pricing Rationale

```
FORMULA: Target ARPU = (Free users x $0) + (Paid users x subscription price) / total users
INPUTS:
  - Expected free-to-paid conversion: 4% (midpoint of 2-5% industry range)
    Source: RevenueCat State of Subscriptions 2025 [Tier1/Fresh]
  - Vietnam monthly sub: $1.99 (aligned with SEA pricing: $0.99-$4.99 range)
    Source: S&P Global SEA pricing analysis [Tier1/Aging]
  - Annual sub: $15.99 (33% discount vs monthly)
  - Expected annual/monthly split: 60% annual / 40% monthly (industry pattern)
CALC:
  Per 1,000 users:
  - 960 free ($0) + 40 paid
  - 40 paid: 16 monthly ($1.99 x 12 = $23.88/yr) + 24 annual ($15.99/yr)
  - Revenue: (16 x $23.88) + (24 x $15.99) = $382.08 + $383.76 = $765.84
  - ARPU = $765.84 / 1,000 = $0.77/user/year
RESULT: ~$0.77 ARPU per registered user per year [Estimated]
CONFIDENCE: LOW — Conversion rate and pricing assumptions are unvalidated for this specific product/market
```

### Why NOT These Alternatives

| Model | Why Not |
|-------|---------|
| **Fully paid** | Kills acquisition. Couples apps need both partners to adopt; friction of paying upfront prevents viral pair-invite |
| **Ad-supported free** | Erodes premium perception. Couples want privacy -- ads feel invasive in a relationship app. Also, Vietnam CPM is very low ($0.50-$1.50), making ad revenue negligible |
| **One-time purchase only** | No recurring revenue; impossible to fund ongoing development. Couples apps require continuous feature investment |
| **Per-couple pricing** | Confusing billing. Charge once per couple (one person pays) -- cleaner than per-person |

### Free Tier Design Philosophy

The free tier must be **genuinely useful**, not a crippled demo. A couple should be able to use Love Memories on free tier and build enough data (memories, food spots, goals) that upgrading feels like unlocking the full potential of something they already love -- not paying to remove artificial restrictions.

**Critical**: The free tier IS the acquisition funnel. If free is too limited, users leave. If free is too generous, nobody upgrades. The limits above (10 moments, 10 food spots, 1 sprint, 10 expenses) give approximately 2-3 weeks of active use before hitting limits — enough to see value and want more.

---

## 2. Launch Strategy

### Phase 0: Pre-Launch (Weeks 1-4)

| Action | Owner | Timeline | Success Metric |
|--------|-------|----------|---------------|
| Submit React Native app to App Store + Google Play | Dev | Week 1-2 | Approved and live |
| Create landing page (lovememories.app) | Dev + Marketing | Week 1-2 | Live with email capture |
| Set up analytics (Mixpanel/Amplitude + RevenueCat) | Dev | Week 1-2 | Events tracking verified |
| Build email waitlist (target: 500 signups pre-launch) | Marketing | Week 2-4 | 500 emails collected |
| Create 10 App Store screenshots (VN + EN) | Design | Week 2-3 | Uploaded to App Store Connect |
| Record App Store preview video | Marketing | Week 3-4 | 15-30s video uploaded |
| Write ASO-optimized App Store description | Marketing | Week 2-3 | Keywords researched, descriptions live |
| Seed 5-10 beta couples for testimonials | Marketing | Week 2-4 | 5 written testimonials, 2 video |

### Phase 1: Soft Launch Vietnam (Weeks 5-8)

| Action | Owner | Timeline | Success Metric |
|--------|-------|----------|---------------|
| Launch on VN App Store + Google Play | Dev | Week 5 | Live and indexed |
| Activate email waitlist (launch announcement) | Marketing | Week 5 | 30%+ open rate |
| Seed content on Vietnamese couples TikTok/Instagram | Marketing | Week 5-8 | 10 posts, 50K+ impressions |
| Reach out to 5 Vietnamese relationship/lifestyle influencers | Marketing | Week 5-6 | 2-3 partnerships confirmed |
| Facebook/Instagram ads (VN targeted, $500 budget) | Marketing | Week 6-8 | CPD < 10,000 VND (~$0.40), 1,250+ installs |
| Monitor App Store reviews; respond to all | Marketing | Week 5-8 | 4.5+ star average |
| Collect user feedback (in-app survey after 7 days) | Dev + Marketing | Week 6-8 | 100+ survey responses |

### Phase 2: Growth Vietnam (Months 3-6)

| Action | Owner | Timeline | Success Metric |
|--------|-------|----------|---------------|
| Launch Valentine's Day campaign (Feb) or Tet campaign (Jan-Feb) | Marketing | Align to calendar | 3x normal daily installs |
| Introduce referral program ("Invite a couple, get 1 month free") | Dev + Marketing | Month 3 | Viral coefficient > 1.2 |
| Expand to Vietnamese diaspora markets (US, AU, JP, KR) | Marketing | Month 4 | 500+ international installs |
| Test paid acquisition on TikTok Ads | Marketing | Month 4-5 | CPD benchmark established |
| Launch "Gift a subscription" for couples | Dev | Month 5-6 | Seasonal revenue spike |
| Partner with 1-2 wedding planners/photographers for co-marketing | Marketing | Month 4-6 | 200+ installs from partnerships |

### Phase 3: Regional Expansion (Months 7-12)

| Action | Owner | Timeline | Success Metric |
|--------|-------|----------|---------------|
| Localize for Thailand + Philippines (if VN metrics are strong) | Dev + Marketing | Month 7-9 | App Store listings live in TH + PH |
| English-first marketing for global App Store | Marketing | Month 7 | Global ASO optimization |
| Apply to App Store "Apps We Love" editorial feature | Marketing | Month 8 | Editorial feature secured |
| Explore content partnerships (relationship coaches, podcasters) | Marketing | Month 9-12 | 3+ content partnerships |

---

## 3. App Store Optimization (ASO)

### Keyword Strategy

**Primary Keywords** (high intent, moderate competition):

| Keyword | Search Volume (est.) | Competition | Priority |
|---------|---------------------|-------------|----------|
| couples app | HIGH | HIGH | Target -- must rank |
| relationship app | HIGH | HIGH | Target -- must rank |
| couples planner | MEDIUM | LOW | Quick win |
| couple memory app | MEDIUM | LOW | Quick win |
| shared photo album couples | MEDIUM | MEDIUM | Content match |
| couple goals app | LOW-MEDIUM | LOW | Quick win |
| love letter app | LOW | LOW | Niche own |
| food spots tracker | LOW | VERY LOW | Uncontested |
| couple expense tracker | LOW-MEDIUM | MEDIUM | Specific utility |

**Vietnamese Keywords**:

| Keyword | Priority | Notes |
|---------|----------|-------|
| ung dung cho cap doi | HIGH | Primary Vietnamese search term |
| luu giu ky niem | MEDIUM | "Save memories" |
| quan ly chi tieu cap doi | MEDIUM | "Couple expense management" |
| thu tinh | LOW | "Love letter" -- niche but uncontested |
| dia diem an uong | MEDIUM | "Food spots" |

### App Store Listing Optimization

**Title** (30 chars max): `Love Memories: Couples App`

**Subtitle** (30 chars max): `Your Relationship, One App`

**Keywords** (100 chars, iOS): `couples,relationship,memories,love,shared,goals,food,planner,letter,expense,album,date,recipe`

**Description Structure**:
1. Opening hook (benefits-led, not features-led)
2. Feature highlights with emoji bullets
3. Social proof (ratings, testimonials)
4. Privacy commitment
5. Download CTA

### ASO Maintenance Cadence

| Activity | Frequency | Owner |
|----------|-----------|-------|
| Keyword ranking check | Weekly | Marketing |
| Screenshot A/B test (if using Apple's product page optimization) | Monthly | Marketing |
| Description update | Quarterly or after major feature launch | Marketing |
| Competitor keyword monitoring | Bi-weekly | Marketing |
| Review response | Daily (first 90 days), then 3x/week | Marketing |

---

## 4. Marketing Channel Strategy

### Channel Priority Matrix

| Channel | Priority | Budget Allocation | Expected CPD (VN) | Compounding? | Timeline |
|---------|----------|-------------------|-------------------|-------------|----------|
| **ASO (App Store organic)** | 1 (Critical) | 10% (setup cost) | $0 (organic) | HIGH | 3-6 months |
| **TikTok organic** | 2 (High) | 5% (content creation) | $0 (organic) | MEDIUM | 1-3 months |
| **Instagram organic** | 2 (High) | 5% (content creation) | $0 (organic) | MEDIUM | 1-3 months |
| **Facebook/Instagram Ads** | 3 (Medium) | 30% | $0.30-0.50 | LOW | Immediate |
| **TikTok Ads** | 3 (Medium) | 20% | $0.20-0.40 | LOW | 1-2 weeks |
| **Influencer partnerships** | 4 (Medium) | 20% | $0.50-1.00 (blended) | MEDIUM | 2-4 weeks |
| **Word-of-mouth / referral** | 1 (Critical) | 10% (referral rewards) | Near $0 | HIGH | 3-6 months |
| **PR / media** | 5 (Low priority initially) | 0% (earned) | $0 | MEDIUM | 2-3 months |

```
FORMULA: Year-1 marketing budget recommendation
INPUTS:
  - Target installs Year 1: 15,000-25,000 couples (30K-50K individual installs)
  - Blended CPD across channels: $0.30-$0.50
  - Organic share assumption: 40% of installs come from organic (ASO + WoM)
  - Paid installs needed: 60% x 40,000 midpoint = 24,000
CALC:
  - Paid budget: 24,000 x $0.40 blended CPD = $9,600
  - Content creation + influencer: ~$5,000
  - Tools (analytics, ASO): ~$1,400
  - Total: ~$16,000
RESULT: Year-1 marketing budget = $15,000-$20,000 [Estimated]
LABEL: [Estimated]
CONFIDENCE: LOW — CPD estimates for VN couples apps are unvalidated; based on VN mobile app advertising benchmarks
```

### Content Strategy for Social Media

**TikTok Content Pillars** (Vietnamese market):

| Pillar | Content Type | Posting Frequency | Example |
|--------|-------------|-------------------|---------|
| **App showcase** | Screen recording + narration | 2x/week | "POV: You and your partner open your monthly recap" |
| **Couples relatable** | Skit/meme format | 3x/week | "My boyfriend trying to remember where we ate last week" vs "Me opening Love Memories" |
| **Feature tips** | Tutorial-style | 1x/week | "3 things you didn't know you could do in Love Memories" |
| **User stories** | Testimonial/UGC | 1x/week | Real couple showing their app usage |

**Instagram Content Pillars**:

| Pillar | Format | Frequency |
|--------|--------|-----------|
| **Feature highlights** | Carousel (5-7 slides) | 2x/week |
| **Aesthetic screenshots** | Single image + caption | 3x/week |
| **Reels (cross-post from TikTok)** | Short video | 2x/week |
| **Stories** | Polls, Q&A, behind-the-scenes | Daily |

---

## 5. Vietnam vs Global Market Entry

### Recommended: Vietnam-First Strategy

| Factor | Vietnam First | Global First |
|--------|-------------|-------------|
| **Competition** | Low (no dominant local couples app) | HIGH (Between, Paired, Lovewick established) |
| **Cultural advantage** | Strong (Vietnamese-native) | Weak (one of many) |
| **Marketing cost** | Low (VN CPM/CPC are 3-5x cheaper than US) | High |
| **Willingness to pay** | Lower ($1.99-2.99/mo) | Higher ($3.99-6.99/mo) |
| **Brand building** | Can become #1 in VN category | Buried in global competition |
| **User feedback loop** | Tight (founder is target user) | Loose (distant from user base) |
| **Revenue ceiling** | Lower (smaller market) | Higher (larger market) |

**Verdict**: Launch Vietnam first to achieve product-market fit, build a base of loyal users and testimonials, and refine the product. Expand globally from a position of strength, not desperation.

### Expansion Sequence

```
Quarter 1-2: Vietnam (VN App Store, Vietnamese marketing)
Quarter 3:   Vietnamese diaspora (US, Australia, Japan — English + Vietnamese)
Quarter 4:   Southeast Asia (Thailand, Philippines, Indonesia — English)
Year 2:      Global English-speaking markets (US, UK, Canada, Australia)
Year 2+:     Korean localization (large couples app market, Between's home turf)
```

---

## 6. Seasonal Marketing Calendar (Vietnam)

| Period | Event | Campaign | Expected Impact |
|--------|-------|----------|----------------|
| **Jan-Feb** | Tet (Lunar New Year) | "Start the new year together" -- premium discount, couples challenge | 2-3x installs |
| **Feb 14** | Valentine's Day | "Gift Love Memories" -- gift subscriptions, special frames in photo booth | 3-5x installs |
| **Mar 8** | International Women's Day | Love letter campaign -- "Write her a letter" | 1.5x installs |
| **Jun-Jul** | Summer / travel season | Food spot + date planner features highlighted | 1.5x installs |
| **Oct** | Vietnamese Women's Day (20/10) | Love letter + memory campaign | 2x installs |
| **Nov** | Singles' Day (11/11) -- reframe for couples | "Double the love" subscription deal | Revenue spike |
| **Dec** | Year-end / Christmas | "Your Year Together" recap push; annual subscription discount | 2x installs + conversion |

---

## 7. Metrics & KPI Targets

### Year 1 Targets

| Metric | Target | Measurement | Review Cadence |
|--------|--------|-------------|---------------|
| **Total couple signups** | 10,000-20,000 couples | Analytics (Mixpanel/Amplitude) | Weekly |
| **Day-7 retention** | >25% | Analytics | Weekly |
| **Day-30 retention** | >15% | Analytics | Monthly |
| **Free-to-paid conversion** | 3-5% | RevenueCat | Monthly |
| **Monthly revenue** | $1,500-$3,000 by Month 12 | RevenueCat | Monthly |
| **App Store rating** | 4.5+ stars | App Store | Weekly |
| **Viral coefficient** | >1.1 (each user brings >1.1 new users) | Analytics | Monthly |
| **CAC (paid channels)** | <$1.00 per couple install (VN) | Ad platform + analytics | Bi-weekly |

### Stop/Scale Decision Rules

| Metric | SCALE (2x budget) | CONTINUE | KILL (stop spend) |
|--------|-------------------|----------|-------------------|
| CPD (Vietnam) | <$0.25 | $0.25-$0.50 | >$0.50 after 2 weeks |
| Day-7 retention (paid users) | >30% | 20-30% | <20% |
| Free-to-paid conversion | >5% | 3-5% | <2% after 3 months |
| App Store rating | >4.5 | 4.0-4.5 | <4.0 (fix product first) |

---

## 8. Revenue Projection Scenarios (Marketing Efficiency Only)

**Note**: These are marketing efficiency scenarios, not P&L projections. CFO input needed for operational costs, server costs, and full financial modeling.

### Conservative Scenario

```
FORMULA: Year-1 Revenue = Paid couples x Blended annual subscription revenue
INPUTS:
  - Total couples: 10,000
  - Free-to-paid conversion: 3%
  - Paid couples: 300
  - Blended annual revenue per paid couple: $18 (mix of monthly + annual VN pricing)
CALC: 300 x $18 = $5,400
RESULT: Year-1 revenue = ~$5,400 [Estimated]
Marketing spend: $15,000
Marketing ROI: -64% (investment phase, expected)
```

### Base Scenario

```
FORMULA: Same as above
INPUTS:
  - Total couples: 15,000
  - Free-to-paid conversion: 4%
  - Paid couples: 600
  - Blended annual revenue: $20
CALC: 600 x $20 = $12,000
RESULT: Year-1 revenue = ~$12,000 [Estimated]
Marketing spend: $18,000
Marketing ROI: -33% (approaching break-even trajectory)
```

### Optimistic Scenario

```
FORMULA: Same as above
INPUTS:
  - Total couples: 25,000 (viral growth kicks in)
  - Free-to-paid conversion: 5%
  - Paid couples: 1,250
  - Blended annual revenue: $22 (more annual subs)
CALC: 1,250 x $22 = $27,500
RESULT: Year-1 revenue = ~$27,500 [Estimated]
Marketing spend: $20,000
Marketing ROI: +38%
```

**CFO Input Needed**: Server costs, App Store commission (15-30%), developer time cost, and full P&L to determine actual profitability timeline.

---

## 9. Immediate Next Steps

| # | Action | Owner | Timeline | Dependency |
|---|--------|-------|----------|------------|
| 1 | Set up RevenueCat for subscription management | Dev | Week 1 | None |
| 2 | Implement free tier limits (50 moments, 20 food spots, 1 sprint) | Dev | Week 1-2 | Pricing decision confirmed |
| 3 | Build paywall screen (trigger at free tier limit) | Dev | Week 2 | #2 complete |
| 4 | Create App Store listing (screenshots, description, keywords) | Marketing + Design | Week 2-3 | Screenshots designed |
| 5 | Submit to App Store + Google Play | Dev | Week 3 | #1-4 complete |
| 6 | Set up Mixpanel/Amplitude analytics | Dev | Week 1-2 | None |
| 7 | Build landing page with email capture | Dev | Week 2-3 | Domain secured |
| 8 | Conduct willingness-to-pay survey (200 VN couples) | Marketing | Week 1-3 | Survey designed |
| 9 | Create 5 TikTok videos for launch content bank | Marketing | Week 3-4 | App screenshots/recordings ready |
| 10 | Identify and contact 5 VN lifestyle influencers | Marketing | Week 3-4 | None |

**Critical Path**: Items 1-5 are blocking for revenue generation. Parallelize items 6-10 alongside.
