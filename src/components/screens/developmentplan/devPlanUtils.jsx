// src/components/screens/developmentplan/devPlanUtils.jsx
// Utility functions and constants for Development Plan
// CRITICAL FIX: Updated generatePlanFromAssessment to use 'answers: responses'

/* =========================================================
   ASSESSMENT QUESTIONS
========================================================= */
export const ASSESSMENT_QUESTIONS = [
  { id: 'q1', text: 'I clearly communicate priorities and ensure my team understands how their work connects to broader goals.' },
  { id: 'q2', text: 'I consistently provide actionable feedback that helps my team members grow and improve.' },
  { id: 'q3', text: 'I create opportunities for team members to develop new skills and take on stretch assignments.' },
  { id: 'q4', text: 'I actively seek diverse perspectives and encourage open dialogue, even when opinions differ from mine.' },
  { id: 'q5', text: 'I effectively manage my time and energy to balance strategic thinking with day-to-day execution.' },
  { id: 'q6', text: 'I build strong relationships across the organization to advance team goals and remove barriers.' },
  { id: 'q7', text: 'Decisions on my team are made efficiently, with the right people involved and clear follow-through.' },
  { id: 'q8', text: 'I intentionally model openness and vulnerability to build trust within my team.' },
  { id: 'q9', text: 'My team handles conflict directly and constructively, even when it is uncomfortable.' },
  { id: 'q10', text: 'I frequently recognize and celebrate progress and contributions in meaningful ways.' },
];

export const OPEN_ENDED_QUESTION = {
  id: 'goals',
  text: 'What are your top 1-3 leadership development goals for the next 90 days?',
  placeholder: 'Example: Improve my ability to delegate effectively, Build stronger cross-functional relationships, Develop more strategic thinking habits...',
};

export const LIKERT_SCALE = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

/* =========================================================
   SKILL CATEGORIES AND MAPPINGS
========================================================= */
export const SKILL_CATEGORIES = {
  STRATEGIC: 'Strategic Leadership',
  PEOPLE: 'People Development',
  EXECUTION: 'Execution Excellence',
  INFLUENCE: 'Influence & Communication',
  SELF: 'Self-Management',
};

// Map assessment questions to skill categories
export const QUESTION_TO_CATEGORY = {
  q1: 'STRATEGIC',
  q2: 'PEOPLE',
  q3: 'PEOPLE',
  q4: 'INFLUENCE',
  q5: 'SELF',
  q6: 'INFLUENCE',
  q7: 'EXECUTION',
  q8: 'INFLUENCE',
  q9: 'PEOPLE',
  q10: 'PEOPLE',
};

/* =========================================================
   MILESTONE CONFIGURATION
========================================================= */
export const MILESTONE_CONFIG = {
  PHASES: {
    FOUNDATION: { 
      name: 'Foundation', 
      weeks: [1, 2, 3, 4], 
      color: '#47A88D', // TEAL
      description: 'Building core habits and understanding'
    },
    DEVELOPMENT: { 
      name: 'Development', 
      weeks: [5, 6, 7, 8], 
      color: '#E04E1B', // ORANGE
      description: 'Expanding skills and consistent practice'
    },
    MASTERY: { 
      name: 'Mastery', 
      weeks: [9, 10, 11, 12], 
      color: '#47A88D', // GREEN (mapped to TEAL/Green hex)
      description: 'Integration and unconscious competence'
    },
  },
  // Lowercase alias for compatibility
  phases: [
    { 
      name: 'Foundation', 
      weeks: [1, 2, 3, 4], 
      color: '#47A88D', // TEAL
      description: 'Building core habits and understanding'
    },
    { 
      name: 'Development', 
      weeks: [5, 6, 7, 8], 
      color: '#E04E1B', // ORANGE
      description: 'Expanding skills and consistent practice'
    },
    { 
      name: 'Mastery', 
      weeks: [9, 10, 11, 12], 
      color: '#47A88D', // GREEN
      description: 'Integration and unconscious competence'
    },
  ],
  WEEKS_PER_PHASE: 4,
  TOTAL_WEEKS: 12,
};

/**
 * Get the current week number based on plan start date
 */
export const getCurrentWeek = (planOrStartDate) => {
  let startDate;
  
  // Handle both plan object and direct startDate string
  if (typeof planOrStartDate === 'string') {
    startDate = planOrStartDate;
  } else if (planOrStartDate?.startDate) {
    startDate = planOrStartDate.startDate;
  } else {
    return 1;
  }
  
  if (!startDate) return 1;
  
  const start = new Date(startDate);
  const today = new Date();
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
    STRATEGIC: [],
    PEOPLE: [],
    EXECUTION: [],
    INFLUENCE: [],
    SELF: [],
  };

  Object.entries(responses).forEach(([questionId, score]) => {
    const category = QUESTION_TO_CATEGORY[questionId];
    if (category) {
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
    recommendedSkills.forEach((skill) => {
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
    createdAt: new Date().toISOString(),
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
      startDate: new Date().toISOString(),
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
  const start = new Date(startDate);
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
 * Format date for display
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
  });
};

/**
 * Calculate days remaining in plan
 */
export const calculateDaysRemaining = (endDate) => {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const today = new Date();
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
  const questionIds = ASSESSMENT_QUESTIONS.map(q => q.id);
  const missingQuestions = questionIds.filter(id => !responses[id]);
  
  return {
    isValid: missingQuestions.length === 0,
    missingQuestions,
  };
};

/**
 * Generate a summary of assessment results
 */
export const generateAssessmentSummary = (responses) => {
  const categoryScores = calculateCategoryScores(responses);
  const focusAreas = identifyFocusAreas(categoryScores, 3);
  
  const averageScore = Object.values(responses).reduce((a, b) => a + b, 0) / Object.values(responses).length;
  
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
  OPEN_ENDED_QUESTION,
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