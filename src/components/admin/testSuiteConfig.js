/**
 * Test Suite Configuration
 * 
 * SINGLE SOURCE OF TRUTH for all test counts.
 * 
 * ARCHITECTURE:
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 1. MANUAL TEST SUITES (test-scripts/01-07*.md)
 *    - 7 test suites with unique scenarios
 *    - Total: 132 unique scenarios
 *    
 * 2. E2E SUITE TESTS (e2e-tests/suites/*.spec.js)
 *    - Automated 1:1 versions of manual tests
 *    - Total: 133 tests (100% coverage + 1 extra)
 *    
 * 3. SMOKE TEST (test-scripts/00-smoke-test.md)
 *    - 35 KEY scenarios SELECTED from the 132 above
 *    - NOT additional - it's a curated pre-deployment checklist
 *    - E2E smoke (17 tests) = different quick health checks
 *    
 * 4. E2E JOURNEY TESTS (e2e-tests/journeys/*.spec.js)
 *    - Extended multi-step user flows
 *    - Total: 165 tests (ADDITIONAL coverage)
 *    
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * LAST AUDIT: Jan 11, 2026
 * Verified by: grep -cE "^\s+test\(" e2e-tests/suites/*.spec.js
 */

// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL TEST SUITES (7 suites, 132 unique scenarios)
// Each has a matching E2E suite in e2e-tests/suites/
// ═══════════════════════════════════════════════════════════════════════════════
export const MANUAL_TEST_SUITES = {
  auth: {
    id: 'auth',
    name: 'Authentication',
    manualFile: '06-authentication.md',
    e2eFile: 'suites/01-authentication.spec.js',
    manualCount: 16,
    e2eCount: 16,
    time: '1-2 hours',
    priority: 'High',
    description: 'Login, logout, signup, password reset, protected routes.',
    icon: 'Shield',
    color: 'gray'
  },
  prep: {
    id: 'prep',
    name: 'Prep Phase',
    manualFile: '01-prep-phase.md',
    e2eFile: 'suites/02-prep-phase.spec.js',
    manualCount: 14,
    e2eCount: 14,
    time: '2-3 hours',
    priority: 'High',
    description: 'New user registration, prep gate, leader profile, baseline.',
    icon: 'UserPlus',
    color: 'purple'
  },
  am: {
    id: 'am',
    name: 'AM Bookend',
    manualFile: '02-dev-am-bookend.md',
    e2eFile: 'suites/03-am-bookend.spec.js',
    manualCount: 20,
    e2eCount: 21,
    time: '2-3 hours',
    priority: 'High',
    description: 'Grounding Rep, Win the Day, Daily Reps, Scorecard.',
    icon: 'Sun',
    color: 'amber'
  },
  pm: {
    id: 'pm',
    name: 'PM Bookend',
    manualFile: '03-dev-pm-bookend.md',
    e2eFile: 'suites/04-pm-bookend.spec.js',
    manualCount: 12,
    e2eCount: 13,
    time: '1.5 hours',
    priority: 'High',
    description: 'PM Reflection, Daily completion.',
    icon: 'Moon',
    color: 'indigo'
  },
  content: {
    id: 'content',
    name: 'Content Library',
    manualFile: '04-content-library.md',
    e2eFile: 'suites/05-content-library.spec.js',
    manualCount: 22,
    e2eCount: 22,
    time: '2-3 hours',
    priority: 'High',
    description: 'Video playback, readings, tools, filters, search.',
    icon: 'Library',
    color: 'blue'
  },
  post: {
    id: 'post',
    name: 'Post Phase',
    manualFile: '05-post-phase.md',
    e2eFile: 'suites/06-post-phase.spec.js',
    manualCount: 12,
    e2eCount: 12,
    time: '1-2 hours',
    priority: 'Medium',
    description: 'Day 70→71 transition, full content access.',
    icon: 'GraduationCap',
    color: 'green'
  },
  zones: {
    id: 'zones',
    name: 'Zones',
    manualFile: '07-zones.md',
    e2eFile: 'suites/07-zones.spec.js',
    manualCount: 36,
    e2eCount: 35,
    time: '3-4 hours',
    priority: 'High',
    description: 'Community (Day 15+), Coaching (Day 22+), Locker.',
    icon: 'Target',
    color: 'teal'
  }
};

// Test execution order (follows user journey)
export const SUITE_ORDER = ['auth', 'prep', 'am', 'pm', 'content', 'zones', 'post'];

// ═══════════════════════════════════════════════════════════════════════════════
// SMOKE TEST (Critical path subset - NOT additional scenarios)
// ═══════════════════════════════════════════════════════════════════════════════
export const SMOKE_TEST = {
  id: 'smoke',
  name: 'Critical Path Smoke Test',
  manualFile: '00-smoke-test.md',
  e2eFile: 'smoke.spec.js',
  manualCount: 35,  // 35 KEY scenarios from the 132 suite scenarios
  e2eCount: 17,     // 17 quick automated health checks
  time: '30 min (E2E) / 3-4 hours (Manual)',
  priority: 'Critical',
  description: 'Pre-deployment validation. Selected key scenarios from all suites.',
  icon: 'Flame',
  color: 'red',
  isSubset: true   // Indicates this is a curated subset, not unique tests
};

// ═══════════════════════════════════════════════════════════════════════════════
// E2E JOURNEY TESTS (Additional coverage - extended user flows)
// ═══════════════════════════════════════════════════════════════════════════════
export const E2E_JOURNEY_TESTS = {
  prep: { 
    id: 'journey-prep', 
    name: 'Prep Journey', 
    file: 'journeys/prep-phase.spec.js',
    count: 18, 
    description: 'Complete new user prep experience' 
  },
  daily: { 
    id: 'journey-daily', 
    name: 'Daily Practice', 
    file: 'journeys/daily-practice.spec.js',
    count: 38, 
    description: 'Full AM/PM daily practice flow' 
  },
  content: { 
    id: 'journey-content', 
    name: 'Content Library', 
    file: 'journeys/content-library.spec.js',
    count: 34, 
    description: 'Browse, filter, view all content' 
  },
  zones: { 
    id: 'journey-zones', 
    name: 'Zones', 
    file: 'journeys/zones.spec.js',
    count: 49, 
    description: 'Community, Coaching, Locker journeys' 
  },
  post: { 
    id: 'journey-post', 
    name: 'Post Phase', 
    file: 'journeys/post-phase.spec.js',
    count: 26, 
    description: 'Day 71+ ongoing access journey' 
  },
};

export const JOURNEY_ORDER = ['prep', 'daily', 'content', 'zones', 'post'];

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK COMMANDS (E2E runner shortcuts)
// ═══════════════════════════════════════════════════════════════════════════════
export const QUICK_COMMANDS = {
  smoke: { 
    id: 'quick-smoke',
    name: 'Quick Smoke', 
    command: 'npm run e2e:smoke',
    count: 17, 
    description: 'Fast health check (~2 min)' 
  },
  auth: { 
    id: 'quick-auth',
    name: 'Auth Check', 
    command: 'npm run e2e:auth',
    count: 14, 
    description: 'Auth flow validation (~3 min)' 
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENTS
// ═══════════════════════════════════════════════════════════════════════════════
export const ENVIRONMENTS = [
  { id: 'local', name: 'Local', url: 'http://localhost:5173' },
  { id: 'dev', name: 'Dev', url: 'https://leaderreps-pd-platform.web.app' },
  { id: 'test', name: 'Test', url: 'https://leaderreps-test.web.app' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATED TOTALS
// ═══════════════════════════════════════════════════════════════════════════════

// Manual: 7 suites with 132 unique scenarios
export const MANUAL_SUITE_COUNT = Object.keys(MANUAL_TEST_SUITES).length;
export const MANUAL_TOTAL = Object.values(MANUAL_TEST_SUITES).reduce((sum, s) => sum + s.manualCount, 0);

// E2E Suites: 133 tests (1:1 with manual + 1 extra)
export const E2E_SUITE_TOTAL = Object.values(MANUAL_TEST_SUITES).reduce((sum, s) => sum + s.e2eCount, 0);

// E2E Journeys: 165 additional flow tests
export const E2E_JOURNEY_TOTAL = Object.values(E2E_JOURNEY_TESTS).reduce((sum, j) => sum + j.count, 0);

// Smoke: 35 manual (subset) / 17 E2E (quick checks)
export const SMOKE_MANUAL = SMOKE_TEST.manualCount;
export const SMOKE_E2E = SMOKE_TEST.e2eCount;

// Coverage percentage
export const SUITE_AUTOMATION_PERCENT = Math.round((E2E_SUITE_TOTAL / MANUAL_TOTAL) * 100);

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (backward compatibility with existing components)
// ═══════════════════════════════════════════════════════════════════════════════

// ManualTestScripts.jsx expects this format
export const MANUAL_TEST_SCRIPTS = {
  smoke: {
    id: 'smoke-test',
    name: 'Critical Path Smoke Test',
    file: '00-smoke-test.md',
    scenarios: SMOKE_TEST.manualCount,
    time: '3-4 hours',
    priority: 'Critical',
    description: '35 key scenarios selected from all suites. Run before deployment.',
    icon: 'Flame',
    color: 'red'
  },
  auth: {
    id: 'authentication',
    name: 'Authentication Tests',
    file: MANUAL_TEST_SUITES.auth.manualFile,
    scenarios: MANUAL_TEST_SUITES.auth.manualCount,
    time: MANUAL_TEST_SUITES.auth.time,
    priority: MANUAL_TEST_SUITES.auth.priority,
    description: MANUAL_TEST_SUITES.auth.description,
    icon: MANUAL_TEST_SUITES.auth.icon,
    color: MANUAL_TEST_SUITES.auth.color
  },
  prep: {
    id: 'prep-phase',
    name: 'Prep Phase Tests',
    file: MANUAL_TEST_SUITES.prep.manualFile,
    scenarios: MANUAL_TEST_SUITES.prep.manualCount,
    time: MANUAL_TEST_SUITES.prep.time,
    priority: MANUAL_TEST_SUITES.prep.priority,
    description: MANUAL_TEST_SUITES.prep.description,
    icon: MANUAL_TEST_SUITES.prep.icon,
    color: MANUAL_TEST_SUITES.prep.color
  },
  am: {
    id: 'am-bookend',
    name: 'AM Bookend Tests',
    file: MANUAL_TEST_SUITES.am.manualFile,
    scenarios: MANUAL_TEST_SUITES.am.manualCount,
    time: MANUAL_TEST_SUITES.am.time,
    priority: MANUAL_TEST_SUITES.am.priority,
    description: MANUAL_TEST_SUITES.am.description,
    icon: MANUAL_TEST_SUITES.am.icon,
    color: MANUAL_TEST_SUITES.am.color
  },
  pm: {
    id: 'pm-bookend',
    name: 'PM Bookend Tests',
    file: MANUAL_TEST_SUITES.pm.manualFile,
    scenarios: MANUAL_TEST_SUITES.pm.manualCount,
    time: MANUAL_TEST_SUITES.pm.time,
    priority: MANUAL_TEST_SUITES.pm.priority,
    description: MANUAL_TEST_SUITES.pm.description,
    icon: MANUAL_TEST_SUITES.pm.icon,
    color: MANUAL_TEST_SUITES.pm.color
  },
  content: {
    id: 'content-library',
    name: 'Content Library Tests',
    file: MANUAL_TEST_SUITES.content.manualFile,
    scenarios: MANUAL_TEST_SUITES.content.manualCount,
    time: MANUAL_TEST_SUITES.content.time,
    priority: MANUAL_TEST_SUITES.content.priority,
    description: MANUAL_TEST_SUITES.content.description,
    icon: MANUAL_TEST_SUITES.content.icon,
    color: MANUAL_TEST_SUITES.content.color
  },
  post: {
    id: 'post-phase',
    name: 'Post Phase Tests',
    file: MANUAL_TEST_SUITES.post.manualFile,
    scenarios: MANUAL_TEST_SUITES.post.manualCount,
    time: MANUAL_TEST_SUITES.post.time,
    priority: MANUAL_TEST_SUITES.post.priority,
    description: MANUAL_TEST_SUITES.post.description,
    icon: MANUAL_TEST_SUITES.post.icon,
    color: MANUAL_TEST_SUITES.post.color
  },
  zones: {
    id: 'zones',
    name: 'Zones Tests',
    file: MANUAL_TEST_SUITES.zones.manualFile,
    scenarios: MANUAL_TEST_SUITES.zones.manualCount,
    time: MANUAL_TEST_SUITES.zones.time,
    priority: MANUAL_TEST_SUITES.zones.priority,
    description: MANUAL_TEST_SUITES.zones.description,
    icon: MANUAL_TEST_SUITES.zones.icon,
    color: MANUAL_TEST_SUITES.zones.color
  }
};

export const MANUAL_TEST_ORDER = ['smoke', 'auth', 'prep', 'am', 'pm', 'content', 'zones', 'post'];

// These are for display - show total including smoke subset for "scenarios to test"
export const MANUAL_TOTAL_SCENARIOS = MANUAL_TOTAL; // 132 unique scenarios
export const MANUAL_CRITICAL_PATH = SMOKE_TEST.manualCount; // 35 smoke scenarios

// E2ETestRunner.jsx expects this format
export const E2E_TEST_SUITES = {
  auth: { id: 'suite-auth', name: 'Authentication', count: MANUAL_TEST_SUITES.auth.e2eCount, icon: 'Shield', color: 'gray' },
  prep: { id: 'suite-prep', name: 'Prep Phase', count: MANUAL_TEST_SUITES.prep.e2eCount, icon: 'UserCheck', color: 'purple' },
  am: { id: 'suite-am', name: 'AM Bookend', count: MANUAL_TEST_SUITES.am.e2eCount, icon: 'Sun', color: 'amber' },
  pm: { id: 'suite-pm', name: 'PM Bookend', count: MANUAL_TEST_SUITES.pm.e2eCount, icon: 'Moon', color: 'indigo' },
  content: { id: 'suite-content', name: 'Content Library', count: MANUAL_TEST_SUITES.content.e2eCount, icon: 'Library', color: 'blue' },
  post: { id: 'suite-post', name: 'Post Phase', count: MANUAL_TEST_SUITES.post.e2eCount, icon: 'GraduationCap', color: 'green' },
  zones: { id: 'suite-zones', name: 'Zones', count: MANUAL_TEST_SUITES.zones.e2eCount, icon: 'Map', color: 'teal' },
};

export const E2E_SUITES_TOTAL = E2E_SUITE_TOTAL;
export const E2E_JOURNEYS_TOTAL = E2E_JOURNEY_TOTAL;
export const TEST_SUITES = E2E_TEST_SUITES;
export const TOTAL_TEST_COUNT = E2E_SUITE_TOTAL;
export const QUICK_COMMAND_COUNTS = { smoke: QUICK_COMMANDS.smoke.count, auth: QUICK_COMMANDS.auth.count };

// TEST_AREAS format for coverage display
export const TEST_AREAS = {};
SUITE_ORDER.forEach(key => {
  const suite = MANUAL_TEST_SUITES[key];
  TEST_AREAS[key] = {
    id: suite.id,
    name: suite.name,
    manualFile: suite.manualFile,
    e2eFile: suite.e2eFile,
    manual: suite.manualCount,
    automated: suite.e2eCount,
    gap: suite.manualCount - suite.e2eCount,
    time: suite.time,
    priority: suite.priority,
    description: suite.description,
    icon: suite.icon,
    color: suite.color
  };
});

export const TEST_ORDER = SUITE_ORDER;
export const AUTOMATION_COVERAGE = SUITE_AUTOMATION_PERCENT;
export const AUTOMATION_GAP = MANUAL_TOTAL - E2E_SUITE_TOTAL;
export const AUTOMATED_TOTAL = E2E_SUITE_TOTAL;
export const TEST_AREA_COUNT = MANUAL_SUITE_COUNT;
