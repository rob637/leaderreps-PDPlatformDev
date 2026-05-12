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
        // Accessibility-tuned text variants of brand teal (WCAG AA on white).
        // Use these for TEXT/LINKS on light surfaces. The plain
        // `corporate-teal` should be reserved for fills, icons, indicators,
        // and large/decorative surfaces where contrast is not required.
        'corporate-teal-ink':  '#1F7864', // ~5.5:1 on white — body text & links
        'corporate-teal-soft': '#7FCBB3', // text/links on dark surfaces
        'corporate-orange-ink': '#B83E15', // ~4.7:1 on white — text variant of brand orange
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
        // === UI v2 — soft, layered, modern ===
        'glass': '0 8px 32px -12px rgba(0, 46, 71, 0.18), 0 2px 8px -4px rgba(0, 46, 71, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
        'glass-hover': '0 20px 50px -12px rgba(0, 46, 71, 0.28), 0 6px 16px -6px rgba(0, 46, 71, 0.14), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
        'glass-sm': '0 4px 16px -6px rgba(0, 46, 71, 0.12), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
        'glow-teal': '0 0 0 1px rgba(71, 168, 141, 0.3), 0 8px 32px -8px rgba(71, 168, 141, 0.45)',
        'glow-orange': '0 0 0 1px rgba(224, 78, 27, 0.3), 0 8px 32px -8px rgba(224, 78, 27, 0.45)',
        'glow-navy': '0 0 0 1px rgba(0, 46, 71, 0.25), 0 12px 40px -8px rgba(0, 46, 71, 0.4)',
      },
      backgroundImage: {
        // === UI v2 — mesh & aurora gradients (brand-color-locked) ===
        'mesh-hero': 'radial-gradient(at 20% 0%, rgba(71, 168, 141, 0.28) 0px, transparent 55%), radial-gradient(at 80% 0%, rgba(224, 78, 27, 0.22) 0px, transparent 55%), radial-gradient(at 50% 100%, rgba(0, 46, 71, 0.18) 0px, transparent 60%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        'mesh-coaching': 'radial-gradient(at 0% 0%, rgba(71, 168, 141, 0.25) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0, 46, 71, 0.18) 0px, transparent 55%), linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)',
        'mesh-arena': 'radial-gradient(at 100% 0%, rgba(224, 78, 27, 0.28) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(0, 46, 71, 0.22) 0px, transparent 55%), linear-gradient(135deg, #FFFFFF 0%, #FEF7F4 100%)',
        'aurora-navy': 'linear-gradient(135deg, #002E47 0%, #003E5F 50%, #1F7864 100%)',
        'aurora-teal': 'linear-gradient(135deg, #1F7864 0%, #47A88D 50%, #7FCBB3 100%)',
        'aurora-orange': 'linear-gradient(135deg, #B83E15 0%, #E04E1B 50%, #F08260 100%)',
        'shine': 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        // === UI v2 motion ===
        'shimmer': 'shimmer 2.4s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'aurora': 'aurora 14s ease infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'sheen': 'sheen 2.6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { boxShadow: '0 4px 16px rgba(71, 168, 141, 0.3)' },
          '50%': { boxShadow: '0 4px 24px rgba(71, 168, 141, 0.5)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%) skewX(-12deg)' },
          '60%, 100%': { transform: 'translateX(220%) skewX(-12deg)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    // === UI v2 variant ===
    // Lets us write `ui-v2:bg-white/70 ui-v2:backdrop-blur-xl ui-v2:hover:-translate-y-0.5`.
    // Active when <html> has the `ui-v2` class (managed by UIVersionProvider).
    function ({ addVariant }) {
      addVariant('ui-v2', ':where(.ui-v2) &');
      addVariant('ui-v1', ':where(:not(.ui-v2)) &');
    },
  ],
};