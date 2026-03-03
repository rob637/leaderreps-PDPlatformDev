// src/services/repTypeService.js
// Service for fetching conditioning rep type data from Firestore
// Provides caching layer for performance (data rarely changes)

import { collection, getDocs, doc, getDoc, query, orderBy, where } from 'firebase/firestore';

// ============================================
// CACHE MANAGEMENT
// ============================================

// In-memory cache (persists for session duration)
const cache = {
  categories: null,
  repTypes: null,
  repTypesById: null,
  qualityDimensions: null,
  milestones: null,
  coachPrompts: null,
  lastFetch: {}
};

// Cache TTL in milliseconds (5 minutes for non-admin, can be invalidated manually)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Check if cache entry is valid
 */
const isCacheValid = (key) => {
  if (!cache[key]) return false;
  const lastFetch = cache.lastFetch[key];
  if (!lastFetch) return false;
  return (Date.now() - lastFetch) < CACHE_TTL;
};

/**
 * Invalidate all caches (call after admin edits)
 */
export const invalidateRepTypeCache = () => {
  cache.categories = null;
  cache.repTypes = null;
  cache.repTypesById = null;
  cache.qualityDimensions = null;
  cache.milestones = null;
  cache.coachPrompts = null;
  cache.lastFetch = {};
  console.log('[repTypeService] Cache invalidated');
};

// ============================================
// CATEGORY METHODS
// ============================================

/**
 * Get all rep categories
 * @param {Firestore} db - Firestore instance
 * @returns {Promise<Array>} Array of category objects
 */
export const getCategories = async (db) => {
  if (isCacheValid('categories')) {
    return cache.categories;
  }

  try {
    const categoriesRef = collection(db, 'conditioning_categories');
    const q = query(categoriesRef, orderBy('sortOrder', 'asc'));
    const snapshot = await getDocs(q);
    
    const categories = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(cat => cat.isActive !== false);
    
    cache.categories = categories;
    cache.lastFetch.categories = Date.now();
    
    return categories;
  } catch (error) {
    console.error('[repTypeService] Error fetching categories:', error);
    return [];
  }
};

/**
 * Get a single category by ID
 * @param {Firestore} db - Firestore instance
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object|null>} Category object or null
 */
export const getCategoryById = async (db, categoryId) => {
  const categories = await getCategories(db);
  return categories.find(c => c.id === categoryId) || null;
};

// ============================================
// REP TYPE METHODS
// ============================================

/**
 * Get all rep types
 * @param {Firestore} db - Firestore instance
 * @returns {Promise<Array>} Array of rep type objects
 */
export const getAllRepTypes = async (db) => {
  if (isCacheValid('repTypes')) {
    return cache.repTypes;
  }

  try {
    const repTypesRef = collection(db, 'conditioning_rep_types');
    const q = query(repTypesRef, orderBy('sortOrder', 'asc'));
    const snapshot = await getDocs(q);
    
    const repTypes = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(rt => rt.isActive !== false);
    
    // Also build the by-ID lookup
    const repTypesById = {};
    repTypes.forEach(rt => {
      repTypesById[rt.id] = rt;
    });
    
    cache.repTypes = repTypes;
    cache.repTypesById = repTypesById;
    cache.lastFetch.repTypes = Date.now();
    
    return repTypes;
  } catch (error) {
    console.error('[repTypeService] Error fetching rep types:', error);
    return [];
  }
};

/**
 * Get a single rep type by ID
 * @param {Firestore} db - Firestore instance
 * @param {string} repTypeId - Rep type ID
 * @returns {Promise<Object|null>} Rep type object or null
 */
export const getRepTypeById = async (db, repTypeId) => {
  // Check cache first
  if (cache.repTypesById && cache.repTypesById[repTypeId]) {
    return cache.repTypesById[repTypeId];
  }
  
  // If cache miss, fetch all and return from cache
  await getAllRepTypes(db);
  return cache.repTypesById?.[repTypeId] || null;
};

/**
 * Get rep types by category
 * @param {Firestore} db - Firestore instance
 * @param {string} categoryId - Category ID
 * @returns {Promise<Array>} Array of rep type objects in that category
 */
export const getRepTypesByCategory = async (db, categoryId) => {
  const repTypes = await getAllRepTypes(db);
  return repTypes.filter(rt => rt.categoryId === categoryId);
};

/**
 * Get rep types grouped by category
 * @param {Firestore} db - Firestore instance
 * @returns {Promise<Object>} Object with categoryId keys and rep type arrays
 */
export const getRepTypesGroupedByCategory = async (db) => {
  const [categories, repTypes] = await Promise.all([
    getCategories(db),
    getAllRepTypes(db)
  ]);
  
  const grouped = {};
  categories.forEach(cat => {
    grouped[cat.id] = {
      category: cat,
      repTypes: repTypes.filter(rt => rt.categoryId === cat.id)
    };
  });
  
  return grouped;
};

// ============================================
// MILESTONE METHODS
// ============================================

/**
 * Get all milestone definitions
 * @param {Firestore} db - Firestore instance
 * @param {string} phase - Optional filter by phase ('foundation', 'ascent')
 * @returns {Promise<Array>} Array of milestone objects
 */
export const getMilestones = async (db, phase = null) => {
  if (isCacheValid('milestones') && !phase) {
    return cache.milestones;
  }

  try {
    const milestonesRef = collection(db, 'conditioning_milestones');
    let q = query(milestonesRef, orderBy('sortOrder', 'asc'));
    
    const snapshot = await getDocs(q);
    
    let milestones = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(m => m.isActive !== false);
    
    // Cache unfiltered result
    if (!phase) {
      cache.milestones = milestones;
      cache.lastFetch.milestones = Date.now();
    }
    
    // Apply phase filter if specified
    if (phase) {
      milestones = milestones.filter(m => m.phase === phase);
    }
    
    return milestones;
  } catch (error) {
    console.error('[repTypeService] Error fetching milestones:', error);
    return [];
  }
};

/**
 * Get a single milestone by ID
 * @param {Firestore} db - Firestore instance
 * @param {string} milestoneId - Milestone ID (e.g., 'foundation_1')
 * @returns {Promise<Object|null>} Milestone object or null
 */
export const getMilestoneById = async (db, milestoneId) => {
  const milestones = await getMilestones(db);
  return milestones.find(m => m.id === milestoneId) || null;
};

/**
 * Get milestone by number (for foundation phase)
 * @param {Firestore} db - Firestore instance
 * @param {number} milestoneNumber - 1-5
 * @returns {Promise<Object|null>} Milestone object or null
 */
export const getMilestoneByNumber = async (db, milestoneNumber) => {
  const milestones = await getMilestones(db, 'foundation');
  return milestones.find(m => m.milestoneNumber === milestoneNumber) || null;
};

// ============================================
// QUALITY DIMENSION METHODS
// ============================================

/**
 * Get all quality dimensions
 * @param {Firestore} db - Firestore instance
 * @returns {Promise<Array>} Array of quality dimension objects
 */
export const getQualityDimensions = async (db) => {
  if (isCacheValid('qualityDimensions')) {
    return cache.qualityDimensions;
  }

  try {
    const dimensionsRef = collection(db, 'conditioning_quality_dimensions');
    const snapshot = await getDocs(dimensionsRef);
    
    const dimensions = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(d => d.isActive !== false);
    
    cache.qualityDimensions = dimensions;
    cache.lastFetch.qualityDimensions = Date.now();
    
    return dimensions;
  } catch (error) {
    console.error('[repTypeService] Error fetching quality dimensions:', error);
    return [];
  }
};

/**
 * Get quality dimensions for a specific rep type
 * @param {Firestore} db - Firestore instance
 * @param {string} repTypeId - Rep type ID
 * @returns {Promise<Array>} Array of quality dimension objects applicable to this rep type
 */
export const getQualityDimensionsForRepType = async (db, repTypeId) => {
  const [repType, allDimensions] = await Promise.all([
    getRepTypeById(db, repTypeId),
    getQualityDimensions(db)
  ]);
  
  if (!repType || !repType.qualityDimensions) {
    return [];
  }
  
  // Filter to dimensions listed in the rep type
  return allDimensions.filter(d => repType.qualityDimensions.includes(d.id));
};

// ============================================
// COACH PROMPT METHODS
// ============================================

/**
 * Get all coach prompts
 * @param {Firestore} db - Firestore instance
 * @returns {Promise<Array>} Array of coach prompt objects
 */
export const getCoachPrompts = async (db) => {
  if (isCacheValid('coachPrompts')) {
    return cache.coachPrompts;
  }

  try {
    const promptsRef = collection(db, 'conditioning_coach_prompts');
    const snapshot = await getDocs(promptsRef);
    
    const prompts = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(p => p.isActive !== false);
    
    cache.coachPrompts = prompts;
    cache.lastFetch.coachPrompts = Date.now();
    
    return prompts;
  } catch (error) {
    console.error('[repTypeService] Error fetching coach prompts:', error);
    return [];
  }
};

/**
 * Get coach prompt with cascading fallback
 * Looks for: milestone+rep specific → rep specific → default
 * @param {Firestore} db - Firestore instance
 * @param {string} promptType - Type of prompt ('evidence_assessment', 'scaffolding', 'debrief')
 * @param {string} repTypeId - Rep type ID (optional)
 * @param {string} milestoneId - Milestone ID (optional)
 * @returns {Promise<Object|null>} Best matching prompt or null
 */
export const getCoachPrompt = async (db, promptType, repTypeId = null, milestoneId = null) => {
  const prompts = await getCoachPrompts(db);
  
  // Filter to matching prompt type
  const typePrompts = prompts.filter(p => p.promptType === promptType);
  
  // Priority 1: Milestone + Rep specific
  if (milestoneId && repTypeId) {
    const specific = typePrompts.find(
      p => p.milestoneId === milestoneId && p.repTypeId === repTypeId
    );
    if (specific) return specific;
  }
  
  // Priority 2: Rep specific (any milestone)
  if (repTypeId) {
    const repSpecific = typePrompts.find(
      p => p.repTypeId === repTypeId && !p.milestoneId
    );
    if (repSpecific) return repSpecific;
  }
  
  // Priority 3: Default (no rep or milestone specified)
  const defaultPrompt = typePrompts.find(
    p => !p.repTypeId && !p.milestoneId
  );
  
  return defaultPrompt || null;
};

/**
 * Render a coach prompt template with variables
 * @param {string} template - Prompt template with {{placeholders}}
 * @param {Object} variables - Object with variable values
 * @returns {string} Rendered prompt
 */
export const renderPromptTemplate = (template, variables) => {
  let rendered = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    rendered = rendered.replace(placeholder, value || '');
  });
  
  return rendered;
};

// ============================================
// MILESTONE REP ENRICHMENT
// ============================================

/**
 * Get enriched rep data for a milestone
 * Combines daily_plan_v1 actions with rep type definitions
 * @param {Firestore} db - Firestore instance
 * @param {number} milestoneNumber - 1-5 for foundation
 * @returns {Promise<Array>} Array of enriched rep action objects
 */
export const getEnrichedMilestoneReps = async (db, milestoneNumber) => {
  // Get the milestone document from daily_plan_v1
  const milestoneDocRef = doc(db, 'daily_plan_v1', `milestone-${milestoneNumber}`);
  const milestoneDoc = await getDoc(milestoneDocRef);
  
  if (!milestoneDoc.exists()) {
    console.warn(`[repTypeService] Milestone document not found: milestone-${milestoneNumber}`);
    return [];
  }
  
  const milestoneData = milestoneDoc.data();
  const actions = milestoneData.actions || [];
  
  // Filter to conditioning-rep actions only
  const repActions = actions.filter(a => a.handlerType === 'conditioning-rep');
  
  // Enrich each action with rep type data
  const enrichedReps = await Promise.all(
    repActions.map(async (action) => {
      const repType = await getRepTypeById(db, action.repTypeId);
      
      return {
        // Action-level data (from daily_plan_v1)
        actionId: action.id,
        label: action.label,
        required: action.required !== false,
        completesWhen: action.completesWhen || 'loop_closed',
        linkedToRepType: action.linkedToRepType || null,
        enabled: action.enabled !== false,
        
        // Rep type data (from conditioning_rep_types)
        repTypeId: action.repTypeId,
        repType: repType || null,
        
        // Combined for convenience
        displayLabel: action.label || repType?.label || 'Unknown Rep',
        shortLabel: repType?.shortLabel || action.label,
        description: repType?.description || '',
        categoryId: repType?.categoryId || null,
        difficultyTier: repType?.baseDifficultyTier || 1,
        scaffoldingPrompts: repType?.defaultScaffoldingPrompts || {},
        qualityDimensions: repType?.qualityDimensions || []
      };
    })
  );
  
  return enrichedReps;
};

// ============================================
// UTILITY METHODS
// ============================================

/**
 * Check if a rep type exists
 * @param {Firestore} db - Firestore instance
 * @param {string} repTypeId - Rep type ID
 * @returns {Promise<boolean>} True if exists
 */
export const repTypeExists = async (db, repTypeId) => {
  const repType = await getRepTypeById(db, repTypeId);
  return repType !== null;
};

/**
 * Get rep types unlocked by a milestone (cumulative)
 * Based on milestone_rep_unlocks mapping
 * @param {Firestore} db - Firestore instance
 * @param {number} milestoneNumber - 1-5
 * @returns {Promise<Array>} Array of unlocked rep type IDs
 */
export const getUnlockedRepTypesByMilestone = async (db, milestoneNumber) => {
  // For now, use the enriched milestone reps to determine unlocks
  // This could be enhanced to check a dedicated unlock config
  const allUnlocked = [];
  
  for (let m = 1; m <= milestoneNumber; m++) {
    const reps = await getEnrichedMilestoneReps(db, m);
    reps.forEach(rep => {
      if (rep.repTypeId && !allUnlocked.includes(rep.repTypeId)) {
        allUnlocked.push(rep.repTypeId);
      }
    });
  }
  
  return allUnlocked;
};

// ============================================
// SITUATIONS
// ============================================

/**
 * Get all situations from Firestore
 * Returns object keyed by repTypeId: { repTypeId: [ { label, order } ] }
 */
export const getSituations = async (db) => {
  if (!db) return {};
  
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'conditioning_situations'),
        orderBy('repTypeId'),
        orderBy('order', 'asc')
      )
    );
    
    const situations = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const repTypeId = data.repTypeId;
      if (!situations[repTypeId]) {
        situations[repTypeId] = [];
      }
      situations[repTypeId].push({
        id: doc.id,
        label: data.label,
        order: data.order || 0
      });
    });
    
    console.log(`[repTypeService] Loaded situations for ${Object.keys(situations).length} rep types`);
    return situations;
  } catch (error) {
    console.error('[repTypeService] Error loading situations:', error);
    return {};
  }
};

/**
 * Get situations for a specific rep type
 */
export const getSituationsForRepType = async (db, repTypeId) => {
  if (!db || !repTypeId) return [];
  
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'conditioning_situations'),
        where('repTypeId', '==', repTypeId),
        orderBy('order', 'asc')
      )
    );
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[repTypeService] Error loading situations for rep type:', error);
    return [];
  }
};

// ============================================
// PROMPTS (Behavior Focus + Active Reminders)
// ============================================

/**
 * Get all prompts from Firestore
 * Returns object keyed by repTypeId: { repTypeId: { behaviorFocus, activeReminder } }
 */
export const getPrompts = async (db) => {
  if (!db) return {};
  
  try {
    const snapshot = await getDocs(collection(db, 'conditioning_prompts'));
    
    const prompts = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const repTypeId = data.repTypeId;
      if (repTypeId) {
        prompts[repTypeId] = {
          id: doc.id,
          behaviorFocus: data.behaviorFocus || null,
          activeReminder: data.activeReminder || null
        };
      }
    });
    
    console.log(`[repTypeService] Loaded prompts for ${Object.keys(prompts).length} rep types`);
    return prompts;
  } catch (error) {
    console.error('[repTypeService] Error loading prompts:', error);
    return {};
  }
};

/**
 * Get prompts for a specific rep type
 */
export const getPromptsForRepType = async (db, repTypeId) => {
  if (!db || !repTypeId) return null;
  
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'conditioning_prompts'),
        where('repTypeId', '==', repTypeId)
      )
    );
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('[repTypeService] Error loading prompts for rep type:', error);
    return null;
  }
};

// ============================================
// PREP PROMPTS (Conditioning Loop - Optional Prep)
// ============================================

/**
 * Get all prep prompts (2 prompts per rep type for 60-120 sec alignment check)
 */
export const getPrepPrompts = async (db) => {
  if (!db) return {};
  
  try {
    const snapshot = await getDocs(collection(db, 'conditioning_prep_prompts'));
    const prepPrompts = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      prepPrompts[doc.id] = {
        id: doc.id,
        repTypeId: data.repTypeId,
        prompts: data.prompts || [],
        ...data
      };
    });
    
    console.log(`[repTypeService] Loaded prep prompts for ${Object.keys(prepPrompts).length} rep types`);
    return prepPrompts;
  } catch (error) {
    console.error('[repTypeService] Error loading prep prompts:', error);
    return {};
  }
};

/**
 * Get prep prompts for a specific rep type
 */
export const getPrepPromptsForRepType = async (db, repTypeId) => {
  if (!db || !repTypeId) return null;
  
  try {
    const docRef = doc(db, 'conditioning_prep_prompts', repTypeId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('[repTypeService] Error loading prep prompts for rep type:', error);
    return null;
  }
};

// ============================================
// DEBRIEF STANDARDS (Conditioning Loop - System Debrief)
// ============================================

/**
 * Get all debrief standards (pass criteria and coaching prompts)
 */
export const getDebriefStandards = async (db) => {
  if (!db) return {};
  
  try {
    const snapshot = await getDocs(collection(db, 'conditioning_debrief_standards'));
    const debriefStandards = {};
    
    snapshot.docs.forEach(doc => {
      debriefStandards[doc.id] = {
        id: doc.id,
        ...doc.data()
      };
    });
    
    console.log(`[repTypeService] Loaded debrief standards for ${Object.keys(debriefStandards).length} rep types`);
    return debriefStandards;
  } catch (error) {
    console.error('[repTypeService] Error loading debrief standards:', error);
    return {};
  }
};

/**
 * Get debrief standards for a specific rep type
 */
export const getDebriefStandardsForRepType = async (db, repTypeId) => {
  if (!db || !repTypeId) return null;
  
  try {
    const docRef = doc(db, 'conditioning_debrief_standards', repTypeId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('[repTypeService] Error loading debrief standards for rep type:', error);
    return null;
  }
};

// ============================================
// LINKED REPS (Conditioning Loop - Auto-create follow-ups)
// ============================================

/**
 * Get all linked reps configuration
 */
export const getLinkedReps = async (db) => {
  if (!db) return {};
  
  try {
    const snapshot = await getDocs(collection(db, 'conditioning_linked_reps'));
    const linkedReps = {};
    
    snapshot.docs.forEach(doc => {
      linkedReps[doc.id] = {
        id: doc.id,
        ...doc.data()
      };
    });
    
    console.log(`[repTypeService] Loaded linked reps for ${Object.keys(linkedReps).length} rep types`);
    return linkedReps;
  } catch (error) {
    console.error('[repTypeService] Error loading linked reps:', error);
    return {};
  }
};

/**
 * Get linked reps config for a specific rep type
 */
export const getLinkedRepsForRepType = async (db, repTypeId) => {
  if (!db || !repTypeId) return null;
  
  try {
    const docRef = doc(db, 'conditioning_linked_reps', repTypeId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('[repTypeService] Error loading linked reps for rep type:', error);
    return null;
  }
};

// ============================================
// COMPLETE CONFIG (Conditioning Loop - Lock in behavior)
// ============================================

/**
 * Get all complete config (questions for loop completion)
 */
export const getCompleteConfig = async (db) => {
  if (!db) return {};
  
  try {
    const snapshot = await getDocs(collection(db, 'conditioning_complete_config'));
    const completeConfig = {};
    
    snapshot.docs.forEach(doc => {
      completeConfig[doc.id] = {
        id: doc.id,
        ...doc.data()
      };
    });
    
    console.log(`[repTypeService] Loaded complete config for ${Object.keys(completeConfig).length} rep types`);
    return completeConfig;
  } catch (error) {
    console.error('[repTypeService] Error loading complete config:', error);
    return {};
  }
};

/**
 * Get complete config for a specific rep type
 */
export const getCompleteConfigForRepType = async (db, repTypeId) => {
  if (!db || !repTypeId) return null;
  
  try {
    const docRef = doc(db, 'conditioning_complete_config', repTypeId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    };
  } catch (error) {
    console.error('[repTypeService] Error loading complete config for rep type:', error);
    return null;
  }
};

// ============================================
// EXPORT SERVICE OBJECT (for backward compatibility)
// ============================================

export const repTypeService = {
  // Cache management
  invalidateCache: invalidateRepTypeCache,
  
  // Categories
  getCategories,
  getCategoryById,
  
  // Rep Types
  getAllRepTypes,
  getRepTypeById,
  getRepTypesByCategory,
  getRepTypesGroupedByCategory,
  repTypeExists,
  
  // Milestones
  getMilestones,
  getMilestoneById,
  getMilestoneByNumber,
  getEnrichedMilestoneReps,
  getUnlockedRepTypesByMilestone,
  
  // Quality Dimensions
  getQualityDimensions,
  getQualityDimensionsForRepType,
  
  // Coach Prompts
  getCoachPrompts,
  getCoachPrompt,
  renderPromptTemplate,
  
  // Situations
  getSituations,
  getSituationsForRepType,
  
  // Prompts (Behavior Focus + Active Reminders)
  getPrompts,
  getPromptsForRepType,
  
  // Prep Prompts (Conditioning Loop)
  getPrepPrompts,
  getPrepPromptsForRepType,
  
  // Debrief Standards (Conditioning Loop)
  getDebriefStandards,
  getDebriefStandardsForRepType,
  
  // Linked Reps (Conditioning Loop)
  getLinkedReps,
  getLinkedRepsForRepType,
  
  // Complete Config (Conditioning Loop)
  getCompleteConfig,
  getCompleteConfigForRepType
};

export default repTypeService;
