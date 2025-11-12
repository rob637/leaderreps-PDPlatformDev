// src/utils/constants.js
// LEADERREPS CORPORATE CONSTANTS - STRICT BRAND COMPLIANCE
// All colors must match leaderreps.com corporate identity

import { CORPORATE_COLORS } from '../styles/corporate-colors.js';

// Export corporate colors as the primary COLORS constant
export const COLORS = {
  // === CORPORATE BRAND COLORS (STRICT COMPLIANCE) ===
  NAVY: CORPORATE_COLORS.NAVY,           // #002E47 - Primary brand color
  ORANGE: CORPORATE_COLORS.ORANGE,       // #E04E1B - Accent/CTA color  
  TEAL: CORPORATE_COLORS.TEAL,           // #47A88D - Secondary brand color
  SUBTLE_TEAL: CORPORATE_COLORS.SUBTLE_TEAL, // #349881 - Teal hover states
  LIGHT_GRAY: CORPORATE_COLORS.LIGHT_GRAY,   // #FCFCFA - Page background
  
  // === SEMANTIC COLORS (CORPORATE ALIGNED) ===
  PRIMARY_TEXT: CORPORATE_COLORS.PRIMARY_TEXT,
  SECONDARY_TEXT: CORPORATE_COLORS.SECONDARY_TEXT,
  MUTED_TEXT: CORPORATE_COLORS.MUTED_TEXT,
  
  PAGE_BG: CORPORATE_COLORS.PAGE_BG,
  CARD_BG: CORPORATE_COLORS.CARD_BG,
  SUBTLE_BG: CORPORATE_COLORS.SUBTLE_BG,
  
  PRIMARY_BUTTON: CORPORATE_COLORS.PRIMARY_BUTTON,
  PRIMARY_BUTTON_HOVER: CORPORATE_COLORS.PRIMARY_BUTTON_HOVER,
  SECONDARY_BUTTON: CORPORATE_COLORS.SECONDARY_BUTTON,
  SECONDARY_BUTTON_HOVER: CORPORATE_COLORS.SECONDARY_BUTTON_HOVER,
  
  SUCCESS: CORPORATE_COLORS.SUCCESS,
  WARNING: CORPORATE_COLORS.WARNING,
  ERROR: CORPORATE_COLORS.ERROR,
  INFO: CORPORATE_COLORS.INFO,
  
  BORDER: CORPORATE_COLORS.BORDER,
  SUBTLE_BORDER: CORPORATE_COLORS.SUBTLE_BORDER,
  ACCENT_BORDER: CORPORATE_COLORS.ACCENT_BORDER,
  
  FOCUS_RING: CORPORATE_COLORS.FOCUS_RING,
  SELECTION: CORPORATE_COLORS.SELECTION,
  
  // === LEGACY MAPPINGS (for backwards compatibility) ===
  BG: CORPORATE_COLORS.PAGE_BG,          // Legacy: background
  TEXT: CORPORATE_COLORS.PRIMARY_TEXT,   // Legacy: text color
  SUBTLE: CORPORATE_COLORS.BORDER,       // Legacy: subtle borders
  MUTED: CORPORATE_COLORS.MUTED_TEXT,    // Legacy: muted text
  OFF_WHITE: CORPORATE_COLORS.CARD_BG,   // Legacy: card background
  RED: CORPORATE_COLORS.ERROR,           // Legacy: red/error -> Use corporate orange
  GREEN: CORPORATE_COLORS.SUCCESS,       // Legacy: green/success -> Use corporate teal
  BLUE: CORPORATE_COLORS.INFO,           // Legacy: blue/info -> Use corporate navy
  PURPLE: CORPORATE_COLORS.TEAL,         // NO PURPLE! Use corporate teal instead
  AMBER: CORPORATE_COLORS.ORANGE         // NO AMBER! Use corporate orange instead
};

export const THEME = {
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem', 
    lg: '0.75rem',
    xl: '1rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
};

export const APP_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  API_TIMEOUT: 15000, // 15 seconds
  MAX_RETRIES: 3
};

// Firebase Collections
export const COLLECTIONS = {
  USERS: 'users',
  ARTIFACTS: 'artifacts',
  GLOBAL: 'global',
  PUBLIC: 'public'
};

// Route Constants
export const ROUTES = {
  DASHBOARD: 'dashboard',
  DEV_PLAN: 'development-plan',
  DAILY_PRACTICE: 'daily-practice',
  COACHING_LAB: 'coaching-lab',
  PLANNING_HUB: 'planning-hub',
  BUSINESS_READINGS: 'business-readings',
  ADMIN: 'admin-functions',
  SETTINGS: 'app-settings'
};