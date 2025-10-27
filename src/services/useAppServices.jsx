// src/services/useAppServices.jsx (Final Structural Fix + WHY_CATALOG + COMMITMENT_BANK)

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
// FIX: Handle nested paths for catalog, adjusted slightly for clarity
const mockDoc = (db, ...pathSegments) => pathSegments.join('/');


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
      ['leadership_plan', 'roadmap', { focus_goals: [], last_updated: new Date().toISOString() }], // <-- Corrected key to focus_goals
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
const MOCK_PDP_DATA = { focus_goals: [], last_updated: new Date().toISOString() }; // <-- Corrected key
const MOCK_COMMITMENT_DATA = { active_commitments: [], reflection_journal: '' };
const MOCK_PLANNING_DATA = { drafts: [] };

// FALLBACKS for Applied Leadership data (now loaded by useGlobalMetadata)
const MOCK_DOMAINS = { items: [] }; // <-- UPDATED to be object
const MOCK_RESOURCES = {};

// --- NEW: Fallbacks for Anchor catalogs ---
const MOCK_IDENTITY_CATALOG = { items: [] };
const MOCK_HABIT_CATALOG = { items: [] };
// --- NEW: Fallback for Why catalog ---
const MOCK_WHY_CATALOG = { items: [] };
// --- NEW: Fallback for Commitment Bank ---
const MOCK_COMMITMENT_BANK = { items: [] }; // <-- NEW


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
    planningData: MOCK_PLANNING_DATA, // <-- Added planningData default
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
    updatePlanningData: async () => {}, // <-- Added updatePlanningData default
    updateGlobalMetadata: async () => {},

    // DEFAULTS ADDED (will be populated by useGlobalMetadata)
    LEADERSHIP_DOMAINS: MOCK_DOMAINS,
    RESOURCE_LIBRARY: MOCK_RESOURCES,
    // --- NEW: Add new catalogs to default services ---
    IDENTITY_ANCHOR_CATALOG: MOCK_IDENTITY_CATALOG,
    HABIT_ANCHOR_CATALOG: MOCK_HABIT_CATALOG,
    WHY_CATALOG: MOCK_WHY_CATALOG, // <-- NEW
    COMMITMENT_BANK: MOCK_COMMITMENT_BANK, // <-- NEW
};

export const AppServiceContext = createContext(DEFAULT_SERVICES);
export const useAppServices = () => useContext(AppServiceContext);


/* =========================================================
   Helpers (guards + tracing) (UPDATED)
========================================================= */
const resolveGlobalMetadata = (meta) => {
  if (!meta || typeof meta !== 'object') return {};
  return meta;
};

const looksEmptyGlobal = (obj) => {
  if (!obj || typeof obj !== 'object') return true;
  // --- UPDATED: Added new catalog keys ---
  const known = [ 'LEADERSHIP_TIERS', 'COMMITMENT_BANK', 'SCENARIO_CATALOG', 'READING_CATALOG_SERVICE', 'LEADERSHIP_DOMAINS', 'RESOURCE_LIBRARY', 'IDENTITY_ANCHOR_CATALOG', 'HABIT_ANCHOR_CATALOG', 'WHY_CATALOG' ]; // <-- UPDATED
  const hasKnown = known.some((k) => Object.prototype.hasOwnProperty.call(obj, k));

  if (hasKnown) {
      return known.filter(k => Object.prototype.hasOwnProperty.call(obj, k)).every(k => {
          const v = obj[k];
          // Check if the object itself or its 'items' array is empty
          if (v && typeof v === 'object' && v.hasOwnProperty('items') && Array.isArray(v.items)) {
              return v.items.length === 0;
          }
          if (Array.isArray(v)) return v.length === 0;
          if (v && typeof v === 'object') return Object.keys(v).length === 0;
          return false; // Treat non-objects/arrays as non-empty if they exist
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
      setLoading(false); // Ensure loading is false if prerequisites aren't met
      return;
    }
    setLoading(true);
    let isMounted = true;
    let timeoutId;

    const resolveLoad = (shouldStopTimeout = true) => {
        if (isMounted && loading) { // Only update state if still mounted and loading
            setLoading(false);
        }
        if (shouldStopTimeout && timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null; // Clear timeout ID
        }
    };

    // Ensure initial state is set before listener/timeout
    setData(mockData); // Reset to mock on path change before loading
    setError(null);

    timeoutId = setTimeout(() => {
        console.warn(`[USER DATA TIMEOUT] Hook for ${document} timed out (${MAX_LOAD_TIMEOUT}ms). Path: ${path}. Resolving...`);
        resolveLoad(false); // Resolve loading state even on timeout
    }, MAX_LOAD_TIMEOUT);

    let unsubscribe = onSnapshotEx(db, path, (snap) => {
      if (!isMounted) return; // Prevent state updates if unmounted
      resolveLoad();
      if (snap.exists()) {
          setData(snap.data());
          setError(null);
      } else {
          console.warn(`[USER DATA] Document ${path} does not exist. Using mock data.`);
          setData(mockData); // Use mock data if doc doesn't exist
          setError(null); // No error, just doesn't exist yet
      }
    });

    return () => {
        isMounted = false;
        if (unsubscribe) unsubscribe();
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, [db, userId, isAuthReady, path, document, mockData]); // Added document to dependency array

  const updateData = useCallback(async (updates, opts = {}) => {
    if (!db || !userId || !path) {
        console.error(`[USER UPDATE FAILED] Cannot update ${document}. Missing db, userId, or path.`);
        throw new Error("Update prerequisites not met.");
    }
    try {
      // Ensure the document exists before trying to update specific fields
      // If it might not exist, consider using setDocEx with merge:true instead
      // For simplicity here, assuming the doc exists or updateDocEx handles creation implicitly via merge
      await updateDocEx(db, path, updates);
      console.log(`[USER UPDATE] ${document} updated successfully. Path: ${path}`, updates);
    } catch (e) {
      console.error(`[USER UPDATE FAILED] ${document}. Path: ${path}`, e);
      throw e; // Rethrow to allow calling components to handle
    }
  }, [db, userId, path, document]);

  return { [`${document}Data`]: data, isLoading: loading, error, updateData };
};


// EXPORT ADDED: Resolves the build error
export const usePDPData = (db, userId, isAuthReady) => {
  // --- UPDATED Mock data reference ---
  const { roadmapData, isLoading, error, updateData: updatePdpData } = useFirestoreUserData(db, userId, isAuthReady, 'leadership_plan', 'roadmap', MOCK_PDP_DATA);

  // --- Note: This saveNewPlan overwrites the whole doc. Use updatePdpData for merging. ---
  const saveNewPlan = useCallback(async (newPlanData) => {
    if (!db || !userId) return;
    const path = `${'leadership_plan'}/${userId}/${SUBCOLLECTION_NAME}/${'roadmap'}`;
    try {
      // Use setDocEx to completely replace the document content
      await setDocEx(db, path, newPlanData);
      console.log(`[USER SAVE] PDP roadmap overwritten successfully.`, newPlanData);
    } catch (e) {
      console.error(`[USER SAVE FAILED] PDP roadmap`, e);
      throw e;
    }
  }, [db, userId]);

  // --- Return pdpData (alias for roadmapData) ---
  return { pdpData: roadmapData, isLoading, error, updatePdpData, saveNewPlan };
};

// EXPORT ADDED: Resolves the build error
export const useCommitmentData = (db, userId, isAuthReady) => {
  const { activeData, isLoading, error, updateData: updateCommitmentData } = useFirestoreUserData(db, userId, isAuthReady, 'user_commitments', 'active', MOCK_COMMITMENT_DATA);
  return { commitmentData: activeData, isLoading, error, updateCommitmentData };
};

// EXPORT ADDED: Resolves the build error
export const usePlanningData = (db, userId, isAuthReady) => {
  // --- UPDATED document name to 'roadmap' and collection to 'leadership_plan' ---
  // --- This hook now correctly points to where `focus_goals` lives ---
  const { roadmapData, isLoading, error, updateData: updatePlanningData } = useFirestoreUserData(db, userId, isAuthReady, 'leadership_plan', 'roadmap', MOCK_PDP_DATA);
  // --- Return planningData (alias for roadmapData which contains focus_goals) ---
  return { planningData: roadmapData, isLoading, error, updatePlanningData };
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
  // --- NEW: Add paths for anchor catalogs ---
  const pathIdentity = mockDoc(db, 'metadata/config/catalog', 'IDENTITY_ANCHOR_CATALOG');
  const pathHabit = mockDoc(db, 'metadata/config/catalog', 'HABIT_ANCHOR_CATALOG');
  // --- NEW: Add path for Why catalog ---
  const pathWhy = mockDoc(db, 'metadata/config/catalog', 'WHY_CATALOG');
  // --- NEW: Add path for Commitment Bank ---
  const pathCommitmentBank = mockDoc(db, 'metadata/config/catalog', 'COMMITMENT_BANK'); // <-- NEW


  useEffect(() => {
    if (!isAuthReady) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // --- STEP 0: LOG START (UPDATED) ---
    console.log(`[*** ABSOLUTE DEBUG START ***] Fetching Global Metadata from: ${pathConfig}, ${pathCatalog}, ${pathDomains}, ${pathResources}, ${pathIdentity}, ${pathHabit}, ${pathWhy}, ${pathCommitmentBank}`); // <-- NEW

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
        // --- UPDATED: Added new snaps to Promise.all ---
        const [configSnap, catalogSnap, domainsSnap, resourcesSnap, identitySnap, habitSnap, whySnap, commitmentBankSnap] = await Promise.all([ // <-- NEW
          getDocEx(db, pathConfig),
          getDocEx(db, pathCatalog),
          getDocEx(db, pathDomains),
          getDocEx(db, pathResources),
          getDocEx(db, pathIdentity), 
          getDocEx(db, pathHabit),    
          getDocEx(db, pathWhy),     
          getDocEx(db, pathCommitmentBank), // <-- NEW
        ]);

        // --- STEP 1: LOG RAW SNAPSHOT STATUS (UPDATED) ---
        console.log(`[DEBUG SNAPSHOT] Config Doc Exists: ${configSnap.exists()}. Catalog Doc Exists: ${catalogSnap.exists()}. Domains Doc Exists: ${domainsSnap.exists()}. Resources Doc Exists: ${resourcesSnap.exists()}. Identity Doc Exists: ${identitySnap.exists()}. Habit Doc Exists: ${habitSnap.exists()}. Why Doc Exists: ${whySnap.exists()}. Commitment Bank Exists: ${commitmentBankSnap.exists()}`); // <-- NEW

        const configData = configSnap.exists() ? configSnap.data() : {};
        const catalogData = catalogSnap.exists() ? catalogSnap.data() : {};

        // --- UPDATED: Get full data object, not just items. Fallback to mocks. ---
        const domainsData = domainsSnap.exists() ? domainsSnap.data() : MOCK_DOMAINS;
        const resourcesItems = resourcesSnap.exists() ? (resourcesSnap.data()?.items || []) : []; // This one is special (transformed)
        const identityData = identitySnap.exists() ? identitySnap.data() : MOCK_IDENTITY_CATALOG;
        const habitData = habitSnap.exists() ? habitSnap.data() : MOCK_HABIT_CATALOG;
        const whyData = whySnap.exists() ? whySnap.data() : MOCK_WHY_CATALOG; 
        const commitmentBankData = commitmentBankSnap.exists() ? commitmentBankSnap.data() : MOCK_COMMITMENT_BANK; // <-- NEW

        // --- STEP 2: LOG RAW DATA RETURNED (UPDATED) ---
        console.log(`[DEBUG RAW DATA] RAW CONFIG: ${JSON.stringify(configData)}`);
        console.log(`[DEBUG RAW DATA] RAW CATALOG: ${JSON.stringify(catalogData)}`);
        console.log(`[DEBUG RAW DATA] RAW DOMAINS (full doc): ${JSON.stringify(domainsData)}`);
        console.log(`[DEBUG RAW DATA] RAW RESOURCES (items): ${JSON.stringify(resourcesItems)}`);
        console.log(`[DEBUG RAW DATA] RAW IDENTITY (full doc): ${JSON.stringify(identityData)}`);
        console.log(`[DEBUG RAW DATA] RAW HABIT (full doc): ${JSON.stringify(habitData)}`);
        console.log(`[DEBUG RAW DATA] RAW WHY (full doc): ${JSON.stringify(whyData)}`);
        console.log(`[DEBUG RAW DATA] RAW COMMITMENT BANK (full doc): ${JSON.stringify(commitmentBankData)}`); // <-- NEW

        // CRITICAL STRUCTURAL MERGE:
        // 1. Merge the main config document content
        // 2. Explicitly nest the entire catalogData document
        // 3. Explicitly add LEADERSHIP_DOMAINS (full object)
        // 4. Explicitly add *transformed* RESOURCE_LIBRARY object
        // 5. Explicitly add anchor/why/commitment catalogs (full objects)
        finalData = {
            ...(configData || {}),
            READING_CATALOG_SERVICE: (catalogData || {}),
            LEADERSHIP_DOMAINS: domainsData, // <-- UPDATED (was extracting items)
            RESOURCE_LIBRARY: transformResources(resourcesItems),
            IDENTITY_ANCHOR_CATALOG: identityData, // <-- NEW
            HABIT_ANCHOR_CATALOG: habitData,       // <-- NEW
            WHY_CATALOG: whyData,                  // <-- NEW
            COMMITMENT_BANK: commitmentBankData,   // <-- NEW
        };

        // --- STEP 3: LOG MERGED DATA ---
        console.log(`[DEBUG MERGED] MERGED DATA: ${JSON.stringify(finalData)}`);

        // Apply fallback tiers ONLY if the main config document was empty AND no tiers came from it
        if (!finalData.LEADERSHIP_TIERS || Object.keys(finalData.LEADERSHIP_TIERS).length === 0) {
           if (!configData || !configData.LEADERSHIP_TIERS || Object.keys(configData.LEADERSHIP_TIERS).length === 0) {
              finalData.LEADERSHIP_TIERS = LEADERSHIP_TIERS_FALLBACK;
              console.warn('[REBUILD READ RESOLVE] Config data did not provide LEADERSHIP_TIERS. Applied fallback.');
           }
        }


        setMetadata(finalData);
        setError(null);

        // --- STEP 4: LOG FINAL STATE ---
        console.log(`[DEBUG FINAL] FINAL METADATA STATE SET: ${JSON.stringify(finalData)}`);

      } catch (e) {
          console.error("[CRITICAL REBUILD READ FAIL] Document fetch failed.", e);
          setError(e);
          setMetadata({}); // Clear metadata on error
      } finally {
          setLoading(false);
      }
    };

    fetchMetadata();

  }, [db, isAuthReady]); // Removed path dependencies as they are constant within the hook

  return { metadata, isLoading: loading, error };
};


/* =========================================================
   Global writer (safe merge + optional force overwrite) (Unchanged)
========================================================= */
// NOTE: This function is unchanged. It does NOT support writing to the new domain/resource/anchor/why paths.
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

  // This logic only handles 'config' and 'reading_catalog'
  if (forceDocument === 'catalog' || (payload.READING_CATALOG_SERVICE && forceDocument !== 'config')) {
      path = mockDoc(db, 'metadata', 'reading_catalog');
      payload = payload.READING_CATALOG_SERVICE || payload;
      // Ensure payload is an object, wrapping arrays if necessary
      if (!payload || typeof payload !== 'object') {
           payload = { items: Array.isArray(payload) ? payload : [] }; // Default wrap in 'items'
      } else if (Array.isArray(payload)) {
           payload = { items: payload }; // Wrap existing array in 'items'
      }
  } else {
      path = mockDoc(db, 'metadata', 'config');
      // Clean known nested keys from the top-level config write
      delete payload.READING_CATALOG_SERVICE;
      delete payload.LEADERSHIP_DOMAINS;
      delete payload.RESOURCE_LIBRARY;
      delete payload.IDENTITY_ANCHOR_CATALOG;
      delete payload.HABIT_ANCHOR_CATALOG;
      delete payload.WHY_CATALOG;
      delete payload.COMMITMENT_BANK; // <-- NEW
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
// --- This hook has been REMOVED ---


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
  const planningHook = usePlanningData(db, userId, isAuthReady); // <-- Use the corrected planning hook
  const metadataHook = useGlobalMetadata(db, isAuthReady);

  // Combined loading state: True if any major piece is loading
  const combinedIsLoading = pdpHook.isLoading || commitmentHook.isLoading || planningHook.isLoading || metadataHook.isLoading;

  const value = useMemo(() => {
    // Determine Tiers from Metadata or Fallback
    const tiers = metadataHook.metadata.LEADERSHIP_TIERS || LEADERSHIP_TIERS_FALLBACK;

    // Check if daily practice data needs attention (e.g., pending tasks)
    const hasPendingDailyPractice = (commitmentHook.commitmentData?.active_commitments || []).some(
        c => c.status === 'Pending'
    );

    return {
      navigate,
      user,
      userId,
      db,
      auth,
      isAuthReady,

      // Data from Hooks (using correct aliases)
      pdpData: pdpHook.pdpData, // Use alias from usePDPData
      commitmentData: commitmentHook.commitmentData, // Use alias from useCommitmentData
      planningData: planningHook.planningData, // Use alias from usePlanningData
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

      // --- NEW: Provide anchor/why catalogs to the context ---
      IDENTITY_ANCHOR_CATALOG: metadataHook.metadata.IDENTITY_ANCHOR_CATALOG || MOCK_IDENTITY_CATALOG,
      HABIT_ANCHOR_CATALOG: metadataHook.metadata.HABIT_ANCHOR_CATALOG || MOCK_HABIT_CATALOG,
      WHY_CATALOG: metadataHook.metadata.WHY_CATALOG || MOCK_WHY_CATALOG, // <-- NEW
      COMMITMENT_BANK: metadataHook.metadata.COMMITMENT_BANK || MOCK_COMMITMENT_BANK, // <-- NEW

      // AI/API Services
      callSecureGeminiAPI,
      hasGeminiKey,
      GEMINI_MODEL: metadataHook.metadata.GEMINI_MODEL || GEMINI_MODEL,
      API_KEY,

      // Other State
      hasPendingDailyPractice,

      // Writers (using correct update function names)
      updatePdpData: pdpHook.updatePdpData, // Use alias from usePDPData
      saveNewPlan: pdpHook.saveNewPlan,
      updateCommitmentData: commitmentHook.updateCommitmentData, // Use alias from useCommitmentData
      updatePlanningData: planningHook.updatePlanningData, // Use alias from usePlanningData
      updateGlobalMetadata: (data, opts) => updateGlobalMetadata(db, data, { ...opts, userId }),
    };
  }, [
    user, userId, db, auth, isAuthReady, navigate, callSecureGeminiAPI, hasGeminiKey, API_KEY,
    pdpHook, commitmentHook, planningHook, metadataHook, combinedIsLoading,
  ]);

  return value;
};


export default AppServiceContext; // Default export is the context itself
