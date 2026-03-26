// tailwind.config.cjs

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Primary brand font - Nunito Sans (loaded in index.html)
        sans: ['"Nunito Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        // Heading weight variant (same font, just for semantic clarity)
        heading: ['"Nunito Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // OFFICIAL Corporate Brand Colors
        NAVY: '#002E47',
        TEAL: '#47A88D',           // Original brand teal
        ORANGE: '#E04E1B',         // Original brand orange
        LIGHT_GRAY: '#E5E7EB',     // Darker for card contrast (pop technique)
        SUBTLE_TEAL: '#349881',
        
        // Kebab-case variants for Tailwind classes
        'corporate-navy': '#002E47',
        'corporate-orange': '#E04E1B',
        'corporate-teal': '#47A88D',
        'corporate-teal-dark': '#349881',
        'corporate-light-gray': '#E5E7EB',
        'corporate-subtle-teal': '#349881',
        
        // Brand aliases (for CRM compatibility)
        'brand': {
          navy: '#002E47',
          teal: '#47A88D',
          orange: '#E04E1B',
        },
        
        // State colors (using brand-compatible vibrant versions)
        'success': '#16A34A',      // Vibrant green (universal)
        'warning': '#F59E0B',      // Amber (universal)
        'error': '#DC2626',        // Red (universal)
        'info': '#0EA5E9',         // Sky blue (universal)
        
        // Rep AI Coach - Light color variants
        'rep-navy-light': '#E8EEF2',
        'rep-teal-light': '#E0F2EF',       // Tinted with brand teal
        'rep-coral-light': '#FDE8E4',      // Tinted with brand orange
        'rep-warm-white': '#FAFAFA',
        'rep-text-primary': '#0F172A',     // Near black
        'rep-text-secondary': '#475569',   // Slate 600
      },
      boxShadow: {
        // Google-style shadows with subtle border ring (pop technique)
        'card': '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 0 0 1px rgb(0 0 0 / 0.05)',
        'card-hover': '0 4px 12px rgb(0 0 0 / 0.15), 0 0 0 1px rgb(0 0 0 / 0.05)',
        'elevated': '0 10px 40px rgb(0 0 0 / 0.12), 0 0 0 1px rgb(0 0 0 / 0.05)',
        'pop': '0 4px 16px rgb(0 0 0 / 0.16), 0 0 0 1px rgb(0 0 0 / 0.08)',
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { boxShadow: '0 4px 16px rgba(71, 168, 141, 0.3)' },
          '50%': { boxShadow: '0 4px 24px rgba(71, 168, 141, 0.5)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};