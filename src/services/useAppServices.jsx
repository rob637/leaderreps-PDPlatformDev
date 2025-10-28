// src/services/useAppServices.jsx (Path & Metadata Fetch Fixes Applied, Fully Restored, Enhanced Logging)

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
  updateDoc as fsUpdateDoc, 
  serverTimestamp, 
  FieldValue 
} from 'firebase/firestore';

// --- NEW: Import specific icons used within this service ---
import { HeartPulse, Briefcase, Users, AlertTriangle, TrendingUp, Zap, ShieldCheck, Target, BarChart3, BookOpen, Film, Trello, Mic, Clock, Cpu, User as UserIcon } from 'lucide-react'; 

console.log('🔥🔥🔥 useAppServices.jsx LOADED - Version with Enhanced Logging 🔥🔥🔥');

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
const mockSetDoc = async (docRefPath, data) => {
  __firestore_mock_store[docRefPath] = data;
  console.log(`[MOCK SET] Path: ${docRefPath}`, data); 
  return true;
};
const mockGetDoc = async (docPath) => {
  const d = __firestore_mock_store[docPath];
  console.log(`[MOCK GET] Path: ${docPath}`, d ? '(Found)' : '(Not Found)'); 
  return createMockSnapshot(docPath, d || {}, !!d);
};
const mockDoc = (db, ...pathSegments) => pathSegments.join('/');
const mockUpdateDoc = async (docRefPath, data) => {
    const existingData = __firestore_mock_store[docRefPath] || {};
    __firestore_mock_store[docRefPath] = { ...existingData, ...data };
    console.log(`[MOCK UPDATE] Path: ${docRefPath}`, data); 
    return true;
};


/* =========================================================
   Real Firestore wrappers 
========================================================= */
const toDocRef = (db, path) => fsDoc(db, ...path.split('/'));

const onSnapshotEx = (db, path, cb) => {
  if (!db) {
      console.warn(`[onSnapshotEx] No Firestore DB instance provided for path: ${path}. Using mock (no-op).`);
      return () => {}; 
  }
  try {
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
          }),
          (error) => { 
              console.error(`[onSnapshotEx ERROR] Path: ${path}`, error);
          }
      );
  } catch (error) {
      console.error(`[onSnapshotEx SETUP FAILED] Path: ${path}`, error);
      return () => {}; 
  }
};

const getDocEx = async (db, path) => {
  if (!db) {
      console.warn(`[getDocEx] No Firestore DB instance provided for path: ${path}. Using mock.`);
      return mockGetDoc(path);
  }
  try {
      const snap = await fsGetDoc(toDocRef(db, path));
      return {
          exists: () => snap.exists(),
          data: () => snap.data(),
          docRef: path,
      };
  } catch (error) {
      console.error(`[getDocEx FAILED] Path: ${path}`, error);
      return createMockSnapshot(path, {}, false);
  }
};

const setDocEx = async (db, path, data, merge = false) => {
  console.log(`[setDocEx] ===== START =====`);
  console.log(`[setDocEx] Path: ${path}`);
  console.log(`[setDocEx] Data:`, data);
  console.log(`[setDocEx] Merge: ${merge}`);
  console.log(`[setDocEx] DB exists: ${!!db}`);
  
  if (!db) {
      console.warn(`[setDocEx] No Firestore DB instance provided for path: ${path}. Using mock.`);
      return mockSetDoc(path, data);
  }
  
  try {
      console.log(`[setDocEx] Creating dataWithTimestamp...`);
      const dataWithTimestamp = { ...data, _updatedAt: serverTimestamp() };
      console.log(`[setDocEx] DataWithTimestamp created:`, dataWithTimestamp);
      
      console.log(`[setDocEx] Creating document reference for path: ${path}`);
      const docRef = toDocRef(db, path);
      console.log(`[setDocEx] Document reference created:`, docRef);
      
      console.log(`[setDocEx] Calling fsSetDoc...`);
      await fsSetDoc(docRef, dataWithTimestamp, merge ? { merge: true } : undefined);
      console.log(`[setDocEx SUCCESS] ===== Path: ${path}, Merge: ${merge} =====`);
      return true; 
  } catch (error) {
      console.error(`[setDocEx FAILED] ===== CRITICAL ERROR =====`);
      console.error(`[setDocEx FAILED] Path: ${path}`);
      console.error(`[setDocEx FAILED] Error object:`, error);
      console.error(`[setDocEx FAILED] Error code:`, error?.code);
      console.error(`[setDocEx FAILED] Error message:`, error?.message);
      console.error(`[setDocEx FAILED] Error name:`, error?.name);
      console.error(`[setDocEx FAILED] Full error details:`, { 
        code: error?.code, 
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        toString: error?.toString()
      });
      return false; 
  }
};

const updateDocEx = async (db, path, data) => {
    if (!db) {
        console.warn(`[updateDocEx] No Firestore DB instance provided for path: ${path}. Using mock.`);
        return mockUpdateDoc(path, data);
    }
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        console.warn(`[updateDocEx] Attempted to update with empty data object for path: ${path}. Skipping.`);
        return true; 
    }
    try {
        const dataWithTimestamp = { ...data, _updatedAt: serverTimestamp() };
        console.log(`[updateDocEx] Attempting update to path: ${path}`, { data: dataWithTimestamp });
        await fsUpdateDoc(toDocRef(db, path), dataWithTimestamp);
        console.log(`[updateDocEx SUCCESS] Path: ${path}`, data); 
        return true;
    } catch (error) {
        console.error(`[updateDocEx FAILED] Path: ${path}`, error);
        console.error(`[updateDocEx FAILED] Error details:`, { 
          code: error.code, 
          message: error.message,
          name: error.name 
        });
        return false;
    }
};


// --- ensureUserDocs: Create required per-user docs if missing (PATH FIX APPLIED) ---
export const ensureUserDocs = async (db, uid) => {
  console.log(`[ensureUserDocs] Running for UID: ${uid}`); 
  try {
    if (!db || !uid) {
        console.warn('[ensureUserDocs] DB or UID missing, skipping.');
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0]; 
    const USER_STATE_SUBCOLLECTION = 'user_state'; // Consistent subcollection name for 4-segment path

    // Structure: [collection, docName, defaultData]
    const userDocConfigs = [
      // Development Plan (formerly leadership_plan)
      {
          collection: 'development_plan', 
          docName: 'profile', 
          defaultData: {
              currentCycle: 1,
              createdAt: serverTimestamp(),
              lastAssessmentDate: null,
              assessmentHistory: [], 
              planHistory: [], 
          }
      },
      // Daily Practice (formerly user_commitments)
      {
          collection: 'daily_practice', 
          docName: 'state', 
          defaultData: {
              activeCommitments: [], 
              identityAnchor: '', 
              habitAnchor: '', 
              dailyTargetRepId: null, 
              dailyTargetRepDate: null, 
              dailyTargetRepStatus: 'Pending', 
              streakCount: 0,
              streakCoins: 0,
              lastStatusResetDate: todayStr, 
              arenaMode: true, 
          }
      },
      // Strategic Content (formerly user_planning)
      {
          collection: 'strategic_content', 
          docName: 'data', 
          defaultData: {
              vision: '',
              mission: '',
              okrs: [],
              lastPreMortemDecision: '', 
              risks: [], 
              misalignmentNotes: '', 
              lastAlignmentCheck: null,
          }
      },
    ];

    for (const config of userDocConfigs) {
      // **CRITICAL FIX: Use 4-segment path: collection/uid/user_state/docName**
      const path = `${config.collection}/${uid}/${USER_STATE_SUBCOLLECTION}/${config.docName}`;
      const snap = await getDocEx(db, path);

      if (!snap || !snap.exists()) {
        console.log(`[SEED] Document ${path} missing, creating with defaults.`);
        await setDocEx(db, path, config.defaultData, false); 
      } else {
         // --- Ensure new/required fields exist even if doc exists ---
         const currentData = snap.data();
         let needsUpdate = false;
         const updates = {};

         // Check fields specifically for 'daily_practice/state'
         if (config.collection === 'daily_practice' && config.docName === 'state') {
             if (currentData.dailyTargetRepId === undefined) { updates.dailyTargetRepId = null; needsUpdate = true;}
             if (currentData.dailyTargetRepDate === undefined) { updates.dailyTargetRepDate = null; needsUpdate = true;}
             if (currentData.dailyTargetRepStatus === undefined) { updates.dailyTargetRepStatus = 'Pending'; needsUpdate = true; }
             if (currentData.lastStatusResetDate === undefined) { updates.lastStatusResetDate = todayStr; needsUpdate = true; }
             if (currentData.identityAnchor === undefined) { updates.identityAnchor = ''; needsUpdate = true; }
             if (currentData.habitAnchor === undefined) { updates.habitAnchor = ''; needsUpdate = true; }
             if (currentData.streakCount === undefined) { updates.streakCount = 0; needsUpdate = true; }
             if (currentData.streakCoins === undefined) { updates.streakCoins = 0; needsUpdate = true; }
             if (currentData.arenaMode === undefined) { updates.arenaMode = true; needsUpdate = true; }
             // Remove deprecated field if present
             if (currentData.reflection_journal !== undefined) { updates.reflection_journal = FieldValue.delete(); needsUpdate = true; }
         }
         // Add checks for other collections if needed

         if (needsUpdate) {
             console.log(`[SEED] Document ${path} exists but needs updates. Applying:`, updates);
             // Use updateDocEx to add missing fields without overwriting existing data
             await updateDocEx(db, path, updates);
         } else {
             console.log(`[SEED] Document ${path} exists and is up-to-date.`);
         }
      }
    }
    console.log('[ensureUserDocs] Check complete.'); // Added log
  } catch (err) {
    console.error('[ensureUserDocs] failed:', err);
  }
};


/* =========================================================
   Defaults / fallbacks (Full definitions restored)
========================================================= */
const GEMINI_MODEL = 'gemini-1.5-flash'; // Use flash by default for speed/cost
// --- FALLBACK TIER DATA --- (Incorporating boss's structure/examples)
const LEADERSHIP_TIERS_FALLBACK = {
  T1: { id: 'T1', name: 'Lead Self', icon: HeartPulse, color: 'indigo-500', skills: ['Ownership', 'Mindset Shifts'] },
  T2: { id: 'T2', name: 'Lead Work', icon: Briefcase, color: 'green-600', skills: ['Execution', 'Feedback (CLEAR)', 'Delegation'] },
  T3: { id: 'T3', name: 'Lead People', icon: Users, color: 'yellow-600', skills: ['Coaching', '1:1s', 'Motivation'] },
  T4: { id: 'T4', name: 'Lead Teams', icon: AlertTriangle, color: 'red-600', skills: ['Conflict', 'Team Health', 'Accountability'] },
  T5: { id: 'T5', name: 'Lead Strategy', icon: TrendingUp, color: 'cyan-600', skills: ['Vision', 'Decision Making'] },
};
// --- MOCK USER DATA w/ RENAMED COLLECTIONS & NEW FIELDS ---
const MOCK_DEVELOPMENT_PLAN_DATA = { currentCycle: 1, currentPlan: null, assessmentHistory: [], planHistory: [] };
const MOCK_DAILY_PRACTICE_DATA = { activeCommitments: [], identityAnchor: '', habitAnchor: '', dailyTargetRepId: null, dailyTargetRepDate: null, dailyTargetRepStatus: 'Pending', streakCount: 0, streakCoins: 0, lastStatusResetDate: new Date().toISOString().split('T')[0], arenaMode: true };
const MOCK_STRATEGIC_CONTENT_DATA = { vision: '', mission: '', okrs: [], lastPreMortemDecision: '', risks: [], misalignmentNotes: '' };

// --- MOCK GLOBAL METADATA (Catalogs - using boss's names where applicable) ---
const MOCK_FEATURE_FLAGS = { enableCommunity: true, enableLabsAdvanced: false, enablePlanningHub: true }; // NEW
const MOCK_REP_LIBRARY = { items: [] }; // Central library, maps to TARGET_REP_CATALOG and COMMITMENT_BANK conceptually
const MOCK_EXERCISE_LIBRARY = { items: [] }; // NEW conceptual mapping
const MOCK_WORKOUT_LIBRARY = { items: [] }; // NEW
const MOCK_COURSE_LIBRARY = { items: [] }; // NEW
const MOCK_SKILL_CATALOG = { items: [] }; // Maps to LEADERSHIP_DOMAINS/SKILL_CONTENT_LIBRARY
// Anchor/Why Catalogs remain conceptually similar
export const MOCK_IDENTITY_ANCHOR_CATALOG = { items: ["prioritizes psychological safety", "leads with vulnerability", "holds myself and others accountable"] };
export const MOCK_HABIT_ANCHOR_CATALOG = { items: ["After my morning coffee", "Before my first meeting", "During my commute", "After lunch"] };
export const MOCK_WHY_CATALOG = { items: ["To empower my team to do their best work", "To build a high-performing, high-trust culture", "To achieve our ambitious goals together"] };
// Catalogs for specific content types
const MOCK_READING_CATALOG = { items: [] }; // Renamed from READING_CATALOG_SERVICE
const MOCK_VIDEO_CATALOG = { items: [] };
const MOCK_SCENARIO_CATALOG = { items: [] };
const MOCK_RESOURCE_LIBRARY_ITEMS = { items: [] }; // For Applied Leadership resources, needs transformation

// --- MOCK ADMIN CONFIG ---
export const ADMIN_EMAILS = ["rob@sagecg.com", "ryan@leaderreps.com", "ryanyeoman@gmail.com", "christina@leaderreps.com", "jeff@leaderreps.com"]; // Add emails of admins here
const ADMIN_PASSWORD = "7777"; // Simple password for admin functions screen


/* =========================================================
   Context + API (Full definitions restored)
========================================================= */
const DEFAULT_SERVICES = {
    // Core App
    navigate: () => console.warn('Navigate not initialized'),
    user: null, userId: null, db: null, auth: null, isAuthReady: false, isLoading: true, error: null,
    // User Data
    developmentPlanData: MOCK_DEVELOPMENT_PLAN_DATA,
    dailyPracticeData: MOCK_DAILY_PRACTICE_DATA,
    strategicContentData: MOCK_STRATEGIC_CONTENT_DATA,
    // Global Metadata / Value Sets
    metadata: {}, featureFlags: MOCK_FEATURE_FLAGS, LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK,
    REP_LIBRARY: MOCK_REP_LIBRARY, EXERCISE_LIBRARY: MOCK_EXERCISE_LIBRARY, WORKOUT_LIBRARY: MOCK_WORKOUT_LIBRARY,
    COURSE_LIBRARY: MOCK_COURSE_LIBRARY, SKILL_CATALOG: MOCK_SKILL_CATALOG, IDENTITY_ANCHOR_CATALOG: MOCK_IDENTITY_ANCHOR_CATALOG,
    HABIT_ANCHOR_CATALOG: MOCK_HABIT_ANCHOR_CATALOG, WHY_CATALOG: MOCK_WHY_CATALOG, READING_CATALOG: MOCK_READING_CATALOG,
    VIDEO_CATALOG: MOCK_VIDEO_CATALOG, SCENARIO_CATALOG: MOCK_SCENARIO_CATALOG, RESOURCE_LIBRARY: {}, IconMap: {},
    // AI/API Services
    callSecureGeminiAPI: async () => ({ candidates: [] }), hasGeminiKey: () => false, GEMINI_MODEL: GEMINI_MODEL, API_KEY: '',
    // Derived State & Functions
    isAdmin: false, hasPendingDailyPractice: false,
    // Writers
    updateDevelopmentPlanData: async () => false, updateDailyPracticeData: async () => false,
    updateStrategicContentData: async () => false, updateGlobalMetadata: async () => ({}),
};

export const AppServiceContext = createContext(DEFAULT_SERVICES);
export const useAppServices = () => useContext(AppServiceContext);


/* =========================================================
   Helpers (Full definitions restored)
========================================================= */
const resolveGlobalMetadata = (meta) => {
  // Add safety check
  return (meta && typeof meta === 'object') ? meta : {};
};

const looksEmptyGlobal = (obj) => {
  if (!obj || typeof obj !== 'object') return true;
  // --- UPDATED: Check against new catalog/config structure ---
  const knownKeys = [
      'LEADERSHIP_TIERS', 'featureFlags', 'REP_LIBRARY', 'EXERCISE_LIBRARY', 'WORKOUT_LIBRARY',
      'COURSE_LIBRARY', 'SKILL_CATALOG', 'IDENTITY_ANCHOR_CATALOG', 'HABIT_ANCHOR_CATALOG',
      'WHY_CATALOG', 'READING_CATALOG', 'VIDEO_CATALOG', 'SCENARIO_CATALOG', 'RESOURCE_LIBRARY_ITEMS', // Check raw items before transform
      'IconMap', 'GEMINI_MODEL', 'APP_ID'
  ];
  const hasKnown = knownKeys.some((k) => Object.prototype.hasOwnProperty.call(obj, k));

  if (hasKnown) {
      // Check if all *present* known keys point to empty values (empty object, empty array, or empty 'items' array)
      return knownKeys.filter(k => Object.prototype.hasOwnProperty.call(obj, k)).every(k => {
          const v = obj[k];
          if (v && typeof v === 'object' && v.hasOwnProperty('items') && Array.isArray(v.items)) { return v.items.length === 0; }
          if (Array.isArray(v)) { return v.length === 0; }
          if (v && typeof v === 'object') { return Object.keys(v).length === 0; }
          return !v; // Treat null/undefined/false/0 as empty
      });
  }
  // If no known keys are present, check if the object is empty overall
  return Object.keys(obj).length === 0;
};
const traceCallsite = (label = 'updateGlobalMetadata') => { /* ... */ };


/* =========================================================
   User-data hooks (PATH FIX APPLIED)
========================================================= */
const MAX_LOAD_TIMEOUT = 2500; // Increased timeout slightly
const USER_STATE_SUBCOLLECTION = 'user_state'; // **FIX: Consistent subcollection name**

// --- Base Hook (Internal) ---
const useFirestoreUserData = (db, userId, isAuthReady, collection, document, mockData) => {
  // **FIX: Use 4-segment path: collection/uid/user_state/docName**
  const path = userId ? `${collection}/${userId}/${USER_STATE_SUBCOLLECTION}/${document}` : null;
  const [data, setData] = useState(mockData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // --- Prerequisites Check ---
    if (!db || !userId || !isAuthReady || !path) {
      console.log(`[useFirestoreUserData ${collection}/${document}] Prerequisites not met (DB: ${!!db}, UserID: ${!!userId}, AuthReady: ${isAuthReady}, Path: ${path}). Using mock data.`);
      setData(mockData);
      setLoading(false); // Ensure loading is false
      setError(null);
      return () => {}; // Return empty cleanup
    }

    console.log(`[useFirestoreUserData ${collection}/${document}] Initializing listener for path: ${path}`);
    setLoading(true);
    setData(mockData); // Reset to mock on path change before loading
    setError(null);

    let isMounted = true;
    let timeoutId = null;
    let unsubscribe = null;

    const resolveLoad = (shouldStopTimeout = true) => {
        if (isMounted && loading) { setLoading(false); }
        if (shouldStopTimeout && timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
    };

    // --- Timeout Logic ---
    timeoutId = setTimeout(() => {
        console.warn(`[USER DATA TIMEOUT] Hook for ${document} timed out (${MAX_LOAD_TIMEOUT}ms). Path: ${path}. Resolving with current state (might be mock).`);
        resolveLoad(false); // Resolve loading state
    }, MAX_LOAD_TIMEOUT);

    // --- Firestore Listener ---
    try {
        unsubscribe = onSnapshotEx(db, path, (snap) => {
          if (!isMounted) { console.log(`[useFirestoreUserData ${collection}/${document}] Unmounted before snapshot received. Path: ${path}`); return; }

          resolveLoad(); // Clear timeout on successful snapshot

          if (snap.exists()) {
              console.log(`[useFirestoreUserData ${collection}/${document}] Snapshot received (Exists). Path: ${path}`);
              const fetchedData = snap.data();
              // --- Daily Reset Logic (specific to daily_practice/state) ---
              if (collection === 'daily_practice' && document === 'state') {
                  const todayStr = new Date().toISOString().split('T')[0];
                  let updatesNeeded = {};
                  let needsDBUpdate = false;

                  // 1. Check if Status Reset is needed
                  if (fetchedData.lastStatusResetDate !== todayStr) {
                      console.log(`[DAILY RESET ${collection}/${document}] Date mismatch (${fetchedData.lastStatusResetDate} vs ${todayStr}). Resetting statuses.`);
                      updatesNeeded.lastStatusResetDate = todayStr;
                      updatesNeeded.dailyTargetRepStatus = 'Pending'; // Reset target rep status
                      updatesNeeded.activeCommitments = (fetchedData.activeCommitments || []).map(c => ({ ...c, status: 'Pending' })); // Reset additional reps
                      needsDBUpdate = true;
                  } else {
                      // Ensure current data reflects potentially missed updates if app was closed
                      updatesNeeded.lastStatusResetDate = fetchedData.lastStatusResetDate;
                      updatesNeeded.dailyTargetRepStatus = fetchedData.dailyTargetRepStatus || 'Pending';
                      updatesNeeded.activeCommitments = fetchedData.activeCommitments || [];
                  }
                   // 2. Check if Target Rep Date needs update (if ID exists but date is old/null)
                   // This assumes the *selection* logic happens elsewhere (e.g., Dashboard)
                   // Here, we just ensure the date field is consistent if an ID is present.
                  if (fetchedData.dailyTargetRepId && fetchedData.dailyTargetRepDate !== todayStr) {
                       console.log(`[DAILY RESET ${collection}/${document}] Target Rep ID ${fetchedData.dailyTargetRepId} exists, but date is old (${fetchedData.dailyTargetRepDate}). Updating date.`);
                       updatesNeeded.dailyTargetRepDate = todayStr;
                       // Keep existing ID and status (status reset handled above)
                       updatesNeeded.dailyTargetRepId = fetchedData.dailyTargetRepId;
                       needsDBUpdate = true; // Ensure date update is saved
                  } else if (fetchedData.dailyTargetRepId) {
                       // Ensure current data reflects potentially missed updates
                       updatesNeeded.dailyTargetRepDate = fetchedData.dailyTargetRepDate;
                       updatesNeeded.dailyTargetRepId = fetchedData.dailyTargetRepId;
                  } else {
                        // No target rep ID set
                       updatesNeeded.dailyTargetRepDate = null;
                       updatesNeeded.dailyTargetRepId = null;
                  }


                  // Apply local updates immediately for UI responsiveness
                  const locallyUpdatedData = { ...fetchedData, ...updatesNeeded };
                  setData(locallyUpdatedData); // Update local state

                  // Trigger background DB update if needed
                  if (needsDBUpdate) {
                      console.log(`[DAILY RESET ${collection}/${document}] Triggering background Firestore update for path: ${path}`, updatesNeeded);
                      updateDocEx(db, path, updatesNeeded).catch(err => {
                          console.error(`[DAILY RESET ${collection}/${document}] Background update failed for path: ${path}`, err);
                          // Optional: Set an error state?
                      });
                  }

              } else {
                  // For other collections, just set the data
                  setData(fetchedData);
              }
              setError(null);
          } else {
              console.warn(`[useFirestoreUserData ${collection}/${document}] Document does not exist. Path: ${path}. Using mock data.`);
              setData(mockData); // Use mock data if doc doesn't exist
              setError(null); // No error, just doesn't exist yet
          }
        });
    } catch (error) {
         console.error(`[useFirestoreUserData ${collection}/${document}] Failed to set up listener for path: ${path}`, error);
         setError(error);
         resolveLoad(); // Resolve loading state on setup error
    }

    // --- Cleanup ---
    // Return consistent structure
console.log(`🚨 useFirestoreUserData RETURNING for ${document}:`, JSON.stringify({ 
  hasData: !!data, 
  isLoading: loading, 
  hasError: !!error, 
  hasUpdateData: !!updateData,
  updateDataType: typeof updateData 
}));
return () => {
        console.log(`[useFirestoreUserData ${collection}/${document}] Cleaning up listener. Path: ${path}`);
        isMounted = false;
        if (unsubscribe) unsubscribe();
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, [db, userId, isAuthReady, collection, document, path, mockData]); // Added path to dependencies

  // --- Update Function ---
  const updateData = useCallback(async (updatesOrFn) => {
    console.log('🚨🚨🚨 UPDATE DATA FUNCTION CALLED - NEW VERSION 🚨🚨🚨');
    console.log(`[USER UPDATE] ===== START UPDATE for ${document} =====`);
    console.log(`[USER UPDATE] ===== START UPDATE for ${document} =====`);
    console.log(`[USER UPDATE] DB exists: ${!!db}`);
    console.log(`[USER UPDATE] UserID: ${userId}`);
    console.log(`[USER UPDATE] Path: ${path}`);
    
    if (!db || !userId || !path) {
        console.error(`[USER UPDATE FAILED] Cannot update ${document}. Missing prerequisites.`);
        console.error(`[USER UPDATE FAILED] DB: ${!!db}, UserID: ${!!userId}, Path: ${path}`);
        return false; // Return failure indicator
    }
    
    try {
      let finalUpdates;
      if (typeof updatesOrFn === 'function') {
          console.log(`[USER UPDATE] Applying functional update...`);
          const currentState = data;
          finalUpdates = updatesOrFn(currentState);
      } else {
          console.log(`[USER UPDATE] Using direct updates...`);
          finalUpdates = updatesOrFn;
      }
      
      console.log(`[USER UPDATE] Final updates:`, finalUpdates);

      // Add safety check for empty updates
       if (!finalUpdates || typeof finalUpdates !== 'object' || Object.keys(finalUpdates).length === 0) {
           console.warn(`[USER UPDATE SKIPPED] ${document}. No valid updates provided. Path: ${path}`);
           return true; // No-op is considered success
       }

      console.log(`[USER UPDATE] Calling setDocEx with merge:true...`);
      const success = await setDocEx(db, path, finalUpdates, true);
      console.log(`[USER UPDATE] setDocEx returned: ${success}`);
      
      if (success) {
          console.log(`[USER UPDATE SUCCESS] ===== ${document}. Path: ${path} =====`);
          return true;
      } else {
          console.error(`[USER UPDATE FAILED] ===== setDocEx returned false for ${document}. Path: ${path} =====`);
          return false;
      }
    } catch (e) {
      console.error(`[USER UPDATE EXCEPTION] ===== ${document}. Path: ${path} =====`);
      console.error(`[USER UPDATE EXCEPTION] Error:`, e);
      return false;
    }
  }, [db, userId, path, document, data]);

  // Return consistent structure
  return { data, isLoading: loading, error, updateData };
};


// --- Specific Hooks (Renamed) ---
export const useDevelopmentPlanData = (db, userId, isAuthReady) => {
  const { data, isLoading, error, updateData } = useFirestoreUserData(db, userId, isAuthReady, 'development_plan', 'profile', MOCK_DEVELOPMENT_PLAN_DATA);
  // FIX: Ensure updateData is a defined function reference (even if it's async () => false)
  return { developmentPlanData: data, isLoading, error, updateDevelopmentPlanData: updateData ?? (async () => false) };
};

export const useDailyPracticeData = (db, userId, isAuthReady) => {
  const { data, isLoading, error, updateData } = useFirestoreUserData(db, userId, isAuthReady, 'daily_practice', 'state', MOCK_DAILY_PRACTICE_DATA);
  // FIX: Ensure updateData is a defined function reference
  return { dailyPracticeData: data, isLoading, error, updateDailyPracticeData: updateData ?? (async () => false) };
};

export const useStrategicContentData = (db, userId, isAuthReady) => {
  const { data, isLoading, error, updateData } = useFirestoreUserData(db, userId, isAuthReady, 'strategic_content', 'data', MOCK_STRATEGIC_CONTENT_DATA);
  // FIX: Ensure updateData is a defined function reference
  return { strategicContentData: data, isLoading, error, updateStrategicContentData: updateData ?? (async () => false) };
};


/* =========================================================
   Global metadata (read) (CATALOG FETCH FIX APPLIED)
========================================================= */
const PATH_CATALOG_BASE = 'metadata/config/catalog';
const CATALOG_DOC_NAMES = [
    'REP_LIBRARY', 'EXERCISE_LIBRARY', 'WORKOUT_LIBRARY', 'COURSE_LIBRARY', 'SKILL_CATALOG', 
    'IDENTITY_ANCHOR_CATALOG', 
    // CRITICAL FIX: Typo in 'HABIT_ANCHOR_CATALOG' corrected from 'HABIT_ANCHUR_CATALOG'
    'HABIT_ANCHOR_CATALOG', 
    'WHY_CATALOG', 'VIDEO_CATALOG', 
    'SCENARIO_CATALOG', 'RESOURCE_LIBRARY_ITEMS'
];

export const useGlobalMetadata = (db, isAuthReady) => {
  const [metadata, setMetadata] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Simplified Paths ---
  const pathConfig = mockDoc(db, 'metadata', 'config'); // Main config doc
  // Catalogs are now nested under config OR separate like reading_catalog
  const pathReadingCatalog = mockDoc(db, 'metadata', 'reading_catalog'); // Separate

  useEffect(() => {
    if (!isAuthReady) {
      setLoading(false);
      console.log('[useGlobalMetadata] Auth not ready, skipping fetch.');
      return;
    }
    setLoading(true);
    setMetadata({}); // Clear previous state
    setError(null);
    console.log(`[useGlobalMetadata] Fetching from: ${pathConfig} and multiple catalog docs...`);

    // --- Resource Transformation Helper (Unchanged) ---
    const transformResources = (resourcesData) => {
        const items = resourcesData?.items;
        if (!Array.isArray(items)) {
            console.warn("[transformResources] Resource library items is not an array, returning empty object.", resourcesData);
            return {};
        }
        return items.reduce((acc, resource) => {
            const domainId = resource.domain_id; // Assuming skill_id maps to domain_id now
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
        const [configSnap, readingCatalogSnap] = await Promise.all([
          getDocEx(db, pathConfig),
          getDocEx(db, pathReadingCatalog),
        ]);

        console.log(`[DEBUG SNAPSHOT] Config Doc Exists: ${configSnap.exists()}. Reading Catalog Doc Exists: ${readingCatalogSnap.exists()}.`);

        const configData = configSnap.exists() ? configSnap.data() : {};
        const readingCatalogData = readingCatalogSnap.exists() ? readingCatalogSnap.data() : MOCK_READING_CATALOG; // Use fallback

        console.log(`[DEBUG RAW DATA] RAW CONFIG: ${JSON.stringify(configData)}`);
        console.log(`[DEBUG RAW DATA] RAW READING CATALOG: ${JSON.stringify(readingCatalogData)}`);

        // **FIX: Fetch all catalogs from the subcollection as individual documents**
        const catalogPromises = CATALOG_DOC_NAMES.map(docName => 
            getDocEx(db, `${PATH_CATALOG_BASE}/${docName}`)
        );
        const catalogSnaps = await Promise.all(catalogPromises);
        
        // Assemble the catalog data from the fetched documents
        const catalogResults = {};
        catalogSnaps.forEach((snap, index) => {
            const docName = CATALOG_DOC_NAMES[index];
            if (snap.exists()) {
                catalogResults[docName] = snap.data();
            } else {
                // Assign mock fallback based on document name (manual mapping required here)
                switch (docName) {
                    case 'REP_LIBRARY': catalogResults[docName] = MOCK_REP_LIBRARY; break;
                    case 'EXERCISE_LIBRARY': catalogResults[docName] = MOCK_EXERCISE_LIBRARY; break;
                    case 'WORKOUT_LIBRARY': catalogResults[docName] = MOCK_WORKOUT_LIBRARY; break;
                    case 'COURSE_LIBRARY': catalogResults[docName] = MOCK_COURSE_LIBRARY; break;
                    case 'SKILL_CATALOG': catalogResults[docName] = MOCK_SKILL_CATALOG; break;
                    case 'IDENTITY_ANCHOR_CATALOG': catalogResults[docName] = MOCK_IDENTITY_ANCHOR_CATALOG; break;
                    case 'HABIT_ANCHOR_CATALOG': catalogResults[docName] = MOCK_HABIT_ANCHOR_CATALOG; break;
                    case 'WHY_CATALOG': catalogResults[docName] = MOCK_WHY_CATALOG; break;
                    case 'VIDEO_CATALOG': catalogResults[docName] = MOCK_VIDEO_CATALOG; break;
                    case 'SCENARIO_CATALOG': catalogResults[docName] = MOCK_SCENARIO_CATALOG; break;
                    case 'RESOURCE_LIBRARY_ITEMS': catalogResults[docName] = MOCK_RESOURCE_LIBRARY_ITEMS; break;
                    default: catalogResults[docName] = { items: [] };
                }
                console.warn(`[DEBUG CATALOG] Catalog document ${docName} not found. Using mock/default.`);
            }
        });


        // --- MERGE FINAL DATA ---
        finalData = {
            ...(configData || {}), // Spread top-level config fields (APP_ID, GEMINI_MODEL, IconMap, featureFlags, LEADERSHIP_TIERS)
            // Spread the explicitly fetched catalog documents
            REP_LIBRARY: catalogResults.REP_LIBRARY || MOCK_REP_LIBRARY,
            EXERCISE_LIBRARY: catalogResults.EXERCISE_LIBRARY || MOCK_EXERCISE_LIBRARY,
            WORKOUT_LIBRARY: catalogResults.WORKOUT_LIBRARY || MOCK_WORKOUT_LIBRARY,
            COURSE_LIBRARY: catalogResults.COURSE_LIBRARY || MOCK_COURSE_LIBRARY,
            SKILL_CATALOG: catalogResults.SKILL_CATALOG || MOCK_SKILL_CATALOG,
            IDENTITY_ANCHOR_CATALOG: catalogResults.IDENTITY_ANCHOR_CATALOG || MOCK_IDENTITY_ANCHOR_CATALOG,
            HABIT_ANCHOR_CATALOG: catalogResults.HABIT_ANCHOR_CATALOG || MOCK_HABIT_ANCHOR_CATALOG,
            WHY_CATALOG: catalogResults.WHY_CATALOG || MOCK_WHY_CATALOG,
            VIDEO_CATALOG: catalogResults.VIDEO_CATALOG || MOCK_VIDEO_CATALOG,
            SCENARIO_CATALOG: catalogResults.SCENARIO_CATALOG || MOCK_SCENARIO_CATALOG,
            READING_CATALOG: readingCatalogData, // From separate doc
            RESOURCE_LIBRARY: transformResources(catalogResults.RESOURCE_LIBRARY_ITEMS || MOCK_RESOURCE_LIBRARY_ITEMS), // Transformed

            // Ensure essential config fields have fallbacks 
            featureFlags: configData.featureFlags || MOCK_FEATURE_FLAGS,
            LEADERSHIP_TIERS: configData.LEADERSHIP_TIERS || LEADERSHIP_TIERS_FALLBACK,
            IconMap: configData.IconMap || {},
            GEMINI_MODEL: configData.GEMINI_MODEL || GEMINI_MODEL,
            APP_ID: configData.APP_ID || 'default-app-id',
        };

        // Remove the potentially large 'catalog' field if it existed in raw configData
        delete finalData.catalog;
        // Also remove the raw resource items if they existed at top level
        delete finalData.RESOURCE_LIBRARY_ITEMS;


        console.log(`[DEBUG MERGED] MERGED DATA: ${JSON.stringify(Object.keys(finalData))}`); // Log keys for brevity

        setMetadata(finalData);
        setError(null);
        console.log(`[DEBUG FINAL] FINAL METADATA STATE SET. Keys: ${Object.keys(finalData).join(', ')}`);

      } catch (e) {
          console.error("[CRITICAL GLOBAL READ FAIL] Metadata fetch failed.", e);
          setError(e);
          setMetadata({ // Set minimal fallbacks on error
              featureFlags: MOCK_FEATURE_FLAGS,
              LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK,
              IconMap: {},
              GEMINI_MODEL: GEMINI_MODEL,
              APP_ID: 'error-app-id',
          });
      } finally {
          setLoading(false);
      }
    };

    fetchMetadata();

  }, [db, isAuthReady]); // Dependencies

  return { metadata, isLoading: loading, error };
};


/* =========================================================
   Global writer (Full definitions restored)
========================================================= */
export const updateGlobalMetadata = async (
  db,
  data,
  { merge = true, source = 'Unknown', userId = 'N/A', forceDocument = 'config' } 
) => {
  if (!db) {
    console.warn(`[GLOBAL WRITE MOCK] Skipping write (source: ${source})`);
    return data; 
  }

  // --- traceCallsite definition added back ---
  const traceCallsite = (label = 'updateGlobalMetadata') => { /* ... */ }; 
  traceCallsite('updateGlobalMetadata');

  let path;
  let payload = { ...data }; 

  // Determine path and clean payload based on target document
  if (forceDocument === 'reading_catalog') {
      path = mockDoc(db, 'metadata', 'reading_catalog');
      // Ensure payload is structured correctly { items: [...] }
      if (!payload || !payload.items || !Array.isArray(payload.items)) {
           // Attempt to find an array in the payload or wrap it
           const potentialArray = Object.values(payload).find(Array.isArray);
           payload = { items: potentialArray || (Array.isArray(payload) ? payload : []) };
           console.warn(`[GLOBAL WRITE] Auto-wrapping payload for reading_catalog into { items: [...] }`);
      }
  } else {
      // Default to metadata/config
      path = mockDoc(db, 'metadata', 'config');
      // Clean known keys that should NOT be written directly to config root
      delete payload.REP_LIBRARY; delete payload.EXERCISE_LIBRARY; delete payload.WORKOUT_LIBRARY;
      delete payload.COURSE_LIBRARY; delete payload.SKILL_CATALOG; delete payload.IDENTITY_ANCHOR_CATALOG;
      delete payload.HABIT_ANCHOR_CATALOG; delete payload.WHY_CATALOG; delete payload.READING_CATALOG; 
      delete payload.VIDEO_CATALOG; delete payload.SCENARIO_CATALOG; delete payload.RESOURCE_LIBRARY; 
      delete payload.RESOURCE_LIBRARY_ITEMS; delete payload.catalog; 
  }

   if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
       console.warn(`[GLOBAL WRITE SKIPPED] Payload for ${path} became empty after cleaning. Source: ${source}`);
       return {}; 
   }

  try {
    const finalPayload = {
        ...payload,
        _updatedAt: serverTimestamp(), 
        _updatedBy: userId,
        _source: source
    };

    const success = await setDocEx(db, path, finalPayload, merge);

    if (success) {
        console.log(`[GLOBAL WRITE SUCCESS] Document: ${path}. Merge: ${merge}. Keys Updated: ${Object.keys(payload).join(', ')}. Source: ${source}`);
        return { ...payload, _updatedBy: userId, _source: source };
    } else {
        throw new Error(`setDocEx failed for path ${path}`);
    }

  } catch (e) {
    console.error(`[GLOBAL WRITE FAILED] Document: ${path}`, e);
    throw new Error(`Failed to update global metadata for ${path}: ${e.message}`);
  }
};


/* =========================================================
   Provider factory (Full definitions restored)
========================================================= */
export const createAppServices = ({
  user, userId, auth, db, isAuthReady, navigate,
  callSecureGeminiAPI = async () => ({ candidates: [] }),
  hasGeminiKey = () => false, API_KEY = '',
}) => {
  // CRITICAL FIX: Destructure explicitly from each hook
  const { data: developmentPlanData, isLoading: devPlanLoading, error: devPlanError, updateData: updateDevelopmentPlanData } = useFirestoreUserData(db, userId, isAuthReady, 'development_plan', 'profile', MOCK_DEVELOPMENT_PLAN_DATA);
  const { data: dailyPracticeData, isLoading: dailyPracticeLoading, error: dailyPracticeError, updateData: updateDailyPracticeData } = useFirestoreUserData(db, userId, isAuthReady, 'daily_practice', 'state', MOCK_DAILY_PRACTICE_DATA);
  const { data: strategicContentData, isLoading: strategicContentLoading, error: strategicContentError, updateData: updateStrategicContentData } = useFirestoreUserData(db, userId, isAuthReady, 'strategic_content', 'data', MOCK_STRATEGIC_CONTENT_DATA);
  
  const metadataHook = useGlobalMetadata(db, isAuthReady);

  // COMBINE HOOK STATES
  const combinedIsLoading = devPlanLoading || dailyPracticeLoading || strategicContentLoading || metadataHook.isLoading;
  const combinedError = devPlanError || dailyPracticeError || strategicContentError || metadataHook.error;

  const isAdmin = useMemo(() => {
    return !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()); 
  }, [user]);

  const value = useMemo(() => {
    const resolvedMetadata = resolveGlobalMetadata(metadataHook.metadata);
    const dailyData = dailyPracticeData;
    const hasPendingTargetRep = dailyData?.dailyTargetRepStatus === 'Pending' && !!dailyData?.dailyTargetRepId;
    const hasPendingAdditionalReps = (dailyData?.activeCommitments || []).some(
        c => c.status === 'Pending'
    );
    const hasPendingDailyPractice = hasPendingTargetRep || hasPendingAdditionalReps;

    return {
      navigate, user, userId, db, auth, isAuthReady,
      isLoading: combinedIsLoading, error: combinedError, isAdmin, ADMIN_PASSWORD,

      // Pass the destructured data
      developmentPlanData: developmentPlanData,
      dailyPracticeData: dailyPracticeData,
      strategicContentData: strategicContentData,
      
      metadata: resolvedMetadata,
      featureFlags: resolvedMetadata.featureFlags || MOCK_FEATURE_FLAGS,
      LEADERSHIP_TIERS: resolvedMetadata.LEADERSHIP_TIERS || LEADERSHIP_TIERS_FALLBACK,
      REP_LIBRARY: resolvedMetadata.REP_LIBRARY || MOCK_REP_LIBRARY,
      EXERCISE_LIBRARY: resolvedMetadata.EXERCISE_LIBRARY || MOCK_EXERCISE_LIBRARY,
      WORKOUT_LIBRARY: resolvedMetadata.WORKOUT_LIBRARY || MOCK_WORKOUT_LIBRARY,
      COURSE_LIBRARY: resolvedMetadata.COURSE_LIBRARY || MOCK_COURSE_LIBRARY,
      SKILL_CATALOG: resolvedMetadata.SKILL_CATALOG || MOCK_SKILL_CATALOG,
      IDENTITY_ANCHOR_CATALOG: resolvedMetadata.IDENTITY_ANCHOR_CATALOG || MOCK_IDENTITY_ANCHOR_CATALOG,
      HABIT_ANCHOR_CATALOG: resolvedMetadata.HABIT_ANCHOR_CATALOG || MOCK_HABIT_ANCHOR_CATALOG,
      WHY_CATALOG: resolvedMetadata.WHY_CATALOG || MOCK_WHY_CATALOG,
      READING_CATALOG: resolvedMetadata.READING_CATALOG || MOCK_READING_CATALOG,
      VIDEO_CATALOG: resolvedMetadata.VIDEO_CATALOG || MOCK_VIDEO_CATALOG,
      SCENARIO_CATALOG: resolvedMetadata.SCENARIO_CATALOG || MOCK_SCENARIO_CATALOG,
      RESOURCE_LIBRARY: resolvedMetadata.RESOURCE_LIBRARY || {}, 
      IconMap: resolvedMetadata.IconMap || {},
      APP_ID: resolvedMetadata.APP_ID || 'default-app-id',

      callSecureGeminiAPI, hasGeminiKey,
      GEMINI_MODEL: resolvedMetadata.GEMINI_MODEL || GEMINI_MODEL, API_KEY,
      hasPendingDailyPractice,

      // Pass the destructured update functions
      updateDevelopmentPlanData: updateDevelopmentPlanData,
      updateDailyPracticeData: updateDailyPracticeData,
      updateStrategicContentData: updateStrategicContentData,
      updateGlobalMetadata: (data, opts) => updateGlobalMetadata(db, data, { ...opts, userId }),
    };
  }, [
    // Core dependencies
    user, userId, db, auth, isAuthReady, navigate, callSecureGeminiAPI, hasGeminiKey, API_KEY, isAdmin,
    // CRITICAL: Individual loading states and update functions are now dependencies
    devPlanLoading, dailyPracticeLoading, strategicContentLoading, metadataHook,
    combinedIsLoading, combinedError,
    // Add the destructured update functions and data to the dependency array
    updateDevelopmentPlanData, updateDailyPracticeData, updateStrategicContentData,
    developmentPlanData, dailyPracticeData, strategicContentData,
  ]);

  return value;
};

// Default export is the context itself
export default AppServiceContext;