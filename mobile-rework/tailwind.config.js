/** @type {import('tailwindcss').Config} */
// Font family values MUST match keys passed to `useFonts()` in src/theme/fonts.ts.
// Color tokens map to CSS variables that ThemeProvider sets via `vars()` at the
// provider root — see src/theme/cssVars.ts. Components consume via className:
// `bg-bg`, `text-ink`, `bg-primary`, etc. No hardcoded hex outside tokens.ts.
const themed = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: themed('--color-bg'),
        'bg-elev': themed('--color-bg-elev'),
        surface: themed('--color-surface'),
        'surface-alt': themed('--color-surface-alt'),
        ink: themed('--color-ink'),
        'ink-soft': themed('--color-ink-soft'),
        'ink-mute': themed('--color-ink-mute'),
        primary: themed('--color-primary'),
        'primary-deep': themed('--color-primary-deep'),
        'primary-soft': themed('--color-primary-soft'),
        secondary: themed('--color-secondary'),
        'secondary-soft': themed('--color-secondary-soft'),
        accent: themed('--color-accent'),
        'accent-soft': themed('--color-accent-soft'),
        'hero-a': themed('--color-hero-a'),
        'hero-b': themed('--color-hero-b'),
        'hero-c': themed('--color-hero-c'),
        line: themed('--color-line'),
        'line-soft': themed('--color-line-soft'),
        'line-on-surface': themed('--color-line-on-surface'),
        'line-soft-on-surface': themed('--color-line-soft-on-surface'),
      },
      fontFamily: {
        body: ['BeVietnamPro_400Regular'],
        bodyMedium: ['BeVietnamPro_500Medium'],
        bodySemibold: ['BeVietnamPro_600SemiBold'],
        bodyBold: ['BeVietnamPro_700Bold'],
        display: ['Fraunces_400Regular'],
        displayItalic: ['Fraunces_400Regular_Italic'],
        displayMedium: ['Fraunces_500Medium'],
        displayMediumItalic: ['Fraunces_500Medium_Italic'],
        displayBold: ['Fraunces_700Bold'],
        displayBoldItalic: ['Fraunces_700Bold_Italic'],
        script: ['DancingScript_400Regular'],
        scriptBold: ['DancingScript_700Bold'],
      },
      // T296: ported 1:1 from prototype boxShadow values (pairing.jsx:90,
      // 136, 138). Tailwind defaults `shadow-sm` / `shadow-lg` translate to
      // tight high-opacity native iOS shadows that read as dark stamped
      // patches. These tokens preserve the soft CSS feel on iOS + give
      // android `elevation` an approximation NativeWind can pick up.
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.03)',
        elevated: '0 20px 50px rgba(0,0,0,0.1)',
        hero: '0 12px 28px rgba(0,0,0,0.18)',
        chip: '0 1px 3px rgba(0,0,0,0.05)',
        pill: '0 12px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};
