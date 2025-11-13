// tailwind.config.cjs
const { CORPORATE_COLORS } = require('./src/styles/corporate-colors.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        ...CORPORATE_COLORS,
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};