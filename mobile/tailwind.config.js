/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './App.tsx', './index.js'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E8788A',
        secondary: '#F4A261',
        accent: '#7EC8B5',
        border: '#E5E7EB',
        text: {
          DEFAULT: '#1F2937',
          light: '#6B7280',
        },
      },
      fontFamily: {
        heading: ['PlayfairDisplay-Bold'],
        body: ['Inter-Regular'],
      },
    },
  },
  plugins: [],
};
