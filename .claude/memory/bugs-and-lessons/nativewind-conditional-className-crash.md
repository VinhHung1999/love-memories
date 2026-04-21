---
name: NativeWind v4 conditional className crashes at render
description: Any conditional styling in mobile-rework MUST go through `style` prop; never toggle classes (esp. interactive modifiers like `active:`) inside a className template literal.
type: feedback
---

# NativeWind v4 conditional className — use `style` prop, not ternary in className

**Rule:** Any value that flips at runtime (colors, shadows, visibility) goes on the `style` prop, resolved via `useAppColors()`. `className` stays a single STATIC string for layout/typography only.

**Why:** On Expo SDK 54 + NativeWind v4.2.2 + Expo Router 6, toggling classes inside a className template (especially an interactive modifier like `active:opacity-90`) between ternary branches causes re-renders to throw a MISLEADING error:

```
[Error: Couldn't find a navigation context. Have you wrapped your app with 'NavigationContainer'?]
```

The error wording names React Navigation, but the component tree has zero nav hooks. The stack bottoms out at `CssInterop.Pressable` → the NativeWind-wrapped leaf. Multiple red-herring debug paths wasted hours (checking for duplicate `@react-navigation/native`, nested NavigationContainer, version mismatches, lockfile conflicts from a stray `yarn install`, wrong `babel-preset-expo@55` on SDK 54 — all real or imagined issues but none of them this bug).

**Root cause:** NativeWind v4's `cssInterop` wrapper mounts/unmounts press-state subscriptions as interactive modifiers appear/disappear across ternary branches; the transient state reaches for React Navigation's `NavigationStateContext` default value whose getter-traps throw the misleading error.

**How to apply:**

**WRONG (crashes):**
```tsx
className={`w-full rounded-full py-4 px-5 ${
  isDisabled ? 'bg-surface' : `${FILL[variant]} shadow-hero active:opacity-90`
}`}
```

**RIGHT (Boss-approved pattern, Sprint 61 2026-04-21):**
```tsx
const c = useAppColors();
const containerStyle = isDisabled
  ? { backgroundColor: c.surface }
  : {
      backgroundColor: variant === 'ink' ? c.ink : c.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 28,
      elevation: 10,
    };

<Pressable
  className="w-full rounded-full py-4 px-5 active:opacity-90"
  style={containerStyle}
>
```

**Carve-out to Hard Rule #2** (`.claude/rules/mobile-rework.md`: "NativeWind only — ZERO style prop"): conditional styling is now an authorized carve-out alongside `Animated.Value`, `BlurView`, `@gorhom/bottom-sheet`. Resolve palette values via `useAppColors()`, never hard-code hex.

**Reference case:** `src/components/AuthBigBtn.tsx` — shipped the buggy pattern until Boss (2026-04-21) diagnosed it live after it crashed the Login flow on a fresh simulator build.

**Diagnostic shortcut:** When you see "Couldn't find a navigation context" with a stack pointing at a `CssInterop.*` component and no nav hooks in the tree, stop chasing React Navigation and immediately grep the component's className for interactive modifiers (`active:`, `focus:`, `hover:`, `disabled:`) that exist in only some ternary branches.
