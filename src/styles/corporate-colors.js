// src/styles/corporate-colors.js
// LEADERREPS CORPORATE COLOR SCHEME - UPDATED FOR SLEEK UI 11/14/25
// Based on leaderreps.com brand guidelines + Modern UI Standards

/**
 * Official LeaderReps Corporate Colors
 * These colors must be used consistently throughout the application
 * to maintain brand consistency with leaderreps.com
 */
export const CORPORATE_COLORS = {
  // === PRIMARY BRAND COLORS ===
  NAVY: '#002E47',        // Primary text, headers, navigation
  ORANGE: '#E04E1B',      // Call-to-action buttons, highlights, alerts
  LIGHT_GRAY: '#FCFCFA',  // Page backgrounds, subtle surfaces
  TEAL: '#47A88D',        // Secondary buttons, success states, accents
  SUBTLE_TEAL: '#349881', // Hover states for teal elements

  // === NEUTRALS (Added for sleek UI) ===
  WHITE: '#FFFFFF',
  SLATE_50: '#F8FAFC',
  SLATE_100: '#F1F5F9',
  SLATE_200: '#E2E8F0',
  SLATE_300: '#CBD5E1',
  SLATE_400: '#94A3B8',
  SLATE_500: '#64748B',
  SLATE_600: '#475569',
  SLATE_700: '#334155',
  SLATE_800: '#1E293B',
  SLATE_900: '#0F172A',

  // === SEMANTIC COLORS ===
  // Text Colors
  PRIMARY_TEXT: '#002E47',    // Navy for primary text
  SECONDARY_TEXT: '#334155',  // Slate-700 for secondary text  
  MUTED_TEXT: '#64748B',      // Slate-500 for muted text
  
  // Background Colors
  PAGE_BG: '#F8FAFC',        // Slate-50 for main page background (cleaner)
  CARD_BG: '#FFFFFF',        // White for cards
  SUBTLE_BG: '#F1F5F9',      // Slate-100 for subtle sections
  
  // Interactive Elements
  PRIMARY_BUTTON: '#47A88D',     // Teal primary buttons
  PRIMARY_BUTTON_HOVER: '#349881', // Subtle teal hover
  SECONDARY_BUTTON: '#E04E1B',    // Orange secondary buttons  
  SECONDARY_BUTTON_HOVER: '#C33E12', // Darker orange hover
  
  // Status Colors
  SUCCESS: '#47A88D',        // Use brand teal for success
  WARNING: '#E04E1B',        // Use brand orange for warnings
  ERROR: '#EF4444',          // Standard Red for errors (Orange can be confusing)
  INFO: '#002E47',           // Use brand navy for info
  
  // Border & Divider Colors
  BORDER: '#E2E8F0',         // Slate-200 for borders (Sleek)
  SUBTLE_BORDER: '#F1F5F9',  // Slate-100 for subtle borders
  ACCENT_BORDER: '#47A88D',  // Branded accent borders
  
  // Focus & Selection States
  FOCUS_RING: '#47A88D',     // Use teal for focus indicators
  SELECTION: '#47A88D20',    // Teal with 20% opacity for selections
};

/**
 * Legacy color mappings for backwards compatibility
 * These map old color names to the new corporate scheme
 */
export const LEGACY_COLOR_MAP = {
  // Old -> New mappings
  NAVY: CORPORATE_COLORS.NAVY,
  TEAL: CORPORATE_COLORS.TEAL,
  ORANGE: CORPORATE_COLORS.ORANGE,
  GREEN: CORPORATE_COLORS.SUCCESS,
  BLUE: CORPORATE_COLORS.INFO,
  RED: CORPORATE_COLORS.ERROR,
  LIGHT_GRAY: CORPORATE_COLORS.LIGHT_GRAY,
  OFF_WHITE: CORPORATE_COLORS.CARD_BG,
  BG: CORPORATE_COLORS.PAGE_BG,
  TEXT: CORPORATE_COLORS.PRIMARY_TEXT,
  MUTED: CORPORATE_COLORS.MUTED_TEXT,
  SUBTLE: CORPORATE_COLORS.BORDER,
};

/**
 * Membership tier colors aligned with corporate branding
 */
export const MEMBERSHIP_COLORS = {
  basic: CORPORATE_COLORS.TEAL,      // Teal for basic tier
  professional: CORPORATE_COLORS.NAVY, // Navy for professional tier  
  elite: CORPORATE_COLORS.ORANGE,    // Orange for elite tier
};

/**
 * Utility function to get corporate color by name
 */
export const getCorporateColor = (colorName, fallback = '#000000') => {
  return CORPORATE_COLORS[colorName] || LEGACY_COLOR_MAP[colorName] || fallback;
};

/**
 * CSS Custom Properties for corporate colors
 * Can be used in CSS files
 */
export const CORPORATE_CSS_VARS = `
:root {
  --corporate-navy: ${CORPORATE_COLORS.NAVY};
  --corporate-orange: ${CORPORATE_COLORS.ORANGE};
  --corporate-light-gray: ${CORPORATE_COLORS.LIGHT_GRAY};
  --corporate-teal: ${CORPORATE_COLORS.TEAL};
  --corporate-subtle-teal: ${CORPORATE_COLORS.SUBTLE_TEAL};
  
  --corporate-primary-text: ${CORPORATE_COLORS.PRIMARY_TEXT};
  --corporate-secondary-text: ${CORPORATE_COLORS.SECONDARY_TEXT};
  --corporate-muted-text: ${CORPORATE_COLORS.MUTED_TEXT};
  
  --corporate-page-bg: ${CORPORATE_COLORS.PAGE_BG};
  --corporate-card-bg: ${CORPORATE_COLORS.CARD_BG};
  --corporate-subtle-bg: ${CORPORATE_COLORS.SUBTLE_BG};
  
  --corporate-primary-button: ${CORPORATE_COLORS.PRIMARY_BUTTON};
  --corporate-primary-button-hover: ${CORPORATE_COLORS.PRIMARY_BUTTON_HOVER};
  --corporate-secondary-button: ${CORPORATE_COLORS.SECONDARY_BUTTON};
  --corporate-secondary-button-hover: ${CORPORATE_COLORS.SECONDARY_BUTTON_HOVER};
  
  --corporate-success: ${CORPORATE_COLORS.SUCCESS};
  --corporate-warning: ${CORPORATE_COLORS.WARNING};
  --corporate-error: ${CORPORATE_COLORS.ERROR};
  --corporate-info: ${CORPORATE_COLORS.INFO};
  
  --corporate-border: ${CORPORATE_COLORS.BORDER};
  --corporate-subtle-border: ${CORPORATE_COLORS.SUBTLE_BORDER};
  --corporate-accent-border: ${CORPORATE_COLORS.ACCENT_BORDER};
  
  --corporate-focus-ring: ${CORPORATE_COLORS.FOCUS_RING};
  --corporate-selection: ${CORPORATE_COLORS.SELECTION};
}
`;

// Default export for easy importing
export default CORPORATE_COLORS;
