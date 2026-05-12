// src/hooks/useThreePhaseContent.js
//
// Read-side hook for the three-phase content model (May 2026).
// Wraps the raw service data exposed by DataProvider with phase resolution.
//
// Usage:
//   const { phaseKey, phaseContent, foundationContent, ascentContent, isLoading }
//     = useThreePhaseContent();

import { useMemo } from 'react';
import { useAppServices } from '../services/useAppServices';
import { useDailyPlan, phaseKey as resolvePhaseKey } from './useDailyPlan';

const EMPTY_PHASE_DOC = {
  contentItems: [],
};

const useThreePhaseContent = () => {
  const services = useAppServices() || {};
  const { currentPhase } = useDailyPlan();

  const raw = services.threePhaseContent || { foundation: null, ascent: null };
  const foundationContent = raw.foundation;
  const ascentContent = raw.ascent;

  const phase = resolvePhaseKey(currentPhase);

  const phaseContent = useMemo(() => {
    if (phase === 'foundation') return foundationContent || EMPTY_PHASE_DOC;
    if (phase === 'ascent') {
      // Ascent inherits all Foundation content automatically. Foundation
      // items appear as regular (non-required) content in Ascent — the
      // "required" flag is a per-phase kickoff signal and should not
      // re-trigger in Ascent.
      const ascentItems = Array.isArray(ascentContent?.contentItems)
        ? ascentContent.contentItems
        : [];
      const foundationItems = Array.isArray(foundationContent?.contentItems)
        ? foundationContent.contentItems
        : [];
      const seen = new Set();
      const keyOf = (it) =>
        it?.resourceId || it?.id || it?.contentItemLabel || JSON.stringify(it);
      const merged = [];
      ascentItems.forEach((it, idx) => {
        const k = keyOf(it);
        seen.add(k);
        merged.push({
          ...it,
          order: typeof it?.order === 'number' ? it.order : idx,
        });
      });
      const ascentMaxOrder = merged.reduce(
        (m, it) => (typeof it.order === 'number' && it.order > m ? it.order : m),
        -1,
      );
      foundationItems.forEach((it, idx) => {
        const k = keyOf(it);
        if (seen.has(k)) return;
        seen.add(k);
        merged.push({
          ...it,
          required: false,
          inheritedFrom: 'foundation',
          order: ascentMaxOrder + 1 + idx,
        });
      });
      return { ...(ascentContent || {}), contentItems: merged };
    }
    return EMPTY_PHASE_DOC;
  }, [phase, foundationContent, ascentContent]);

  // We treat "loading" as: no document for the current phase yet AND we
  // expect one (foundation/ascent). Onboarding phase is always considered
  // loaded since it doesn't use this hook's content.
  const isLoading = useMemo(() => {
    if (phase === 'foundation') return foundationContent === null;
    // Ascent merges Foundation content, so wait for both docs.
    if (phase === 'ascent') return ascentContent === null || foundationContent === null;
    return false;
  }, [phase, foundationContent, ascentContent]);

  return {
    phaseKey: phase,
    phaseContent,
    foundationContent: foundationContent || EMPTY_PHASE_DOC,
    ascentContent: ascentContent || EMPTY_PHASE_DOC,
    updatePhaseContent: services.updatePhaseContent || null,
    isLoading,
  };
};

export default useThreePhaseContent;
export { useThreePhaseContent, EMPTY_PHASE_DOC };
