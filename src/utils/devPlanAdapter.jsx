// src/utils/devPlanAdapter.jsx
// Adapter layer to transform Firebase data structure to component-expected format
// Firebase has: focusAreas, answers, openEnded, phase strings
// Components expect: coreReps, responses, openEndedResponse, week numbers

/* =========================================================
   CORE ADAPTERS
========================================================= */

/**
 * Adapt Firebase plan structure to component-expected structure
 * Transforms focusAreas → coreReps for backward compatibility
 */
export const adaptFirebasePlanToComponents = (firebasePlan) => {
  if (!firebasePlan) return null;
  
  console.log('[Adapter] Adapting Firebase plan:', {
    hasFocusAreas: !!firebasePlan.focusAreas,
    focusAreaCount: firebasePlan.focusAreas?.length || 0,
    cycle: firebasePlan.cycle
  });
  
  // Transform focusAreas → coreReps
  const coreReps = [];
  
  firebasePlan.focusAreas?.forEach((area, areaIndex) => {
    area.reps?.forEach((rep, repIndex) => {
      // Convert phase string to weeks completed
      const weeksCompleted = parsePhaseToWeeks(rep.week);
      
      coreReps.push({
        // Create pseudo skill ID from area and rep
        skillId: generateSkillId(area.name, repIndex),
        
        // Core fields
        skillName: rep.rep,
        focusArea: area.name,
        weeksCompleted,
        phase: rep.week,
        
        // Related data from focus area
        courses: area.courses || [],
        score: area.score,
        whatGoodLooksLike: area.whatGoodLooksLike,
        why: area.why,
        
        // Metadata
        areaIndex,
        repIndex,
        
        // Keep original for reference
        _originalRep: rep,
        _originalArea: { name: area.name, courses: area.courses }
      });
    });
  });
  
  console.log('[Adapter] Created coreReps:', {
    count: coreReps.length,
    sample: coreReps[0]
  });
  
  return {
    ...firebasePlan,
    coreReps,  // Add adapted structure
    _originalFocusAreas: firebasePlan.focusAreas,  // Keep original
    _adapted: true  // Flag for debugging
  };
};

/**
 * Adapt Firebase assessment structure to component-expected structure
 * Transforms answers → responses, openEnded → openEndedResponse
 */
export const adaptFirebaseAssessmentToComponents = (firebaseAssessment) => {
  if (!firebaseAssessment) return null;
  
  console.log('[Adapter] Adapting Firebase assessment:', {
    hasAnswers: !!firebaseAssessment.answers,
    hasOpenEnded: firebaseAssessment.openEnded !== undefined,
    hasScores: !!firebaseAssessment.scores
  });
  
  return {
    ...firebaseAssessment,
    
    // Add component-expected field names
    responses: firebaseAssessment.answers || {},
    openEndedResponse: firebaseAssessment.openEnded || '',
    
    // Keep originals for reference
    _originalAnswers: firebaseAssessment.answers,
    _originalOpenEnded: firebaseAssessment.openEnded,
    _adapted: true
  };
};

/**
 * Adapt component plan structure back to Firebase structure
 * Transforms coreReps → focusAreas for saving
 */
export const adaptComponentPlanToFirebase = (componentPlan) => {
  if (!componentPlan) return null;
  
  // If already has focusAreas, use those (already in Firebase format)
  if (componentPlan._originalFocusAreas) {
    return {
      ...componentPlan,
      focusAreas: componentPlan._originalFocusAreas,
      // Remove adapter artifacts
      coreReps: undefined,
      _originalFocusAreas: undefined,
      _adapted: undefined
    };
  }
  
  // Otherwise, need to reconstruct focusAreas from coreReps (rare case)
  console.warn('[Adapter] Reconstructing focusAreas from coreReps - data may be incomplete');
  
  const focusAreasMap = {};
  
  componentPlan.coreReps?.forEach((rep) => {
    const areaName = rep.focusArea || 'General';
    
    if (!focusAreasMap[areaName]) {
      focusAreasMap[areaName] = {
        name: areaName,
        courses: rep.courses || [],
        reps: [],
        score: rep.score || 'N/A',
        whatGoodLooksLike: rep.whatGoodLooksLike || '',
        why: rep.why || ''
      };
    }
    
    focusAreasMap[areaName].reps.push({
      rep: rep.skillName || rep.skillId,
      week: weeksToPhase(rep.weeksCompleted) || 'Week 1-3'
    });
  });
  
  const focusAreas = Object.values(focusAreasMap);
  
  return {
    ...componentPlan,
    focusAreas,
    // Remove adapter artifacts
    coreReps: undefined,
    _originalFocusAreas: undefined,
    _adapted: undefined
  };
};

/* =========================================================
   PHASE/WEEK CONVERSION UTILITIES
========================================================= */

/**
 * Convert phase string to weeks completed number
 * "Week 1-3" → 3, "Week 4-6" → 6, "Week 7-9" → 9, "Week 10-12" → 12
 */
export const parsePhaseToWeeks = (phaseString) => {
  if (!phaseString) return 0;
  
  // Match "Week X-Y" pattern
  const match = phaseString.match(/Week\s+(\d+)-(\d+)/i);
  if (match) {
    return parseInt(match[2]); // Return end week of phase
  }
  
  // Fallback: try to extract any number
  const numberMatch = phaseString.match(/(\d+)/);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }
  
  return 0;
};

/**
 * Convert weeks completed to phase string
 * 0-3 → "Week 1-3", 4-6 → "Week 4-6", etc.
 */
export const weeksToPhase = (weeks) => {
  if (weeks <= 3) return 'Week 1-3';
  if (weeks <= 6) return 'Week 4-6';
  if (weeks <= 9) return 'Week 7-9';
  return 'Week 10-12';
};

/**
 * Calculate progress percentage from phase string
 */
export const calculatePhaseProgress = (phaseString) => {
  const phaseMap = {
    'Week 1-3': 25,
    'Week 4-6': 50,
    'Week 7-9': 75,
    'Week 10-12': 100
  };
  
  return phaseMap[phaseString] || 0;
};

/**
 * Get next phase in sequence
 */
export const getNextPhase = (currentPhase) => {
  const phases = ['Week 1-3', 'Week 4-6', 'Week 7-9', 'Week 10-12'];
  const currentIndex = phases.indexOf(currentPhase);
  
  if (currentIndex === -1 || currentIndex === phases.length - 1) {
    return currentPhase; // Already at last phase or invalid
  }
  
  return phases[currentIndex + 1];
};

/**
 * Get previous phase in sequence
 */
export const getPreviousPhase = (currentPhase) => {
  const phases = ['Week 1-3', 'Week 4-6', 'Week 7-9', 'Week 10-12'];
  const currentIndex = phases.indexOf(currentPhase);
  
  if (currentIndex <= 0) {
    return currentPhase; // Already at first phase or invalid
  }
  
  return phases[currentIndex - 1];
};

/* =========================================================
   SKILL CATALOG UTILITIES
========================================================= */

/**
 * Generate consistent skill ID from focus area and rep index
 */
export const generateSkillId = (areaName, repIndex) => {
  const sanitized = areaName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  return `${sanitized}_rep${repIndex}`;
};

/**
 * Build virtual skill catalog from plan's focusAreas
 * Creates skill objects that components can use for lookups
 */
export const buildVirtualSkillCatalog = (currentPlan) => {
  if (!currentPlan?.focusAreas) {
    console.warn('[Adapter] No focusAreas found for skill catalog');
    return [];
  }
  
  // Ensure focusAreas is an array
  if (!Array.isArray(currentPlan.focusAreas)) {
    console.warn('[Adapter] focusAreas is not an array:', typeof currentPlan.focusAreas);
    return [];
  }
  
  const skills = [];
  
  currentPlan.focusAreas.forEach((area, areaIndex) => {
    // Handle string-only focus areas (simplified format)
    if (typeof area === 'string') {
      console.log('[Adapter] Focus area is a string, skipping skill catalog build:', area);
      return;
    }
    
    // Handle object format with reps
    if (!area.reps || !Array.isArray(area.reps)) {
      console.warn('[Adapter] Focus area missing reps array:', area);
      return;
    }
    
    area.reps.forEach((rep, repIndex) => {
      skills.push({
        // Identifiers
        id: generateSkillId(area.name, repIndex),
        name: rep.rep,
        text: rep.rep,  // Alias for compatibility
        
        // Classification
        focusArea: area.name,
        dimension: area.name,
        category: area.name,
        
        // Related data
        courses: area.courses || [],
        description: area.whatGoodLooksLike || '',
        definition: area.whatGoodLooksLike || '',  // Alias
        why: area.why || '',
        
        // Progress
        phase: rep.week,
        weeksCompleted: parsePhaseToWeeks(rep.week),
        
        // Metadata
        tier: 'T1',  // Default tier (not in Firebase)
        tier_id: 'T1',  // Alias
        areaIndex,
        repIndex,
        
        // Source tracking
        _source: 'plan',
        _virtual: true
      });
    });
  });
  
  console.log('[Adapter] Built virtual skill catalog:', {
    count: skills.length,
    sample: skills[0]
  });
  
  return skills;
};

/**
 * Merge virtual catalog with actual SKILL_CATALOG if available
 */
export const mergeSkillCatalogs = (virtualCatalog, actualCatalog) => {
  if (!actualCatalog || actualCatalog.length === 0) {
    return virtualCatalog;
  }
  
  // Create map of actual skills by ID
  const actualMap = new Map(
    actualCatalog.map(skill => [skill.id, skill])
  );
  
  // Enhance virtual skills with actual data if available
  const merged = virtualCatalog.map(virtualSkill => {
    const actualSkill = actualMap.get(virtualSkill.id);
    
    if (actualSkill) {
      // Merge, preferring actual data
      return {
        ...virtualSkill,
        ...actualSkill,
        _hasActualData: true
      };
    }
    
    return virtualSkill;
  });
  
  console.log('[Adapter] Merged catalogs:', {
    virtual: virtualCatalog.length,
    actual: actualCatalog.length,
    merged: merged.length
  });
  
  return merged;
};

/* =========================================================
   ASSESSMENT UTILITIES
========================================================= */

/**
 * Use pre-calculated scores from Firebase assessment if available
 * Otherwise fall back to calculating from answers
 */
export const getAssessmentScores = (assessment, calculateFallback) => {
  // Check if Firebase has pre-calculated scores
  if (assessment.scores && Object.keys(assessment.scores).length > 0) {
    console.log('[Adapter] Using pre-calculated scores from Firebase');
    
    // Convert Firebase scores format to simple map
    return Object.fromEntries(
      Object.entries(assessment.scores).map(([key, val]) => [
        key,
        typeof val === 'object' ? val.score : val
      ])
    );
  }
  
  // Fallback to calculation
  if (calculateFallback && (assessment.responses || assessment.answers)) {
    console.log('[Adapter] Calculating scores from responses');
    const responses = assessment.responses || assessment.answers;
    return calculateFallback(responses);
  }
  
  console.warn('[Adapter] No scores available and no fallback calculation');
  return {};
};

/**
 * Get assessment status labels from Firebase scores
 */
export const getAssessmentStatusLabels = (assessment) => {
  if (!assessment.scores) return {};
  
  return Object.fromEntries(
    Object.entries(assessment.scores)
      .filter(([, val]) => typeof val === 'object' && val.status)
      .map(([key, val]) => [key, val.status])
  );
};

/* =========================================================
   PROGRESS UTILITIES
========================================================= */

/**
 * Calculate overall plan progress from focusAreas
 */
export const calculatePlanProgressFromFocusAreas = (focusAreas) => {
  if (!focusAreas || focusAreas.length === 0) return 0;
  
  let totalPhases = 0;
  let completedPhases = 0;
  
  focusAreas.forEach(area => {
    area.reps?.forEach(rep => {
      totalPhases++;
      const progress = calculatePhaseProgress(rep.week);
      completedPhases += progress / 100;
    });
  });
  
  return totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
};

/* =========================================================
   BATCH ADAPTATION UTILITIES
========================================================= */

/**
 * Adapt entire development plan data object (with history)
 */
export const adaptDevelopmentPlanData = (firebaseData) => {
  if (!firebaseData) return null;
  
  console.log('[Adapter] Adapting full development plan data');
  
  return {
    ...firebaseData,
    
    // Adapt current plan
    currentPlan: firebaseData.currentPlan 
      ? adaptFirebasePlanToComponents(firebaseData.currentPlan)
      : null,
    
    // Adapt assessment history
    assessmentHistory: firebaseData.assessmentHistory?.map(
      assessment => adaptFirebaseAssessmentToComponents(assessment)
    ) || [],
    
    // Adapt plan history (previousPlans is the correct field name in Firebase)
    previousPlans: firebaseData.previousPlans?.map(
      plan => adaptFirebasePlanToComponents(plan)
    ) || [],
    
    // Keep planHistory for backward compatibility if it exists
    planHistory: firebaseData.planHistory?.map(
      plan => adaptFirebasePlanToComponents(plan)
    ) || [],
    
    _fullyAdapted: true
  };
};

/* =========================================================
   VALIDATION UTILITIES
========================================================= */

/**
 * Check if data has been adapted
 */
export const isAdapted = (data) => {
  return data?._adapted === true || data?._fullyAdapted === true;
};

/**
 * Validate adapted plan structure
 */
export const validateAdaptedPlan = (plan) => {
  const errors = [];
  
  if (!plan) {
    errors.push('Plan is null or undefined');
    return { isValid: false, errors };
  }
  
  if (!plan.coreReps && !plan.focusAreas) {
    errors.push('Plan has neither coreReps nor focusAreas');
  }
  
  if (plan.coreReps && plan.coreReps.length === 0) {
    errors.push('Plan has empty coreReps array');
  }
  
  if (plan.focusAreas && plan.focusAreas.length === 0) {
    errors.push('Plan has empty focusAreas array');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    hasCoreReps: !!plan.coreReps,
    hasFocusAreas: !!plan.focusAreas,
    isAdapted: isAdapted(plan)
  };
};

/* =========================================================
   EXPORTS
========================================================= */

export default {
  // Core adapters
  adaptFirebasePlanToComponents,
  adaptFirebaseAssessmentToComponents,
  adaptComponentPlanToFirebase,
  adaptDevelopmentPlanData,
  
  // Phase utilities
  parsePhaseToWeeks,
  weeksToPhase,
  calculatePhaseProgress,
  getNextPhase,
  getPreviousPhase,
  
  // Skill catalog
  generateSkillId,
  buildVirtualSkillCatalog,
  mergeSkillCatalogs,
  
  // Assessment
  getAssessmentScores,
  getAssessmentStatusLabels,
  
  // Progress
  calculatePlanProgressFromFocusAreas,
  
  // Validation
  isAdapted,
  validateAdaptedPlan
};
