// src/services/useAppServices.jsx (Refactored for Daily Resets, Feature Flags, Terminology, Admin Role, Consistency)

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
  updateDoc as fsUpdateDoc, // Added for partial updates
} from 'firebase/firestore';

// --- NEW: Import specific icons used within this service ---
import { HeartPulse, Briefcase, Users, AlertTriangle, TrendingUp, Zap, ShieldCheck, Target, BarChart3, BookOpen, Film, Trello, Mic, Clock, Cpu, User as UserIcon } from 'lucide-react'; // Added icons used by LEADERSHIP_TIERS

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
  docRef: path, // Use consistent naming 'path'
  _md: { fromCache: false, pendingWrites: false },
});
const mockSetDoc = async (docRefPath, data) => {
  __firestore_mock_store[docPath] = data;
  console.log(`[MOCK SET] Path: ${docRefPath}`, data); // Added logging
  return true;
};
const mockGetDoc = async (docPath) => {
  const d = __firestore_mock_store[docPath];
  console.log(`[MOCK GET] Path: ${docPath}`, d ? '(Found)' : '(Not Found)'); // Added logging
  return createMockSnapshot(docPath, d || {}, !!d);
};
// Use consistent naming 'pathSegments'
const mockDoc = (db, ...pathSegments) => pathSegments.join('/');
// NEW: Mock for updateDoc
const mockUpdateDoc = async (docRefPath, data) => {
    const existingData = __firestore_mock_store[docRefPath] || {};
    // Simple merge, does not handle nested updates or field deletions deeply
    __firestore_mock_store[docRefPath] = { ...existingData, ...data };
    console.log(`[MOCK UPDATE] Path: ${docRefPath}`, data); // Added logging
    return true;
};


/* =========================================================
   Real Firestore wrappers (Added updateDocEx)
========================================================= */
const toDocRef = (db, path) => fsDoc(db, ...path.split('/'));

const onSnapshotEx = (db, path, cb) => {
  if (!db) {
      console.warn(`[onSnapshotEx] No Firestore DB instance provided for path: ${path}. Using mock (no-op).`);
      return () => {}; // No mock needed if only used for live user data and DB is missing
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
          (error) => { // Added error handling callback
              console.error(`[onSnapshotEx ERROR] Path: ${path}`, error);
              // Optionally call cb with an error state if needed by consumers
          }
      );
  } catch (error) {
      console.error(`[onSnapshotEx SETUP FAILED] Path: ${path}`, error);
      return () => {}; // Return no-op unsubscribe on setup failure
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
      // Return a snapshot indicating non-existence on error
      return createMockSnapshot(path, {}, false);
  }
};

const setDocEx = async (db, path, data, merge = false) => {
  if (!db) {
      console.warn(`[setDocEx] No Firestore DB instance provided for path: ${path}. Using mock.`);
      return mockSetDoc(path, data);
  }
  try {
      // Add a timestamp for auditing
      const dataWithTimestamp = { ...data, _updatedAt: serverTimestamp() };
      await fsSetDoc(toDocRef(db, path), dataWithTimestamp, merge ? { merge: true } : undefined);
      console.log(`[setDocEx SUCCESS] Path: ${path}, Merge: ${merge}`);
      return true; // Indicate success
  } catch (error) {
      console.error(`[setDocEx FAILED] Path: ${path}`, error);
      return false; // Indicate failure
  }
};

// Use fsUpdateDoc for partial updates without overwriting the whole document
const updateDocEx = async (db, path, data) => {
    if (!db) {
        console.warn(`[updateDocEx] No Firestore DB instance provided for path: ${path}. Using mock.`);
        return mockUpdateDoc(path, data);
    }
    // Ensure data is not empty
    if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        console.warn(`[updateDocEx] Attempted to update with empty data object for path: ${path}. Skipping.`);
        return true; // Consider this a no-op success
    }
    try {
        // Add a timestamp for auditing
        const dataWithTimestamp = { ...data, _updatedAt: serverTimestamp() };
        await fsUpdateDoc(toDocRef(db, path), dataWithTimestamp);
        console.log(`[updateDocEx SUCCESS] Path: ${path}`, data); // Log only the data being updated
        return true; // Indicate success
    } catch (error) {
        console.error(`[updateDocEx FAILED] Path: ${path}`, error);
        // Optionally check error code (e.g., 'not-found') if specific handling is needed
        return false; // Indicate failure
    }
};


// --- ensureUserDocs: Create required per-user docs if missing (UPDATED for daily resets) ---
export const ensureUserDocs = async (db, uid) => {
  console.log(`[ensureUserDocs] Running for UID: ${uid}`); // Added log
  try {
    if (!db || !uid) {
        console.warn('[ensureUserDocs] DB or UID missing, skipping.');
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Structure: [collection, docName, defaultData]
    const userDocConfigs = [
      // Development Plan (formerly leadership_plan)
      {
          collection: 'development_plan', // Renamed collection
          docName: 'profile', // Main profile document
          defaultData: {
              currentCycle: 1,
              createdAt: serverTimestamp(),
              lastAssessmentDate: null,
              assessmentHistory: [], // Store history within the doc for simpler reads initially
              planHistory: [], // Store history within the doc
              // currentPlan: { cycle: 1, focusAreas: [], strengths: [], createdAt: serverTimestamp() } // Initial plan can be set on first assessment
          }
      },
      // Daily Practice (formerly user_commitments)
      {
          collection: 'daily_practice', // Renamed collection
          docName: 'state', // Main state document
          defaultData: {
              activeCommitments: [], // Additional reps
              identityAnchor: '', // User's defined identity statement core
              habitAnchor: '', // User's defined habit cue
              dailyTargetRepId: null, // ID of the target rep for the current day
              dailyTargetRepDate: null, // YYYY-MM-DD for which the target rep applies
              dailyTargetRepStatus: 'Pending', // Status for the target rep for that date
              streakCount: 0,
              streakCoins: 0,
              lastStatusResetDate: todayStr, // Initialize with today's date
              arenaMode: true, // Default to Arena mode
              // Removed reflection_journal, using subcollection instead
              // resilience_log might become its own doc or subcollection if complex
          }
      },
      // Strategic Content Tools (formerly user_planning)
      {
          collection: 'strategic_content', // Renamed collection
          docName: 'data', // Main data document
          defaultData: {
              vision: '',
              mission: '',
              okrs: [],
              lastPreMortemDecision: '', // Renamed field
              risks: [], // Renamed field
              misalignmentNotes: '', // Renamed field
              lastAlignmentCheck: null,
              // Removed 'drafts' unless specifically needed elsewhere
          }
      },
    ];

    for (const config of userDocConfigs) {
      const path = `${config.collection}/${uid}/${config.docName}`;
      const snap = await getDocEx(db, path);

      if (!snap || !snap.exists()) {
        console.log(`[SEED] Document ${path} missing, creating with defaults.`);
        await setDocEx(db, path, config.defaultData, false); // Use setDocEx for initial creation
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
             if (currentData.reflection_journal !== undefined) { updates.reflection_journal = firebase.firestore.FieldValue.delete(); needsUpdate = true; }
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
   Defaults / fallbacks (UPDATED - Terminology, Daily Reset Fields)
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
const MOCK_IDENTITY_ANCHOR_CATALOG = { items: ["prioritizes psychological safety", "leads with vulnerability", "holds myself and others accountable"] };
const MOCK_HABIT_ANCHOR_CATALOG = { items: ["After my morning coffee", "Before my first meeting", "During my commute", "After lunch"] };
const MOCK_WHY_CATALOG = { items: ["To empower my team to do their best work", "To build a high-performing, high-trust culture", "To achieve our ambitious goals together"] };
// Catalogs for specific content types
const MOCK_READING_CATALOG = { items: [] }; // Renamed from READING_CATALOG_SERVICE
const MOCK_VIDEO_CATALOG = { items: [] };
const MOCK_SCENARIO_CATALOG = { items: [] };
const MOCK_RESOURCE_LIBRARY_ITEMS = { items: [] }; // For Applied Leadership resources, needs transformation

// --- MOCK ADMIN CONFIG ---
export const ADMIN_EMAILS = ["rob@sagecg.com", "ryan@leaderreps.com", "ryanyeoman@gmail.com", "christina@leaderreps.com", "jeff@leaderreps.com"]; // Add emails of admins here
const ADMIN_PASSWORD = "7777"; // Simple password for admin functions screen


/* =========================================================
   Context + API (UPDATED - Renamed collections, added flags/admin)
========================================================= */
const DEFAULT_SERVICES = {
    // Core App
    navigate: () => console.warn('Navigate not initialized'),
    user: null,
    userId: null,
    db: null,
    auth: null,
    isAuthReady: false,
    isLoading: true,
    error: null,
    // User Data
    developmentPlanData: MOCK_DEVELOPMENT_PLAN_DATA,
    dailyPracticeData: MOCK_DAILY_PRACTICE_DATA,
    strategicContentData: MOCK_STRATEGIC_CONTENT_DATA,
    // Global Metadata / Value Sets
    metadata: {},
    featureFlags: MOCK_FEATURE_FLAGS, // NEW
    LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK,
    REP_LIBRARY: MOCK_REP_LIBRARY, // NEW - Unified Rep concept
    EXERCISE_LIBRARY: MOCK_EXERCISE_LIBRARY, // NEW
    WORKOUT_LIBRARY: MOCK_WORKOUT_LIBRARY, // NEW
    COURSE_LIBRARY: MOCK_COURSE_LIBRARY, // NEW
    SKILL_CATALOG: MOCK_SKILL_CATALOG, // NEW - Maps to old Domains/Skill Content
    IDENTITY_ANCHOR_CATALOG: MOCK_IDENTITY_ANCHOR_CATALOG,
    HABIT_ANCHOR_CATALOG: MOCK_HABIT_ANCHOR_CATALOG,
    WHY_CATALOG: MOCK_WHY_CATALOG,
    READING_CATALOG: MOCK_READING_CATALOG, // Renamed
    VIDEO_CATALOG: MOCK_VIDEO_CATALOG,
    SCENARIO_CATALOG: MOCK_SCENARIO_CATALOG,
    RESOURCE_LIBRARY: {}, // Transformed from items
    IconMap: {}, // Loaded from metadata/config
    // AI/API Services
    callSecureGeminiAPI: async () => ({ candidates: [] }),
    hasGeminiKey: () => false,
    GEMINI_MODEL: GEMINI_MODEL,
    API_KEY: '',
    // Derived State & Functions
    isAdmin: false, // NEW
    hasPendingDailyPractice: false,
    // Writers
    updateDevelopmentPlanData: async () => false, // Return success indicator
    updateDailyPracticeData: async () => false,
    updateStrategicContentData: async () => false,
    updateGlobalMetadata: async () => ({}), // Return merged data
    // --- DEPRECATED (use specific updaters) ---
    // updatePdpData, saveNewPlan, updateCommitmentData, updatePlanningData
};

export const AppServiceContext = createContext(DEFAULT_SERVICES);
export const useAppServices = () => useContext(AppServiceContext);


/* =========================================================
   Helpers (guards + tracing - Minor Updates)
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

// Trace callsite (unchanged)
const traceCallsite = (label = 'updateGlobalMetadata') => { /* ... */ };


/* =========================================================
   User-data hooks (UPDATED - Renamed, Daily Reset Logic)
========================================================= */
const MAX_LOAD_TIMEOUT = 2500; // Increased timeout slightly

// --- Base Hook (Internal) ---
const useFirestoreUserData = (db, userId, isAuthReady, collection, document, mockData) => {
  const path = userId ? `${collection}/${userId}/${document}` : null; // Construct path only if userId exists
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
    return () => {
        console.log(`[useFirestoreUserData ${collection}/${document}] Cleaning up listener. Path: ${path}`);
        isMounted = false;
        if (unsubscribe) unsubscribe();
        if (timeoutId) clearTimeout(timeoutId);
    };
  }, [db, userId, isAuthReady, collection, document, path, mockData]); // Added path to dependencies

  // --- Update Function ---
  const updateData = useCallback(async (updatesOrFn) => {
    if (!db || !userId || !path) {
        console.error(`[USER UPDATE FAILED] Cannot update ${document}. Missing db, userId, or path.`);
        return false; // Return failure indicator
    }
    try {
      let finalUpdates;
      if (typeof updatesOrFn === 'function') {
          // Apply functional update based on current local state
          const currentState = data; // Use the state variable 'data'
          finalUpdates = updatesOrFn(currentState);
      } else {
          finalUpdates = updatesOrFn;
      }

      // Add safety check for empty updates
       if (!finalUpdates || typeof finalUpdates !== 'object' || Object.keys(finalUpdates).length === 0) {
           console.warn(`[USER UPDATE SKIPPED] ${document}. No valid updates provided. Path: ${path}`);
           return true; // No-op is considered success
       }

      // Use updateDocEx for partial updates
      const success = await updateDocEx(db, path, finalUpdates);
      if (success) {
          console.log(`[USER UPDATE SUCCESS] ${document}. Path: ${path}`, finalUpdates);
          return true;
      } else {
          console.error(`[USER UPDATE FAILED] updateDocEx returned false for ${document}. Path: ${path}`);
          return false;
      }
    } catch (e) {
      console.error(`[USER UPDATE EXCEPTION] ${document}. Path: ${path}`, e);
      return false; // Return failure indicator on exception
    }
  }, [db, userId, path, document, data]); // Added 'data' dependency for functional updates

  // Return consistent structure
  return { data, isLoading: loading, error, updateData };
};


// --- Specific Hooks (Renamed) ---
export const useDevelopmentPlanData = (db, userId, isAuthReady) => {
  const { data, isLoading, error, updateData } = useFirestoreUserData(db, userId, isAuthReady, 'development_plan', 'profile', MOCK_DEVELOPMENT_PLAN_DATA);
  // Optional: Add specific saveNewPlan logic if needed (overwrites doc)
  // const saveNewPlan = useCallback(async (newPlanData) => { ... setDocEx ... }, [db, userId]);
  return { developmentPlanData: data, isLoading, error, updateDevelopmentPlanData: updateData };
};

export const useDailyPracticeData = (db, userId, isAuthReady) => {
  const { data, isLoading, error, updateData } = useFirestoreUserData(db, userId, isAuthReady, 'daily_practice', 'state', MOCK_DAILY_PRACTICE_DATA);
  return { dailyPracticeData: data, isLoading, error, updateDailyPracticeData: updateData };
};

export const useStrategicContentData = (db, userId, isAuthReady) => {
  const { data, isLoading, error, updateData } = useFirestoreUserData(db, userId, isAuthReady, 'strategic_content', 'data', MOCK_STRATEGIC_CONTENT_DATA);
  return { strategicContentData: data, isLoading, error, updateStrategicContentData: updateData };
};


/* =========================================================
   Global metadata (read) (UPDATED - Simplified paths, added flags)
========================================================= */
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
    console.log(`[useGlobalMetadata] Fetching from: ${pathConfig}, ${pathReadingCatalog}`);

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

        // --- Restructure based on metadata/config containing nested catalogs ---
        const catalogData = configData.catalog || {}; // Assume catalogs are under 'catalog' field in config

        // --- Extract specific catalogs, using fallbacks ---
        const repLibraryData = catalogData.REP_LIBRARY || MOCK_REP_LIBRARY;
        const exerciseLibraryData = catalogData.EXERCISE_LIBRARY || MOCK_EXERCISE_LIBRARY;
        const workoutLibraryData = catalogData.WORKOUT_LIBRARY || MOCK_WORKOUT_LIBRARY;
        const courseLibraryData = catalogData.COURSE_LIBRARY || MOCK_COURSE_LIBRARY;
        const skillCatalogData = catalogData.SKILL_CATALOG || MOCK_SKILL_CATALOG;
        const identityCatalogData = catalogData.IDENTITY_ANCHOR_CATALOG || MOCK_IDENTITY_ANCHOR_CATALOG;
        const habitCatalogData = catalogData.HABIT_ANCHOR_CATALOG || MOCK_HABIT_ANCHOR_CATALOG;
        const whyCatalogData = catalogData.WHY_CATALOG || MOCK_WHY_CATALOG;
        const videoCatalogData = catalogData.VIDEO_CATALOG || MOCK_VIDEO_CATALOG;
        const scenarioCatalogData = catalogData.SCENARIO_CATALOG || MOCK_SCENARIO_CATALOG;
        const resourceLibraryRawData = catalogData.RESOURCE_LIBRARY_ITEMS || MOCK_RESOURCE_LIBRARY_ITEMS; // Name matches the expected field

        // --- MERGE FINAL DATA ---
        finalData = {
            ...(configData || {}), // Spread top-level config fields (APP_ID, GEMINI_MODEL, IconMap, featureFlags, LEADERSHIP_TIERS)
            // Explicitly add catalogs (using fallbacks if not found in config.catalog)
            REP_LIBRARY: repLibraryData,
            EXERCISE_LIBRARY: exerciseLibraryData,
            WORKOUT_LIBRARY: workoutLibraryData,
            COURSE_LIBRARY: courseLibraryData,
            SKILL_CATALOG: skillCatalogData,
            IDENTITY_ANCHOR_CATALOG: identityCatalogData,
            HABIT_ANCHOR_CATALOG: habitCatalogData,
            WHY_CATALOG: whyCatalogData,
            READING_CATALOG: readingCatalogData, // Comes from separate doc
            VIDEO_CATALOG: videoCatalogData,
            SCENARIO_CATALOG: scenarioCatalogData,
            RESOURCE_LIBRARY: transformResources(resourceLibraryRawData), // Apply transformation
            // Ensure essential config fields have fallbacks if missing from config doc
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
   Global writer (Simplified for single config doc, handles flags)
========================================================= */
export const updateGlobalMetadata = async (
  db,
  data,
  { merge = true, source = 'Unknown', userId = 'N/A', forceDocument = 'config' } // forceDocument primarily for reading_catalog now
) => {
  if (!db) {
    console.warn(`[GLOBAL WRITE MOCK] Skipping write (source: ${source})`);
    return data; // Return input data in mock mode
  }

  traceCallsite('updateGlobalMetadata');

  let path;
  let payload = { ...data }; // Copy data to avoid modifying original object

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
      // These are managed implicitly via the nested 'catalog' structure or separate docs
      delete payload.REP_LIBRARY;
      delete payload.EXERCISE_LIBRARY;
      delete payload.WORKOUT_LIBRARY;
      delete payload.COURSE_LIBRARY;
      delete payload.SKILL_CATALOG;
      delete payload.IDENTITY_ANCHOR_CATALOG;
      delete payload.HABIT_ANCHOR_CATALOG;
      delete payload.WHY_CATALOG;
      delete payload.READING_CATALOG; // Belongs in its own doc
      delete payload.VIDEO_CATALOG;
      delete payload.SCENARIO_CATALOG;
      delete payload.RESOURCE_LIBRARY; // This is derived/transformed
      delete payload.RESOURCE_LIBRARY_ITEMS; // This would live under catalog field potentially
      delete payload.catalog; // Don't write the whole nested catalog object directly if passed
  }

  // Ensure payload is not empty after cleaning
   if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
       console.warn(`[GLOBAL WRITE SKIPPED] Payload for ${path} became empty after cleaning. Source: ${source}`);
       return {}; // Return empty object for skipped write
   }


  try {
    // Add audit fields directly to the payload being saved
    const finalPayload = {
        ...payload,
        _updatedAt: serverTimestamp(), // Use server timestamp for accuracy
        _updatedBy: userId,
        _source: source
    };

    // Use setDocEx which handles the serverTimestamp correctly
    const success = await setDocEx(db, path, finalPayload, merge);

    if (success) {
        console.log(`[GLOBAL WRITE SUCCESS] Document: ${path}. Merge: ${merge}. Keys Updated: ${Object.keys(payload).join(', ')}. Source: ${source}`);
        // Return the data that was intended to be saved (without server timestamp object)
        // Note: For reads, you'll get a Date object back from Firestore for _updatedAt
        return { ...payload, _updatedBy: userId, _source: source };
    } else {
        throw new Error(`setDocEx failed for path ${path}`);
    }

  } catch (e) {
    console.error(`[GLOBAL WRITE FAILED] Document: ${path}`, e);
    // Rethrow or return an error indicator
    throw new Error(`Failed to update global metadata for ${path}: ${e.message}`);
  }
};


/* =========================================================
   Provider factory (UPDATED - Uses all hooks, adds admin/flags)
========================================================= */
export const createAppServices = ({
  user, userId, auth, db, isAuthReady, navigate,
  callSecureGeminiAPI = async () => ({ candidates: [] }),
  hasGeminiKey = () => false, API_KEY = '',
}) => {
  // Use renamed user data hooks
  const devPlanHook = useDevelopmentPlanData(db, userId, isAuthReady);
  const dailyPracticeHook = useDailyPracticeData(db, userId, isAuthReady);
  const strategicContentHook = useStrategicContentData(db, userId, isAuthReady);
  const metadataHook = useGlobalMetadata(db, isAuthReady);

  // --- Combined loading state ---
  const combinedIsLoading = devPlanHook.isLoading || dailyPracticeHook.isLoading || strategicContentHook.isLoading || metadataHook.isLoading;
  // --- Combined error state ---
  const combinedError = devPlanHook.error || dailyPracticeHook.error || strategicContentHook.error || metadataHook.error;

 // src/services/useAppServices.jsx (Around line 850)
// --- Determine Admin Status ---
const isAdmin = useMemo(() => {
    // Ensure user and email exist before checking, and convert user.email to lowercase
    return !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()); // FIX: Added .toLowerCase()
}, [user]);

  // --- Memoized Service Value ---
  const value = useMemo(() => {
    // Resolve metadata safely
    const resolvedMetadata = resolveGlobalMetadata(metadataHook.metadata);

    // --- Check Pending Daily Practice (using updated data structure) ---
    const dailyData = dailyPracticeHook.dailyPracticeData;
    const hasPendingTargetRep = dailyData?.dailyTargetRepStatus === 'Pending' && !!dailyData?.dailyTargetRepId;
    const hasPendingAdditionalReps = (dailyData?.activeCommitments || []).some(
        c => c.status === 'Pending'
    );
    const hasPendingDailyPractice = hasPendingTargetRep || hasPendingAdditionalReps;

    // --- Prepare Service Object ---
    return {
      // Core App
      navigate,
      user, // Contains name, email, userId
      userId,
      db,
      auth,
      isAuthReady,
      isLoading: combinedIsLoading,
      error: combinedError,
      isAdmin, // Expose admin status
      ADMIN_PASSWORD, // Expose password constant

      // User Data (using updated names)
      developmentPlanData: devPlanHook.developmentPlanData,
      dailyPracticeData: dailyPracticeHook.dailyPracticeData,
      strategicContentData: strategicContentHook.strategicContentData,

      // Global Metadata / Value Sets (extracted from resolvedMetadata)
      metadata: resolvedMetadata, // Include the raw object if needed elsewhere
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
      RESOURCE_LIBRARY: resolvedMetadata.RESOURCE_LIBRARY || {}, // Transformed data
      IconMap: resolvedMetadata.IconMap || {},
      APP_ID: resolvedMetadata.APP_ID || 'default-app-id',


      // AI/API Services
      callSecureGeminiAPI,
      hasGeminiKey,
      GEMINI_MODEL: resolvedMetadata.GEMINI_MODEL || GEMINI_MODEL,
      API_KEY,

      // Derived State
      hasPendingDailyPractice,

      // Writers (using updated names)
      updateDevelopmentPlanData: devPlanHook.updateData,
      updateDailyPracticeData: dailyPracticeHook.updateData,
      updateStrategicContentData: strategicContentHook.updateData,
      // Global writer needs userId passed in
      updateGlobalMetadata: (data, opts) => updateGlobalMetadata(db, data, { ...opts, userId }),
    };
  }, [
    // Core dependencies
    user, userId, db, auth, isAuthReady, navigate, callSecureGeminiAPI, hasGeminiKey, API_KEY, isAdmin,
    // Hook states
    devPlanHook, dailyPracticeHook, strategicContentHook, metadataHook,
    // Combined states
    combinedIsLoading, combinedError,
  ]);

  return value;
};


// Default export is the context itself
export default AppServiceContext;