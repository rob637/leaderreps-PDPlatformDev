// Navigation configuration — screen keys and metadata
export const SCREENS = {
  FEED: 'feed',
  CONVERSATION: 'conversation',
  MIRROR: 'mirror',
  LAB: 'lab',
  COHORT: 'cohort',
  STORY: 'story',
  ONBOARDING: 'onboarding',
  LOGIN: 'login',
  // Facilitator screens
  WAR_ROOM: 'war-room',
  MEMBER_DEEP_DIVE: 'member-deep-dive',
  SESSION_PLANNER: 'session-planner',
  ADMIN: 'admin',
};

// Bottom nav items for regular users
export const USER_NAV_ITEMS = [
  { key: SCREENS.FEED, label: 'Feed', icon: 'MessageCircle' },
  { key: SCREENS.MIRROR, label: 'Mirror', icon: 'Scan' },
  { key: SCREENS.LAB, label: 'Lab', icon: 'FlaskConical' },
  { key: SCREENS.COHORT, label: 'Cohort', icon: 'Users' },
  { key: SCREENS.STORY, label: 'Story', icon: 'BookOpen' },
];

// Bottom nav items for facilitators
export const FACILITATOR_NAV_ITEMS = [
  { key: SCREENS.FEED, label: 'Feed', icon: 'MessageCircle' },
  { key: SCREENS.WAR_ROOM, label: 'Cohort', icon: 'LayoutDashboard' },
  { key: SCREENS.SESSION_PLANNER, label: 'Sessions', icon: 'Calendar' },
  { key: SCREENS.ADMIN, label: 'Manage', icon: 'Settings' },
];

// Phase definitions
export const PHASES = {
  PRE_PROGRAM: 'pre-program',
  FOUNDATION: 'foundation',
  ASCENT: 'ascent',
};

// Milestone themes aligned with Arena Foundations in-person program
export const WEEKLY_THEMES = [
  { week: 1, title: 'Reinforcing', shortTitle: 'Reinforcing' },
  { week: 2, title: 'One-on-One', shortTitle: '1:1' },
  { week: 3, title: 'Redirecting', shortTitle: 'Redirecting' },
  { week: 4, title: 'Readiness', shortTitle: 'Readiness' },
  { week: 5, title: 'Graduation', shortTitle: 'Graduation' },
];
