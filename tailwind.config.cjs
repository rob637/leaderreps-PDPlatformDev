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
        // Add kebab-case variants for Tailwind classes
        'corporate-navy': CORPORATE_COLORS.NAVY,
        'corporate-orange': CORPORATE_COLORS.ORANGE,
        'corporate-teal': CORPORATE_COLORS.TEAL,
        'corporate-teal-dark': CORPORATE_COLORS.SUBTLE_TEAL,
        'corporate-light-gray': CORPORATE_COLORS.LIGHT_GRAY,
        'corporate-subtle-teal': CORPORATE_COLORS.SUBTLE_TEAL,
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};