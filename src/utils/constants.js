// src/utils/constants.js
// LEADERREPS CORPORATE CONSTANTS - STRICT BRAND COMPLIANCE
// All colors must match leaderreps.com corporate identity

// Export corporate colors as the primary COLORS constant
export const COLORS = {
  // === CORPORATE BRAND COLORS (STRICT COMPLIANCE) ===
  NAVY: '#002E47',           // #002E47 - Primary brand color
  ORANGE: '#E04E1B',       // #E04E1B - Accent/CTA color  
  TEAL: '#47A88D',           // #47A88D - Secondary brand color
  SUBTLE_TEAL: '#349881', // #349881 - Teal hover states
  LIGHT_GRAY: '#FCFCFA',   // #FCFCFA - Page background
  
  // === SEMANTIC COLORS (CORPORATE ALIGNED) ===
  PRIMARY_TEXT: '#002E47',
  SECONDARY_TEXT: '#47A88D',
  MUTED_TEXT: '#6B7280',
  
  PAGE_BG: '#FCFCFA',
  CARD_BG: '#FFFFFF',
  SUBTLE_BG: '#47A88D',
  
  PRIMARY_BUTTON: '#47A88D',
  PRIMARY_BUTTON_HOVER: '#349881',
  SECONDARY_BUTTON: '#E04E1B',
  SECONDARY_BUTTON_HOVER: '#C44317',
  
  SUCCESS: '#47A88D',
  WARNING: '#E04E1B',
  ERROR: '#E04E1B',
  INFO: '#47A88D',
  
  BORDER: '#E5E7EB',
  SUBTLE_BORDER: '#F3F4F6',
  ACCENT_BORDER: '#47A88D',
  
  FOCUS_RING: '#47A88D',
  SELECTION: '#47A88D',
  
  // === LEGACY MAPPINGS (for backwards compatibility) ===
  BG: '#FCFCFA',          // Legacy: background
  TEXT: '#002E47',   // Legacy: text color
  SUBTLE: '#E5E7EB',       // Legacy: subtle borders
  MUTED: '#6B7280',    // Legacy: muted text
  OFF_WHITE: '#FFFFFF',   // Legacy: card background
  RED: '#E04E1B',           // Legacy: red/error -> Use corporate orange
  GREEN: '#47A88D',       // Legacy: green/success -> Use corporate teal
  BLUE: '#002E47',           // Legacy: blue/info -> Use corporate navy
  PURPLE: '#47A88D',         // NO PURPLE! Use corporate teal instead
  AMBER: '#E04E1B'         // NO AMBER! Use corporate orange instead
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