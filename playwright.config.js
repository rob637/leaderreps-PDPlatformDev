/**
 * Playwright E2E Test Configuration
 * 
 * Automates the Manual Test Scripts for LeaderReps PD Platform
 * Supports running against local dev, test, and production environments
 * 
 * JOURNEY TEST SUITES:
 *   - prep-phase: New user onboarding and prep completion (18 tests)
 *   - daily-practice: AM/PM bookends, scorecard, commitments (27 tests)
 *   - content-library: Content browsing, filtering, viewing (28 tests)
 *   - zones: Community & Coaching zone-gated features (35 tests)
 * 
 * RUN COMMANDS:
 *   All tests:       npx playwright test
 *   Specific suite:  npx playwright test --project=daily-practice
 *   With UI:         npx playwright test --ui
 *   Headed:          npx playwright test --headed
 */

import { defineConfig, devices } from '@playwright/test';

// Environment configurations
const ENV_URLS = {
  local: 'http://localhost:5173',
  dev: 'https://leaderreps-pd-platform.web.app',
  test: 'https://leaderreps-test.web.app',
  prod: 'https://leaderreps-prod.web.app'
};

// Get target environment from E2E_ENV env var, default to dev
const targetEnv = process.env.E2E_ENV || 'dev';
const baseURL = ENV_URLS[targetEnv] || ENV_URLS.dev;

export default defineConfig({
  testDir: './e2e-tests',
  
  // Run tests in parallel for speed
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI for stability
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use - skip Firestore reporter in CI (no credentials available)
  reporter: process.env.CI ? [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ] : [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
    // Firestore reporter - uploads results to app for display
    ['./e2e-tests/reporters/firestore-reporter.js']
  ],
  
  // Global timeout
  timeout: 60000,
  
  // Shared settings for all the projects below
  use: {
    baseURL,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot only on failure (saves storage, enables cloud upload)
    screenshot: 'only-on-failure',
    
    // Video on failure only (saves storage)
    video: 'retain-on-failure',
    
    // Viewport size (responsive design)
    viewport: { width: 1280, height: 720 },
    
    // Slow down actions for visibility during debugging
    // launchOptions: { slowMo: 100 },
  },

  // Test projects for different configurations
  projects: [
    // ═══════════════════════════════════════════════════════════════
    // SETUP PROJECT - Authentication State Preparation
    // ═══════════════════════════════════════════════════════════════
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    
    // ═══════════════════════════════════════════════════════════════
    // JOURNEY TEST SUITES - Feature-Based User Journeys
    // ═══════════════════════════════════════════════════════════════
    
    // Prep Phase Journey (18 tests)
    // Tests: Account creation, profile setup, baseline assessment, prep actions
    {
      name: 'prep-phase',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /journeys\/prep-phase\.spec\.js/,
    },
    
    // Daily Practice Journey (27 tests)
    // Tests: AM bookend, PM reflection, scorecard, commitments, streak
    {
      name: 'daily-practice',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      testMatch: /journeys\/daily-practice\.spec\.js/,
      dependencies: ['setup'],
    },
    
    // Content Library Journey (28 tests)
    // Tests: Content browsing, filtering, video/doc viewing, search
    {
      name: 'content-library',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      testMatch: /journeys\/content-library\.spec\.js/,
      dependencies: ['setup'],
    },
    
    // Zones Journey (35 tests)
    // Tests: Community (Day 15+), Coaching (Day 22+), Locker
    {
      name: 'zones',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      testMatch: /journeys\/zones\.spec\.js/,
      dependencies: ['setup'],
    },
    
    // ═══════════════════════════════════════════════════════════════
    // GENERAL TEST PROJECTS
    // ═══════════════════════════════════════════════════════════════
    
    // Desktop Chrome tests (all non-journey tests)
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      testIgnore: /journeys\/.*/,
      dependencies: ['setup'],
    },
    
    // Mobile Safari tests
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 13'],
        storageState: 'playwright/.auth/user.json',
      },
      testMatch: /mobile.*\.spec\.js/,
      dependencies: ['setup'],
    },
    
    // Admin-specific tests
    {
      name: 'admin',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      testMatch: /admin.*\.spec\.js/,
      dependencies: ['setup'],
    },
    
    // Unauthenticated tests (login, signup)
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth.*\.spec\.js/,
    },
    
    // ═══════════════════════════════════════════════════════════════
    // FULL TEST SUITES - Matching Manual Test Scripts (168 scenarios)
    // ═══════════════════════════════════════════════════════════════
    
    // Authentication Suite (16 tests) - 06-authentication.md
    {
      name: 'suite-auth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /suites\/01-authentication\.spec\.js/,
    },
    
    // Prep Phase Suite (14 tests) - 01-prep-phase.md
    {
      name: 'suite-prep',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /suites\/02-prep-phase\.spec\.js/,
    },
    
    // AM Bookend Suite (21 tests) - 02-dev-am-bookend.md
    {
      name: 'suite-am',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /suites\/03-am-bookend\.spec\.js/,
    },
    
    // PM Bookend Suite (13 tests) - 03-dev-pm-bookend.md
    {
      name: 'suite-pm',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /suites\/04-pm-bookend\.spec\.js/,
    },
    
    // Content Library Suite (22 tests) - 04-content-library.md
    {
      name: 'suite-content',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /suites\/05-content-library\.spec\.js/,
    },
    
    // Post Phase Suite (12 tests) - 05-post-phase.md
    {
      name: 'suite-post',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /suites\/06-post-phase\.spec\.js/,
    },
    
    // Zones Suite (35 tests) - 07-zones.md
    {
      name: 'suite-zones',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /suites\/07-zones\.spec\.js/,
    },
    
    // ALL SUITES - Run all 168 manual test scenario automations
    {
      name: 'all-suites',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /suites\/.*\.spec\.js/,
    },
  ],

  // Run your local dev server before starting the tests (optional)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
});
