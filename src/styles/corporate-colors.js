// src/styles/corporate-colors.js
// LEADERREPS CORPORATE COLOR SCHEME - STRICT REQUIREMENTS
// Based on leaderreps.com brand guidelines

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

  // === SEMANTIC COLORS (CORPORATE COLORS ONLY!) ===
  // Text Colors (using ONLY corporate colors)
  PRIMARY_TEXT: '#002E47',    // Navy for primary text
  SECONDARY_TEXT: '#002E47',  // Navy for secondary text  
  MUTED_TEXT: '#349881',     // Subtle teal for muted text
  
  // Background Colors (using ONLY corporate colors)
  PAGE_BG: '#FCFCFA',        // Main page background
  CARD_BG: '#FCFCFA',        // Card/surface background (use corporate light gray)
  SUBTLE_BG: '#FCFCFA',      // Subtle section backgrounds
  
  // Interactive Elements (using ONLY corporate colors)
  PRIMARY_BUTTON: '#47A88D',     // Teal primary buttons
  PRIMARY_BUTTON_HOVER: '#349881', // Subtle teal hover
  SECONDARY_BUTTON: '#E04E1B',    // Orange secondary buttons  
  SECONDARY_BUTTON_HOVER: '#349881', // Subtle teal hover (NO non-corporate colors!)
  
  // Status Colors (using ONLY corporate colors)
  SUCCESS: '#47A88D',        // Use brand teal for success
  WARNING: '#E04E1B',        // Use brand orange for warnings
  ERROR: '#E04E1B',          // Use orange for errors (NO RED!)
  INFO: '#002E47',           // Use brand navy for info
  
  // Border & Divider Colors (using ONLY corporate colors)
  BORDER: '#47A88D',         // Teal borders
  SUBTLE_BORDER: '#349881',  // Subtle teal borders
  ACCENT_BORDER: '#47A88D',  // Branded accent borders
  
  // Focus & Selection States (using ONLY corporate colors)
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