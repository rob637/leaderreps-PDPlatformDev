import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { collection, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { useDailyPlan } from './useDailyPlan';

/**
 * Hook to manage the Development Plan logic.
 * Combines the Master Plan (admin-defined weeks) with User Progress (firestore).
 * Now supports Time Travel for testing schedule-based progression.
 * 
 * UPDATED: Also exposes day-based data from useDailyPlan for Day-by-Day architecture.
 */
export const useDevPlan = () => {
  const { db, user, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const [masterPlan, setMasterPlan] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [timeOffset, setTimeOffset] = useState(() => {
    return parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
  });

  // Integrate with Day-by-Day architecture
  const dailyPlanData = useDailyPlan();

  // 0. Initialize Time Travel Offset and listen for changes
  useEffect(() => {
    // Initial read
    const offset = parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
    setTimeOffset(offset);
    
    // Listen for storage changes (from other tabs or same-tab manual updates)
    const handleStorageChange = (e) => {
      if (e.key === 'time_travel_offset' || e.key === null) {
        const newOffset = parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
        setTimeOffset(newOffset);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const simulatedNow = useMemo(() => new Date(Date.now() + timeOffset), [timeOffset]);

  // 1. Fetch Master Plan (The 26 Weeks)
  useEffect(() => {
    const fetchMasterPlan = async () => {
      // Wait for both db AND authenticated user before fetching
      if (!db || !user) return;
      try {
        const weeksRef = collection(db, 'development_plan_v1');
        const q = query(weeksRef, orderBy('weekNumber', 'asc'));
        const snapshot = await getDocs(q);
        
        let weeks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // DEBUG: Log all documents before deduplication
        console.log('[useDevPlan] All documents from Firestore:', weeks.map(w => ({
          docId: w.id,
          weekNumber: w.weekNumber
        })));
        
        // Deduplicate by weekNumber - if multiple docs have the same weekNumber,
        // prefer the one with a numeric ID over 'week-XX' format (legacy naming)
        const byWeekNumber = new Map();
        weeks.forEach(week => {
          const existing = byWeekNumber.get(week.weekNumber);
          if (!existing) {
            byWeekNumber.set(week.weekNumber, week);
          } else {
            // If existing is 'week-XX' format and current is numeric, prefer current
            const existingIsLegacy = /^week-\d+$/i.test(existing.id);
            const currentIsLegacy = /^week-\d+$/i.test(week.id);
            if (existingIsLegacy && !currentIsLegacy) {
              console.log(`[useDevPlan] Preferring doc "${week.id}" over legacy "${existing.id}" for weekNumber ${week.weekNumber}`);
              byWeekNumber.set(week.weekNumber, week);
            }
            // Otherwise keep existing
          }
        });
        
        // Convert back to array and sort
        weeks = Array.from(byWeekNumber.values()).sort((a, b) => (a.weekNumber || 0) - (b.weekNumber || 0));
        
        // DEBUG: Log the masterPlan order after deduplication
        console.log('[useDevPlan] After deduplication - masterPlan:', weeks.map((w, i) => ({
          arrayIndex: i,
          docId: w.id,
          weekNumber: w.weekNumber
        })));
        
        setMasterPlan(weeks);
      } catch (error) {
        console.error("Error fetching development plan:", error);
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchMasterPlan();
  }, [db, user]);

  // 2. Derive User State
  const userState = useMemo(() => {
    // Default state if no progress exists
    const defaultState = {
      currentWeekIndex: 0, // 0-based
      weekProgress: {},
      isSetup: false,
      startDate: null
    };

    console.log('[useDevPlan] Deriving userState from developmentPlanData:', JSON.stringify(developmentPlanData, null, 2));

    if (!developmentPlanData) {
      console.log('[useDevPlan] No developmentPlanData - using defaults');
      return defaultState;
    }

    // Extract weekProgress from both dot-notation keys and nested object
    // Firestore sometimes stores 'weekProgress.100' as a literal key instead of nested
    const weekProgress = { ...(developmentPlanData.weekProgress || {}) };
    
    // Find all dot-notation weekProgress keys (e.g., 'weekProgress.100', 'weekProgress.week-01')
    Object.keys(developmentPlanData).forEach(key => {
      if (key.startsWith('weekProgress.')) {
        const weekKey = key.replace('weekProgress.', '');
        weekProgress[weekKey] = developmentPlanData[key];
        console.log('[useDevPlan] Extracted dot-notation weekProgress:', key, '→', weekKey);
      }
    });
    
    console.log('[useDevPlan] Merged weekProgress:', weekProgress);

    // Check if we have a startDate
    if (developmentPlanData.startDate) {
      console.log('[useDevPlan] Found startDate in developmentPlanData:', developmentPlanData.startDate);
      return {
        ...defaultState,
        ...developmentPlanData,
        weekProgress, // Use the merged weekProgress
        isSetup: true
      };
    }

    // Check if this is the new V1 schema or old schema
    // If it has 'currentWeekIndex', it's likely V1.
    if (typeof developmentPlanData.currentWeekIndex === 'number') {
      console.log('[useDevPlan] Found V1 schema with currentWeekIndex');
      return {
        ...defaultState,
        ...developmentPlanData,
        weekProgress, // Use the merged weekProgress
        isSetup: true
      };
    }

    // If old schema, we might need to migrate or just treat as new user
    console.log('[useDevPlan] No startDate or V1 schema found - using defaults');
    return { ...defaultState, weekProgress };
  }, [developmentPlanData]);
  
  // Auto-initialize startDate if not set
  useEffect(() => {
    const autoInit = async () => {
      // Only auto-initialize if we have a user, update function, AND we are sure data is loaded but missing startDate
      // We check developmentPlanData !== undefined to ensure we've attempted to load it
      if (user && updateDevelopmentPlanData && developmentPlanData !== undefined && !developmentPlanData?.startDate) {
        
        // Prevent infinite loop: Check if we already tried to initialize recently (in-memory flag)
        if (window._devPlanInitAttempted) return;
        window._devPlanInitAttempted = true;

        console.log('[useDevPlan] Auto-initializing startDate for user');
        try {
          await updateDevelopmentPlanData({ startDate: serverTimestamp(), version: 'v1' });
          console.log('[useDevPlan] startDate auto-initialized successfully');
        } catch (error) {
          console.error('[useDevPlan] Error auto-initializing startDate:', error);
          window._devPlanInitAttempted = false; // Reset on error so we can retry
        }
      }
    };
    autoInit();
  }, [developmentPlanData, updateDevelopmentPlanData, user]);

  // 3. Compute Current Week View (Time-Based Calculation)
  const currentWeekIndex = useMemo(() => {
    // If we have a start date, calculate week based on time
    if (userState.startDate) {
      // Robust date parsing - handle multiple formats
      let start = null;
      const rawDate = userState.startDate;
      
      if (rawDate.toDate && typeof rawDate.toDate === 'function') {
        start = rawDate.toDate();
      } else if (rawDate.seconds) {
        start = new Date(rawDate.seconds * 1000);
      } else if (typeof rawDate === 'string') {
        start = new Date(rawDate);
      } else if (rawDate instanceof Date) {
        start = rawDate;
      } else if (typeof rawDate === 'number') {
        start = new Date(rawDate);
      } else {
        start = new Date(rawDate);
      }
      
      // Validate the date
      if (!start || isNaN(start.getTime())) {
        console.warn('[useDevPlan] Invalid startDate:', rawDate);
        return userState.currentWeekIndex || 0;
      }
      
      const diff = simulatedNow.getTime() - start.getTime();
      // 1 week = 7 * 24 * 60 * 60 * 1000 ms
      const weeksPassed = Math.floor(diff / 604800000);
      const calculatedIndex = Math.max(0, weeksPassed);
      console.log('[useDevPlan] Time-based week calculation:', {
        startDate: start.toISOString(),
        simulatedNow: simulatedNow.toISOString(),
        diffMs: diff,
        weeksPassed,
        calculatedIndex,
        timeOffset
      });
      return calculatedIndex;
    }
    // Fallback to manual progress if no start date (or legacy)
    console.log('[useDevPlan] No startDate found, using fallback:', userState.currentWeekIndex || 0);
    return userState.currentWeekIndex || 0;
  }, [userState.startDate, userState.currentWeekIndex, simulatedNow, timeOffset]);

  const currentWeek = useMemo(() => {
    console.log('[useDevPlan] Computing currentWeek. masterPlan.length:', masterPlan.length, 'currentWeekIndex:', currentWeekIndex);
    
    if (masterPlan.length === 0) {
      console.log('[useDevPlan] masterPlan is empty, returning null');
      return null;
    }
    
    // Ensure index is within bounds
    const safeIndex = Math.min(Math.max(0, currentWeekIndex), masterPlan.length - 1);
    const weekData = masterPlan[safeIndex];
    
    console.log('[useDevPlan] safeIndex:', safeIndex, 'weekData.weekNumber:', weekData?.weekNumber, 'weekData.id:', weekData?.id);
    
    // Get user progress for this specific week
    const progressKey = weekData.weekBlockId || `week-${String(weekData.weekNumber).padStart(2, '0')}`;
    const progress = userState.weekProgress?.[progressKey] || {
      status: 'not-started',
      itemsCompleted: []
    };

    return {
      ...weekData,
      userProgress: progress,
      isLocked: false, // Current week is never locked
      isCompleted: progress.status === 'completed'
    };
  }, [masterPlan, currentWeekIndex, userState.weekProgress]);

  // 4. Actions
  
  // Initialize Plan for User (if not started)
  const initializePlan = useCallback(async () => {
    if (!user) return;
    
    const initialState = {
      currentWeekIndex: 0,
      startDate: serverTimestamp(),
      weekProgress: {},
      version: 'v1'
    };

    await updateDevelopmentPlanData(initialState);
  }, [user, updateDevelopmentPlanData]);

  // Mark an item (content/community/coaching) as complete
  const toggleItemComplete = useCallback(async (itemId, isComplete) => {
    if (!currentWeek) return;
    if (!itemId) {
      console.error('[useDevPlan] toggleItemComplete called with undefined itemId');
      return;
    }

    const weekKey = currentWeek.weekBlockId || `week-${String(currentWeek.weekNumber).padStart(2, '0')}`;
    const currentProgress = userState.weekProgress?.[weekKey] || { itemsCompleted: [] };
    
    let newItemsCompleted = [...(currentProgress.itemsCompleted || [])];
    
    if (isComplete) {
      if (!newItemsCompleted.includes(itemId)) newItemsCompleted.push(itemId);
    } else {
      newItemsCompleted = newItemsCompleted.filter(id => id !== itemId);
    }

    // Only include defined values - Firestore rejects undefined
    const updates = {
      [`weekProgress.${weekKey}`]: {
        itemsCompleted: newItemsCompleted,
        lastUpdated: serverTimestamp()
      }
    };

    await updateDevelopmentPlanData(updates);
  }, [currentWeek, userState, updateDevelopmentPlanData]);

  // Complete the current week
  // Note: In time-based model, this just marks it as done, doesn't necessarily "unlock" next if time hasn't passed.
  const completeWeek = useCallback(async (reflectionText) => {
    if (!currentWeek) return;

    const weekKey = currentWeek.weekBlockId || `week-${String(currentWeek.weekNumber).padStart(2, '0')}`;
    
    const updates = {
      [`weekProgress.${weekKey}.status`]: 'completed',
      [`weekProgress.${weekKey}.completedAt`]: serverTimestamp(),
      [`weekProgress.${weekKey}.reflection`]: reflectionText,
      // We don't manually increment currentWeekIndex in time-based model, 
      // but we might want to store 'maxCompletedWeek' if needed.
    };

    await updateDevelopmentPlanData(updates);
  }, [currentWeek, updateDevelopmentPlanData]);

  // 5. Helper: Get Unlocked Resources
  const getUnlockedResources = useCallback((type = 'all') => {
    if (!masterPlan || masterPlan.length === 0) return new Set();
    
    const unlockedIds = new Set();
    
    // Iterate through all weeks up to currentWeekIndex
    // Note: currentWeekIndex is 0-based, so we include it.
    const maxIndex = Math.min(currentWeekIndex, masterPlan.length - 1);
    
    for (let i = 0; i <= maxIndex; i++) {
      const week = masterPlan[i];
      if (!week) continue;
      
      // Helper to add IDs from an array of items
      const addIds = (items) => {
        if (Array.isArray(items)) {
          items.forEach(item => {
            if (item.resourceId) unlockedIds.add(item.resourceId);
            if (item.contentItemId) unlockedIds.add(item.contentItemId);
          });
        }
      };

      if (type === 'all' || type === 'content') {
        addIds(week.contentItems);
      }
      if (type === 'all' || type === 'community') {
        addIds(week.communityItems);
      }
      if (type === 'all' || type === 'coaching') {
        addIds(week.coachingItems);
      }
    }
    
    return unlockedIds;
  }, [masterPlan, currentWeekIndex]);

  return {
    loading: loadingPlan,
    masterPlan,
    userState: { ...userState, currentWeekIndex }, // Expose the calculated index
    currentWeek,
    initializePlan,
    toggleItemComplete,
    completeWeek,
    getUnlockedResources, // Expose the helper
    simulatedNow, // Expose for UI if needed
    user, // Expose user for access control
    
    // Day-by-Day Architecture Integration
    // These fields allow components to gradually migrate from week-based to day-based
    currentDayNumber: dailyPlanData.currentDayNumber,
    currentDayData: dailyPlanData.currentDayData,
    unlockedContentIds: dailyPlanData.unlockedContentIds,
    unlockedResources: dailyPlanData.unlockedResources, // NEW: enriched resource data
    dailyPlan: dailyPlanData.dailyPlan,
    missedDays: dailyPlanData.missedDays,
    toggleDayItemComplete: dailyPlanData.toggleItemComplete,
    completeDay: dailyPlanData.completeDay,
    
    // Three Phase System (NEW)
    currentPhase: dailyPlanData.currentPhase,
    phaseDayNumber: dailyPlanData.phaseDayNumber,
    daysFromStart: dailyPlanData.daysFromStart,
    dbDayNumber: dailyPlanData.dbDayNumber
  };
};
