// src/services/useAppServices.jsx (Final Structural Fix)

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
const mockDoc = (db, c, d) => (c === 'metadata' ? `${c}/${d}` : `${c.replace(/\/$/, '')}/${d}`); // FIX: Handle nested paths for catalog


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

// FALLBACKS for Applied Leadership data (now loaded by useGlobalMetadata)
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
    
    // DEFAULTS ADDED (will be populated by useGlobalMetadata)
    LEADERSHIP_DOMAINS: MOCK_DOMAINS,
    RESOURCE_LIBRARY: MOCK_RESOURCES,
    // isAppliedLeadershipLoading: true, // <-- REMOVED, now part of main isLoading
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
  const known = [ 'LEADERSHIP_TIERS', 'COMMITMENT_BANK', 'SCENARIO_CATALOG', 'READING_CATALOG_SERVICE', 'LEADERSHIP_DOMAINS', 'RESOURCE_LIBRARY' ]; // <-- UPDATED
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
   Global metadata (read) (*** UPDATED ***)
========================================================= */
export const useGlobalMetadata = (db, isAuthReady) => {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- UPDATED: Added new paths based on user feedback ---
  const pathConfig = mockDoc(db, 'metadata', 'config');
  const pathCatalog = mockDoc(db, 'metadata', 'reading_catalog');
  const pathDomains = mockDoc(db, 'metadata/config/catalog', 'leadership_domains');
  const pathResources = mockDoc(db, 'metadata/config/catalog', 'resource_library');

  useEffect(() => {
    if (!isAuthReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    // --- STEP 0: LOG START ---
    console.log(`[*** ABSOLUTE DEBUG START ***] Fetching Global Metadata from: ${pathConfig}, ${pathCatalog}, ${pathDomains}, ${pathResources}`);

    // NEW HELPER: Replicates the transformation logic from the old API hook
    const transformResources = (resourcesItems) => {
        if (!Array.isArray(resourcesItems)) {
            console.warn("Resource library items is not an array, returning empty object.");
            return MOCK_RESOURCES;
        }
        return resourcesItems.reduce((acc, resource) => {
            const domainId = resource.domain_id;
            if (domainId) { 
                acc[domainId] = acc[domainId] || [];
                acc[domainId].push(resource);
            }
            return acc;
        }, {});
    };

    const fetchMetadata = async () => {
      let finalData = {};
      try {
        const [configSnap, catalogSnap, domainsSnap, resourcesSnap] = await Promise.all([
          getDocEx(db, pathConfig),
          getDocEx(db, pathCatalog),
          getDocEx(db, pathDomains),
          getDocEx(db, pathResources),
        ]);

        // --- STEP 1: LOG RAW SNAPSHOT STATUS ---
        console.log(`[DEBUG SNAPSHOT] Config Doc Exists: ${configSnap.exists()}. Catalog Doc Exists: ${catalogSnap.exists()}. Domains Doc Exists: ${domainsSnap.exists()}. Resources Doc Exists: ${resourcesSnap.exists()}`);

        const configData = configSnap.exists() ? configSnap.data() : {};
        const catalogData = catalogSnap.exists() ? catalogSnap.data() : {};
        // Get the 'items' array from the wrapped domain and resource docs
        const domainsItems = domainsSnap.exists() ? (domainsSnap.data()?.items || []) : MOCK_DOMAINS;
        const resourcesItems = resourcesSnap.exists() ? (resourcesSnap.data()?.items || []) : [];
        
        // --- STEP 2: LOG RAW DATA RETURNED ---
        console.log(`[DEBUG RAW DATA] RAW CONFIG: ${JSON.stringify(configData)}`);
        console.log(`[DEBUG RAW DATA] RAW CATALOG: ${JSON.stringify(catalogData)}`);
        console.log(`[DEBUG RAW DATA] RAW DOMAINS (items): ${JSON.stringify(domainsItems)}`);
        console.log(`[DEBUG RAW DATA] RAW RESOURCES (items): ${JSON.stringify(resourcesItems)}`);
        
        // CRITICAL STRUCTURAL MERGE: 
        // 1. Merge the main config document content
        // 2. Explicitly nest the entire catalogData document
        // 3. Explicitly add LEADERSHIP_DOMAINS array
        // 4. Explicitly add *transformed* RESOURCE_LIBRARY object
        finalData = { 
            ...(configData || {}), 
            READING_CATALOG_SERVICE: (catalogData || {}),
            LEADERSHIP_DOMAINS: Array.isArray(domainsItems) ? domainsItems : MOCK_DOMAINS,
            RESOURCE_LIBRARY: transformResources(resourcesItems),
        };
        
        // --- STEP 3: LOG MERGED DATA ---
        console.log(`[DEBUG MERGED] MERGED DATA: ${JSON.stringify(finalData)}`);
        
        // Apply fallback tiers ONLY if the main config document was empty
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
// NOTE: This function is unchanged. It does NOT support writing to the new domain/resource paths.
// This is fine, as the request was only about *reading* data.
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

  // This logic is retained, but does not account for new paths.
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
   NEW HOOK: Applied Leadership Data Fetch (REMOVED)
========================================================= */
// export const useAppliedLeadershipData = ...
// --- This hook (lines 554-610) has been REMOVED ---
// --- Its functionality is now merged into useGlobalMetadata ---


/* =========================================================
   Provider factory (UPDATED: uses all hooks)
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
  
  // NEW HOOK INTEGRATION (REMOVED)
  // const appliedLeadershipHook = useAppliedLeadershipData(isAuthReady); // <-- REMOVED

  // Combined loading state: True if any major piece is loading
  // CRITICAL: Combines all loading flags
  const combinedIsLoading = pdpHook.isLoading || commitmentHook.isLoading || planningHook.isLoading || metadataHook.isLoading; // <-- REMOVED appliedLeadershipHook

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
      // CRITICAL: Merges applied leadership data and its loading flag
      // ...appliedLeadershipHook, // <-- REMOVED
      metadata: resolveGlobalMetadata(metadataHook.metadata),
      
      // Core Configuration
      isLoading: combinedIsLoading,
      error: pdpHook.error || commitmentHook.error || planningHook.error || metadataHook.error || null,
      appId: metadataHook.metadata.APP_ID || 'default-app-id',
      IconMap: metadataHook.metadata.IconMap || {},
      LEADERSHIP_TIERS: tiers,

      // NEW: Pull Applied Leadership data from the (now correct) metadata object
      LEADERSHIP_DOMAINS: metadataHook.metadata.LEADERSHIP_DOMAINS || MOCK_DOMAINS,
      RESOURCE_LIBRARY: metadataHook.metadata.RESOURCE_LIBRARY || MOCK_RESOURCES,

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
    pdpHook, commitmentHook, planningHook, metadataHook, combinedIsLoading, // <-- REMOVED appliedLeadershipHook
  ]);

  return value;
};


export default AppServiceContext;