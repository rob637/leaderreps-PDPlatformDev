// src/services/debriefService.js
// System Debrief Service for the Conditioning Loop
// Provides automated but personal coaching feedback
// Scoring (what went well, what didn't) with coaching questions vs corrections

import { 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { repTypeService } from './repTypeService';

// ============================================
// DEBRIEF ASSESSMENT LEVELS
// ============================================
const ASSESSMENT_LEVELS = {
  EXEMPLARY: 'exemplary',
  SOLID: 'solid', 
  DEVELOPING: 'developing',
  NEEDS_WORK: 'needs_work'
};

const ASSESSMENT_CONFIG = {
  [ASSESSMENT_LEVELS.EXEMPLARY]: {
    label: 'Exemplary',
    color: 'emerald',
    emoji: '🌟',
    description: 'This was a standout execution'
  },
  [ASSESSMENT_LEVELS.SOLID]: {
    label: 'Solid',
    color: 'green',
    emoji: '✅',
    description: 'Good work, keep building on this'
  },
  [ASSESSMENT_LEVELS.DEVELOPING]: {
    label: 'Developing',
    color: 'amber',
    emoji: '📈',
    description: 'Making progress, here\'s how to level up'
  },
  [ASSESSMENT_LEVELS.NEEDS_WORK]: {
    label: 'Needs Work',
    color: 'orange',
    emoji: '💪',
    description: 'Every rep counts - here\'s what to focus on next time'
  }
};

// ============================================
// SYSTEM DEBRIEF EVALUATION
// ============================================

/**
 * Evaluate rep execution against debrief standards
 * Returns coaching-focused feedback, not corrections
 * 
 * @param {Object} params
 * @param {Object} params.db - Firestore instance
 * @param {string} params.repTypeId - The rep type ID
 * @param {Object} params.evidence - Evidence captured from the rep
 * @returns {Promise<Object>} Debrief assessment
 */
export const evaluateRepDebrief = async ({ db, repTypeId, evidence }) => {
  if (!db || !repTypeId || !evidence) {
    console.warn('[debriefService] Missing required params for evaluation');
    return createDefaultDebrief('Unable to evaluate - missing information');
  }

  try {
    // Get debrief standards for this rep type
    const standards = await repTypeService.getDebriefStandardsForRepType(db, repTypeId);
    
    if (!standards) {
      console.log(`[debriefService] No debrief standards found for ${repTypeId}, using defaults`);
      return createGenericDebrief(evidence);
    }

    // Evaluate against standards
    const assessment = assessAgainstStandards(evidence, standards);
    
    // Generate coaching questions (not corrections)
    const coachingQuestions = generateCoachingQuestions(assessment, standards);
    
    // Build the debrief result
    return {
      level: assessment.level,
      config: ASSESSMENT_CONFIG[assessment.level],
      scores: assessment.scores,
      whatWentWell: assessment.whatWentWell,
      areasForGrowth: assessment.areasForGrowth,
      coachingQuestions,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[debriefService] Error evaluating debrief:', error);
    return createDefaultDebrief('Evaluation error occurred');
  }
};

/**
 * Assess evidence against standards
 * @private
 */
const assessAgainstStandards = (evidence, standards) => {
  const scores = {};
  const whatWentWell = [];
  const areasForGrowth = [];
  
  // Check each dimension in the standards
  const dimensions = standards.dimensions || [];
  let totalScore = 0;
  let dimensionCount = 0;
  
  dimensions.forEach(dimension => {
    const evidenceValue = getEvidenceForDimension(evidence, dimension.key);
    const score = scoreDimension(evidenceValue);
    
    scores[dimension.key] = {
      dimension: dimension.label,
      score,
      maxScore: 4,
      evidenceValue
    };
    
    totalScore += score;
    dimensionCount++;
    
    // Categorize feedback
    if (score >= 3) {
      whatWentWell.push(dimension.successMessage || `Strong ${dimension.label}`);
    } else if (score <= 2 && dimension.growthMessage) {
      areasForGrowth.push(dimension.growthMessage);
    }
  });
  
  // Calculate overall level
  const avgScore = dimensionCount > 0 ? totalScore / dimensionCount : 2;
  let level;
  
  if (avgScore >= 3.5) level = ASSESSMENT_LEVELS.EXEMPLARY;
  else if (avgScore >= 2.5) level = ASSESSMENT_LEVELS.SOLID;
  else if (avgScore >= 1.5) level = ASSESSMENT_LEVELS.DEVELOPING;
  else level = ASSESSMENT_LEVELS.NEEDS_WORK;
  
  return { level, scores, whatWentWell, areasForGrowth, avgScore };
};

/**
 * Get evidence value for a specific dimension
 * @private
 */
const getEvidenceForDimension = (evidence, dimensionKey) => {
  // Map dimension keys to evidence fields
  const mappings = {
    clarity: evidence?.whatYouSaid || evidence?.action,
    response: evidence?.theirResponse || evidence?.response,
    dynamics: evidence?.groupDynamics || evidence?.dynamics,
    outcome: evidence?.outcome,
    impact: evidence?.noticeableChange || evidence?.impact,
    followup: evidence?.nextStep || evidence?.followUp
  };
  
  return mappings[dimensionKey] || evidence?.[dimensionKey] || null;
};

/**
 * Score a single dimension
 * @private
 */
const scoreDimension = (evidenceValue) => {
  if (!evidenceValue) return 1;
  
  const length = typeof evidenceValue === 'string' ? evidenceValue.length : 0;
  
  // Basic scoring based on evidence completeness
  // More sophisticated scoring would use AI/NLP
  if (length > 100) return 4;
  if (length > 50) return 3;
  if (length > 20) return 2;
  return 1;
};

/**
 * Generate coaching questions based on assessment
 * These are growth-focused, not corrective
 * @private
 */
const generateCoachingQuestions = (assessment, standards) => {
  const questions = [];
  
  // Get standard coaching questions for the level
  const levelQuestions = standards.coachingQuestions?.[assessment.level] || [];
  questions.push(...levelQuestions);
  
  // Add dimension-specific coaching if needed
  if (assessment.areasForGrowth.length > 0 && standards.growthQuestions) {
    const growthQ = standards.growthQuestions[0];
    if (growthQ) questions.push(growthQ);
  }
  
  // Always include a forward-focused question
  if (standards.forwardQuestion) {
    questions.push(standards.forwardQuestion);
  } else {
    questions.push('What will you do differently next time?');
  }
  
  // Limit to 2 coaching questions max
  return questions.slice(0, 2);
};

/**
 * Create default debrief when standards unavailable
 * @private
 */
const createDefaultDebrief = (reason) => ({
  level: ASSESSMENT_LEVELS.SOLID,
  config: ASSESSMENT_CONFIG[ASSESSMENT_LEVELS.SOLID],
  scores: {},
  whatWentWell: ['You completed the rep'],
  areasForGrowth: [],
  coachingQuestions: ['What did you learn from this experience?'],
  note: reason,
  timestamp: new Date().toISOString()
});

/**
 * Create generic debrief based on evidence alone
 * @private
 */
const createGenericDebrief = (evidence) => {
  const hasDetailedEvidence = (evidence?.whatYouSaid?.length || 0) > 50;
  const level = hasDetailedEvidence ? ASSESSMENT_LEVELS.SOLID : ASSESSMENT_LEVELS.DEVELOPING;
  
  return {
    level,
    config: ASSESSMENT_CONFIG[level],
    scores: {},
    whatWentWell: hasDetailedEvidence 
      ? ['You captured detailed evidence', 'Good self-reflection']
      : ['You completed the rep'],
    areasForGrowth: hasDetailedEvidence 
      ? [] 
      : ['Capture more detail about what you said/did'],
    coachingQuestions: [
      'How did this rep help you grow as a leader?',
      'What will you do differently next time?'
    ],
    timestamp: new Date().toISOString()
  };
};

// ============================================
// SAVE DEBRIEF RESULTS
// ============================================

/**
 * Save debrief results to a rep record
 * @param {Object} params
 * @param {Object} params.db - Firestore instance
 * @param {string} params.userId - User ID
 * @param {string} params.repId - Rep ID
 * @param {Object} params.debrief - Debrief assessment results
 */
export const saveDebriefResults = async ({ db, userId, repId, debrief }) => {
  if (!db || !userId || !repId || !debrief) {
    throw new Error('Missing required params for saving debrief');
  }
  
  const repRef = doc(db, 'users', userId, 'conditioning_reps', repId);
  
  await updateDoc(repRef, {
    debrief,
    debriefedAt: serverTimestamp(),
    status: 'debriefed',
    updatedAt: serverTimestamp()
  });
  
  console.log(`[debriefService] Saved debrief for rep ${repId}`);
};

// ============================================
// EXPORTS
// ============================================

export const debriefService = {
  evaluateRepDebrief,
  saveDebriefResults,
  ASSESSMENT_LEVELS,
  ASSESSMENT_CONFIG
};

export default debriefService;
