---
description: Debug and fix an issue across the full stack
---

Debug and fix the described issue. Follow this diagnostic flow:

1. **Identify the symptom** — what's failing or misbehaving?
2. **Trace the data flow** — component → hook → service → Firestore (or Cloud Function)
3. **Check each layer:**
   - Component: Is the right data being passed/rendered?
   - Hook: Is the hook returning correct values?
   - Service: Is the Firestore query correct? Data transformations?
   - Firestore rules: Does the user have permission?
   - Cloud Function (if applicable): Check functions/index.js
4. **Fix at the correct layer** — don't patch symptoms in the component if the bug is in the service
5. **Verify** — run relevant tests or explain how to manually verify

Issue: {{description}}
Affected area: {{area}}
