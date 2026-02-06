/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Reppy brand colors (from LeaderReps corporate)
        'reppy': {
          teal: '#47A88D',
          'teal-light': '#E5F5F0',
          navy: '#002E47',
          'navy-light': '#E8EEF2',
          orange: '#E04E1B',
          coral: '#FFE8E0',
          cream: '#FFFAF8',
          warm: '#F5F0EB',
        },
        // Phase colors
        'phase': {
          foundation: '#47A88D',
          growth: '#3B82F6',
          mastery: '#8B5CF6',
          daily: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
