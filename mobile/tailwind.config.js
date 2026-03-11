/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './App.tsx', './index.js'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // ── Brand (Gradient-First Design) ─────────────────────────────────
        // Coral Blush (Primary)
        primary:        '#FF6B6B',
        primaryLight:   '#FF8E8E',
        primaryLighter: '#FFB4B4',

        // Peachy Gold (Secondary)
        secondary:      '#FFD93D',
        secondaryMid:   '#FFC857',
        secondaryDark:  '#FFB84D',

        // Lavender Dream (Accent)
        accent:         '#C7CEEA',
        accentMid:      '#B4B8D5',
        accentDark:     '#A5A9C9',

        // Mint Fresh (Success/Food)
        success:        '#95E1D3',
        successMid:     '#A8E6CF',
        successLight:   '#BCE9D6',
        successBg:      'rgba(149,225,211,0.10)',

        // Violet Expense
        expensePurple:     '#B983FF',
        expensePurpleMid:  '#A068F5',
        expensePurpleDark: '#8B5CF6',

        // ── Text (warm purple-gray tones) ─────────────────────────────────
        textDark:    '#2D1B3D',
        textMid:     '#6B5570',
        textLight:   '#9D8EA1',

        // ── UI ─────────────────────────────────────────────────────────────
        border:      '#E8DFE8',
        inputBg:     'rgba(255,255,255,0.90)',
        starRating:  '#FFB84D',
        baseBg:      '#FFF9F5',

        // ── Status ─────────────────────────────────────────────────────────
        error:       '#D94F58',
        errorBg:     '#FFF0F0',
      },
      fontFamily: {
        // Be Vietnam Pro - designed for Vietnamese with excellent diacritics
        heading: ['BeVietnamPro-Bold'],
        headingSemi: ['BeVietnamPro-SemiBold'],
        body: ['BeVietnamPro-Regular'],
        bodyMedium: ['BeVietnamPro-Medium'],
        bodyLight: ['BeVietnamPro-Light'],
      },
      backgroundImage: {
        'gradient-coral': 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 50%, #FFB4B4 100%)',
        'gradient-peach': 'linear-gradient(135deg, #FFD93D 0%, #FFC857 50%, #FFB84D 100%)',
        'gradient-lavender': 'linear-gradient(135deg, #C7CEEA 0%, #B4B8D5 50%, #A5A9C9 100%)',
        'gradient-mint': 'linear-gradient(135deg, #95E1D3 0%, #A8E6CF 50%, #BCE9D6 100%)',
        'gradient-violet': 'linear-gradient(135deg, #B983FF 0%, #A068F5 50%, #8B5CF6 100%)',
        'gradient-dashboard': 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 50%, #FFD93D 100%)',
        'gradient-moments': 'linear-gradient(135deg, #FFB4B4 0%, #C7CEEA 50%, #B4B8D5 100%)',
        'gradient-food': 'linear-gradient(135deg, #FFD93D 0%, #FFC857 50%, #A8E6CF 100%)',
        'gradient-letters': 'linear-gradient(135deg, #C7CEEA 0%, #B4B8D5 50%, #FFB4B4 100%)',
        'gradient-stats': 'linear-gradient(135deg, #FFE4EA 0%, #FFD4DE 50%, #FFC4D0 100%)',
      },
    },
  },
  plugins: [],
};
