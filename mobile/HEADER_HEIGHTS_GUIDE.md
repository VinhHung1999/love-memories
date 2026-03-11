# CollapsibleHeader Heights Guide

## Standard Height Values

### **Default (Simple Header)**
```tsx
expandedHeight={120}  // Title + subtitle
collapsedHeight={56}   // Standard mobile header
```
**Use for:** Simple screens with title + subtitle, no tabs/filters

---

### **Header with Footer Bar**
```tsx
expandedHeight={140}  // Title + subtitle + some breathing room
collapsedHeight={96}   // 56 (header) + 40 (footer bar height)
```
**Use for:** Screens with renderFooter (tabs, filters, action bar)

**Examples:**
- Moments (tag filters)
- Food Spots (tag filters)
- Letters (inbox/sent tabs)
- Recipes (category filters)
- Daily Questions (answered/unanswered tabs)

---

### **Header with Expanded Content**
```tsx
expandedHeight={200-260}  // Depends on content height
collapsedHeight={56}       // Standard (no footer)
```
**Use for:** Screens with renderExpandedContent (carousels, preview cards)

**Examples:**
- Dashboard: `expandedHeight={260}` (HeroMomentCard carousel ~200px + padding)

---

### **Header with Both Footer + Expanded Content**
```tsx
expandedHeight={220-280}  // Content + footer
collapsedHeight={96}       // With footer bar
```
**Use for:** Complex headers with both expanded content AND footer bar

---

## Calculation Formula

### Collapsed Height
```
collapsedHeight = baseHeight + footerHeight
  baseHeight = 56px (standard header)
  footerHeight = 0px (no footer) | 40px (simple footer) | 56px (complex footer)
```

### Expanded Height
```
expandedHeight = titleArea + expandedContent + footer + padding
  titleArea = 60-80px (title + subtitle with padding)
  expandedContent = 0px (none) | 120-200px (carousel/cards)
  footer = 0px (none) | 40-56px (tabs/filters)
  padding = 20-40px (top/bottom breathing room)
```

---

## Screen-by-Screen Recommendations

| Screen | Expanded | Collapsed | Reason |
|--------|----------|-----------|--------|
| **Dashboard** | 260 | 56 | Large carousel (no footer in header) |
| **Moments** | 140 | 96 | Tag filter footer |
| **Food Spots** | 140 | 96 | Tag filter footer |
| **Letters** | 140 | 96 | Inbox/Sent tabs footer |
| **Recipes** | 140 | 96 | Category filter footer |
| **Daily Questions** | 160 | 96 | Answered/Unanswered tabs + more vertical space |
| **Expenses** | 140 | 112 | Month selector footer (taller - 56px) |
| **Date Plans** | 140 | 96 | Status filter footer |
| **Achievements** | 120 | 56 | Simple header |
| **Notifications** | 120 | 56 | Simple header |
| **Profile** | 120 | 56 | Simple header |
| **Detail screens** | 120 | 56 | Simple header with back button |

---

## Implementation Example

```tsx
// Simple header (Profile, Achievements, etc.)
<CollapsibleHeader
  title={t.screen.title}
  subtitle={t.screen.subtitle}
  scrollY={scrollY}
  // Uses defaults: expandedHeight={120}, collapsedHeight={56}
/>

// Header with filter footer (Moments, Food, etc.)
<CollapsibleHeader
  title={t.screen.title}
  subtitle={t.screen.subtitle}
  expandedHeight={140}
  collapsedHeight={96}
  scrollY={scrollY}
  renderFooter={() => <FilterBar />}
/>

// Header with expanded content (Dashboard)
<CollapsibleHeader
  title={t.screen.title}
  expandedHeight={260}
  collapsedHeight={56}
  scrollY={scrollY}
  renderExpandedContent={() => <Carousel />}
/>
```

---

## Visual Breakdown

### Collapsed State (56px)
```
┌────────────────────────────────┐
│  Safe Area Top (44px iOS)      │
├────────────────────────────────┤
│  ← [Icon]  Title      [Icon] → │  56px
└────────────────────────────────┘
```

### Collapsed with Footer (96px)
```
┌────────────────────────────────┐
│  Safe Area Top (44px iOS)      │
├────────────────────────────────┤
│  ← [Icon]  Title      [Icon] → │  56px
├────────────────────────────────┤
│  [Tab 1]  [Tab 2]  [Tab 3]     │  40px
└────────────────────────────────┘
```

### Expanded (140px)
```
┌────────────────────────────────┐
│  Safe Area Top (44px iOS)      │
├────────────────────────────────┤
│  SUBTITLE (small, uppercase)   │
│                                 │  80px
│  Large Title                   │  (title area)
│                                 │
├────────────────────────────────┤
│  [Tab 1]  [Tab 2]  [Tab 3]     │  40px
└────────────────────────────────┘
│                                 │  20px padding
```

---

## Migration Checklist

- [x] CollapsibleHeader defaults updated (120/56)
- [x] Dashboard: 260/56 ✅
- [x] Moments: 140/96 ✅
- [x] Food Spots: 140/96 ✅
- [x] Letters: 140/96 ✅
- [x] Recipes: 140/96 ✅
- [x] Daily Questions: 140/96 ✅
- [x] Expenses: 140/112 ✅
- [x] Date Plans: 140/96 ✅
- [x] Achievements: 140/96 (with footer) or 120/56 (no footer) ✅
- [x] Notifications: 120/56 ✅ (uses defaults)
- [x] Profile: 230/56 ✅ (expanded content)
- [x] Detail screens: MomentDetail 280/56 ✅, RecipeDetail 280/56 ✅, LetterRead 130/96 ✅

---

**Last Updated:** 2026-03-11
**Default Values:** expandedHeight={120}, collapsedHeight={56}
