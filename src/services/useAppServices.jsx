// src/services/useAppServices.jsx
// COMPLETE drop-in. Uses REAL Firestore when `db` exists (v9 modular SDK).
// Adds: (1) empty-payload guard for global config, (2) merge:true default for safety,
// (3) optional call-site tracing to catch accidental double-saves, (4) clean wrappers.
//
// No functionality removed. User-data hooks and shapes unchanged.
//
// ──────────────────────────────────────────────────────────────────────────────
// Imports
import { useMemo, useCallback, useContext, createContext, useState, useEffect } from 'react';
import { doc as fsDoc, setDoc as fsSetDoc, onSnapshot as fsOnSnapshot } from 'firebase/firestore';

// ──────────────────────────────────────────────────────────────────────────────
// Persistent MOCK fallback (used only if no `db` is provided).
// Keeps parity with your previous dev behavior while ensuring production uses Firestore.
const __firestore_mock_store = typeof window !== 'undefined' ? (window.__firestore_mock_store || {}) : {};
if (typeof window !== 'undefined') window.__firestore_mock_store = __firestore_mock_store;

const createMockSnapshot = (docPath, data, exists = true) => ({ exists: () => exists, data: () => data, docRef: docPath });
const mockSetDoc = async (docRef, data) => { __firestore_mock_store[docRef] = data; return true; };
const mockOnSnapshot = (docRef, cb) => { const d = __firestore_mock_store[docRef]; cb(createMockSnapshot(docRef, d || {}, !!d)); return () => {}; };
const mockDoc = (_db, c, d) => `${c}/${d}`;

// ──────────────────────────────────────────────────────────────────────────────
// Real Firestore wrappers (choose real if `db` exists; else mock)
const toDocRef = (db, path) => fsDoc(db, ...path.split('/'));
const onSnapshotEx = (db, path, cb) => db
  ? fsOnSnapshot(toDocRef(db, path), snap => cb({ exists: () => snap.exists(), data: () => snap.data(), docRef: path }))
  : mockOnSnapshot(path, cb);
const setDocEx = (db, path, data, merge = false) => db
  ? fsSetDoc(toDocRef(db, path), data, merge ? { merge: true } : undefined)
  : mockSetDoc(path, data);
const updateDocEx = (db, path, data) => setDocEx(db, path, data, /*merge*/ true);

// ──────────────────────────────────────────────────────────────────────────────
// Default data (unchanged shapes)
const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const LEADERSHIP_TIERS_FALLBACK = {
  T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
  T5: { id: 'T5', name: 'Strategy & Vision',   icon: 'TrendingUp', color: 'cyan-600'  },
};
const MOCK_PDP_DATA        = { currentMonth: 1, assessment: { selfRatings: { T1:5, T2:5, T3:5, T4:5, T5:5 } }, plan: [], practice_sessions: [] };
const MOCK_COMMITMENT_DATA = { active_commitments: [], history: [], reflection_journal: '', resilience_log: {} };
const MOCK_PLANNING_DATA   = { okrs: [], last_premortem_decision: '2025-01-01', vision: '', mission: '' };
const MOCK_ACTIVITY_DATA   = { daily_target_rep: 'Define your rep.', identity_statement: 'I am a principled leader.', total_reps_completed: 0, total_coaching_labs: 0, today_coaching_labs: 0 };

// ──────────────────────────────────────────────────────────────────────────────
const DEFAULT_SERVICES = {
  // Navigation & AI
  navigate: () => { console.warn('Navigation called before context initialization.'); },
  callSecureGeminiAPI: async () => ({ candidates: [{ content: { parts: [{ text: 'API Not Configured' }] } }] }),
  hasGeminiKey: () => false,

  // Data updaters (set to no-ops here; your Provider supplies real ones)
  updatePdpData: async () => true,
  saveNewPlan: async () => true,
  updateCommitmentData: async () => true,
  updatePlanningData: async () => true,
  updateGlobalMetadata: async () => true,

  // Auth/DB
  user: null, userId: null, db: null, auth: null, isAuthReady: false,

  // Live data defaults
  pdpData: MOCK_PDP_DATA, commitmentData: MOCK_COMMITMENT_DATA, planningData: MOCK_PLANNING_DATA,
  isLoading: false, error: null, hasPendingDailyPractice: false,

  // Misc
  appId: 'default-app-id', IconMap: {}, GEMINI_MODEL, API_KEY: '',
  LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK, MOCK_ACTIVITY_DATA,
  COMMITMENT_BANK: {}, QUICK_CHALLENGE_CATALOG: [], SCENARIO_CATALOG: [],
  READING_CATALOG_SERVICE: {}, VIDEO_CATALOG: {}, LEADERSHIP_DOMAINS: [], RESOURCE_LIBRARY: {},
};

export const AppServiceContext = createContext(DEFAULT_SERVICES);

// ──────────────────────────────────────────────────────────────────────────────
// Generic user-doc hook (reads live via onSnapshot; merges on update)
const useFirestoreData = (db, userId, isAuthReady, suffix, mockData) => {
  const [data, setData] = useState(mockData);
  const [isLoading, setIsLoading] = useState(true);
  const docPath = useMemo(() => mockDoc(db, 'users', userId) + `/${suffix}`, [db, userId, suffix]);

  useEffect(() => {
    if (!isAuthReady || !userId) { setIsLoading(false); return; }
    const unsub = onSnapshotEx(db, docPath, (doc) => {
      setData(doc.exists() ? doc.data() : mockData);
      setIsLoading(false);
    });
    const t = setTimeout(() => { if (isLoading) { console.warn(`Subscribe timeout for ${docPath}`); setIsLoading(false); } }, 15000);
    return () => { unsub(); clearTimeout(t); };
  }, [db, userId, isAuthReady, docPath, mockData, isLoading]);

  const updateData = useCallback(async (updater) => {
    const next = updater(data);
    try { await updateDocEx(db, docPath, next); return true; }
    catch (e) { console.error(`Update failed for ${docPath}`, e); return false; }
  }, [db, docPath, data]);

  return { data, isLoading, error: null, updateData, docPath };
};

// ──────────────────────────────────────────────────────────────────────────────
// User data hooks (unchanged public API)
export const useCommitmentData = (db, userId, isAuthReady) => {
  const { data: commitmentData, isLoading, error, updateData: updateCommitmentData } =
    useFirestoreData(db, userId, isAuthReady, 'commitment_data/scorecard', MOCK_COMMITMENT_DATA);
  return { commitmentData, isLoading, error, updateCommitmentData };
};

export const usePDPData = (db, userId, isAuthReady) => {
  const { data: pdpData, isLoading, error, updateData: updatePdpData } =
    useFirestoreData(db, userId, isAuthReady, 'pdp/roadmap', MOCK_PDP_DATA);

  const saveNewPlan = useCallback(async (plan) => {
    const path = mockDoc(db, 'users', userId) + '/pdp/roadmap';
    try { await setDocEx(db, path, plan /* overwrite intentionally */); return true; }
    catch (e) { console.error('New plan save failed', e); return false; }
  }, [db, userId]);

  return { pdpData, isLoading, error, updatePdpData, saveNewPlan };
};

export const usePlanningData = (db, userId, isAuthReady) => {
  const { data: planningData, isLoading, error, updateData: updatePlanningData } =
    useFirestoreData(db, userId, isAuthReady, 'planning_data/hub', MOCK_PLANNING_DATA);
  return { planningData, isLoading, error, updatePlanningData };
};

// ──────────────────────────────────────────────────────────────────────────────
// Global metadata (single doc: metadata/config)
export const useGlobalMetadata = (db, isAuthReady) => {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const path = mockDoc(db, 'metadata', 'config'); // 'metadata/config'

  useEffect(() => {
    if (!isAuthReady) { setLoading(false); return; }
    const unsub = onSnapshotEx(db, path, (doc) => {
      if (doc.exists()) setMetadata(doc.data());
      else {
        console.warn("Global metadata not found at 'metadata/config'. Using empty object.");
        setMetadata({});
      }
      setLoading(false);
    });
    const t = setTimeout(() => { if (loading) { console.warn('Global metadata subscribe timeout'); setLoading(false); } }, 15000);
    return () => { unsub(); clearTimeout(t); };
  }, [db, isAuthReady, loading, path]);

  return { metadata, isLoading: loading };
};

// ──────────────────────────────────────────────────────────────────────────────
// Helpers to block accidental wipes and provide traceable logging
const looksEmptyGlobal = (obj) => {
  if (!obj || typeof obj !== 'object') return true;
  const keys = Object.keys(obj);
  if (keys.length === 0) return true;
  // If known sections exist but are all empty, treat as empty (prevents {} wipes)
  const sections = [
    'READING_CATALOG_SERVICE','COMMITMENT_BANK','TARGET_REP_CATALOG','LEADERSHIP_DOMAINS',
    'RESOURCE_LIBRARY','SCENARIO_CATALOG','VIDEO_CATALOG','LEADERSHIP_TIERS','GLOBAL_SETTINGS'
  ];
  const present = sections.filter(k => Object.prototype.hasOwnProperty.call(obj, k));
  if (present.length === 0) return false;
  return present.every(k => {
    const v = obj[k];
    if (Array.isArray(v)) return v.length === 0;
    if (v && typeof v === 'object') return Object.keys(v).length === 0;
    return false;
  });
};

// Optional: trace who called the writer (helps catch double saves)
const traceCallsite = () => {
  try {
    console.groupCollapsed('[updateGlobalMetadata] callsite');
    console.trace();
    console.groupEnd();
  } catch {}
};

export const updateGlobalMetadata = async (db, data, { merge = true, source = 'unknown' } = {}) => {
  traceCallsite();
  const path = mockDoc(db, 'metadata', 'config');
  const projectId = db?.app?.options?.projectId || 'unknown';

  // Block obviously empty payloads (prevents `{}` wipe)
  if (looksEmptyGlobal(data)) {
    console.warn(`[WRITE ABORTED] metadata/config payload looks empty; refusing to overwrite. project=${projectId} source=${source}`);
    return false;
  }

  try {
    await setDocEx(db, path, data, merge);
    console.info(`[WRITE OK] project=${projectId} doc=${path} merge=${merge} source=${source}`);
    return true;
  } catch (e) {
    console.error(`[WRITE FAIL] project=${projectId} doc=${path} source=${source}`, e);
    return false;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Context accessor (unchanged)
export function useAppServices() {
  const ctx = useContext(AppServiceContext);
  return (ctx === null || ctx === undefined) ? DEFAULT_SERVICES : ctx;
}
