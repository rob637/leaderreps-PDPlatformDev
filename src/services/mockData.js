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

// Global metadata mocks - Feature flags control navigation visibility
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
export const MOCK_SCENARIO_CATALOG = [
  {
    id: 'underperformer-feedback',
    title: 'Addressing Chronic Underperformance',
    description: 'A previously strong team member has been missing deadlines and delivering subpar work for the past quarter. You need to address the performance gap while maintaining the relationship.',
    persona: 'Defensive Senior Developer',
    context: 'Jordan has been with the company for 4 years and was a top performer until recently. They seem disengaged in meetings and have missed three major deadlines. Other team members are starting to notice and picking up the slack.',
    complexity: 'intermediate',
    category: 'performance',
    suggestedApproach: 'Use the SBI framework to provide specific examples of the performance issues. Be curious about underlying causes—burnout, personal issues, or misalignment with work. Balance accountability with empathy.',
    learningObjectives: [
      'Deliver specific, behavior-based feedback',
      'Balance accountability with compassion',
      'Uncover root causes of performance decline',
      'Create a clear performance improvement plan'
    ]
  },
  {
    id: 'team-conflict-resolution',
    title: 'Resolving Team Conflict',
    description: 'Two high-performing team members are in constant conflict, creating tension across the entire team. Their disagreements are disrupting meetings and affecting team morale.',
    persona: 'Passive-Aggressive Marketing Manager',
    context: 'Alex and Sam have different work styles—Alex is detail-oriented and process-driven, while Sam is creative and prefers flexibility. Their differences have escalated from healthy debate to personal attacks in Slack and team meetings.',
    complexity: 'advanced',
    category: 'conflict',
    suggestedApproach: 'Meet with each person individually first to understand their perspective. Then facilitate a joint conversation focused on shared goals and professional collaboration. Set clear expectations for respectful communication.',
    learningObjectives: [
      'Navigate emotionally charged conversations',
      'Find common ground between opposing viewpoints',
      'Establish team norms for healthy conflict',
      'Address behavior without taking sides'
    ]
  },
  {
    id: 'compensation-request',
    title: 'Handling a Compensation Request',
    description: 'A valued team member has requested a significant raise, citing market rates and increased responsibilities. Budget constraints limit your ability to meet their request.',
    persona: 'High-Performer Threatening to Leave',
    context: 'Casey has been with the company for 2 years and recently took on additional project leadership responsibilities. They have a competing offer from another company and are asking for a 25% raise to stay. Your budget only allows for a 10% increase.',
    complexity: 'advanced',
    category: 'compensation',
    suggestedApproach: 'Acknowledge their contributions and value. Be transparent about budget constraints. Explore creative solutions beyond salary—title change, equity, flexible work, professional development. Avoid making promises you cannot keep.',
    learningObjectives: [
      'Navigate difficult financial conversations',
      'Balance employee needs with business constraints',
      'Explore non-monetary value propositions',
      'Make informed retention decisions'
    ]
  },
  {
    id: 'delegation-micromanager',
    title: 'Coaching an Over-Controlling Manager',
    description: 'One of your direct reports manages their team with excessive oversight, creating bottlenecks and limiting team growth. Team members have complained about lack of autonomy.',
    persona: 'Insecure First-Time Manager',
    context: 'Taylor was recently promoted to team lead after being an individual contributor. They are struggling to let go of hands-on work and are reviewing every detail of their team\'s output. Team velocity has decreased, and two team members have requested transfers.',
    complexity: 'intermediate',
    category: 'coaching',
    suggestedApproach: 'Understand the root of the controlling behavior—fear of failure, lack of trust, unclear expectations. Help them distinguish between delegation and abdication. Create a coaching plan focused on building trust and developing their team.',
    learningObjectives: [
      'Coach managers through common leadership transitions',
      'Address controlling behavior with empathy',
      'Teach effective delegation practices',
      'Balance manager development with team impact'
    ]
  },
  {
    id: 'diversity-incident',
    title: 'Responding to a Bias Incident',
    description: 'A team member has reported feeling excluded and experiencing microaggressions from a colleague. You need to investigate and address the situation while maintaining psychological safety.',
    persona: 'Defensive Colleague Accused of Bias',
    context: 'Morgan, a woman of color, reported that Drew has repeatedly talked over her in meetings, dismissed her ideas only to champion similar ideas from male colleagues, and made comments about her "being aggressive" when she advocates for herself.',
    complexity: 'expert',
    category: 'dei',
    suggestedApproach: 'Take the complaint seriously and investigate promptly. Meet with Morgan to understand her experience. Then address Drew\'s behavior with specific examples without labeling them as "racist" or "sexist" initially. Focus on impact over intent.',
    learningObjectives: [
      'Handle sensitive DEI issues with care',
      'Distinguish between impact and intent',
      'Create accountability without defensiveness',
      'Foster inclusive team behaviors'
    ]
  },
  {
    id: 'difficult-termination',
    title: 'Conducting a Difficult Termination',
    description: 'You need to terminate an employee who is well-liked by the team but has failed to meet performance standards after multiple improvement plans.',
    persona: 'Shocked Employee Facing Termination',
    context: 'Riley has been on a performance improvement plan for 90 days. Despite coaching and support, they have not demonstrated the required improvement. The team likes Riley personally, but their underperformance is creating additional burden on others.',
    complexity: 'expert',
    category: 'termination',
    suggestedApproach: 'Be clear, direct, and compassionate. This should not be a surprise if you\'ve given proper feedback. Explain the decision, outline next steps, and provide separation details. Keep it brief and dignified. Have HR present.',
    learningObjectives: [
      'Deliver difficult messages with clarity and compassion',
      'Maintain professionalism during emotional conversations',
      'Navigate legal and HR considerations',
      'Protect remaining team morale'
    ]
  },
  {
    id: 'executive-pushback',
    title: 'Pushing Back on Executive Decision',
    description: 'Senior leadership has announced a strategic decision that you believe will negatively impact your team and customers. You need to advocate for your team while managing up effectively.',
    persona: 'Impatient C-Suite Executive',
    context: 'The executive team has decided to cut your team\'s headcount by 30% while simultaneously increasing quarterly targets by 40%. You have data showing this is unrealistic and will lead to burnout, attrition, and quality issues.',
    complexity: 'expert',
    category: 'influence',
    suggestedApproach: 'Present data-driven concerns focused on business impact, not personal disagreement. Propose alternative solutions. Understand the constraints leadership is facing. Be prepared to implement the decision if your pushback is unsuccessful.',
    learningObjectives: [
      'Influence senior leadership with data and business cases',
      'Advocate for your team without being insubordinate',
      'Navigate power dynamics effectively',
      'Balance loyalty to team and organization'
    ]
  },
  {
    id: 'burnout-intervention',
    title: 'Intervening with a Burned-Out Employee',
    description: 'You notice a high-performing team member showing signs of severe burnout—working excessive hours, declining quality, emotional exhaustion. They are resistant to taking time off.',
    persona: 'Exhausted High-Achiever in Denial',
    context: 'Jamie has been working 70+ hour weeks for the past 3 months to meet a critical project deadline. The project is complete, but they continue to work excessive hours. They appear exhausted, have become irritable with teammates, and dismissively respond to suggestions to take time off.',
    complexity: 'intermediate',
    category: 'wellbeing',
    suggestedApproach: 'Express concern for their wellbeing with specific observations. Acknowledge their contributions while emphasizing that sustainable performance is the goal. Make taking time off non-negotiable, not optional. Discuss workload redistribution.',
    learningObjectives: [
      'Recognize and address burnout proactively',
      'Balance empathy with firm boundaries',
      'Model sustainable work practices',
      'Create psychological safety for vulnerability'
    ]
  }
];

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
