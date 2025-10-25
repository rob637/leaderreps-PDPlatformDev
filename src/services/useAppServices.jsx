// src/services/useAppServices.jsx
// Complete — hardened + instrumented (real Firestore when db exists; mock fallback otherwise)

import React, {
  useMemo,
  useCallback,
  useContext,
  createContext,
  useState,
  useEffect,
} from 'react';

import {
  doc as fsDoc,
  setDoc as fsSetDoc,
  onSnapshot as fsOnSnapshot,
} from 'firebase/firestore';

/* =========================================================
   Mock fallback (keeps the app usable without Firestore)
========================================================= */
const __firestore_mock_store =
  typeof window !== 'undefined'
    ? window.__firestore_mock_store || (window.__firestore_mock_store = {})
    : {};

const createMockSnapshot = (docPath, data, exists = true) => ({
  exists: () => exists,
  data: () => data,
  docRef: docPath,
  _md: { fromCache: false, pendingWrites: false },
});
const mockSetDoc = async (docRef, data) => {
  __firestore_mock_store[docRef] = data;
  return true;
};
const mockOnSnapshot = (docRef, cb) => {
  const d = __firestore_mock_store[docRef];
  cb(createMockSnapshot(docRef, d || {}, !!d));
  return () => {};
};
const mockDoc = (_db, c, d) => `${c}/${d}`;

/* =========================================================
   Real Firestore wrappers
========================================================= */
const toDocRef = (db, path) => fsDoc(db, ...path.split('/'));
const onSnapshotEx = (db, path, cb) => {
  if (!db) return mockOnSnapshot(path, cb);
  return fsOnSnapshot(
    toDocRef(db, path),
    { includeMetadataChanges: true },
    (snap) =>
      cb({
        exists: () => snap.exists(),
        data: () => snap.data(),
        docRef: path,
        _md: {
          fromCache: snap.metadata.fromCache,
          pendingWrites: snap.metadata.hasPendingWrites,
        },
      })
  );
};
const setDocEx = (db, path, data, merge = false) =>
  db
    ? fsSetDoc(toDocRef(db, path), data, merge ? { merge: true } : undefined)
    : mockSetDoc(path, data);

const updateDocEx = (db, path, data) => setDocEx(db, path, data, true);

/* =========================================================
   Defaults / fallbacks
========================================================= */
const GEMINI_MODEL = 'gemini-2.5-flash'; // keep in sync with App.jsx
const LEADERSHIP_TIERS_FALLBACK = {
  T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
  T2: { id: 'T2', name: 'Lead Work & Execution', icon: 'Briefcase', color: 'green-600' },
  T3: { id: 'T3', name: 'Lead People & Coaching', icon: 'Users', color: 'yellow-600' },
  T4: { id: 'T4', name: 'Conflict & Team Health', icon: 'AlertTriangle', color: 'red-600' },
  T5: { id: 'T5', name: 'Strategy & Vision', icon: 'TrendingUp', color: 'cyan-600' },
};
const MOCK_PDP_DATA = {
  currentMonth: 1,
  assessment: { selfRatings: { T1: 5, T2: 5, T3: 5, T4: 5, T5: 5 } },
  plan: [],
  practice_sessions: [],
};
const MOCK_COMMITMENT_DATA = {
  active_commitments: [],
  history: [],
  reflection_journal: '',
  resilience_log: {},
};
const MOCK_PLANNING_DATA = {
  okrs: [],
  last_premortem_decision: '2025-01-01',
  vision: '',
  mission: '',
};

/* =========================================================
   Context + API
========================================================= */
const DEFAULT_SERVICES = {
  // navigation + ai
  navigate: () => {},
  callSecureGeminiAPI: async () => ({
    candidates: [{ content: { parts: [{ text: 'API Not Configured' }] } }],
  }),
  hasGeminiKey: () => false,

  // updaters
  updatePdpData: async () => true,
  saveNewPlan: async () => true,
  updateCommitmentData: async () => true,
  updatePlanningData: async () => true,
  updateGlobalMetadata: async () => true,

  // auth/db
  user: null,
  userId: null,
  db: null,
  auth: null,
  isAuthReady: false,

  // live data defaults
  pdpData: MOCK_PDP_DATA,
  commitmentData: MOCK_COMMITMENT_DATA,
  planningData: MOCK_PLANNING_DATA,
  isLoading: false,
  error: null,

  // globals merged in later
  LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK,
};

export const AppServiceContext = createContext(DEFAULT_SERVICES);
export const useAppServices = () => useContext(AppServiceContext);

/* =========================================================
   Helpers (guards + tracing)
========================================================= */
/* ---------- Global metadata resolver (normalizes shape/aliases) ---------- */
export const resolveGlobalMetadata = (meta) => {
  if (!meta || typeof meta !== 'object') return {};
  const known = [
    'LEADERSHIP_DOMAINS',
    'RESOURCE_LIBRARY',
    'READING_CATALOG_SERVICE',
    'COMMITMENT_BANK',
    'SCENARIO_CATALOG',
    'TARGET_REP_CATALOG',
    'LEADERSHIP_TIERS',
    'VIDEO_CATALOG',
    'GLOBAL_SETTINGS',
  ];
  const keys = Object.keys(meta);
  const hasKnown = keys.some((k) => known.includes(k));
  // Unwrap if wrapped under common containers
  let payload = hasKnown ? meta : (meta.config || meta.global || meta.data || meta.payload || {});

  // Alias support for older/newer schema names
  if (payload && !payload.SCENARIO_CATALOG && Array.isArray(meta.QUICK_CHALLENGE_CATALOG)) {
    payload = { ...payload, SCENARIO_CATALOG: meta.QUICK_CHALLENGE_CATALOG };
  }
  if (payload && !payload.TARGET_REP_CATALOG && Array.isArray(meta.TARGET_REPS)) {
    payload = { ...payload, TARGET_REP_CATALOG: meta.TARGET_REPS };
  }
  if (payload && !payload.RESOURCE_LIBRARY && meta.RESOURCE_CONTENT_LIBRARY) {
    payload = { ...payload, RESOURCE_LIBRARY: meta.RESOURCE_CONTENT_LIBRARY };
  }
  return payload || {};
};

const looksEmptyGlobal = (obj) => {
  if (!obj || typeof obj !== 'object') return true;
  const keys = Object.keys(obj);
  if (!keys.length) return true;

  // if it has at least one non-empty known section, treat as non-empty
  const sections = [
    'READING_CATALOG_SERVICE',
    'COMMITMENT_BANK',
    'TARGET_REP_CATALOG',
    'LEADERSHIP_DOMAINS',
    'RESOURCE_LIBRARY',
    'SCENARIO_CATALOG',
    'VIDEO_CATALOG',
    'LEADERSHIP_TIERS',
    'GLOBAL_SETTINGS',
  ];
  const present = sections.filter((k) => Object.prototype.hasOwnProperty.call(obj, k));
  if (!present.length) return false;
  return present.every((k) => {
    const v = obj[k];
    if (Array.isArray(v)) return v.length === 0;
    if (v && typeof v === 'object') return Object.keys(v).length === 0;
    return false;
  });
};

const containsEmptySections = (obj) => {
  if (!obj || typeof obj !== 'object') return [];
  const bad = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) bad.push(k);
  }
  return bad;
};

const traceCallsite = (label = 'updateGlobalMetadata') => {
  try {
    console.groupCollapsed(`[${label}] callsite`);
    console.trace();
    console.groupEnd();
  } catch {}
};

/* =========================================================
   Generic user-doc hook (read + update)
========================================================= */
const useFirestoreData = (db, userId, isAuthReady, suffix, mockData) => {
  const [data, setData] = useState(mockData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const docPath = useMemo(() => mockDoc(db, 'users', userId) + `/${suffix}`, [db, userId, suffix]);

  useEffect(() => {
    if (!isAuthReady || !userId) {
      setIsLoading(false);
      return;
    }
    let unsub = () => {};
    try {
      unsub = onSnapshotEx(db, docPath, (doc) => {
        if (typeof __timeoutId !== 'undefined' && __timeoutId) clearTimeout(__timeoutId);

        if (typeof timeoutId !== 'undefined' && timeoutId) clearTimeout(timeoutId);

        const d = doc.exists() ? doc.data() : mockData;
        try {
          const jsonSize = JSON.stringify(d || {}).length;
          console.log('[USER SNAPSHOT]', suffix, {
            fromCache: doc._md?.fromCache,
            pendingWrites: doc._md?.pendingWrites,
            keys: Object.keys(d || {}),
            bytes: jsonSize,
          });
        } catch {}
        setData(d);
        setIsLoading(false);
        setError(null);
      });
    } catch (e) {
      console.error(`[onSnapshot] ${docPath}`, e);
      setError(e);
      setIsLoading(false);
    }
    let timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn(`Subscribe timeout for ${docPath}`);
        setIsLoading(false);
      }
    }, 15000);
    return () => {
      unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, userId, isAuthReady, docPath]);

  const updateData = useCallback(
    async (updater) => {
      const next = updater(data);
      try {
        await updateDocEx(db, docPath, next);
        return true;
      } catch (e) {
        console.error(`Update failed for ${docPath}`, e);
        return false;
      }
    },
    [db, docPath, data]
  );

  return { data, isLoading, error, updateData, docPath };
};

/* =========================================================
   User-data hooks (API unchanged)
========================================================= */
export const useCommitmentData = (db, userId, isAuthReady) => {
  const {
    data: commitmentData,
    isLoading,
    error,
    updateData: updateCommitmentData,
  } = useFirestoreData(db, userId, isAuthReady, 'commitment_data/scorecard', MOCK_COMMITMENT_DATA);
  return { commitmentData, isLoading, error, updateCommitmentData };
};

export const usePDPData = (db, userId, isAuthReady) => {
  const {
    data: pdpData,
    isLoading,
    error,
    updateData: updatePdpData,
  } = useFirestoreData(db, userId, isAuthReady, 'pdp/roadmap', MOCK_PDP_DATA);

  const saveNewPlan = useCallback(
    async (plan) => {
      const path = mockDoc(db, 'users', userId) + '/pdp/roadmap';
      try {
        await setDocEx(db, path, plan /* overwrite intentionally */);
        return true;
      } catch (e) {
        console.error('New plan save failed', e);
        return false;
      }
    },
    [db, userId]
  );

  return { pdpData, isLoading, error, updatePdpData, saveNewPlan };
};

export const usePlanningData = (db, userId, isAuthReady) => {
  const {
    data: planningData,
    isLoading,
    error,
    updateData: updatePlanningData,
  } = useFirestoreData(db, userId, isAuthReady, 'planning_data/hub', MOCK_PLANNING_DATA);
  return { planningData, isLoading, error, updatePlanningData };
};

/* =========================================================
   Global metadata (read)
========================================================= */
export const useGlobalMetadata = (db, isAuthReady) => {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const path = mockDoc(db, 'metadata', 'config'); // 'metadata/config'

  useEffect(() => {
    if (!isAuthReady) {
      setLoading(false);
      return;
    }
    let unsub = () => {};
    try {
      unsub = onSnapshotEx(db, path, (doc) => {
        if (typeof __timeoutId !== 'undefined' && __timeoutId) clearTimeout(__timeoutId);

        if (typeof timeoutId !== 'undefined' && timeoutId) clearTimeout(timeoutId);

        const d = doc.exists() ? doc.data() : {};
        try {
          const json = JSON.stringify(d || {});
          const keys = Object.keys(d || {});
          const info = {
            fromCache: doc._md?.fromCache,
            pendingWrites: doc._md?.pendingWrites,
            keys,
            bytes: json.length,
            meta: d?._meta || null,
          };
          console.log('[GLOBAL SNAPSHOT]', info);
          if (typeof window !== 'undefined') {
            window.__lastGlobal = d;
            window.__lastGlobalInfo = info;
          }
        } catch {}
        setMetadata(resolveGlobalMetadata(d));
        setLoading(false);
        setError(null);
      });
    } catch (e) {
      console.error('[onSnapshot] metadata/config', e);
      setError(e);
      setLoading(false);
    }

    let timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Global metadata subscribe timeout');
        setLoading(false);
      }
    }, 15000);
    return () => {
      unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, isAuthReady]);

  return { metadata, isLoading: loading, error };
};

/* =========================================================
   Global writer (safe merge + optional force overwrite)
========================================================= */
export const updateGlobalMetadata = async (
  db,
  data,
  {
    merge = true,
    source = 'unknown',
    userId = 'unknown',
    allowEmptySections = false,
    forceOverwrite = false, // if true, rules allow dropping sections (_force_overwrite flag)
  } = {}
) => {
  traceCallsite('updateGlobalMetadata');
  const path = mockDoc(db, 'metadata', 'config');
  const projectId = db?.app?.options?.projectId || 'unknown';

  // Block total empties
  if (looksEmptyGlobal(data)) {
    console.warn(
      `[WRITE ABORTED] metadata/config appears empty. project=${projectId} source=${source}`
    );
    return false;
  }

  // Guard against explicitly empty object sections unless allowed
  const bad = containsEmptySections(data);
  if (!allowEmptySections && bad.length) {
    console.warn(
      `[WRITE ABORTED] payload contains empty object sections: ${bad.join(
        ', '
      )}. Set allowEmptySections=true to override.`
    );
    return false;
  }

  // Stamp meta + optional rules flag
  const now = new Date().toISOString();
  const approxBytes = (() => {
    try {
      return JSON.stringify(data).length;
    } catch {
      return -1;
    }
  })();
  const keys = Object.keys(data || {});
  const _meta = {
    last_write_ts: now,
    last_write_source: source,
    last_write_uid: userId,
    approx_bytes: approxBytes,
    keys,
  };

  const payload = {
    ...data,
    _meta,
  };

  if (forceOverwrite) {
    // This flag is only used by rules to allow dropping sections
    payload._force_overwrite = true;
  }

  try {
    await setDocEx(db, path, payload, merge /* merge by default */);
    console.log(
      `[WRITE OK] project=${projectId} doc=metadata/config merge=${!!merge} source=${source}`
    );
    return true;
  } catch (e) {
    console.error(
      `[WRITE FAIL] project=${projectId} doc=metadata/config source=${source}`,
      e
    );
    return false;
  }
};

/* =========================================================
   Provider factory
========================================================= */
export const createAppServices = ({
  user,
  userId,
  auth,
  db,
  isAuthReady,
  navigate,
  callSecureGeminiAPI = async () => ({ candidates: [] }),
  hasGeminiKey = () => false,
  API_KEY = '',
}) => {
  // user docs
  const pdp = usePDPData(db, userId, isAuthReady);
  const commitment = useCommitmentData(db, userId, isAuthReady);
  const planning = usePlanningData(db, userId, isAuthReady);
  // global
  const global = useGlobalMetadata(db, isAuthReady);

  const isLoading =
    pdp.isLoading || commitment.isLoading || planning.isLoading || global.isLoading;
  const error = pdp.error || commitment.error || planning.error || global.error;

  const hasPendingDailyPractice = (commitment.commitmentData?.active_commitments || []).some(
    (c) => c.status === 'Pending'
  );

  const services = useMemo(
    () => ({
      navigate,
      user,
      userId,
      auth,
      db,
      isAuthReady,
      callSecureGeminiAPI,
      hasGeminiKey,
      API_KEY,

      updatePdpData: pdp.updatePdpData,
      saveNewPlan: pdp.saveNewPlan,
      updateCommitmentData: commitment.updateCommitmentData,
      updatePlanningData: planning.updatePlanningData,

      updateGlobalMetadata: (data, opts) =>
        updateGlobalMetadata(db, data, {
          merge: true,
          source: (opts && opts.source) || 'Provider',
          userId: user?.uid || 'unknown',
          ...(opts || {}),
        }),

      pdpData: pdp.pdpData,
      commitmentData: commitment.commitmentData,
      planningData: planning.planningData,

      isLoading,
      error,
      GEMINI_MODEL,

      // merge all global metadata into the service context (so Admin editor sees it)
      LEADERSHIP_TIERS: global.metadata.LEADERSHIP_TIERS || LEADERSHIP_TIERS_FALLBACK,
      ...resolveGlobalMetadata(global.metadata),

      hasPendingDailyPractice,
    }),
    [
      navigate,
      user,
      userId,
      auth,
      db,
      isAuthReady,
      callSecureGeminiAPI,
      hasGeminiKey,
      API_KEY,
      pdp,
      commitment,
      planning,
      isLoading,
      error,
      global.metadata,
      hasPendingDailyPractice,
    ]
  );

  return services;
};

export default AppServiceContext;
