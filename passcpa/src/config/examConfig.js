// CPA Exam Configuration
// Defines the exam structure, sections, and related constants

export const CPA_SECTIONS = {
  // Core Sections (required)
  AUD: {
    id: 'AUD',
    name: 'Auditing and Attestation',
    shortName: 'AUD',
    type: 'core',
    examLength: 4, // hours
    questionTypes: { mcq: 78, sims: 7 },
    color: '#3b82f6', // blue
    icon: 'Search',
    description: 'Ethics, risk assessment, audit procedures, and reporting',
  },
  FAR: {
    id: 'FAR',
    name: 'Financial Accounting and Reporting',
    shortName: 'FAR',
    type: 'core',
    examLength: 4,
    questionTypes: { mcq: 50, sims: 7 },
    color: '#22c55e', // green
    icon: 'Calculator',
    description: 'GAAP, financial statements, and specialized accounting',
  },
  REG: {
    id: 'REG',
    name: 'Taxation and Regulation',
    shortName: 'REG',
    type: 'core',
    examLength: 4,
    questionTypes: { mcq: 72, sims: 8 },
    color: '#f59e0b', // amber
    icon: 'Scale',
    description: 'Federal taxation, ethics, and business law',
  },
  
  // Discipline Sections (choose one)
  BAR: {
    id: 'BAR',
    name: 'Business Analysis and Reporting',
    shortName: 'BAR',
    type: 'discipline',
    examLength: 4,
    questionTypes: { mcq: 50, sims: 7 },
    color: '#8b5cf6', // violet
    icon: 'TrendingUp',
    description: 'Financial analysis, budgeting, and advanced accounting',
  },
  ISC: {
    id: 'ISC',
    name: 'Information Systems and Controls',
    shortName: 'ISC',
    type: 'discipline',
    examLength: 4,
    questionTypes: { mcq: 82, sims: 6 },
    color: '#06b6d4', // cyan
    icon: 'Shield',
    description: 'IT governance, security, and SOC engagements',
  },
  TCP: {
    id: 'TCP',
    name: 'Tax Compliance and Planning',
    shortName: 'TCP',
    type: 'discipline',
    examLength: 4,
    questionTypes: { mcq: 68, sims: 7 },
    color: '#ec4899', // pink
    icon: 'FileText',
    description: 'Advanced tax planning and compliance',
  },
};

export const CORE_SECTIONS = ['AUD', 'FAR', 'REG'];
export const DISCIPLINE_SECTIONS = ['BAR', 'ISC', 'TCP'];

// Point values for activities
export const POINT_VALUES = {
  mcq_easy: 1,
  mcq_medium: 1,
  mcq_hard: 1,
  lesson_short: 10,    // < 30 min
  lesson_medium: 15,   // 30-60 min
  lesson_long: 20,     // > 60 min
  simulation: 10,
  review_weak_area: 1.5, // multiplier
};

// Default daily goals by study intensity
export const DAILY_GOAL_PRESETS = {
  light: { points: 30, hours: 1, description: 'Light study pace' },
  moderate: { points: 50, hours: 2, description: 'Moderate study pace' },
  intensive: { points: 80, hours: 3, description: 'Intensive study pace' },
  aggressive: { points: 120, hours: 4, description: 'Aggressive study pace' },
};

// Question difficulty levels
export const DIFFICULTY_LEVELS = {
  easy: { label: 'Easy', value: 'easy', color: 'green', weight: 0.3 },
  medium: { label: 'Medium', value: 'medium', color: 'amber', weight: 0.5 },
  hard: { label: 'Hard', value: 'hard', color: 'red', weight: 0.2 },
};

// Study plan templates (weeks based on section)
export const STUDY_PLAN_TEMPLATES = {
  REG_8_WEEK: {
    id: 'REG_8_WEEK',
    section: 'REG',
    name: '8-Week REG Plan',
    weeks: 8,
    hoursPerWeek: 20,
    description: 'Standard 8-week preparation for REG',
  },
  REG_12_WEEK: {
    id: 'REG_12_WEEK',
    section: 'REG',
    name: '12-Week REG Plan',
    weeks: 12,
    hoursPerWeek: 15,
    description: 'Comfortable 12-week preparation for REG',
  },
  FAR_10_WEEK: {
    id: 'FAR_10_WEEK',
    section: 'FAR',
    name: '10-Week FAR Plan',
    weeks: 10,
    hoursPerWeek: 20,
    description: 'Standard preparation for the largest section',
  },
  AUD_8_WEEK: {
    id: 'AUD_8_WEEK',
    section: 'AUD',
    name: '8-Week AUD Plan',
    weeks: 8,
    hoursPerWeek: 18,
    description: 'Standard 8-week preparation for AUD',
  },
};

// Passing score
export const PASSING_SCORE = 75;

// Score interpretation
export const SCORE_RANGES = {
  failing: { min: 0, max: 74, label: 'Needs Improvement', color: 'red' },
  passing: { min: 75, max: 84, label: 'Passing', color: 'green' },
  strong: { min: 85, max: 94, label: 'Strong', color: 'blue' },
  excellent: { min: 95, max: 100, label: 'Excellent', color: 'purple' },
};
