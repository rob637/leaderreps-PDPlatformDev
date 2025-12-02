// src/services/createAppServices.js
import { onSnapshotEx, setDocEx } from './firestoreUtils';
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
 * Convert Date objects to Firestore Timestamps recursively
 */
const convertDatesToTimestamps = (obj) => {
  if (!obj) return obj;
  if (obj instanceof Date) {
    return Timestamp.fromDate(obj);
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
        developmentPlanData: stores.developmentPlanData,
        dailyPracticeData: stores.dailyPracticeData,
        strategicContentData: stores.strategicContentData,
        membershipData: stores.membershipData,
        globalMetadata: stores.globalMetadata
      });
    }
  };

  if (db && userId) {
    const devPlanPath = buildModulePath(userId, 'development_plan', 'current');
    const unsubDev = onSnapshotEx(db, devPlanPath, (snap) => {
      console.log('%c[DEV_PLAN SNAPSHOT] Received!', 'background: #8b5cf6; color: white; font-weight: bold; padding: 4px 8px;');
      console.log('[DEV_PLAN SNAPSHOT] snap.exists():', snap.exists());
      console.log('[DEV_PLAN SNAPSHOT] path:', devPlanPath);
      
      const rawData = snap.exists() ? snap.data() : MOCK_DEVELOPMENT_PLAN_DATA;
      console.log('[DEV_PLAN SNAPSHOT] rawData:', rawData);
      console.log('[DEV_PLAN SNAPSHOT] rawData.startDate:', rawData?.startDate);
      console.log('[DEV_PLAN SNAPSHOT] typeof rawData.startDate:', typeof rawData?.startDate);
      
      stores.developmentPlanData = stripSentinels(sanitizeTimestamps(rawData));
      console.log('[DEV_PLAN SNAPSHOT] After sanitize:', stores.developmentPlanData);
      console.log('[DEV_PLAN SNAPSHOT] startDate after sanitize:', stores.developmentPlanData?.startDate);
      
      notifyChange();
    });
    stores.listeners.push(unsubDev);

    const dailyPath = buildModulePath(userId, 'daily_practice', 'current');
    const unsubDaily = onSnapshotEx(db, dailyPath, (snap) => {
      // === NUCLEAR DEBUG: Firestore Snapshot Received ===
      console.log('%c[FIRESTORE SNAPSHOT] daily_practice snapshot received!', 'background: #00ffff; color: black; font-weight: bold; padding: 4px 8px;');
      console.log('[FIRESTORE SNAPSHOT] snap.exists():', snap.exists());
      
      const rawData = snap.exists() ? snap.data() : MOCK_DAILY_PRACTICE_DATA;
      console.log('[FIRESTORE SNAPSHOT] Raw data from Firestore:', JSON.stringify(rawData, null, 2));
      console.log('[FIRESTORE SNAPSHOT] morningBookend specifically:', rawData?.morningBookend);
      console.log('[FIRESTORE SNAPSHOT] morningBookend.wins:', rawData?.morningBookend?.wins);
      
      stores.dailyPracticeData = stripSentinels(sanitizeTimestamps(rawData));
      console.log('[FIRESTORE SNAPSHOT] After sanitize/strip:', JSON.stringify(stores.dailyPracticeData, null, 2));
      
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
      console.log(`[MIDNIGHT ROLLOVER] Scheduling rollover in ${Math.round(msUntil / 1000 / 60)} minutes`);
      
      stores.midnightTimer = setTimeout(async () => {
        console.log('%c[MIDNIGHT ROLLOVER] 11:59:59 PM reached - triggering auto-rollover!', 'background: #ff6600; color: white; font-weight: bold; padding: 4px 8px;');
        
        if (stores.dailyPracticeData) {
          try {
            await checkAndPerformRollover(db, userId, stores.dailyPracticeData);
            console.log('[MIDNIGHT ROLLOVER] Rollover completed successfully');
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

    const strategicPath = buildModulePath(userId, 'strategic_content', 'vision_mission');
    const unsubStrategic = onSnapshotEx(db, strategicPath, (snap) => {
      const rawData = snap.exists() ? snap.data() : MOCK_STRATEGIC_CONTENT_DATA;
      stores.strategicContentData = stripSentinels(sanitizeTimestamps(rawData));
      notifyChange();
    });
    stores.listeners.push(unsubStrategic);
    
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
    
    const catalogNames = [
      'rep_library', 'exercise_library', 'workout_library', 'course_library',
      'skill_catalog', 'identity_anchor_catalog', 'habit_anchor_catalog',
      'why_catalog', 'video_catalog', 'scenario_catalog',
      'membership_plans'
    ];
    
    catalogNames.forEach(catalogName => {
      const catalogPath = `metadata/config/catalog/${catalogName}`;
      const unsubCatalog = onSnapshotEx(db, catalogPath, (snap) => {
        if (snap.exists()) {
          const keyName = catalogName.toUpperCase();
          stores.globalMetadata = {
            ...(stores.globalMetadata || {}),
            [keyName]: stripSentinels(sanitizeTimestamps(snap.data()))
          };
        } else if (!stores.globalMetadata) {
          stores.globalMetadata = {};
        }
        
        notifyChange();
      });
      stores.listeners.push(unsubCatalog);
    });
    
    // Special listener for reading_catalog at metadata/reading_catalog
    const readingCatalogPath = 'metadata/reading_catalog';
    const unsubReadingCatalog = onSnapshotEx(db, readingCatalogPath, (snap) => {
      console.log('📚 [createAppServices] Reading catalog snapshot:', {
        exists: snap.exists(),
        path: readingCatalogPath
      });
      
      if (snap.exists()) {
        const rawData = snap.data();
        console.log('📚 [createAppServices] Reading catalog raw data:', {
          hasItems: !!rawData?.items,
          itemsType: typeof rawData?.items,
          itemsKeys: rawData?.items ? Object.keys(rawData.items) : [],
          itemsLength: rawData?.items ? Object.keys(rawData.items).length : 0
        });
        stores.globalMetadata = {
          ...(stores.globalMetadata || {}),
          READING_CATALOG: stripSentinels(sanitizeTimestamps(rawData))
        };
        console.log('📚 [createAppServices] READING_CATALOG set in globalMetadata:', {
          hasItems: !!stores.globalMetadata.READING_CATALOG?.items,
          itemsKeys: stores.globalMetadata.READING_CATALOG?.items ? Object.keys(stores.globalMetadata.READING_CATALOG.items) : []
        });
      } else {
        console.warn('⚠️ [createAppServices] Reading catalog document does NOT exist at:', readingCatalogPath);
        if (!stores.globalMetadata) {
          stores.globalMetadata = {};
        }
      }
      
      notifyChange();
    });
    stores.listeners.push(unsubReadingCatalog);

    // Listener for System Quotes
    const quotesPath = 'system_lovs/system_quotes';
    const unsubQuotes = onSnapshotEx(db, quotesPath, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.items && Array.isArray(data.items)) {
          stores.globalMetadata = {
            ...(stores.globalMetadata || {}),
            SYSTEM_QUOTES: data.items
          };
          console.log('✅ [createAppServices] Loaded SYSTEM_QUOTES from system_lovs');
        }
      } else if (!stores.globalMetadata) {
        stores.globalMetadata = {};
      }
      notifyChange();
    });
    stores.listeners.push(unsubQuotes);

    // Listener for System LOVs (Leadership Tiers)
    const lovTiersPath = 'system_lovs/leadership_tiers';
    const unsubLovTiers = onSnapshotEx(db, lovTiersPath, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.values && Array.isArray(data.values)) {
          const tiersMap = {};
          data.values.forEach(t => {
            if (t.isActive !== false) {
                tiersMap[t.code] = { 
                    name: t.label, 
                    hex: t.color, 
                    color: t.color, // Fallback
                    ...t 
                };
            }
          });
          // Ensure 'All' and 'System' exist if not in DB
          if (!tiersMap['All']) tiersMap['All'] = { name: 'All Tiers', hex: '#47A88D', color: 'teal-500' };
          if (!tiersMap['System']) tiersMap['System'] = { name: 'System Info', hex: '#47A88D', color: 'gray-500' };
          
          stores.globalMetadata = {
            ...(stores.globalMetadata || {}),
            LEADERSHIP_TIERS: tiersMap
          };
          console.log('✅ [createAppServices] Loaded LEADERSHIP_TIERS from system_lovs');
        }
      } else if (!stores.globalMetadata) {
        stores.globalMetadata = {};
      }
      notifyChange();
    });
    stores.listeners.push(unsubLovTiers);
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
    console.log('%c[DEV_PLAN UPDATE] updateDevelopmentPlanData CALLED', 'background: #8b5cf6; color: white; font-weight: bold; padding: 4px 8px;');
    console.log('[DEV_PLAN UPDATE] db exists:', !!db);
    console.log('[DEV_PLAN UPDATE] userId:', userId);
    console.log('[DEV_PLAN UPDATE] updates:', updates);
    console.log('[DEV_PLAN UPDATE] updates.startDate:', updates?.startDate);
    console.log('[DEV_PLAN UPDATE] typeof updates.startDate:', typeof updates?.startDate);
    
    if (!db || !userId) {
      console.log('%c[DEV_PLAN UPDATE] ABORT: db or userId missing!', 'color: red; font-weight: bold;');
      return false;
    }
    
    // Convert Date objects to Firestore Timestamps
    const convertedUpdates = convertDatesToTimestamps(updates);
    console.log('[DEV_PLAN UPDATE] After conversion:', convertedUpdates);
    console.log('[DEV_PLAN UPDATE] startDate after conversion:', convertedUpdates?.startDate);
    
    const path = buildModulePath(userId, 'development_plan', 'current');
    console.log('[DEV_PLAN UPDATE] Firestore path:', path);
    
    const result = await setDocEx(db, path, convertedUpdates, merge);
    console.log('[DEV_PLAN UPDATE] setDocEx result:', result);
    return result;
  };

  const updateDailyPracticeData = async (updates) => {
    // === NUCLEAR DEBUG: updateDailyPracticeData ===
    console.log('%c[FIRESTORE DEBUG] updateDailyPracticeData CALLED', 'background: #ff00ff; color: white; font-weight: bold; padding: 4px 8px;');
    console.log('[FIRESTORE DEBUG] db exists:', !!db);
    console.log('[FIRESTORE DEBUG] userId:', userId);
    console.log('[FIRESTORE DEBUG] updates payload:', JSON.stringify(updates, null, 2));
    console.log('[FIRESTORE DEBUG] BEFORE - stores.dailyPracticeData:', JSON.stringify(stores.dailyPracticeData, null, 2));
    
    if (!db || !userId) {
      console.log('%c[FIRESTORE DEBUG] ABORT: db or userId missing!', 'color: red; font-weight: bold;');
      return false;
    }
    const path = buildModulePath(userId, 'daily_practice', 'current');
    console.log('[FIRESTORE DEBUG] Firestore path:', path);
    
    const ok = await setDocEx(db, path, updates, true);
    console.log('%c[FIRESTORE DEBUG] setDocEx result:', ok ? 'color: green; font-weight: bold;' : 'color: red; font-weight: bold;', ok);
    
    if (ok) {
      stores.dailyPracticeData = applyPatchDeleteAware(stores.dailyPracticeData || {}, updates);
      console.log('[FIRESTORE DEBUG] AFTER - stores.dailyPracticeData:', JSON.stringify(stores.dailyPracticeData, null, 2));
      notifyChange();
      console.log('[FIRESTORE DEBUG] notifyChange() called');
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
