// src/hooks/useAnchors.js
//
// React hook that subscribes to a user's Anchors, Pulse Checks, and (if
// they are in a cohort) the cohort Worklist inbox.
//
// Usage:
//   const { anchors, currentWeekPulse, worklist, loading, actions } = useAnchors();
//   actions.create({ title, description, pulseTargets })
//   actions.setPulse(anchorId, 'on_track' | 'off_track' | 'needs_help', note)
//   actions.submitIssue(summary, tags)
//   actions.seedSamples()    // dev preview only

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices.jsx';
import {
  subscribeAnchors,
  subscribePulseChecks,
  subscribeWorklistInbox,
  createAnchor,
  updateAnchor,
  deleteAnchor,
  setPulseCheck,
  submitToWorklist,
  seedSampleAscent,
  getWeekId,
} from '../services/anchorsService';

export const useAnchors = () => {
  const { db, user } = useAppServices();
  const uid = user?.uid;
  const cohortId = user?.cohortId || null;

  const [anchors, setAnchors] = useState([]);
  const [pulseChecks, setPulseChecks] = useState([]);
  const [worklist, setWorklist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubA = subscribeAnchors(db, uid, (items) => {
      setAnchors(items);
      setLoading(false);
    });
    const unsubP = subscribePulseChecks(db, uid, setPulseChecks);
    let unsubW = () => {};
    if (cohortId) {
      unsubW = subscribeWorklistInbox(db, cohortId, setWorklist);
    }
    return () => {
      unsubA();
      unsubP();
      unsubW();
    };
  }, [db, uid, cohortId]);

  const activeAnchors = useMemo(
    () => anchors.filter((a) => a.status === 'active'),
    [anchors]
  );

  const currentWeekId = getWeekId();
  const currentWeekPulse = useMemo(
    () => pulseChecks.find((p) => p.weekId === currentWeekId) || null,
    [pulseChecks, currentWeekId]
  );

  /** consecutive weeks where ALL active anchors were on_track */
  const streakWeeks = useMemo(() => {
    if (!activeAnchors.length || !pulseChecks.length) return 0;
    let streak = 0;
    const sorted = [...pulseChecks].sort((a, b) => (a.weekId < b.weekId ? 1 : -1));
    for (const wk of sorted) {
      const per = wk.perAnchor || {};
      const allOn = activeAnchors.every((a) => per[a.id]?.status === 'on_track');
      if (allOn) streak += 1;
      else break;
    }
    return streak;
  }, [activeAnchors, pulseChecks]);

  const actions = useMemo(
    () => ({
      create: (payload) => createAnchor(db, uid, payload),
      update: (anchorId, patch) => updateAnchor(db, uid, anchorId, patch),
      remove: (anchorId) => deleteAnchor(db, uid, anchorId),
      setPulse: (anchorId, status, note) =>
        setPulseCheck(db, uid, anchorId, status, note, 'app'),
      submitIssue: (summary, tags) =>
        cohortId ? submitToWorklist(db, cohortId, uid, summary, tags) : Promise.resolve(null),
      seedSamples: () => seedSampleAscent(db, uid, cohortId),
    }),
    [db, uid, cohortId]
  );

  return {
    anchors,
    activeAnchors,
    pulseChecks,
    currentWeekPulse,
    currentWeekId,
    streakWeeks,
    worklist,
    loading,
    cohortId,
    actions,
  };
};

export default useAnchors;
