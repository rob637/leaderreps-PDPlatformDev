# 📋 Dev Phase - AM Bookend Test Scripts

> **Complete Test Coverage for AM Bookend**  
> *20 Scenarios | ~2-3 Hours | Tests Morning Activities*

---

## Overview

The AM Bookend is the morning routine that users complete each day during the Development Phase (Days 1-70). It includes:
- **Grounding Rep**: Reviewing Leadership Identity Statement
- **Win the Day**: Setting 3 daily intentions/goals
- **Daily Reps**: Completing assigned practice activities

---

## Pre-Execution Checklist

```
□ Environment: https://leaderreps-test.web.app
□ Test user in Dev Phase (Day 1+)
□ Prep requirements completed for test user
□ Time Travel set to morning of test day
□ Browser DevTools ready for debugging
□ Previous day data reset if testing fresh day
```

---

## Test Scenarios

### DEV-AM-001: Grounding Rep Display

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Day 1+ user with completed prep (includes LIS)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as Day 1+ user | Dashboard loads | ☐ | |
| 2 | Locate AM Bookend section | Section visible on dashboard | ☐ | |
| 3 | Find Grounding Rep widget | Widget displays prominently | ☐ | |
| 4 | Verify LIS displayed | User's Leadership Identity Statement shows | ☐ | |
| 5 | Verify "I'm Grounded" button | CTA button visible | ☐ | |
| 6 | Verify initial state | Shows "Not complete" | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-002: Grounding Rep - Mark Complete

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Grounding Rep visible, not complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Grounding Rep widget | LIS displayed, button visible | ☐ | |
| 2 | Click "I'm Grounded" button | Button responds | ☐ | |
| 3 | Verify visual feedback | Button changes (color, checkmark, etc.) | ☐ | |
| 4 | Verify status updates | Shows "Complete" | ☐ | |
| 5 | Verify Scorecard updates | Percentage increases | ☐ | |
| 6 | Refresh page | Still shows complete | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-003: Grounding Rep - LIS Content

**Priority:** High | **Time:** 2 min  
**Prerequisites:** User with specific LIS set

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Verify LIS matches Leader Profile | Exact text matches | ☐ | |
| 2 | Verify formatting preserved | Line breaks, punctuation intact | ☐ | |
| 3 | Verify readable display | Text not truncated or cut off | ☐ | |
| 4 | Long LIS test | 200+ character LIS displays properly | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-004: Win the Day - Widget Display

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Day 1+ user, fresh day

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View AM Bookend section | Win the Day widget visible | ☐ | |
| 2 | Verify widget title | "Win the Day" or similar | ☐ | |
| 3 | Verify input field | Text input for adding wins | ☐ | |
| 4 | Verify empty state | Shows 0/3 wins or empty list | ☐ | |
| 5 | Verify Add button/action | Can see how to add wins | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-005: Win the Day - Add First Win

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Win widget visible, 0 wins

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click in input field | Field focused | ☐ | |
| 2 | Type: `Complete project proposal` | Text appears | ☐ | |
| 3 | Press Enter or click Add | Win added to list | ☐ | |
| 4 | Verify win appears | Text shows in list | ☐ | |
| 5 | Input field clears | Ready for next | ☐ | |
| 6 | Count shows 1/3 | Counter updated | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-006: Win the Day - Add 3 Wins

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** Win widget visible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Add Win 1: `Morning meeting` | Win 1 appears | ☐ | |
| 2 | Add Win 2: `Review documents` | Win 2 appears | ☐ | |
| 3 | Add Win 3: `Team check-in` | Win 3 appears | ☐ | |
| 4 | Verify count shows 3/3 | Max reached indicator | ☐ | |
| 5 | Verify Scorecard updates | Score reflects wins | ☐ | |
| 6 | Refresh page | All 3 persist | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-007: Win the Day - Cannot Add 4th Win

**Priority:** High | **Time:** 2 min  
**Prerequisites:** 3 wins already added

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View widget with 3 wins | Shows 3/3 | ☐ | |
| 2 | Attempt to add 4th win | Input disabled OR error message | ☐ | |
| 3 | Verify 3 win limit enforced | Cannot exceed 3 | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-008: Win the Day - Delete Win

**Priority:** High | **Time:** 2 min  
**Prerequisites:** At least 1 win added

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View win in list | Win displayed with delete option | ☐ | |
| 2 | Click delete/remove icon | Win removed from list | ☐ | |
| 3 | Count decreases | 2/3 or less | ☐ | |
| 4 | Can add new win | Input field re-enabled | ☐ | |
| 5 | Refresh page | Deletion persisted | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-009: Win the Day - Edit Win

**Priority:** Medium | **Time:** 2 min  
**Prerequisites:** At least 1 win added

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View existing win | Win text displayed | ☐ | |
| 2 | Click to edit (if available) | Edit mode activated | ☐ | |
| 3 | Change text | New text accepted | ☐ | |
| 4 | Save changes | Updated text shown | ☐ | |
| 5 | Refresh page | Edit persisted | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED  
**Note:** If edit not supported, mark N/A

---

### DEV-AM-010: Win the Day - Validation

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Win widget visible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Try to add empty win | Rejected or error | ☐ | |
| 2 | Try whitespace only: `   ` | Rejected or trimmed | ☐ | |
| 3 | Try very long win (500+ chars) | Either accepted or shows max length | ☐ | |
| 4 | Try special characters: `<script>test</script>` | Sanitized, no XSS | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-011: Daily Reps - Widget Display

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View AM Bookend section | Daily Reps section visible | ☐ | |
| 2 | Verify section title | "Daily Reps" or similar | ☐ | |
| 3 | Verify reps displayed | One or more reps shown | ☐ | |
| 4 | Each rep has checkbox | Interactive elements | ☐ | |
| 5 | Reps match current day | Appropriate for program day | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-012: Daily Reps - Rep Content

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Reps visible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Read rep text | Clear, actionable instructions | ☐ | |
| 2 | Verify rep makes sense | Appropriate for current week/day | ☐ | |
| 3 | Day 1 reps vs Day 30 reps | Content differs appropriately | ☐ | |
| 4 | No placeholder text | Real content, not "Lorem ipsum" | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-013: Daily Reps - Mark Complete

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Rep visible, not complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click checkbox on rep | Checkbox fills | ☐ | |
| 2 | Visual feedback | Rep shows complete state | ☐ | |
| 3 | Scorecard updates | Percentage increases | ☐ | |
| 4 | Refresh page | Still complete | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-014: Daily Reps - Multiple Reps

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Day with multiple reps

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Count visible reps | Note total (e.g., 3 reps) | ☐ | |
| 2 | Complete first rep | 1/3 done | ☐ | |
| 3 | Complete second rep | 2/3 done | ☐ | |
| 4 | Complete all reps | All checked | ☐ | |
| 5 | Scorecard reflects all | Score updated for each | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-015: Daily Reps - Unmark (Toggle)

**Priority:** Medium | **Time:** 2 min  
**Prerequisites:** Rep marked complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View completed rep | Shows as done | ☐ | |
| 2 | Click to unmark | Checkbox unchecks | ☐ | |
| 3 | Scorecard decreases | Percentage drops | ☐ | |
| 4 | Refresh page | Still unchecked | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-016: AM Bookend - Full Completion

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** Fresh day, nothing complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Complete Grounding Rep | ✓ Done | ☐ | |
| 2 | Add 3 Wins | ✓ 3/3 | ☐ | |
| 3 | Complete all Daily Reps | ✓ All checked | ☐ | |
| 4 | Verify AM status | "Complete" or similar | ☐ | |
| 5 | Verify Scorecard | Reflects AM completion (~50%) | ☐ | |
| 6 | Visual celebration | Success feedback | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-017: Scorecard - Initial State

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Fresh day, nothing complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Dashboard | Scorecard widget visible | ☐ | |
| 2 | Verify 0% start | Shows 0 or minimal % | ☐ | |
| 3 | Visual representation | Progress bar/circle empty | ☐ | |
| 4 | No items complete | Reflects empty state | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-018: Scorecard - Incremental Updates

**Priority:** High | **Time:** 5 min  
**Prerequisites:** Fresh day

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Note starting % | 0% or baseline | ☐ | |
| 2 | Complete Grounding | % increases | ☐ | |
| 3 | Add 1 Win | % increases | ☐ | |
| 4 | Add 2 more Wins | % increases more | ☐ | |
| 5 | Complete 1 Rep | % increases | ☐ | |
| 6 | Verify math makes sense | No strange jumps | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-019: Scorecard - Decrements

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** Some items complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Note current % | e.g., 40% | ☐ | |
| 2 | Delete a win | % decreases | ☐ | |
| 3 | Unmark a rep | % decreases | ☐ | |
| 4 | Score reflects current state | Accurate calculation | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-020: Morning State Persistence

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Partially completed AM

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Complete some AM items | Mixed state | ☐ | |
| 2 | Log out | Session ends | ☐ | |
| 3 | Log back in | Dashboard loads | ☐ | |
| 4 | Verify state preserved | Same items complete | ☐ | |
| 5 | Try different browser | State still correct | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Summary Table

| ID | Scenario | Priority | Result |
|----|----------|----------|--------|
| DEV-AM-001 | Grounding Rep Display | Critical | |
| DEV-AM-002 | Grounding Rep Complete | Critical | |
| DEV-AM-003 | Grounding Rep LIS Content | High | |
| DEV-AM-004 | Win Widget Display | Critical | |
| DEV-AM-005 | Add First Win | Critical | |
| DEV-AM-006 | Add 3 Wins | Critical | |
| DEV-AM-007 | Cannot Add 4th Win | High | |
| DEV-AM-008 | Delete Win | High | |
| DEV-AM-009 | Edit Win | Medium | |
| DEV-AM-010 | Win Validation | High | |
| DEV-AM-011 | Reps Widget Display | Critical | |
| DEV-AM-012 | Rep Content | High | |
| DEV-AM-013 | Mark Rep Complete | Critical | |
| DEV-AM-014 | Multiple Reps | High | |
| DEV-AM-015 | Unmark Rep | Medium | |
| DEV-AM-016 | AM Full Completion | Critical | |
| DEV-AM-017 | Scorecard Initial | Critical | |
| DEV-AM-018 | Scorecard Increments | High | |
| DEV-AM-019 | Scorecard Decrements | Medium | |
| DEV-AM-020 | Persistence | High | |

**Total: 20 Scenarios**  
**Critical: 9 | High: 8 | Medium: 3**

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| QA Lead | | | |

---

*AM Bookend Test Scripts Complete*
