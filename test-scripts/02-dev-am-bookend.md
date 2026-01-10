# ☀️ Dev Phase - AM Bookend Test Scripts

> **Complete Test Coverage for AM Bookend**  
> *20 Scenarios | ~2-3 Hours | Tests Morning Activities*

---

## Overview

The AM Bookend is the morning routine that users complete each day during the Development Phase (Days 1-70). It includes:
- **Grounding Rep**: Reviewing and reciting Leadership Identity Statement (LIS)
- **Win the Day**: Setting 3 daily priorities in fixed input slots
- **Daily Reps**: Completing assigned daily practice activities

---

## Pre-Execution Checklist

```
□ Environment: https://leaderreps-test.web.app
□ Test user in Dev Phase (Day 1+)
□ Prep requirements completed for test user (Leader Profile + Baseline)
□ Time Travel set to morning of test day (Admin → Test Center)
□ Browser DevTools ready for debugging
□ Previous day data reset if testing fresh day
```

---

## Section 1: Grounding Rep Widget (5 Scenarios)

### DEV-AM-001: Grounding Rep Display - With LIS

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Day 1+ user with completed Leader Profile (has LIS)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as Day 1+ user | Dashboard loads | ☐ | |
| 2 | Locate AM Bookend section | Section with sun icon and "AM Bookend: Start Strong" header visible | ☐ | |
| 3 | Find Grounding Rep widget | Card with "Grounding Rep" title and orange Zap icon | ☐ | |
| 4 | Verify LIS displayed | User's Leadership Identity Statement shows in quotes, italic text | ☐ | |
| 5 | Hover over widget | "Edit Statement" link appears | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-002: Grounding Rep Display - No LIS

**Priority:** High | **Time:** 2 min  
**Prerequisites:** Day 1+ user WITHOUT a Leadership Identity Statement

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as user without LIS | Dashboard loads | ☐ | |
| 2 | Find Grounding Rep widget | Widget displays | ☐ | |
| 3 | Verify empty state | Shows "Who are you as a leader?" message | ☐ | |
| 4 | Verify helper text | "You haven't defined your Leadership Identity Statement yet." | ☐ | |
| 5 | Verify CTA button | "Create LIS" button visible | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-003: Grounding Rep - Edit LIS

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User with existing LIS

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Hover over Grounding Rep widget | "Edit Statement" link appears | ☐ | |
| 2 | Click "Edit Statement" | LIS Maker card appears with textarea | ☐ | |
| 3 | Verify instruction text | Shows format hint: "I am a [Core Value] leader who..." | ☐ | |
| 4 | Edit the statement | Textarea accepts new text | ☐ | |
| 5 | Click "Save" button | Widget closes, returns to display mode | ☐ | |
| 6 | Verify updated LIS | New text displays in quotes | ☐ | |
| 7 | Refresh page | LIS persists with updated text | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-004: Grounding Rep - Create New LIS

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User without LIS

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click "Create LIS" button | LIS Maker card appears | ☐ | |
| 2 | Verify empty textarea | Placeholder shows "I am a..." | ☐ | |
| 3 | Type: `I am a courageous leader who empowers others` | Text appears in textarea | ☐ | |
| 4 | Click "Save" button | Returns to Grounding Rep display | ☐ | |
| 5 | Verify LIS shows | New statement displayed in quotes | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-005: Grounding Rep - Cancel Edit

**Priority:** Medium | **Time:** 2 min  
**Prerequisites:** User with existing LIS

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click "Edit Statement" | LIS Maker opens | ☐ | |
| 2 | Modify the text | New text in textarea | ☐ | |
| 3 | Click "Cancel" button | Returns to display mode | ☐ | |
| 4 | Verify original LIS | Original statement unchanged | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 2: Win the Day Widget (8 Scenarios)

### DEV-AM-006: Win the Day - Widget Display

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Day 1+ user, fresh day

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View AM Bookend section | Win the Day widget visible | ☐ | |
| 2 | Verify widget title | "Win the Day" with Trophy icon, teal accent | ☐ | |
| 3 | Verify instruction text | "Identify 3 High-Impact Actions" | ☐ | |
| 4 | Verify 3 input slots | Three input fields with checkboxes | ☐ | |
| 5 | Verify placeholders | "Enter Priority #1", "#2", "#3" | ☐ | |
| 6 | Verify Save button | "Save Priorities" button at bottom | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-007: Win the Day - Enter First Priority

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Day 1+ user with empty priorities

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click first input field | Field becomes active | ☐ | |
| 2 | Type: `Complete project proposal` | Text appears in field | ☐ | |
| 3 | Click outside field (blur) | Auto-saves silently | ☐ | |
| 4 | Verify checkbox enabled | Checkbox no longer grayed out | ☐ | |
| 5 | Refresh page | Text persists in first slot | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-008: Win the Day - Enter All 3 Priorities

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Enter Priority #1: `Morning meeting` | Text in slot 1 | ☐ | |
| 2 | Enter Priority #2: `Review documents` | Text in slot 2 | ☐ | |
| 3 | Enter Priority #3: `Team check-in` | Text in slot 3 | ☐ | |
| 4 | Click "Save Priorities" button | Loading spinner briefly shows | ☐ | |
| 5 | Verify all 3 saved | All text persists | ☐ | |
| 6 | Refresh page | All 3 priorities still there | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-009: Win the Day - Mark Priority Complete

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** At least one priority entered

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Verify checkbox is clickable | Checkbox not grayed out | ☐ | |
| 2 | Click checkbox for Priority #1 | Checkbox fills with green checkmark | ☐ | |
| 3 | Verify visual change | Row turns green, text gets strikethrough | ☐ | |
| 4 | Verify Scorecard updates | Daily progress increases | ☐ | |
| 5 | Refresh page | Priority still shows complete | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-010: Win the Day - Uncheck Completed Priority

**Priority:** High | **Time:** 2 min  
**Prerequisites:** Priority marked as complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click completed checkbox | Checkbox unchecks | ☐ | |
| 2 | Verify visual change | Row returns to normal (no green, no strikethrough) | ☐ | |
| 3 | Verify Scorecard updates | Progress decreases | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-011: Win the Day - Empty Priority Checkbox Disabled

**Priority:** High | **Time:** 1 min  
**Prerequisites:** Empty priority slot

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View empty priority slot | Checkbox appears grayed out | ☐ | |
| 2 | Try to click empty checkbox | Nothing happens (disabled) | ☐ | |
| 3 | Enter text in the field | Checkbox becomes enabled | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-012: Win the Day - Edit Existing Priority

**Priority:** High | **Time:** 2 min  
**Prerequisites:** Priority already entered

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click on existing priority text | Field becomes editable | ☐ | |
| 2 | Modify text | New text replaces old | ☐ | |
| 3 | Click outside (blur) | Auto-saves | ☐ | |
| 4 | Refresh page | Updated text persists | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-013: Win the Day - Clear Priority

**Priority:** Medium | **Time:** 2 min  
**Prerequisites:** Priority already entered

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click on priority text | Field active | ☐ | |
| 2 | Select all and delete | Field shows placeholder again | ☐ | |
| 3 | Click outside (blur) | Saves empty state | ☐ | |
| 4 | Verify checkbox disabled | Checkbox grays out again | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 3: Daily Reps (4 Scenarios)

### DEV-AM-014: Daily Reps Display

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Day 1+ user with daily reps configured for current week

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View AM Bookend section | Daily Reps section visible | ☐ | |
| 2 | Verify reps listed | One or more daily reps shown | ☐ | |
| 3 | Each rep has checkbox | Interactive checkbox per rep | ☐ | |
| 4 | Verify rep labels | Meaningful text (e.g., "Practice gratitude") | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-015: Daily Reps - Mark Complete

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Daily reps visible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click checkbox on a rep | Checkbox fills | ☐ | |
| 2 | Verify visual feedback | Rep shows as complete | ☐ | |
| 3 | Verify Scorecard updates | Progress increases | ☐ | |
| 4 | Refresh page | Rep still complete | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-016: Daily Reps - Uncheck

**Priority:** High | **Time:** 1 min  
**Prerequisites:** Rep marked complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click completed rep checkbox | Checkbox unchecks | ☐ | |
| 2 | Verify visual change | Rep shows as incomplete | ☐ | |
| 3 | Verify Scorecard | Progress decreases | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-017: Daily Reps - All Complete

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Multiple daily reps visible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Complete all daily reps | All checkboxes filled | ☐ | |
| 2 | Verify visual state | All reps show complete | ☐ | |
| 3 | Verify Scorecard | Reflects all reps done | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 4: Scorecard Integration (3 Scenarios)

### DEV-AM-018: Scorecard Display

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Dashboard | Scorecard widget visible | ☐ | |
| 2 | Verify percentage shown | Shows 0-100% | ☐ | |
| 3 | Verify visual indicator | Progress bar or similar | ☐ | |
| 4 | With nothing complete | Shows 0% or low value | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-019: Scorecard Updates with AM Bookend

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** Fresh day, 0% start

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Note starting Scorecard % | Record value | ☐ | |
| 2 | Complete one priority | % increases | ☐ | |
| 3 | Complete all 3 priorities | % increases more | ☐ | |
| 4 | Complete one daily rep | % increases | ☐ | |
| 5 | Verify math is consistent | No strange jumps | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-020: AM Bookend Full Completion

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** Fresh day, all widgets visible

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Enter and complete 3 priorities | All 3 checked | ☐ | |
| 2 | Complete all daily reps | All reps checked | ☐ | |
| 3 | Verify Scorecard | Shows AM portion complete | ☐ | |
| 4 | Verify visual feedback | Widgets show success states | ☐ | |
| 5 | Refresh page | All completions persist | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Bug Reporting Template

```markdown
### BUG: [DEV-AM-XXX] Brief Description

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
| Grounding Rep | 5 | 1 | 3 | 1 |
| Win the Day | 8 | 4 | 3 | 1 |
| Daily Reps | 4 | 2 | 2 | 0 |
| Scorecard | 3 | 2 | 1 | 0 |
| **TOTAL** | **20** | **9** | **9** | **2** |
