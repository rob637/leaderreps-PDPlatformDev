/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'corporate-navy': '#1e3a5f',
        'corporate-teal': '#0d9488',
        'corporate-gold': '#f59e0b',
        // LeaderReps Demo Colors
        navy: {
          50: '#e6eaed',
          100: '#b3c0c9',
          200: '#8096a5',
          300: '#4d6c81',
          400: '#26485c',
          500: '#002E47', // Primary Navy
          600: '#002840',
          700: '#001f32',
          800: '#001724',
          900: '#000e16',
        },
        teal: {
          50: '#eaf5f2',
          100: '#c5e5dc',
          200: '#a0d5c6',
          300: '#7bc5b0',
          400: '#5fb89f',
          500: '#47A88D', // Primary Teal
          600: '#3f977f',
          700: '#357d6a',
          800: '#2b6455',
          900: '#1d4a3e',
        },
        orange: {
          50: '#fceee9',
          100: '#f7cfc4',
          200: '#f2b09f',
          300: '#ec917a',
          400: '#e87a5f',
          500: '#E04E1B', // Primary Orange
          600: '#c94618',
          700: '#a63a14',
          800: '#832e10',
          900: '#60220c',
        },
      },
    },
  },
  plugins: [],
}
