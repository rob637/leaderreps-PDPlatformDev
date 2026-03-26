/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#002E47',
        teal: '#47A88D',
        orange: '#E04E1B',
        'navy-light': '#003d5c',
        'teal-light': '#5cb89e',
        'teal-dark': '#3a8a73',
        'orange-light': '#f56b3d',
        'orange-dark': '#c43d12',
      },
      fontFamily: {
        sans: ['Nunito Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-orange': 'glowOrange 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(71, 168, 141, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(71, 168, 141, 0.6)' },
        },
        glowOrange: {
          '0%': { boxShadow: '0 0 20px rgba(224, 78, 27, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(224, 78, 27, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
