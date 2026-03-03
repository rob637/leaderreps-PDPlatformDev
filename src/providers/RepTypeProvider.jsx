// src/providers/RepTypeProvider.jsx
// Provider that loads conditioning rep type data from Firestore on app startup.
// Makes rep type data available synchronously throughout the app via context.
// Falls back to hardcoded repTaxonomy.js data during loading or on error.

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { repTypeService } from '../services/repTypeService';
// Fallback data from hardcoded taxonomy
import {
  REP_CATEGORIES_V2,
  REP_TYPES_V2,
  MILESTONE_REP_UNLOCKS,
  LINKED_REPS,
  getCategoriesArrayV2 as getCategoriesArrayFallback,
  getRepTypesByCategoryV2 as getRepTypesByCategoryFallback,
  getRepTypeV2 as getRepTypeFallback,
  isRepUnlocked as isRepUnlockedFallback,
  hydrateTaxonomyCache,
  getSuggestedSituations as getSuggestedSituationsFallback,
  getBehaviorFocusReminder as getBehaviorFocusReminderFallback,
  getActiveRepReminder as getActiveRepReminderFallback
} from '../services/repTaxonomy';

// ============================================
// CONTEXT
// ============================================
const RepTypeContext = createContext(null);

// ============================================
// PROVIDER
// ============================================
export const RepTypeProvider = ({ children }) => {
  const { db } = useAppServices();
  
  // State
  const [categories, setCategories] = useState([]);
  const [repTypes, setRepTypes] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [situations, setSituations] = useState({});
  const [prompts, setPrompts] = useState({});
  // Conditioning Loop state
  const [prepPrompts, setPrepPrompts] = useState({});
  const [debriefStandards, setDebriefStandards] = useState({});
  const [linkedReps, setLinkedReps] = useState({});
  const [completeConfig, setCompleteConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFirestore, setUsingFirestore] = useState(false);

  // Load data from Firestore
  useEffect(() => {
    if (!db) {
      // No db yet - use fallback
      console.log('[RepTypeProvider] No db available, using fallback data');
      setCategories(getCategoriesArrayFallback());
      setRepTypes([...REP_TYPES_V2]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        console.log('[RepTypeProvider] Loading rep type data from Firestore...');
        
        // Fetch all data in parallel (including situations, prompts, and conditioning loop data)
        const [
          firestoreCategories, 
          firestoreRepTypes, 
          firestoreMilestones,
          firestoreSituations,
          firestorePrompts,
          firestorePrepPrompts,
          firestoreDebriefStandards,
          firestoreLinkedReps,
          firestoreCompleteConfig
        ] = await Promise.all([
          repTypeService.getCategories(db),
          repTypeService.getAllRepTypes(db),
          repTypeService.getMilestones(db),
          repTypeService.getSituations(db),
          repTypeService.getPrompts(db),
          repTypeService.getPrepPrompts(db),
          repTypeService.getDebriefStandards(db),
          repTypeService.getLinkedReps(db),
          repTypeService.getCompleteConfig(db)
        ]);

        // Check if we got valid data
        if (firestoreCategories.length > 0 && firestoreRepTypes.length > 0) {
          console.log(`[RepTypeProvider] Loaded from Firestore: ${firestoreCategories.length} categories, ${firestoreRepTypes.length} rep types, ${firestoreMilestones.length} milestones, ${Object.keys(firestoreSituations).length} situation groups, ${Object.keys(firestorePrompts).length} prompt sets`);
          console.log(`[RepTypeProvider] Conditioning Loop data: ${Object.keys(firestorePrepPrompts).length} prep prompts, ${Object.keys(firestoreDebriefStandards).length} debrief standards, ${Object.keys(firestoreLinkedReps).length} linked reps, ${Object.keys(firestoreCompleteConfig).length} complete configs`);
          setCategories(firestoreCategories);
          setRepTypes(firestoreRepTypes);
          setMilestones(firestoreMilestones);
          setSituations(firestoreSituations);
          setPrompts(firestorePrompts);
          setPrepPrompts(firestorePrepPrompts);
          setDebriefStandards(firestoreDebriefStandards);
          setLinkedReps(firestoreLinkedReps);
          setCompleteConfig(firestoreCompleteConfig);
          setUsingFirestore(true);
          
          // Hydrate the shared taxonomy cache for helper functions
          hydrateTaxonomyCache({
            repTypes: firestoreRepTypes,
            categories: firestoreCategories,
            milestones: firestoreMilestones,
            situations: firestoreSituations,
            prompts: firestorePrompts
          });
        } else {
          // Firestore empty/incomplete - use fallback
          console.warn('[RepTypeProvider] Firestore data incomplete, using fallback');
          setCategories(getCategoriesArrayFallback());
          setRepTypes([...REP_TYPES_V2]);
        }
      } catch (err) {
        console.error('[RepTypeProvider] Error loading from Firestore:', err);
        setError(err);
        // Use fallback on error
        setCategories(getCategoriesArrayFallback());
        setRepTypes([...REP_TYPES_V2]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [db]);

  // ============================================
  // DERIVED DATA & HELPERS
  // ============================================

  // Categories array (sorted by order)
  const getCategoriesArray = useCallback(() => {
    return [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [categories]);

  // Rep types by category
  const getRepTypesByCategory = useCallback((categoryId) => {
    return repTypes
      .filter(rt => rt.categoryId === categoryId || rt.category === categoryId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [repTypes]);

  // Single rep type lookup
  const getRepType = useCallback((repTypeId) => {
    const found = repTypes.find(rt => rt.id === repTypeId);
    if (found) return found;
    // Try fallback for legacy compatibility
    return getRepTypeFallback(repTypeId);
  }, [repTypes]);

  // Get milestone by number
  const getMilestone = useCallback((milestoneNumber) => {
    return milestones.find(m => m.number === milestoneNumber) || null;
  }, [milestones]);

  // Get reps unlocked at a milestone
  const getUnlockedRepsByMilestone = useCallback((milestoneNumber) => {
    const milestone = getMilestone(milestoneNumber);
    if (milestone?.repTypeIds) {
      return milestone.repTypeIds
        .map(id => getRepType(id))
        .filter(Boolean);
    }
    // Fallback to hardcoded
    const fallbackIds = MILESTONE_REP_UNLOCKS[milestoneNumber] || [];
    return fallbackIds.map(id => getRepType(id)).filter(Boolean);
  }, [getMilestone, getRepType]);

  // Check if a rep is unlocked
  const isRepUnlocked = useCallback((repTypeId, milestoneProgress = {}, completedRepTypes = []) => {
    // For now, delegate to fallback which has the unlock logic
    // TODO: Move unlock logic to Firestore-based check using milestone data
    return isRepUnlockedFallback(repTypeId, milestoneProgress, completedRepTypes);
  }, []);

  // Get milestone for a rep
  const getMilestoneForRep = useCallback((repTypeId) => {
    for (const milestone of milestones) {
      if (milestone.repTypeIds?.includes(repTypeId)) {
        return milestone.number;
      }
    }
    // Try fallback
    for (const [milestone, repIds] of Object.entries(MILESTONE_REP_UNLOCKS)) {
      if (repIds.includes(repTypeId)) {
        return parseInt(milestone, 10);
      }
    }
    // Check linked reps
    if (LINKED_REPS[repTypeId]) {
      return null; // Linked reps don't have a specific milestone
    }
    return null;
  }, [milestones]);

  // Rep type map for quick lookup
  const repTypeMap = useMemo(() => {
    const map = new Map();
    repTypes.forEach(rt => map.set(rt.id, rt));
    return map;
  }, [repTypes]);

  // Get situations for a rep type
  const getSuggestedSituations = useCallback((repTypeId) => {
    return situations[repTypeId] || [];
  }, [situations]);

  // Get behavior focus reminder for a rep type
  const getBehaviorFocusReminder = useCallback((repTypeId) => {
    return prompts[repTypeId]?.behaviorFocus || null;
  }, [prompts]);

  // Get active rep reminder for a rep type
  const getActiveRepReminder = useCallback((repTypeId) => {
    return prompts[repTypeId]?.activeReminder || null;
  }, [prompts]);

  // ============================================
  // CONDITIONING LOOP HELPERS
  // ============================================

  // Get prep prompts for a rep type (for optional Quick Prep before execute)
  const getPrepPromptsForRep = useCallback((repTypeId) => {
    return prepPrompts[repTypeId] || null;
  }, [prepPrompts]);

  // Get debrief standards for a rep type (pass criteria & coaching questions)
  const getDebriefStandardsForRep = useCallback((repTypeId) => {
    return debriefStandards[repTypeId] || null;
  }, [debriefStandards]);

  // Get linked reps config for a rep type (e.g., "Make a Clean Handoff" requires prior action)
  const getLinkedRepsForRep = useCallback((repTypeId) => {
    return linkedReps[repTypeId] || null;
  }, [linkedReps]);

  // Get complete config for a rep type (questions for completing the loop)
  const getCompleteConfigForRep = useCallback((repTypeId) => {
    return completeConfig[repTypeId] || null;
  }, [completeConfig]);

  // Check if a rep type is a linked rep that requires a prerequisite
  const requiresPrerequisite = useCallback((repTypeId) => {
    const config = linkedReps[repTypeId];
    return config?.requiresPrerequisite === true;
  }, [linkedReps]);

  // Check if completing a rep type should create a linked rep
  const createsLinkedRep = useCallback((repTypeId) => {
    const config = linkedReps[repTypeId];
    return config?.createsLinkedRepId ? config.createsLinkedRepId : null;
  }, [linkedReps]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value = useMemo(() => ({
    // State
    loading,
    error,
    usingFirestore,
    
    // Data
    categories,
    repTypes,
    milestones,
    situations,
    prompts,
    repTypeMap,
    // Conditioning Loop data
    prepPrompts,
    debriefStandards,
    linkedReps,
    completeConfig,
    
    // Helpers (V2 API compatible)
    getCategoriesArray,
    getCategoriesArrayV2: getCategoriesArray, // Alias for V2 compat
    getRepTypesByCategory,
    getRepTypesByCategoryV2: getRepTypesByCategory, // Alias
    getRepType,
    getRepTypeV2: getRepType, // Alias
    getMilestone,
    getUnlockedRepsByMilestone,
    isRepUnlocked,
    getMilestoneForRep,
    
    // Situations & Prompts helpers
    getSuggestedSituations,
    getBehaviorFocusReminder,
    getActiveRepReminder,
    
    // Conditioning Loop helpers
    getPrepPromptsForRep,
    getDebriefStandardsForRep,
    getLinkedRepsForRep,
    getCompleteConfigForRep,
    requiresPrerequisite,
    createsLinkedRep,
    
    // Cache invalidation (for admin edits)
    refreshData: () => {
      repTypeService.invalidateRepTypeCache();
      // Re-trigger load by toggling loading state
      // This is a simple approach; more sophisticated would be to have a version counter
    }
  }), [
    loading, error, usingFirestore,
    categories, repTypes, milestones, situations, prompts, repTypeMap,
    prepPrompts, debriefStandards, linkedReps, completeConfig,
    getCategoriesArray, getRepTypesByCategory, getRepType,
    getMilestone, getUnlockedRepsByMilestone, isRepUnlocked, getMilestoneForRep,
    getSuggestedSituations, getBehaviorFocusReminder, getActiveRepReminder,
    getPrepPromptsForRep, getDebriefStandardsForRep, getLinkedRepsForRep,
    getCompleteConfigForRep, requiresPrerequisite, createsLinkedRep
  ]);

  return (
    <RepTypeContext.Provider value={value}>
      {children}
    </RepTypeContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================
export const useRepTypeContext = () => {
  const context = useContext(RepTypeContext);
  if (!context) {
    console.warn('[useRepTypeContext] Used outside of RepTypeProvider, returning fallback functions');
    // Return fallback implementation for components used outside provider
    return {
      loading: false,
      error: null,
      usingFirestore: false,
      categories: getCategoriesArrayFallback(),
      repTypes: [...REP_TYPES_V2],
      milestones: [],
      situations: {},
      prompts: {},
      prepPrompts: {},
      debriefStandards: {},
      linkedReps: {},
      completeConfig: {},
      repTypeMap: new Map(REP_TYPES_V2.map(rt => [rt.id, rt])),
      getCategoriesArray: getCategoriesArrayFallback,
      getCategoriesArrayV2: getCategoriesArrayFallback,
      getRepTypesByCategory: getRepTypesByCategoryFallback,
      getRepTypesByCategoryV2: getRepTypesByCategoryFallback,
      getRepType: getRepTypeFallback,
      getRepTypeV2: getRepTypeFallback,
      getMilestone: () => null,
      getUnlockedRepsByMilestone: () => [],
      isRepUnlocked: isRepUnlockedFallback,
      getMilestoneForRep: () => null,
      getSuggestedSituations: getSuggestedSituationsFallback,
      getBehaviorFocusReminder: getBehaviorFocusReminderFallback,
      getActiveRepReminder: getActiveRepReminderFallback,
      getPrepPromptsForRep: () => null,
      getDebriefStandardsForRep: () => null,
      getLinkedRepsForRep: () => null,
      getCompleteConfigForRep: () => null,
      requiresPrerequisite: () => false,
      createsLinkedRep: () => null,
      refreshData: () => {}
    };
  }
  return context;
};

export default RepTypeProvider;
