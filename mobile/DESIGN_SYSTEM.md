# Love Memories Design System
## "Joyful Intimacy" - A Youthful, Warm & Playful Aesthetic

---

## 🎨 Design Philosophy

**Core Concept:** A digital photo album meets a cozy coffee shop journal. Think of polaroid photos scattered on a warm table, handwritten notes with doodles, soft morning light, and the energy of young love.

**Visual Keywords:**
- Sunset gradients (golden hour romance)
- Polaroid warmth (nostalgic but modern)
- Soft textures (noise, grain, gentle shadows)
- Bouncy animations (spring, float, confetti)
- Organic shapes (rounded corners, blob backgrounds)

**Brand Archetype:** The Companion - a trusted friend celebrating everyday moments.

---

## 🌈 Color Palette

### Philosophy
Move away from flat single colors to **gradient-first design**. Every major UI element uses subtle-to-bold gradients that create depth, warmth, and visual interest.

### Primary Colors

#### Coral Blush (Primary)
```
Gradient: #FF6B6B → #FF8E8E → #FFB4B4
Use for: Headers, primary buttons, active states, hearts
Mood: Energetic love, warmth, passion
```

#### Peachy Gold (Secondary)
```
Gradient: #FFD93D → #FFC857 → #FFB84D
Use for: Food features, date planner, secondary actions
Mood: Joyful, appetizing, sunny
```

#### Lavender Dream (Accent)
```
Gradient: #C7CEEA → #B4B8D5 → #A5A9C9
Use for: Letters, memories, quiet moments
Mood: Intimate, nostalgic, gentle
```

#### Mint Fresh (Success/Food)
```
Gradient: #95E1D3 → #A8E6CF → #BCE9D6
Use for: Achievements, food highlights, positive feedback
Mood: Fresh, growth, celebration
```

#### Violet Expense (Accent 2)
```
Gradient: #B983FF → #A068F5 → #8B5CF6
Use for: Expenses, financial tracking
Mood: Luxurious, important, focused
```

### Text Colors

```
Dark:  #2D1B3D  (warm deep purple-brown, not pure black)
Mid:   #6B5570  (muted purple-gray for secondary text)
Light: #9D8EA1  (lighter gray for subtle text)
```

**Why purple-toned grays?** Creates warmth and cohesion with the gradient palette. Pure grays feel clinical.

### Background Colors

```
Base:   #FFF9F5  (warm off-white with peachy undertone)
Card:   #FFFFFF  (pure white for contrast)
Overlay: rgba(255,255,255,0.95)  (modals, sheets)
```

---

## ✨ Gradient System

### Section-Specific Gradients

**Dashboard Header:**
```css
colors={['#FF6B6B', '#FF8E8E', '#FFD93D']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
/* Coral → Peach diagonal - energetic sunrise */
```

**Moments Timeline:**
```css
colors={['#FFB4B4', '#C7CEEA', '#B4B8D5']}
/* Rose → Lavender - nostalgic memories */
```

**Food Spots:**
```css
colors={['#FFD93D', '#FFC857', '#A8E6CF']}
/* Peach → Mint - fresh appetizing */
```

**Love Letters:**
```css
colors={['#C7CEEA', '#B4B8D5', '#FFB4B4']}
/* Lavender → Rose - intimate warmth */
```

**Expenses:**
```css
colors={['#B983FF', '#A068F5', '#8B5CF6']}
/* Violet spectrum - focused financial */
```

**Stats Cards:**
```css
colors={['#FFE4EA', '#FFD4DE', '#FFC4D0']}
/* Soft pink gradient - gentle, informative */
```

### Gradient Techniques

1. **Diagonal (default):** `start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}`
2. **Vertical:** `start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}`
3. **Horizontal:** `start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}`
4. **Radial effect:** Use overlapping gradients with opacity

---

## 🔤 Typography

### Font Pairing

**Display/Headings:**
```
Font: DM Sans Bold (or Plus Jakarta Sans Bold)
Characteristics: Rounded, friendly, modern, geometric
Use: Screen titles, large numbers, section headers
Sizes: 28px (large title) → 18px (collapsed) → 14-16px (section headers)
```

**Body Text:**
```
Font: System Default (SF Pro iOS / Roboto Android)
Characteristics: Clean, readable, familiar
Use: Paragraphs, descriptions, labels
Sizes: 14px (body) / 12px (small) / 11px (tiny labels)
```

**Special Emphasis:**
```
Font: DM Sans Medium
Use: Button labels, stat labels, badges
```

### Text Styles

```tsx
// Large Title (Dashboard header)
className="text-[28px] font-bold text-textDark tracking-tight"

// Section Header
className="text-[15px] font-bold text-textDark tracking-wide uppercase"

// Body
className="text-[14px] text-textMid leading-relaxed"

// Small Label
className="text-[11px] font-semibold text-textMid tracking-[1px] uppercase"

// Tiny Label
className="text-[9px] font-bold text-textMid tracking-[1.5px] uppercase"

// Numbers (stats)
className="text-[26px] font-bold text-textDark leading-none"
```

---

## 🎭 Visual Motifs

### 1. Floating Hearts
- Small (12-16px) heart icons
- Semi-transparent (opacity: 0.1-0.3)
- Subtle vertical float animation (translateY: -10px over 3s)
- Scattered in header backgrounds

### 2. Soft Blob Shapes
- Organic SVG shapes as background accents
- Filled with gradients
- Positioned absolutely, low z-index
- Adds depth without clutter

### 3. Noise Texture Overlay
- 2-3% opacity grain texture
- Applied to gradient cards for tactile feel
- Creates "printed" quality (like photo paper)

### 4. Polaroid Frames
- Photo moments displayed in white-bordered frames
- Slight rotation (-2° to 2°)
- Soft shadow for depth
- Stack/scatter effect in collections

### 5. Badge Stickers
- Achievement badges with gradient backgrounds
- Soft glow/shadow for "sticker on paper" effect
- Icon + short label
- Spring animation on press

### 6. Confetti Bursts
- Celebration moments (achievements, milestones)
- Multi-colored particles (from gradient palette)
- Quick burst animation (0.5s)

### 7. Dotted Connectors
- Timeline elements connected by soft dotted lines
- Uses accent color at 30% opacity
- Adds flow and connection

---

## 📦 Component Styles

### Cards

**Base Card (White):**
```tsx
className="bg-white rounded-3xl"
// Shadow: soft, large blur (8px offset, 20px blur)
// Padding: px-4 py-3 (16px / 12px)
// Border radius: 24px
```

**Gradient Card:**
```tsx
<GradientCard
  colors={['#FF6B6B', '#FF8E8E', '#FFB4B4']}
  className="px-4 py-3"
  pressableClassName="shadow-md shadow-primary/30"
>
  {/* Add noise texture overlay for tactile feel */}
</GradientCard>
```

**Large Card:**
```tsx
className="bg-white rounded-[32px] shadow-lg p-5"
// Larger radius (32px), more padding
```

### Buttons

**Primary Button:**
```tsx
<LinearGradient colors={['#FF6B6B', '#FF8E8E']} className="rounded-2xl">
  <Pressable className="px-6 py-3 items-center">
    <Text className="text-white font-bold text-[15px]">Label</Text>
  </Pressable>
</LinearGradient>
// Spring scale animation: 0.95 on press
```

**Secondary Button:**
```tsx
<Pressable className="bg-white border-2 border-primary rounded-2xl px-6 py-3">
  <Text className="text-primary font-bold text-[15px]">Label</Text>
</Pressable>
```

**Icon Button:**
```tsx
<Pressable className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center">
  <Icon name="heart" size={20} color="#FF6B6B" />
</Pressable>
```

### Badges

**Tag Badge:**
```tsx
<View className="flex-row items-center gap-1.5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-full px-3 py-1.5">
  <Icon name="tag" size={12} color="#FF6B6B" />
  <Text className="text-[11px] font-semibold text-primary">Label</Text>
</View>
```

**Status Badge:**
```tsx
<View className="bg-success/10 rounded-full px-2.5 py-1">
  <Text className="text-[9px] font-bold text-success tracking-wider uppercase">Done</Text>
</View>
```

### Input Fields

```tsx
<View className="bg-white rounded-2xl border-2 border-border px-4 py-3">
  <TextInput
    className="text-[14px] text-textDark"
    placeholderTextColor="#9D8EA1"
    // Focus: border-primary
  />
</View>
```

### Headers

**Collapsible Header (Dashboard):**
```tsx
<CollapsibleHeader
  renderBackground={() => (
    <LinearGradient
      colors={['#FF6B6B', '#FF8E8E', '#FFD93D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  )}
  // Large title (28px) → Small title (18px)
  // Soft bottom curve: border-radius on bottom-left & bottom-right
/>
```

---

## 🎬 Animation Philosophy

### Principles
1. **Purposeful, not decorative** - every animation serves the UX
2. **Bouncy, not linear** - spring physics for playful feel
3. **Staggered reveals** - components enter with slight delays (100-200ms)
4. **Micro-interactions matter** - buttons, badges, hearts all respond to touch

### Animation Types

**Page Load:**
```tsx
import { FadeInDown } from 'react-native-reanimated';

<Animated.View entering={FadeInDown.delay(100).duration(500)}>
  {/* Content */}
</Animated.View>

// Stagger delays: 100ms, 200ms, 300ms for sequential elements
```

**Button Press:**
```tsx
// Spring scale animation (already implemented in SpringPressable)
// Scale: 1.0 → 0.95 → 1.0
```

**Floating Hearts:**
```tsx
// Continuous subtle animation
// translateY: 0 → -10px over 3s, repeat
// opacity: 0.3 → 0.1 → 0.3
```

**Confetti Burst:**
```tsx
// On achievement unlock
// Particles start from center, spread radially
// Duration: 500ms with ease-out
```

**Number Count-Up:**
```tsx
// Stats numbers animate from 0 → value
// Duration: 800ms with ease-out
// Already implemented in useCountUp hook
```

---

## 📐 Spacing & Layout

### Base Unit: 4px

```
Micro:   4px   (gap-1)
Small:   8px   (gap-2)
Default: 12px  (gap-3)
Medium:  16px  (gap-4, px-4, py-4)
Large:   20px  (gap-5, px-5, py-5)
XL:      24px  (gap-6)
2XL:     32px  (gap-8)
```

### Card Spacing

```
Between cards: gap-3 (12px)
Card padding: px-4 py-3 (16px / 12px)
Large card padding: px-5 py-4 (20px / 16px)
Screen edges: px-4 (16px)
Section vertical spacing: gap-4 (16px)
```

### Layout Philosophy

**Compact but breathable:**
- Not cramped (sufficient padding/margins)
- Not wasteful (efficient use of screen space)
- Consistent rhythm (predictable spacing)

**Asymmetry & Overlap:**
- Polaroid frames slightly rotated
- Stats overlapping with slight offset
- Cards breaking out of grid occasionally

---

## 🎯 Section-Specific Guidelines

### Dashboard
- **Header:** Coral → Peach diagonal gradient
- **Stats Card:** Soft pink gradient, rounded-3xl, compact layout
- **Quick Actions:** 2x4 grid, icon + label, white cards
- **Daily Question:** Compact gradient card, hide when both answered

### Moments Timeline
- **Background:** Rose → Lavender gradient header
- **Cards:** Polaroid frame style with white border
- **Photos:** Rounded-2xl, slight shadow
- **Tags:** Gradient badge pills

### Food Spots
- **Map pins:** Custom gradient markers
- **List cards:** Peach → Mint gradient accent
- **Rating:** Star icons with peachy glow

### Love Letters
- **Header:** Lavender → Rose gradient
- **Letter card:** White with soft shadow, envelope icon
- **Compose:** Bottom sheet with gradient accent

### Expenses
- **Charts:** Violet gradient bars
- **Categories:** Gradient badge pills
- **Total:** Large bold number with gradient underline

### Achievements
- **Badges:** Sticker-style with gradient backgrounds
- **Unlock:** Confetti burst animation
- **Grid:** Masonry layout with varying sizes

---

## 🚀 Implementation Checklist

### Phase 1: Foundation
- [x] Update `theme.ts` with new color tokens
- [x] Update `tailwind.config.js` with new colors
- [ ] Add noise texture asset
- [ ] Test gradient combinations

### Phase 2: Core Components
- [ ] Update `BaseCard` with new shadow
- [ ] Update `GradientCard` with noise overlay option
- [ ] Update `Button` with gradient variants
- [ ] Update `CollapsibleHeader` with new gradients

### Phase 3: Screens
- [ ] Redesign `DashboardScreen`
- [ ] Redesign `MomentsScreen`
- [ ] Redesign `FoodSpotsScreen`
- [ ] Redesign `LettersScreen`
- [ ] Redesign `ExpensesScreen`

### Phase 4: Polish
- [ ] Add floating hearts animation
- [ ] Add confetti burst for achievements
- [ ] Add noise texture to gradient cards
- [ ] Test on both iOS and Android
- [ ] Performance optimization

---

## 📝 Usage Examples

### Gradient Header
```tsx
<CollapsibleHeader
  renderBackground={() => (
    <LinearGradient
      colors={['#FF6B6B', '#FF8E8E', '#FFD93D']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="absolute inset-0"
    />
  )}
  dark // white text for dark gradient
/>
```

### Gradient Card with Noise
```tsx
<GradientCard
  colors={['#FFE4EA', '#FFD4DE', '#FFC4D0']}
  className="px-4 py-3"
  pressableClassName="shadow-md"
>
  {/* Optional: Add noise overlay */}
  <View className="absolute inset-0 opacity-[0.03]">
    <Image source={require('./assets/noise.png')} className="w-full h-full" />
  </View>
  {/* Content */}
</GradientCard>
```

### Staggered Animation
```tsx
<Animated.View entering={FadeInDown.delay(100).duration(500)}>
  <StatsCard />
</Animated.View>
<Animated.View entering={FadeInDown.delay(200).duration(500)}>
  <QuickActions />
</Animated.View>
<Animated.View entering={FadeInDown.delay(300).duration(500)}>
  <FoodHighlights />
</Animated.View>
```

---

## 🎨 Color Reference (Quick Copy)

```typescript
// Gradients
coral:     ['#FF6B6B', '#FF8E8E', '#FFB4B4']
peach:     ['#FFD93D', '#FFC857', '#FFB84D']
lavender:  ['#C7CEEA', '#B4B8D5', '#A5A9C9']
mint:      ['#95E1D3', '#A8E6CF', '#BCE9D6']
violet:    ['#B983FF', '#A068F5', '#8B5CF6']
softPink:  ['#FFE4EA', '#FFD4DE', '#FFC4D0']

// Text
textDark:  '#2D1B3D'
textMid:   '#6B5570'
textLight: '#9D8EA1'

// Background
baseBg:    '#FFF9F5'
cardBg:    '#FFFFFF'
```

---

**Design System Version:** 2.0 - "Joyful Intimacy"
**Last Updated:** 2026-03-11
**Maintained by:** Love Memories Design Team
