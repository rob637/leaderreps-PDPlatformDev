// src/services/useAppServices.jsx (CORRECTED FINAL REBUILD)

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
// Removed mockOnSnapshot to simplify logic to match new getDoc focus
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
   Defaults / fallbacks (Unchanged)
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
   Context + API (Unchanged)
========================================================= */
const DEFAULT_SERVICES = { /* ... */ };
export const AppServiceContext = createContext(DEFAULT_SERVICES);
export const useAppServices = () => useContext(AppServiceContext);

/* =========================================================
   Helpers (guards + tracing) (Unchanged)
========================================================= */
/* ---------- Global metadata resolver (normalizes shape/aliases) ---------- */
const resolveGlobalMetadata = (meta) => {
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
  let payload = hasKnown ? meta : (meta.config || meta.global || meta.data || meta.payload || {});
  // ... Alias support
  if (payload && !payload.SCENARIO_CATALOG && Array.isArray(meta.QUICK_CHALLENGE_CATALOG)) {
    payload = { ...payload, SCENARIO_CATALOG: meta.QUICK_CHALLENGE_CATALOG };
  }
  // ... other aliases
  return payload || {};
};

const looksEmptyGlobal = (obj) => {
  if (!obj || typeof obj !== 'object') return true;
  const sections = [ 'LEADERSHIP_TIERS', 'COMMITMENT_BANK', 'SCENARIO_CATALOG', 'READING_CATALOG_SERVICE' ];
  const present = sections.filter((k) => Object.prototype.hasOwnProperty.call(obj, k));
  if (!present.length) return false;
  return present.every((k) => {
    const v = obj[k];
    if (Array.isArray(v)) return v.length === 0;
    if (v && typeof v === 'object') return Object.keys(v).length === 0;
    return false;
  });
};

const traceCallsite = (label = 'updateGlobalMetadata') => {
  try {
    console.groupCollapsed(`[${label}] callsite`);
    console.trace();
    console.groupEnd();
  } catch {}
};


/* =========================================================
   User-data hooks (RE-ADDED to fix App.jsx import error)
========================================================= */
// This is the common core for user-specific data that requires live listeners (onSnapshotEx)
const useFirestoreUserData = (db, userId, isAuthReady, collection, document, mockData) => {
  const path = userId && `${collection}/${userId}/${document}`;
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

    let unsubscribe = onSnapshotEx(db, path, (snap) => {
      setLoading(false);
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
      if (unsubscribe) unsubscribe();
    };
  }, [db, userId, isAuthReady, path, mockData]);

  // Expose an update function that updates the specific user document
  const updateData = useCallback(async (updates, opts = {}) => {
    if (!db || !userId) return;
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
    // PDP has a special save to overwrite the whole document
    if (!db || !userId) return;
    const path = `${'leadership_plan'}/${userId}/${'roadmap'}`;
    try {
      await setDocEx(db, path, newPlanData); // No merge
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
   Global metadata (read) - REBUILT TO ELIMINATE RACE CONDITIONS (Unchanged)
========================================================= */
export const useGlobalMetadata = (db, isAuthReady) => {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const pathConfig = mockDoc(db, 'metadata', 'config');
  const pathCatalog = mockDoc(db, 'metadata', 'reading_catalog');

  // 🛑 NEW LOGIC: Use one-time fetch (GetDoc) for both documents. 
  // This eliminates the OnSnapshot race condition that caused state corruption.
  useEffect(() => {
    if (!isAuthReady) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const fetchMetadata = async () => {
      console.groupCollapsed(`[REBUILD READ] Starting concurrent fetch for config/catalog.`);
      try {
        // Use Promise.all to fetch both documents simultaneously
        const [configSnap, catalogSnap] = await Promise.all([
          getDocEx(db, pathConfig),
          getDocEx(db, pathCatalog)
        ]);

        const configData = configSnap.exists() ? configSnap.data() : {};
        const catalogData = catalogSnap.exists() ? catalogSnap.data() : {};
        
        const mergedData = { 
            ...configData, 
            READING_CATALOG_SERVICE: catalogData 
        };
        
        console.log(`[REBUILD READ MERGE] Keys from config: ${Object.keys(configData).length}, Keys from catalog: ${Object.keys(catalogData).length}`);
        
        if (Object.keys(mergedData).length > 0) {
            const resolved = resolveGlobalMetadata(mergedData);
            
            // Check for emptiness and apply fallback if necessary
            if (looksEmptyGlobal(resolved)) {
                 resolved.LEADERSHIP_TIERS = LEADERSHIP_TIERS_FALLBACK;
                 console.warn('[REBUILD READ RESOLVE] Fetched empty data. Applied LEADERSHIP_TIERS_FALLBACK.');
            }
            
            console.log(`[REBUILD READ RESOLVE] Final keys: ${Object.keys(resolved).length}`);
            setMetadata(resolved);
            setError(null);
        } else {
             console.warn(`[REBUILD READ RESOLVE] Fetched empty data. No fallback applied.`);
        }
      } catch (e) {
          console.error("[CRITICAL REBUILD READ FAIL] Document fetch failed.", e);
          setError(e);
      } finally {
          setLoading(false);
          console.groupEnd();
      }
    };

    fetchMetadata();
    
    // No return cleanup needed since we are not using a continuous listener.
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

  // CRITICAL: Determine which document to write to
  if (forceDocument === 'catalog' || payload.READING_CATALOG_SERVICE) {
      path = mockDoc(db, 'metadata', 'reading_catalog');
      // If writing to catalog, the payload is the whole catalog document
      payload = payload.READING_CATALOG_SERVICE || payload; 
      if (typeof payload !== 'object' || Array.isArray(payload)) {
          // Wrap if it's just an array, or throw
          payload = { catalog: payload };
      }
  } else {
      // Default to config document (most other metadata)
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
   Provider factory (Unchanged)
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
}) => { /* ... */ };

export default AppServiceContext;