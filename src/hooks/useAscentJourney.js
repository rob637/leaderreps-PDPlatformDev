// src/hooks/useAscentJourney.js
//
// Lead Team — Journey state hook.
//
// Persists the user's current focus + per-conversation step progress to:
//   users/{uid}/ascent_journey/_state          → { focusId, updatedAt }
//   users/{uid}/ascent_journey/{conversationId} → { steps: { learn, prep, practice, reflect }, startedAt, completedAt }
//
// Steps are explicit "Mark complete" actions — no auto-advance.

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  doc, getDoc, setDoc, collection, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { useAppServices } from '../services/useAppServices.jsx';

export const STEP_KEYS = ['learn', 'prep', 'practice', 'reflect'];

export const STEP_META = {
  learn:    { label: 'Learn',    sub: 'Watch the short video' },
  prep:     { label: 'Prep',     sub: 'Use the 4-question card' },
  practice: { label: 'Practice', sub: 'Practice/Reps or rehearse with Rep Coach' },
  reflect:  { label: 'Reflect',  sub: 'One-line Field Note' },
};

const emptyJourney = { steps: {}, startedAt: null, completedAt: null };

const completedCount = (journey) =>
  STEP_KEYS.filter((k) => journey?.steps?.[k]?.done).length;

const isComplete = (journey) => completedCount(journey) === STEP_KEYS.length;

export const useAscentJourney = () => {
  const { user, db } = useAppServices();
  const userId = user?.uid || user?.userId || null;

  const [focusId, setFocusId] = useState(null);
  const [journeys, setJourneys] = useState({}); // { [conversationId]: journey }
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const journeyCol = useMemo(() => {
    if (!db || !userId) return null;
    return collection(db, 'users', userId, 'ascent_journey');
  }, [db, userId]);

  // Initial load — focus pointer + all conversation journeys
  useEffect(() => {
    let cancelled = false;
    if (!db || !userId) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    (async () => {
      try {
        const stateRef = doc(db, 'users', userId, 'ascent_journey', '_state');
        const stateSnap = await getDoc(stateRef);
        const stateData = stateSnap.exists() ? stateSnap.data() : null;

        const colSnap = await getDocs(journeyCol);
        const map = {};
        colSnap.forEach((d) => {
          if (d.id === '_state') return;
          map[d.id] = { ...emptyJourney, ...d.data() };
        });

        if (!cancelled) {
          setFocusId(stateData?.focusId || null);
          setJourneys(map);
          setHydrated(true);
        }
      } catch (e) {
        console.warn('[useAscentJourney] load failed:', e?.message || e);
        if (!cancelled) setHydrated(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [db, userId, journeyCol]);

  // Set or change focus
  const setFocus = useCallback(async (conversationId) => {
    if (!db || !userId || !conversationId) return;
    setFocusId(conversationId); // optimistic
    try {
      const stateRef = doc(db, 'users', userId, 'ascent_journey', '_state');
      await setDoc(stateRef, {
        focusId: conversationId,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Make sure the per-conversation doc exists with startedAt
      if (!journeys[conversationId]) {
        const convoRef = doc(db, 'users', userId, 'ascent_journey', conversationId);
        const initial = { steps: {}, startedAt: serverTimestamp(), completedAt: null };
        await setDoc(convoRef, initial, { merge: true });
        setJourneys((prev) => ({ ...prev, [conversationId]: { ...emptyJourney, startedAt: new Date() } }));
      }
    } catch (e) {
      console.warn('[useAscentJourney] setFocus failed:', e?.message || e);
    }
  }, [db, userId, journeys]);

  // Mark a step complete (toggle off if already done)
  const toggleStep = useCallback(async (conversationId, stepKey) => {
    if (!db || !userId || !conversationId || !stepKey) return;
    if (!STEP_KEYS.includes(stepKey)) return;

    const current = journeys[conversationId] || { ...emptyJourney };
    const wasDone = !!current.steps?.[stepKey]?.done;
    const newSteps = {
      ...(current.steps || {}),
      [stepKey]: { done: !wasDone, at: wasDone ? null : new Date() },
    };
    const newJourney = {
      ...current,
      steps: newSteps,
      startedAt: current.startedAt || new Date(),
      completedAt: STEP_KEYS.every((k) => newSteps[k]?.done) ? new Date() : null,
    };

    setJourneys((prev) => ({ ...prev, [conversationId]: newJourney }));

    try {
      const convoRef = doc(db, 'users', userId, 'ascent_journey', conversationId);
      // Use serverTimestamp on the writes
      const writeSteps = {
        ...(current.steps || {}),
        [stepKey]: { done: !wasDone, at: wasDone ? null : serverTimestamp() },
      };
      await setDoc(convoRef, {
        steps: writeSteps,
        startedAt: current.startedAt || serverTimestamp(),
        completedAt: STEP_KEYS.every((k) => writeSteps[k]?.done) ? serverTimestamp() : null,
      }, { merge: true });
    } catch (e) {
      console.warn('[useAscentJourney] toggleStep failed:', e?.message || e);
    }
  }, [db, userId, journeys]);

  const getJourney = useCallback(
    (conversationId) => journeys[conversationId] || { ...emptyJourney },
    [journeys]
  );

  const focusJourney = focusId ? getJourney(focusId) : null;

  // Find next step on current focus
  const nextStepKey = useMemo(() => {
    if (!focusJourney) return null;
    return STEP_KEYS.find((k) => !focusJourney.steps?.[k]?.done) || null;
  }, [focusJourney]);

  return {
    loading,
    hydrated,
    focusId,
    focusJourney,
    journeys,
    nextStepKey,
    actions: {
      setFocus,
      toggleStep,
      getJourney,
    },
    helpers: {
      completedCount,
      isComplete,
    },
  };
};
