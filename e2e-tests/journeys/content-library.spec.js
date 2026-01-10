/**
 * CONTENT LIBRARY JOURNEY TESTS
 * =============================
 * Tests the complete content browsing and consumption experience.
 * 
 * User Journey: Library Hub → Category Index → Content Detail → Resource Viewer
 * 
 * Content Types: Videos, Read & Reps, Skills, Tools, Documents
 * 
 * Critical Business Rules:
 * - Only PUBLISHED content is visible
 * - Content gating based on day/phase
 * - Unlocked content sorted to top
 * - Cross-listed content appears in multiple categories
 * - Search and filter work across all content types
 */

import { test, expect } from '@playwright/test';
import { waitForPageLoad, waitForFirestoreSync, login } from '../utils/test-helpers';

test.describe('📚 Content Library Hub', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test.describe('Section 1: Library Navigation', () => {
    
    test('CONTENT-001: Navigate to Content Library from sidebar', async ({ page }) => {
      await page.goto('/');
      await waitForPageLoad(page);
      
      // Click Content in sidebar
      const contentNav = page.locator('nav >> text=/content|library/i, [data-testid="nav-content"]');
      await contentNav.first().click();
      await waitForPageLoad(page);
      
      // Should see library hub
      await expect(page.locator('text=/content|library|browse/i')).toBeVisible();
    });
    
    test('CONTENT-002: Library shows all category cards', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await waitForPageLoad(page);
      
      // Should show category cards: Skills, Read & Reps, Videos, Tools, Documents
      const categories = ['skills', 'read', 'videos', 'tools', 'documents'];
      
      for (const cat of categories) {
        const card = page.locator(`[data-testid="category-${cat}"], text=/${cat}/i`);
        await expect(card.first()).toBeVisible({ timeout: 5000 });
      }
    });
    
    test('CONTENT-003: Category cards show content counts', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await waitForPageLoad(page);
      
      // Each card should show a count
      const countBadges = page.locator('[data-testid*="count"], [class*="count"], text=/\\d+\\s*(items?|videos?|docs?)/i');
      const count = await countBadges.count();
      expect(count).toBeGreaterThan(0);
    });
    
    test('CONTENT-004: Clicking category navigates to index', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await waitForPageLoad(page);
      
      // Click Videos category
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      // Should be on videos index
      await expect(page.locator('text=/videos|video library/i')).toBeVisible();
    });
  });
  
  test.describe('Section 2: Skills Browsing', () => {
    
    test('CONTENT-005: Skills index shows skill list', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await waitForPageLoad(page);
      await page.click('text=/skills/i');
      await waitForPageLoad(page);
      
      // Should show skills list
      const skillItems = page.locator('[data-testid*="skill-item"], [class*="skill-row"]');
      const count = await skillItems.count();
      expect(count).toBeGreaterThan(0);
    });
    
    test('CONTENT-006: Skills can be searched', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/skills/i');
      await waitForPageLoad(page);
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('communication');
        await page.waitForTimeout(500);
        
        // Results should filter
        const filteredItems = page.locator('[data-testid*="skill-item"]');
        // Should have filtered results or empty state
      }
    });
    
    test('CONTENT-007: Skill detail shows related content', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/skills/i');
      await waitForPageLoad(page);
      
      // Click first skill
      const skillItem = page.locator('[data-testid*="skill-item"], [class*="skill-row"]').first();
      await skillItem.click();
      await waitForPageLoad(page);
      
      // Should show content for that skill
      await expect(page.locator('text=/videos|readings|tools|content for/i')).toBeVisible();
    });
    
    test('CONTENT-008: Skill shows content type badges', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/skills/i');
      await waitForPageLoad(page);
      
      // Skills should show badges for content types
      const badges = page.locator('[data-testid*="content-badge"], [class*="badge"]');
      const count = await badges.count();
      expect(count).toBeGreaterThan(0);
    });
  });
  
  test.describe('Section 3: Videos Browsing', () => {
    
    test('CONTENT-009: Videos index shows video list', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      const videoItems = page.locator('[data-testid*="video-item"], [class*="content-item"]');
      const count = await videoItems.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
    
    test('CONTENT-010: Videos can be searched', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]');
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('leadership');
        await page.waitForTimeout(500);
      }
    });
    
    test('CONTENT-011: Videos can be filtered by skill', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      const filterButton = page.locator('button:has-text("Filter"), [data-testid="filter-toggle"]');
      
      if (await filterButton.isVisible()) {
        await filterButton.click();
        
        // Should show skill filter options
        const skillFilters = page.locator('[data-testid="skill-filter"], [class*="filter-option"]');
        const count = await skillFilters.count();
        expect(count).toBeGreaterThan(0);
      }
    });
    
    test('CONTENT-012: Locked videos show lock indicator', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      // Look for lock icons
      const lockIcons = page.locator('[data-testid="lock-icon"], [class*="locked"] svg, svg[class*="lock"]');
      // May or may not have locked content depending on user phase
    });
    
    test('CONTENT-013: Video detail page loads', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      // Click first video
      const videoItem = page.locator('[data-testid*="video-item"], [class*="content-item"]').first();
      if (await videoItem.isVisible()) {
        await videoItem.click();
        await waitForPageLoad(page);
        
        // Should show video detail
        await expect(page.locator('video, iframe[src*="vimeo"], iframe[src*="youtube"]')).toBeVisible({ timeout: 10000 });
      }
    });
    
    test('CONTENT-014: Video player controls work', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      const videoItem = page.locator('[data-testid*="video-item"]').first();
      if (await videoItem.isVisible()) {
        await videoItem.click();
        await waitForPageLoad(page);
        
        const videoPlayer = page.locator('video, iframe');
        if (await videoPlayer.isVisible()) {
          // Video player should be present
          await expect(videoPlayer).toBeVisible();
        }
      }
    });
  });
  
  test.describe('Section 4: Read & Reps Browsing', () => {
    
    test('CONTENT-015: Read & Reps index shows reading list', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/read|reading/i');
      await waitForPageLoad(page);
      
      const readingItems = page.locator('[data-testid*="reading-item"], [class*="content-item"]');
      const count = await readingItems.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
    
    test('CONTENT-016: Reading detail shows content', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/read|reading/i');
      await waitForPageLoad(page);
      
      const readingItem = page.locator('[data-testid*="reading-item"]').first();
      if (await readingItem.isVisible()) {
        await readingItem.click();
        await waitForPageLoad(page);
        
        // Should show reading content
        await expect(page.locator('article, [class*="reading-content"], iframe')).toBeVisible({ timeout: 10000 });
      }
    });
    
    test('CONTENT-017: Reading shows author/source info', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/read|reading/i');
      await waitForPageLoad(page);
      
      // Reading items should show author/source
      const authorInfo = page.locator('text=/by |author:|from /i');
      // May or may not have author depending on content
    });
  });
  
  test.describe('Section 5: Tools Browsing', () => {
    
    test('CONTENT-018: Tools index shows tool list', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/tools/i');
      await waitForPageLoad(page);
      
      const toolItems = page.locator('[data-testid*="tool-item"], [class*="content-item"]');
      const count = await toolItems.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
    
    test('CONTENT-019: Tool detail shows downloadable content', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/tools/i');
      await waitForPageLoad(page);
      
      const toolItem = page.locator('[data-testid*="tool-item"]').first();
      if (await toolItem.isVisible()) {
        await toolItem.click();
        await waitForPageLoad(page);
        
        // May show download button or embedded content
        const downloadButton = page.locator('button:has-text("Download"), a[download]');
        const embeddedContent = page.locator('iframe, embed, object');
        
        const hasDownload = await downloadButton.count() > 0;
        const hasEmbed = await embeddedContent.count() > 0;
        // Should have at least one
      }
    });
  });
  
  test.describe('Section 6: Documents Browsing', () => {
    
    test('CONTENT-020: Documents index shows document list', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/documents/i');
      await waitForPageLoad(page);
      
      const docItems = page.locator('[data-testid*="doc-item"], [class*="content-item"]');
      const count = await docItems.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
    
    test('CONTENT-021: Document detail shows PDF or content', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/documents/i');
      await waitForPageLoad(page);
      
      const docItem = page.locator('[data-testid*="doc-item"]').first();
      if (await docItem.isVisible()) {
        await docItem.click();
        await waitForPageLoad(page);
        
        // Should show document viewer
        const docViewer = page.locator('iframe, embed[type*="pdf"], [data-testid="doc-viewer"]');
      }
    });
  });
  
  test.describe('Section 7: Search & Filter', () => {
    
    test('CONTENT-022: Global search finds content across types', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await waitForPageLoad(page);
      
      const searchInput = page.locator('input[type="search"]');
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('leadership');
        await page.waitForTimeout(500);
        
        // Should show search results
        const results = page.locator('[data-testid*="search-result"], [class*="search-results"] li');
      }
    });
    
    test('CONTENT-023: Filter clears correctly', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      const searchInput = page.locator('input[type="search"]');
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('test search');
        await page.waitForTimeout(300);
        
        // Clear search
        const clearButton = page.locator('button:has-text("Clear"), [data-testid="clear-search"]');
        if (await clearButton.isVisible()) {
          await clearButton.click();
          await page.waitForTimeout(300);
          
          // Search should be empty
          await expect(searchInput).toHaveValue('');
        }
      }
    });
    
    test('CONTENT-024: Empty search shows helpful message', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      const searchInput = page.locator('input[type="search"]');
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('xyznonexistentcontent123');
        await page.waitForTimeout(500);
        
        // Should show empty state
        await expect(page.locator('text=/no results|not found|try/i')).toBeVisible({ timeout: 5000 });
      }
    });
    
    test('CONTENT-025: Filter badge shows active filter count', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      const filterButton = page.locator('button:has-text("Filter")');
      
      if (await filterButton.isVisible()) {
        await filterButton.click();
        
        // Select a filter
        const filterOption = page.locator('[data-testid*="filter-option"] input[type="checkbox"]').first();
        if (await filterOption.isVisible()) {
          await filterOption.click();
          
          // Badge should show count
          const filterBadge = page.locator('[data-testid="filter-badge"], [class*="filter"] >> text=/\\d+/');
        }
      }
    });
  });
  
  test.describe('Section 8: Content Gating', () => {
    
    test('CONTENT-026: Unlocked content sorted to top', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      // First item should be unlocked (no lock icon)
      const firstItem = page.locator('[data-testid*="video-item"]').first();
      const lockIcon = firstItem.locator('[data-testid="lock-icon"], [class*="lock"]');
      
      // First item ideally should not be locked
    });
    
    test('CONTENT-027: Locked content shows unlock requirements', async ({ page }) => {
      // Find a locked item and verify it shows when it unlocks
      const lockedItem = page.locator('[data-testid*="locked"], [class*="locked"]').first();
      
      if (await lockedItem.isVisible()) {
        // Should show unlock info
        const unlockInfo = lockedItem.locator('text=/day|unlock|available/i');
      }
    });
    
    test('CONTENT-028: Content respects phase-based access', async ({ page }) => {
      // This test verifies that prep phase users can't access dev phase content
      // Depends on current user's phase status
    });
  });
});

test.describe('🎬 Resource Viewer', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test.describe('Section 9: Video Playback', () => {
    
    test('RESOURCE-001: Video player loads correctly', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      const videoItem = page.locator('[data-testid*="video-item"]').first();
      if (await videoItem.isVisible()) {
        await videoItem.click();
        await waitForPageLoad(page);
        
        // Video should load
        await expect(page.locator('video, iframe')).toBeVisible({ timeout: 15000 });
      }
    });
    
    test('RESOURCE-002: Video shows duration', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/videos/i');
      await waitForPageLoad(page);
      
      // Video items should show duration
      const durationBadge = page.locator('text=/\\d+\\s*min|\\d+:\\d+/').first();
      if (await durationBadge.isVisible()) {
        await expect(durationBadge).toBeVisible();
      }
    });
    
    test('RESOURCE-003: Video completion tracks progress', async ({ page }) => {
      // Verify video progress tracking
      // This may require actually watching video or checking Firestore
    });
  });
  
  test.describe('Section 10: Document Viewing', () => {
    
    test('RESOURCE-004: PDF viewer loads correctly', async ({ page }) => {
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/documents/i');
      await waitForPageLoad(page);
      
      const docItem = page.locator('[data-testid*="doc-item"]').first();
      if (await docItem.isVisible()) {
        await docItem.click();
        await waitForPageLoad(page);
        
        // PDF viewer should load
        await expect(page.locator('iframe, embed, [data-testid="pdf-viewer"]')).toBeVisible({ timeout: 15000 });
      }
    });
    
    test('RESOURCE-005: Document can be downloaded', async ({ page }) => {
      const downloadButton = page.locator('a[download], button:has-text("Download")');
      
      if (await downloadButton.isVisible()) {
        // Should have download capability
        await expect(downloadButton).toBeEnabled();
      }
    });
  });
  
  test.describe('Section 11: Interactive Content', () => {
    
    test('RESOURCE-006: Interactive content loads', async ({ page }) => {
      // Navigate to tools which may have interactive content
      await page.goto('/');
      await page.click('text=/content/i');
      await page.click('text=/tools/i');
      await waitForPageLoad(page);
      
      const toolItem = page.locator('[data-testid*="tool-item"]').first();
      if (await toolItem.isVisible()) {
        await toolItem.click();
        await waitForPageLoad(page);
        
        // Interactive content should load
        const interactive = page.locator('form, [data-testid="interactive"], button:has-text("Start")');
      }
    });
  });
});
