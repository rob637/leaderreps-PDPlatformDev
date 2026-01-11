/**
 * E2E Test Suite Configuration
 * 
 * Central source of truth for test suite definitions and counts.
 * Update the 'count' values here when adding/removing tests.
 * The TOTAL_TEST_COUNT will update automatically.
 * 
 * LAST AUDIT: Jan 2026 (grep -c "test('" on each file)
 */

// Individual test suites (suites/ folder - 133 total)
export const TEST_SUITES = {
  auth: { id: 'suite-auth', name: 'Auth', count: 16, icon: 'Shield', color: 'gray' },
  prep: { id: 'suite-prep', name: 'Prep', count: 14, icon: 'UserCheck', color: 'purple' },
  am: { id: 'suite-am', name: 'AM', count: 21, icon: 'Sun', color: 'amber' },
  pm: { id: 'suite-pm', name: 'PM', count: 13, icon: 'Moon', color: 'indigo' },
  content: { id: 'suite-content', name: 'Content', count: 22, icon: 'Library', color: 'blue' },
  post: { id: 'suite-post', name: 'Post', count: 12, icon: 'GraduationCap', color: 'green' },
  zones: { id: 'suite-zones', name: 'Zones', count: 35, icon: 'Map', color: 'teal' },
};

// Quick run command counts
// These are ACTUAL test counts from grep -c "test('" on each file
export const QUICK_COMMAND_COUNTS = {
  smoke: 16,    // smoke.spec.js - Critical, run before every deploy
  auth: 14,     // auth.spec.js - High priority authentication tests
  suites: 133,  // All 7 suite files combined
};

// Environment options for testing
export const ENVIRONMENTS = [
  { id: 'local', name: 'Local', url: 'http://localhost:5173' },
  { id: 'dev', name: 'Dev', url: 'https://leaderreps-pd-platform.web.app' },
  { id: 'test', name: 'Test', url: 'https://leaderreps-test.web.app' },
];

export const TOTAL_TEST_COUNT = Object.values(TEST_SUITES).reduce((sum, suite) => sum + suite.count, 0);

