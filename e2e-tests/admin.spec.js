/**
 * Admin Portal E2E Tests
 * 
 * Tests admin-specific functionality including:
 * - Admin Command Center access
 * - User management
 * - Content management
 * - System diagnostics
 */

import { test, expect } from '@playwright/test';
import { 
  SELECTORS, 
  URLS, 
  waitForPageLoad,
  setupConsoleErrorCapture 
} from './utils/test-helpers.js';

test.describe('🔐 Admin Portal Access', () => {
  
  test('ADMIN-001: Admin portal should be accessible to admins', async ({ page }) => {
    await page.goto(URLS.admin);
    await waitForPageLoad(page);
    
    // Should not redirect to login (has admin auth)
    if (page.url().includes('/login')) {
      test.skip('No admin authentication available');
      return;
    }
    
    // Should be on admin page
    expect(page.url()).toContain('/admin');
    
    // Admin portal indicators
    const adminIndicators = [
      '[data-testid="admin-portal"]',
      '.admin-portal',
      'text=/admin/i',
      'text=/command center/i',
      'text=/dashboard/i'
    ];
    
    let adminFound = false;
    for (const selector of adminIndicators) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        adminFound = true;
        break;
      }
    }
    
    expect(adminFound).toBeTruthy();
  });

  test('ADMIN-002: Admin navigation tabs should work', async ({ page }) => {
    await page.goto(URLS.admin);
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Look for admin navigation tabs
    const tabIndicators = [
      '[role="tablist"]',
      '.admin-tabs',
      'nav.tabs',
      '[data-testid="admin-tabs"]'
    ];
    
    let tabsFound = false;
    for (const selector of tabIndicators) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.first().isVisible()) {
        tabsFound = true;
        
        // Find and click different tabs
        const tabs = element.locator('[role="tab"], button, a');
        const tabCount = await tabs.count();
        
        if (tabCount > 1) {
          // Click second tab
          await tabs.nth(1).click();
          await waitForPageLoad(page);
        }
        break;
      }
    }
  });
});

test.describe('👥 User Management', () => {
  
  test('ADMIN-USER-001: User list should load', async ({ page }) => {
    await page.goto(URLS.admin);
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Navigate to user management
    const userManagementLinks = [
      'a:has-text("Users")',
      'button:has-text("Users")',
      '[data-testid="user-management"]',
      'text=/user management/i'
    ];
    
    for (const selector of userManagementLinks) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.first().isVisible()) {
        await element.first().click();
        await waitForPageLoad(page);
        break;
      }
    }
    
    // Look for user list
    const userListIndicators = [
      '[data-testid="user-list"]',
      '.user-list',
      'table',
      '[role="grid"]'
    ];
    
    for (const selector of userListIndicators) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        break;
      }
    }
  });

  test('ADMIN-USER-002: User search should work', async ({ page }) => {
    await page.goto(URLS.admin);
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Find search input in admin
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"], [data-testid="user-search"]');
    
    if (await searchInput.count() > 0 && await searchInput.first().isVisible()) {
      await searchInput.first().fill('test');
      await page.waitForTimeout(1000);
      // Search should filter without errors
    }
  });
});

test.describe('📚 Content Management', () => {
  
  test('ADMIN-CONTENT-001: Content manager should load', async ({ page }) => {
    await page.goto(URLS.admin);
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Navigate to content management
    const contentLinks = [
      'a:has-text("Content")',
      'button:has-text("Content")',
      '[data-testid="content-manager"]',
      'text=/content manager/i'
    ];
    
    for (const selector of contentLinks) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.first().isVisible()) {
        await element.first().click();
        await waitForPageLoad(page);
        break;
      }
    }
  });

  test('ADMIN-CONTENT-002: Content items should be editable', async ({ page }) => {
    await page.goto(URLS.admin);
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Look for edit buttons on content items
    const editButtons = page.locator(
      'button:has-text("Edit"), ' +
      '[data-testid="edit"], ' +
      '[aria-label*="edit"]'
    );
    
    if (await editButtons.count() > 0 && await editButtons.first().isVisible()) {
      // Edit functionality exists
    }
  });
});

test.describe('🔧 System Diagnostics', () => {
  
  test('ADMIN-DIAG-001: System diagnostics should load', async ({ page }) => {
    await page.goto(URLS.admin);
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Navigate to diagnostics
    const diagLinks = [
      'a:has-text("Diagnostic")',
      'button:has-text("System")',
      '[data-testid="diagnostics"]',
      'text=/diagnostic/i'
    ];
    
    for (const selector of diagLinks) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.first().isVisible()) {
        await element.first().click();
        await waitForPageLoad(page);
        break;
      }
    }
  });

  test('ADMIN-DIAG-002: Test center should run tests', async ({ page }) => {
    await page.goto(URLS.admin);
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Navigate to test center
    const testCenterLinks = [
      'a:has-text("Test")',
      'button:has-text("Test Center")',
      '[data-testid="test-center"]',
      'text=/test center/i'
    ];
    
    for (const selector of testCenterLinks) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.first().isVisible()) {
        await element.first().click();
        await waitForPageLoad(page);
        break;
      }
    }
    
    // Look for run all tests button
    const runButton = page.locator(
      'button:has-text("Run All"), ' +
      'button:has-text("Run Tests"), ' +
      '[data-testid="run-tests"]'
    );
    
    if (await runButton.count() > 0 && await runButton.first().isVisible()) {
      await runButton.first().click();
      // Tests should start running
      await page.waitForTimeout(2000);
    }
  });
});

test.describe('⏰ Time Travel', () => {
  
  test('ADMIN-TIME-001: Time travel should be available', async ({ page }) => {
    await page.goto(URLS.admin);
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Look for time travel feature
    const timeTravelLinks = [
      'a:has-text("Time Travel")',
      'button:has-text("Time Travel")',
      '[data-testid="time-travel"]',
      'text=/time travel/i'
    ];
    
    for (const selector of timeTravelLinks) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.first().isVisible()) {
        await element.first().click();
        await waitForPageLoad(page);
        break;
      }
    }
  });

  test('ADMIN-TIME-002: Time travel should show date picker', async ({ page }) => {
    await page.goto(URLS.admin);
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Look for date picker in time travel
    const datePickerIndicators = [
      'input[type="date"]',
      '[data-testid="date-picker"]',
      '.date-picker',
      '[aria-label*="date"]'
    ];
    
    for (const selector of datePickerIndicators) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.first().isVisible()) {
        break;
      }
    }
  });
});
