// src/services/mockData.js
//
// NOTE: Content data (readings, videos, courses) has been migrated to Firestore CMS collections:
// - content_readings: Load via contentService.getReadings()
// - content_videos: Load via contentService.getVideos()
// - content_courses: Load via contentService.getCourses()
//
// Mock data below is only for fallback/development purposes and should remain minimal.

export const MOCK_DEVELOPMENT_PLAN_DATA = {
  currentPlan: null,
  assessmentHistory: [],
  planHistory: [],
  currentCycle: 1,
};

export const MOCK_DAILY_PRACTICE_DATA = {
  lastUpdated: new Date().toISOString().split('T')[0],
  dailyTargetRepId: null,
  dailyTargetRepStatus: 'Pending',
  dailyTargetRepDate: null,
  activeCommitments: [],
  completedRepsToday: [],
  identityAnchor: '',
  habitAnchor: '',
  whyStatement: '',
  streakCount: 0,
  streakCoins: 0,
};

export const MOCK_STRATEGIC_CONTENT_DATA = {
  vision: '',
  mission: '',
  values: [],
  goals: [],
  purpose: '',
};

export const MOCK_MEMBERSHIP_DATA = {
    status: 'Active',
    currentPlanId: 'free',
    nextBillingDate: null,
    paymentHistory: [],
    notifications: [
        { id: 'welcome', message: 'Welcome to LeaderReps! All features are available to you.', type: 'info', isRead: false }
    ],
};

export const MOCK_FEATURE_FLAGS = { 
  // ALL FEATURES ENABLED - Single free tier with full access
  enableDevPlan: true,
  enableDailyPractice: true,
  enableMembershipModule: false, // Disabled - no paid tiers
  
  // All content features enabled for everyone
  enableReadings: true,
  enableCourses: true,
  enableLabs: true,
  enableVideos: true,
  enableCommunity: true,
  
  // Developer features
  enableLabsAdvanced: true,
  enablePlanningHub: true,
  enableRoiReport: true,
  enableQuickStart: true,
  
  // LEGACY/OTHER
  enableNewFeature: false 
};

// Single free plan - no paid tiers
export const MOCK_MEMBERSHIP_PLANS = {
    items: [
        { 
            id: 'free', 
            name: 'LeaderReps', 
            price: 0, 
            recurrence: 'Free', 
            features: [
                'Dashboard & Daily Practice', 
                'All Leadership Reps',
                'Full Reading & Video Catalog',
                'Business Readings',
                'AI Coaching Lab',
                'Community Access',
                'Progress Tracking'
            ], 
            tier_id: 'free' 
        }
    ],
};

export const MOCK_REP_LIBRARY = [];
export const MOCK_EXERCISE_LIBRARY = [];
export const MOCK_WORKOUT_LIBRARY = [];

// Content catalogs - now loaded from Firestore CMS
export const MOCK_COURSE_LIBRARY = {
  items: []
};

export const MOCK_SKILL_CATALOG = [];
export const MOCK_IDENTITY_ANCHOR_CATALOG = [];
export const MOCK_HABIT_ANCHOR_CATALOG = [];
export const MOCK_WHY_CATALOG = [];

export const MOCK_READING_CATALOG = {
  items: {},
  categories: [],
  totalBooks: 0
};

export const MOCK_VIDEO_CATALOG = [];

export const MOCK_SCENARIO_CATALOG = [];

// Single tier - all users get full access
export const LEADERSHIP_TIERS_FALLBACK = {
  items: [
    { id: 'free', name: 'LeaderReps', access: 'Full access to all features' }
  ]
};

// Central export object
export const MOCK_GLOBAL_METADATA = {
  REP_LIBRARY: MOCK_REP_LIBRARY,
  EXERCISE_LIBRARY: MOCK_EXERCISE_LIBRARY,
  WORKOUT_LIBRARY: MOCK_WORKOUT_LIBRARY,
  COURSE_LIBRARY: MOCK_COURSE_LIBRARY,
  SKILL_CATALOG: MOCK_SKILL_CATALOG,
  IDENTITY_ANCHOR_CATALOG: MOCK_IDENTITY_ANCHOR_CATALOG,
  HABIT_ANCHOR_CATALOG: MOCK_HABIT_ANCHOR_CATALOG,
  WHY_CATALOG: MOCK_WHY_CATALOG,
  READING_CATALOG: MOCK_READING_CATALOG,
  VIDEO_CATALOG: MOCK_VIDEO_CATALOG,
  SCENARIO_CATALOG: MOCK_SCENARIO_CATALOG,
  LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK
};
