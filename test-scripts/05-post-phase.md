# 📋 Post Phase Test Scripts

> **Complete Test Coverage for Post Phase**  
> *12 Scenarios | ~1-2 Hours | Tests Day 71+ Experience*

---

## Overview

The Post Phase begins after Day 70 (end of 10-week program) and continues indefinitely. During this phase:
- All content is unlocked
- Daily practice continues
- No new content gates
- Focus shifts to ongoing habit reinforcement

---

## Pre-Execution Checklist

```
□ Environment: https://leaderreps-test.web.app
□ Test user in Post Phase (Day 71+) OR Admin with Time Travel
□ Time Travel available for transition testing
□ Browser DevTools ready
```

---

## Test Scenarios

### POST-001: Day 70 to Day 71 Transition

**Priority:** Critical | **Time:** 10 min  
**Prerequisites:** Admin access, Day 70 user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Set Time Travel to Day 70 | User sees Day 70 dashboard | ☐ | |
| 2 | Verify still "Dev Phase" | Normal program experience | ☐ | |
| 3 | Check locked content | Some content still locked (if any) | ☐ | |
| 4 | Set Time Travel to Day 71 | Date advances | ☐ | |
| 5 | Verify Post Phase state | Different banner/messaging | ☐ | |
| 6 | Verify no more locked content | Everything accessible | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-002: Post Phase Dashboard

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** Post Phase user (Day 71+)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as Post Phase user | Dashboard loads | ☐ | |
| 2 | Verify Dashboard layout | Similar to Dev Phase | ☐ | |
| 3 | Verify AM Bookend available | Grounding, Wins visible | ☐ | |
| 4 | Verify PM Bookend available | Reflection visible | ☐ | |
| 5 | Verify Post Phase banner/status | "Graduate" or completion status | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-003: Full Content Access

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** Post Phase user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Content Library | Library loads | ☐ | |
| 2 | Verify ALL content visible | Days 1-70 accessible | ☐ | |
| 3 | No locked indicators | Everything unlocked | ☐ | |
| 4 | Click random Week 8 content | Opens successfully | ☐ | |
| 5 | Click random Week 10 content | Opens successfully | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-004: Continue Daily Practice - AM

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** Post Phase user, fresh day

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Dashboard | AM Bookend visible | ☐ | |
| 2 | Complete Grounding Rep | Works normally | ☐ | |
| 3 | Add 3 Wins | Works normally | ☐ | |
| 4 | Complete Daily Reps | Reps still available | ☐ | |
| 5 | Scorecard updates | Tracks progress | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-005: Continue Daily Practice - PM

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** Post Phase user with AM complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to PM Bookend | Win Review visible | ☐ | |
| 2 | Review morning wins | Mark complete/incomplete | ☐ | |
| 3 | Complete Reflection | Fill all 3 fields | ☐ | |
| 4 | Submit reflection | Saves successfully | ☐ | |
| 5 | Scorecard shows 100% | Full day tracked | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-006: Daily Rollover Post Phase

**Priority:** High | **Time:** 5 min  
**Prerequisites:** Post Phase user, Time Travel

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Complete Day 75 (or current post day) | 100% complete | ☐ | |
| 2 | Time Travel to next day | Day 76 | ☐ | |
| 3 | Verify fresh day state | Scorecard reset to 0% | ☐ | |
| 4 | Verify Grounding not complete | Reset for new day | ☐ | |
| 5 | Verify new daily reps | Fresh activities | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-007: Dev Plan in Post Phase

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Post Phase user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Dev Plan | Plan loads | ☐ | |
| 2 | Verify all 10 weeks visible | Complete timeline | ☐ | |
| 3 | All days accessible | No locked days | ☐ | |
| 4 | Can review any past day | Click Day 1, opens | ☐ | |
| 5 | Current status visible | Shows Post Phase status | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-008: Historical Data Access

**Priority:** High | **Time:** 5 min  
**Prerequisites:** Post Phase user with history

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to history/journal view | History loads | ☐ | |
| 2 | View past reflections | Previous entries visible | ☐ | |
| 3 | View scorecard history | Past scores accessible | ☐ | |
| 4 | Review Day 1 data | Original data preserved | ☐ | |
| 5 | Review Week 5 data | Mid-program data preserved | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-009: Community Access Post Phase

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Post Phase user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Community | Community loads | ☐ | |
| 2 | Verify full access | Can view posts | ☐ | |
| 3 | Can create posts | Posting works | ☐ | |
| 4 | Can interact with others | Comments/reactions work | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-010: Coaching Access Post Phase

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Post Phase user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Coaching | Coaching Hub loads | ☐ | |
| 2 | Verify access maintained | Can view coaching content | ☐ | |
| 3 | Schedule features (if any) | Still functional | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-011: Post Phase Long-Term (Day 100+)

**Priority:** Medium | **Time:** 5 min  
**Prerequisites:** Time Travel to Day 100+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Time Travel to Day 100 | Date set | ☐ | |
| 2 | Verify dashboard works | Loads normally | ☐ | |
| 3 | Complete AM Bookend | Still functional | ☐ | |
| 4 | Content Library accessible | All content available | ☐ | |
| 5 | Time Travel to Day 365 | One year out | ☐ | |
| 6 | App still functional | No errors | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-012: Graduation/Completion Badge

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** Post Phase user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Dashboard | Dashboard loads | ☐ | |
| 2 | Verify completion badge/status | Graduate indicator visible | ☐ | |
| 3 | Check profile for badge | Completion badge in profile | ☐ | |
| 4 | Verify Locker has completion items | Certificate or badge stored | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Summary Table

| ID | Scenario | Priority | Result |
|----|----------|----------|--------|
| POST-001 | Day 70-71 Transition | Critical | |
| POST-002 | Post Phase Dashboard | Critical | |
| POST-003 | Full Content Access | Critical | |
| POST-004 | Daily Practice - AM | Critical | |
| POST-005 | Daily Practice - PM | Critical | |
| POST-006 | Daily Rollover | High | |
| POST-007 | Dev Plan in Post | High | |
| POST-008 | Historical Data | High | |
| POST-009 | Community Access | High | |
| POST-010 | Coaching Access | High | |
| POST-011 | Long-Term (Day 100+) | Medium | |
| POST-012 | Graduation Badge | Medium | |

**Total: 12 Scenarios**  
**Critical: 5 | High: 5 | Medium: 2**

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| QA Lead | | | |

---

*Post Phase Test Scripts Complete*
