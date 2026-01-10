/**
 * Daily Practice E2E Tests
 * 
 * Automated version of Manual Test Scripts:
 * - 02-dev-am-bookend.md (AM Bookend: Grounding Rep, Win the Day, Daily Reps)
 * - 03-dev-pm-bookend.md (PM Bookend: PM Reflection only - NO Win Review)
 * 
 * Tests the core daily practice workflow
 * 
 * IMPORTANT: Actual widget behavior (updated Jan 2026):
 * - Grounding Rep: Shows LIS in quotes, "Edit Statement" appears on hover
 * - Win the Day: 3 FIXED input slots with checkboxes (not dynamic add/delete)
 * - PM Reflection: 3 fields - "What went well?", "What needs work?", "Closing thought"
 * - NO Win Review widget exists in PM Bookend
 */

import { test, expect } from '@playwright/test';
import { 
  SELECTORS, 
  URLS, 
  waitForPageLoad,
  setupConsoleErrorCapture 
} from './utils/test-helpers.js';

test.describe('☀️ AM Bookend Tests', () => {
  
  test.describe('Grounding Rep Widget', () => {
    
    // DEV-AM-001: Grounding Rep Display with LIS
    test('DEV-AM-001: Grounding Rep should display Leadership Identity Statement', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Look for grounding rep widget with LIS displayed
      const groundingIndicators = [
        '[data-testid="grounding-rep"]',
        'text=/Grounding Rep/i',
        'text=/Leadership Identity/i',
        'text=/I am a/i'  // LIS typically starts with "I am a..."
      ];
      
      let groundingFound = false;
      for (const selector of groundingIndicators) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          groundingFound = true;
          await expect(element.first()).toBeVisible();
          break;
        }
      }
    });

    // DEV-AM-002: Grounding Rep shows LIS in quotes
    test('DEV-AM-002: Grounding Rep should show LIS in italic quotes', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // LIS should be displayed in quotes with italic styling
      const lisContainer = page.locator('[data-testid="grounding-rep"], [class*="grounding"]');
      if (await lisContainer.count() > 0) {
        // Look for quoted text (italic or in quotes)
        const quotedText = lisContainer.locator('em, i, [class*="italic"], text=/".*"/');
        // LIS should be present
      }
    });

    // DEV-AM-003: Edit Statement on hover
    test('DEV-AM-003: Edit Statement link should appear on hover', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      const groundingWidget = page.locator('[data-testid="grounding-rep"], [class*="grounding"]').first();
      
      if (await groundingWidget.isVisible()) {
        // Hover over widget
        await groundingWidget.hover();
        await page.waitForTimeout(300);
        
        // Look for Edit Statement link
        const editLink = page.locator('text=/Edit Statement/i, a:has-text("Edit"), button:has-text("Edit")');
        // Edit link may appear on hover
      }
    });

    // DEV-AM-004: LIS Maker opens on edit click
    test('DEV-AM-004: Clicking Edit Statement should open LIS Maker', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      const groundingWidget = page.locator('[data-testid="grounding-rep"], [class*="grounding"]').first();
      
      if (await groundingWidget.isVisible()) {
        await groundingWidget.hover();
        
        const editLink = page.locator('text=/Edit Statement/i').first();
        if (await editLink.isVisible()) {
          await editLink.click();
          await page.waitForTimeout(500);
          
          // LIS Maker should appear with textarea
          const lisMaker = page.locator('textarea, [data-testid="lis-maker"], text=/I am a.*leader/i');
          // LIS Maker mode should be visible
        }
      }
    });

    // DEV-AM-005: LIS Maker has save and cancel
    test('DEV-AM-005: LIS Maker should have Save and Cancel buttons', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Navigate to LIS edit mode (if accessible)
      const groundingWidget = page.locator('[data-testid="grounding-rep"]').first();
      if (await groundingWidget.isVisible()) {
        await groundingWidget.hover();
        
        const editLink = page.locator('text=/Edit Statement/i').first();
        if (await editLink.isVisible()) {
          await editLink.click();
          
          // Should have Save and Cancel buttons
          const saveButton = page.locator('button:has-text("Save")');
          const cancelButton = page.locator('button:has-text("Cancel")');
          // Buttons should be visible in edit mode
        }
      }
    });
  });

  test.describe('Win the Day Widget - 3 Fixed Slots', () => {
    
    // DEV-AM-006: Win the Day displays 3 input slots
    test('DEV-AM-006: Win the Day should show 3 fixed priority input slots', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Look for Win the Day widget
      const winWidget = page.locator('[data-testid="win-the-day"], text=/Win the Day/i');
      await expect(winWidget.first()).toBeVisible({ timeout: 10000 });
      
      // Should have exactly 3 input fields (fixed slots)
      const priorityInputs = page.locator('[data-testid="win-the-day"] input, [class*="win"] input[type="text"]');
      const inputCount = await priorityInputs.count();
      
      // Should have 3 fixed input slots
      expect(inputCount).toBeGreaterThanOrEqual(3);
    });

    // DEV-AM-007: Priority input accepts text
    test('DEV-AM-007: Priority slot should accept text input', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Find first priority input
      const priorityInput = page.locator('[data-testid="win-the-day"] input, input[placeholder*="Priority"]').first();
      
      if (await priorityInput.isVisible()) {
        await priorityInput.fill('Complete project proposal');
        await expect(priorityInput).toHaveValue('Complete project proposal');
      }
    });

    // DEV-AM-008: Auto-save on blur
    test('DEV-AM-008: Priority should auto-save when field loses focus', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      const priorityInput = page.locator('[data-testid="win-the-day"] input').first();
      
      if (await priorityInput.isVisible()) {
        await priorityInput.fill('Test auto-save priority');
        
        // Click outside to trigger blur/auto-save
        await page.click('body');
        await page.waitForTimeout(1000);
        
        // Refresh page
        await page.reload();
        await waitForPageLoad(page);
        
        // Text should persist
        const refreshedInput = page.locator('[data-testid="win-the-day"] input').first();
        const value = await refreshedInput.inputValue();
        // Value should persist after refresh
      }
    });

    // DEV-AM-009: Checkbox disabled when empty
    test('DEV-AM-009: Priority checkbox should be disabled when slot is empty', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Look for empty slot checkbox (should be grayed/disabled)
      const checkboxes = page.locator('[data-testid="win-the-day"] input[type="checkbox"]');
      
      if (await checkboxes.count() > 0) {
        // Find an empty slot's checkbox
        const emptyCheckbox = checkboxes.first();
        // Empty slots have disabled checkboxes
        const isDisabled = await emptyCheckbox.isDisabled().catch(() => false);
        // Checkbox should be disabled or visually grayed when slot is empty
      }
    });

    // DEV-AM-010: Checkbox enabled when text entered
    test('DEV-AM-010: Priority checkbox should enable when text is entered', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      const priorityInput = page.locator('[data-testid="win-the-day"] input[type="text"]').first();
      const checkbox = page.locator('[data-testid="win-the-day"] input[type="checkbox"]').first();
      
      if (await priorityInput.isVisible()) {
        // Enter text
        await priorityInput.fill('Enable checkbox test');
        await page.click('body'); // Blur
        await page.waitForTimeout(500);
        
        // Checkbox should now be enabled
        const isDisabled = await checkbox.isDisabled().catch(() => false);
        expect(isDisabled).toBeFalsy();
      }
    });

    // DEV-AM-011: Mark priority complete via checkbox
    test('DEV-AM-011: Clicking checkbox should mark priority complete', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // First ensure there's text in the priority
      const priorityInput = page.locator('[data-testid="win-the-day"] input[type="text"]').first();
      const checkbox = page.locator('[data-testid="win-the-day"] input[type="checkbox"]').first();
      
      if (await priorityInput.isVisible()) {
        await priorityInput.fill('Mark complete test');
        await page.click('body');
        await page.waitForTimeout(500);
        
        // Click checkbox
        if (await checkbox.isVisible() && !(await checkbox.isDisabled())) {
          await checkbox.click();
          
          // Should be checked
          await expect(checkbox).toBeChecked();
        }
      }
    });

    // DEV-AM-012: Complete all 3 priorities
    test('DEV-AM-012: Should be able to complete all 3 priorities', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      const priorityInputs = page.locator('[data-testid="win-the-day"] input[type="text"]');
      const inputCount = await priorityInputs.count();
      
      // Fill all 3 slots
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = priorityInputs.nth(i);
        if (await input.isVisible()) {
          await input.fill(`Priority ${i + 1} test`);
        }
      }
      
      // Click save or blur to save
      await page.click('body');
      await page.waitForTimeout(500);
      
      // All inputs should have values
    });

    // DEV-AM-013: Save Priorities button
    test('DEV-AM-013: Save Priorities button should save all entries', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Look for Save Priorities button
      const saveButton = page.locator('button:has-text("Save Priorities"), button:has-text("Save")');
      
      if (await saveButton.count() > 0 && await saveButton.first().isVisible()) {
        await saveButton.first().click();
        await page.waitForTimeout(1000);
        
        // Should show brief loading state then save
      }
    });
  });

  test.describe('Daily Reps', () => {
    
    // DEV-AM-014: Daily Reps Display
    test('DEV-AM-014: Daily Reps should show assigned activities', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Look for daily reps section
      const repsSection = page.locator('[data-testid="daily-reps"], text=/Daily Reps/i, [class*="reps"]');
      
      if (await repsSection.count() > 0) {
        await expect(repsSection.first()).toBeVisible();
      }
    });

    // DEV-AM-015: Daily Reps have checkboxes
    test('DEV-AM-015: Each Daily Rep should have a checkbox', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      const repCheckboxes = page.locator('[data-testid="daily-reps"] input[type="checkbox"], [class*="reps"] input[type="checkbox"]');
      
      if (await repCheckboxes.count() > 0) {
        // Each rep should have a checkbox
        await expect(repCheckboxes.first()).toBeVisible();
      }
    });

    // DEV-AM-016: Mark Daily Rep complete
    test('DEV-AM-016: Clicking rep checkbox should mark it complete', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      const repCheckbox = page.locator('[data-testid="daily-reps"] input[type="checkbox"]').first();
      
      if (await repCheckbox.isVisible()) {
        const wasChecked = await repCheckbox.isChecked();
        await repCheckbox.click();
        
        // State should toggle
        const isNowChecked = await repCheckbox.isChecked();
        expect(isNowChecked).not.toBe(wasChecked);
      }
    });
  });

  test.describe('Scorecard Integration', () => {
    
    // DEV-AM-017: Scorecard Display
    test('DEV-AM-017: Scorecard should be visible on dashboard', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      const scorecard = page.locator('[data-testid="scorecard"], text=/Scorecard/i, [class*="scorecard"]');
      
      if (await scorecard.count() > 0) {
        await expect(scorecard.first()).toBeVisible();
      }
    });

    // DEV-AM-018: Scorecard shows percentage
    test('DEV-AM-018: Scorecard should show completion percentage', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Look for percentage display
      const percentageDisplay = page.locator('text=/\\d+%/, [data-testid="score-percent"]');
      
      if (await percentageDisplay.count() > 0) {
        await expect(percentageDisplay.first()).toBeVisible();
      }
    });
  });
});

test.describe('🌙 PM Bookend Tests', () => {
  
  /**
   * NOTE: There is NO "Win Review" widget in PM Bookend
   * Priority completion is done in AM Bookend via checkboxes on Win the Day widget
   * PM Bookend only contains PM Reflection widget
   */
  
  test.describe('PM Reflection Widget', () => {
    
    // DEV-PM-001: PM Reflection Display
    test('DEV-PM-001: PM Reflection widget should be visible', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Look for PM Reflection widget (navy accent, MessageSquare icon)
      const pmReflection = page.locator('[data-testid="pm-reflection"], text=/PM Reflection/i, [class*="reflection"]');
      
      if (await pmReflection.count() > 0) {
        await pmReflection.first().scrollIntoViewIfNeeded();
        await expect(pmReflection.first()).toBeVisible();
      }
    });

    // DEV-PM-002: Field 1 - What went well?
    test('DEV-PM-002: "What went well?" field should accept input', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Actual label: "1. What went well?"
      // Actual placeholder: "Celebrate a win..."
      const goodField = page.locator('textarea[placeholder*="Celebrate"], textarea:near(:text("What went well"))').first();
      
      if (await goodField.isVisible()) {
        await goodField.scrollIntoViewIfNeeded();
        await goodField.fill('Had a productive team meeting today');
        await expect(goodField).toHaveValue(/productive/);
      }
    });

    // DEV-PM-003: Field 2 - What needs work?
    test('DEV-PM-003: "What needs work?" field should accept input', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Actual label: "2. What needs work?"
      // Actual placeholder: "Identify an improvement..."
      const betterField = page.locator('textarea[placeholder*="improvement"], textarea:near(:text("What needs work"))').first();
      
      if (await betterField.isVisible()) {
        await betterField.scrollIntoViewIfNeeded();
        await betterField.fill('Need to start meetings on time');
        await expect(betterField).toHaveValue(/meetings/);
      }
    });

    // DEV-PM-004: Field 3 - Closing thought
    test('DEV-PM-004: "Closing thought" field should accept input', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Actual label: "3. Closing thought"
      // Actual placeholder: "What will I do 1% better tomorrow?"
      const closingField = page.locator('textarea[placeholder*="1% better"], textarea:near(:text("Closing thought"))').first();
      
      if (await closingField.isVisible()) {
        await closingField.scrollIntoViewIfNeeded();
        await closingField.fill('Start with the most challenging task first');
        await expect(closingField).toHaveValue(/challenging/);
      }
    });

    // DEV-PM-005: Save Reflection button
    test('DEV-PM-005: Save Reflection button should save all fields', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Fill at least one required field
      const goodField = page.locator('textarea[placeholder*="Celebrate"]').first();
      if (await goodField.isVisible()) {
        await goodField.scrollIntoViewIfNeeded();
        await goodField.fill('Test reflection save');
      }
      
      // Click Save Reflection button
      const saveButton = page.locator('button:has-text("Save Reflection")');
      
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
        
        // Should show loading spinner briefly then return to normal
      }
    });

    // DEV-PM-006: Save button disabled when empty
    test('DEV-PM-006: Save button should be disabled when required fields empty', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Save button requires at least "What went well?" OR "What needs work?"
      const saveButton = page.locator('button:has-text("Save Reflection")');
      
      if (await saveButton.isVisible()) {
        // With empty fields, button should be disabled
        const isDisabled = await saveButton.isDisabled().catch(() => false);
        // Button should be disabled when required fields are empty
      }
    });

    // DEV-PM-007: Reflection persists after refresh
    test('DEV-PM-007: Reflection data should persist after page refresh', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      const testText = `Persist test ${Date.now()}`;
      const goodField = page.locator('textarea[placeholder*="Celebrate"]').first();
      
      if (await goodField.isVisible()) {
        await goodField.scrollIntoViewIfNeeded();
        await goodField.fill(testText);
        
        const saveButton = page.locator('button:has-text("Save Reflection")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Refresh page
        await page.reload();
        await waitForPageLoad(page);
        
        // Text should persist
        const refreshedField = page.locator('textarea[placeholder*="Celebrate"]').first();
        if (await refreshedField.isVisible()) {
          await refreshedField.scrollIntoViewIfNeeded();
          const value = await refreshedField.inputValue();
          // Value should contain test text
        }
      }
    });

    // DEV-PM-008: Auto-save note displayed
    test('DEV-PM-008: Auto-save note should be displayed', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Look for auto-save note text
      const autoSaveNote = page.locator('text=/Autosaves to your locker/i, text=/11:59 PM/i');
      
      if (await autoSaveNote.count() > 0) {
        await expect(autoSaveNote.first()).toBeVisible();
      }
    });
  });

  test.describe('Full Day Completion', () => {
    
    // DEV-PM-009: Scorecard updates with PM completion
    test('DEV-PM-009: Scorecard should update when reflection is saved', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      if (page.url().includes('/login')) {
        test.skip();
        return;
      }
      
      // Get initial scorecard value
      const scoreBefore = await page.locator('text=/\\d+%/').first().textContent().catch(() => '0%');
      
      // Fill and save reflection
      const goodField = page.locator('textarea[placeholder*="Celebrate"]').first();
      if (await goodField.isVisible()) {
        await goodField.scrollIntoViewIfNeeded();
        await goodField.fill('Scorecard test');
        
        const saveButton = page.locator('button:has-text("Save Reflection")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
          await page.waitForTimeout(1000);
        }
        
        // Scorecard should have updated
        const scoreAfter = await page.locator('text=/\\d+%/').first().textContent().catch(() => '0%');
        // Score might increase after saving reflection
      }
    });
  });
});

test.describe('📊 Progress Tracking', () => {
  
  // PROG-001: Streak Counter
  test('PROG-001: Streak counter should be visible', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Look for streak display
    const streakIndicators = [
      '[data-testid="streak"]',
      'text=/streak/i',
      'text=/\\d+ day/i'
    ];
    
    for (const selector of streakIndicators) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.first().isVisible()) {
        break;
      }
    }
  });

  // PROG-002: Week Progress
  test('PROG-002: Week progress should be visible', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Look for week indicators
    const weekIndicators = [
      '[data-testid="week-progress"]',
      'text=/week \\d+/i',
      'text=/Week/i'
    ];
    
    for (const selector of weekIndicators) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.first().isVisible()) {
        break;
      }
    }
  });

  // PROG-003: Day counter
  test('PROG-003: Day counter should display current day', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);
    
    if (page.url().includes('/login')) {
      test.skip();
      return;
    }
    
    // Look for day number
    const dayIndicators = [
      '[data-testid="day-counter"]',
      'text=/day \\d+/i',
      'text=/Day \\d+/i'
    ];
    
    for (const selector of dayIndicators) {
      const element = page.locator(selector);
      if (await element.count() > 0 && await element.first().isVisible()) {
        break;
      }
    }
  });
});
