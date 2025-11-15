// src/styles/corporateConstants.js
// Shared corporate color constants across all screens

export const CORPORATE_COLORS = {
  // === PRIMARY BRAND COLORS (from leaderreps.com) ===
  NAVY: '#002E47',        // Primary text, headers, navigation
  ORANGE: '#E04E1B',      // Call-to-action buttons, highlights, alerts  
  TEAL: '#47A88D',        // Secondary buttons, success states, accents
  LIGHT_GRAY: '#FCFCFA',  // Page backgrounds, subtle surfaces
  
  // === SEMANTIC MAPPINGS (using ONLY corporate colors) ===
  PRIMARY: '#47A88D',     // Map to TEAL
  SECONDARY: '#E04E1B',   // Map to ORANGE
  SUCCESS: '#47A88D',     // Map to TEAL
  WARNING: '#E04E1B',     // Map to ORANGE
  DANGER: '#E04E1B',      // Map to ORANGE
  INFO: '#47A88D',        // Map to TEAL
  
  // === TEXT & BACKGROUNDS (corporate colors only) ===
  TEXT: '#002E47',        // NAVY for all text
  MUTED: '#6B7280',       // Standard gray for muted text
  BG: '#FCFCFA',          // LIGHT_GRAY for backgrounds
  SUBTLE: '#47A88D'       // TEAL for subtle elements
};

export const CORPORATE_CLASSES = {
  PAGE_CONTAINER: 'page-corporate container-corporate animate-corporate-fade-in',
  HEADING_XL: 'corporate-heading-xl',
  HEADING_LG: 'corporate-heading-lg', 
  HEADING_MD: 'corporate-heading-md',
  TEXT_BODY: 'corporate-text-body',
  BACK_BUTTON: 'flex items-center gap-2 mb-6 text-gray-600 hover:text-gray-800 cursor-pointer transition-colors'
};

export const CORPORATE_STYLES = {
  MAIN_HEADER: {
    color: CORPORATE_COLORS.NAVY
  },
  MUTED_TEXT: {
    color: CORPORATE_COLORS.MUTED  
  },
  ACCENT_ICON: {
    color: CORPORATE_COLORS.TEAL
  },
  CTA_ICON: {
    color: CORPORATE_COLORS.ORANGE
  }
};