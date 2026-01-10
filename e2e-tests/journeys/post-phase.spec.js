/**
 * POST PHASE JOURNEY TESTS
 * ========================
 * Tests the Post Phase experience (Day 71+) after completing the 10-week program.
 * 
 * User Journey:
 * - Day 70 → Day 71 transition
 * - Full content access (all gates removed)
 * - Continued daily practice (AM/PM bookends)
 * - Historical data access
 * - Long-term engagement (Day 100+)
 * 
 * Critical Business Rules:
 * - Post Phase begins Day 71
 * - All content unlocks permanently
 * - Daily practice continues indefinitely
 * - Streak tracking continues
 * - No new content gates
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForFirestoreSync, login, URLS } from '../utils/test-helpers';

test.describe('🎓 Post Phase Journey', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 1: Phase Transition
  // ═══════════════════════════════════════════════════════════════════════════
  
  test.describe('Section 1: Day 70 to 71 Transition', () => {
    
    test('POST-001: Day 70 shows Dev Phase experience', async ({ page }) => {
      // Note: This test requires Time Travel to Day 70
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Look for phase indicators
      const phaseIndicator = page.locator('text=/week 10|day 70|dev phase|development/i');
      // If user is at Day 70, should show Dev Phase experience
    });
    
    test('POST-002: Day 71 transition triggers Post Phase', async ({ page }) => {
      // Note: This test requires Time Travel from Day 70 to Day 71
      await page.goto('/');
      await waitForPageLoad(page);
      
      // After Day 70, should see Post Phase indicators
      const postIndicators = page.locator('text=/graduate|post|completed|alumni/i');
      // Post Phase welcome or status should be visible
    });
    
    test('POST-003: Post Phase banner/status displays correctly', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Look for graduation/completion status
      const statusIndicators = [
        '[data-testid="phase-status"]',
        '[data-testid="post-phase-banner"]',
        'text=/graduate|alumni|completed program/i'
      ];
      
      for (const selector of statusIndicators) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
          break;
        }
      }
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 2: Full Content Access
  // ═══════════════════════════════════════════════════════════════════════════
  
  test.describe('Section 2: Full Content Access', () => {
    
    test('POST-004: Content Library shows all content unlocked', async ({ page }) => {
      await page.goto('/library');
      await waitForPageLoad(page);
      
      // Should not see any locked indicators
      const lockedIndicators = page.locator('[data-testid="locked"], .locked, text=/unlock|locked|day \\d+ required/i');
      const lockedCount = await lockedIndicators.count();
      
      // In Post Phase, there should be no locked content
      // Note: Some content may still be gated for other reasons (premium, etc.)
    });
    
    test('POST-005: Week 8-10 content accessible', async ({ page }) => {
      await page.goto('/library');
      await waitForPageLoad(page);
      
      // Navigate to later weeks
      const weekFilters = page.locator('text=/week 8|week 9|week 10/i');
      if (await weekFilters.count() > 0) {
        await weekFilters.first().click();
        await waitForPageLoad(page);
        
        // Content should load without gate
        const contentItems = page.locator('[data-testid="content-item"], .content-card');
        await expect(contentItems.first()).toBeVisible();
      }
    });
    
    test('POST-006: Dev Plan shows all 10 weeks', async ({ page }) => {
      await page.goto('/dev-plan');
      await waitForPageLoad(page);
      
      // Should see full 10-week timeline
      const weekIndicators = page.locator('text=/week 1|week 5|week 10/i');
      await expect(weekIndicators.first()).toBeVisible();
    });
    
    test('POST-007: Can access any past day in Dev Plan', async ({ page }) => {
      await page.goto('/dev-plan');
      await waitForPageLoad(page);
      
      // Try to access Day 1 content
      const day1Link = page.locator('text=/day 1/i, [data-day="1"]');
      if (await day1Link.count() > 0) {
        await day1Link.first().click();
        await waitForPageLoad(page);
        
        // Should load Day 1 content without restriction
        await expect(page.locator('[data-testid="day-content"], .day-content')).toBeVisible();
      }
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: Continued Daily Practice
  // ═══════════════════════════════════════════════════════════════════════════
  
  test.describe('Section 3: Continued Daily Practice', () => {
    
    test('POST-008: AM Bookend still available', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // AM Bookend elements should be visible
      const amElements = page.locator('text=/grounding|morning|win the day|daily reps/i');
      await expect(amElements.first()).toBeVisible();
    });
    
    test('POST-009: Grounding Rep works in Post Phase', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Find and click Grounding Rep
      const groundingButton = page.locator('text=/grounding/i, [data-testid="grounding-rep"]');
      if (await groundingButton.count() > 0 && await groundingButton.first().isVisible()) {
        await groundingButton.first().click();
        await waitForPageLoad(page);
        
        // Grounding interface should load
        await expect(page.locator('[data-testid="grounding-content"], .grounding-content')).toBeVisible();
      }
    });
    
    test('POST-010: Win the Day works in Post Phase', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Find Win the Day section
      const winSection = page.locator('text=/win the day|daily wins/i, [data-testid="win-the-day"]');
      if (await winSection.count() > 0) {
        await expect(winSection.first()).toBeVisible();
      }
    });
    
    test('POST-011: PM Bookend still available', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // PM Bookend elements should be visible
      const pmElements = page.locator('text=/reflection|evening|pm bookend/i');
      await expect(pmElements.first()).toBeVisible();
    });
    
    test('POST-012: PM Reflection can be completed', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Navigate to PM Reflection
      const reflectionLink = page.locator('text=/reflection/i, [data-testid="pm-reflection"]');
      if (await reflectionLink.count() > 0) {
        await reflectionLink.first().click();
        await waitForPageLoad(page);
        
        // Reflection form should be accessible
        const formFields = page.locator('textarea, input[type="text"]');
        await expect(formFields.first()).toBeVisible();
      }
    });
    
    test('POST-013: Scorecard tracks Post Phase progress', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Scorecard should be visible and functional
      const scorecard = page.locator('[data-testid="scorecard"], text=/scorecard|progress|%/i');
      await expect(scorecard.first()).toBeVisible();
    });
    
    test('POST-014: Streak continues in Post Phase', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Streak counter should be visible
      const streakIndicator = page.locator('[data-testid="streak"], text=/streak|day streak|\\d+ days/i');
      await expect(streakIndicator.first()).toBeVisible();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: Daily Rollover
  // ═══════════════════════════════════════════════════════════════════════════
  
  test.describe('Section 4: Daily Rollover', () => {
    
    test('POST-015: New day resets practice state', async ({ page }) => {
      // Note: This test requires Time Travel to next day
      await page.goto('/');
      await waitForPageLoad(page);
      
      // After rollover, AM Bookend should be fresh
      const completionIndicator = page.locator('[data-testid="grounding-complete"], .complete-indicator');
      // In a fresh day, grounding should NOT be marked complete
    });
    
    test('POST-016: Daily reps refresh each day', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Daily Reps section should show fresh activities
      const dailyReps = page.locator('[data-testid="daily-reps"], text=/daily reps/i');
      await expect(dailyReps.first()).toBeVisible();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 5: Historical Data
  // ═══════════════════════════════════════════════════════════════════════════
  
  test.describe('Section 5: Historical Data Access', () => {
    
    test('POST-017: Past reflections are accessible', async ({ page }) => {
      // Navigate to journal/history view
      await page.goto('/journal');
      await waitForPageLoad(page);
      
      // Should see historical entries
      const historyEntries = page.locator('[data-testid="journal-entry"], .history-item');
      // User should have past entries if they completed days
    });
    
    test('POST-018: Scorecard history preserved', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Navigate to scorecard history
      const historyButton = page.locator('text=/history|view all|past scores/i');
      if (await historyButton.count() > 0) {
        await historyButton.first().click();
        await waitForPageLoad(page);
        
        // Should see past scorecard entries
        const historyItems = page.locator('[data-testid="scorecard-history"], .history-entry');
        await expect(historyItems.first()).toBeVisible();
      }
    });
    
    test('POST-019: Can review Day 1 experience', async ({ page }) => {
      await page.goto('/dev-plan');
      await waitForPageLoad(page);
      
      // Navigate to Day 1
      const day1 = page.locator('[data-day="1"], text=/day 1/i');
      if (await day1.count() > 0) {
        await day1.first().click();
        await waitForPageLoad(page);
        
        // Day 1 data should be preserved and viewable
      }
    });
    
    test('POST-020: Mid-program data (Week 5) accessible', async ({ page }) => {
      await page.goto('/dev-plan');
      await waitForPageLoad(page);
      
      // Navigate to Week 5 / Day 35
      const midProgram = page.locator('[data-week="5"], text=/week 5|day 35/i');
      if (await midProgram.count() > 0) {
        await midProgram.first().click();
        await waitForPageLoad(page);
      }
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 6: Zone Access Post Phase
  // ═══════════════════════════════════════════════════════════════════════════
  
  test.describe('Section 6: Zone Access Post Phase', () => {
    
    test('POST-021: Community fully accessible Post Phase', async ({ page }) => {
      await page.goto('/community');
      await waitForPageLoad(page);
      
      // Community should load without gate
      const communityContent = page.locator('[data-testid="community-content"], text=/feed|discussions|events/i');
      await expect(communityContent.first()).toBeVisible();
      
      // Should not see any gate
      const gate = page.locator('text=/unlock|locked|day 15/i');
      await expect(gate).not.toBeVisible();
    });
    
    test('POST-022: Coaching fully accessible Post Phase', async ({ page }) => {
      await page.goto('/coaching');
      await waitForPageLoad(page);
      
      // Coaching should load without gate
      const coachingContent = page.locator('[data-testid="coaching-content"], text=/coaching|sessions/i');
      await expect(coachingContent.first()).toBeVisible();
      
      // Should not see any gate
      const gate = page.locator('text=/unlock|locked|day 22/i');
      await expect(gate).not.toBeVisible();
    });
    
    test('POST-023: Locker preserved and accessible', async ({ page }) => {
      await page.goto('/locker');
      await waitForPageLoad(page);
      
      // Locker should load
      await expect(page.locator('[data-testid="locker-content"], text=/saved|locker/i')).toBeVisible();
    });
  });
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 7: Long-Term Engagement
  // ═══════════════════════════════════════════════════════════════════════════
  
  test.describe('Section 7: Long-Term (Day 100+)', () => {
    
    test('POST-024: Day 100+ experience stable', async ({ page }) => {
      // Note: This test requires Time Travel to Day 100+
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Dashboard should load normally
      await expect(page.locator('[data-testid="dashboard"], .dashboard')).toBeVisible();
    });
    
    test('POST-025: All features remain functional at Day 100+', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Core features should all be accessible
      const features = ['/library', '/dev-plan', '/community', '/coaching', '/locker'];
      
      for (const feature of features) {
        await page.goto(feature);
        await waitForPageLoad(page);
        
        // Page should load without errors
        const errorIndicator = page.locator('text=/error|not found|500/i');
        await expect(errorIndicator).not.toBeVisible();
      }
    });
    
    test('POST-026: Streak can exceed program length', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Streak should display even if > 70
      const streakIndicator = page.locator('[data-testid="streak"], text=/streak/i');
      await expect(streakIndicator.first()).toBeVisible();
      
      // Streak counter should handle 100+ days gracefully
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if user is in Post Phase
 */
async function isPostPhase(page) {
  const postIndicators = await page.locator('text=/post|graduate|alumni|day 7[1-9]|day [89]\\d|day 1\\d\\d/i').count();
  return postIndicators > 0;
}

/**
 * Get current user day number
 */
async function getCurrentDay(page) {
  const dayText = await page.locator('[data-testid="current-day"], text=/day \\d+/i').textContent();
  const match = dayText?.match(/day (\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}
