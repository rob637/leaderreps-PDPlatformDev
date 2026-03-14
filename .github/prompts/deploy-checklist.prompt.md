---
description: Pre-deploy verification checklist
---

Run through this checklist before deploying:

1. **Environment check** — Confirm which environment we're deploying to (dev/test/prod)
2. **Build verification** — Does the app build without errors?
3. **Lint check** — Run ESLint, fix any issues
4. **Test check** — Run `npm test` and verify all pass
5. **Firestore rules** — If rules changed, review `firestore.rules` for security gaps
6. **Cloud Functions** — If functions changed, verify `cd functions && npm test` passes
7. **Feature flags** — Are new features properly gated?
8. **Console errors** — Start dev server and check for console warnings/errors
9. **Dark mode** — Quick check that new UI works in dark mode
10. **Mobile** — Verify responsive layout on mobile viewport

Target environment: {{env}}
Changes since last deploy: {{changes}}
