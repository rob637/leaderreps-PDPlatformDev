/**
 * E2E Test Utilities and Helpers
 * 
 * Common utilities used across all automated test suites
 * 
 * USAGE:
 *   import { login, waitForPageLoad, SELECTORS } from '../utils/test-helpers';
 */

import { expect } from '@playwright/test';

// Environment URLs
export const ENVIRONMENTS = {
  local: 'http://localhost:5173',
  test: 'https://leaderreps-test.web.app',
  prod: 'https://leaderreps-pd-platform.web.app'
};

// Get current environment URL
export function getBaseUrl() {
  const env = process.env.E2E_ENV || 'local';
  return ENVIRONMENTS[env] || ENVIRONMENTS.local;
}

// Test credentials (use environment variables in CI)
export const TEST_CREDENTIALS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'rob@sagecg.com',
    password: process.env.E2E_ADMIN_PASSWORD || ''
  },
  user: {
    email: process.env.E2E_USER_EMAIL || '',
    password: process.env.E2E_USER_PASSWORD || ''
  },
  prepUser: {
    email: process.env.E2E_PREP_USER_EMAIL || '',
    password: process.env.E2E_PREP_USER_PASSWORD || ''
  }
};

// Common selectors - organized by feature area
export const SELECTORS = {
  // Auth
  auth: {
    emailInput: '[data-testid="email-input"], input[type="email"], input[name="email"]',
    passwordInput: '[data-testid="password-input"], input[type="password"], input[name="password"]',
    loginButton: '[data-testid="login-button"], button:has-text("Sign In"), button[type="submit"]',
    logoutButton: '[data-testid="logout-button"], button:has-text("Sign Out"), button:has-text("Logout")',
    signupLink: 'a:has-text("Sign Up"), a:has-text("Create Account")',
    forgotPassword: 'a:has-text("Forgot"), a:has-text("Reset")',
  },
  
  // Navigation
  nav: {
    sidebar: '[data-testid="sidebar"], nav, aside',
    dashboardLink: 'text=/dashboard/i, [data-testid="nav-dashboard"]',
    devPlanLink: 'text=/dev.*plan|development/i, [data-testid="nav-devplan"]',
    contentLink: 'text=/content|library/i, [data-testid="nav-content"]',
    communityLink: 'text=/community/i, [data-testid="nav-community"]',
    coachingLink: 'text=/coaching|labs/i, [data-testid="nav-coaching"]',
    lockerLink: 'text=/locker/i, [data-testid="nav-locker"]',
    adminLink: 'text=/admin/i, [data-testid="nav-admin"]',
    mobileNav: '[data-testid="mobile-nav"], .mobile-nav',
  },
  
  // Dashboard widgets
  dashboard: {
    container: '[data-testid="dashboard"], main',
    greeting: '[data-testid="greeting"], text=/good morning|good afternoon|good evening|welcome/i',
    streakCounter: '[data-testid="streak"], text=/streak|\\d+\\s*day/i',
    weeklyFocus: '[data-testid="weekly-focus"], text=/week \\d+|focus/i',
    groundingRep: '[data-testid="grounding-rep"], text=/grounding|identity/i',
    winTheDay: '[data-testid="win-the-day"], text=/win.*day|what.?s important/i',
    pmReflection: '[data-testid="pm-reflection"], text=/reflection|good.*better.*best/i',
    scorecard: '[data-testid="scorecard"], text=/scorecard/i',
    dailyQuote: '[data-testid="daily-quote"], blockquote, text=/"/i',
  },
  
  // Daily Practice / Commitments
  dailyPractice: {
    container: '[data-testid="daily-practice"]',
    commitmentList: '[data-testid="commitment-list"]',
    commitmentItem: '[data-testid*="commitment-item"]',
    addButton: 'button:has-text("Add"), button:has-text("Manage")',
    committedButton: 'button:has-text("Committed"), button:has-text("Complete")',
    missedButton: 'button:has-text("Missed")',
    resetButton: 'button:has-text("Reset")',
    reflectionInput: 'textarea[name*="reflection"], [data-testid="daily-journal"]',
    historySection: '[data-testid="history"], text=/history|last 7 days/i',
  },
  
  // Content Library
  content: {
    container: '[data-testid="library"], main',
    categoryCard: '[data-testid*="category"]',
    contentItem: '[data-testid*="content-item"], [class*="content-card"]',
    searchInput: 'input[type="search"], input[placeholder*="search" i]',
    filterButton: 'button:has-text("Filter")',
    skillFilter: '[data-testid="skill-filter"]',
    lockIcon: '[data-testid="lock-icon"], svg[class*="lock"]',
    videoPlayer: 'video, iframe[src*="vimeo"], iframe[src*="youtube"]',
    documentViewer: 'iframe, embed, [data-testid="doc-viewer"]',
  },
  
  // Community
  community: {
    container: '[data-testid="community"]',
    tabs: '[data-testid="community-tabs"]',
    feedTab: 'button:has-text("Feed")',
    eventsTab: 'button:has-text("Events")',
    resourcesTab: 'button:has-text("Resources")',
    threadCard: '[data-testid*="thread"]',
    newThreadButton: 'button:has-text("Start Discussion"), button:has-text("New")',
    tierFilter: '[data-testid="tier-filter"]',
    zoneGate: 'text=/unlock|day 15|locked/i',
  },
  
  // Coaching
  coaching: {
    container: '[data-testid="coaching"]',
    tabs: '[data-testid="coaching-tabs"]',
    liveTab: 'button:has-text("Live")',
    onDemandTab: 'button:has-text("On-Demand")',
    myCoachingTab: 'button:has-text("My Coaching")',
    sessionCard: '[data-testid*="session"]',
    registerButton: 'button:has-text("Register")',
    cancelButton: 'button:has-text("Cancel")',
    calendarView: '[data-testid="calendar"]',
    zoneGate: 'text=/unlock|day 22|locked/i',
  },
  
  // Locker
  locker: {
    container: '[data-testid="locker"]',
    journeyWidget: '[data-testid="journey-widget"]',
    winsHistory: '[data-testid="wins-history"]',
    scorecardHistory: '[data-testid="scorecard-history"]',
    notificationSettings: '[data-testid="notification-settings"]',
  },
  
  // Loading states
  loading: {
    spinner: '[data-testid="loading"], .animate-spin, .loading, [class*="loader"]',
    skeleton: '.animate-pulse, [class*="skeleton"]',
  },
  
  // Common UI
  ui: {
    modal: '[role="dialog"], [data-testid*="modal"], [class*="modal"]',
    toast: '[data-testid="toast"], [class*="toast"], [role="alert"]',
    saveButton: 'button:has-text("Save")',
    cancelButton: 'button:has-text("Cancel")',
    confirmButton: 'button:has-text("Confirm"), button:has-text("Yes")',
    closeButton: 'button:has-text("Close"), button[aria-label*="close"]',
  },
  
  // Legacy selectors (for backwards compatibility)
  emailInput: '[data-testid="email-input"], input[type="email"], input[name="email"]',
  passwordInput: '[data-testid="password-input"], input[type="password"], input[name="password"]',
  loginButton: '[data-testid="login-button"], button:has-text("Sign In")',
  logoutButton: '[data-testid="logout-button"], button:has-text("Sign Out"), button:has-text("Logout")',
  sidebar: '[data-testid="sidebar"], nav',
  dashboardLink: '[data-testid="dashboard-link"], a:has-text("Dashboard")',
  contentLibraryLink: '[data-testid="content-library-link"], a:has-text("Content Library")',
  adminLink: '[data-testid="admin-link"], a:has-text("Admin")',
  profileLink: '[data-testid="profile-link"], a:has-text("Profile")',
  dashboard: '[data-testid="dashboard"], .dashboard',
  welcomeMessage: '[data-testid="welcome"], .welcome',
  streakCounter: '[data-testid="streak-counter"], .streak',
  scorecard: '[data-testid="scorecard"], .scorecard',
  groundingRep: '[data-testid="grounding-rep"], .grounding-rep',
  winTheDay: '[data-testid="win-the-day"], .win-the-day',
  dailyReps: '[data-testid="daily-reps"], .daily-reps',
  reflection: '[data-testid="reflection"], .reflection',
  videoPlayer: '[data-testid="video-player"], video',
  contentCard: '[data-testid="content-card"], .content-card',
  searchInput: '[data-testid="search-input"], input[placeholder*="Search"]',
  filterDropdown: '[data-testid="filter-dropdown"], .filter',
  loadingSpinner: '[data-testid="loading"], .animate-spin, .loading',
  skeleton: '.animate-pulse',
};

// Page URLs (relative to base URL)
export const URLS = {
  login: '/',
  signup: '/?signup',
  dashboard: '/',
  devPlan: '/',  // Uses screen navigation
  content: '/',
  community: '/',
  coaching: '/',
  locker: '/',
  admin: '/',
};

/**
 * Wait for page to be fully loaded (no loading spinners)
 * @param {Page} page - Playwright page object
 * @param {number} timeout - Max time to wait in ms (default 10000)
 */
export async function waitForPageLoad(page, timeout = 10000) {
  // Wait for DOM content loaded (don't use networkidle as Firebase keeps connections open)
  await page.waitForLoadState('load');
  
  // Give time for React to render
  await page.waitForTimeout(1000);
  
  // Wait for any loading spinners to disappear
  const spinners = page.locator(SELECTORS.loading.spinner);
  const spinnerCount = await spinners.count();
  if (spinnerCount > 0) {
    try {
      await expect(spinners.first()).not.toBeVisible({ timeout });
    } catch {
      // Spinner may have already disappeared
    }
  }
}

/**
 * Wait for Firestore sync to complete
 * @param {number} ms - Time to wait in ms (default 2000)
 */
export async function waitForFirestoreSync(ms = 2000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Login to the application
 * @param {Page} page - Playwright page object
 * @param {string} email - Optional email (defaults to E2E_ADMIN_EMAIL)
 * @param {string} password - Optional password (defaults to E2E_ADMIN_PASSWORD)
 */
export async function login(page, email, password) {
  const userEmail = email || process.env.E2E_ADMIN_EMAIL;
  const userPassword = password || process.env.E2E_ADMIN_PASSWORD;
  
  if (!userEmail || !userPassword) {
    throw new Error('Login credentials not provided. Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD');
  }
  
  await page.goto('/');
  await waitForPageLoad(page);
  
  // Check if already logged in
  const emailInput = page.locator(SELECTORS.auth.emailInput);
  if (!(await emailInput.isVisible({ timeout: 3000 }).catch(() => false))) {
    // Already logged in
    return;
  }
  
  await emailInput.fill(userEmail);
  await page.locator(SELECTORS.auth.passwordInput).fill(userPassword);
  await page.locator(SELECTORS.auth.loginButton).click();
  
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
