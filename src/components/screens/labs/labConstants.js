// src/components/screens/labs/labConstants.js
import { CheckCircle, AlertTriangle, Target } from 'lucide-react';

// LEADERREPS.COM OFFICIAL CORPORATE COLORS - VERIFIED 11/14/25
export const COLORS = {
  // === PRIMARY BRAND COLORS (from leaderreps.com) ===
  NAVY: '#002E47',        // Primary text, headers, navigation
  ORANGE: '#E04E1B',      // Call-to-action buttons, highlights, alerts  
  TEAL: '#47A88D',        // Secondary buttons, success states, accents
  LIGHT_GRAY: '#FCFCFA',  // Page backgrounds, subtle surfaces
  
  // === SEMANTIC MAPPINGS (using ONLY corporate colors) ===
  BLUE: '#002E47',        // Map to NAVY
  GREEN: '#47A88D',       // Map to TEAL  
  AMBER: '#E04E1B',       // Map to ORANGE
  RED: '#E04E1B',         // Map to ORANGE
  PURPLE: '#47A88D',      // Map to TEAL
  
  // === TEXT & BACKGROUNDS (corporate colors only) ===
  TEXT: '#002E47',        // NAVY for all text
  MUTED: '#47A88D',       // TEAL for muted text
  BG: '#FCFCFA',          // LIGHT_GRAY for backgrounds
  SURFACE: '#FCFCFA',     // Same as BG
  OFF_WHITE: '#FCFCFA',   // Same as BG
  SUBTLE: '#47A88D',      // TEAL for subtle elements
  BORDER: '#47A88D'       // TEAL for borders
};

export const COMPLEXITY_MAP = {
  Low:    { label: 'Novice',       hex: COLORS.TEAL, icon: CheckCircle },
  Medium: { label: 'Intermediate', hex: COLORS.ORANGE, icon: AlertTriangle },
  High:   { label: 'Expert',       hex: COLORS.NAVY,   icon: Target },
};
