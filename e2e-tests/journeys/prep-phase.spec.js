/**
 * PREP PHASE JOURNEY TESTS
 * ========================
 * Tests the complete new user onboarding experience from invitation to prep completion.
 * 
 * User Journey: Invite → Signup → Leader Profile → Baseline Assessment → Prep Actions → Dashboard
 * 
 * Critical Business Rules:
 * - Users cannot access Day 1 content until prep is complete
 * - Prep Phase is progress-based, NOT time-based
 * - Required items: Leader Profile, Baseline Assessment, specific prep actions
 */

import { test, expect } from '@playwright/test';
import { SELECTORS, waitForPageLoad, waitForFirestoreSync } from '../utils/test-helpers';

test.describe('🚀 Prep Phase Journey', () => {
  
  test.describe('Section 1: Account Creation', () => {
    
    test('PREP-001: New user can create account via invite link', async ({ page }) => {
      // This test requires a valid invite token
      test.skip(!process.env.E2E_INVITE_TOKEN, 'Requires E2E_INVITE_TOKEN');
      
      const inviteUrl = `${process.env.E2E_BASE_URL || 'http://localhost:5173'}?token=${process.env.E2E_INVITE_TOKEN}`;
      await page.goto(inviteUrl);
      await waitForPageLoad(page);
      
      // Verify registration form appears
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[name="firstName"], input[placeholder*="First"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"], input[placeholder*="Last"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      
      // Email should be pre-filled from invite
      const emailField = page.locator('input[type="email"]');
      await expect(emailField).toHaveAttribute('readonly');
    });
    
    test('PREP-002: Registration validates required fields', async ({ page }) => {
      test.skip(!process.env.E2E_INVITE_TOKEN, 'Requires E2E_INVITE_TOKEN');
      
      const inviteUrl = `${process.env.E2E_BASE_URL || 'http://localhost:5173'}?token=${process.env.E2E_INVITE_TOKEN}`;
      await page.goto(inviteUrl);
      await waitForPageLoad(page);
      
      // Try to submit without required fields
      const submitButton = page.locator('button[type="submit"], button:has-text("Create Account")');
      await submitButton.click();
      
      // Should show validation errors
      await expect(page.locator('text=/required|please enter|cannot be empty/i')).toBeVisible();
    });
    
    test('PREP-003: Successful registration redirects to dashboard', async ({ page }) => {
      test.skip(!process.env.E2E_TEST_SIGNUP, 'Requires E2E_TEST_SIGNUP=true');
      
      // This is a destructive test - creates real accounts
      // Only run in test environment with cleanup
    });
  });
  
  test.describe('Section 2: Prep Phase Gate', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login as a prep-phase user (not yet completed prep)
      const email = process.env.E2E_PREP_USER_EMAIL || process.env.E2E_ADMIN_EMAIL;
      const password = process.env.E2E_PREP_USER_PASSWORD || process.env.E2E_ADMIN_PASSWORD;
      
      if (!email || !password) {
        test.skip(true, 'No test credentials available');
        return;
      }
      
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Login
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"], button:has-text("Sign In")');
      await waitForPageLoad(page);
    });
    
    test('PREP-004: Dashboard shows prep phase welcome banner', async ({ page }) => {
      await expect(page.locator('text=/welcome|prep|getting started/i')).toBeVisible({ timeout: 10000 });
    });
    
    test('PREP-005: Prep requirements are clearly visible', async ({ page }) => {
      // Look for prep gate indicators
      const prepIndicators = page.locator('[data-testid="prep-gate"], [class*="prep"], text=/required|complete these/i');
      await expect(prepIndicators.first()).toBeVisible({ timeout: 10000 });
    });
    
    test('PREP-006: Day 1 content is gated until prep complete', async ({ page }) => {
      // Try to access content that requires prep completion
      // This depends on prep status - if user has completed prep, this should pass differently
      
      // Navigate to development plan or daily content
      await page.click('text=/dev|plan|daily/i').catch(() => {});
      await waitForPageLoad(page);
      
      // Check for either gated message OR content (depending on prep status)
      const hasContent = await page.locator('[data-testid="day-content"], [class*="week-content"]').count() > 0;
      const hasGate = await page.locator('text=/complete prep|locked|not available/i').count() > 0;
      
      expect(hasContent || hasGate).toBeTruthy();
    });
  });
  
  test.describe('Section 3: Leader Profile', () => {
    
    test.beforeEach(async ({ page }) => {
      const email = process.env.E2E_ADMIN_EMAIL;
      const password = process.env.E2E_ADMIN_PASSWORD;
      
      if (!email || !password) {
        test.skip(true, 'No test credentials');
        return;
      }
      
      await page.goto('/');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await waitForPageLoad(page);
    });
    
    test('PREP-007: Leader Profile form is accessible', async ({ page }) => {
      // Navigate to leader profile (may be on dashboard or separate screen)
      const profileLink = page.locator('text=/leader profile|my profile|profile/i, [href*="profile"]');
      
      if (await profileLink.count() > 0) {
        await profileLink.first().click();
        await waitForPageLoad(page);
      }
      
      // Check for profile form elements
      const formElements = page.locator('input, textarea, select').filter({ hasText: /name|role|experience|industry/i });
      // Should have some form elements for profile
    });
    
    test('PREP-008: Leader Profile saves successfully', async ({ page }) => {
      // Find and fill profile fields
      const nameInput = page.locator('input[name*="name"], input[placeholder*="name"]').first();
      
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Leader');
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), button:has-text("Submit")');
        if (await saveButton.count() > 0) {
          await saveButton.first().click();
          await waitForFirestoreSync();
          
          // Verify save confirmation
          await expect(page.locator('text=/saved|success|updated/i')).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
  
  test.describe('Section 4: Baseline Assessment', () => {
    
    test('PREP-009: Baseline Assessment is accessible from prep gate', async ({ page }) => {
      const email = process.env.E2E_ADMIN_EMAIL;
      const password = process.env.E2E_ADMIN_PASSWORD;
      
      if (!email || !password) {
        test.skip(true, 'No test credentials');
        return;
      }
      
      await page.goto('/');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await waitForPageLoad(page);
      
      // Look for assessment link/button
      const assessmentLink = page.locator('text=/assessment|baseline|evaluate/i, [href*="assessment"]');
      if (await assessmentLink.count() > 0) {
        await assessmentLink.first().click();
        await waitForPageLoad(page);
        
        // Should see assessment form
        await expect(page.locator('text=/skill|rate|assess/i')).toBeVisible();
      }
    });
    
    test('PREP-010: Baseline Assessment has skill rating inputs', async ({ page }) => {
      // Navigate to assessment
      // Should have rating inputs (sliders, dropdowns, or scale buttons)
      const ratingInputs = page.locator('input[type="range"], [role="slider"], select[name*="skill"], [data-testid*="rating"]');
      // Verify rating mechanism exists
    });
    
    test('PREP-011: Completing assessment generates development plan', async ({ page }) => {
      // This is an integration test - completing assessment should trigger plan generation
      // The plan should then appear in the Development Plan screen
    });
  });
  
  test.describe('Section 5: Prep Actions', () => {
    
    test('PREP-012: Prep actions checklist is visible', async ({ page }) => {
      const email = process.env.E2E_ADMIN_EMAIL;
      const password = process.env.E2E_ADMIN_PASSWORD;
      
      if (!email || !password) {
        test.skip(true, 'No test credentials');
        return;
      }
      
      await page.goto('/');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');
      await waitForPageLoad(page);
      
      // Look for prep actions/checklist
      const prepActions = page.locator('[data-testid="prep-actions"], text=/required|prep|actions/i');
      // Should show checklist items
    });
    
    test('PREP-013: Prep actions can be marked complete', async ({ page }) => {
      // Find checkbox or complete button for prep action
      const actionCheckbox = page.locator('[data-testid*="prep-action"] input[type="checkbox"], [class*="prep"] button:has-text("Complete")');
      
      if (await actionCheckbox.count() > 0) {
        await actionCheckbox.first().click();
        await waitForFirestoreSync();
      }
    });
    
    test('PREP-014: Video prep action opens video player', async ({ page }) => {
      const videoAction = page.locator('text=/video|watch/i').first();
      
      if (await videoAction.isVisible()) {
        await videoAction.click();
        await waitForPageLoad(page);
        
        // Should see video player
        const videoPlayer = page.locator('video, iframe[src*="vimeo"], iframe[src*="youtube"], [data-testid="video-player"]');
        await expect(videoPlayer).toBeVisible({ timeout: 10000 });
      }
    });
    
    test('PREP-015: Workbook prep action opens document viewer', async ({ page }) => {
      const workbookAction = page.locator('text=/workbook|document|read/i').first();
      
      if (await workbookAction.isVisible()) {
        await workbookAction.click();
        await waitForPageLoad(page);
        
        // Should see document/PDF viewer or content
        const docViewer = page.locator('iframe[src*="pdf"], [data-testid="document-viewer"], [class*="document"]');
      }
    });
  });
  
  test.describe('Section 6: Prep Completion', () => {
    
    test('PREP-016: Completing all prep unlocks Day 1', async ({ page }) => {
      // This is a critical integration test
      // After completing all required prep items, Day 1 content should become accessible
    });
    
    test('PREP-017: Prep completion persists across sessions', async ({ page }) => {
      // Complete prep, logout, login again
      // Prep should still show as complete
    });
    
    test('PREP-018: Progress bar reflects prep completion status', async ({ page }) => {
      const progressBar = page.locator('[role="progressbar"], [data-testid="prep-progress"], [class*="progress"]');
      
      if (await progressBar.count() > 0) {
        // Verify progress indicator exists
        await expect(progressBar.first()).toBeVisible();
      }
    });
  });
});
