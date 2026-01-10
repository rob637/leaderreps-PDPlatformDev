# 🌙 Dev Phase - PM Bookend Test Scripts

> **Complete Test Coverage for PM Bookend**  
> *12 Scenarios | ~1.5 Hours | Tests Evening Activities*

---

## Overview

The PM Bookend is the evening routine that users complete each day during the Development Phase (Days 1-70). It includes:
- **PM Reflection**: Three-question evening reflection form

**Note:** Win completion tracking is done in the AM Bookend via checkboxes on the Win the Day widget. There is no separate "Win Review" widget in the PM Bookend.

---

## Pre-Execution Checklist

```
□ Environment: https://leaderreps-test.web.app
□ Test user in Dev Phase (Day 1+)
□ Browser DevTools ready for debugging
□ Firestore console available to verify data persistence
```

---

## Section 1: PM Reflection Widget (12 Scenarios)

### DEV-PM-001: PM Reflection - Widget Display

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login and view Dashboard | Dashboard loads | ☐ | |
| 2 | Locate PM Bookend section | Section with moon icon and "PM Bookend: Finish Strong" header visible | ☐ | |
| 3 | Find PM Reflection widget | Card with "PM Reflection" title, MessageSquare icon, navy accent | ☐ | |
| 4 | Verify 3 text areas | Three textarea fields visible | ☐ | |
| 5 | Verify field labels | "1. What went well?", "2. What needs work?", "3. Closing thought" | ☐ | |
| 6 | Verify Save button | "Save Reflection" button visible | ☐ | |
| 7 | Verify auto-save note | Text: "Autosaves to your locker each night at 11:59 PM" | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-002: PM Reflection - Field 1: What Went Well

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** PM Reflection widget visible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Verify label text | "1. What went well?" in uppercase | ☐ | |
| 2 | Verify placeholder | "Celebrate a win..." | ☐ | |
| 3 | Click textarea | Field focused with blue ring | ☐ | |
| 4 | Type: `Had a productive meeting with the team. Finished the proposal early.` | Text appears | ☐ | |
| 5 | Verify multi-line | Press Enter, new line works | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-003: PM Reflection - Field 2: What Needs Work

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** PM Reflection widget visible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Verify label text | "2. What needs work?" in uppercase | ☐ | |
| 2 | Verify placeholder | "Identify an improvement..." | ☐ | |
| 3 | Click textarea | Field focused | ☐ | |
| 4 | Type: `Need to improve time management. Started morning late.` | Text appears | ☐ | |
| 5 | Verify text retained | Text stays when clicking elsewhere | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-004: PM Reflection - Field 3: Closing Thought

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** PM Reflection widget visible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Verify label text | "3. Closing thought" in uppercase | ☐ | |
| 2 | Verify placeholder | "What will I do 1% better tomorrow?" | ☐ | |
| 3 | Click textarea | Field focused | ☐ | |
| 4 | Type: `Start with the most challenging task first` | Text appears | ☐ | |
| 5 | Note smaller height | 1 row (shorter than other fields) | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-005: PM Reflection - Save Button Behavior

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** PM Reflection widget visible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Leave all fields empty | Button disabled (opacity reduced) | ☐ | |
| 2 | Enter text in "What went well?" only | Button becomes enabled | ☐ | |
| 3 | Clear "What went well?", enter in "What needs work?" | Button becomes enabled | ☐ | |
| 4 | Enter text in only "Closing thought" | Button stays disabled (requires field 1 or 2) | ☐ | |
| 5 | Verify button text | Shows "Save Reflection" with Save icon | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-006: PM Reflection - Save Complete Reflection

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** All 3 fields filled

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Fill all 3 fields with text | All fields have content | ☐ | |
| 2 | Click "Save Reflection" button | Button shows loading spinner | ☐ | |
| 3 | Wait for save | Loading spinner disappears | ☐ | |
| 4 | Verify success feedback | Visual confirmation or toast | ☐ | |
| 5 | Verify Scorecard updates | Percentage increases | ☐ | |
| 6 | Refresh page | All 3 fields retain their text | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-007: PM Reflection - Partial Save (2 Fields)

**Priority:** High | **Time:** 3 min  
**Prerequisites:** PM Reflection widget visible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Fill "What went well?" field | Text entered | ☐ | |
| 2 | Fill "What needs work?" field | Text entered | ☐ | |
| 3 | Leave "Closing thought" empty | Third field blank | ☐ | |
| 4 | Click "Save Reflection" | Saves successfully | ☐ | |
| 5 | Refresh page | Both fields retain text | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-008: PM Reflection - Edit After Save

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Reflection previously saved

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View saved reflection | Previous text displayed | ☐ | |
| 2 | Click "What went well?" field | Can edit existing text | ☐ | |
| 3 | Add additional text | Appends to existing | ☐ | |
| 4 | Click "Save Reflection" | Saves with updates | ☐ | |
| 5 | Refresh page | Updated text persists | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-009: PM Reflection - Loading State

**Priority:** High | **Time:** 2 min  
**Prerequisites:** Content to save

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Fill at least one required field | Content ready | ☐ | |
| 2 | Click "Save Reflection" | Loader icon appears (spinning) | ☐ | |
| 3 | Button becomes disabled | Can't double-click | ☐ | |
| 4 | Wait for completion | Loader disappears | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-010: PM Reflection - Data Persistence

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** Saved reflection

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Save a reflection with all fields | Saves successfully | ☐ | |
| 2 | Log out | Session ends | ☐ | |
| 3 | Log back in | Dashboard loads | ☐ | |
| 4 | View PM Reflection | All 3 fields show saved text | ☐ | |
| 5 | Open Firestore console | Verify data in user document | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-011: PM Reflection - Scorecard Integration

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Fresh day with 0% scorecard

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Note starting Scorecard % | Record value | ☐ | |
| 2 | Fill all 3 reflection fields | All have content | ☐ | |
| 3 | Save reflection | Saves successfully | ☐ | |
| 4 | Verify Scorecard increases | Percentage goes up | ☐ | |
| 5 | PM Bookend shows progress | Visual indicator updated | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-012: Full Day Completion

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** AM Bookend complete (priorities + daily reps)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Verify AM Bookend complete | Grounding Rep viewed, 3 priorities entered/completed, reps done | ☐ | |
| 2 | Fill all 3 PM Reflection fields | All have meaningful content | ☐ | |
| 3 | Click "Save Reflection" | Saves successfully | ☐ | |
| 4 | Verify Scorecard near 100% | Full day complete | ☐ | |
| 5 | Verify PM Bookend status | Shows complete/success state | ☐ | |
| 6 | Refresh page | Completion state persists | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Bug Reporting Template

```markdown
### BUG: [DEV-PM-XXX] Brief Description

**Severity:** Critical / High / Medium / Low
**Environment:** Test / Prod
**Browser:** Chrome XX / Firefox XX / Safari XX

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Screenshot/Video:** [Link]

**Console Errors:** [If any]
```

---

## Test Summary

| Section | Scenarios | Critical | High | Medium |
|---------|-----------|----------|------|--------|
| PM Reflection | 12 | 6 | 4 | 0 |
| **TOTAL** | **12** | **6** | **4** | **0** |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| QA Lead | | | |

---

*PM Bookend Test Scripts Complete*
