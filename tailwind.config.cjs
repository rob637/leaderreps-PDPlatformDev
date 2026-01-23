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
        
        // Rep AI Coach - Light color variants
        'rep-navy-light': '#E8EEF2',       // Rep message backgrounds
        'rep-teal-light': '#E5F5F0',       // Success, positive states  
        'rep-coral-light': '#FDE8E4',      // Attention, CTAs
        'rep-warm-white': '#FFFAF8',       // Conversation background
        'rep-text-primary': '#1A3A4A',     // Darker navy for readability
        'rep-text-secondary': '#5A7A8A',   // Muted for secondary text
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};