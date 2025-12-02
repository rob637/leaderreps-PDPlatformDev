import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { collection, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Hook to manage the Development Plan logic.
 * Combines the Master Plan (admin-defined weeks) with User Progress (firestore).
 * Now supports Time Travel for testing schedule-based progression.
 */
export const useDevPlan = () => {
  const { db, user, developmentPlanData, updateDevelopmentPlanData } = useAppServices();
  const [masterPlan, setMasterPlan] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [timeOffset, setTimeOffset] = useState(() => {
    return parseInt(localStorage.getItem('time_travel_offset') || '0', 10);
  });

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
      if (!db) return;
      try {
        const weeksRef = collection(db, 'development_plan_v1');
        const q = query(weeksRef, orderBy('weekNumber', 'asc'));
        const snapshot = await getDocs(q);
        
        const weeks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMasterPlan(weeks);
      } catch (error) {
        console.error("Error fetching development plan:", error);
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchMasterPlan();
  }, [db]);

  // 2. Derive User State
  const userState = useMemo(() => {
    // Default state if no progress exists
    const defaultState = {
      currentWeekIndex: 0, // 0-based
      weekProgress: {},
      isSetup: false,
      startDate: null
    };

    if (!developmentPlanData) return defaultState;

    // Check if this is the new V1 schema or old schema
    // If it has 'currentWeekIndex', it's likely V1.
    if (typeof developmentPlanData.currentWeekIndex === 'number') {
      return {
        ...defaultState,
        ...developmentPlanData,
        isSetup: true
      };
    }

    // If old schema, we might need to migrate or just treat as new user
    return defaultState;
  }, [developmentPlanData]);

  // 3. Compute Current Week View (Time-Based Calculation)
  const currentWeekIndex = useMemo(() => {
    // If we have a start date, calculate week based on time
    if (userState.startDate) {
      const start = userState.startDate.toDate ? userState.startDate.toDate() : new Date(userState.startDate);
      const diff = simulatedNow.getTime() - start.getTime();
      // 1 week = 7 * 24 * 60 * 60 * 1000 ms
      const weeksPassed = Math.floor(diff / 604800000);
      return Math.max(0, weeksPassed);
    }
    // Fallback to manual progress if no start date (or legacy)
    return userState.currentWeekIndex || 0;
  }, [userState.startDate, userState.currentWeekIndex, simulatedNow]);

  const currentWeek = useMemo(() => {
    if (masterPlan.length === 0) return null;
    
    // Ensure index is within bounds
    const safeIndex = Math.min(Math.max(0, currentWeekIndex), masterPlan.length - 1);
    const weekData = masterPlan[safeIndex];
    
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

    const weekKey = currentWeek.weekBlockId || `week-${String(currentWeek.weekNumber).padStart(2, '0')}`;
    const currentProgress = userState.weekProgress?.[weekKey] || { itemsCompleted: [] };
    
    let newItemsCompleted = [...(currentProgress.itemsCompleted || [])];
    
    if (isComplete) {
      if (!newItemsCompleted.includes(itemId)) newItemsCompleted.push(itemId);
    } else {
      newItemsCompleted = newItemsCompleted.filter(id => id !== itemId);
    }

    const updates = {
      [`weekProgress.${weekKey}`]: {
        ...currentProgress,
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

  return {
    loading: loadingPlan,
    masterPlan,
    userState: { ...userState, currentWeekIndex }, // Expose the calculated index
    currentWeek,
    initializePlan,
    toggleItemComplete,
    completeWeek,
    simulatedNow // Expose for UI if needed
  };
};
