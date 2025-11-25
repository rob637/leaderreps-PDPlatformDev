// tailwind.config.cjs

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        NAVY: '#002E47',
        TEAL: '#47A88D',
        ORANGE: '#E04E1B',
        LIGHT_GRAY: '#FCFCFA',
        SUBTLE_TEAL: '#349881',
        // Add kebab-case variants for Tailwind classes
        'corporate-navy': '#002E47',
        'corporate-orange': '#E04E1B',
        'corporate-teal': '#47A88D',
        'corporate-teal-dark': '#349881',
        'corporate-light-gray': '#FCFCFA',
        'corporate-subtle-teal': '#349881',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};