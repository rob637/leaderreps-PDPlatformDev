import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { collection, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Hook to manage the Daily Plan logic.
 * Replaces useDevPlan for the new Day-by-Day architecture.
 * 
 * THREE PHASE SYSTEM:
 * ==================
 * 1. PRE-START (Prep Phase) - 14 days before cohort start
 *    - Users can join anytime, no "behind" status
 *    - Tasks to complete before program starts
 *    - DB: dayNumber 1-14, weekNumber -2 and -1
 *    - Display: "Prep Day 1-14"
 * 
 * 2. START (Foundations) - 8 weeks (56 days)
 *    - Cohort-based progression
 *    - Missed days are tracked
 *    - DB: dayNumber 15-70, weekNumber 1-8
 *    - Display: "Day 1-56" or "Week 1-8"
 * 
 * 3. POST-START (After Program) - Ongoing
 *    - Post-program content and maintenance
 *    - DB: dayNumber 71+, weekNumber 9+
 *    - Display: "Post Day 1+"
 */

// Phase Configuration
export const PHASES = {
  PRE_START: {
    id: 'pre-start',
    name: 'Pre-Start',
    displayName: 'Prep Phase',
    dbDayStart: 1,
    dbDayEnd: 14,
    weekRange: [-2, -1],
    trackMissedDays: false, // Users can start anytime
    description: 'Get ready for the program'
  },
  START: {
    id: 'start',
    name: 'Development Plan',  // This IS the Development Plan
    displayName: 'Development Plan',
    dbDayStart: 15,
    dbDayEnd: 70,
    weekRange: [1, 8],
    trackMissedDays: true, // Cohort-based progression
    description: '8-week leadership development program'
  },
  POST_START: {
    id: 'post-start',
    name: 'Post-Start',
    displayName: 'Next Reps',
    dbDayStart: 71,
    dbDayEnd: Infinity,
    weekRange: [9, Infinity],
    trackMissedDays: false, // Ongoing maintenance
    description: 'Continue your leadership journey'
  }
};

// Helper: Get phase from DB dayNumber
export const getPhaseFromDbDay = (dbDayNumber) => {
  if (dbDayNumber <= PHASES.PRE_START.dbDayEnd) return PHASES.PRE_START;
  if (dbDayNumber <= PHASES.START.dbDayEnd) return PHASES.START;
  return PHASES.POST_START;
};

// Helper: Get phase-specific day number for display
export const getPhaseDayNumber = (dbDayNumber) => {
  const phase = getPhaseFromDbDay(dbDayNumber);
  return dbDayNumber - phase.dbDayStart + 1;
};

// Helper: Get DB dayNumber from days relative to cohort start
// daysFromStart: negative = before start, positive = after start
export const getDbDayNumber = (daysFromStart) => {
  if (daysFromStart < 0) {
    // Pre-Start: -14 to -1 maps to DB 1-14
    // -14 days → DB day 1, -1 day → DB day 14
    return Math.max(1, 15 + daysFromStart); // -14 + 15 = 1, -1 + 15 = 14
  }
  // Start/Post: 0+ days from start maps to DB 15+
  // 0 days (start day) → DB day 15, 55 days → DB day 70
  return 15 + daysFromStart;
};
export const useDailyPlan = () => {
  const { db, user, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const [dailyPlan, setDailyPlan] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [timeOffset, setTimeOffset] = useState(() => {
    return parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
  });

  // 0. Initialize Time Travel Offset and listen for changes
  useEffect(() => {
    const offset = parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
    setTimeOffset(offset);
    
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

  // 1. Fetch Daily Plan (All Days)
  useEffect(() => {
    const fetchDailyPlan = async () => {
      if (!db || !user) return;
      try {
        const planRef = collection(db, 'daily_plan_v1');
        const q = query(planRef, orderBy('dayNumber', 'asc'));
        const snapshot = await getDocs(q);
        
        const days = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log(`[useDailyPlan] Loaded ${days.length} days from daily_plan_v1`);
        setDailyPlan(days);
      } catch (error) {
        console.error("Error fetching daily plan:", error);
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchDailyPlan();
  }, [db, user]);

  // 2. Derive User State & Current Day
  const userState = useMemo(() => {
    const defaultState = {
      dailyProgress: {},
      startDate: null,
      cohortId: null
    };

    const baseData = developmentPlanData || {};

    // Extract dailyProgress
    const dailyProgress = { ...(baseData.dailyProgress || {}) };
    
    // Handle dot-notation if any (legacy support pattern)
    Object.keys(baseData).forEach(key => {
      if (key.startsWith('dailyProgress.')) {
        const dayKey = key.replace('dailyProgress.', '');
        dailyProgress[dayKey] = baseData[key];
      }
    });

    return {
      ...defaultState,
      ...baseData,
      // Prioritize user doc fields for cohort sync (CohortManager updates user doc)
      startDate: user?.startDate || baseData.startDate,
      cohortId: user?.cohortId || baseData.cohortId,
      dailyProgress
    };
  }, [developmentPlanData, user]);

  // Auto-initialize startDate if missing
  useEffect(() => {
    const autoInit = async () => {
      if (user && updateDevelopmentPlanData && developmentPlanData !== undefined && !developmentPlanData?.startDate) {
        if (window._dailyPlanInitAttempted) return;
        window._dailyPlanInitAttempted = true;

        console.log('[useDailyPlan] Auto-initializing startDate for user');
        try {
          // Default to today if no start date
          await updateDevelopmentPlanData({ startDate: serverTimestamp(), version: 'v2-daily' });
        } catch (error) {
          console.error('[useDailyPlan] Error auto-initializing startDate:', error);
          window._dailyPlanInitAttempted = false;
        }
      }
    };
    autoInit();
  }, [developmentPlanData, updateDevelopmentPlanData, user]);

  // 3. Calculate Days From Start (can be negative for Pre-Start)
  const daysFromStart = useMemo(() => {
    if (!userState.startDate) return 0; // Default to start day

    let start = null;
    const rawDate = userState.startDate;
    
    if (rawDate.toDate && typeof rawDate.toDate === 'function') {
      start = rawDate.toDate();
    } else if (rawDate.seconds) {
      start = new Date(rawDate.seconds * 1000);
    } else {
      start = new Date(rawDate);
    }
    
    if (!start || isNaN(start.getTime())) return 0;

    // Calculate difference in days from cohort start
    // Negative = before start (Pre-Start phase)
    // Zero = start day (first day of Foundations)
    // Positive = after start
    const diffMs = simulatedNow.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    console.log('[useDailyPlan] Days From Start:', {
      startDate: start.toISOString(),
      now: simulatedNow.toISOString(),
      daysFromStart: diffDays
    });

    return diffDays;
  }, [userState.startDate, simulatedNow]);

  // 4. Map to DB Day Number and get Phase Info
  const { dbDayNumber, currentPhase, phaseDayNumber } = useMemo(() => {
    const dbDay = getDbDayNumber(daysFromStart);
    const phase = getPhaseFromDbDay(dbDay);
    const phaseDay = getPhaseDayNumber(dbDay);
    
    console.log('[useDailyPlan] Phase Info:', {
      daysFromStart,
      dbDayNumber: dbDay,
      phase: phase.name,
      phaseDayNumber: phaseDay
    });
    
    return { dbDayNumber: dbDay, currentPhase: phase, phaseDayNumber: phaseDay };
  }, [daysFromStart]);

  // 5. Get Current Day Data, Missed Days & Unlocked Content
  const { currentDayData, missedDays, unlockedContentIds, unlockedResources } = useMemo(() => {
    if (dailyPlan.length === 0) return { currentDayData: null, missedDays: [], unlockedContentIds: [], unlockedResources: [] };

    // Find data for current day using the DB dayNumber
    const current = dailyPlan.find(d => d.dayNumber === dbDayNumber);
    
    // Enrich with user progress and phase info
    let enrichedCurrent = null;
    if (current) {
      const progressKey = current.id; // e.g., 'day-001'
      const progress = userState.dailyProgress?.[progressKey] || { itemsCompleted: [] };
      enrichedCurrent = {
        ...current,
        // Phase-specific display info
        phase: currentPhase,
        phaseDayNumber: phaseDayNumber,
        displayDay: currentPhase.id === 'pre-start' 
          ? `Prep Day ${phaseDayNumber}` 
          : currentPhase.id === 'start'
            ? `Day ${phaseDayNumber}`
            : `Post Day ${phaseDayNumber}`,
        // User progress
        userProgress: progress,
        isCompleted: progress.status === 'completed'
      };
    }

    // Calculate Missed Days (only for START phase - cohort-based)
    let missed = [];
    if (currentPhase.trackMissedDays) {
      missed = dailyPlan
        .filter(d => {
          // Only track missed days within the current phase
          const dayPhase = getPhaseFromDbDay(d.dayNumber);
          return dayPhase.id === currentPhase.id && d.dayNumber < dbDayNumber;
        })
        .filter(d => {
          const progress = userState.dailyProgress?.[d.id];
          return !progress || progress.status !== 'completed';
        })
        .sort((a, b) => a.dayNumber - b.dayNumber);
    }

    // Calculate Unlocked Content (resources linked to actions up to current day)
    // NEW MODEL: Resources are unlocked when linked to actions, not via separate content array
    const unlockedResources = [];
    dailyPlan.forEach(d => {
      if (d.dayNumber <= dbDayNumber) {
        // New model: resources linked to actions
        if (d.actions && Array.isArray(d.actions)) {
          d.actions.forEach(action => {
            if (action.resourceId) {
              unlockedResources.push({
                id: action.resourceId,
                title: action.resourceTitle || action.label,
                type: action.resourceType,
                unlockedOnDay: d.dayNumber,
                linkedAction: action.label
              });
            }
          });
        }
        // Legacy support: still check content array if it exists
        if (d.content && Array.isArray(d.content)) {
          d.content.forEach(item => {
            if (item.id && !unlockedResources.find(r => r.id === item.id)) {
              unlockedResources.push({
                id: item.id,
                title: item.title,
                type: item.type,
                unlockedOnDay: d.dayNumber,
                linkedAction: null // Legacy - not linked to specific action
              });
            }
          });
        }
      }
    });
    
    // Create simple ID list for backward compatibility
    const unlockedIds = unlockedResources.map(r => r.id);

    return { 
      currentDayData: enrichedCurrent, 
      missedDays: missed, 
      unlockedContentIds: unlockedIds,
      unlockedResources // New: enriched resource data
    };
  }, [dailyPlan, dbDayNumber, currentPhase, phaseDayNumber, userState.dailyProgress]);

  // Legacy: currentDayNumber for backward compatibility
  // This returns the "user-facing" day number (negative for prep, positive for start)
  const currentDayNumber = useMemo(() => {
    if (currentPhase.id === 'pre-start') {
      // Return negative days: -14 to -1
      return daysFromStart; // Already negative
    }
    if (currentPhase.id === 'start') {
      // Return 1-56 for the 8-week program
      return daysFromStart + 1; // 0 → 1, 55 → 56
    }
    // Post-start: return days since program ended
    return daysFromStart - 55; // 56 → 1, 57 → 2, etc.
  }, [currentPhase, daysFromStart]);

  // 6. Actions

  // Toggle Item Complete
  const toggleItemComplete = useCallback(async (dayId, itemId, isComplete) => {
    if (!dayId || !itemId) return;

    const currentProgress = userState.dailyProgress?.[dayId] || { itemsCompleted: [] };
    let newItemsCompleted = [...(currentProgress.itemsCompleted || [])];
    
    if (isComplete) {
      if (!newItemsCompleted.includes(itemId)) newItemsCompleted.push(itemId);
    } else {
      newItemsCompleted = newItemsCompleted.filter(id => id !== itemId);
    }

    // Check if all items for the day are complete?
    // For now, just update items.
    
    const updates = {
      [`dailyProgress.${dayId}`]: {
        ...currentProgress,
        itemsCompleted: newItemsCompleted,
        lastUpdated: serverTimestamp()
      }
    };

    await updateDevelopmentPlanData(updates);
  }, [userState, updateDevelopmentPlanData]);

  // Mark Day as Complete (e.g. after PM Reflection)
  const completeDay = useCallback(async (dayId) => {
    if (!dayId) return;
    
    const updates = {
      [`dailyProgress.${dayId}.status`]: 'completed',
      [`dailyProgress.${dayId}.completedAt`]: serverTimestamp()
    };

    await updateDevelopmentPlanData(updates);
  }, [updateDevelopmentPlanData]);

  return {
    // Loading state
    loading: loadingPlan,
    
    // Raw data
    dailyPlan,
    userState,
    
    // Phase info (NEW)
    currentPhase,           // { id, name, displayName, trackMissedDays, ... }
    phaseDayNumber,         // Day within current phase (1-14 for prep, 1-56 for start, etc.)
    daysFromStart,          // Raw days from cohort start (can be negative)
    dbDayNumber,            // Database dayNumber (1-71+)
    
    // Legacy (for backward compatibility)
    currentDayNumber,       // User-facing day number (negative for prep, positive for start)
    
    // Current day data (enriched with phase info)
    currentDayData,
    
    // Catch-up (only populated during START phase)
    missedDays,
    
    // Content unlocking
    unlockedContentIds,     // Simple ID list (backward compatible)
    unlockedResources,      // Enriched: { id, title, type, unlockedOnDay, linkedAction }
    
    // Actions
    toggleItemComplete,
    completeDay,
    
    // Time travel support
    simulatedNow
  };
};