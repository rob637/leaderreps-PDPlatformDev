/**
 * Test Suite Configuration
 * 
 * SINGLE SOURCE OF TRUTH for test counts and definitions.
 * Used by both Manual Test Scripts and E2E Test Runner.
 * 
 * Update counts here when adding/removing tests. All totals are calculated automatically.
 * 
 * LAST AUDIT: Jan 11, 2026
 * Counts verified by: grep -cE "^\s+test\(" e2e-tests/*.spec.js e2e-tests/suites/*.spec.js
 * 
 * KEY INSIGHT: E2E Suites are 1:1 automations of Manual Test Scripts.
 * Journeys are ADDITIONAL cross-functional tests (not duplicates).
 */

// ═══════════════════════════════════════════════════════════════════════════════
// TEST AREAS - Each area has Manual tests AND matching E2E automation
// ═══════════════════════════════════════════════════════════════════════════════
export const TEST_AREAS = {
  smoke: {
    id: 'smoke',
    name: 'Critical Path Smoke Test',
    manualFile: '00-smoke-test.md',
    e2eFile: 'smoke.spec.js',       // Root level file
    manual: 34,                      // From manual test script header
    automated: 17,                   // grep -cE "^\s+test\(" smoke.spec.js
    gap: 17,                         // 34 - 17 = 17 tests NOT yet automated
    time: '3-4 hours',
    priority: 'Critical',
    description: 'Run before EVERY deployment. Tests core user journey.',
    icon: 'Flame',
    color: 'red'
  },
  auth: {
    id: 'auth',
    name: 'Authentication Tests',
    manualFile: '06-authentication.md',
    e2eFile: 'suites/01-authentication.spec.js',
    manual: 16,
    automated: 16,                   // ✓ Fully automated
    gap: 0,
    time: '1-2 hours',
    priority: 'High',
    description: 'Login, logout, signup, password reset, protected routes.',
    icon: 'Shield',
    color: 'gray'
  },
  prep: {
    id: 'prep',
    name: 'Prep Phase Tests',
    manualFile: '01-prep-phase.md',
    e2eFile: 'suites/02-prep-phase.spec.js',
    manual: 14,
    automated: 14,                   // ✓ Fully automated
    gap: 0,
    time: '2-3 hours',
    priority: 'High',
    description: 'New user registration, prep gate, leader profile, baseline.',
    icon: 'UserPlus',
    color: 'purple'
  },
  am: {
    id: 'am',
    name: 'AM Bookend Tests',
    manualFile: '02-dev-am-bookend.md',
    e2eFile: 'suites/03-am-bookend.spec.js',
    manual: 20,
    automated: 21,                   // +1 extra E2E test
    gap: -1,
    time: '2-3 hours',
    priority: 'High',
    description: 'Grounding Rep, Win the Day, Daily Reps, Scorecard.',
    icon: 'Sun',
    color: 'amber'
  },
  pm: {
    id: 'pm',
    name: 'PM Bookend Tests',
    manualFile: '03-dev-pm-bookend.md',
    e2eFile: 'suites/04-pm-bookend.spec.js',
    manual: 12,
    automated: 13,                   // +1 extra E2E test
    gap: -1,
    time: '1.5 hours',
    priority: 'High',
    description: 'PM Reflection, Daily completion.',
    icon: 'Moon',
    color: 'indigo'
  },
  content: {
    id: 'content',
    name: 'Content Library Tests',
    manualFile: '04-content-library.md',
    e2eFile: 'suites/05-content-library.spec.js',
    manual: 22,
    automated: 22,                   // ✓ Fully automated
    gap: 0,
    time: '2-3 hours',
    priority: 'High',
    description: 'Video playback, readings, tools, filters, search.',
    icon: 'Library',
    color: 'blue'
  },
  post: {
    id: 'post',
    name: 'Post Phase Tests',
    manualFile: '05-post-phase.md',
    e2eFile: 'suites/06-post-phase.spec.js',
    manual: 12,
    automated: 12,                   // ✓ Fully automated
    gap: 0,
    time: '1-2 hours',
    priority: 'Medium',
    description: 'Day 70→71 transition, full content access.',
    icon: 'GraduationCap',
    color: 'green'
  },
  zones: {
    id: 'zones',
    name: 'Zones Tests',
    manualFile: '07-zones.md',
    e2eFile: 'suites/07-zones.spec.js',
    manual: 36,
    automated: 35,                   // -1 missing
    gap: 1,
    time: '3-4 hours',
    priority: 'High',
    description: 'Community (Day 15+), Coaching (Day 22+), Locker.',
    icon: 'Target',
    color: 'teal'
  }
};

// Recommended test execution order (follows user journey)
export const TEST_ORDER = ['smoke', 'auth', 'prep', 'am', 'pm', 'content', 'zones', 'post'];

// ═══════════════════════════════════════════════════════════════════════════════
// E2E JOURNEYS - ADDITIONAL cross-functional tests (NOT 1:1 with manual)
// These test complete user flows that span multiple areas
// ═══════════════════════════════════════════════════════════════════════════════
export const E2E_JOURNEY_TESTS = {
  prep: { id: 'journey-prep', name: 'Prep Journey', count: 18, description: 'Complete new user prep experience' },
  daily: { id: 'journey-daily', name: 'Daily Practice', count: 38, description: 'Full AM/PM daily practice flow' },
  content: { id: 'journey-content', name: 'Content Library', count: 34, description: 'Browse, filter, view all content' },
  zones: { id: 'journey-zones', name: 'Zones', count: 49, description: 'Community, Coaching, Locker journeys' },
  post: { id: 'journey-post', name: 'Post Phase', count: 26, description: 'Day 71+ ongoing access journey' },
};

// Legacy quick commands (separate from suite structure)
export const QUICK_COMMANDS = {
  smoke: { file: 'smoke.spec.js', count: 17, description: 'Quick smoke checks' },
  auth: { file: 'auth.spec.js', count: 14, description: 'Auth flow validation' },
};

// Environment options for testing
export const ENVIRONMENTS = [
  { id: 'local', name: 'Local', url: 'http://localhost:5173' },
  { id: 'dev', name: 'Dev', url: 'https://leaderreps-pd-platform.web.app' },
  { id: 'test', name: 'Test', url: 'https://leaderreps-test.web.app' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATED TOTALS (auto-calculated from TEST_AREAS)
// ═══════════════════════════════════════════════════════════════════════════════

// Total manual tests across all areas
export const MANUAL_TOTAL = Object.values(TEST_AREAS).reduce((sum, a) => sum + a.manual, 0);

// Total automated tests (E2E suites that map to manual tests)
export const AUTOMATED_TOTAL = Object.values(TEST_AREAS).reduce((sum, a) => sum + a.automated, 0);

// Gap: How many manual tests are NOT yet automated
export const AUTOMATION_GAP = MANUAL_TOTAL - AUTOMATED_TOTAL;

// Automation coverage percentage
export const AUTOMATION_COVERAGE = Math.round((AUTOMATED_TOTAL / MANUAL_TOTAL) * 100);

// Journey tests (additional, not 1:1 with manual)
export const E2E_JOURNEYS_TOTAL = Object.values(E2E_JOURNEY_TESTS).reduce((sum, j) => sum + j.count, 0);

// Area count
export const TEST_AREA_COUNT = Object.keys(TEST_AREAS).length;

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY EXPORTS (for backward compatibility with existing components)
// ═══════════════════════════════════════════════════════════════════════════════

// Map TEST_AREAS to old MANUAL_TEST_SCRIPTS format
export const MANUAL_TEST_SCRIPTS = Object.fromEntries(
  Object.entries(TEST_AREAS).map(([key, area]) => [
    key,
    {
      id: area.id,
      name: area.name,
      file: area.manualFile,
      scenarios: area.manual,
      time: area.time,
      priority: area.priority,
      description: area.description,
      icon: area.icon,
      color: area.color
    }
  ])
);

// Map TEST_AREAS to old E2E_TEST_SUITES format
export const E2E_TEST_SUITES = Object.fromEntries(
  Object.entries(TEST_AREAS).map(([key, area]) => [
    key,
    {
      id: `suite-${area.id}`,
      name: area.name,
      count: area.automated,
      icon: area.icon,
      color: area.color
    }
  ])
);

export const MANUAL_TEST_ORDER = TEST_ORDER;
export const MANUAL_TOTAL_SCENARIOS = MANUAL_TOTAL;
export const MANUAL_CRITICAL_PATH = TEST_AREAS.smoke.manual;
export const MANUAL_SUITE_COUNT = TEST_AREA_COUNT;
export const E2E_SUITES_TOTAL = AUTOMATED_TOTAL;
export const TEST_SUITES = E2E_TEST_SUITES;
export const TOTAL_TEST_COUNT = AUTOMATED_TOTAL;
export const QUICK_COMMAND_COUNTS = { smoke: QUICK_COMMANDS.smoke.count, auth: QUICK_COMMANDS.auth.count };

