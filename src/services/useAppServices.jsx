// src/services/useAppServices.jsx (Structural Fix with Exports Added)

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

// ... (mock functions mockDoc, createMockSnapshot, mockSetDoc, mockGetDoc are unchanged) ...
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
const mockDoc = (db, c, d) => (c === 'metadata' ? `${c}/${d}` : `${c}/${d}`);


/* =========================================================
   Real Firestore wrappers (Unchanged)
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


// --- ensureUserDocs: create required per-user docs if missing (Unchanged) ---
export const ensureUserDocs = async (db, uid) => { 
  try {
    if (!db || !uid) return;
    const targets = [
      ['leadership_plan', 'roadmap', { plan_goals: [], last_updated: new Date().toISOString() }],
      ['user_commitments', 'active', { active_commitments: [], reflection_journal: '' }],
      ['user_planning', 'drafts', { drafts: [] }],
    ];
    for (const [col, docName, defaultData] of targets) {
      const path = `${col}/${uid}/profile/${docName}`;
      const snap = await getDocEx(db, path);
      if (!snap || !snap.exists()) {
        await setDocEx(db, path, defaultData, true); // merge:true
        console.log(`[SEED] created ${path}`);
      }
    }
  } catch (err) {
    console.error('[ensureUserDocs] failed:', err);
  }
};


/* =========================================================
   Defaults / fallbacks (UPDATED)
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

// NEW FALLBACKS ADDED FOR APPLIED LEADERSHIP DATA
const MOCK_DOMAINS = []; 
const MOCK_RESOURCES = {}; 


/* =========================================================
   Context + API (UPDATED)
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
    
    // NEW DEFAULTS ADDED
    LEADERSHIP_DOMAINS: MOCK_DOMAINS,
    RESOURCE_LIBRARY: MOCK_RESOURCES,
    isAppliedLeadershipLoading: true, 
};

export const AppServiceContext = createContext(DEFAULT_SERVICES);
export const useAppServices = () => useContext(AppServiceContext);


/* =========================================================
   Helpers (guards + tracing) (Unchanged)
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
      return known.filter(k => Object.prototype.hasOwnProperty.call(obj, k)).every(k => {
          const v = obj[k];
          if (Array.isArray(v)) return v.length === 0;
          if (v && typeof v === 'object') return Object.keys(v).length === 0;
          return false;
      });
  }
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
   User-data hooks (EXPORT ADDED TO FIX BUILD ERROR)
========================================================= */
const SUBCOLLECTION_NAME = 'profile'; 
const MAX_LOAD_TIMEOUT = 1500; 

// Base hook remains internal
const useFirestoreUserData = (db, userId, isAuthReady, collection, document, mockData) => {
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
    
    timeoutId = setTimeout(() => {
        console.warn(`[USER DATA TIMEOUT] Hook for ${document} timed out (${MAX_LOAD_TIMEOUT}ms). Resolving with available data.`);
        resolveLoad(false); 
    }, MAX_LOAD_TIMEOUT);

    let unsubscribe = onSnapshotEx(db, path, (snap) => {
        resolveLoad(); 
        if (snap.exists()) {
            setData(snap.data());
            setError(null);
        } else {
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


// EXPORT ADDED: Resolves the build error
export const usePDPData = (db, userId, isAuthReady) => {
  const { roadmapData, isLoading, error, updateData: updatePdpData } = useFirestoreUserData(db, userId, isAuthReady, 'leadership_plan', 'roadmap', MOCK_PDP_DATA);
  
  const saveNewPlan = useCallback(async (newPlanData) => {
    if (!db || !userId) return;
    const path = `${'leadership_plan'}/${userId}/${SUBCOLLECTION_NAME}/${'roadmap'}`; 
    try {
      await setDocEx(db, path, newPlanData); 
      console.log(`[USER SAVE] PDP roadmap overwritten successfully.`, newPlanData);
    } catch (e) {
      console.error(`[USER SAVE FAILED] PDP roadmap`, e);
      throw e;
    }
  }, [db, userId]);

  return { pdpData: roadmapData, isLoading, error, updatePdpData, saveNewPlan };
};

// EXPORT ADDED: Resolves the build error
export const useCommitmentData = (db, userId, isAuthReady) => {
  const { activeData, isLoading, error, updateData: updateCommitmentData } = useFirestoreUserData(db, userId, isAuthReady, 'user_commitments', 'active', MOCK_COMMITMENT_DATA);
  return { commitmentData: activeData, isLoading, error, updateCommitmentData };
};

// EXPORT ADDED: Resolves the build error
export const usePlanningData = (db, userId, isAuthReady) => {
  const { draftsData, isLoading, error, updateData: updatePlanningData } = useFirestoreUserData(db, userId, isAuthReady, 'user_planning', 'drafts', MOCK_PLANNING_DATA);
  return { planningData: draftsData, isLoading, error, updatePlanningData };
};


/* =========================================================
   Global metadata (read) (Unchanged)
========================================================= */
export const useGlobalMetadata = (db, isAuthReady) => {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const pathConfig = mockDoc(db, 'metadata', 'config');
  const pathCatalog = mockDoc(db, 'metadata', 'reading_catalog');

  useEffect(() => {
    if (!isAuthReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    // --- STEP 0: LOG START ---
    console.log(`[*** ABSOLUTE DEBUG START ***] Fetching Global Metadata from: ${pathConfig} and ${pathCatalog}`);

    const fetchMetadata = async () => {
      let finalData = {};
      try {
        const [configSnap, catalogSnap] = await Promise.all([
          getDocEx(db, pathConfig),
          getDocEx(db, pathCatalog)
        ]);

        // --- STEP 1: LOG RAW SNAPSHOT STATUS ---
        console.log(`[DEBUG SNAPSHOT] Config Doc Exists: ${configSnap.exists()}. Catalog Doc Exists: ${catalogSnap.exists()}`);

        const configData = configSnap.exists() ? configSnap.data() : {};
        const catalogData = catalogSnap.exists() ? catalogSnap.data() : {};
        
        // --- STEP 2: LOG RAW DATA RETURNED ---
        console.log(`[DEBUG RAW DATA] RAW CONFIG: ${JSON.stringify(configData)}`);
        console.log(`[DEBUG RAW DATA] RAW CATALOG: ${JSON.stringify(catalogData)}`);
        
        // CRITICAL STRUCTURAL MERGE FIX: 
        // 1. Merge the main config document content (which includes the VIDEO_CATALOG, etc.)
        // 2. Explicitly nest the entire catalogData document under READING_CATALOG_SERVICE
        finalData = { 
            ...(configData || {}), 
            READING_CATALOG_SERVICE: (catalogData || {}) 
        };
        
        // --- STEP 3: LOG MERGED DATA ---
        console.log(`[DEBUG MERGED] MERGED DATA: ${JSON.stringify(finalData)}`);
        
        // Apply fallback tiers ONLY if the entire config document was empty
        if (Object.keys(configData || {}).length === 0) {
            finalData.LEADERSHIP_TIERS = LEADERSHIP_TIERS_FALLBACK;
            console.warn('[REBUILD READ RESOLVE] Config data was empty. Applied LEADERSHIP_TIERS_FALLBACK.');
        }
        
        setMetadata(finalData); 
        setError(null);
        
        // --- STEP 4: LOG FINAL STATE ---
        console.log(`[DEBUG FINAL] FINAL METADATA STATE SET: ${JSON.stringify(finalData)}`);
        
      } catch (e) {
          console.error("[CRITICAL REBUILD READ FAIL] Document fetch failed.", e);
          setError(e);
      } finally {
          setLoading(false);
      }
    };

    fetchMetadata();
    
  }, [db, isAuthReady]); 

  return { metadata, isLoading: loading, error };
};


/* =========================================================
   Global writer (safe merge + optional force overwrite) (Unchanged)
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

  if (forceDocument === 'catalog' || (payload.READING_CATALOG_SERVICE && forceDocument !== 'config')) {
      path = mockDoc(db, 'metadata', 'reading_catalog');
      payload = payload.READING_CATALOG_SERVICE || payload; 
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
          payload = { catalog: Array.isArray(payload) ? payload : [] };
      }
  } else {
      path = mockDoc(db, 'metadata', 'config');
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
   NEW HOOK: Applied Leadership Data Fetch (EXPORT ADDED)
========================================================= */
// EXPORT ADDED: Resolves the build error
export const useAppliedLeadershipData = (isAuthReady) => {
    const [domains, setDomains] = useState(MOCK_DOMAINS);
    const [resources, setResources] = useState(MOCK_RESOURCES);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Skip fetching if not authenticated or environment is not ready
        if (!isAuthReady) {
            setIsLoading(false);
            return;
        }

        const fetchAppliedData = async () => {
            setIsLoading(true);
            try {
                // ASSUMPTION: Your backend exposes a single endpoint for all applied leadership data
                const response = await fetch('/api/v1/applied-leadership');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // ASSUMPTION: The API returns an object { leadership_domains: [...], resource_library: [...] }
                const { leadership_domains, resource_library } = await response.json();
                
                if (Array.isArray(leadership_domains)) {
                    setDomains(leadership_domains);
                } else {
                    console.error("API response missing 'leadership_domains' array.");
                    setDomains(MOCK_DOMAINS);
                }

                // CRITICAL TRANSFORMATION: Convert the flat resource array into the { [domainId]: [resources] } object
                if (Array.isArray(resource_library)) {
                    const transformedResources = resource_library.reduce((acc, resource) => {
                        const domainId = resource.domain_id;
                        if (domainId) { // Only add if domain_id exists
                            acc[domainId] = acc[domainId] || [];
                            acc[domainId].push(resource);
                        }
                        return acc;
                    }, {});
                    setResources(transformedResources);
                } else {
                    console.error("API response missing 'resource_library' array.");
                    setResources(MOCK_RESOURCES);
                }

            } catch (error) {
                console.error("[APPLIED LEADERSHIP FAIL] Failed to fetch data:", error);
                setDomains(MOCK_DOMAINS);
                setResources(MOCK_RESOURCES);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppliedData();
    }, [isAuthReady]);

    return { 
        LEADERSHIP_DOMAINS: domains, 
        RESOURCE_LIBRARY: resources, 
        isAppliedLeadershipLoading: isLoading 
    };
};


/* =========================================================
   Provider factory (Unchanged Logic, uses all hooks)
========================================================= */
export const createAppServices = ({
  user, userId, auth, db, isAuthReady, navigate,
  callSecureGeminiAPI = async () => ({ candidates: [] }),
  hasGeminiKey = () => false, API_KEY = '',
}) => {
  // Use all the hooks
  const pdpHook = usePDPData(db, userId, isAuthReady);
  const commitmentHook = useCommitmentData(db, userId, isAuthReady);
  const planningHook = usePlanningData(db, userId, isAuthReady);
  const metadataHook = useGlobalMetadata(db, isAuthReady);
  
  // NEW HOOK INTEGRATION
  const appliedLeadershipHook = useAppliedLeadershipData(isAuthReady); 

  // Combined loading state: True if any major piece is loading
  const combinedIsLoading = pdpHook.isLoading || commitmentHook.isLoading || planningHook.isLoading || metadataHook.isLoading || appliedLeadershipHook.isAppliedLeadershipLoading;

  const value = useMemo(() => {
    // Determine Tiers from Metadata or Fallback
    const tiers = metadataHook.metadata.LEADERSHIP_TIERS || LEADERSHIP_TIERS_FALLBACK;
    
    // Check if daily practice data needs attention (e.g., pending tasks)
    const hasPendingDailyPractice = (commitmentHook.commitmentData.active_commitments || []).some(
        c => c.status === 'Pending'
    );
    
    return {
      navigate,
      user,
      userId,
      db,
      auth,
      isAuthReady,
      
      // Data from Hooks
      ...pdpHook,
      ...commitmentHook,
      ...planningHook,
      ...appliedLeadershipHook, // NEW: Applied Leadership Data
      metadata: resolveGlobalMetadata(metadataHook.metadata),
      
      // Core Configuration
      isLoading: combinedIsLoading,
      error: pdpHook.error || commitmentHook.error || planningHook.error || metadataHook.error || null,
      appId: metadataHook.metadata.APP_ID || 'default-app-id',
      IconMap: metadataHook.metadata.IconMap || {},
      LEADERSHIP_TIERS: tiers,

      // AI/API Services
      callSecureGeminiAPI,
      hasGeminiKey,
      GEMINI_MODEL: metadataHook.metadata.GEMINI_MODEL || GEMINI_MODEL,
      API_KEY,
      
      // Other State
      hasPendingDailyPractice,
      
      // Writers
      updatePdpData: pdpHook.updateData,
      saveNewPlan: pdpHook.saveNewPlan,
      updateCommitmentData: commitmentHook.updateData,
      updatePlanningData: planningHook.updateData,
      updateGlobalMetadata: (data, opts) => updateGlobalMetadata(db, data, { ...opts, userId }),
    };
  }, [
    user, userId, db, auth, isAuthReady, navigate, callSecureGeminiAPI, hasGeminiKey, API_KEY,
    pdpHook, commitmentHook, planningHook, metadataHook, appliedLeadershipHook, combinedIsLoading,
  ]);

  return value;
};


export default AppServiceContext;