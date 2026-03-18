/**
 * useCarryover Hook
 * =================
 * Provides reactive access to carryover items stored in Firestore.
 * 
 * USAGE:
 * const { 
 *   carryoverItems,      // Array of items to display (includes completed ones)
 *   incompleteCount,     // Number of incomplete items
 *   allComplete,         // True if all carryover items are done
 *   markComplete,        // Function to mark an item complete
 *   loading              // Loading state
 * } = useCarryover();
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAppServices } from '../services/useAppServices';
import { useDailyPlan } from './useDailyPlan';
import { useActionProgress } from './useActionProgress';
import {
  initializeCarryoverForLevel,
  markCarryoverItemComplete,
  purgeCompletedItems,
  addCarryoverItems
} from '../services/carryoverService';

const CARRYOVER_DOC_ID = '_carryover';

export const useCarryover = () => {
  const { db, user } = useAppServices();
  const { currentPhase, prepRequirementsComplete } = useDailyPlan();
  const { getItemProgress, progressData, loading: actionProgressLoading } = useActionProgress();
  
  const [carryoverState, setCarryoverState] = useState({ items: [], currentLevel: 0 });
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  // Calculate current milestone/level
  const currentLevel = useMemo(() => {
    if (currentPhase?.id === 'pre-start') return 0;
    if (currentPhase?.id !== 'start') return 0;
    
    const mp = user?.milestoneProgress || {};
    let level = 1;
    for (let m = 1; m <= 5; m++) {
      if (mp[`milestone_${m}`]?.signedOff) {
        level = m + 1;
      } else {
        break;
      }
    }
    return Math.min(level, 5);
  }, [currentPhase?.id, user?.milestoneProgress]);
  
  // Subscribe to carryover document changes
  useEffect(() => {
    if (!db || !user?.uid) {
      setLoading(false);
      return;
    }
    
    const ref = doc(db, 'users', user.uid, 'action_progress', CARRYOVER_DOC_ID);
    
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCarryoverState({
          items: data.items || [],
          currentLevel: data.currentLevel || 0,
          lastUpdated: data.lastUpdated
        });
      } else {
        setCarryoverState({ items: [], currentLevel: 0 });
      }
      setLoading(false);
    }, (err) => {
      console.error('[useCarryover] Error subscribing:', err);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [db, user?.uid]);
  
  // Helper: Check if an item is TRULY complete using ALL available data sources
  // This is the authoritative check that prevents completed items from entering carryover
  const isItemTrulyComplete = useCallback((item) => {
    if (!item) return false;
    
    // 1. Check prepRequirementsComplete.complete flag (primary source)
    if (item.complete === true) return true;
    
    // 2. Check action_progress directly via useActionProgress
    // This catches items completed via ANY mechanism
    const progress = getItemProgress(item.id);
    if (progress?.status === 'completed') return true;
    
    // 3. Check progressData by label (handles IDs that change)
    if (progressData && item.label) {
      const labelNorm = item.label.toLowerCase().trim();
      const foundByLabel = Object.values(progressData).some(p => 
        p?.status === 'completed' && 
        p?.label?.toLowerCase().trim() === labelNorm
      );
      if (foundByLabel) return true;
    }
    
    // 4. Double-check user.prepStatus for interactive items
    const handlerType = item.handlerType || '';
    const labelLower = (item.label || '').toLowerCase();
    const prepStatus = user?.prepStatus || {};
    
    if (handlerType === 'leader-profile' || labelLower.includes('leader profile')) {
      if (prepStatus.leaderProfile) return true;
    }
    if (handlerType === 'baseline-assessment' || labelLower.includes('baseline') || labelLower.includes('skills assessment')) {
      if (prepStatus.baselineAssessment) return true;
    }
    if (handlerType === 'notification-setup' || labelLower.includes('notification')) {
      if (prepStatus.notifications) return true;
    }
    if (handlerType === 'foundation-commitment' || labelLower.includes('foundation expectation') || labelLower.includes('foundation commitment')) {
      if (prepStatus.foundationCommitment || user?.foundationCommitment?.acknowledged) return true;
    }
    if (handlerType === 'conditioning-tutorial' || labelLower.includes('conditioning tutorial')) {
      if (prepStatus.conditioningTutorial || user?.conditioningTutorial?.completed) return true;
    }
    
    // 5. For video-series items, check prepStatus by label
    if (handlerType === 'video-series' || labelLower.includes('video')) {
      if (labelLower.includes('onboarding') && prepStatus.onboardingVideos) return true;
      if (labelLower.includes('session 1') || labelLower.includes('session1')) {
        if (prepStatus.session1Video) return true;
      }
    }
    
    return false;
  }, [user, getItemProgress, progressData]);
  
  // Initialize carryover when entering a new level
  useEffect(() => {
    if (!db || !user?.uid || loading) return;
    if (currentPhase?.id !== 'start') return;
    if (currentLevel === 0) return;
    
    // CRITICAL: Wait for action progress to FULLY load
    // Check both loading flag AND that we have actual data
    if (actionProgressLoading) {
      console.log('[useCarryover] Waiting for action progress loading flag...');
      return;
    }
    
    // ALSO check that progressData has entries - handles race condition where
    // loading=false but data hasn't been populated yet
    const progressCount = Object.keys(progressData || {}).length;
    if (progressCount === 0) {
      console.log('[useCarryover] Waiting for progressData to populate...');
      return;
    }
    
    // Also wait for prepRequirementsComplete items
    if (!prepRequirementsComplete?.items || prepRequirementsComplete.items.length === 0) {
      console.log('[useCarryover] Waiting for prepRequirementsComplete to load...');
      return;
    }
    
    // Check if we need to initialize for this level
    const needsInit = carryoverState.currentLevel < currentLevel;
    
    if (needsInit && !initialized) {
      setInitialized(true); // Prevent multiple inits
      
      console.log('[useCarryover] Starting init. progressData has', progressCount, 'entries');
      
      // Gather incomplete prep items
      const incompleteItems = [];
      
      // From prepRequirementsComplete (all prep sections up to current level)
      prepRequirementsComplete.items.forEach(item => {
        // AUTHORITATIVE completion check using ALL sources
        const isComplete = isItemTrulyComplete(item);
        console.log('[useCarryover] Checking item:', item.label, 'id:', item.id, '-> complete:', isComplete);
        
        if (isComplete) {
          return;
        }
        if (item.type === 'daily_rep') return; // Skip reps
        
        // Determine which session this prep belongs to
        const prepSection = item.prepSection || 'onboarding';
        const sessionMatch = prepSection.match(/session(\d+)/);
        const sessionNum = sessionMatch ? parseInt(sessionMatch[1], 10) : 0;
        
        // Skip prep for sessions beyond the current level
        if (sessionNum > currentLevel) return;
        
        // Determine category label based on prep section
        let category = 'Onboarding';
        if (sessionNum > 0) {
          category = `Session ${sessionNum} Prep`;
        }
        
        incompleteItems.push({
          id: item.id,
          label: item.label || 'Preparation Item',
          category,
          prepSection,
          type: item.type || 'content',
          handlerType: item.handlerType || null,
          isInteractive: ['leader-profile', 'baseline-assessment', 'notification-setup', 'foundation-commitment', 'conditioning-tutorial'].includes(item.handlerType),
          estimatedMinutes: item.estimatedMinutes || null,
          resourceId: item.resourceId || null,
          resourceType: item.resourceType || null,
          url: item.url || null,
          description: item.description || null
        });
      });
      
      console.log('[useCarryover] Initializing with', incompleteItems.length, 'TRULY incomplete items');
      
      // Initialize carryover for this level
      initializeCarryoverForLevel(db, user.uid, currentLevel, incompleteItems)
        .then(state => {
          console.log('[useCarryover] Initialized for level', currentLevel, 'with', state.items.length, 'items');
        })
        .catch(err => {
          console.error('[useCarryover] Init error:', err);
        });
    }
  }, [db, user?.uid, currentPhase?.id, currentLevel, carryoverState.currentLevel, prepRequirementsComplete, loading, initialized, isItemTrulyComplete, actionProgressLoading, progressData]);
  
  // Reset initialized flag when level changes
  useEffect(() => {
    if (currentLevel !== carryoverState.currentLevel) {
      setInitialized(false);
    }
  }, [currentLevel, carryoverState.currentLevel]);
  
  // Mark an item as complete
  const markComplete = useCallback(async (itemId) => {
    if (!db || !user?.uid || !itemId) return false;
    
    return markCarryoverItemComplete(db, user.uid, itemId, currentLevel);
  }, [db, user?.uid, currentLevel]);
  
  // Add new items (for session prep that wasn't done)
  const addItems = useCallback(async (newItems) => {
    if (!db || !user?.uid || !newItems?.length) return 0;
    
    return addCarryoverItems(db, user.uid, newItems, currentLevel);
  }, [db, user?.uid, currentLevel]);
  
  // Purge completed items (for manual cleanup if needed)
  const purgeCompleted = useCallback(async () => {
    if (!db || !user?.uid) return 0;
    
    return purgeCompletedItems(db, user.uid);
  }, [db, user?.uid]);
  
  // Computed values
  const carryoverItems = carryoverState.items;
  const incompleteCount = carryoverItems.filter(item => !item.completedAt).length;
  const completedCount = carryoverItems.filter(item => !!item.completedAt).length;
  const allComplete = carryoverItems.length > 0 && incompleteCount === 0;
  
  // Check if an item is in the carryover list
  const isCarryoverItem = useCallback((itemId) => {
    return carryoverItems.some(item => item.id === itemId);
  }, [carryoverItems]);
  
  // Check if a carryover item is complete
  const isCarryoverComplete = useCallback((itemId) => {
    const item = carryoverItems.find(i => i.id === itemId);
    return item ? !!item.completedAt : false;
  }, [carryoverItems]);
  
  return {
    // Data
    carryoverItems,
    incompleteCount,
    completedCount,
    allComplete,
    currentLevel,
    storedLevel: carryoverState.currentLevel,
    loading,
    
    // Actions
    markComplete,
    addItems,
    purgeCompleted,
    
    // Helpers
    isCarryoverItem,
    isCarryoverComplete
  };
};

export default useCarryover;
