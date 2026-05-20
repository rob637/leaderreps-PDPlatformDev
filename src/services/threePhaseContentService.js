// src/services/threePhaseContentService.js
//
// Three-Phase Content Service (May 2026 — refactor/three-phase-cleanup)
// =====================================================================
// Read/write service for the new flat `daily_plan_v2` collection that
// replaces the day/week/milestone-keyed `daily_plan_v1` model.
//
// Two documents only:
//   - daily_plan_v2/foundation-content
//   - daily_plan_v2/ascent-content
//
// Each doc contains arrays of actions, contentItems, coachingItems,
// communityItems, tools, workouts, dailyReps, plus skills/pillars sets.
// See `scripts/migrations/seed-three-phase-content.cjs` for the doc shape.
//
// This service is intentionally additive — it lives alongside the legacy
// daily-plan reading code until Commit 3 removes the old model.

import { onSnapshotEx, setDocEx } from './firestoreUtils';
import { sanitizeTimestamps, stripSentinels } from './dataUtils.js';

const COLLECTION = 'daily_plan_v2';
const DOCS = {
  foundation: 'foundation-content',
  ascent: 'ascent-content',
};

const PHASE_KEYS = ['foundation', 'ascent'];

const docPath = (phaseKey) => {
  if (!DOCS[phaseKey]) return null;
  return `${COLLECTION}/${DOCS[phaseKey]}`;
};

/**
 * Subscribe to both phase documents. Returns an unsubscribe function.
 * `onUpdate` receives `{ foundation, ascent }` (each may be null until
 * the first snapshot arrives).
 */
export const subscribeToThreePhaseContent = (db, onUpdate) => {
  if (!db || typeof onUpdate !== 'function') {
    return () => {};
  }

  const state = { foundation: null, ascent: null };
  const unsubs = [];

  for (const phaseKey of PHASE_KEYS) {
    const path = docPath(phaseKey);
    const unsub = onSnapshotEx(db, path, (snap) => {
      const data = snap.exists()
        ? stripSentinels(sanitizeTimestamps(snap.data()))
        : null;
      state[phaseKey] = data;
      onUpdate({ ...state });
    });
    unsubs.push(unsub);
  }

  return () => {
    unsubs.forEach((u) => {
      try {
        u && u();
      } catch (err) {
        console.warn('[threePhaseContentService] unsubscribe error:', err);
      }
    });
  };
};

/**
 * Overwrite (merge) one phase document. Used by the admin Phase Content
 * Manager (Commit 2b). Returns true on success.
 */
export const updatePhaseContent = async (db, phaseKey, updates, { merge = true } = {}) => {
  const path = docPath(phaseKey);
  if (!db || !path) return false;
  return setDocEx(db, path, updates, merge);
};

export const PHASE_CONTENT_DOCS = DOCS;
export const PHASE_CONTENT_COLLECTION = COLLECTION;
