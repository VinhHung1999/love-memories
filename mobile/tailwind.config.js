/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './App.tsx', './index.js'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Brand (Gentle & Soothing — web-aligned) ───────────────────────────
        // Rose Primary
        primary:        '#E8788A',
        primaryLight:   '#F2A5B0',
        primaryLighter: '#FADADD',

        // Warm Secondary
        secondary:      '#F4A261',

        // Teal Accent
        accent:         '#7EC8B5',

        // ── Backgrounds ────────────────────────────────────────────────────────
        baseBg:         '#FFF8F6',
        bgCard:         '#FFFFFF',

        // ── Text ───────────────────────────────────────────────────────────────
        textDark:       '#2D2D2D',
        textMid:        '#6B7280',
        textLight:      '#9CA3AF',

        // ── UI ─────────────────────────────────────────────────────────────────
        border:         '#F0E6E3',
        borderSoft:     '#F0E6E3',
        inputBg:        'rgba(255,255,255,0.90)',
        starRating:     '#F4A261',

        // ── Status ─────────────────────────────────────────────────────────────
        success:        '#7EC8B5',
        successBg:      'rgba(126,200,181,0.10)',
        error:          '#D94F58',
        errorBg:        '#FFF0F0',

        // ── Dark mode palette (matches DarkAppTheme in theme.ts) ───────────────
        // Use these as dark: variants: e.g. dark:bg-darkBgCard
        darkBaseBg:   '#121212',
        darkBgCard:   '#1E1E1E',
        darkBorder:   '#2C2C2C',
        darkTextDark: '#E5E5E5',
        darkTextMid:  '#B0B0B0',
        darkTextLight:'#808080',
        darkInputBg:  'rgba(30,30,30,0.90)',
      },
      fontFamily: {
        // Be Vietnam Pro - designed for Vietnamese with excellent diacritics
        heading: ['BeVietnamPro-Bold'],
        headingSemi: ['BeVietnamPro-SemiBold'],
        body: ['BeVietnamPro-Regular'],
        bodyMedium: ['BeVietnamPro-Medium'],
        bodyLight: ['BeVietnamPro-Light'],
        // Borel - cursive/handwritten accent font (slogans only)
        cursive: ['Borel-Regular'],
      },
    },
  },
  plugins: [],
};
