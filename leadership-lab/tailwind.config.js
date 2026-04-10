/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Leadership Lab brand colors
        lab: {
          navy: '#0F172A',
          'navy-light': '#1E293B',
          slate: '#334155',
          teal: '#0D9488',
          'teal-light': '#CCFBF1',
          'teal-dark': '#0F766E',
          amber: '#F59E0B',
          'amber-light': '#FEF3C7',
          coral: '#EF4444',
          cream: '#FAFAF9',
          warm: '#F5F5F4',
        },
        // Phase colors
        phase: {
          foundation: '#0D9488',
          ascent: '#6366F1',
        },
        // Status colors
        status: {
          'on-track': '#22C55E',
          growing: '#F59E0B',
          stuck: '#F97316',
          quiet: '#EF4444',
          breakthrough: '#8B5CF6',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
        elevated: '0 10px 25px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
