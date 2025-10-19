// src/services/useAppServices.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

/* =============================================================================
   Small Firestore helper: subscribe to a single doc
   - Returns { data, isLoading, error, update(partial), replace(value) }
   - Creates the doc on first write if missing (via setDoc)
============================================================================= */
function useUserDoc(db, userId, segments, defaultValue = {}) {
  const [data, setData] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const ref = useMemo(() => {
    if (!db || !userId) return null;
    const segs = Array.isArray(segments) ? segments : [segments];
    return doc(db, ...segs);
  }, [db, userId, segments]);

  useEffect(() => {
    if (!ref) return;
    setIsLoading(true);
    setError(null);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) setData(snap.data());
        else setData(defaultValue);
        setIsLoading(false);
      },
      (err) => {
        console.error('Firestore subscribe error:', err);
        setError(err);
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = async (partial) => {
    if (!ref) throw new Error('Doc ref not ready.');
    await setDoc(ref, partial, { merge: true });
  };

  const replace = async (value) => {
    if (!ref) throw new Error('Doc ref not ready.');
    await setDoc(ref, value, { merge: false });
  };

  return { data, isLoading, error, update, replace };
}

/* =============================================================================
   Defaults (so UIs never crash on undefined shapes)
============================================================================= */
const DEFAULT_PDP = {
  assessment: { selfRatings: {} },
  plan: { months: [] },
  meta: { updatedAt: null, version: 1 },
};

const DEFAULT_COMMITMENTS = {
  active_commitments: [],
  reflection_journal: '',
  meta: { updatedAt: null },
};

const DEFAULT_PLANNING = {
  okrs: [],
  backlog: [],
  cadence: 'monthly',
  meta: { updatedAt: null },
};

/* =============================================================================
   Optional AI helpers (via secure proxy)
   - Set VITE_GEMINI_PROXY_URL to a serverless endpoint that holds your API key
============================================================================= */
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const GEMINI_PROXY_URL = import.meta.env.VITE_GEMINI_PROXY_URL || '';

async function callSecureGeminiAPI(payload) {
  if (!GEMINI_PROXY_URL) throw new Error('Gemini proxy URL missing (VITE_GEMINI_PROXY_URL).');
  const res = await fetch(GEMINI_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Gemini proxy error ${res.status}`);
  return await res.json();
}
function hasGeminiKey() {
  return Boolean(GEMINI_PROXY_URL);
}

/* =============================================================================
   Context + Provider
   Exposes:
     - platform: app, auth, db, user, userId, navigate
     - data: pdpData / commitmentData / planningData (live), plus writers
     - state: isLoading, error, hasPendingDailyPractice
     - ai: hasGeminiKey, callSecureGeminiAPI, GEMINI_MODEL
============================================================================= */
const AppServicesContext = createContext(null);

export function useAppServices() {
  const ctx = useContext(AppServicesContext);
  if (!ctx) {
    throw new Error('useAppServices must be used inside <AppServicesProvider>');
  }
  return ctx;
}

export function AppServicesProvider({ children, app, auth, db, user, navigate }) {
  const userId = user?.uid || null;

  // Live docs under users/{uid}/…
  const pdpDoc = useUserDoc(db, userId, ['users', userId || '_', 'pdp', 'roadmap'], DEFAULT_PDP);
  const commitmentDoc = useUserDoc(db, userId, ['users', userId || '_', 'commitments', 'state'], DEFAULT_COMMITMENTS);
  const planningDoc = useUserDoc(db, userId, ['users', userId || '_', 'planning', 'state'], DEFAULT_PLANNING);

  // Writers (merge updates + stamp meta.updatedAt)
  const updatePdpData = async (partial) =>
    pdpDoc.update({ ...partial, meta: { ...(pdpDoc.data.meta || {}), updatedAt: Date.now() } });

  const saveNewPlan = async (newPlan) =>
    pdpDoc.replace({
      ...DEFAULT_PDP,
      ...newPlan,
      meta: { updatedAt: Date.now(), version: (pdpDoc.data.meta?.version || 1) + 1 },
    });

  const updateCommitmentData = async (partial) =>
    commitmentDoc.update({ ...partial, meta: { ...(commitmentDoc.data.meta || {}), updatedAt: Date.now() } });

  const updatePlanningData = async (partial) =>
    planningDoc.update({ ...partial, meta: { ...(planningDoc.data.meta || {}), updatedAt: Date.now() } });

  // Derived
  const hasPendingDailyPractice = useMemo(() => {
    const active = commitmentDoc.data?.active_commitments || [];
    const isPending = active.some((c) => c?.status === 'Pending');
    const reflectionMissing = !(commitmentDoc.data?.reflection_journal || '').trim();
    return active.length > 0 && (isPending || reflectionMissing);
  }, [commitmentDoc.data]);

  // Aggregate state
  const isLoading = pdpDoc.isLoading || commitmentDoc.isLoading || planningDoc.isLoading;
  const error = pdpDoc.error || commitmentDoc.error || planningDoc.error;

  const value = useMemo(
    () => ({
      // platform
      app, auth, db, navigate, user, userId,

      // data (live)
      pdpData: pdpDoc.data,
      updatePdpData,
      saveNewPlan,

      commitmentData: commitmentDoc.data,
      updateCommitmentData,

      planningData: planningDoc.data,
      updatePlanningData,

      // state
      isLoading,
      error,
      hasPendingDailyPractice,

      // AI
      hasGeminiKey,
      callSecureGeminiAPI,
      GEMINI_MODEL,
    }),
    [
      app, auth, db, navigate, user, userId,
      pdpDoc.data, commitmentDoc.data, planningDoc.data,
      isLoading, error, hasPendingDailyPractice
    ]
  );

  return <AppServicesContext.Provider value={value}>{children}</AppServicesContext.Provider>;
}
