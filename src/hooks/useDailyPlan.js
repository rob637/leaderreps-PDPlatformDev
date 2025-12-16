import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { collection, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Hook to manage the Daily Plan logic.
 * Replaces useDevPlan for the new Day-by-Day architecture.
 * 
 * Key Features:
 * - Calculates 'Current Day' based on Cohort Start Date (or User Start Date)
 * - Supports Negative Days (Prep Phase)
 * - Handles "Catch Up" logic (tracking missed days)
 * - Fetches from 'daily_plan_v1' collection
 */
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

  // 3. Calculate Current Day Number
  const currentDayNumber = useMemo(() => {
    if (!userState.startDate) return 1; // Default to Day 1

    let start = null;
    const rawDate = userState.startDate;
    
    if (rawDate.toDate && typeof rawDate.toDate === 'function') {
      start = rawDate.toDate();
    } else if (rawDate.seconds) {
      start = new Date(rawDate.seconds * 1000);
    } else {
      start = new Date(rawDate);
    }
    
    if (!start || isNaN(start.getTime())) return 1;

    // Calculate difference in days
    // We want Day 1 to be the start date itself.
    // So if Now == StartDate, diff is 0, but Day is 1.
    // If Now == StartDate - 1 day, diff is -1 day, Day is -1 (Prep).
    
    const diffMs = simulatedNow.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Adjust: 
    // If diffDays = 0 (same day), we want Day 1.
    // If diffDays = 1 (next day), we want Day 2.
    // If diffDays = -1 (day before), we want Day -1 (Prep).
    // Note: There is usually no Day 0 in these systems. It goes -1 to 1.
    
    let dayNum = diffDays >= 0 ? diffDays + 1 : diffDays;
    
    // Handle the "No Day 0" logic if your system requires it (CSV has -14...-1, then 1...71)
    // If calculation yields 0, it effectively means "Day before Day 1" which is Day -1.
    // Wait, diffDays = -1 -> dayNum = -1. Correct.
    // diffDays = 0 -> dayNum = 1. Correct.
    // So we just skip 0.
    
    const calculatedDay = dayNum;

    console.log('[useDailyPlan] Day Calculation:', {
      start: start.toISOString(),
      now: simulatedNow.toISOString(),
      diffDays,
      calculatedDay
    });

    return calculatedDay;
  }, [userState.startDate, simulatedNow]);

    console.log('[useDailyPlan] Day Calculation:', {
      start: start.toISOString(),
      now: simulatedNow.toISOString(),
      diffDays,
      calculatedDay
    });

    return calculatedDay;
  }, [userState.startDate, simulatedNow]);

  // 4. Get Current Day Data, Missed Days & Unlocked Content
  const { currentDayData, missedDays, unlockedContentIds } = useMemo(() => {
    if (dailyPlan.length === 0) return { currentDayData: null, missedDays: [], unlockedContentIds: [] };

    // Find data for current day
    const current = dailyPlan.find(d => d.dayNumber === currentDayNumber);
    
    // Enrich with user progress
    let enrichedCurrent = null;
    if (current) {
      const progressKey = current.id; // e.g., 'day-001'
      const progress = userState.dailyProgress?.[progressKey] || { itemsCompleted: [] };
      enrichedCurrent = {
        ...current,
        userProgress: progress,
        isCompleted: progress.status === 'completed'
      };
    }

    // Calculate Missed Days (Catch Up Logic)
    const missed = dailyPlan
      .filter(d => d.dayNumber < currentDayNumber) // Past days
      .filter(d => {
        const progress = userState.dailyProgress?.[d.id];
        // Consider missed if status is not completed
        return !progress || progress.status !== 'completed';
      })
      .sort((a, b) => a.dayNumber - b.dayNumber); // Oldest first

    // Calculate Unlocked Content
    const unlockedIds = new Set();
    dailyPlan.forEach(d => {
      if (d.dayNumber <= currentDayNumber) {
        if (d.content && Array.isArray(d.content)) {
          d.content.forEach(item => {
            if (item.id) unlockedIds.add(item.id);
          });
        }
      }
    });

    return { 
      currentDayData: enrichedCurrent, 
      missedDays: missed, 
      unlockedContentIds: Array.from(unlockedIds) 
    };
  }, [dailyPlan, currentDayNumber, userState.dailyProgress]);

  // 5. Actions

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
    loading: loadingPlan,
    dailyPlan,
    currentDayNumber,
    currentDayData,
    missedDays,
    unlockedContentIds,
    userState,
    toggleItemComplete,
    completeDay,
    simulatedNow
  };
};
