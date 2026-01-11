/**
 * Test Suite Configuration
 * 
 * SINGLE SOURCE OF TRUTH for test counts and definitions.
 * Used by both Manual Test Scripts and E2E Test Runner.
 * 
 * Update counts here when adding/removing tests. All totals are calculated automatically.
 * 
 * LAST AUDIT: Jan 2026
 * - Manual: grep header lines in test-scripts/*.md
 * - E2E Suites: grep -c "test('" e2e-tests/suites/*.spec.js
 * - E2E Journeys: grep -c "test('" e2e-tests/journeys/*.spec.js
 */

// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL TEST SCRIPTS (test-scripts/*.md)
// These are human-executed QA scenarios documented in markdown files
// ═══════════════════════════════════════════════════════════════════════════════
export const MANUAL_TEST_SCRIPTS = {
  smoke: {
    id: 'smoke-test',
    name: 'Critical Path Smoke Test',
    file: '00-smoke-test.md',
    scenarios: 34,
    time: '3-4 hours',
    priority: 'Critical',
    description: 'Run before EVERY deployment. Tests core user journey end-to-end.',
    icon: 'Flame',
    color: 'red'
  },
  prep: {
    id: 'prep-phase',
    name: 'Prep Phase Tests',
    file: '01-prep-phase.md',
    scenarios: 14,
    time: '2-3 hours',
    priority: 'High',
    description: 'New user registration, prep gate, leader profile, baseline assessment.',
    icon: 'UserPlus',
    color: 'purple'
  },
  am: {
    id: 'am-bookend',
    name: 'AM Bookend Tests',
    file: '02-dev-am-bookend.md',
    scenarios: 20,
    time: '2-3 hours',
    priority: 'High',
    description: 'Grounding Rep, Win the Day, Daily Reps, Scorecard.',
    icon: 'Sun',
    color: 'amber'
  },
  pm: {
    id: 'pm-bookend',
    name: 'PM Bookend Tests',
    file: '03-dev-pm-bookend.md',
    scenarios: 12,
    time: '1.5 hours',
    priority: 'High',
    description: 'PM Reflection (What went well/What needs work/Closing thought), Daily completion.',
    icon: 'Moon',
    color: 'indigo'
  },
  content: {
    id: 'content-library',
    name: 'Content Library Tests',
    file: '04-content-library.md',
    scenarios: 22,
    time: '2-3 hours',
    priority: 'High',
    description: 'Video playback, readings, tools, filters, search, content gating.',
    icon: 'Library',
    color: 'blue'
  },
  post: {
    id: 'post-phase',
    name: 'Post Phase Tests',
    file: '05-post-phase.md',
    scenarios: 12,
    time: '1-2 hours',
    priority: 'Medium',
    description: 'Day 70→71 transition, full content access, continued practice.',
    icon: 'GraduationCap',
    color: 'green'
  },
  auth: {
    id: 'authentication',
    name: 'Authentication Tests',
    file: '06-authentication.md',
    scenarios: 16,
    time: '1-2 hours',
    priority: 'High',
    description: 'Login, logout, signup, password reset, protected routes.',
    icon: 'Shield',
    color: 'gray'
  },
  zones: {
    id: 'zones',
    name: 'Zones Tests',
    file: '07-zones.md',
    scenarios: 36,
    time: '3-4 hours',
    priority: 'High',
    description: 'Community (Day 15+), Coaching (Day 22+), Locker, zone gates.',
    icon: 'Target',
    color: 'teal'
  }
};

// Recommended manual test execution order (follows user journey)
export const MANUAL_TEST_ORDER = ['smoke', 'auth', 'prep', 'am', 'pm', 'content', 'zones', 'post'];

// ═══════════════════════════════════════════════════════════════════════════════
// E2E AUTOMATED TESTS - SUITES (e2e-tests/suites/*.spec.js)
// Playwright tests that mirror manual test scripts
// ═══════════════════════════════════════════════════════════════════════════════
export const E2E_TEST_SUITES = {
  auth: { id: 'suite-auth', name: 'Authentication', count: 16, icon: 'Shield', color: 'gray' },
  prep: { id: 'suite-prep', name: 'Prep Phase', count: 14, icon: 'UserCheck', color: 'purple' },
  am: { id: 'suite-am', name: 'AM Bookend', count: 21, icon: 'Sun', color: 'amber' },
  pm: { id: 'suite-pm', name: 'PM Bookend', count: 13, icon: 'Moon', color: 'indigo' },
  content: { id: 'suite-content', name: 'Content Library', count: 22, icon: 'Library', color: 'blue' },
  post: { id: 'suite-post', name: 'Post Phase', count: 12, icon: 'GraduationCap', color: 'green' },
  zones: { id: 'suite-zones', name: 'Zones', count: 35, icon: 'Map', color: 'teal' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// E2E AUTOMATED TESTS - JOURNEYS (e2e-tests/journeys/*.spec.js)
// Comprehensive end-to-end user journey tests (more detailed than suites)
// ═══════════════════════════════════════════════════════════════════════════════
export const E2E_JOURNEY_TESTS = {
  prep: { id: 'journey-prep', name: 'Prep Journey', count: 18, description: 'Complete new user prep experience' },
  daily: { id: 'journey-daily', name: 'Daily Practice', count: 38, description: 'Full AM/PM daily practice flow' },
  content: { id: 'journey-content', name: 'Content Library', count: 34, description: 'Browse, filter, view all content' },
  zones: { id: 'journey-zones', name: 'Zones', count: 49, description: 'Community, Coaching, Locker journeys' },
  post: { id: 'journey-post', name: 'Post Phase', count: 26, description: 'Day 71+ ongoing access journey' },
};

// Quick run command counts for E2E
export const QUICK_COMMAND_COUNTS = {
  smoke: 16,    // smoke.spec.js - Critical path automated checks
  auth: 14,     // auth.spec.js - Authentication flow tests
};

// Environment options for testing
export const ENVIRONMENTS = [
  { id: 'local', name: 'Local', url: 'http://localhost:5173' },
  { id: 'dev', name: 'Dev', url: 'https://leaderreps-pd-platform.web.app' },
  { id: 'test', name: 'Test', url: 'https://leaderreps-test.web.app' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CALCULATED TOTALS (auto-calculated from above)
// ═══════════════════════════════════════════════════════════════════════════════

// Manual test totals
export const MANUAL_TOTAL_SCENARIOS = Object.values(MANUAL_TEST_SCRIPTS).reduce((sum, s) => sum + s.scenarios, 0);
export const MANUAL_CRITICAL_PATH = MANUAL_TEST_SCRIPTS.smoke.scenarios;
export const MANUAL_SUITE_COUNT = Object.keys(MANUAL_TEST_SCRIPTS).length;

// E2E test totals
export const E2E_SUITES_TOTAL = Object.values(E2E_TEST_SUITES).reduce((sum, s) => sum + s.count, 0);
export const E2E_JOURNEYS_TOTAL = Object.values(E2E_JOURNEY_TESTS).reduce((sum, s) => sum + s.count, 0);

// Legacy exports for backward compatibility
export const TEST_SUITES = E2E_TEST_SUITES;
export const TOTAL_TEST_COUNT = E2E_SUITES_TOTAL;

