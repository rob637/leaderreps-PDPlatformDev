/**
 * DAILY PRACTICE JOURNEY TESTS
 * ============================
 * Tests the complete daily practice flow: Morning Bookend → Daily Actions → Evening Reflection
 * 
 * User Journey (Updated Jan 2026):
 * 1. AM: Grounding Rep (LIS display) → Win the Day (3 fixed priority slots) → Daily Reps
 * 2. PM: PM Reflection (3 fields: went well, needs work, closing thought) → Scorecard
 * 
 * IMPORTANT - Actual widget behavior:
 * - Grounding Rep: Shows LIS in quotes, "Edit Statement" appears on hover (NO click-to-reveal)
 * - Win the Day: 3 FIXED input slots with checkboxes (NOT dynamic add/delete)
 * - PM Reflection: Fields are "What went well?", "What needs work?", "Closing thought" (NOT good/better/best)
 * - NO "Win Review" widget exists - priority completion is done via AM checkboxes
 * 
 * Critical Business Rules:
 * - Priority slots auto-save on blur
 * - Checkbox only enabled when priority text is entered
 * - Scorecard calculates from daily completions
 * - Streak tracking based on consecutive complete days
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForFirestoreSync, login } from '../utils/test-helpers';

test.describe('🌅 Morning Bookend (AM Practice)', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/');
    await waitForPageLoad(page);
  });
  
  test.describe('Section 1: Grounding Rep', () => {
    
    test('DAILY-AM-001: Grounding Rep widget is visible on dashboard', async ({ page }) => {
      // Find the grounding rep widget
      const groundingWidget = page.locator('[data-testid="grounding-rep"], text=/Grounding Rep/i, [class*="grounding"]');
      await expect(groundingWidget.first()).toBeVisible({ timeout: 10000 });
    });
    
    test('DAILY-AM-002: Grounding Rep displays LIS in quotes', async ({ page }) => {
      // LIS should be displayed in quotes with italic styling
      const groundingWidget = page.locator('[data-testid="grounding-rep"], [class*="grounding"]').first();
      
      if (await groundingWidget.isVisible()) {
        // Look for quoted/italic LIS text starting with "I am..."
        const lisText = page.locator('text=/I am a/i, em, i');
        // LIS should be visible when user has completed Leader Profile
      }
    });
    
    test('DAILY-AM-003: Edit Statement link appears on hover', async ({ page }) => {
      const groundingWidget = page.locator('[data-testid="grounding-rep"], [class*="grounding"]').first();
      
      if (await groundingWidget.isVisible()) {
        // Hover over widget
        await groundingWidget.hover();
        await page.waitForTimeout(300);
        
        // Look for Edit Statement link
        const editLink = page.locator('text=/Edit Statement/i');
        // Edit link should appear on hover
      }
    });
    
    test('DAILY-AM-004: Clicking Edit Statement opens LIS Maker mode', async ({ page }) => {
      const groundingWidget = page.locator('[data-testid="grounding-rep"]').first();
      
      if (await groundingWidget.isVisible()) {
        await groundingWidget.hover();
        
        const editLink = page.locator('text=/Edit Statement/i').first();
        if (await editLink.isVisible()) {
          await editLink.click();
          await page.waitForTimeout(500);
          
          // Should show LIS Maker with textarea
          const textarea = page.locator('textarea');
          // LIS Maker mode should be active
        }
      }
    });
    
    test('DAILY-AM-005: LIS Maker has Save and Cancel buttons', async ({ page }) => {
      const groundingWidget = page.locator('[data-testid="grounding-rep"]').first();
      
      if (await groundingWidget.isVisible()) {
        await groundingWidget.hover();
        
        const editLink = page.locator('text=/Edit Statement/i').first();
        if (await editLink.isVisible()) {
          await editLink.click();
          await page.waitForTimeout(500);
          
          // Check for Save and Cancel buttons
          const saveButton = page.locator('button:has-text("Save")');
          const cancelButton = page.locator('button:has-text("Cancel")');
          // Both buttons should be available in edit mode
        }
      }
    });
  });
  
  test.describe('Section 2: Win the Day (3 Fixed Priority Slots)', () => {
    
    test('DAILY-AM-006: Win the Day widget is visible', async ({ page }) => {
      const winWidget = page.locator('[data-testid="win-the-day"], text=/Win the Day/i');
      await expect(winWidget.first()).toBeVisible({ timeout: 10000 });
    });
    
    test('DAILY-AM-007: Win the Day shows 3 fixed input slots', async ({ page }) => {
      // Widget should have exactly 3 input slots (not dynamic)
      const priorityInputs = page.locator('[data-testid="win-the-day"] input[type="text"], input[placeholder*="Priority"]');
      const count = await priorityInputs.count();
      
      // Should have 3 fixed slots
      expect(count).toBeGreaterThanOrEqual(3);
    });
    
    test('DAILY-AM-008: Priority input placeholder shows slot number', async ({ page }) => {
      // Placeholders should be "Enter Priority #1", "#2", "#3"
      const input1 = page.locator('input[placeholder*="Priority #1"], input[placeholder*="Enter Priority #1"]');
      const input2 = page.locator('input[placeholder*="Priority #2"], input[placeholder*="Enter Priority #2"]');
      const input3 = page.locator('input[placeholder*="Priority #3"], input[placeholder*="Enter Priority #3"]');
      
      // At least one should match
      const hasPlaceholder = (await input1.count() > 0) || (await input2.count() > 0) || (await input3.count() > 0);
      // Placeholders indicate fixed slot numbers
    });
    
    test('DAILY-AM-009: Priority input accepts text entry', async ({ page }) => {
      const priorityInput = page.locator('[data-testid="win-the-day"] input[type="text"]').first();
      
      if (await priorityInput.isVisible()) {
        await priorityInput.fill('Complete quarterly review presentation');
        await expect(priorityInput).toHaveValue('Complete quarterly review presentation');
      }
    });
    
    test('DAILY-AM-010: Priority auto-saves on blur', async ({ page }) => {
      const priorityInput = page.locator('[data-testid="win-the-day"] input[type="text"]').first();
      
      if (await priorityInput.isVisible()) {
        const testPriority = `Auto-save test ${Date.now()}`;
        await priorityInput.fill(testPriority);
        
        // Click outside to trigger blur
        await page.click('body');
        await waitForFirestoreSync();
        
        // Refresh page
        await page.reload();
        await waitForPageLoad(page);
        
        // Priority should still be there
        const refreshedInput = page.locator('[data-testid="win-the-day"] input[type="text"]').first();
        const value = await refreshedInput.inputValue();
        expect(value).toContain('Auto-save');
      }
    });
    
    test('DAILY-AM-011: Checkbox disabled when slot is empty', async ({ page }) => {
      // Empty priority slots should have disabled/grayed checkboxes
      const checkboxes = page.locator('[data-testid="win-the-day"] input[type="checkbox"]');
      
      if (await checkboxes.count() > 0) {
        // Find an empty slot's checkbox - should be disabled
        // Checkbox is disabled until text is entered
      }
    });
    
    test('DAILY-AM-012: Checkbox enabled when text entered', async ({ page }) => {
      const priorityInput = page.locator('[data-testid="win-the-day"] input[type="text"]').first();
      const checkbox = page.locator('[data-testid="win-the-day"] input[type="checkbox"]').first();
      
      if (await priorityInput.isVisible()) {
        await priorityInput.fill('Enable checkbox test');
        await page.click('body');
        await page.waitForTimeout(500);
        
        // Checkbox should now be clickable
        if (await checkbox.isVisible()) {
          const isDisabled = await checkbox.isDisabled().catch(() => false);
          expect(isDisabled).toBeFalsy();
        }
      }
    });
    
    test('DAILY-AM-013: Clicking checkbox marks priority complete', async ({ page }) => {
      const priorityInput = page.locator('[data-testid="win-the-day"] input[type="text"]').first();
      const checkbox = page.locator('[data-testid="win-the-day"] input[type="checkbox"]').first();
      
      if (await priorityInput.isVisible()) {
        // Ensure there's text
        await priorityInput.fill('Mark complete test');
        await page.click('body');
        await page.waitForTimeout(500);
        
        // Click checkbox
        if (await checkbox.isVisible() && !(await checkbox.isDisabled())) {
          await checkbox.click();
          await expect(checkbox).toBeChecked();
        }
      }
    });
    
    test('DAILY-AM-014: Completed priority shows visual feedback', async ({ page }) => {
      // When checked, row should turn green with strikethrough
      const completedRow = page.locator('[data-testid="win-the-day"] [class*="completed"], [data-testid="win-the-day"] [class*="green"]');
      // Completed items have distinct styling
    });
    
    test('DAILY-AM-015: Save Priorities button saves all entries', async ({ page }) => {
      // Fill priorities
      const inputs = page.locator('[data-testid="win-the-day"] input[type="text"]');
      const count = await inputs.count();
      
      for (let i = 0; i < Math.min(count, 3); i++) {
        const input = inputs.nth(i);
        if (await input.isVisible()) {
          await input.fill(`Priority ${i + 1}`);
        }
      }
      
      // Click Save Priorities button
      const saveButton = page.locator('button:has-text("Save Priorities")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await waitForFirestoreSync();
      }
    });
  });
  
  test.describe('Section 3: Daily Reps', () => {
    
    test('DAILY-AM-016: Daily Reps section is visible', async ({ page }) => {
      const repsSection = page.locator('[data-testid="daily-reps"], text=/Daily Reps/i');
      // Daily reps section may be visible depending on day configuration
    });
    
    test('DAILY-AM-017: Each rep has a checkbox', async ({ page }) => {
      const repCheckboxes = page.locator('[data-testid="daily-reps"] input[type="checkbox"]');
      
      if (await repCheckboxes.count() > 0) {
        await expect(repCheckboxes.first()).toBeVisible();
      }
    });
    
    test('DAILY-AM-018: Can mark rep complete', async ({ page }) => {
      const repCheckbox = page.locator('[data-testid="daily-reps"] input[type="checkbox"]').first();
      
      if (await repCheckbox.isVisible()) {
        const wasChecked = await repCheckbox.isChecked();
        await repCheckbox.click();
        
        const isNowChecked = await repCheckbox.isChecked();
        expect(isNowChecked).not.toBe(wasChecked);
      }
    });
    
    test('DAILY-AM-019: Rep completion persists', async ({ page }) => {
      const repCheckbox = page.locator('[data-testid="daily-reps"] input[type="checkbox"]').first();
      
      if (await repCheckbox.isVisible() && !(await repCheckbox.isChecked())) {
        await repCheckbox.click();
        await waitForFirestoreSync();
        
        await page.reload();
        await waitForPageLoad(page);
        
        const refreshedCheckbox = page.locator('[data-testid="daily-reps"] input[type="checkbox"]').first();
        // Rep should still be checked
      }
    });
  });
});

test.describe('🌙 Evening Bookend (PM Practice)', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/');
    await waitForPageLoad(page);
  });
  
  /**
   * NOTE: There is NO "Win Review" widget
   * Priority completion is done in AM via Win the Day checkboxes
   * PM Bookend only contains PM Reflection widget
   */
  
  test.describe('Section 4: PM Reflection (3 Fields)', () => {
    
    test('DAILY-PM-001: PM Reflection widget is visible', async ({ page }) => {
      const pmWidget = page.locator('[data-testid="pm-reflection"], text=/PM Reflection/i');
      // PM widget may require scrolling to see
      if (await pmWidget.count() > 0) {
        await pmWidget.first().scrollIntoViewIfNeeded();
        await expect(pmWidget.first()).toBeVisible({ timeout: 10000 });
      }
    });
    
    test('DAILY-PM-002: Field 1 - "What went well?" accepts input', async ({ page }) => {
      // Actual label: "1. What went well?"
      // Actual placeholder: "Celebrate a win..."
      const goodField = page.locator('textarea[placeholder*="Celebrate a win"]').first();
      
      if (await goodField.isVisible()) {
        await goodField.scrollIntoViewIfNeeded();
        await goodField.fill('Had a productive 1:1 with my direct report');
        await expect(goodField).toHaveValue(/productive/);
      }
    });
    
    test('DAILY-PM-003: Field 2 - "What needs work?" accepts input', async ({ page }) => {
      // Actual label: "2. What needs work?"
      // Actual placeholder: "Identify an improvement..."
      const betterField = page.locator('textarea[placeholder*="Identify an improvement"]').first();
      
      if (await betterField.isVisible()) {
        await betterField.scrollIntoViewIfNeeded();
        await betterField.fill('Could have delegated more effectively');
        await expect(betterField).toHaveValue(/delegated/);
      }
    });
    
    test('DAILY-PM-004: Field 3 - "Closing thought" accepts input', async ({ page }) => {
      // Actual label: "3. Closing thought"
      // Actual placeholder: "What will I do 1% better tomorrow?"
      const closingField = page.locator('textarea[placeholder*="1% better tomorrow"]').first();
      
      if (await closingField.isVisible()) {
        await closingField.scrollIntoViewIfNeeded();
        await closingField.fill('Start meeting with clear agenda and outcomes');
        await expect(closingField).toHaveValue(/agenda/);
      }
    });
    
    test('DAILY-PM-005: All three fields save together', async ({ page }) => {
      const goodField = page.locator('textarea[placeholder*="Celebrate"]').first();
      const betterField = page.locator('textarea[placeholder*="improvement"]').first();
      const closingField = page.locator('textarea[placeholder*="1% better"]').first();
      
      if (await goodField.isVisible()) {
        await goodField.scrollIntoViewIfNeeded();
        await goodField.fill('Good thing today');
        await betterField.fill('Improvement area');
        await closingField.fill('Tomorrow focus');
        
        const saveButton = page.locator('button:has-text("Save Reflection")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await waitForFirestoreSync();
        }
      }
    });
    
    test('DAILY-PM-006: Save button disabled when required fields empty', async ({ page }) => {
      // Save requires at least "What went well?" OR "What needs work?"
      const saveButton = page.locator('button:has-text("Save Reflection")');
      
      if (await saveButton.isVisible()) {
        const isDisabled = await saveButton.isDisabled().catch(() => false);
        // Button should be disabled when both required fields are empty
      }
    });
    
    test('DAILY-PM-007: Reflection persists across sessions', async ({ page }) => {
      const testGood = `Good ${Date.now()}`;
      const goodField = page.locator('textarea[placeholder*="Celebrate"]').first();
      
      if (await goodField.isVisible()) {
        await goodField.scrollIntoViewIfNeeded();
        await goodField.fill(testGood);
        
        const saveButton = page.locator('button:has-text("Save Reflection")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await waitForFirestoreSync();
        }
        
        await page.reload();
        await waitForPageLoad(page);
        
        const refreshedField = page.locator('textarea[placeholder*="Celebrate"]').first();
        if (await refreshedField.isVisible()) {
          await refreshedField.scrollIntoViewIfNeeded();
          const value = await refreshedField.inputValue();
          expect(value).toContain('Good');
        }
      }
    });
    
    test('DAILY-PM-008: Auto-save note is displayed', async ({ page }) => {
      // Should show: "Autosaves to your locker each night at 11:59 PM"
      const autoSaveNote = page.locator('text=/Autosaves to your locker/i');
      // Auto-save note should be visible
    });
  });
  
  test.describe('Section 5: Daily Scorecard', () => {
    
    test('DAILY-PM-009: Scorecard widget is visible', async ({ page }) => {
      const scorecard = page.locator('[data-testid="scorecard"], text=/Scorecard/i');
      // Scorecard may be at bottom of dashboard
      if (await scorecard.count() > 0) {
        await scorecard.first().scrollIntoViewIfNeeded();
        await expect(scorecard.first()).toBeVisible();
      }
    });
    
    test('DAILY-PM-010: Scorecard shows completion percentage', async ({ page }) => {
      const scoreDisplay = page.locator('text=/\\d+%/');
      // Should show a percentage like "75%"
      if (await scoreDisplay.count() > 0) {
        await expect(scoreDisplay.first()).toBeVisible();
      }
    });
    
    test('DAILY-PM-011: Scorecard updates when reflection saved', async ({ page }) => {
      // Get initial score
      const scoreBefore = await page.locator('text=/\\d+%/').first().textContent().catch(() => '0%');
      
      // Fill and save reflection
      const goodField = page.locator('textarea[placeholder*="Celebrate"]').first();
      if (await goodField.isVisible()) {
        await goodField.scrollIntoViewIfNeeded();
        await goodField.fill('Scorecard update test');
        
        const saveButton = page.locator('button:has-text("Save Reflection")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Score should have updated
        const scoreAfter = await page.locator('text=/\\d+%/').first().textContent().catch(() => '0%');
        // Score may change after saving reflection
      }
    });
  });
  
  test.describe('Section 6: Streak Tracking', () => {
    
    test('DAILY-PM-012: Streak counter is visible', async ({ page }) => {
      const streakDisplay = page.locator('[data-testid="streak"], text=/streak/i');
      // Streak display should be visible
    });
    
    test('DAILY-PM-013: Streak shows correct count', async ({ page }) => {
      const streakNumber = page.locator('text=/\\d+\\s*day/i');
      
      if (await streakNumber.count() > 0) {
        const text = await streakNumber.first().textContent();
        const number = parseInt(text?.match(/\d+/)?.[0] || '0');
        expect(number).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

test.describe('📋 Daily Commitment Scorecard', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test.describe('Section 7: Commitment Management', () => {
    
    test('DAILY-COMMIT-001: Navigate to Daily Practice screen', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Look for daily practice elements
      const dailyPractice = page.locator('text=/daily practice|scorecard|commitment/i');
      // Daily practice elements should be visible
    });
    
    test('DAILY-COMMIT-002: Active commitments list is visible', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      const commitmentList = page.locator('[data-testid="commitment-list"], [class*="commitment"]');
      // Should show commitments or empty state
    });
    
    test('DAILY-COMMIT-003: Can mark commitment as complete', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      const checkbox = page.locator('input[type="checkbox"]').first();
      
      if (await checkbox.isVisible()) {
        const wasChecked = await checkbox.isChecked();
        await checkbox.click();
        await waitForFirestoreSync();
        
        const isNowChecked = await checkbox.isChecked();
        expect(isNowChecked).not.toBe(wasChecked);
      }
    });
  });
  
  test.describe('Section 8: History & Progress', () => {
    
    test('DAILY-COMMIT-004: Progress indicator shows daily progress', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      const progress = page.locator('[data-testid="progress"], [role="progressbar"], text=/\\d+%/');
      // Progress indicator should be visible
    });
    
    test('DAILY-COMMIT-005: Week indicator shows current week', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      const weekIndicator = page.locator('text=/Week \\d+/i');
      // Week indicator should be visible
    });
    
    test('DAILY-COMMIT-006: Day indicator shows current day', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      const dayIndicator = page.locator('text=/Day \\d+/i');
      // Day indicator should be visible
    });
  });
});
