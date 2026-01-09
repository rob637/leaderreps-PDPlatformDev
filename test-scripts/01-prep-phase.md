# 📋 Prep Phase Test Scripts

> **Complete Test Coverage for Prep Phase**  
> *14 Scenarios | ~2-3 Hours | Tests Pre-Program Experience*

---

## Overview

The Prep Phase begins when a user first joins the program and ends when they complete all prep gate requirements. During this phase, users:
- Complete Leader Profile setup
- Take Baseline Assessment
- Access prep-only content
- Cannot access Day 1+ program content

---

## Pre-Execution Checklist

```
□ Environment: https://leaderreps-test.web.app
□ Test users configured (testprep@test.com)
□ Time Travel set to prep phase dates (Day -7 to Day -1)
□ Admin access available for setup tasks
□ Browser DevTools ready for debugging
```

---

## Test Scenarios

### PREP-001: New User Registration Experience

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** Fresh invite link, new email

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Admin generates invite link | Link created successfully | ☐ | |
| 2 | Open invite link in incognito | Registration form displays | ☐ | |
| 3 | Verify email pre-populated | Email field shows invited email | ☐ | |
| 4 | Enter First Name: `Test` | Field accepts input | ☐ | |
| 5 | Enter Last Name: `PrepUser` | Field accepts input | ☐ | |
| 6 | Enter Password: `TestPass123!` | Password accepted | ☐ | |
| 7 | Click "Create Account" | Account created, redirected to Dashboard | ☐ | |
| 8 | Verify Welcome message | First-time user welcome displays | ☐ | |
| 9 | Verify Prep Phase state | Dashboard shows prep phase content | ☐ | |
| 10 | Verify Prep Gate visible | Required items displayed prominently | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

**Bug Notes:**
```
Issue: 
Severity: 
Screenshot: 
```

---

### PREP-002: Cohort Assignment

**Priority:** High | **Time:** 3 min  
**Prerequisites:** New user just registered

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | As admin, go to User Management | User list loads | ☐ | |
| 2 | Find newly registered user | User appears in list | ☐ | |
| 3 | View user details | Cohort assignment visible | ☐ | |
| 4 | Verify correct cohort | Matches invite/expected cohort | ☐ | |
| 5 | Verify start date | Matches cohort start date | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-003: Prep Gate Display

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** User in prep phase with incomplete items

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as prep phase user | Dashboard loads | ☐ | |
| 2 | Verify Prep Gate section visible | Shows prominently on dashboard | ☐ | |
| 3 | Verify Leader Profile item | Shows with status (incomplete) | ☐ | |
| 4 | Verify Baseline Assessment item | Shows with status (incomplete) | ☐ | |
| 5 | Verify progress indicator | Shows "0 of 2" or similar | ☐ | |
| 6 | Verify items are clickable | Cursor changes, hover states work | ☐ | |
| 7 | Verify visual hierarchy | Prep Gate is primary focus | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-004: Leader Profile - Initial View

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** User with incomplete prep

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click "Leader Profile" from Prep Gate | Profile form opens | ☐ | |
| 2 | Verify form title | "Leader Profile" or similar | ☐ | |
| 3 | Verify all required fields visible | All fields displayed | ☐ | |
| 4 | Verify Leadership Identity field | LIS input field present | ☐ | |
| 5 | Verify instruction text | Helpful guidance displayed | ☐ | |
| 6 | Verify Save button | Submit/Save visible | ☐ | |
| 7 | Verify Cancel/Back option | Can exit without saving | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-005: Leader Profile - Form Entry

**Priority:** Critical | **Time:** 10 min  
**Prerequisites:** Leader Profile form open

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Enter all required fields | Fields accept input | ☐ | |
| 2 | Enter Leadership Identity Statement | LIS accepted (test: "I am a servant leader who empowers my team through trust and clear communication.") | ☐ | |
| 3 | Verify character count (if applicable) | Shows limit/count | ☐ | |
| 4 | Leave optional fields empty | Form still valid | ☐ | |
| 5 | Click Save/Submit | Processing indicator | ☐ | |
| 6 | Verify success message | "Saved" confirmation | ☐ | |
| 7 | Return to Dashboard | Profile shows complete | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-006: Leader Profile - Validation Errors

**Priority:** High | **Time:** 5 min  
**Prerequisites:** Leader Profile form open

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Leave all fields empty | Form in empty state | ☐ | |
| 2 | Click Save | Validation errors display | ☐ | |
| 3 | Verify error messages | Each required field shows error | ☐ | |
| 4 | Verify error styling | Fields highlighted in red/error state | ☐ | |
| 5 | Enter one field | Error clears for that field | ☐ | |
| 6 | Verify cannot submit partial | Still shows errors for empty required | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-007: Leader Profile - Edit After Save

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** Completed Leader Profile

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Leader Profile | Profile loads with saved data | ☐ | |
| 2 | Verify data populated | All fields show saved values | ☐ | |
| 3 | Edit LIS text | Changes accepted | ☐ | |
| 4 | Save changes | Success message | ☐ | |
| 5 | Refresh page | Changes persisted | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-008: Baseline Assessment - Initial View

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** User in prep phase

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click "Baseline Assessment" from Prep Gate | Assessment opens | ☐ | |
| 2 | Verify assessment title | Clear heading | ☐ | |
| 3 | Verify introduction/instructions | User knows what to expect | ☐ | |
| 4 | Verify question count visible | "X questions" shown | ☐ | |
| 5 | Verify estimated time | Time estimate shown | ☐ | |
| 6 | Verify Start button | Can begin assessment | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-009: Baseline Assessment - Complete All Questions

**Priority:** Critical | **Time:** 15 min  
**Prerequisites:** Assessment started

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Answer first question | Answer recorded | ☐ | |
| 2 | Navigate to next question | Progress indicator updates | ☐ | |
| 3 | Answer all questions | Can complete entire assessment | ☐ | |
| 4 | Verify progress bar | Shows % or X/Y complete | ☐ | |
| 5 | Navigate backward | Can review previous answers | ☐ | |
| 6 | Change an answer | Update accepted | ☐ | |
| 7 | Reach final question | Submit/Complete button appears | ☐ | |
| 8 | Click Submit | Assessment submitted | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-010: Baseline Assessment - Results Display

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Completed assessment

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | After submission | Results page displays | ☐ | |
| 2 | Verify results summary | Scores/feedback visible | ☐ | |
| 3 | Verify recommendations | Personalized content suggestions | ☐ | |
| 4 | Verify can dismiss/continue | Return to Dashboard option | ☐ | |
| 5 | Return to Dashboard | Assessment shows complete | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-011: Prep Gate Completion

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** Leader Profile + Assessment completed

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Dashboard with both items complete | Prep Gate shows 100% | ☐ | |
| 2 | Verify visual feedback | Celebration/success indicator | ☐ | |
| 3 | Verify Prep Gate status | "Complete" or green checkmark | ☐ | |
| 4 | Verify unlock message | "Ready for Day 1" or similar | ☐ | |
| 5 | Verify Day 1 accessible | Can now access Day 1 content | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-012: Day 1 Blocked Without Prep

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** User with incomplete prep

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login with incomplete prep user | Dashboard in prep state | ☐ | |
| 2 | Try to navigate to Dev Plan | Access restricted or message shown | ☐ | |
| 3 | Try to access Content Library | Only prep content available | ☐ | |
| 4 | Try direct URL to Day 1 content | Blocked/redirected | ☐ | |
| 5 | Verify messaging | Explains why blocked | ☐ | |
| 6 | Verify call-to-action | Prompts to complete prep | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-013: Prep Content Access

**Priority:** Medium | **Time:** 5 min  
**Prerequisites:** User in prep phase

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to available content | Content Library loads | ☐ | |
| 2 | Verify prep-specific content visible | Welcome materials, prep videos | ☐ | |
| 3 | Click on prep content item | Content opens/plays | ☐ | |
| 4 | Verify no Day 1+ content | Future content not visible | ☐ | |
| 5 | Content displays correctly | No errors, media plays | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-014: Prep Phase Duration

**Priority:** Medium | **Time:** 10 min  
**Prerequisites:** Admin/Time Travel access

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Set Time Travel to Day -7 | User in prep phase | ☐ | |
| 2 | Verify prep gate visible | Still in prep state | ☐ | |
| 3 | Set Time Travel to Day -1 | Last day of prep | ☐ | |
| 4 | Complete prep requirements | All items done | ☐ | |
| 5 | Set Time Travel to Day 1 | First day of program | ☐ | |
| 6 | Verify transition to Dev Phase | Day 1 content available | ☐ | |
| 7 | Verify prep gate hidden/complete | No longer blocking | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Summary Table

| ID | Scenario | Priority | Result |
|----|----------|----------|--------|
| PREP-001 | New User Registration | Critical | |
| PREP-002 | Cohort Assignment | High | |
| PREP-003 | Prep Gate Display | Critical | |
| PREP-004 | Leader Profile - Initial View | Critical | |
| PREP-005 | Leader Profile - Form Entry | Critical | |
| PREP-006 | Leader Profile - Validation | High | |
| PREP-007 | Leader Profile - Edit | Medium | |
| PREP-008 | Baseline Assessment - Initial | Critical | |
| PREP-009 | Baseline Assessment - Complete | Critical | |
| PREP-010 | Baseline Assessment - Results | High | |
| PREP-011 | Prep Gate Completion | Critical | |
| PREP-012 | Day 1 Blocked Without Prep | Critical | |
| PREP-013 | Prep Content Access | Medium | |
| PREP-014 | Prep Phase Duration | Medium | |

**Total: 14 Scenarios**  
**Critical: 8 | High: 3 | Medium: 3**

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| QA Lead | | | |

---

## Bugs Logged

| GitHub Issue | Scenario | Severity | Description |
|--------------|----------|----------|-------------|
| | | | |

---

*Prep Phase Test Scripts Complete*
