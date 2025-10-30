// src/services/useAppServices.jsx (FINAL CORRECTED VERSION)
// Custom for rob@sagecg.com - Scales to 10,000+ users
// 
// CRITICAL FIX (10/30/25): Comprehensive Firebase sentinel stripping
// - Enhanced stripSentinels() to catch ALL sentinel types (FieldValue, ServerTimestampTransform, etc.)
// - Applied to ALL Firestore listeners (devPlan, dailyPractice, strategic, membership, metadata, catalogs)
// - Prevents React Error #31 from sentinel objects in state
// - Fixes development plan generation bug where data disappeared after save

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
import { HeartPulse, Briefcase, Users, AlertTriangle, TrendingUp, Zap, ShieldCheck, Target, BarChart3, BookOpen, Film, Trello, Mic, Clock, Cpu, User as UserIcon, DollarSign } from 'lucide-react'; 

console.log('🔥🔥🔥 useAppServices.jsx LOADED - CLEAN STRUCTURE VERSION (Option B) 🔥🔥🔥');

/* =========================================================
   HELPER FUNCTION: Sanitize Firestore Timestamps
========================================================= */
// Recursively converts all Firestore Timestamp objects to JavaScript Date objects
// This prevents React Error #31 when trying to render timestamp objects
const sanitizeTimestamps = (obj) => {
  if (!obj) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeTimestamps(item));
  }
  
  // Handle Firestore Timestamp objects (have toDate method)
  if (obj && typeof obj === 'object' && typeof obj.toDate === 'function') {
    try {
      return obj.toDate();
    } catch (error) {
      console.warn('[sanitizeTimestamps] Error converting timestamp:', error);
      return null;
    }
  }
  
  // Handle plain objects
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeTimestamps(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

/* =========================================================
   HELPER FUNCTION: Strip FieldValue Sentinels (COMPREHENSIVE)
========================================================= */
// Removes ALL types of FieldValue sentinels (deleteField, serverTimestamp, increment, etc.)
// This prevents React Error #31 when optimistic updates include sentinels
// CRITICAL: Must catch ALL sentinel variations to prevent state corruption
const stripSentinels = (val) => {
  // Handle null, undefined, and primitives
  if (!val || typeof val !== 'object') {
    return val;
  }
  
  // COMPREHENSIVE SENTINEL DETECTION
  // Check multiple ways sentinels can manifest:
  const isSentinel = (
    // Method 1: Check constructor name (most reliable)
    val.constructor?.name === 'FieldValue' ||
    val.constructor?.name === 'ServerTimestampTransform' ||
    val.constructor?.name === 'DeleteFieldValueImpl' ||
    val.constructor?.name === 'NumericIncrementFieldValueImpl' ||
    val.constructor?.name === 'ArrayUnionFieldValueImpl' ||
    val.constructor?.name === 'ArrayRemoveFieldValueImpl' ||
    
    // Method 2: Check for _methodName property (legacy)
    (val._methodName && typeof val._methodName === 'string') ||
    
    // Method 3: Check for sentinel methods
    val._methodName === 'serverTimestamp' ||
    val._methodName === 'delete' ||
    val._methodName === 'increment' ||
    val._methodName === 'arrayUnion' ||
    val._methodName === 'arrayRemove' ||
    
    // Method 4: Has toJSON but is NOT a Date or Timestamp
    (val.toJSON && 
     typeof val.toJSON === 'function' && 
     !val.toISOString && // Not a Date
     !val.toDate) // Not a Firestore Timestamp
  );
  
  if (isSentinel) {
    console.warn('[stripSentinels] 🛑 Removing Firebase sentinel:', {
      constructor: val.constructor?.name,
      methodName: val._methodName,
      type: typeof val
    });
    return null; // Return null instead of undefined for clearer filtering
  }
  
  // Preserve Date objects
  if (val instanceof Date) {
    return val;
  }
  
  // Preserve Firestore Timestamps (they have toDate method)
  if (val.toDate && typeof val.toDate === 'function') {
    return val;
  }
  
  // Handle arrays
  if (Array.isArray(val)) {
    const cleaned = val
      .map(item => stripSentinels(item))
      .filter(item => item !== null && item !== undefined);
    return cleaned;
  }
  
  // Handle objects - recursively strip sentinels from all properties
  if (val && typeof val === 'object') {
    const cleaned = {};
    let sentinelCount = 0;
    
    for (const key in val) {
      if (val.hasOwnProperty(key)) {
        const cleanedValue = stripSentinels(val[key]);
        
        // Only add non-null, non-undefined values
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        } else if (cleanedValue === null) {
          // Sentinel was removed
          sentinelCount++;
        }
      }
    }
    
    if (sentinelCount > 0) {
      console.log(`[stripSentinels] ✅ Stripped ${sentinelCount} sentinel(s) from object`);
    }
    
    return cleaned;
  }
  
  return val;
};


/* =========================================================
   HELPER FUNCTION: Detect Firestore FieldValue Sentinels
   and Delete-Aware UI Merge (prevents React error #31)
========================================================= */
const isFirestoreSentinel = (v) =>
  v && typeof v === 'object' && typeof v._methodName === 'string';

/**
 * Deep, delete-aware merge for optimistic UI updates.
 * - If patch value is a Firestore sentinel => delete that key locally.
 * - If object => recurse
 * - If array => replace (arrays are not merged)
 * - Never returns sentinel objects (so it's safe for React state).
 */
function applyPatchDeleteAware(prev, patch) {
  // Pass through primitives/null
  if (patch === null || typeof patch !== 'object') return patch;

  // Arrays: replace whole branch after removing sentinels
  if (Array.isArray(patch)) {
    return stripSentinels(patch);
  }

  // Objects
  const base =
    prev && typeof prev === 'object' && !Array.isArray(prev) ? { ...prev } : {};

  for (const [k, v] of Object.entries(patch)) {
    if (isFirestoreSentinel(v)) {
      // deleteField() => remove locally for optimistic UI
      delete base[k];
      continue;
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      base[k] = applyPatchDeleteAware(base[k], v);
    } else {
      base[k] = v;
    }
  }
  return base;
}


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

// REQ #5 (BUG FIX): Helper function to remove 'undefined' values before saving to Firestore
const cleanUndefinedValues = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefinedValues);
  
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        newObj[key] = cleanUndefinedValues(value); // Recurse
      } else {
        console.warn(`[cleanUndefinedValues] Removed 'undefined' from key: ${key}`);
      }
    }
  }
  return newObj;
};


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
  // console.log(`[setDocEx] Data (Raw):`, data); // Too noisy
  console.log(`[setDocEx] Merge: ${merge}`);
  console.log(`[setDocEx] DB exists: ${!!db}`);
  
  if (!db) {
      console.warn(`[setDocEx] No Firestore DB instance provided for path: ${path}. Using mock.`);
      return mockSetDoc(path, data);
  }
  
  try {
      // REQ #5 (BUG FIX): Clean data of undefined values
      console.log(`[setDocEx] Cleaning data for Firestore...`);
      const cleanedData = cleanUndefinedValues(data);
      
      console.log(`[setDocEx] Creating dataWithTimestamp...`);
      const dataWithTimestamp = { ...cleanedData, _updatedAt: serverTimestamp() };
      
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
        // REQ #5 (BUG FIX): Clean data of undefined values
        const cleanedData = cleanUndefinedValues(data);

        const dataWithTimestamp = { ...cleanedData, _updatedAt: serverTimestamp() };
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
            // NOTE: 'currentPlan' is the container, which is what the component checks for.
            currentPlan: null, 
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
            // Add the new whyStatement
            whyStatement: '',
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
    
    // ==================== MEMBERSHIP MODULE (NEW) ====================
    const membershipPath = buildModulePath(uid, 'membership', 'current');
    const membershipSnap = await getDocEx(db, membershipPath);

    if (!membershipSnap.exists()) {
        console.log(`[ensureUserDocs] Creating membership data at: ${membershipPath}`);
        const defaultMembership = {
            status: 'Trial', // Default to Trial or Free
            currentPlanId: 'trial',
            nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days trial
            paymentHistory: [],
            notifications: [
                { id: 'welcome', message: 'Welcome to your 7-day free trial! Upgrade now to maintain access.', type: 'warning', isRead: false }
            ],
            _createdAt: serverTimestamp()
        };
        await setDocEx(db, membershipPath, defaultMembership);
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
  currentPlan: null, // Ensure mock reflects reality
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
  whyStatement: '', // Add mock field
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

export const MOCK_MEMBERSHIP_DATA = {
    status: 'Trial',
    currentPlanId: 'trial',
    nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentHistory: [],
    notifications: [
        { id: 'welcome', message: 'Welcome to your 7-day free trial! Upgrade now to maintain access.', type: 'warning', isRead: false }
    ],
};

const MOCK_MEMBERSHIP_PLANS = {
    items: [
        { 
            id: 'trial', 
            name: 'Free Trial', 
            price: 0, 
            recurrence: 'N/A', 
            isTrial: true,
            features: [
                '7-Day Full Access', 
                'Limited Rep Catalog', 
                'Dashboard & Planning Hub', 
                'No AI Coaching'
            ]
        },
        { 
            id: 'basic', 
            name: 'Pro', 
            price: 49.99, 
            recurrence: 'Monthly', 
            features: [
                'Full Rep & Content Library', 
                'Unlimited Daily Practice', 
                'Dashboard & Planning Hub', 
                'Core AI Coaching Lab Access'
            ]
        },
        { 
            id: 'pro', 
            name: 'Executive Leader', 
            price: 499.00, 
            recurrence: 'Annually', 
            features: [
                'All Pro Features', 
                'Executive ROI Report Generation', 
                'Priority Access to new Content', 
                'Dedicated 1-on-1 AI Coaching'
            ]
        }
    ]
};

// Global metadata mocks
const MOCK_FEATURE_FLAGS = { enableNewFeature: false, enableMembershipModule: true };
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
        // We use setDocEx with merge:true for all user module updates
        const success = await setDocEx(db, path, updates, true);
        
        if (success) {
          console.log(`[useFirestoreUserData.updateData] ✅ Successfully updated ${path}`);
          // Optimistically update local state
          setData(prev => applyPatchDeleteAware(prev, updates));
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


// --- Begin compatibility helpers for lower-case config keys ---
// Prefer lower_case config fields with graceful fallback to legacy UPPER_CASE
const cfg = (obj, keys, fallback) => {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const k of list) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
  }
  return fallback;
};
// --- End compatibility helpers ---

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
    MEMBERSHIP_PLANS: MOCK_MEMBERSHIP_PLANS, // ADDED: Membership plans mock
    RESOURCE_LIBRARY: {},
    IconMap: {},
    APP_ID: 'default-app-id',
    GEMINI_MODEL: GEMINI_MODEL,
    // 💡 FIX: Add mock/fallback for admin emails here
    adminemails: ADMIN_EMAILS,
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
            ShieldCheck, Target, BarChart3, BookOpen, Film, Trello, Mic, Clock, Cpu, UserIcon, DollarSign
          };
          const iconMap = {};
          Object.keys(iconComponents).forEach(name => {
              iconMap[name] = iconComponents[name];
          });

          setMetadata(prev => ({ // Merge with previous state to keep defaults/mocks until catalogs load
              ...prev,
              // flags (support feature_flags and featureFlags)
              featureFlags: cfg(configData, ['feature_flags', 'featureFlags'], MOCK_FEATURE_FLAGS),

              // 💡 FIX: Read the adminemails field (supports 'adminemails' and legacy 'ADMIN_EMAILS')
              adminemails:              cfg(configData, ['adminemails', 'ADMIN_EMAILS'], ADMIN_EMAILS), // <-- ADDED THIS LINE

              // catalogs/libraries — prefer lower_case, fallback to legacy UPPER_CASE, then mock
              LEADERSHIP_TIERS:       cfg(configData, ['leadership_tiers', 'LEADERSHIP_TIERS'], LEADERSHIP_TIERS_FALLBACK),
              REP_LIBRARY:            cfg(configData, ['rep_library', 'REP_LIBRARY'], MOCK_REP_LIBRARY),
              EXERCISE_LIBRARY:       cfg(configData, ['exercise_library', 'EXERCISE_LIBRARY'], MOCK_EXERCISE_LIBRARY),
              WORKOUT_LIBRARY:        cfg(configData, ['workout_library', 'WORKOUT_LIBRARY'], MOCK_WORKOUT_LIBRARY),
              COURSE_LIBRARY:         cfg(configData, ['course_library', 'COURSE_LIBRARY'], MOCK_COURSE_LIBRARY),
              SKILL_CATALOG:          cfg(configData, ['skill_catalog', 'SKILL_CATALOG'], MOCK_SKILL_CATALOG),
              IDENTITY_ANCHOR_CATALOG:cfg(configData, ['identity_anchor_catalog', 'IDENTITY_ANCHOR_CATALOG'], MOCK_IDENTITY_ANCHOR_CATALOG),
              HABIT_ANCHOR_CATALOG:   cfg(configData, ['habit_anchor_catalog', 'HABIT_ANCHOR_CATALOG'], MOCK_HABIT_ANCHOR_CATALOG),
              WHY_CATALOG:            cfg(configData, ['why_catalog', 'WHY_CATALOG'], MOCK_WHY_CATALOG),
              READING_CATALOG:        cfg(configData, ['reading_catalog', 'READING_CATALOG'], MOCK_READING_CATALOG),
              VIDEO_CATALOG:          cfg(configData, ['video_catalog', 'VIDEO_CATALOG'], MOCK_VIDEO_CATALOG),
              SCENARIO_CATALOG:       cfg(configData, ['scenario_catalog', 'SCENARIO_CATALOG'], MOCK_SCENARIO_CATALOG),
              MEMBERSHIP_PLANS:       cfg(configData, ['membership_plans', 'MEMBERSHIP_PLANS'], MOCK_MEMBERSHIP_PLANS), // ADDED: Membership plans

              RESOURCE_LIBRARY:       cfg(configData, ['resource_library', 'RESOURCE_LIBRARY'], {}),

              // app/system config — prefer lower_case
              APP_ID:                 cfg(configData, ['app_id', 'APP_ID'], 'default-app-id'),
              GEMINI_MODEL:           cfg(configData, ['gemini_model', 'GEMINI_MODEL'], GEMINI_MODEL),

              // built-in icon map
              IconMap: iconMap,
          }));

      } catch (e) {
          console.error("[CRITICAL GLOBAL READ FAIL] Metadata fetch failed.", e);
          setError(e);
          setMetadata({
              featureFlags: MOCK_FEATURE_FLAGS,
              LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK,
              IconMap: {},
              GEMINI_MODEL: GEMINI_MODEL,
              APP_ID: 'error-app-id',
              adminemails: ADMIN_EMAILS, // Ensure fallback is set on error
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
    adminemails: meta?.adminemails || ADMIN_EMAILS, // 💡 FIX: Include adminemails in resolved metadata
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
    MEMBERSHIP_PLANS: meta?.MEMBERSHIP_PLANS || MOCK_MEMBERSHIP_PLANS, // ADDED: Membership plans
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
  let useCatalogDoc = false;

  const catalogKeys = [
    'REP_LIBRARY', 'EXERCISE_LIBRARY', 'WORKOUT_LIBRARY', 'COURSE_LIBRARY', 
    'SKILL_CATALOG', 'IDENTITY_ANCHOR_CATALOG', 'HABIT_ANCHOR_CATALOG', 
    'WHY_CATALOG', 'READING_CATALOG', 'VIDEO_CATALOG', 'SCENARIO_CATALOG',
    'MEMBERSHIP_PLANS' // Check for membership plans too
  ];
  
  // Check if we are trying to update a catalog
  const catalogKeyToUpdate = catalogKeys.find(key => data.hasOwnProperty(key));

  if (catalogKeyToUpdate === 'MEMBERSHIP_PLANS' && forceDocument === 'config') {
      // Use the dedicated catalog writer for membership plans to place it correctly
      useCatalogDoc = true;
      path = 'metadata/config/catalog/membership_plans'; // The correct location
      const body = Array.isArray(payload.MEMBERSHIP_PLANS) ? { items: payload.MEMBERSHIP_PLANS } : payload.MEMBERSHIP_PLANS;
      payload = body;
  } else if (forceDocument === 'reading_catalog') {
      path = mockDoc(db, 'metadata', 'reading_catalog');
      if (!payload || !payload.items || !Array.isArray(payload.items)) {
           const potentialArray = Object.values(payload).find(Array.isArray);
           payload = { items: potentialArray || (Array.isArray(payload) ? payload : []) };
           console.warn(`[GLOBAL WRITE] Auto-wrapping payload for reading_catalog into { items: [...] }`);
      }
  } else {
      path = mockDoc(db, 'metadata', 'config');
      // Clean out catalog keys from the main config doc to prevent write errors
      catalogKeys.forEach(key => delete payload[key]); 
      delete payload.RESOURCE_LIBRARY; delete payload.RESOURCE_LIBRARY_ITEMS; delete payload.catalog; 
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
  
  // Create reactive data stores using a simple observable pattern
  const stores = {
    developmentPlanData: null,
    dailyPracticeData: null,
    strategicContentData: null,
    membershipData: null, // ADDED: Membership data store
    globalMetadata: null,
    listeners: [], // Store unsubscribe functions
    onChange: null // Callback for when data changes
  };

  // Helper to notify about data changes
  const notifyChange = () => {
    if (stores.onChange) {
      stores.onChange({
        developmentPlanData: stores.developmentPlanData,
        dailyPracticeData: stores.dailyPracticeData,
        strategicContentData: stores.strategicContentData,
        membershipData: stores.membershipData, // ADDED: Notify membership data
        globalMetadata: stores.globalMetadata
      });
    }
  };

  // Set up Firestore listeners for real-time updates
  if (db && userId) {
    // Development Plan listener
    const devPlanPath = buildModulePath(userId, 'development_plan', 'current');
    const unsubDev = onSnapshotEx(db, devPlanPath, (snap) => {
      const rawData = snap.exists() ? snap.data() : MOCK_DEVELOPMENT_PLAN_DATA;
      // FIX APPLIED HERE: Apply BOTH sanitizers: remove timestamps AND sentinels
      stores.developmentPlanData = stripSentinels(sanitizeTimestamps(rawData));
      console.log('[createAppServices] 📋 Dev Plan updated (sentinels stripped)');
      notifyChange();
    });
    stores.listeners.push(unsubDev);

    // Daily Practice listener
    const dailyPath = buildModulePath(userId, 'daily_practice', 'current');
    const unsubDaily = onSnapshotEx(db, dailyPath, (snap) => {
      const rawData = snap.exists() ? snap.data() : MOCK_DAILY_PRACTICE_DATA;
      // Apply BOTH sanitizers: remove timestamps AND sentinels
      stores.dailyPracticeData = stripSentinels(sanitizeTimestamps(rawData));
      console.log('[createAppServices] 💪 Daily Practice updated (sentinels stripped)');
      notifyChange();
    });
    stores.listeners.push(unsubDaily);

    // Strategic Content listener
    const strategicPath = buildModulePath(userId, 'strategic_content', 'vision_mission');
    const unsubStrategic = onSnapshotEx(db, strategicPath, (snap) => {
      const rawData = snap.exists() ? snap.data() : MOCK_STRATEGIC_CONTENT_DATA;
      // CRITICAL: Apply BOTH sanitizers: remove timestamps AND sentinels
      stores.strategicContentData = stripSentinels(sanitizeTimestamps(rawData));
      console.log('[createAppServices] Strategic Content updated');
      notifyChange();
    });
    stores.listeners.push(unsubStrategic);
    
    // Membership Listener (NEW)
    const membershipPath = buildModulePath(userId, 'membership', 'current');
    const unsubMembership = onSnapshotEx(db, membershipPath, (snap) => {
      const rawData = snap.exists() ? snap.data() : MOCK_MEMBERSHIP_DATA;
      // CRITICAL: Apply BOTH sanitizers: remove timestamps AND sentinels
      stores.membershipData = stripSentinels(sanitizeTimestamps(rawData));
      console.log('[createAppServices] Membership Data updated');
      notifyChange();
    });
    stores.listeners.push(unsubMembership);

    // Global Metadata - Main Config listener
    const metadataPath = 'metadata/config';
    const unsubMeta = onSnapshotEx(db, metadataPath, (snap) => {
      // Start with base config data
      if (!stores.globalMetadata) {
        stores.globalMetadata = {};
      }
      
      // Merge in the main config fields (featureFlags, LEADERSHIP_TIERS, etc.)
      if (snap.exists()) {
        // CRITICAL: Apply BOTH sanitizers: remove timestamps AND sentinels
        const cleanData = stripSentinels(sanitizeTimestamps(snap.data()));
        Object.assign(stores.globalMetadata, cleanData);
      }
      
      console.log('[createAppServices] Global Metadata (config) updated');
      notifyChange();
    });
    stores.listeners.push(unsubMeta);
    
    // Catalog listeners - these are in the catalog subcollection
    const catalogNames = [
      'rep_library',
      'exercise_library', 
      'workout_library',
      'course_library',
      'skill_catalog',
      'identity_anchor_catalog',
      'habit_anchor_catalog',
      'why_catalog',
      'reading_catalog',
      'video_catalog',
      'scenario_catalog',
      'membership_plans' // ADDED: Membership plans catalog
    ];
    
    catalogNames.forEach(catalogName => {
      const catalogPath = `metadata/config/catalog/${catalogName}`;
      const unsubCatalog = onSnapshotEx(db, catalogPath, (snap) => {
        if (!stores.globalMetadata) {
          stores.globalMetadata = {};
        }
        
        if (snap.exists()) {
          // Convert snake_case to UPPER_CASE for the key name
          const keyName = catalogName.toUpperCase();
          // CRITICAL: Apply BOTH sanitizers: remove timestamps AND sentinels
          stores.globalMetadata[keyName] = stripSentinels(sanitizeTimestamps(snap.data()));
          console.log(`[createAppServices] Catalog ${catalogName} loaded:`, snap.data().items?.length || 0, 'items');
        }
        
        notifyChange();
      });
      stores.listeners.push(unsubCatalog);
    });
  } else {
    // No db or userId - use mock data
    console.warn('[createAppServices] No db or userId provided, using mock data');
    stores.developmentPlanData = MOCK_DEVELOPMENT_PLAN_DATA;
    stores.dailyPracticeData = MOCK_DAILY_PRACTICE_DATA;
    stores.strategicContentData = MOCK_STRATEGIC_CONTENT_DATA;
    stores.membershipData = MOCK_MEMBERSHIP_DATA; // ADDED: Mock Membership Data
    stores.globalMetadata = {
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
      MEMBERSHIP_PLANS: MOCK_MEMBERSHIP_PLANS, // ADDED: Mock Membership Plans
      RESOURCE_LIBRARY: {},
      IconMap: {},
      GEMINI_MODEL: GEMINI_MODEL,
      APP_ID: 'mock-app-id'
    };
  }

  // Create update functions
  const updateDevelopmentPlanData = async (updates, { merge = true } = {}) => {
    if (!db || !userId) return false;
    const path = buildModulePath(userId, 'development_plan', 'current');
    console.log(`[updateDevelopmentPlanData] Executing with setDocEx (merge=${merge})`);
    const ok = await setDocEx(db, path, updates, merge);
    // Removed optimistic update - listener will fire with clean data
    return ok;
  };

  const updateDailyPracticeData = async (updates) => {
    if (!db || !userId) return false;
    const path = buildModulePath(userId, 'daily_practice', 'current');
    
    const ok = await setDocEx(db, path, updates, true);
    if (ok) {
      // Optimistic UI: apply delete-aware merge locally & notify
      stores.dailyPracticeData = applyPatchDeleteAware(stores.dailyPracticeData || {}, updates);
      notifyChange();
    }
    return ok;
  };

  const updateStrategicContentData = async (updates) => {
    if (!db || !userId) return false;
    const path = buildModulePath(userId, 'strategic_content', 'vision_mission');
    
    const ok = await setDocEx(db, path, updates, true);
    if (ok) {
      // Optimistic UI: apply delete-aware merge locally & notify
      stores.strategicContentData = applyPatchDeleteAware(stores.strategicContentData || {}, updates);
      notifyChange();
    }
    return ok;
  };
  
  // Update Membership Data (NEW)
  const updateMembershipData = async (updates) => {
    if (!db || !userId) return false;
    const path = buildModulePath(userId, 'membership', 'current');
    const ok = await setDocEx(db, path, updates, true);
    if (ok) {
      stores.membershipData = applyPatchDeleteAware(stores.membershipData || {}, updates);
      notifyChange();
    }
    return ok;
  };
  
  // =========================================================
  // 🛑 NEW: FULL PLAN AND ANCHOR CLEAR FUNCTION (CRITICAL FIX)
  // =========================================================
  const clearUserPlanAndAnchors = async () => {
      if (!db || !userId) {
          console.warn('[clearUserPlanAndAnchors] DB or UserID missing, skipping clear.');
          return false;
      }
      
      const devPlanPath = buildModulePath(userId, 'development_plan', 'current');
      const dailyPath = buildModulePath(userId, 'daily_practice', 'current');
      const todayStr = new Date().toISOString().split('T')[0];
      
      console.log('[clearUserPlanAndAnchors] Initiating full plan and daily practice clear.');
      
      // 1. CLEAR DEVELOPMENT PLAN to its default state
      const defaultPlanPayload = {
          currentPlan: null, // CRITICAL: Set to null to trigger Baseline view
          currentCycle: 1,
          lastAssessmentDate: null,
          assessmentHistory: [], 
          planHistory: [],
      };
      // 🛑 CRITICAL FIX: Use merge: false (or omit it) to force an OVERWRITE.
      // This wipes out all old residual fields like 'coreReps', 'skills', etc.
      const ok1 = await setDocEx(db, devPlanPath, defaultPlanPayload, false); 

      // 2. CLEAR DAILY PRACTICE to its default state (removes all anchors/targets)
      const defaultDailyPracticePayload = {
          activeCommitments: [], 
          identityAnchor: '', 
          habitAnchor: '', 
          whyStatement: '',
          dailyTargetRepId: null, 
          dailyTargetRepDate: null, 
          dailyTargetRepStatus: 'Pending', 
          streakCount: 0,
          streakCoins: 0,
          lastUpdated: todayStr,
          completedRepsToday: [],
      };
      // 🛑 CRITICAL FIX: Use merge: false (or omit it) to force an OVERWRITE.
      const ok2 = await setDocEx(db, dailyPath, defaultDailyPracticePayload, false);
      
      const result = ok1 && ok2;
      console.log(`[clearUserPlanAndAnchors] Plan Clear Status: ${result ? 'SUCCESS' : 'FAILED'} (Forced Overwrite)`);
      return result;
  };

  // Return the service object with getter functions and a way to set onChange callback
  return {
    // Data getters that access the current state
    get developmentPlanData() { return stores.developmentPlanData; },
    get dailyPracticeData() { return stores.dailyPracticeData; },
    get strategicContentData() { return stores.strategicContentData; },
    get membershipData() { return stores.membershipData; }, // ADDED: Getter for membership data
    get globalMetadata() { 
      // Always resolve metadata with fallbacks
      return resolveGlobalMetadata(stores.globalMetadata);
    },
    
    // Update functions
    updateDevelopmentPlanData,
    updateDailyPracticeData,
    updateStrategicContentData,
    updateMembershipData, // ADDED: Update membership data function
    
    // Utility functions
    clearUserPlanAndAnchors, // 🛑 NEW EXPORTED FUNCTION
    
    // Method to set onChange callback
    setOnChange: (callback) => {
      stores.onChange = callback;
    },
    
    // Cleanup function to unsubscribe from listeners
    cleanup: () => {
      console.log('[createAppServices] Cleaning up listeners');
      stores.listeners.forEach(unsub => unsub && unsub());
    }
  };
};

// Default export is the context itself
export default AppServiceContext;