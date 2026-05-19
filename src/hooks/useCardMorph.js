// src/hooks/useCardMorph.js
//
// Centralizes the dashboard card-morph behavior:
//   • reads the `dashboard-card-morph` feature flag (default OFF)
//   • respects the user's prefers-reduced-motion OS setting
//   • exposes the spring config so every morphing widget animates identically
//   • manages the `expandedKey` state + ESC-to-close handler
//
// Usage (per widget):
//   const morph = useCardMorph();
//   morph.morphEnabled        → boolean: whether to render morph instead of legacy fallback
//   morph.expandedKey         → string|null: which row is currently morphed open
//   morph.openMorph(key)      → expand a row by its layoutId
//   morph.closeMorph()        → collapse the overlay
//   morph.transition          → object: pass to <motion.*> transition prop
//   morph.prefersReducedMotion → boolean (already baked into transition)

import { useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useFeatures } from '../providers/FeatureProvider';

// Spring tuned for "confident, quick" — same easing family the Next theme uses
// for hover lifts. Total motion lands ~280ms which is below the loading-feel
// threshold. Stiffness/damping deliberately produces zero overshoot — we're a
// leadership tool, not a toy.
const MORPH_SPRING = { type: 'spring', stiffness: 380, damping: 34, mass: 0.7 };
const REDUCED_MOTION = { duration: 0 };

export const useCardMorph = () => {
  const { isFeatureEnabled } = useFeatures();
  const prefersReducedMotion = useReducedMotion();
  const [expandedKey, setExpandedKey] = useState(null);

  const morphEnabled = isFeatureEnabled('dashboard-card-morph');

  const openMorph = useCallback((key) => setExpandedKey(key), []);
  const closeMorph = useCallback(() => setExpandedKey(null), []);

  // ESC closes any open morph
  useEffect(() => {
    if (!expandedKey) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setExpandedKey(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expandedKey]);

  return {
    morphEnabled,
    expandedKey,
    openMorph,
    closeMorph,
    prefersReducedMotion,
    transition: prefersReducedMotion ? REDUCED_MOTION : MORPH_SPRING,
  };
};

export default useCardMorph;
