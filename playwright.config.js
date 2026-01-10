/**
 * Playwright E2E Test Configuration
 * 
 * Automates the Manual Test Scripts for LeaderReps PD Platform
 * Supports running against local dev, test, and production environments
 */

import { defineConfig, devices } from '@playwright/test';

// Environment configurations
const ENV_URLS = {
  local: 'http://localhost:5173',
  test: 'https://leaderreps-test.web.app',
  prod: 'https://leaderreps-prod.web.app'
};

// Get target environment from E2E_ENV env var, default to test
const targetEnv = process.env.E2E_ENV || 'test';
const baseURL = ENV_URLS[targetEnv] || ENV_URLS.test;

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
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // Global timeout
  timeout: 60000,
  
  // Shared settings for all the projects below
  use: {
    baseURL,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure (useful for debugging)
    video: 'retain-on-failure',
    
    // Viewport size (responsive design)
    viewport: { width: 1280, height: 720 },
    
    // Slow down actions for visibility during debugging
    // launchOptions: { slowMo: 100 },
  },

  // Test projects for different configurations
  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
    },
    
    // Desktop Chrome tests
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use authenticated state
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    
    // Admin-specific tests
    {
      name: 'admin',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    
    // Unauthenticated tests (login, signup)
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /auth.*\.spec\.js/,
    },
  ],

  // Run your local dev server before starting the tests (optional)
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
});
