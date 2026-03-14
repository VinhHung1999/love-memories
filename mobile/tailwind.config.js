/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './App.tsx', './index.js'],
  presets: [require('nativewind/preset')],
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
      },
      fontFamily: {
        // Borel - cursive/handwritten, single weight (Regular 400)
        heading: ['Borel-Regular'],
        headingSemi: ['Borel-Regular'],
        body: ['Borel-Regular'],
        bodyMedium: ['Borel-Regular'],
        bodyLight: ['Borel-Regular'],
      },
    },
  },
  plugins: [],
};
