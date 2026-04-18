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
    },
  },
  plugins: [],
};
