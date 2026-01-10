/**
 * Authentication Setup - Save authenticated state for reuse
 * 
 * This runs first to authenticate and save the browser state
 * so subsequent tests don't need to log in again.
 */

import { test as setup, expect } from '@playwright/test';
import { TEST_CREDENTIALS, SELECTORS, waitForPageLoad } from './utils/test-helpers.js';

const adminAuthFile = 'playwright/.auth/admin.json';
const userAuthFile = 'playwright/.auth/user.json';

setup('authenticate as admin', async ({ page }) => {
  // Skip if no admin credentials provided
  if (!TEST_CREDENTIALS.admin.email || !TEST_CREDENTIALS.admin.password) {
    console.log('⚠️ Admin credentials not set. Skipping admin auth setup.');
    console.log('   Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD environment variables.');
    
    // Create empty auth file
    await page.context().storageState({ path: adminAuthFile });
    return;
  }

  console.log(`🔐 Authenticating as admin: ${TEST_CREDENTIALS.admin.email}`);
  
  await page.goto('/login');
  
  // Fill login form
  await page.locator(SELECTORS.emailInput).fill(TEST_CREDENTIALS.admin.email);
  await page.locator(SELECTORS.passwordInput).fill(TEST_CREDENTIALS.admin.password);
  await page.locator(SELECTORS.loginButton).click();
  
  // Wait for successful login and redirect
  await page.waitForURL(/dashboard|prep|daily|admin/, { timeout: 30000 });
  await waitForPageLoad(page);
  
  // Verify we're logged in
  const url = page.url();
  expect(url).not.toContain('/login');
  
  console.log('✅ Admin authentication successful');
  
  // Save authentication state
  await page.context().storageState({ path: adminAuthFile });
});

setup('authenticate as regular user', async ({ page }) => {
  // Skip if no user credentials provided
  if (!TEST_CREDENTIALS.user.email || !TEST_CREDENTIALS.user.password) {
    console.log('⚠️ User credentials not set. Will reuse admin auth for user tests.');
    console.log('   Set E2E_USER_EMAIL and E2E_USER_PASSWORD environment variables.');
    
    // Copy admin auth to user auth if admin exists
    if (TEST_CREDENTIALS.admin.email && TEST_CREDENTIALS.admin.password) {
      await page.goto('/login');
      await page.locator(SELECTORS.emailInput).fill(TEST_CREDENTIALS.admin.email);
      await page.locator(SELECTORS.passwordInput).fill(TEST_CREDENTIALS.admin.password);
      await page.locator(SELECTORS.loginButton).click();
      await page.waitForURL(/dashboard|prep|daily|admin/, { timeout: 30000 });
      await page.context().storageState({ path: userAuthFile });
    } else {
      await page.context().storageState({ path: userAuthFile });
    }
    return;
  }

  console.log(`🔐 Authenticating as user: ${TEST_CREDENTIALS.user.email}`);
  
  await page.goto('/login');
  
  // Fill login form
  await page.locator(SELECTORS.emailInput).fill(TEST_CREDENTIALS.user.email);
  await page.locator(SELECTORS.passwordInput).fill(TEST_CREDENTIALS.user.password);
  await page.locator(SELECTORS.loginButton).click();
  
  // Wait for successful login
  await page.waitForURL(/dashboard|prep|daily/, { timeout: 30000 });
  await waitForPageLoad(page);
  
  console.log('✅ User authentication successful');
  
  // Save authentication state
  await page.context().storageState({ path: userAuthFile });
});
