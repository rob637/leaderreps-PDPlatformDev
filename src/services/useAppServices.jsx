// src/services/useAppServices.jsx (Absolute Final Fix for Blank Global Data)

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
  getDoc as fsGetDoc, 
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
const mockGetDoc = async (docPath) => {
  const d = __firestore_mock_store[docPath];
  return createMockSnapshot(docPath, d || {}, !!d);
};
// Updated mockDoc to handle simple pathing for global metadata
const mockDoc = (db, c, d) => (c === 'metadata' ? `${c}/${d}` : `${c}/${d}`);

/* =========================================================
   Real Firestore wrappers (Modified for GetDocEx only where needed)
========================================================= */
const toDocRef = (db, path) => fsDoc(db, ...path.split('/'));

// onSnapshotEx is maintained but ONLY used for User Data
const onSnapshotEx = (db, path, cb) => {
  if (!db) return () => {}; // No mock necessary if only used for live user data
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

const getDocEx = async (db, path) => {
  if (!db) return mockGetDoc(path);
  const snap = await fsGetDoc(toDocRef(db, path));
  return {
    exists: () => snap.exists(),
    data: () => snap.data(),
    docRef: path,
  };
};

const setDocEx = (db, path, data, merge = false) =>
  db
    ? fsSetDoc(toDocRef(db, path), data, merge ? { merge: true } : undefined)
    : mockSetDoc(path, data);

const updateDocEx = (db, path, data) => setDocEx(db, path, data, true);

/* =========================================================
   Defaults / fallbacks
========================================================= */
const GEMINI_MODEL = 'gemini-2.5-flash'; 
const LEADERSHIP_TIERS_FALLBACK = {
  T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
  T2: { id: 'T2', name: 'Lead Work & Execution', icon: 'Briefcase', color: 'green-600' },
  T3: { id: 'T3', name: 'Lead People & Coaching', icon: 'Users', color: 'yellow-600' },
  T4: { id: 'T4', name: 'Conflict & Team Health', icon: 'AlertTriangle', color: 'red-600' },
  T5: { id: 'T5', name: 'Strategy & Vision', icon: 'TrendingUp', color: 'cyan-600' },
};
const MOCK_PDP_DATA = { plan_goals: [], last_updated: new Date().toISOString() };
const MOCK_COMMITMENT_DATA = { active_commitments: [], reflection_journal: '' };
const MOCK_PLANNING_DATA = { drafts: [] };

/* =========================================================
   Context + API
========================================================= */
const DEFAULT_SERVICES = { 
    navigate: () => console.warn('Navigate not initialized'),
    user: null, 
    userId: null,
    db: null,
    auth: null,
    isAuthReady: false,
    pdpData: MOCK_PDP_DATA,
    commitmentData: MOCK_COMMITMENT_DATA,
    planningData: MOCK_PLANNING_DATA,
    metadata: {},
    isLoading: true,
    error: null,
    appId: 'default-app-id',
    IconMap: {},
    callSecureGeminiAPI: async () => ({ candidates: [] }),
    hasGeminiKey: () => false,
    GEMINI_MODEL: GEMINI_MODEL,
    API_KEY: '',
    LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK,
    hasPendingDailyPractice: false,
    updatePdpData: async () => {},
    saveNewPlan: async () => {},
    updateCommitmentData: async () => {},
    updatePlanningData: async () => {},
    updateGlobalMetadata: async () => {},
};

export const AppServiceContext = createContext(DEFAULT_SERVICES);
export const useAppServices = () => useContext(AppServiceContext);

/* =========================================================
   Helpers (guards + tracing)
========================================================= */
const resolveGlobalMetadata = (meta) => {
  if (!meta || typeof meta !== 'object') return {};
  return meta;
};

const looksEmptyGlobal = (obj) => {
  if (!obj || typeof obj !== 'object') return true;
  const known = [ 'LEADERSHIP_TIERS', 'COMMITMENT_BANK', 'SCENARIO_CATALOG', 'READING_CATALOG_SERVICE' ];
  const hasKnown = known.some((k) => Object.prototype.hasOwnProperty.call(obj, k));
  
  if (hasKnown) {
      // If known keys exist, only consider it empty if they are all empty lists/objects
      return known.filter(k => Object.prototype.hasOwnProperty.call(obj, k)).every(k => {
          const v = obj[k];
          if (Array.isArray(v)) return v.length === 0;
          if (v && typeof v === 'object') return Object.keys(v).length === 0;
          return false;
      });
  }
  // Otherwise, if no known keys exist, check if there are any keys at all.
  return Object.keys(obj).length === 0;
};

const traceCallsite = (label = 'updateGlobalMetadata') => {
  try {
    console.groupCollapsed(`[${label}] callsite`);
    console.trace();
    console.groupEnd();
  } catch {}
};


/* =========================================================
   User-data hooks
========================================================= */
const SUBCOLLECTION_NAME = 'profile'; 
const MAX_LOAD_TIMEOUT = 1500; // 1.5 seconds max wait for the initial snapshot

const useFirestoreUserData = (db, userId, isAuthReady, collection, document, mockData) => {
  // FIX: Path must be 4 segments: Collection / User ID / Subcollection / Document Name
  const path = userId && `${collection}/${userId}/${SUBCOLLECTION_NAME}/${document}`; 
  const [data, setData] = useState(mockData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !userId || !isAuthReady || !path) {
      setData(mockData);
      setLoading(false);
      return;
    }
    setLoading(true);
    let isMounted = true;
    let timeoutId;
    
    const resolveLoad = (shouldStopTimeout = true) => {
        if (isMounted) {
            setLoading(false);
        }
        if (shouldStopTimeout && timeoutId) {
            clearTimeout(timeoutId);
        }
    };
    
    // Set a timeout to resolve loading if the snapshot doesn't arrive quickly
    timeoutId = setTimeout(() => {
        console.warn(`[USER DATA TIMEOUT] Hook for ${document} timed out (${MAX_LOAD_TIMEOUT}ms). Resolving with available data.`);
        resolveLoad(false); 
    }, MAX_LOAD_TIMEOUT);

    let unsubscribe = onSnapshotEx(db, path, (snap) => {
        resolveLoad(); // Resolve loading immediately upon first snapshot (success or failure)
        if (snap.exists()) {
            setData(snap.data());
            setError(null);
        } else {
            // Document doesn't exist, use mock/fallback state
            setData(mockData);
            setError(null);
        }
    });

    return () => {
        isMounted = false;
        if (unsubscribe) unsubscribe();
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, [db, userId, isAuthReady, path, mockData]);

  const updateData = useCallback(async (updates, opts = {}) => {
    if (!db || !userId || !path) return;
    try {
      await updateDocEx(db, path, updates);
      console.log(`[USER UPDATE] ${document} updated successfully.`, updates);
    } catch (e) {
      console.error(`[USER UPDATE FAILED] ${document}`, e);
      throw e;
    }
  }, [db, userId, path, document]);

  return { [`${document}Data`]: data, isLoading: loading, error, updateData };
};


export const usePDPData = (db, userId, isAuthReady) => {
  const { roadmapData, isLoading, error, updateData: updatePdpData } = useFirestoreUserData(db, userId, isAuthReady, 'leadership_plan', 'roadmap', MOCK_PDP_DATA);
  
  const saveNewPlan = useCallback(async (newPlanData) => {
    // FIX: Must use a 4-segment path (Collection/User ID/Subcollection/Document)
    if (!db || !userId) return;
    const path = `${'leadership_plan'}/${userId}/${SUBCOLLECTION_NAME}/${'roadmap'}`; 
    try {
      await setDocEx(db, path, newPlanData); // No merge (overwrite)
      console.log(`[USER SAVE] PDP roadmap overwritten successfully.`, newPlanData);
    } catch (e) {
      console.error(`[USER SAVE FAILED] PDP roadmap`, e);
      throw e;
    }
  }, [db, userId]);

  return { pdpData: roadmapData, isLoading, error, updatePdpData, saveNewPlan };
};

export const useCommitmentData = (db, userId, isAuthReady) => {
  const { activeData, isLoading, error, updateData: updateCommitmentData } = useFirestoreUserData(db, userId, isAuthReady, 'user_commitments', 'active', MOCK_COMMITMENT_DATA);
  return { commitmentData: activeData, isLoading, error, updateCommitmentData };
};

export const usePlanningData = (db, userId, isAuthReady) => {
  const { draftsData, isLoading, error, updateData: updatePlanningData } = useFirestoreUserData(db, userId, isAuthReady, 'user_planning', 'drafts', MOCK_PLANNING_DATA);
  return { planningData: draftsData, isLoading, error, updatePlanningData };
};


/* =========================================================
   Global metadata (read) - REBUILT TO ELIMINATE RACE CONDITIONS
========================================================= */
export const useGlobalMetadata = (db, isAuthReady) => {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const pathConfig = mockDoc(db, 'metadata', 'config');
  const pathCatalog = mockDoc(db, 'metadata', 'reading_catalog');

  // 🛑 NEW LOGIC: Use one-time fetch (GetDoc) for both documents.
  useEffect(() => {
    if (!isAuthReady) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const fetchMetadata = async () => {
      console.groupCollapsed(`[REBUILD READ] Starting concurrent fetch for config/catalog.`);
      let finalData = {};
      try {
        const [configSnap, catalogSnap] = await Promise.all([
          getDocEx(db, pathConfig),
          getDocEx(db, pathCatalog)
        ]);

        const configData = configSnap.exists() ? configSnap.data() : {};
        const catalogData = catalogSnap.exists() ? catalogSnap.data() : {};
        
        // CRITICAL FIX: Direct merge of all data with the catalog nested as expected
        // We ensure that if either data object is null/undefined (which shouldn't happen after snap.data() || {}), 
        // the merge still works.
        finalData = { 
            ...(configData || {}), 
            READING_CATALOG_SERVICE: (catalogData || {}) 
        };
        
        // Apply fallback tiers ONLY if the entire config document was empty
        if (Object.keys(configData || {}).length === 0) {
            finalData.LEADERSHIP_TIERS = LEADERSHIP_TIERS_FALLBACK;
            console.warn('[REBUILD READ RESOLVE] Config data was empty. Applied LEADERSHIP_TIERS_FALLBACK.');
        }
        
        setMetadata(finalData); // SET THE STATE WITH THE MERGED DATA
        setError(null);
        
      } catch (e) {
          console.error("[CRITICAL REBUILD READ FAIL] Document fetch failed.", e);
          setError(e);
      } finally {
          setLoading(false);
          console.groupEnd();
      }
    };

    fetchMetadata();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, isAuthReady]); 

  return { metadata, isLoading: loading, error };
};

/* =========================================================
   Global writer (safe merge + optional force overwrite) (RE-ADDED BODY)
========================================================= */
export const updateGlobalMetadata = async (
  db,
  data,
  { merge = true, source = 'Unknown', userId = 'N/A', forceDocument = 'config' }
) => {
  if (!db) {
    console.warn(`[GLOBAL WRITE MOCK] Skipping write (source: ${source})`);
    return;
  }
  
  traceCallsite('updateGlobalMetadata');

  let path;
  let payload = { ...data };

  // CRITICAL: Determine which document to write to (config or reading_catalog)
  if (forceDocument === 'catalog' || (payload.READING_CATALOG_SERVICE && forceDocument !== 'config')) {
      path = mockDoc(db, 'metadata', 'reading_catalog');
      // If writing to catalog, the payload is the content of the catalog document
      payload = payload.READING_CATALOG_SERVICE || payload; 
      // Ensure the catalog data is an object if it's the target document
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          // If the payload is just the array of items, wrap it in a 'catalog' field for consistency
          payload = { catalog: Array.isArray(payload) ? payload : [] };
      }
  } else {
      // Default to config document
      path = mockDoc(db, 'metadata', 'config');
      // Ensure the catalog isn't accidentally written to the config doc
      if (payload.READING_CATALOG_SERVICE) delete payload.READING_CATALOG_SERVICE;
  }

  try {
    const finalPayload = { 
        ...payload, 
        _updated_at: new Date().toISOString(), 
        _updated_by: userId, 
        _source: source 
    };
    
    await setDocEx(db, path, finalPayload, merge);
    
    console.log(`[GLOBAL WRITE SUCCESS] Document: ${path}. Merge: ${merge}. Keys: ${Object.keys(payload).length}. Source: ${source}`);
    return finalPayload;
    
  } catch (e) {
    console.error(`[GLOBAL WRITE FAILED] Document: ${path}`, e);
    throw new Error(`Failed to update global metadata: ${e.message}`);
  }
};

/* =========================================================
   Provider factory
========================================================= */
export const createAppServices = ({
  user, userId, auth, db, isAuthReady, navigate,
  callSecureGeminiAPI = async () => ({ candidates: [] }),
  hasGeminiKey = () => false, API_KEY = '',
}) => { /* ... */ };

export default AppServiceContext;