# Design Direction: Love Memories

## 1. Current Visual Identity Assessment

### Current Color Palette

| Color | Hex | Role | Assessment |
|-------|-----|------|-----------|
| **Primary (Rose)** | `#E8788A` | Main actions, headers, CTAs | STRONG -- Warm, romantic without being cliche red. Distinctive in couples app space where most use pure pink or red. |
| **Secondary (Apricot)** | `#F4A261` | Accent, highlights, warmth | GOOD -- Adds warmth and energy. Pairs well with primary. |
| **Accent (Mint)** | `#7EC8B5` | Success states, secondary actions | GOOD -- Provides contrast and freshness. Prevents monotone pink problem. |

### Palette Verdict: KEEP with Minor Refinements

The current palette is **commercially viable and differentiated**. Most couples apps use:
- Between: Blue-heavy (feels cold, messenger-like)
- Paired: Deep purple/magenta (feels clinical, therapy-adjacent)
- Lovewick: Hot pink + neon (feels young, not premium)
- Honeydue: Mint green (feels financial, not romantic)

Love Memories' warm rose + apricot + mint combination occupies a unique position: **warm and romantic without being "Valentine's Day pink."** This is a meaningful brand asset -- do not discard it.

### Suggested Refinements

| Element | Current | Recommended | Reason |
|---------|---------|-------------|--------|
| Dark mode support | Not implemented | Add dark mode palette | Expected by users; reduces eye strain for evening use (when couples use the app most) |
| Text contrast | Standard | Verify WCAG AA compliance on all color combinations | Accessibility requirement for App Store guidelines |
| Premium tier accent | N/A | Add a gold/champagne accent (`#D4A574`) for premium features | Signals value; differentiates free vs paid UI elements |
| Background warmth | Pure white backgrounds | Warm white (`#FFF8F5`) for main backgrounds | Warmer feel; reduces clinical white-screen perception |

### Dark Mode Palette Suggestion

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Background | `#FFFFFF` / `#FFF8F5` | `#1A1A2E` (Deep navy, not pure black) |
| Surface | `#F9FAFB` | `#252540` |
| Primary | `#E8788A` | `#F08A9C` (slightly lighter for dark bg contrast) |
| Secondary | `#F4A261` | `#F4A261` (maintains warmth) |
| Accent | `#7EC8B5` | `#8FD8C5` (slightly brighter) |
| Text primary | `#1F2937` | `#F0F0F5` |
| Text secondary | `#6B7280` | `#9CA3AF` |

---

## 2. Typography Assessment

### Current Fonts

| Font | Role | Assessment |
|------|------|-----------|
| **Playfair Display** | Headings (`font-heading`) | STRONG -- Elegant serif adds personality and premium feel. Distinctive vs competitors who use all-sans-serif. |
| **Inter** | Body (`font-body`) | STRONG -- Clean, highly readable, excellent for UI. Industry standard for good reason. |

**Verdict**: KEEP. The Playfair Display + Inter combination is commercially distinctive. The serif heading creates a "personal journal" feel that aligns with the memory-keeping value proposition. Most competitors use generic sans-serif for everything.

### Consideration for Vietnamese

- Playfair Display has limited Vietnamese diacritical support -- verify rendering of characters like `a`, `o`, `u`, `d`
- If issues exist, consider **Lora** (serif with better Unicode coverage) as fallback for Vietnamese headings
- Inter has full Vietnamese support -- no issues for body text

---

## 3. App Store Screenshot Strategy

### The 10-Second Rule

Users spend an average of 7-10 seconds on an App Store listing before deciding to download or scroll past. The first 3 screenshots must communicate the core value proposition without requiring users to read description text.

### Recommended Screenshot Sequence (10 Screenshots)

| # | Screen | Headline | Supporting Text | Purpose |
|---|--------|----------|----------------|---------|
| 1 | Dashboard (bento grid) | "Your relationship, one app" | "14 features. One beautiful space for two." | **Hook**: Show the breadth and beauty |
| 2 | Moments timeline | "Capture every moment" | "Photos, voice memos, songs -- your story, your way" | **Core value**: Memory keeping |
| 3 | Monthly recap (Stories view) | "Relive your month together" | "Instagram Stories-style recap, generated automatically" | **Wow factor**: Unique feature, visually stunning |
| 4 | Food spots map | "Your food map" | "Every restaurant. Every cafe. Mapped and rated." | **Unique wedge**: No competitor has this |
| 5 | Love letters | "Send love, on your schedule" | "Letters with photos & voice, delivered when you choose" | **Emotional**: Differentiated feature |
| 6 | Goals (kanban board) | "Dream together. Plan together." | "Shared goals with sprints and progress tracking" | **Utility**: Shows the practical side |
| 7 | What to eat spinner | "Deciding where to eat?" | "Spin to pick from your saved food spots" | **Fun/personality**: Shows the app is not just serious |
| 8 | Recipe + cooking session | "Cook together" | "Save recipes. Track cooking sessions. Rate the results." | **Unique**: No competitor has this |
| 9 | Achievements screen | "Celebrate your milestones" | "Badges, streaks, and relationship achievements" | **Gamification**: Engagement proof |
| 10 | Photo booth | "Couple photos, framed" | "Custom frames for your moments together" | **Fun**: Lighthearted closer |

### Screenshot Design Principles

1. **Device frame**: Use iPhone 15 Pro frame (or latest) -- signals quality
2. **Background**: Use brand gradient (rose -> apricot, subtle) behind device frame
3. **Text placement**: Headline above device, supporting text below
4. **Font**: Playfair Display for headline (matches in-app experience), Inter for supporting text
5. **Consistency**: Same background gradient direction, same text placement, same device frame across all 10
6. **Real content**: Use real app screenshots with attractive sample data, not mockups
7. **Vietnamese first**: Create Vietnamese screenshots for Vietnam App Store; English for US/global

### Preview Video (Optional but Recommended)

A 15-30 second App Store Preview video showing:
1. Opening the app to the beautiful dashboard (2s)
2. Scrolling through moments with photos (3s)
3. Monthly recap in Stories format (4s)
4. Food map with pins (3s)
5. Opening a love letter (3s)
6. Quick montage: goals, recipes, photo booth (3s)
7. End card: "Your relationship, one app" + download CTA (2s)

---

## 4. App Icon Design Direction

### Current State

Review needed -- the icon should embody the brand essence at a glance.

### Recommended Direction

| Option | Concept | Visual | Tone |
|--------|---------|--------|------|
| **A (Recommended)** | Two overlapping hearts forming a "home" | Geometric hearts in primary rose, overlapping to create a shared space shape | Warm, modern, premium |
| B | Infinity symbol made of two colors | Rose + apricot infinity loop | Eternal, connected, elegant |
| C | Memory pin / bookmark | Heart-shaped map pin in brand colors | Specific, functional, map-connected |

**Design Constraints**:
- Must be recognizable at 29x29px (smallest iOS icon size)
- No text in icon (does not scale well)
- Use primary rose `#E8788A` as dominant color
- Subtle gradient acceptable (rose -> apricot)
- Round corners as per iOS/Android guidelines
- Must stand out against competitors' icons (most use pink/red hearts -- differentiate with the dual-heart/home concept)

---

## 5. Visual Language System

### Illustration Style

| Element | Recommendation | Rationale |
|---------|---------------|-----------|
| **Empty states** | Warm line illustrations (couple-themed, not generic) | Encourages first action; sets tone |
| **Achievement badges** | Flat design with brand colors, slight shadow | Collectible feel; matches gamification intent |
| **Onboarding screens** | Full-bleed illustrations with brand gradient backgrounds | Premium feel; sets expectations |
| **Loading states** | Subtle heart pulse animation in brand rose | On-brand; not distracting |
| **Error states** | Apologetic illustration (sad but cute) | Maintains warmth even in failure |

### Animation Philosophy (Already Established)

The app already has a strong animation language:
- **Floating hearts**: Framer Motion infinite loops (monthly recap, dashboard)
- **Shimmer overlays**: Sweep animation for card sparkle
- **Progress bars**: CSS animation for Stories-style advancement
- **Count-up numbers**: SetInterval-based animated numbers for stats

**Recommendation**: Document these as a formal design system. Consistency of animation creates premium perception.

### Photography Direction (For Marketing Materials)

| Do | Don't |
|----|-------|
| Real couples, diverse ages (22-35), natural poses | Stock photo "perfect couple" with matching outfits |
| Phone-in-hand showing the app in context | Floating phone mockups with no human context |
| Vietnamese settings (cafes, street food, parks) for VN market | Generic Western settings for Vietnamese market |
| Warm, golden-hour lighting | Harsh studio lighting |
| Candid, mid-laugh, eating together | Posed, looking directly at camera |

---

## 6. Landing Page Design Direction

### Structure (Above the Fold)

```
┌─────────────────────────────────────────────┐
│                                             │
│  [Logo]                    [VN/EN toggle]   │
│                                             │
│  Your relationship,                         │
│  one app.                                   │
│                                             │
│  [Subtext: 14 features for couples who     │
│   want to capture, plan, and celebrate      │
│   life together.]                           │
│                                             │
│  [Download on App Store] [Get on Play]      │
│                                             │
│        [Hero: iPhone with dashboard         │
│         screenshot, tilted 15deg,           │
│         floating hearts animation]          │
│                                             │
└─────────────────────────────────────────────┘
```

### Below the Fold Sections

1. **Feature Grid**: Bento-style grid mirroring the app's dashboard (visual consistency)
2. **"Replace 5 Apps"**: Side-by-side showing Google Photos + Splitwise + Notes + Maps + Trello logos vs Love Memories icon
3. **Monthly Recap Preview**: Animated GIF/video of the Stories-style recap
4. **Testimonials**: 2-3 couple quotes with photos
5. **Pricing**: Free tier vs Premium comparison table
6. **FAQ**: 5-6 common questions
7. **Footer**: Download buttons, social links, language toggle

---

## 7. Competitive Visual Comparison

| Brand | Primary Color | Icon Style | Visual Mood | Love Memories Differentiation |
|-------|-------------|-----------|-------------|------------------------------|
| **Between** | Blue (#4A90D9) | Heart + chat bubble | Cool, messenger-like | Warmer, more emotional |
| **Paired** | Purple/Magenta | Abstract heart | Clinical, educational | Less formal, more personal |
| **Lovewick** | Hot pink (#FF69B4) | Stylized heart | Young, energetic, bold | More mature, more premium |
| **Honeydue** | Mint green | Honeycomb | Financial, clean | Romantic warmth vs financial cold |
| **Love Memories** | Rose (#E8788A) | TBD (see icon section) | Warm, personal, premium | Unique warm-rose territory |

**Visual positioning**: Love Memories sits between the "fun/young" end (Lovewick) and the "serious/clinical" end (Paired) -- hitting a "warm premium" sweet spot that no competitor currently occupies.

---

## 8. Recommended Actions

| Action | Priority | Timeline | Expected Impact |
|--------|----------|----------|----------------|
| Create App Store screenshot set (10 screens, VN + EN) | HIGH | Week 1-2 | Required for app store launch |
| Design app icon (3 options, test with 50 users) | HIGH | Week 1 | Brand recognition at smallest touchpoint |
| Build landing page (lovememories.app or similar domain) | HIGH | Week 2-3 | Enables paid acquisition and SEO |
| Add warm white background (`#FFF8F5`) | LOW | Sprint N+1 | Subtle premium upgrade |
| Add dark mode | MEDIUM | Sprint N+2 | User retention, evening usage |
| Add premium gold accent for paid features | MEDIUM | With pricing launch | Visual differentiation of premium tier |
| Create brand illustration set (10 empty states + 5 onboarding) | MEDIUM | Week 3-5 | Professional, consistent first impression |
| Document animation system as design tokens | LOW | Ongoing | Consistency as team grows |
