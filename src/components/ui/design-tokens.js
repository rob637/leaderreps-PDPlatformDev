// src/components/ui/design-tokens.js
// ============================================================
// DESIGN TOKENS - Single Source of Truth for UI Consistency
// ============================================================
// Import this file when you need to reference design values programmatically
// For Tailwind classes, use the token names directly (e.g., text-corporate-navy)

/**
 * COLOR PALETTE
 * Use Tailwind classes: text-{color}, bg-{color}, border-{color}
 */
export const colors = {
  // Primary Brand Colors
  navy: '#002E47',           // corporate-navy - Primary text, headers
  teal: '#47A88D',           // corporate-teal - Primary accent, buttons, links
  orange: '#E04E1B',         // corporate-orange - Secondary accent, warnings, highlights
  
  // Supporting Colors
  tealDark: '#349881',       // corporate-teal-dark - Hover states
  lightGray: '#FCFCFA',      // corporate-light-gray - Backgrounds
  
  // Semantic Colors (use Tailwind's built-in)
  // success: green-600
  // warning: amber-600
  // error: red-600
  // info: blue-600
};

/**
 * TYPOGRAPHY SCALE
 * Use Tailwind classes: text-{size}
 */
export const typography = {
  // Page Title (h1)
  pageTitle: 'text-2xl md:text-3xl font-bold text-corporate-navy',
  
  // Section Title (h2)
  sectionTitle: 'text-xl font-bold text-corporate-navy',
  
  // Card Title (h3)
  cardTitle: 'text-lg font-semibold text-corporate-navy',
  
  // Subtitle / Description
  subtitle: 'text-sm text-slate-600',
  
  // Body Text
  body: 'text-sm text-slate-700',
  
  // Small / Caption
  caption: 'text-xs text-slate-500',
  
  // Label
  label: 'text-sm font-medium text-slate-700',
};

/**
 * SPACING SCALE
 * Consistent spacing for padding and margins
 */
export const spacing = {
  // Page padding
  pagePadding: 'p-4 sm:p-6 lg:p-8',
  
  // Section gap
  sectionGap: 'gap-6 lg:gap-8',
  
  // Card padding
  cardPadding: 'p-4 sm:p-5',
  
  // Widget padding
  widgetPadding: 'p-4',
  
  // Form field spacing
  fieldGap: 'space-y-4',
  
  // Button group spacing
  buttonGap: 'gap-3',
};

/**
 * BORDER RADIUS
 * Consistent rounded corners
 */
export const radius = {
  // Cards, Modals, Large containers
  card: 'rounded-2xl',
  
  // Buttons, Inputs, Badges
  button: 'rounded-xl',
  
  // Small elements, Tags, Chips
  small: 'rounded-lg',
  
  // Circular (avatars, icons)
  full: 'rounded-full',
};

/**
 * SHADOWS
 * Consistent elevation
 */
export const shadows = {
  // Cards
  card: 'shadow-sm',
  
  // Elevated cards on hover
  cardHover: 'shadow-md',
  
  // Modals, Dropdowns
  modal: 'shadow-xl',
  
  // Buttons with depth
  button: 'shadow-sm hover:shadow-md',
};

/**
 * ICON SIZES
 * Consistent icon sizing
 */
export const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  xxl: 'w-10 h-10',
};

/**
 * ACCENT COLORS BY TIER/CATEGORY
 * Use for consistent category coloring
 */
export const accentColors = {
  // Leadership Tiers
  tier1: 'corporate-teal',     // Self-Awareness
  tier2: 'corporate-navy',     // Communication
  tier3: 'corporate-orange',   // Strategic
  tier4: 'corporate-teal',     // People Dev
  
  // Content Types
  video: 'blue-600',
  reading: 'amber-600',
  course: 'corporate-orange',
  assessment: 'corporate-teal',
  
  // Status
  active: 'corporate-teal',
  pending: 'amber-500',
  complete: 'green-600',
  error: 'red-600',
};

/**
 * STANDARD COMPONENT PATTERNS
 * Copy these patterns for consistency
 */
export const patterns = {
  // Page container
  pageContainer: 'min-h-screen bg-slate-50',
  
  // Content max-width
  contentWidth: 'max-w-7xl mx-auto',
  
  // Card base
  card: 'bg-white rounded-2xl border border-slate-200 shadow-sm',
  
  // Button base
  buttonPrimary: 'bg-corporate-teal text-white hover:bg-corporate-teal-dark',
  buttonSecondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  buttonOutline: 'border-2 border-corporate-teal text-corporate-teal hover:bg-teal-50',
  
  // Input base
  input: 'w-full rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-corporate-teal',
  
  // Icon button in card header
  iconButton: 'w-10 h-10 rounded-xl flex items-center justify-center',
  
  // Badge
  badge: 'px-2 py-1 rounded-full text-xs font-semibold',
};

/**
 * ANIMATION DURATIONS
 */
export const animation = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
};

/**
 * Z-INDEX SCALE
 */
export const zIndex = {
  dropdown: 'z-10',
  sticky: 'z-20',
  fixed: 'z-30',
  modal: 'z-50',
  tooltip: 'z-60',
};

// Export all tokens as default
export default {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  iconSizes,
  accentColors,
  patterns,
  animation,
  zIndex,
};
