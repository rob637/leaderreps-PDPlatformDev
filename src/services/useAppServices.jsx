// src/services/useAppServices.jsx (UPDATED FOR CLEAN STRUCTURE - OPTION B)
// Custom for rob@sagecg.com - Scales to 10,000+ users

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
  deleteField 
} from 'firebase/firestore';

// Import specific icons used within this service
import { HeartPulse, Briefcase, Users, AlertTriangle, TrendingUp, Zap, ShieldCheck, Target, BarChart3, BookOpen, Film, Trello, Mic, Clock, Cpu, User as UserIcon } from 'lucide-react'; 

console.log('🔥🔥🔥 useAppServices.jsx LOADED - CLEAN STRUCTURE VERSION (Option B) 🔥🔥🔥');

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

// ==================== NEW CLEAN PATH STRUCTURE ====================
// ALL USER DATA NOW LIVES IN: modules/{userId}/{moduleName}/{docName}
// This scales perfectly for 10,000+ users
// =================================================================

/**
 * Build path for user modules (NEW CLEAN STRUCTURE)
 */
const buildModulePath = (uid, moduleName, docName) => {
  return `modules/${uid}/${moduleName}/${docName}`;
};

/**
 * Build path for user profile (FIXED: 2 segments for document)
 */
const buildUserProfilePath = (uid) => {
  return `users/${uid}`;
};

// --- ensureUserDocs: Create required per-user docs if missing (CLEAN STRUCTURE) ---
export const ensureUserDocs = async (db, uid) => {
  console.log(`[ensureUserDocs] Running for UID: ${uid} (CLEAN STRUCTURE)`); 
  try {
    if (!db || !uid) {
        console.warn('[ensureUserDocs] DB or UID missing, skipping.');
        return;
    }

    const todayStr = new Date().toISOString().split('T')[0]; 

    // ==================== USER PROFILE ====================
    const userProfilePath = buildUserProfilePath(uid);
    const userProfileSnap = await getDocEx(db, userProfilePath);
    
    if (!userProfileSnap.exists()) {
        console.log(`[ensureUserDocs] Creating user profile at: ${userProfilePath}`);
        await setDocEx(db, userProfilePath, {
            userId: uid,
            createdAt: new Date().toISOString(),
            _createdAt: serverTimestamp()
        });
    }

    // ==================== DEVELOPMENT PLAN MODULE ====================
    const devPlanPath = buildModulePath(uid, 'development_plan', 'current');
    const devPlanSnap = await getDocEx(db, devPlanPath);
    
    if (!devPlanSnap.exists()) {
        console.log(`[ensureUserDocs] Creating development plan at: ${devPlanPath}`);
        const defaultPlan = {
            currentCycle: 1,
            createdAt: serverTimestamp(),
            lastAssessmentDate: null,
            assessmentHistory: [], 
            planHistory: [],
            coreReps: [],
            currentWeek: 0,
            startDate: todayStr,
            responses: {},
            openEndedResponse: ''
        };
        await setDocEx(db, devPlanPath, defaultPlan);
    }

    // ==================== DAILY PRACTICE MODULE ====================
    const dailyPracticePath = buildModulePath(uid, 'daily_practice', 'current');
    const dailyPracticeSnap = await getDocEx(db, dailyPracticePath);
    
    if (!dailyPracticeSnap.exists()) {
        console.log(`[ensureUserDocs] Creating daily practice at: ${dailyPracticePath}`);
        const defaultDailyPractice = {
            activeCommitments: [], 
            identityAnchor: '', 
            habitAnchor: '', 
            dailyTargetRepId: null, 
            dailyTargetRepDate: null, 
            dailyTargetRepStatus: 'Pending', 
            streakCount: 0,
            streakCoins: 0,
            lastUpdated: todayStr,
            completedRepsToday: [],
            _createdAt: serverTimestamp()
        };
        await setDocEx(db, dailyPracticePath, defaultDailyPractice);
    }

    // ==================== STRATEGIC CONTENT MODULE ====================
    const strategicPath = buildModulePath(uid, 'strategic_content', 'vision_mission');
    const strategicSnap = await getDocEx(db, strategicPath);
    
    if (!strategicSnap.exists()) {
        console.log(`[ensureUserDocs] Creating strategic content at: ${strategicPath}`);
        const defaultStrategic = {
            vision: '',
            mission: '',
            values: [],
            goals: [],
            purpose: '',
            _createdAt: serverTimestamp()
        };
        await setDocEx(db, strategicPath, defaultStrategic);
    }

    console.log('[ensureUserDocs] All required documents verified/created (CLEAN STRUCTURE)');
  } catch (e) {
    console.error('[ensureUserDocs] Error:', e);
  }
};

/* =========================================================
   Mock Data (fallback for when Firestore isn't available)
========================================================= */
export const MOCK_DEVELOPMENT_PLAN_DATA = {
  coreReps: [],
  responses: {},
  openEndedResponse: '',
  currentWeek: 0,
  startDate: new Date().toISOString().split('T')[0],
  assessmentHistory: [],
  planHistory: [],
  currentCycle: 1,
};

export const MOCK_DAILY_PRACTICE_DATA = {
  lastUpdated: new Date().toISOString().split('T')[0],
  dailyTargetRepId: null,
  dailyTargetRepStatus: 'Pending',
  dailyTargetRepDate: null,
  activeCommitments: [],
  completedRepsToday: [],
  identityAnchor: '',
  habitAnchor: '',
  streakCount: 0,
  streakCoins: 0,
};

export const MOCK_STRATEGIC_CONTENT_DATA = {
  vision: '',
  mission: '',
  values: [],
  goals: [],
  purpose: '',
};

// Global metadata mocks
const MOCK_FEATURE_FLAGS = { enableNewFeature: false };
const MOCK_REP_LIBRARY = [];
const MOCK_EXERCISE_LIBRARY = [];
const MOCK_WORKOUT_LIBRARY = [];
const MOCK_COURSE_LIBRARY = [];
const MOCK_SKILL_CATALOG = [];
const MOCK_IDENTITY_ANCHOR_CATALOG = [];
const MOCK_HABIT_ANCHOR_CATALOG = [];
const MOCK_WHY_CATALOG = [];
const MOCK_READING_CATALOG = [];
const MOCK_VIDEO_CATALOG = [];
const MOCK_SCENARIO_CATALOG = [];

const LEADERSHIP_TIERS_FALLBACK = [
  { tier: 1, name: "Tier 1", description: "Foundation" },
  { tier: 2, name: "Tier 2", description: "Intermediate" },
  { tier: 3, name: "Tier 3", description: "Advanced" },
  { tier: 4, name: "Tier 4", description: "Expert" },
];

const GEMINI_MODEL = 'gemini-pro';
const ADMIN_EMAILS = ['rob@sagecg.com', 'ryan@leaderreps.com'];
const ADMIN_PASSWORD = 'admin123';

// Create and export the context
const AppServiceContext = createContext(null);
export { AppServiceContext }; // Named export for App.jsx

export const useAppServices = () => {
  const ctx = useContext(AppServiceContext);
  if (!ctx) throw new Error('useAppServices must be used within AppServiceProvider');
  return ctx;
};

/* =========================================================
   User Data Hook (UPDATED FOR CLEAN STRUCTURE)
========================================================= */
export const useFirestoreUserData = (db, uid, isAuthReady, moduleName, docName, mockFallback = {}) => {
  const [data, setData] = useState(mockFallback);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Build path using new structure: modules/{uid}/{moduleName}/{docName}
  const path = useMemo(() => {
    if (!uid) return null;
    return buildModulePath(uid, moduleName, docName);
  }, [uid, moduleName, docName]);

  console.log(`[useFirestoreUserData] Initialized for path: ${path}`);

  // Real-time listener
  useEffect(() => {
    console.log(`[useFirestoreUserData] Effect triggered for path: ${path}`);
    console.log(`[useFirestoreUserData] - DB: ${!!db}, UID: ${uid}, AuthReady: ${isAuthReady}, Path: ${path}`);

    if (!db || !uid || !isAuthReady || !path) {
      console.warn(`[useFirestoreUserData] Prerequisites not met. DB: ${!!db}, UID: ${uid}, AuthReady: ${isAuthReady}, Path: ${path}`);
      setIsLoading(false);
      return;
    }

    console.log(`[useFirestoreUserData] ✅ Setting up listener for: ${path}`);
    setIsLoading(true);
    setError(null);

    let didSetInitial = false;

    const unsubscribe = onSnapshotEx(db, path, (snap) => {
      console.log(`[useFirestoreUserData SNAPSHOT] Path: ${path}, Exists: ${snap.exists()}, FromCache: ${snap._md?.fromCache}`);

      if (snap.exists()) {
        const docData = snap.data();
        console.log(`[useFirestoreUserData] ✅ Data received for ${path}:`, Object.keys(docData));
        setData(docData);
        didSetInitial = true;
      } else {
        console.warn(`[useFirestoreUserData] ⚠️ Document does not exist at ${path}. Using mock fallback.`);
        setData(mockFallback);
      }

      if (!didSetInitial || !snap._md?.fromCache) {
        setIsLoading(false);
      }
    });

    return () => {
      console.log(`[useFirestoreUserData] 🔌 Unsubscribing from: ${path}`);
      unsubscribe();
    };
  }, [db, uid, isAuthReady, path, mockFallback]);

  // Update function
  const updateData = useCallback(
    async (updates) => {
      console.log(`[useFirestoreUserData.updateData] Called for path: ${path}`, updates);
      
      if (!path || !db) {
        console.warn(`[useFirestoreUserData.updateData] Cannot update - missing path or db. Path: ${path}, DB: ${!!db}`);
        return false;
      }

      try {
        console.log(`[useFirestoreUserData.updateData] Attempting to update ${path}...`);
        const success = await setDocEx(db, path, updates, true);
        
        if (success) {
          console.log(`[useFirestoreUserData.updateData] ✅ Successfully updated ${path}`);
          // Optimistically update local state
          setData(prev => ({ ...prev, ...updates }));
          return true;
        } else {
          console.error(`[useFirestoreUserData.updateData] ❌ setDocEx returned false for ${path}`);
          return false;
        }
      } catch (err) {
        console.error(`[useFirestoreUserData.updateData] ❌ Error updating ${path}:`, err);
        setError(err);
        return false;
      }
    },
    [db, path]
  );

  return { data, isLoading, error, updateData };
};

/* =========================================================
   Global Metadata Hook (unchanged - already clean)
========================================================= */
export const useGlobalMetadata = (db, isAuthReady) => {
  const [metadata, setMetadata] = useState({
    featureFlags: MOCK_FEATURE_FLAGS,
    LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK,
    REP_LIBRARY: MOCK_REP_LIBRARY,
    EXERCISE_LIBRARY: MOCK_EXERCISE_LIBRARY,
    WORKOUT_LIBRARY: MOCK_WORKOUT_LIBRARY,
    COURSE_LIBRARY: MOCK_COURSE_LIBRARY,
    SKILL_CATALOG: MOCK_SKILL_CATALOG,
    IDENTITY_ANCHOR_CATALOG: MOCK_IDENTITY_ANCHOR_CATALOG,
    HABIT_ANCHOR_CATALOG: MOCK_HABIT_ANCHOR_CATALOG,
    WHY_CATALOG: MOCK_WHY_CATALOG,
    READING_CATALOG: MOCK_READING_CATALOG,
    VIDEO_CATALOG: MOCK_VIDEO_CATALOG,
    SCENARIO_CATALOG: MOCK_SCENARIO_CATALOG,
    RESOURCE_LIBRARY: {},
    IconMap: {},
    APP_ID: 'default-app-id',
    GEMINI_MODEL: GEMINI_MODEL,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!db || !isAuthReady) {
      setLoading(false);
      return;
    }

    const fetchMetadata = async () => {
      try {
          console.log("[GLOBAL METADATA] Fetching from metadata/config");
          const configSnap = await getDocEx(db, 'metadata/config');
          const configData = configSnap.exists() ? configSnap.data() : {};
          
          console.log("[GLOBAL METADATA] Config keys found:", Object.keys(configData));

          // Build icon map
          const iconComponents = {
            HeartPulse, Briefcase, Users, AlertTriangle, TrendingUp, Zap,
            ShieldCheck, Target, BarChart3, BookOpen, Film, Trello, Mic, Clock, Cpu, UserIcon
          };
          const iconMap = {};
          Object.keys(iconComponents).forEach(name => {
              iconMap[name] = iconComponents[name];
          });

          setMetadata({
              featureFlags: configData.featureFlags || MOCK_FEATURE_FLAGS,
              LEADERSHIP_TIERS: configData.LEADERSHIP_TIERS || LEADERSHIP_TIERS_FALLBACK,
              REP_LIBRARY: configData.REP_LIBRARY || MOCK_REP_LIBRARY,
              EXERCISE_LIBRARY: configData.EXERCISE_LIBRARY || MOCK_EXERCISE_LIBRARY,
              WORKOUT_LIBRARY: configData.WORKOUT_LIBRARY || MOCK_WORKOUT_LIBRARY,
              COURSE_LIBRARY: configData.COURSE_LIBRARY || MOCK_COURSE_LIBRARY,
              SKILL_CATALOG: configData.SKILL_CATALOG || MOCK_SKILL_CATALOG,
              IDENTITY_ANCHOR_CATALOG: configData.IDENTITY_ANCHOR_CATALOG || MOCK_IDENTITY_ANCHOR_CATALOG,
              HABIT_ANCHOR_CATALOG: configData.HABIT_ANCHOR_CATALOG || MOCK_HABIT_ANCHOR_CATALOG,
              WHY_CATALOG: configData.WHY_CATALOG || MOCK_WHY_CATALOG,
              READING_CATALOG: configData.READING_CATALOG || MOCK_READING_CATALOG,
              VIDEO_CATALOG: configData.VIDEO_CATALOG || MOCK_VIDEO_CATALOG,
              SCENARIO_CATALOG: configData.SCENARIO_CATALOG || MOCK_SCENARIO_CATALOG,
              RESOURCE_LIBRARY: configData.RESOURCE_LIBRARY || {},
              IconMap: iconMap,
              APP_ID: configData.APP_ID || 'default-app-id',
              GEMINI_MODEL: configData.GEMINI_MODEL || GEMINI_MODEL,
          });

      } catch (e) {
          console.error("[CRITICAL GLOBAL READ FAIL] Metadata fetch failed.", e);
          setError(e);
          setMetadata({
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

  }, [db, isAuthReady]);

  return { metadata, isLoading: loading, error };
};

const resolveGlobalMetadata = (meta) => {
  return {
    featureFlags: meta?.featureFlags || MOCK_FEATURE_FLAGS,
    LEADERSHIP_TIERS: meta?.LEADERSHIP_TIERS || LEADERSHIP_TIERS_FALLBACK,
    REP_LIBRARY: meta?.REP_LIBRARY || MOCK_REP_LIBRARY,
    EXERCISE_LIBRARY: meta?.EXERCISE_LIBRARY || MOCK_EXERCISE_LIBRARY,
    WORKOUT_LIBRARY: meta?.WORKOUT_LIBRARY || MOCK_WORKOUT_LIBRARY,
    COURSE_LIBRARY: meta?.COURSE_LIBRARY || MOCK_COURSE_LIBRARY,
    SKILL_CATALOG: meta?.SKILL_CATALOG || MOCK_SKILL_CATALOG,
    IDENTITY_ANCHOR_CATALOG: meta?.IDENTITY_ANCHOR_CATALOG || MOCK_IDENTITY_ANCHOR_CATALOG,
    HABIT_ANCHOR_CATALOG: meta?.HABIT_ANCHOR_CATALOG || MOCK_HABIT_ANCHOR_CATALOG,
    WHY_CATALOG: meta?.WHY_CATALOG || MOCK_WHY_CATALOG,
    READING_CATALOG: meta?.READING_CATALOG || MOCK_READING_CATALOG,
    VIDEO_CATALOG: meta?.VIDEO_CATALOG || MOCK_VIDEO_CATALOG,
    SCENARIO_CATALOG: meta?.SCENARIO_CATALOG || MOCK_SCENARIO_CATALOG,
    RESOURCE_LIBRARY: meta?.RESOURCE_LIBRARY || {},
    IconMap: meta?.IconMap || {},
    GEMINI_MODEL: meta?.GEMINI_MODEL || GEMINI_MODEL,
    APP_ID: meta?.APP_ID || 'default-app-id',
  };
};

/* =========================================================
   Global writer (unchanged - already clean)
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

  let path;
  let payload = { ...data }; 

  if (forceDocument === 'reading_catalog') {
      path = mockDoc(db, 'metadata', 'reading_catalog');
      if (!payload || !payload.items || !Array.isArray(payload.items)) {
           const potentialArray = Object.values(payload).find(Array.isArray);
           payload = { items: potentialArray || (Array.isArray(payload) ? payload : []) };
           console.warn(`[GLOBAL WRITE] Auto-wrapping payload for reading_catalog into { items: [...] }`);
      }
  } else {
      path = mockDoc(db, 'metadata', 'config');
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

export const updateCatalogDoc = async (db, docName, payload, { merge = true, userId = 'N/A' } = {}) => {
  const path = `metadata/config/catalog/${docName}`;
  const body = Array.isArray(payload) ? { items: payload } : payload;
  const finalPayload = { ...body, _updatedAt: serverTimestamp(), _updatedBy: userId, _source: 'updateCatalogDoc' };
  return setDocEx(db, path, finalPayload, merge);
};

/* =========================================================
   Provider factory (REWRITTEN FOR DIRECT FIRESTORE ACCESS)
   This function sets up Firestore listeners and returns data/update functions
   Can be called from useEffect without issues
========================================================= */
export const createAppServices = (db, userId) => {
  console.log('[createAppServices] Creating services for userId:', userId);
  
  // Create reactive data stores
  const stores = {
    developmentPlanData: null,
    dailyPracticeData: null,
    strategicContentData: null,
    globalMetadata: null,
    listeners: [] // Store unsubscribe functions
  };

  // Set up Firestore listeners for real-time updates
  if (db && userId) {
    // Development Plan listener
    const devPlanPath = buildModulePath(userId, 'development_plan', 'current');
    const unsubDev = onSnapshotEx(db, devPlanPath, (snap) => {
      stores.developmentPlanData = snap.exists() ? snap.data() : MOCK_DEVELOPMENT_PLAN_DATA;
      console.log('[createAppServices] Dev Plan updated');
    });
    stores.listeners.push(unsubDev);

    // Daily Practice listener
    const dailyPath = buildModulePath(userId, 'daily_practice', 'current');
    const unsubDaily = onSnapshotEx(db, dailyPath, (snap) => {
      stores.dailyPracticeData = snap.exists() ? snap.data() : MOCK_DAILY_PRACTICE_DATA;
      console.log('[createAppServices] Daily Practice updated');
    });
    stores.listeners.push(unsubDaily);

    // Strategic Content listener
    const strategicPath = buildModulePath(userId, 'strategic_content', 'vision_mission');
    const unsubStrategic = onSnapshotEx(db, strategicPath, (snap) => {
      stores.strategicContentData = snap.exists() ? snap.data() : MOCK_STRATEGIC_CONTENT_DATA;
      console.log('[createAppServices] Strategic Content updated');
    });
    stores.listeners.push(unsubStrategic);

    // Global Metadata listener
    const metadataPath = 'metadata/config';
    const unsubMeta = onSnapshotEx(db, metadataPath, (snap) => {
      stores.globalMetadata = snap.exists() ? snap.data() : {};
      console.log('[createAppServices] Global Metadata updated');
    });
    stores.listeners.push(unsubMeta);
  } else {
    // No db or userId - use mock data
    console.warn('[createAppServices] No db or userId provided, using mock data');
    stores.developmentPlanData = MOCK_DEVELOPMENT_PLAN_DATA;
    stores.dailyPracticeData = MOCK_DAILY_PRACTICE_DATA;
    stores.strategicContentData = MOCK_STRATEGIC_CONTENT_DATA;
    stores.globalMetadata = {};
  }

  // Create update functions
  const updateDevelopmentPlanData = async (updates) => {
    if (!db || !userId) return false;
    const path = buildModulePath(userId, 'development_plan', 'current');
    return await updateDocEx(db, path, updates);
  };

  const updateDailyPracticeData = async (updates) => {
    if (!db || !userId) return false;
    const path = buildModulePath(userId, 'daily_practice', 'current');
    return await updateDocEx(db, path, updates);
  };

  const updateStrategicContentData = async (updates) => {
    if (!db || !userId) return false;
    const path = buildModulePath(userId, 'strategic_content', 'vision_mission');
    return await updateDocEx(db, path, updates);
  };

  // Resolve metadata with fallbacks
  const resolvedMetadata = resolveGlobalMetadata(stores.globalMetadata);

  // Return the service object
  return {
    developmentPlanData: stores.developmentPlanData,
    dailyPracticeData: stores.dailyPracticeData,
    strategicContentData: stores.strategicContentData,
    globalMetadata: resolvedMetadata,
    
    updateDevelopmentPlanData,
    updateDailyPracticeData,
    updateStrategicContentData,
    
    // Cleanup function to unsubscribe from listeners
    cleanup: () => {
      console.log('[createAppServices] Cleaning up listeners');
      stores.listeners.forEach(unsub => unsub && unsub());
    }
  };
};

// Default export is the context itself
export default AppServiceContext;
