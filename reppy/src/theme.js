/**
 * REPPY DESIGN SYSTEM - Centralized Theme Configuration
 * 
 * All colors and theme values should be referenced from this file.
 * This ensures consistency and makes theme changes easy.
 */

// Brand Colors
export const COLORS = {
  // Primary (Blue - action, links, interactive elements)
  primary: {
    DEFAULT: 'blue-600',
    hover: 'blue-700',
    light: 'blue-500',
    bg: 'blue-50',
    bgDark: 'blue-900/30',
  },
  
  // Success (Green - completed, success states)
  success: {
    DEFAULT: 'green-500',
    bg: 'green-100',
    text: 'green-700',
  },
  
  // Warning (Orange - streaks, attention)
  warning: {
    DEFAULT: 'orange-500',
    bg: 'orange-100',
    text: 'orange-700',
  },
  
  // Error (Red - errors, destructive)
  error: {
    DEFAULT: 'red-500',
    bg: 'red-100',
    text: 'red-700',
  },
};

/**
 * Get theme-aware classes based on isDark boolean
 * Usage: const theme = getThemeClasses(isDark);
 */
export const getThemeClasses = (isDark) => ({
  // Backgrounds
  bg: isDark ? 'bg-gray-900' : 'bg-white',
  bgSecondary: isDark ? 'bg-gray-800' : 'bg-gray-50',
  bgSurface: isDark ? 'bg-gray-800' : 'bg-white',
  
  // Text colors - WCAG AA compliant contrast ratios
  textPrimary: isDark ? 'text-white' : 'text-gray-900',
  textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
  textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
  textFaint: isDark ? 'text-gray-500' : 'text-gray-400',
  
  // Borders & Dividers - visible in both themes
  border: isDark ? 'border-gray-700' : 'border-gray-200',
  borderLight: isDark ? 'border-gray-700' : 'border-gray-200',
  divider: isDark ? 'bg-gray-700' : 'bg-gray-200',
  
  // Cards (glass-style)
  card: isDark ? 'bg-gray-800' : 'bg-gray-50',
  cardBg: isDark ? 'bg-gray-800' : 'bg-gray-100', // Alias for button backgrounds
  cardBorder: isDark ? 'border-gray-700' : 'border-gray-200',
  cardHover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
  
  // Interactive states
  hoverBg: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
  activeBg: isDark ? 'bg-gray-700' : 'bg-gray-100',
  
  // Selected states (blue highlight)
  selected: isDark ? 'bg-blue-600/30 border-blue-500' : 'bg-blue-50 border-blue-300',
  unselected: isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200',
  unselectedHover: isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200',
  
  // Theme button states
  themeButtonActive: 'ring-2 ring-white/30',
  themeButtonInactive: isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300',
  
  // Glass effects (for overlays, modals)
  glass: isDark ? 'bg-gray-800/90 backdrop-blur-sm' : 'bg-white/90 backdrop-blur-sm',
  glassCard: isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white/80 border-gray-200',
  
  // Form inputs - high contrast for accessibility
  input: isDark 
    ? 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-400' 
    : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500',
  inputFocus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20',
  
  // Toggle switch
  toggleOff: isDark ? 'bg-gray-600' : 'bg-gray-300',
});

/**
 * Primary button classes (always blue, regardless of theme)
 */
export const BUTTON_PRIMARY = 'bg-blue-600 hover:bg-blue-700 text-white';

/**
 * Secondary button classes (theme-aware)
 */
export const getButtonSecondary = (isDark) => 
  isDark 
    ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300';

/**
 * Badge/pill classes
 */
export const BADGES = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  neutral: (isDark) => isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600',
};

/**
 * Progress bar colors
 */
export const PROGRESS = {
  track: (isDark) => isDark ? 'bg-gray-700' : 'bg-gray-200',
  fill: 'bg-blue-600',
};

/**
 * SVG stroke colors for charts/rings (need hex for SVG)
 */
export const SVG_COLORS = {
  track: (isDark) => isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
  primary: '#2563eb', // blue-600
  success: '#22c55e', // green-500
  warning: '#f97316', // orange-500
};
