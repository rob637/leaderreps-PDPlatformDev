// src/services/mockData.js

export const MOCK_DEVELOPMENT_PLAN_DATA = {
  currentPlan: null, // Ensure mock reflects reality
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
  whyStatement: '', // Add mock field
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

export const MOCK_MEMBERSHIP_PLANS = {
    items: [
        { 
            id: 'basic', 
            name: 'Base', 
            price: 29, 
            recurrence: 'Monthly', 
            features: [
                'Dashboard & Daily Practice', 
                'Basic Rep Library', 
                'Weekly Development Plan', 
                'Limited AI Coaching (5/month)'
            ]
        },
        { 
            id: 'professional', 
            name: 'Pro', 
            price: 79, 
            recurrence: 'Monthly', 
            features: [
                'Full Rep & Content Library', 
                'Unlimited Daily Practice', 
                'Complete Development Plans', 
                'Full AI Coaching Lab Access',
                'Community Participation'
            ]
        },
        { 
            id: 'elite', 
            name: 'Premium', 
            price: 199, 
            recurrence: 'Monthly', 
            features: [
                'All Pro Features', 
                'Executive ROI Reports', 
                'Priority Support', 
                '1-on-1 Coaching Sessions',
                'Early Access to New Content'
            ]
        }
    ]
};

// Global metadata mocks - BOSS V1 SCOPE: Future features disabled by default
export const MOCK_FEATURE_FLAGS = { 
  // V1 CORE FEATURES (ENABLED) - Arena v1.0 Approved Only
  enableDevPlan: true,
  enableDailyPractice: true,
  enableMembershipModule: true,
  
  // FUTURE SCOPE FEATURES (DISABLED per Arena v1.0 scope)
  enableReadings: false,       // Professional Reading Hub - FUTURE SCOPE
  enableCourses: false,        // Course Library - FUTURE SCOPE
  
  // FUTURE SCOPE FEATURES (DISABLED per boss requirements)
  enableLabs: false,           // AI Coaching Lab - FUTURE SCOPE
  enableLabsAdvanced: false,   // Advanced Lab features - FUTURE SCOPE
  enablePlanningHub: false,    // Strategic Tools - FUTURE SCOPE
  enableVideos: false,         // Leadership Videos - FUTURE SCOPE
  enableCommunity: false,      // Community features - FUTURE SCOPE
  enableRoiReport: false,      // Executive ROI Report - FUTURE SCOPE
  enableQuickStart: true,      // Keep QuickStart for onboarding
  
  // LEGACY/OTHER
  enableNewFeature: false 
};
export const MOCK_REP_LIBRARY = [];
export const MOCK_EXERCISE_LIBRARY = [];
export const MOCK_WORKOUT_LIBRARY = [];
export const MOCK_COURSE_LIBRARY = [];
export const MOCK_SKILL_CATALOG = [];
export const MOCK_IDENTITY_ANCHOR_CATALOG = [];
export const MOCK_HABIT_ANCHOR_CATALOG = [];
export const MOCK_WHY_CATALOG = [];
export const MOCK_READING_CATALOG = [];
export const MOCK_VIDEO_CATALOG = [];
export const MOCK_SCENARIO_CATALOG = [];

export const LEADERSHIP_TIERS_FALLBACK = [
  { tier: 1, name: "Tier 1", description: "Foundation" },
  { tier: 2, name: "Tier 2", description: "Intermediate" },
  { tier: 3, name: "Tier 3", description: "Advanced" },
  { tier: 4, name: "Tier 4", description: "Expert" },
];

export const MOCK_GLOBAL_METADATA = {
  featureFlags: MOCK_FEATURE_FLAGS,
  LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK,
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
  MEMBERSHIP_PLANS: MOCK_MEMBERSHIP_PLANS,
  RESOURCE_LIBRARY: {},
  IconMap: {},
  GEMINI_MODEL: 'gemini-pro',
  APP_ID: 'mock-app-id'
};
