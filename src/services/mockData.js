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
    status: 'Trial',
    currentPlanId: 'trial',
    nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentHistory: [],
    notifications: [
        { id: 'welcome', message: 'Welcome to your 7-day free trial! Upgrade now to maintain access.', type: 'warning', isRead: false }
    ],
};

export const MOCK_FEATURE_FLAGS = { 
  // V1 CORE FEATURES (ENABLED)
  enableDevPlan: true,
  enableDailyPractice: true,
  enableMembershipModule: true,
  
  // TIER-GATED FEATURES (ENABLED - Access controlled by tier)
  enableReadings: true,       // Professional Reading Hub - Pro+
  enableCourses: true,        // Course Library - Pro+
  enableLabs: true,           // AI Coaching Lab - Pro+
  enableVideos: true,         // Leadership Videos - Pro+
  enableCommunity: true,      // Community features - Pro+
  
  // DEVELOPER/ELITE FEATURES (ENABLED - Dev mode or Elite tier)
  enableLabsAdvanced: true,   // Advanced Lab features
  enablePlanningHub: true,    // Strategic Tools - Dev only
  enableRoiReport: true,      // Executive ROI Report - Dev only
  enableQuickStart: true,     // Keep QuickStart for onboarding
  
  // LEGACY/OTHER
  enableNewFeature: false 
};

export const MOCK_MEMBERSHIP_PLANS = {
    items: [
        { 
            id: 'basic', 
            name: 'Base', 
            price: 29, 
            recurrence: 'Monthly', 
            features: [
                'Dashboard & Daily Practice', 
                'All Leadership Reps',
                'Workouts & Challenges',
                'Basic Reading Catalog',
                'Progress Tracking'
            ], 
            tier_id: 'T1' 
        },
        { 
            id: 'professional', 
            name: 'Professional', 
            price: 79, 
            recurrence: 'Monthly', 
            features: [
                'Everything in Base',
                'Full Reading & Video Catalog',
                'Business Readings',
                'Executive Reflection',
                'Priority Support',
                'Quarterly Strategy Reviews'
            ], 
            tier_id: 'T3' 
        },
        { 
            id: 'elite', 
            name: 'Elite', 
            price: 199, 
            recurrence: 'Monthly', 
            features: [
                'Everything in Professional',
                'Live Courses & Masterclasses',
                'Executive Coaching Sessions',
                'Custom Development Plans',
                'White-Glove Support',
                'Private Leadership Community',
                'Annual Leadership Summit Access'
            ], 
            tier_id: 'T4' 
        },
        { 
            id: 'trial', 
            name: 'Free Trial', 
            price: 0, 
            recurrence: '7 Days', 
            features: [
                'Limited Dashboard Access',
                'Sample Reps',
                'Preview of Content',
                'Basic Progress Tracking'
            ], 
            tier_id: 'trial' 
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

// Tier fallback data
export const LEADERSHIP_TIERS_FALLBACK = {
  items: [
    { id: 'T0', name: 'Trial', access: 'Limited trial access' },
    { id: 'T1', name: 'Basic', access: 'Core leadership reps and exercises' },
    { id: 'T2', name: 'Pro', access: 'Advanced content and video library' },
    { id: 'T3', name: 'Professional', access: 'Full content library and business readings' },
    { id: 'T4', name: 'Elite', access: 'All features including live courses and coaching' }
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
