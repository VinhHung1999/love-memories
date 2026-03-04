/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './App.tsx', './index.js'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Brand ──────────────────────────────────────────────────────────
        primary:     '#E8788A',
        primaryLight: '#F4A8B4',
        secondary:   '#F4A261',
        accent:      '#7EC8B5',
        // ── Text ────────────────────────────────────────────────────────────
        textDark:    '#1A1624',
        textMid:     '#5C4E60',
        textLight:   '#A898AD',
        // ── UI ──────────────────────────────────────────────────────────────
        border:      '#E2DCE8',
        inputBg:     'rgba(255,255,255,0.88)',
        starRating:  '#F59E0B',
        // ── Status ──────────────────────────────────────────────────────────
        error:       '#D94F58',
        errorBg:     '#FFF0F0',
        success:     '#34A853',
        successBg:   '#F0FFF4',
      },
      fontFamily: {
        heading: ['PlayfairDisplay-Bold'],
        body: ['Inter-Regular'],
      },
    },
  },
  plugins: [],
};
