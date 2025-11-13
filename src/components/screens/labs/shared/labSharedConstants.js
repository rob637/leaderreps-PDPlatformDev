// src/components/screens/labs/shared/labSharedConstants.js
import { CheckCircle, AlertTriangle, Target } from 'lucide-react';

export const COLORS = {
  BG: '#FCFCFA',             // Corporate light gray
  SURFACE: '#FCFCFA',        // Corporate light gray
  BORDER: '#47A88D',         // Corporate teal
  SUBTLE: '#349881',         // Corporate subtle teal
  TEXT: '#002E47',           // Corporate navy
  MUTED: '#349881',          // Corporate subtle teal
  NAVY: '#002E47',           // Corporate navy
  TEAL: '#47A88D',           // Corporate teal
  BLUE: '#002E47',           // NO BLUE! Use corporate navy
  ORANGE: '#E04E1B',         // Corporate orange
  GREEN: '#47A88D',          // NO GREEN! Use corporate teal
  AMBER: '#E04E1B',          // NO AMBER! Use corporate orange
  RED: '#E04E1B',            // NO RED! Use corporate orange
  LIGHT_GRAY: '#FCFCFA'      // Corporate light gray
};

export const COMPLEXITY_MAP = {
  Low:    { label: 'Novice',       hex: COLORS.GREEN, icon: CheckCircle },
  Medium: { label: 'Intermediate', hex: COLORS.AMBER, icon: AlertTriangle },
  High:   { label: 'Expert',       hex: COLORS.RED,   icon: Target },
};
