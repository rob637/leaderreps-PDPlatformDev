// src/components/screens/developmentplan/devPlanUtils.jsx
// Utility functions and constants for Development Plan
// CRITICAL FIX: Updated generatePlanFromAssessment to use 'answers: responses'

import { timeService } from '../../../services/timeService';

/* =========================================================
   ASSESSMENT QUESTIONS (v2 — 15 questions)
========================================================= */
export const ASSESSMENT_QUESTIONS = [
  // Frequency scale (Q1-Q10)
  { id: 'q1', text: 'I clearly defined the criteria for success when I assigned work.', type: 'frequency', category: 'Clarity' },
  { id: 'q2', text: 'I explicitly named ownership of the outcome and confirmed that my direct accepted it.', type: 'frequency', category: 'Ownership' },
  { id: 'q3', text: 'I gave reinforcing (positive) feedback tied to a specific behavior and impact.', type: 'frequency', category: 'Feedback' },
  { id: 'q4', text: 'I gave redirecting (correcting) feedback when behavior missed the standard.', type: 'frequency', category: 'Feedback' },
  { id: 'q5', text: 'I followed up on work rather than assuming it was on track.', type: 'frequency', category: 'Follow-Through' },
  { id: 'q6', text: 'I modeled vulnerability by acknowledging a mistake, gap, or miss of my own.', type: 'frequency', category: 'Vulnerability' },
  { id: 'q7', text: 'I intentionally checked after giving feedback to confirm whether the behavior changed.', type: 'frequency', category: 'Follow-Through' },
  { id: 'q8', text: 'I noticed patterns early rather than waiting until issues escalated.', type: 'frequency', category: 'Awareness' },
  { id: 'q9', text: 'I asked my direct report for their plan when progress stalled or mistakes happened on their assigned work.', type: 'frequency', category: 'Ownership' },
  { id: 'q10', text: 'I adjusted my approach when I met resistance during feedback.', type: 'frequency', category: 'Adaptability' },
  // Agreement scale (Q11-Q13)
  { id: 'q11', text: 'I have a clear intention for how I want to show up when navigating a difficult leadership moment.', type: 'agreement', category: 'Intentionality' },
  { id: 'q12', text: 'I have practical tools to handle difficult conversations with my direct report(s).', type: 'agreement', category: 'Tools' },
  { id: 'q13', text: 'I hold regular one-on-ones with my direct report(s) and allow them to set the agenda.', type: 'agreement', category: 'Structure' },
  // Open text (Q14)
  { id: 'q14', text: 'What leadership situation is currently challenging or frustrating for you?', type: 'open-text', category: 'Reflection' },
  // Multi-select (Q15)
  { id: 'q15', text: 'Which important leadership moments do you tend to delay, soften, or avoid?', type: 'multi-select', category: 'Self-Awareness' },
];

// Only the scored (numeric) questions — used for plan generation
export const SCORED_QUESTION_IDS = ASSESSMENT_QUESTIONS.filter(q => q.type === 'frequency' || q.type === 'agreement').map(q => q.id);

export const OPEN_ENDED_QUESTION = {
  id: 'q14',
  text: 'What leadership situation is currently challenging or frustrating for you?',
  placeholder: 'Describe the situation...',
};

export const FREQUENCY_SCALE = [
  { value: 1, label: 'Never / Rarely' },
  { value: 2, label: 'Seldom / < 50%' },
  { value: 3, label: 'Often / > 50%' },
  { value: 4, label: 'Consistently / Always' },
];

export const AGREEMENT_SCALE = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Agree' },
  { value: 4, label: 'Strongly Agree' },
];

// Keep LIKERT_SCALE export for backward compatibility (maps to frequency scale)
export const LIKERT_SCALE = FREQUENCY_SCALE;

/* =========================================================
   SKILL CATEGORIES AND MAPPINGS
========================================================= */
export const SKILL_CATEGORIES = {
  CLARITY: 'Clarity & Expectations',
  FEEDBACK: 'Feedback & Coaching',
  ACCOUNTABILITY: 'Ownership & Accountability',
  FOLLOW_THROUGH: 'Follow-Through',
  SELF: 'Self-Awareness & Adaptability',
};

// Map assessment questions to skill categories
export const QUESTION_TO_CATEGORY = {
  q1: 'CLARITY',          // Criteria for success
  q2: 'ACCOUNTABILITY',   // Named ownership
  q3: 'FEEDBACK',         // Reinforcing feedback
  q4: 'FEEDBACK',         // Redirecting feedback
  q5: 'FOLLOW_THROUGH',   // Followed up on work
  q6: 'SELF',             // Modeled vulnerability
  q7: 'FOLLOW_THROUGH',   // Checked feedback changed behavior
  q8: 'SELF',             // Noticed patterns early
  q9: 'ACCOUNTABILITY',   // Asked for their plan
  q10: 'SELF',            // Adjusted approach on resistance
  q11: 'CLARITY',         // Intention for difficult moments
  q12: 'FEEDBACK',        // Practical tools for conversations
  q13: 'ACCOUNTABILITY',  // Regular one-on-ones
};

/* =========================================================
   MILESTONE CONFIGURATION
========================================================= */
export const MILESTONE_CONFIG = {
  PHASES: {
    FOUNDATION: { 
      name: 'Foundation', 
      weeks: [1, 2, 3, 4], 
      color: 'var(--corporate-teal)', // TEAL
      description: 'Building core habits and understanding'
    },
    DEVELOPMENT: { 
      name: 'Development', 
      weeks: [5, 6, 7, 8], 
      color: 'var(--corporate-orange)', // ORANGE
      description: 'Expanding skills and consistent practice'
    },
    MASTERY: { 
      name: 'Mastery', 
      weeks: [9, 10, 11, 12], 
      color: 'var(--corporate-teal)', // GREEN (mapped to TEAL/Green hex)
      description: 'Integration and unconscious competence'
    },
  },
  // Lowercase alias for compatibility
  phases: [
    { 
      name: 'Foundation', 
      weeks: [1, 2, 3, 4], 
      color: 'var(--corporate-teal)', // TEAL
      description: 'Building core habits and understanding'
    },
    { 
      name: 'Development', 
      weeks: [5, 6, 7, 8], 
      color: 'var(--corporate-orange)', // ORANGE
      description: 'Expanding skills and consistent practice'
    },
    { 
      name: 'Mastery', 
      weeks: [9, 10, 11, 12], 
      color: 'var(--corporate-teal)', // GREEN
      description: 'Integration and unconscious competence'
    },
  ],
  WEEKS_PER_PHASE: 4,
  TOTAL_WEEKS: 12,
};

/**
 * Convert various date formats to a Date object
 * Handles: Firestore Timestamp, {seconds, nanoseconds} object, Date, string, number
 */
const normalizeToDate = (value) => {
  if (!value) return null;
  
  // Firestore Timestamp with toDate() method
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // Serialized Firestore Timestamp {seconds, nanoseconds}
  if (value.seconds !== undefined) {
    return new Date(value.seconds * 1000);
  }
  
  // Already a Date
  if (value instanceof Date) {
    return value;
  }
  
  // Number (timestamp in ms)
  if (typeof value === 'number') {
    return new Date(value);
  }
  
  // String (ISO or other date string)
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
};

/**
 * Get the current week number based on plan start date
 */
export const getCurrentWeek = (planOrStartDate) => {
  let rawStartDate;
  
  // Handle both plan object and direct startDate value
  if (typeof planOrStartDate === 'string' || typeof planOrStartDate === 'number') {
    rawStartDate = planOrStartDate;
  } else if (planOrStartDate?.seconds !== undefined) {
    // Direct Firestore Timestamp object
    rawStartDate = planOrStartDate;
  } else if (planOrStartDate?.startDate) {
    rawStartDate = planOrStartDate.startDate;
  } else {
    return 1;
  }
  
  const start = normalizeToDate(rawStartDate);
  if (!start) return 1;
  
  const today = timeService.getNow();
  const diffTime = today - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentWeek = Math.floor(diffDays / 7) + 1;
  
  return Math.max(1, Math.min(currentWeek, MILESTONE_CONFIG.TOTAL_WEEKS));
};

/**
 * Get the current phase based on week number
 * Returns phase object with name, color, description
 */
export const getCurrentPhase = (weekNumber) => {
  if (weekNumber <= 4) return MILESTONE_CONFIG.PHASES.FOUNDATION;
  if (weekNumber <= 8) return MILESTONE_CONFIG.PHASES.DEVELOPMENT;
  return MILESTONE_CONFIG.PHASES.MASTERY;
};

/* =========================================================
   PLAN GENERATION UTILITIES
========================================================= */

/**
 * Calculate category scores from assessment responses
 */
export const calculateCategoryScores = (responses) => {
  const categoryScores = {
    CLARITY: [],
    FEEDBACK: [],
    ACCOUNTABILITY: [],
    FOLLOW_THROUGH: [],
    SELF: [],
  };

  Object.entries(responses).forEach(([questionId, score]) => {
    const category = QUESTION_TO_CATEGORY[questionId];
    // Only include numeric scores (skip open-text q14 and multi-select q15)
    if (category && typeof score === 'number') {
      categoryScores[category].push(score);
    }
  });

  // Calculate averages
  const averages = {};
  Object.entries(categoryScores).forEach(([category, scores]) => {
    if (scores.length > 0) {
      averages[category] = scores.reduce((a, b) => a + b, 0) / scores.length;
    } else {
      averages[category] = 0;
    }
  });

  return averages;
};

/**
 * Identify focus areas based on lowest scores
 */
export const identifyFocusAreas = (categoryScores, limit = 3) => {
  const sortedCategories = Object.entries(categoryScores)
    .sort(([, scoreA], [, scoreB]) => scoreA - scoreB)
    .slice(0, limit)
    .map(([category]) => category);

  return sortedCategories;
};

/**
 * Get recommended skills from catalog based on category
 */
export const getRecommendedSkills = (category, skillCatalog, limit = 3) => {
  if (!skillCatalog || skillCatalog.length === 0) {
    return [];
  }

  const categorySkills = skillCatalog.filter(
    skill => skill.category === category || skill.categories?.includes(category)
  );

  // Sort by some criteria (priority, difficulty, etc.)
  const sortedSkills = categorySkills.sort((a, b) => {
    const priorityA = a.priority || 0;
    const priorityB = b.priority || 0;
    return priorityB - priorityA;
  });

  return sortedSkills.slice(0, limit);
};

/**
 * Generate a development plan from assessment results
 */
export const generatePlanFromAssessment = (assessment, skillCatalog = []) => {
  // 
  // === 🚨 CRITICAL FIX HERE ===
  // The assessment components (BaselineAssessment, ProgressScan) save data using the key 'answers'.
  // This line maps 'answers' from the assessment object to the 'responses' variable
  // that the rest of this function expects.
  //
  const { answers: responses, date } = assessment;

  // Calculate category scores
  const categoryScores = calculateCategoryScores(responses);

  // Identify top focus areas (lowest scores)
  const focusAreas = identifyFocusAreas(categoryScores, 3);

  // Generate skill recommendations for each focus area
  const skills = [];
  const coreReps = [];
  
  focusAreas.forEach((category) => {
    const recommendedSkills = getRecommendedSkills(category, skillCatalog, 2);
    recommendedSkills.forEach((_skill) => {
      skills.push({
  });
      
      coreReps.push({
  });
    });
  });

  // Create the development plan
  const plan = {
    id: `plan_${Date.now()}`,
    cycle: assessment.cycle || 1,
    startDate: date,
    endDate: calculateEndDate(date, 90), // 90-day cycle
    focusAreas: focusAreas.map(cat => SKILL_CATEGORIES[cat]),
    focusArea: focusAreas.map(cat => SKILL_CATEGORIES[cat]).join(', '),
    skills,
    coreReps,
    assessmentScores: categoryScores,
    status: 'active',
    createdAt: timeService.getISOString(),
  };

  return plan;
};

/**
 * Generate a summary of a development plan for display
 */
export const generatePlanSummary = (plan) => {
  if (!plan) {
    return {
      cycle: 1,
      focusArea: 'Not Set',
      startDate: timeService.getISOString(),
      totalReps: 0,
      currentWeek: 1,
      progress: 0,
      currentPhase: 'Foundation',
    };
  }

  const currentWeek = getCurrentWeek(plan.startDate);
  const currentPhase = getCurrentPhase(currentWeek);
  const totalReps = plan.coreReps?.length || plan.skills?.length || 0;
  
  // Calculate progress
  let progress = 0;
  if (plan.coreReps && plan.coreReps.length > 0) {
    const totalWeeks = plan.coreReps.length * 12;
    const completedWeeks = plan.coreReps.reduce((sum, rep) => sum + (rep.weeksCompleted || 0), 0);
    progress = Math.round((completedWeeks / totalWeeks) * 100);
  } else if (plan.skills && plan.skills.length > 0) {
    progress = calculatePlanProgress(plan);
  }

  return {
    cycle: plan.cycle || 1,
    focusArea: plan.focusArea || plan.focusAreas?.[0] || 'Leadership Development',
    startDate: plan.startDate,
    totalReps,
    currentWeek,
    progress,
    currentPhase: currentPhase.name,
  };
};

/**
 * Calculate end date from start date and duration in days
 */
export const calculateEndDate = (startDate, durationDays) => {
  const start = normalizeToDate(startDate) || new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + durationDays);
  return end.toISOString().split('T')[0];
};

/**
 * Calculate progress percentage for a skill
 */
export const calculateSkillProgress = (skill) => {
  if (!skill) return 0;
  
  // Check if using weeksCompleted (new format)
  if (skill.weeksCompleted !== undefined) {
    return Math.round((skill.weeksCompleted / 12) * 100);
  }
  
  // Check if using milestones (old format)
  if (!skill.milestones || skill.milestones.length === 0) {
    return 0;
  }

  const completedMilestones = skill.milestones.filter(m => m.completed).length;
  return Math.round((completedMilestones / skill.milestones.length) * 100);
};

/**
 * Calculate overall plan progress
 */
export const calculatePlanProgress = (plan) => {
  if (!plan) return 0;
  
  // Use coreReps if available (new format)
  if (plan.coreReps && plan.coreReps.length > 0) {
    const totalWeeks = plan.coreReps.length * 12;
    const completedWeeks = plan.coreReps.reduce((sum, rep) => sum + (rep.weeksCompleted || 0), 0);
    return Math.round((completedWeeks / totalWeeks) * 100);
  }
  
  // Fallback to skills (old format)
  if (!plan.skills || plan.skills.length === 0) {
    return 0;
  }

  const totalProgress = plan.skills.reduce((sum, skill) => {
    return sum + calculateSkillProgress(skill);
  }, 0);

  return Math.round(totalProgress / plan.skills.length);
};

/**
 * Get color for progress based on percentage
 */
export const getProgressColor = (percentage) => {
  if (percentage >= 75) return '#47A88D'; // GREEN
  if (percentage >= 50) return '#47A88D'; // TEAL
  if (percentage >= 25) return '#E04E1B'; // ORANGE
  return '#E04E1B'; // RED
};

/**
 * Format date for display (MM/DD/YYYY)
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

/**
 * Calculate days remaining in plan
 */
export const calculateDaysRemaining = (endDate) => {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const today = timeService.getNow();
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

/**
 * Get status badge variant based on progress
 */
export const getStatusVariant = (status) => {
  switch (status) {
    case 'active':
      return 'success';
    case 'completed':
      return 'primary';
    case 'paused':
      return 'warning';
    case 'archived':
      return 'default';
    default:
      return 'default';
  }
};

/**
 * Validate assessment responses
 */
export const validateAssessment = (responses) => {
  const missingQuestions = [];

  ASSESSMENT_QUESTIONS.forEach(q => {
    const val = responses[q.id];
    if (q.type === 'open-text') {
      if (!val || (typeof val === 'string' && val.trim() === '')) missingQuestions.push(q.id);
    } else if (q.type === 'multi-select') {
      if (!val || (Array.isArray(val) && val.length === 0)) missingQuestions.push(q.id);
    } else {
      if (val === undefined || val === null) missingQuestions.push(q.id);
    }
  });

  return {
    isValid: missingQuestions.length === 0,
    missingQuestions,
  };
};

/**
 * Generate a summary of assessment results
 */
export const generateAssessmentSummary = (responses) => {
  // Filter to only numeric (scored) responses for category analysis
  const numericResponses = Object.fromEntries(
    Object.entries(responses).filter(([, v]) => typeof v === 'number')
  );

  const categoryScores = calculateCategoryScores(numericResponses);
  const focusAreas = identifyFocusAreas(categoryScores, 3);

  const numericValues = Object.values(numericResponses);
  const averageScore = numericValues.length > 0
    ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
    : 0;

  return {
    averageScore: averageScore.toFixed(1),
    categoryScores,
    focusAreas: focusAreas.map(cat => SKILL_CATEGORIES[cat]),
    strengths: Object.entries(categoryScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([cat]) => SKILL_CATEGORIES[cat]),
  };
};

export default {
  ASSESSMENT_QUESTIONS,
  SCORED_QUESTION_IDS,
  OPEN_ENDED_QUESTION,
  FREQUENCY_SCALE,
  AGREEMENT_SCALE,
  LIKERT_SCALE,
  SKILL_CATEGORIES,
  QUESTION_TO_CATEGORY,
  MILESTONE_CONFIG,
  calculateCategoryScores,
  identifyFocusAreas,
  getRecommendedSkills,
  generatePlanFromAssessment,
  generatePlanSummary,
  calculateSkillProgress,
  calculatePlanProgress,
  getProgressColor,
  formatDate,
  calculateDaysRemaining,
  getStatusVariant,
  validateAssessment,
  generateAssessmentSummary,
  getCurrentWeek,
  getCurrentPhase,
  calculateEndDate,
  normalizeSkillCatalog,
  normalizeSkillFields,
};


/**
 * Normalize skill catalog shape from metadata
 * Supports: array of skills OR {items:[...]} under SKILL_CATALOG
 */
export const normalizeSkillCatalog = (globalMetadata) => {
  return (globalMetadata?.SKILL_CATALOG?.items
    || globalMetadata?.SKILL_CATALOG
    || globalMetadata?.config?.catalog?.SKILL_CATALOG?.items
    || globalMetadata?.config?.catalog?.SKILL_CATALOG
    || []);
};

/**
 * Normalize skill field names to handle different Firebase structures
 * Similar to REP_LIBRARY field mapping (text/name, definition/description, etc.)
 */
export const normalizeSkillFields = (skill) => {
  if (!skill) return null;
  
  // Create normalized skill object handling multiple field name patterns
  return {
    // Core fields with fallbacks
    id: skill.id,
    name: skill.text || skill.name || skill.title || 'Unknown Skill',
    description: skill.definition || skill.description || skill.desc || '',
    tier: skill.tier_id || skill.tier || 'T1',
    category: skill.category || 'General',
    dimension: skill.dimension || skill.category || 'General',
    
    // Additional fields (pass through if present)
    priority: skill.priority,
    targetLevel: skill.targetLevel,
    currentLevel: skill.currentLevel,
    milestones: skill.milestones || [],
    resources: skill.resources || [],
    categories: skill.categories || [],
    
    // Keep original for reference
    _original: skill
  };
};