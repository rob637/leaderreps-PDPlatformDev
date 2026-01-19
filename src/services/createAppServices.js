// src/services/createAppServices.js
import { onSnapshotEx, setDocEx, getDocEx } from './firestoreUtils';
import { buildModulePath } from './pathUtils';
import { Timestamp } from 'firebase/firestore';
import { 
    MOCK_DEVELOPMENT_PLAN_DATA, MOCK_DAILY_PRACTICE_DATA, MOCK_STRATEGIC_CONTENT_DATA, 
    MOCK_MEMBERSHIP_DATA, MOCK_MEMBERSHIP_PLANS, MOCK_FEATURE_FLAGS, MOCK_REP_LIBRARY,
    MOCK_EXERCISE_LIBRARY, MOCK_WORKOUT_LIBRARY, MOCK_COURSE_LIBRARY, MOCK_SKILL_CATALOG,
    MOCK_IDENTITY_ANCHOR_CATALOG, MOCK_HABIT_ANCHOR_CATALOG, MOCK_WHY_CATALOG,
    MOCK_READING_CATALOG, MOCK_VIDEO_CATALOG, MOCK_SCENARIO_CATALOG, LEADERSHIP_TIERS_FALLBACK
} from './mockData.js';
import { applyPatchDeleteAware, sanitizeTimestamps, stripSentinels } from './dataUtils.js';
import { resolveGlobalMetadata } from './metadataResolver.js';
import { checkAndPerformRollover } from '../utils/dailyRollover.js';
import { timeService } from './timeService.js';

/**
 * Check if a value is a Firebase field value sentinel (serverTimestamp, increment, etc.)
 * These need to be passed through to Firestore untouched.
 */
const isFirebaseFieldValue = (value) => {
  if (!value || typeof value !== 'object') return false;
  // Firebase field values have _methodName property
  return value._methodName === 'serverTimestamp' || 
         value._methodName === 'increment' ||
         value._methodName === 'arrayUnion' ||
         value._methodName === 'arrayRemove' ||
         value._methodName === 'deleteField';
};

/**
 * Convert Date objects to Firestore Timestamps recursively
 * Preserves Firebase field value sentinels (serverTimestamp, etc.)
 */
const convertDatesToTimestamps = (obj) => {
  if (!obj) return obj;
  if (obj instanceof Date) {
    return Timestamp.fromDate(obj);
  }
  // Preserve Firebase field value sentinels (serverTimestamp, increment, etc.)
  if (isFirebaseFieldValue(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => convertDatesToTimestamps(item));
  }
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const converted = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        converted[key] = convertDatesToTimestamps(obj[key]);
      }
    }
    return converted;
  }
  return obj;
};

/**
 * Calculate milliseconds until 11:59:59 PM today (or tomorrow if already past)
 */
const getMsUntilMidnight = () => {
  return timeService.getMsUntilMidnight();
};

export const createAppServices = (db, userId) => {
  const stores = {
    userProfile: null, // Added userProfile
    developmentPlanData: null,
    dailyPracticeData: null,
    strategicContentData: null,
    membershipData: null,
    globalMetadata: null,
    listeners: [],
    onChange: null,
    midnightTimer: null // Track the midnight timer for cleanup
  };

  const notifyChange = () => {
    if (stores.onChange) {
      stores.onChange({
        userProfile: stores.userProfile, // Added userProfile
        developmentPlanData: stores.developmentPlanData,
        dailyPracticeData: stores.dailyPracticeData,
        strategicContentData: stores.strategicContentData,
        membershipData: stores.membershipData,
        globalMetadata: stores.globalMetadata
      });
    }
  };

  if (db && userId) {
    // User Profile Listener
    // We need to import buildUserProfilePath or construct it manually. 
    // Since buildModulePath is imported, let's check if buildUserProfilePath is available.
    // It is imported at the top.
    // import { buildModulePath } from './pathUtils'; -> Wait, I need to check imports.
    
    const userProfilePath = `users/${userId}`; 
    const unsubUser = onSnapshotEx(db, userProfilePath, (snap) => {
      if (snap.exists()) {
        stores.userProfile = stripSentinels(sanitizeTimestamps(snap.data()));
      } else {
        stores.userProfile = null;
      }
      notifyChange();
    });
    stores.listeners.push(unsubUser);

    // LEGACY PLAN - Commented out 12/18/25
    const devPlanPath = buildModulePath(userId, 'development_plan', 'current');
    const unsubDev = onSnapshotEx(db, devPlanPath, (snap) => {
      const rawData = snap.exists() ? snap.data() : MOCK_DEVELOPMENT_PLAN_DATA;
      stores.developmentPlanData = stripSentinels(sanitizeTimestamps(rawData));
      notifyChange();
    });
    stores.listeners.push(unsubDev);

    const dailyPath = buildModulePath(userId, 'daily_practice', 'current');
    const unsubDaily = onSnapshotEx(db, dailyPath, (snap) => {
      const rawData = snap.exists() ? snap.data() : MOCK_DAILY_PRACTICE_DATA;
      stores.dailyPracticeData = stripSentinels(sanitizeTimestamps(rawData));
      
      // Check for Rollover (Lazy Evaluation)
      if (snap.exists() && stores.dailyPracticeData) {
        checkAndPerformRollover(db, userId, stores.dailyPracticeData)
          .catch(err => console.error('[createAppServices] Rollover error:', err));
      }

      notifyChange();
    });
    stores.listeners.push(unsubDaily);

    // === MIDNIGHT AUTO-ROLLOVER TIMER ===
    // Schedule rollover to run at 11:59:59 PM if app is open
    const scheduleMidnightRollover = () => {
      const msUntil = getMsUntilMidnight();
      
      stores.midnightTimer = setTimeout(async () => {
        if (stores.dailyPracticeData) {
          try {
            await checkAndPerformRollover(db, userId, stores.dailyPracticeData);
          } catch (err) {
            console.error('[MIDNIGHT ROLLOVER] Rollover error:', err);
          }
        }
        
        // Schedule the next midnight rollover (for tomorrow)
        scheduleMidnightRollover();
      }, msUntil);
    };
    
    // Start the midnight rollover scheduler
    scheduleMidnightRollover();

    // === DISABLED: strategicContentData listener ===
    // PlanningHub (enablePlanningHub: false) and ExecutiveReflection (enableRoiReport: false)
    // are both disabled. Re-enable this listener when those features launch.
    // const strategicPath = buildModulePath(userId, 'strategic_content', 'vision_mission');
    // const unsubStrategic = onSnapshotEx(db, strategicPath, (snap) => {
    //   const rawData = snap.exists() ? snap.data() : MOCK_STRATEGIC_CONTENT_DATA;
    //   stores.strategicContentData = stripSentinels(sanitizeTimestamps(rawData));
    //   notifyChange();
    // });
    // stores.listeners.push(unsubStrategic);
    stores.strategicContentData = MOCK_STRATEGIC_CONTENT_DATA; // Use mock data for now
    
    const membershipPath = buildModulePath(userId, 'membership', 'current');
    const unsubMembership = onSnapshotEx(db, membershipPath, (snap) => {
      const rawData = snap.exists() ? snap.data() : MOCK_MEMBERSHIP_DATA;
      stores.membershipData = stripSentinels(sanitizeTimestamps(rawData));
      notifyChange();
    });
    stores.listeners.push(unsubMembership);

    const metadataPath = 'metadata/config';
    const unsubMeta = onSnapshotEx(db, metadataPath, (snap) => {
      if (snap.exists()) {
        const cleanData = stripSentinels(sanitizeTimestamps(snap.data()));
        stores.globalMetadata = {
          ...(stores.globalMetadata || {}),
          ...cleanData
        };
      } else if (!stores.globalMetadata) {
        stores.globalMetadata = {};
      }
      
      notifyChange();
    });
    stores.listeners.push(unsubMeta);
    
    // === PERFORMANCE OPTIMIZATION ===
    // Catalogs are static data that rarely changes. Instead of 14+ real-time listeners,
    // we fetch them ONCE at startup. This reduces Firebase connections from ~20 to ~6.
    // If catalog data needs to be updated, user can refresh the app.
    
    const catalogNames = [
      'rep_library', 'exercise_library', 'workout_library', 'course_library',
      'skill_catalog', 'identity_anchor_catalog', 'habit_anchor_catalog',
      'why_catalog', 'video_catalog', 'scenario_catalog',
      'membership_plans'
    ];
    
    // One-time fetch for all catalogs (runs in parallel)
    const fetchCatalogs = async () => {
      const catalogPromises = catalogNames.map(async (catalogName) => {
        const catalogPath = `metadata/config/catalog/${catalogName}`;
        try {
          const snap = await getDocEx(db, catalogPath);
          if (snap.exists()) {
            const keyName = catalogName.toUpperCase();
            return { key: keyName, data: stripSentinels(sanitizeTimestamps(snap.data())) };
          }
        } catch (err) {
          console.warn(`[createAppServices] Failed to fetch catalog ${catalogName}:`, err.message);
        }
        return null;
      });
      
      // Also fetch reading_catalog, system_quotes, and leadership_tiers
      const readingPromise = getDocEx(db, 'metadata/reading_catalog').then(snap => {
        if (snap.exists()) {
          return { key: 'READING_CATALOG', data: stripSentinels(sanitizeTimestamps(snap.data())) };
        }
        return null;
      }).catch(err => {
        console.warn('[createAppServices] Failed to fetch reading_catalog:', err.message);
        return null;
      });
      
      const quotesPromise = getDocEx(db, 'system_lovs/system_quotes').then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.items && Array.isArray(data.items)) {
            return { key: 'SYSTEM_QUOTES', data: data.items };
          }
        }
        return null;
      }).catch(err => {
        console.warn('[createAppServices] Failed to fetch system_quotes:', err.message);
        return null;
      });
      
      const tiersPromise = getDocEx(db, 'system_lovs/leadership_tiers').then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.values && Array.isArray(data.values)) {
            const tiersMap = {};
            data.values.forEach(t => {
              if (t.isActive !== false) {
                tiersMap[t.code] = { 
                  name: t.label, 
                  hex: t.color, 
                  color: t.color,
                  ...t 
                };
              }
            });
            if (!tiersMap['All']) tiersMap['All'] = { name: 'All Tiers', hex: '#47A88D', color: 'teal-500' };
            if (!tiersMap['System']) tiersMap['System'] = { name: 'System Info', hex: '#47A88D', color: 'gray-500' };
            return { key: 'LEADERSHIP_TIERS', data: tiersMap };
          }
        }
        return null;
      }).catch(err => {
        console.warn('[createAppServices] Failed to fetch leadership_tiers:', err.message);
        return null;
      });
      
      // Wait for all fetches to complete
      const results = await Promise.all([...catalogPromises, readingPromise, quotesPromise, tiersPromise]);
      
      // Merge all results into globalMetadata
      results.forEach(result => {
        if (result) {
          stores.globalMetadata = {
            ...(stores.globalMetadata || {}),
            [result.key]: result.data
          };
        }
      });
      
      notifyChange();
    };
    
    // Fetch catalogs asynchronously (don't block app startup)
    fetchCatalogs().catch(err => {
      console.error('[createAppServices] Catalog fetch error:', err);
    });
    
  } else {
    console.warn('[createAppServices] No db or userId provided, using mock data');
    stores.developmentPlanData = MOCK_DEVELOPMENT_PLAN_DATA;
    stores.dailyPracticeData = MOCK_DAILY_PRACTICE_DATA;
    stores.strategicContentData = MOCK_STRATEGIC_CONTENT_DATA;
    stores.membershipData = MOCK_MEMBERSHIP_DATA;
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
      MEMBERSHIP_PLANS: MOCK_MEMBERSHIP_PLANS,
      RESOURCE_LIBRARY: {},
      IconMap: {},
      GEMINI_MODEL: 'gemini-pro',
      APP_ID: 'mock-app-id'
    };
  }

  const updateDevelopmentPlanData = async (updates, { merge = true } = {}) => {
    if (!db || !userId) return false;
    
    // Convert Date objects to Firestore Timestamps
    const convertedUpdates = convertDatesToTimestamps(updates);
    const path = buildModulePath(userId, 'development_plan', 'current');
    
    // Optimistic Update: Update local store immediately
    if (stores.developmentPlanData) {
      stores.developmentPlanData = applyPatchDeleteAware(stores.developmentPlanData, updates);
      notifyChange();
    }

    const result = await setDocEx(db, path, convertedUpdates, merge);
    return result;
  };

  const updateDailyPracticeData = async (updates) => {
    if (!db || !userId) return false;
    const path = buildModulePath(userId, 'daily_practice', 'current');
    
    const ok = await setDocEx(db, path, updates, true);
    
    if (ok) {
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
      stores.strategicContentData = applyPatchDeleteAware(stores.strategicContentData || {}, updates);
      notifyChange();
    }
    return ok;
  };
  
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
  
  const clearUserPlanAndAnchors = async () => {
      if (!db || !userId) {
          console.warn('[clearUserPlanAndAnchors] DB or UserID missing, skipping clear.');
          return false;
      }
      
      const devPlanPath = buildModulePath(userId, 'development_plan', 'current');
      const dailyPath = buildModulePath(userId, 'daily_practice', 'current');
      const todayStr = timeService.getTodayStr();
      
      const defaultPlanPayload = {
          currentPlan: null,
          currentCycle: 1,
          lastAssessmentDate: null,
          assessmentHistory: [], 
          planHistory: [],
      };
      const ok1 = await setDocEx(db, devPlanPath, defaultPlanPayload, false); 

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
      const ok2 = await setDocEx(db, dailyPath, defaultDailyPracticePayload, false);
      
      return ok1 && ok2;
  };

  return {
    get developmentPlanData() { return stores.developmentPlanData; },
    get dailyPracticeData() { return stores.dailyPracticeData; },
    get strategicContentData() { return stores.strategicContentData; },
    get membershipData() { return stores.membershipData; },
    get globalMetadata() { 
      return resolveGlobalMetadata(stores.globalMetadata);
    },
    updateDevelopmentPlanData,
    updateDailyPracticeData,
    updateStrategicContentData,
    updateMembershipData,
    clearUserPlanAndAnchors,
    setOnChange: (callback) => {
      stores.onChange = callback;
    },
    cleanup: () => {
      stores.listeners.forEach(unsub => unsub && unsub());
      // Clear midnight rollover timer
      if (stores.midnightTimer) {
        clearTimeout(stores.midnightTimer);
        stores.midnightTimer = null;
      }
    }
  };
};
