// Navigation configuration — screen keys and metadata
export const SCREENS = {
  FEED: 'feed',
  CONVERSATION: 'conversation',
  MIRROR: 'mirror',
  LAB: 'lab',
  PRACTICE: 'practice',
  COHORT: 'cohort',
  STORY: 'story',
  ONBOARDING: 'onboarding',
  LOGIN: 'login',
  // Facilitator screens
  PULSE: 'pulse',
  WAR_ROOM: 'war-room',
  MEMBER_DEEP_DIVE: 'member-deep-dive',
  SESSION_PLANNER: 'session-planner',
  ADMIN: 'admin',
};

// Bottom nav items for regular users
export const USER_NAV_ITEMS = [
  { key: SCREENS.FEED, label: 'Feed', icon: 'MessageCircle' },
  { key: SCREENS.MIRROR, label: 'Mirror', icon: 'Scan' },
  { key: SCREENS.PRACTICE, label: 'Practice', icon: 'FlaskConical' },
  { key: SCREENS.COHORT, label: 'Cohort', icon: 'Users' },
];

// Bottom nav items for facilitators
export const FACILITATOR_NAV_ITEMS = [
  { key: SCREENS.PULSE, label: 'Pulse', icon: 'Activity' },
  { key: SCREENS.WAR_ROOM, label: 'Cohort', icon: 'LayoutDashboard' },
  { key: SCREENS.SESSION_PLANNER, label: 'Sessions', icon: 'Calendar' },
  { key: SCREENS.ADMIN, label: 'Manage', icon: 'Settings' },
];

// Phase definitions — mirror functions/labCurriculum.js tracks
export const PHASES = {
  PRE_PROGRAM: 'pre-program',
  FOUNDATION: 'foundation',          // weeks 1-5  (Lead Work)
  ASCENT_TEAM: 'ascent-team',        // weeks 6-11 (Lead Team)
  ASCENT_SELF: 'ascent-self',        // weeks 12-16 (Lead Self)
  // Legacy umbrella value still in some user docs:
  ASCENT: 'ascent',
};

// Track display metadata
export const TRACKS = {
  foundation:    { label: 'Foundation', sublabel: 'Lead Work',  weeks: [1, 2, 3, 4, 5] },
  'ascent-team': { label: 'Ascent',     sublabel: 'Lead Team',  weeks: [6, 7, 8, 9, 10, 11] },
  'ascent-self': { label: 'Ascent',     sublabel: 'Lead Self',  weeks: [12, 13, 14, 15, 16] },
};

// Weekly themes — MIRROR of functions/labCurriculum.js LL_CURRICULUM.
// Keep number/track/shortTitle in sync if the server spine changes.
export const WEEKLY_THEMES = [
  // Foundation — Lead Work
  { week: 1,  track: 'foundation',   title: 'Reinforcing',       shortTitle: 'Reinforcing' },
  { week: 2,  track: 'foundation',   title: 'One-on-One',        shortTitle: '1:1' },
  { week: 3,  track: 'foundation',   title: 'Redirecting',       shortTitle: 'Redirecting' },
  { week: 4,  track: 'foundation',   title: 'Readiness',         shortTitle: 'Readiness' },
  { week: 5,  track: 'foundation',   title: 'Capstone',          shortTitle: 'Capstone' },
  // Ascent — Lead Team
  { week: 6,  track: 'ascent-team',  title: 'Operating Rhythm',  shortTitle: 'Rhythm' },
  { week: 7,  track: 'ascent-team',  title: 'Trust',             shortTitle: 'Trust' },
  { week: 8,  track: 'ascent-team',  title: 'Productive Conflict', shortTitle: 'Conflict' },
  { week: 9,  track: 'ascent-team',  title: 'Alignment',         shortTitle: 'Alignment' },
  { week: 10, track: 'ascent-team',  title: 'Accountability',    shortTitle: 'Accountability' },
  { week: 11, track: 'ascent-team',  title: 'Momentum',          shortTitle: 'Momentum' },
  // Ascent — Lead Self
  { week: 12, track: 'ascent-self',  title: 'Identity',          shortTitle: 'Identity' },
  { week: 13, track: 'ascent-self',  title: 'Energy',            shortTitle: 'Energy' },
  { week: 14, track: 'ascent-self',  title: 'Boundaries',        shortTitle: 'Boundaries' },
  { week: 15, track: 'ascent-self',  title: 'Voice',             shortTitle: 'Voice' },
  { week: 16, track: 'ascent-self',  title: 'Legacy',            shortTitle: 'Legacy' },
];

export const TOTAL_WEEKS = WEEKLY_THEMES.length;

export function getWeekTheme(week) {
  return WEEKLY_THEMES.find((t) => t.week === week) || null;
}

export function getTrackForWeek(week) {
  const t = getWeekTheme(week);
  return t?.track || 'foundation';
}
