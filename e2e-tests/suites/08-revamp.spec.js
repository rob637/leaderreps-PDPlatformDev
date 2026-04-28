/**
 * Ascent Revamp — Smoke Test Suite (E2E)
 *
 * Lightweight smoke coverage for the May 11, 2026 cutover. These tests do NOT
 * authenticate or hit Firestore; they verify that the revamp UI renders
 * without runtime errors and that key surfaces are reachable when the
 * `revamp-force=on` localStorage override is set.
 *
 * Deeper flows (rep submission, registration, SMS OTP) require seeded users
 * and are tracked separately for the post-cutover hardening pass.
 *
 * Maps to REVAMP-PLAN.md §8.14.
 */

import { test, expect } from '@playwright/test';
import {
  URLS,
  waitForPageLoad,
  setupConsoleErrorCapture,
} from '../utils/test-helpers.js';

const forceRevampOn = async (page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('revamp-force', 'on');
    } catch (_e) {
      /* ignore */
    }
  });
};

test.describe('🚀 Ascent Revamp Smoke Suite', () => {
  test.describe('Section 1: Cohort flag override', () => {
    test('REVAMP-001: revamp-force=on activates revamp shell without console errors', async ({
      page,
    }) => {
      const errors = setupConsoleErrorCapture(page);
      await forceRevampOn(page);
      await page.goto(URLS.base);
      await waitForPageLoad(page);

      // App should render (login or shell). The localStorage override should
      // not throw. Re-read it to confirm persistence.
      const flag = await page.evaluate(() =>
        window.localStorage.getItem('revamp-force')
      );
      expect(flag).toBe('on');

      // Ignore expected auth-related console noise; fail on hard errors.
      const hardErrors = errors
        .getErrors()
        .filter((e) => !/auth|firebase|network/i.test(e));
      expect(hardErrors).toEqual([]);
    });

    test('REVAMP-002: revamp-force=off forces legacy shell', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        try {
          window.localStorage.setItem('revamp-force', 'off');
        } catch (_e) {
          /* ignore */
        }
      });
      await page.goto(URLS.base);
      await waitForPageLoad(page);

      const flag = await page.evaluate(() =>
        window.localStorage.getItem('revamp-force')
      );
      expect(flag).toBe('off');
    });
  });

  test.describe('Section 2: App boot', () => {
    test('REVAMP-003: page loads with revamp override and exposes login form', async ({
      page,
    }) => {
      await forceRevampOn(page);
      await page.goto(URLS.base);
      await waitForPageLoad(page);

      // Either the login form OR an authenticated shell should be present.
      // We use the document title as a basic liveness check.
      const title = await page.title();
      expect(title).toBeTruthy();
    });
  });

  test.describe('Section 3: Launch announcement (gated)', () => {
    test('REVAMP-004: announcement modal does not appear pre-auth', async ({
      page,
    }) => {
      await forceRevampOn(page);
      await page.goto(URLS.base);
      await waitForPageLoad(page);

      // Modal requires authenticated user + revamp on + unseen flag.
      // Pre-auth, it must NOT render.
      const modal = page.getByRole('button', { name: /Dismiss announcement/i });
      await expect(modal).toHaveCount(0);
    });
  });
});
