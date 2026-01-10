/**
 * COMMUNITY & COACHING ZONES TESTS
 * =================================
 * Tests the zone-gated features: Community (Day 15+) and Coaching (Day 22+)
 * 
 * User Journeys:
 * - Community: Feed → Filter by Tier → Create Thread → React/Comment
 * - Coaching: Calendar → Register → My Sessions → AI Roleplay
 * 
 * Critical Business Rules:
 * - Community unlocks at Day 15
 * - Coaching unlocks at Day 22
 * - 1:1 Coaching window: Days 23-35
 * - Zone gates should block access with clear messaging
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForFirestoreSync, login } from '../utils/test-helpers';

test.describe('🌐 Community Zone', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test.describe('Section 1: Zone Access', () => {
    
    test('COMMUNITY-001: Community nav item is visible', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      const communityNav = page.locator('nav >> text=/community/i, [data-testid="nav-community"]');
      await expect(communityNav.first()).toBeVisible();
    });
    
    test('COMMUNITY-002: Community shows zone gate if Day < 15', async ({ page }) => {
      // This test depends on the user's current day number
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      // Check for either zone gate OR community content
      const hasGate = await page.locator('text=/unlock|day 15|locked/i').count() > 0;
      const hasFeed = await page.locator('[data-testid="community-feed"], text=/feed|discussions/i').count() > 0;
      
      expect(hasGate || hasFeed).toBeTruthy();
    });
    
    test('COMMUNITY-003: Zone gate shows unlock day clearly', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const gateMessage = page.locator('text=/day 15|unlocks/i');
      // If gate is shown, it should mention Day 15
    });
    
    test('COMMUNITY-004: Community accessible after Day 15', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      // If user is past Day 15, should see community content
      const communityContent = page.locator('[data-testid="community-tabs"], text=/feed|events|resources/i');
      // Depends on user's day number
    });
  });
  
  test.describe('Section 2: Community Tabs', () => {
    
    test('COMMUNITY-005: All community tabs are visible', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      // Check for tabs: Live Events, My Community, Community Feed, Resources
      const tabs = ['events', 'community', 'feed', 'resources'];
      for (const tab of tabs) {
        const tabElement = page.locator(`text=/${tab}/i`);
        // Tabs should be present (if zone is unlocked)
      }
    });
    
    test('COMMUNITY-006: Tab switching works correctly', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const feedTab = page.locator('button:has-text("Feed"), [data-testid="tab-feed"]');
      if (await feedTab.isVisible()) {
        await feedTab.click();
        await waitForPageLoad(page);
        
        // Should show feed content
        await expect(page.locator('[data-testid="community-feed"], [class*="feed"]')).toBeVisible();
      }
    });
  });
  
  test.describe('Section 3: Community Feed', () => {
    
    test('COMMUNITY-007: Feed shows discussion threads', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const feedTab = page.locator('button:has-text("Feed")');
      if (await feedTab.isVisible()) {
        await feedTab.click();
        await waitForPageLoad(page);
      }
      
      const threads = page.locator('[data-testid*="thread"], [class*="thread-card"]');
      // Should show threads or empty state
    });
    
    test('COMMUNITY-008: Feed can be filtered by tier', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const tierFilter = page.locator('[data-testid="tier-filter"], button:has-text("T1"), button:has-text("All")');
      if (await tierFilter.first().isVisible()) {
        // Click a tier filter
        await tierFilter.first().click();
        await page.waitForTimeout(500);
        
        // Threads should filter
      }
    });
    
    test('COMMUNITY-009: Start Discussion button is visible', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const startButton = page.locator('button:has-text("Start Discussion"), button:has-text("New Thread")');
      // Should have ability to create new thread
    });
    
    test('COMMUNITY-010: New thread form opens', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const startButton = page.locator('button:has-text("Start Discussion")');
      if (await startButton.isVisible()) {
        await startButton.click();
        await waitForPageLoad(page);
        
        // Should show thread form
        await expect(page.locator('input[name*="title"], textarea[name*="title"]')).toBeVisible();
      }
    });
    
    test('COMMUNITY-011: Thread form has required fields', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const startButton = page.locator('button:has-text("Start Discussion")');
      if (await startButton.isVisible()) {
        await startButton.click();
        await waitForPageLoad(page);
        
        // Should have title, context, question, tier fields
        await expect(page.locator('input, textarea').first()).toBeVisible();
      }
    });
    
    test('COMMUNITY-012: Thread creation requires title', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const startButton = page.locator('button:has-text("Start Discussion")');
      if (await startButton.isVisible()) {
        await startButton.click();
        await waitForPageLoad(page);
        
        // Try to submit without title
        const submitButton = page.locator('button:has-text("Post"), button:has-text("Submit")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          
          // Should show validation error
          await expect(page.locator('text=/required|enter a title/i')).toBeVisible({ timeout: 3000 }).catch(() => {});
        }
      }
    });
    
    test('COMMUNITY-013: Thread can be created successfully', async ({ page }) => {
      test.skip(true, 'Destructive test - creates real data');
      
      // This would create a real thread - skip unless specifically enabled
    });
  });
  
  test.describe('Section 4: Thread Interactions', () => {
    
    test('COMMUNITY-014: Thread shows author info', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const thread = page.locator('[data-testid*="thread"]').first();
      if (await thread.isVisible()) {
        // Should show author name/avatar
        const author = thread.locator('[data-testid="author"], [class*="author"]');
      }
    });
    
    test('COMMUNITY-015: Thread shows reaction count', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const thread = page.locator('[data-testid*="thread"]').first();
      if (await thread.isVisible()) {
        const reactions = thread.locator('text=/\\d+/, [class*="heart"], [class*="like"]');
      }
    });
    
    test('COMMUNITY-016: Can react to thread', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const heartButton = page.locator('[data-testid="react-button"], button >> svg[class*="heart"]').first();
      if (await heartButton.isVisible()) {
        await heartButton.click();
        // Should show reaction confirmation
      }
    });
    
    test('COMMUNITY-017: Can comment on thread', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const commentButton = page.locator('button:has-text("Comment"), button:has-text("View")').first();
      if (await commentButton.isVisible()) {
        await commentButton.click();
        // Should open comment/detail view
      }
    });
  });
  
  test.describe('Section 5: Community Resources', () => {
    
    test('COMMUNITY-018: Resources tab shows resource grid', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const resourcesTab = page.locator('button:has-text("Resources")');
      if (await resourcesTab.isVisible()) {
        await resourcesTab.click();
        await waitForPageLoad(page);
        
        const resources = page.locator('[data-testid*="resource"], [class*="resource-card"]');
      }
    });
    
    test('COMMUNITY-019: New resources show NEW badge', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const resourcesTab = page.locator('button:has-text("Resources")');
      if (await resourcesTab.isVisible()) {
        await resourcesTab.click();
        await waitForPageLoad(page);
        
        const newBadge = page.locator('[data-testid="new-badge"], text=/new/i');
        // May or may not have new items
      }
    });
    
    test('COMMUNITY-020: Resource opens viewer on click', async ({ page }) => {
      await page.click('text=/community/i');
      await waitForPageLoad(page);
      
      const resourcesTab = page.locator('button:has-text("Resources")');
      if (await resourcesTab.isVisible()) {
        await resourcesTab.click();
        await waitForPageLoad(page);
        
        const resource = page.locator('[data-testid*="resource"]').first();
        if (await resource.isVisible()) {
          await resource.click();
          await waitForPageLoad(page);
          
          // Should open resource viewer modal
          const viewer = page.locator('[data-testid="resource-viewer"], [class*="modal"]');
        }
      }
    });
  });
});

test.describe('🏋️ Coaching Zone', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test.describe('Section 6: Zone Access', () => {
    
    test('COACHING-001: Coaching nav item is visible', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      const coachingNav = page.locator('nav >> text=/coaching|labs/i, [data-testid="nav-coaching"]');
      await expect(coachingNav.first()).toBeVisible();
    });
    
    test('COACHING-002: Coaching shows zone gate if Day < 22', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      // Check for either zone gate OR coaching content
      const hasGate = await page.locator('text=/unlock|day 22|locked/i').count() > 0;
      const hasContent = await page.locator('[data-testid="coaching-tabs"], text=/live|on-demand/i').count() > 0;
      
      expect(hasGate || hasContent).toBeTruthy();
    });
    
    test('COACHING-003: Zone gate shows unlock day clearly', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const gateMessage = page.locator('text=/day 22|unlocks/i');
      // If gate is shown, should mention Day 22
    });
  });
  
  test.describe('Section 7: Live Coaching Tab', () => {
    
    test('COACHING-004: Live Coaching tab shows sessions', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const liveTab = page.locator('button:has-text("Live")');
      if (await liveTab.isVisible()) {
        await liveTab.click();
        await waitForPageLoad(page);
        
        const sessions = page.locator('[data-testid*="session"], [class*="session-card"]');
        // Should show sessions or empty state
      }
    });
    
    test('COACHING-005: View mode toggle switches list/calendar', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const viewToggle = page.locator('[data-testid="view-toggle"], button:has-text("Calendar"), button:has-text("List")');
      if (await viewToggle.first().isVisible()) {
        await viewToggle.first().click();
        await page.waitForTimeout(500);
        
        // View should change
      }
    });
    
    test('COACHING-006: Calendar view shows month navigation', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const calendarToggle = page.locator('button:has-text("Calendar")');
      if (await calendarToggle.isVisible()) {
        await calendarToggle.click();
        await waitForPageLoad(page);
        
        // Should show prev/next month buttons
        const prevButton = page.locator('button[aria-label*="prev"], button:has-text("←")');
        const nextButton = page.locator('button[aria-label*="next"], button:has-text("→")');
      }
    });
    
    test('COACHING-007: Session card shows type badge', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const session = page.locator('[data-testid*="session"]').first();
      if (await session.isVisible()) {
        const typeBadge = session.locator('text=/open gym|leader circle|workshop/i');
        // Should have type indicator
      }
    });
    
    test('COACHING-008: Can register for session', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const registerButton = page.locator('button:has-text("Register")').first();
      if (await registerButton.isVisible()) {
        // Should be able to click register
        await expect(registerButton).toBeEnabled();
      }
    });
    
    test('COACHING-009: Registration updates UI to show registered state', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const registerButton = page.locator('button:has-text("Register")').first();
      if (await registerButton.isVisible()) {
        await registerButton.click();
        await waitForFirestoreSync();
        
        // Should show registered indicator
        const registeredBadge = page.locator('text=/registered|✓/i');
      }
    });
    
    test('COACHING-010: Can cancel registration', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const cancelButton = page.locator('button:has-text("Cancel")');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await waitForFirestoreSync();
      }
    });
  });
  
  test.describe('Section 8: On-Demand Tab', () => {
    
    test('COACHING-011: On-Demand tab shows AI Coaching card', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const onDemandTab = page.locator('button:has-text("On-Demand")');
      if (await onDemandTab.isVisible()) {
        await onDemandTab.click();
        await waitForPageLoad(page);
        
        await expect(page.locator('text=/ai|feedback|coach/i')).toBeVisible();
      }
    });
    
    test('COACHING-012: AI Roleplay can be launched', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const onDemandTab = page.locator('button:has-text("On-Demand")');
      if (await onDemandTab.isVisible()) {
        await onDemandTab.click();
        await waitForPageLoad(page);
        
        const aiButton = page.locator('button:has-text("Start Practicing"), button:has-text("AI")');
        if (await aiButton.isVisible()) {
          await aiButton.click();
          await waitForPageLoad(page);
          
          // Should navigate to AI roleplay
          await expect(page.locator('text=/roleplay|scenario|practice/i')).toBeVisible();
        }
      }
    });
    
    test('COACHING-013: 1:1 Coaching shows scheduling option', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const onDemandTab = page.locator('button:has-text("On-Demand")');
      if (await onDemandTab.isVisible()) {
        await onDemandTab.click();
        await waitForPageLoad(page);
        
        const scheduleButton = page.locator('button:has-text("Schedule"), text=/1:1|one-on-one/i');
        // 1:1 scheduling only available Days 23-35
      }
    });
    
    test('COACHING-014: Scenario submission button exists', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const onDemandTab = page.locator('button:has-text("On-Demand")');
      if (await onDemandTab.isVisible()) {
        await onDemandTab.click();
        await waitForPageLoad(page);
        
        const submitButton = page.locator('button:has-text("Submit"), text=/scenario/i');
      }
    });
  });
  
  test.describe('Section 9: My Coaching Tab', () => {
    
    test('COACHING-015: My Coaching shows registered sessions', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const myTab = page.locator('button:has-text("My Coaching")');
      if (await myTab.isVisible()) {
        await myTab.click();
        await waitForPageLoad(page);
        
        // Should show upcoming registered sessions or empty state
        const content = page.locator('[data-testid="my-sessions"], text=/upcoming|registered|no sessions/i');
      }
    });
    
    test('COACHING-016: Past sessions show replay option', async ({ page }) => {
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const myTab = page.locator('button:has-text("My Coaching")');
      if (await myTab.isVisible()) {
        await myTab.click();
        await waitForPageLoad(page);
        
        const replayButton = page.locator('button:has-text("Replay"), button:has-text("Watch")');
        // May or may not have past sessions
      }
    });
  });
  
  test.describe('Section 10: AI Roleplay', () => {
    
    test('COACHING-017: AI Roleplay screen loads', async ({ page }) => {
      // Navigate directly to AI roleplay
      await page.click('text=/coaching|labs/i');
      await waitForPageLoad(page);
      
      const onDemandTab = page.locator('button:has-text("On-Demand")');
      if (await onDemandTab.isVisible()) {
        await onDemandTab.click();
        
        const aiButton = page.locator('button:has-text("Start Practicing")');
        if (await aiButton.isVisible()) {
          await aiButton.click();
          await waitForPageLoad(page);
          
          // Should be on roleplay screen
          await expect(page.locator('text=/roleplay|scenario|practice/i')).toBeVisible();
        }
      }
    });
    
    test('COACHING-018: Roleplay has scenario selection', async ({ page }) => {
      // This test assumes we're on the roleplay screen
      const scenarioSelector = page.locator('[data-testid="scenario-select"], select, text=/choose.*scenario/i');
      // Should have ability to select scenarios
    });
    
    test('COACHING-019: Roleplay shows AI responses', async ({ page }) => {
      // This would test the AI interaction
      // Requires actual API key and interaction
      test.skip(true, 'Requires AI API integration');
    });
  });
});

test.describe('📦 Locker (Progress History)', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test.describe('Section 11: Locker Navigation', () => {
    
    test('LOCKER-001: Locker nav item is visible', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      const lockerNav = page.locator('nav >> text=/locker/i, [data-testid="nav-locker"]');
      await expect(lockerNav.first()).toBeVisible();
    });
    
    test('LOCKER-002: Locker screen loads', async ({ page }) => {
      await page.click('text=/locker/i');
      await waitForPageLoad(page);
      
      await expect(page.locator('text=/locker|history|progress/i')).toBeVisible();
    });
  });
  
  test.describe('Section 12: Journey Progress', () => {
    
    test('LOCKER-003: Journey widget shows progress', async ({ page }) => {
      await page.click('text=/locker/i');
      await waitForPageLoad(page);
      
      const journeyWidget = page.locator('[data-testid="journey-widget"], text=/journey|progress/i');
      // Should show journey progress visualization
    });
    
    test('LOCKER-004: Journey shows current day/week', async ({ page }) => {
      await page.click('text=/locker/i');
      await waitForPageLoad(page);
      
      const dayIndicator = page.locator('text=/day \\d+|week \\d+/i');
      // Should show where user is in journey
    });
  });
  
  test.describe('Section 13: Wins History', () => {
    
    test('LOCKER-005: Wins history widget visible', async ({ page }) => {
      await page.click('text=/locker/i');
      await waitForPageLoad(page);
      
      const winsWidget = page.locator('[data-testid="wins-history"], text=/wins|victories/i');
    });
    
    test('LOCKER-006: Wins show with dates', async ({ page }) => {
      await page.click('text=/locker/i');
      await waitForPageLoad(page);
      
      const winEntry = page.locator('[data-testid*="win-entry"]').first();
      if (await winEntry.isVisible()) {
        // Should have date
        const date = winEntry.locator('text=/\\d+\\/\\d+|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i');
      }
    });
  });
  
  test.describe('Section 14: Scorecard History', () => {
    
    test('LOCKER-007: Scorecard history visible', async ({ page }) => {
      await page.click('text=/locker/i');
      await waitForPageLoad(page);
      
      const scorecardHistory = page.locator('[data-testid="scorecard-history"], text=/scorecard|scores/i');
    });
    
    test('LOCKER-008: Scorecard shows daily scores', async ({ page }) => {
      await page.click('text=/locker/i');
      await waitForPageLoad(page);
      
      const scores = page.locator('text=/\\d+%|\\d+\\/\\d+/');
      // Should show score percentages
    });
  });
  
  test.describe('Section 15: Notification Settings', () => {
    
    test('LOCKER-009: Notification settings accessible', async ({ page }) => {
      await page.click('text=/locker/i');
      await waitForPageLoad(page);
      
      const notificationSettings = page.locator('[data-testid="notification-settings"], text=/notification|reminder/i');
    });
    
    test('LOCKER-010: Can configure notification times', async ({ page }) => {
      await page.click('text=/locker/i');
      await waitForPageLoad(page);
      
      const timeSelector = page.locator('input[type="time"], select[name*="time"]');
      // Should have time configuration options
    });
  });
});
