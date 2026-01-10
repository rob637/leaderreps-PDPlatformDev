/**
 * E2E Test Utilities and Helpers
 * 
 * Common utilities used across all automated test suites
 */

import { expect } from '@playwright/test';

// Test credentials (use environment variables in CI)
export const TEST_CREDENTIALS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'rob@sagecg.com',
    password: process.env.E2E_ADMIN_PASSWORD || ''
  },
  user: {
    email: process.env.E2E_USER_EMAIL || '',
    password: process.env.E2E_USER_PASSWORD || ''
  }
};

// Common selectors
export const SELECTORS = {
  // Auth
  emailInput: '[data-testid="email-input"], input[type="email"], input[name="email"]',
  passwordInput: '[data-testid="password-input"], input[type="password"], input[name="password"]',
  loginButton: '[data-testid="login-button"], button:has-text("Sign In")',
  logoutButton: '[data-testid="logout-button"], button:has-text("Sign Out"), button:has-text("Logout")',
  
  // Navigation
  sidebar: '[data-testid="sidebar"], nav',
  dashboardLink: '[data-testid="dashboard-link"], a:has-text("Dashboard")',
  contentLibraryLink: '[data-testid="content-library-link"], a:has-text("Content Library")',
  adminLink: '[data-testid="admin-link"], a:has-text("Admin")',
  profileLink: '[data-testid="profile-link"], a:has-text("Profile")',
  
  // Dashboard
  dashboard: '[data-testid="dashboard"], .dashboard',
  welcomeMessage: '[data-testid="welcome"], .welcome',
  streakCounter: '[data-testid="streak-counter"], .streak',
  scorecard: '[data-testid="scorecard"], .scorecard',
  
  // Daily Practice
  groundingRep: '[data-testid="grounding-rep"], .grounding-rep',
  winTheDay: '[data-testid="win-the-day"], .win-the-day',
  dailyReps: '[data-testid="daily-reps"], .daily-reps',
  reflection: '[data-testid="reflection"], .reflection',
  
  // Content Library
  videoPlayer: '[data-testid="video-player"], video',
  contentCard: '[data-testid="content-card"], .content-card',
  searchInput: '[data-testid="search-input"], input[placeholder*="Search"]',
  filterDropdown: '[data-testid="filter-dropdown"], .filter',
  
  // Loading states
  loadingSpinner: '[data-testid="loading"], .animate-spin, .loading',
  skeleton: '.animate-pulse',
};

// Page URLs
export const URLS = {
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  contentLibrary: '/content-library',
  admin: '/admin',
  profile: '/profile',
  prepPhase: '/prep',
  dailyPractice: '/daily',
};

/**
 * Wait for page to be fully loaded (no loading spinners)
 */
export async function waitForPageLoad(page) {
  // Wait for DOM content loaded (don't use networkidle as Firebase keeps connections open)
  await page.waitForLoadState('load');
  
  // Give time for React to render
  await page.waitForTimeout(1000);
  
  // Wait for any loading spinners to disappear
  const spinners = page.locator(SELECTORS.loadingSpinner);
  const spinnerCount = await spinners.count();
  if (spinnerCount > 0) {
    try {
      await expect(spinners.first()).not.toBeVisible({ timeout: 10000 });
    } catch {
      // Spinner may have already disappeared
    }
  }
}

/**
 * Login to the application
 */
export async function login(page, email, password) {
  await page.goto(URLS.login);
  await page.locator(SELECTORS.emailInput).fill(email);
  await page.locator(SELECTORS.passwordInput).fill(password);
  await page.locator(SELECTORS.loginButton).click();
  
  // Wait for redirect to dashboard
  await page.waitForURL(/dashboard|prep|daily/, { timeout: 30000 });
  await waitForPageLoad(page);
}

/**
 * Logout from the application
 */
export async function logout(page) {
  // Try to find and click profile/menu first
  const profileMenuTriggers = [
    '[data-testid="profile-menu"]',
    'button:has(.avatar)',
    '[aria-label*="profile"]',
    '.profile-avatar'
  ];
  
  for (const trigger of profileMenuTriggers) {
    const element = page.locator(trigger);
    if (await element.isVisible()) {
      await element.click();
      break;
    }
  }
  
  // Click logout
  await page.locator(SELECTORS.logoutButton).click();
  
  // Wait for redirect to login
  await page.waitForURL(/login/, { timeout: 15000 });
}

/**
 * Navigate using sidebar
 */
export async function navigateTo(page, destination) {
  const linkSelectors = {
    dashboard: SELECTORS.dashboardLink,
    contentLibrary: SELECTORS.contentLibraryLink,
    admin: SELECTORS.adminLink,
    profile: SELECTORS.profileLink,
  };
  
  const selector = linkSelectors[destination];
  if (selector) {
    await page.locator(selector).click();
    await waitForPageLoad(page);
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page) {
  // Check if we're on a protected page or have auth indicators
  const url = page.url();
  const isOnLoginPage = url.includes('/login') || url.includes('/signup');
  return !isOnLoginPage;
}

/**
 * Take a screenshot with descriptive name
 */
export async function captureScreenshot(page, testName, step) {
  const filename = `${testName}-${step}-${Date.now()}.png`;
  await page.screenshot({ 
    path: `test-results/screenshots/${filename}`,
    fullPage: true 
  });
  return filename;
}

/**
 * Wait for toast/notification message
 */
export async function waitForToast(page, expectedText) {
  const toastSelectors = [
    '[data-testid="toast"]',
    '.toast',
    '[role="alert"]',
    '.notification'
  ];
  
  for (const selector of toastSelectors) {
    const toast = page.locator(selector);
    const count = await toast.count();
    if (count > 0) {
      await expect(toast.first()).toContainText(expectedText);
      return true;
    }
  }
  return false;
}

/**
 * Check for error messages
 */
export async function checkForErrors(page) {
  const errorSelectors = [
    '[data-testid="error"]',
    '.error-message',
    '[role="alert"][class*="error"]',
    '.text-red-500',
    '.text-red-600'
  ];
  
  const errors = [];
  for (const selector of errorSelectors) {
    const elements = page.locator(selector);
    const count = await elements.count();
    for (let i = 0; i < count; i++) {
      const text = await elements.nth(i).textContent();
      if (text) errors.push(text.trim());
    }
  }
  return errors;
}

/**
 * Assert no console errors
 */
export function setupConsoleErrorCapture(page) {
  const consoleErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    consoleErrors.push(error.message);
  });
  
  return {
    getErrors: () => consoleErrors,
    hasErrors: () => consoleErrors.length > 0,
    assertNoErrors: () => {
      if (consoleErrors.length > 0) {
        throw new Error(`Console errors detected:\n${consoleErrors.join('\n')}`);
      }
    }
  };
}

/**
 * Mobile-specific utilities
 */
export async function openMobileMenu(page) {
  const menuButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"], .hamburger');
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }
}

/**
 * Format test result for reporting
 */
export function formatTestResult(testName, passed, duration, details = {}) {
  return {
    testName,
    passed,
    duration,
    timestamp: new Date().toISOString(),
    ...details
  };
}

/**
 * Retry helper for flaky operations
 */
export async function retry(fn, maxRetries = 3, delay = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
