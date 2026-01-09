# 📋 Dev Phase - PM Bookend Test Scripts

> **Complete Test Coverage for PM Bookend**  
> *18 Scenarios | ~2 Hours | Tests Evening Activities*

---

## Overview

The PM Bookend is the evening routine that users complete each day during the Development Phase (Days 1-70). It includes:
- **Win Review**: Reviewing morning wins, marking accomplished/missed
- **Reflection**: Good-Better-Best daily reflection

---

## Pre-Execution Checklist

```
□ Environment: https://leaderreps-test.web.app
□ Test user in Dev Phase (Day 1+)
□ AM Bookend completed (wins added)
□ Browser DevTools ready for debugging
□ Time set to afternoon/evening (conceptually)
```

---

## Test Scenarios

### DEV-PM-001: PM Bookend Access

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Day 1+ user, AM items (especially wins) complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login and view Dashboard | Dashboard loads | ☐ | |
| 2 | Locate PM Bookend section | Section visible (may need scroll) | ☐ | |
| 3 | Verify PM header | "PM Bookend" or "Evening Reflection" | ☐ | |
| 4 | Verify Win Review present | Morning wins shown | ☐ | |
| 5 | Verify Reflection present | Reflection form visible | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-002: Win Review - Display

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** User has 3 morning wins

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View PM Bookend | Win Review section loads | ☐ | |
| 2 | Verify section title | "Win Review" or "Review Your Wins" | ☐ | |
| 3 | Count wins displayed | All 3 morning wins shown | ☐ | |
| 4 | Verify win text matches | Same text as entered in AM | ☐ | |
| 5 | Each win has action | Checkbox or similar | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-003: Win Review - Mark Win Complete

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Wins visible in review

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View first win | Win displayed | ☐ | |
| 2 | Click checkbox/mark complete | Visual change | ☐ | |
| 3 | Win shows "accomplished" state | Green check, strikethrough, etc. | ☐ | |
| 4 | Scorecard updates | Percentage increases | ☐ | |
| 5 | Refresh page | Still marked complete | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-004: Win Review - Mark Win Incomplete

**Priority:** High | **Time:** 2 min  
**Prerequisites:** Wins visible in review

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View a win | Win displayed | ☐ | |
| 2 | Mark as "incomplete" or "missed" | Different visual state | ☐ | |
| 3 | Win shows incomplete state | Red X, unchecked, etc. | ☐ | |
| 4 | Scorecard reflects | May or may not affect score | ☐ | |
| 5 | Refresh page | State persisted | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-005: Win Review - All 3 Complete

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** 3 wins to review

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Mark win 1 complete | ✓ | ☐ | |
| 2 | Mark win 2 complete | ✓ | ☐ | |
| 3 | Mark win 3 complete | ✓ | ☐ | |
| 4 | Verify all showing complete | 3/3 accomplished | ☐ | |
| 5 | Verify Scorecard | Full win points | ☐ | |
| 6 | Visual celebration | Success feedback | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-006: Win Review - Mixed Results

**Priority:** High | **Time:** 3 min  
**Prerequisites:** 3 wins to review

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Mark win 1 complete | ✓ | ☐ | |
| 2 | Mark win 2 incomplete | ✗ | ☐ | |
| 3 | Mark win 3 complete | ✓ | ☐ | |
| 4 | Verify mixed display | Different states visible | ☐ | |
| 5 | Scorecard reflects partial | Appropriate percentage | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-007: Win Review - Empty State

**Priority:** Medium | **Time:** 2 min  
**Prerequisites:** User with 0 morning wins

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View PM Bookend (no AM wins) | Win Review section | ☐ | |
| 2 | Verify empty message | "No wins to review" or similar | ☐ | |
| 3 | No errors displayed | Handles gracefully | ☐ | |
| 4 | Reflection still accessible | Can complete reflection | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-008: Reflection - Form Display

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** PM Bookend accessible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Reflection section | Form visible | ☐ | |
| 2 | Verify "What went well?" field | Text area with label | ☐ | |
| 3 | Verify "What could be better?" field | Text area with label | ☐ | |
| 4 | Verify "What's your focus?" field | Text area with label | ☐ | |
| 5 | Verify Submit button | Save/Submit visible | ☐ | |
| 6 | All fields initially empty | No pre-populated text | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-009: Reflection - Enter Good

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Reflection form open

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click "What went well?" field | Field focused | ☐ | |
| 2 | Type: `Great team collaboration today, finished ahead of schedule` | Text appears | ☐ | |
| 3 | Verify multi-line works | Can press Enter for new line | ☐ | |
| 4 | Verify character display | Text not cut off | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-010: Reflection - Enter Better

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Reflection form open

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click "What could be better?" field | Field focused | ☐ | |
| 2 | Type: `Could have started meetings on time, less context switching` | Text appears | ☐ | |
| 3 | Text accepted | No validation errors | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-011: Reflection - Enter Focus

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Reflection form open

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click "Focus" field | Field focused | ☐ | |
| 2 | Type: `Prepare the quarterly presentation and review team feedback` | Text appears | ☐ | |
| 3 | Text accepted | No validation errors | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-012: Reflection - Submit Complete

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** All 3 fields filled

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Verify all fields have content | Good/Better/Best filled | ☐ | |
| 2 | Click Submit/Save button | Processing indicator | ☐ | |
| 3 | Verify success message | "Reflection saved" or similar | ☐ | |
| 4 | Verify visual feedback | Success state shown | ☐ | |
| 5 | Scorecard updates | Percentage increases | ☐ | |
| 6 | Refresh page | Data persisted | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-013: Reflection - Partial Submit

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Reflection form open

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Fill only "Good" field | One field has content | ☐ | |
| 2 | Click Submit | Either saves partial OR shows validation | ☐ | |
| 3 | If validation error | Shows which fields required | ☐ | |
| 4 | If saves partial | Partial credit on scorecard | ☐ | |
| 5 | Document behavior | Note actual behavior | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED  
**Note:** Document whether partial submission is allowed

---

### DEV-PM-014: Reflection - Edit After Save

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** Reflection already submitted

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View submitted reflection | Previous answers displayed | ☐ | |
| 2 | Click to edit "Good" field | Can modify text | ☐ | |
| 3 | Change content | Updates accepted | ☐ | |
| 4 | Re-save | Changes saved | ☐ | |
| 5 | Refresh page | Edits persisted | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-015: Reflection - Validation

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Reflection form open

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Try to submit all empty | Validation error shown | ☐ | |
| 2 | Try whitespace only | Rejected or trimmed | ☐ | |
| 3 | Very long text (2000+ chars) | Either accepted or shows limit | ☐ | |
| 4 | Special characters/HTML | Sanitized, no XSS | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-016: PM Bookend - Full Completion

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** AM complete with wins

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Mark all wins as complete | Win Review done | ☐ | |
| 2 | Complete all reflection fields | All 3 filled | ☐ | |
| 3 | Submit reflection | Success confirmation | ☐ | |
| 4 | Verify PM status | Shows "Complete" | ☐ | |
| 5 | Verify Scorecard | Near 100% for day | ☐ | |
| 6 | Visual celebration | Success feedback | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-017: Daily Completion - Full Day

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** AM + PM complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Verify AM complete | Grounding + Wins + Reps | ☐ | |
| 2 | Verify PM complete | Win Review + Reflection | ☐ | |
| 3 | Scorecard shows 100% | Full day complete | ☐ | |
| 4 | Celebration animation | Day completion feedback | ☐ | |
| 5 | Log out and back in | 100% persisted | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-018: PM State Persistence

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Partially completed PM

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Mark 2 of 3 wins complete | Mixed state | ☐ | |
| 2 | Fill 2 of 3 reflection fields | Partial reflection | ☐ | |
| 3 | Log out | Session ends | ☐ | |
| 4 | Log back in | Dashboard loads | ☐ | |
| 5 | Verify PM state preserved | Same items complete | ☐ | |
| 6 | Verify partial text saved | Reflection text preserved | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Summary Table

| ID | Scenario | Priority | Result |
|----|----------|----------|--------|
| DEV-PM-001 | PM Access | Critical | |
| DEV-PM-002 | Win Review Display | Critical | |
| DEV-PM-003 | Mark Win Complete | Critical | |
| DEV-PM-004 | Mark Win Incomplete | High | |
| DEV-PM-005 | All 3 Complete | Critical | |
| DEV-PM-006 | Mixed Results | High | |
| DEV-PM-007 | Empty State | Medium | |
| DEV-PM-008 | Reflection Display | Critical | |
| DEV-PM-009 | Enter Good | Critical | |
| DEV-PM-010 | Enter Better | Critical | |
| DEV-PM-011 | Enter Focus | Critical | |
| DEV-PM-012 | Submit Complete | Critical | |
| DEV-PM-013 | Partial Submit | High | |
| DEV-PM-014 | Edit After Save | Medium | |
| DEV-PM-015 | Validation | High | |
| DEV-PM-016 | PM Full Completion | Critical | |
| DEV-PM-017 | Full Day Complete | Critical | |
| DEV-PM-018 | State Persistence | High | |

**Total: 18 Scenarios**  
**Critical: 11 | High: 5 | Medium: 2**

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| QA Lead | | | |

---

*PM Bookend Test Scripts Complete*
