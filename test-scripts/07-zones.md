# 🌐 Zones Test Scripts

> **Complete Test Coverage for Community, Coaching & Locker Zones**  
> *36 Scenarios | ~3-4 Hours | Tests Zone-Gated Features*

---

## Overview

Zones are time-gated features that unlock as users progress through the program:
- **Community Zone**: Unlocks Day 15 (peer networking, discussions)
- **Coaching Zone**: Unlocks Day 22 (coaching content, 1:1 scheduling)
- **Locker Zone**: Available from Day 1 (personal resource storage)

### Zone Unlock Schedule
| Zone | Unlock Day | Key Features |
|------|------------|--------------|
| Community | Day 15 | Live Events, My Community, Feed, Resources |
| Coaching | Day 22 | Coaching Library, 1:1 Sessions, AI Roleplay |
| Locker | Day 1 | Saved Content, Notes, Personal Resources |

---

## Pre-Execution Checklist

```
□ Environment: https://leaderreps-test.web.app
□ Test users at various days (Day 10, Day 18, Day 25)
□ Admin with Time Travel access for day testing
□ Browser DevTools ready
□ Note-taking ready for edge cases
```

---

## Section 1: Community Zone Access (4 Scenarios)

### ZONE-COMM-001: Community Gate - Before Day 15

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** User at Day 10-14, OR Time Travel

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as user Day 10-14 | Dashboard loads | ☐ | |
| 2 | Locate Community nav item | Visible in navigation | ☐ | |
| 3 | Click Community | Zone Gate displays | ☐ | |
| 4 | Verify gate message | Shows "Unlocks Day 15" or similar | ☐ | |
| 5 | Verify countdown/progress | Shows days until unlock | ☐ | |
| 6 | Cannot bypass gate | No way to access content | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-002: Community Unlock - Day 15 Exactly

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** Time Travel to Day 15

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Set Time Travel to Day 15 | Day updates | ☐ | |
| 2 | Navigate to Community | Community loads (no gate) | ☐ | |
| 3 | Verify tabs visible | All community tabs present | ☐ | |
| 4 | Verify celebration/unlock message | Welcome message shown | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-003: Community Access - After Day 15

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User at Day 20+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as user Day 20+ | Dashboard loads | ☐ | |
| 2 | Navigate to Community | Community loads immediately | ☐ | |
| 3 | No gate displayed | Full access | ☐ | |
| 4 | All features functional | Can browse, interact | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-004: Community Deep Link - Before Unlock

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User at Day 10

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate directly to /community | URL attempted | ☐ | |
| 2 | Verify gate displayed | Cannot bypass via URL | ☐ | |
| 3 | Navigate to /community/feed | Gate still shown | ☐ | |
| 4 | Verify no content leakage | No partial content visible | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 2: Community Tabs (5 Scenarios)

### ZONE-COMM-005: Community Tab Navigation

**Priority:** High | **Time:** 5 min  
**Prerequisites:** User at Day 15+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Community | Community loads | ☐ | |
| 2 | Verify 4 tabs visible | Live Events, My Community, Feed, Resources | ☐ | |
| 3 | Click "Live Events" tab | Events content loads | ☐ | |
| 4 | Click "My Community" tab | Community content loads | ☐ | |
| 5 | Click "Feed" tab | Discussion feed loads | ☐ | |
| 6 | Click "Resources" tab | Resources content loads | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-006: Live Events Tab

**Priority:** High | **Time:** 5 min  
**Prerequisites:** User at Day 15+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click Live Events tab | Events list loads | ☐ | |
| 2 | Verify event cards visible | Shows upcoming events | ☐ | |
| 3 | Click an event | Event detail opens | ☐ | |
| 4 | Verify registration option | Can register (if available) | ☐ | |
| 5 | Verify past events accessible | Can view recorded events | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-007: My Community Tab

**Priority:** High | **Time:** 5 min  
**Prerequisites:** User at Day 15+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click My Community tab | Community profile loads | ☐ | |
| 2 | Verify user's community status | Shows connections/activity | ☐ | |
| 3 | Verify connection features | Can view other members | ☐ | |
| 4 | Verify activity history | Shows participation | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-008: Community Feed Tab

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** User at Day 15+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click Feed tab | Discussion feed loads | ☐ | |
| 2 | Verify posts visible | Shows community discussions | ☐ | |
| 3 | Verify filtering options | Can filter by topic/date | ☐ | |
| 4 | Click a post | Post detail opens | ☐ | |
| 5 | Verify author info visible | Shows who posted | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-009: Community Resources Tab

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User at Day 15+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click Resources tab | Resources content loads | ☐ | |
| 2 | Verify resource categories | Shows shared resources | ☐ | |
| 3 | Click a resource | Resource opens/downloads | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 3: Community Interactions (6 Scenarios)

### ZONE-COMM-010: Create Discussion Post

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** User at Day 15+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Community Feed | Feed loads | ☐ | |
| 2 | Click "Create Post" or "+" | New post form opens | ☐ | |
| 3 | Enter post title | Title field accepts input | ☐ | |
| 4 | Enter post content | Content area accepts input | ☐ | |
| 5 | Click Submit/Post | Post is created | ☐ | |
| 6 | Verify post appears in feed | New post visible | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-011: React to Post

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User at Day 15+, existing posts

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Community Feed | Feed loads | ☐ | |
| 2 | Find a post to react to | Post visible | ☐ | |
| 3 | Click reaction button (like/heart) | Reaction is added | ☐ | |
| 4 | Verify count updates | Reaction count +1 | ☐ | |
| 5 | Click again to remove | Reaction is removed | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-012: Comment on Post

**Priority:** High | **Time:** 5 min  
**Prerequisites:** User at Day 15+, existing posts

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click a post to view details | Post detail opens | ☐ | |
| 2 | Locate comment input | Comment field visible | ☐ | |
| 3 | Enter comment text | Text accepted | ☐ | |
| 4 | Submit comment | Comment is saved | ☐ | |
| 5 | Verify comment appears | Shows in comment list | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-013: Edit Own Post

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** User at Day 15+, own post created

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Find own post in feed | Post visible | ☐ | |
| 2 | Click edit option (⋮ menu) | Edit option available | ☐ | |
| 3 | Modify content | Content editable | ☐ | |
| 4 | Save changes | Updates saved | ☐ | |
| 5 | Verify "Edited" indicator | Shows edit timestamp | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-014: Delete Own Post

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** User at Day 15+, own post created

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Find own post in feed | Post visible | ☐ | |
| 2 | Click delete option (⋮ menu) | Delete option available | ☐ | |
| 3 | Confirm deletion | Confirmation dialog | ☐ | |
| 4 | Post is removed | No longer in feed | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COMM-015: Filter Feed by Topic

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** User at Day 15+, multiple posts with tags

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Feed | Feed loads | ☐ | |
| 2 | Locate filter controls | Filters visible | ☐ | |
| 3 | Select a topic/category | Filter applied | ☐ | |
| 4 | Verify filtered results | Only matching posts shown | ☐ | |
| 5 | Clear filter | All posts return | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 4: Coaching Zone Access (4 Scenarios)

### ZONE-COACH-001: Coaching Gate - Before Day 22

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** User at Day 15-21, OR Time Travel

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as user Day 15-21 | Dashboard loads | ☐ | |
| 2 | Locate Coaching nav item | Visible in navigation | ☐ | |
| 3 | Click Coaching | Zone Gate displays | ☐ | |
| 4 | Verify gate message | Shows "Unlocks Day 22" or similar | ☐ | |
| 5 | Verify countdown/progress | Shows days until unlock | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COACH-002: Coaching Unlock - Day 22 Exactly

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** Time Travel to Day 22

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Set Time Travel to Day 22 | Day updates | ☐ | |
| 2 | Navigate to Coaching | Coaching loads (no gate) | ☐ | |
| 3 | Verify tabs visible | All coaching tabs present | ☐ | |
| 4 | Verify celebration/unlock message | Welcome message shown | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COACH-003: Coaching Access - After Day 22

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User at Day 25+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as user Day 25+ | Dashboard loads | ☐ | |
| 2 | Navigate to Coaching | Coaching loads immediately | ☐ | |
| 3 | No gate displayed | Full access | ☐ | |
| 4 | All features functional | Can browse, interact | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COACH-004: Coaching Deep Link - Before Unlock

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User at Day 15

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate directly to /coaching | URL attempted | ☐ | |
| 2 | Verify gate displayed | Cannot bypass via URL | ☐ | |
| 3 | Navigate to /coaching/schedule | Gate still shown | ☐ | |
| 4 | Verify no content leakage | No partial content visible | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 5: Coaching Features (6 Scenarios)

### ZONE-COACH-005: Coaching Tab Navigation

**Priority:** High | **Time:** 5 min  
**Prerequisites:** User at Day 22+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Coaching | Coaching loads | ☐ | |
| 2 | Verify tabs visible | Multiple coaching tabs | ☐ | |
| 3 | Click each tab | Each tab loads content | ☐ | |
| 4 | Verify no broken tabs | All tabs functional | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COACH-006: Coaching Library

**Priority:** High | **Time:** 5 min  
**Prerequisites:** User at Day 22+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Coaching Library | Library loads | ☐ | |
| 2 | Verify coaching content visible | Videos/resources shown | ☐ | |
| 3 | Click a coaching resource | Resource opens | ☐ | |
| 4 | Verify video playback (if video) | Video plays | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COACH-007: 1:1 Session Scheduling (Days 23-35)

**Priority:** Critical | **Time:** 10 min  
**Prerequisites:** User at Day 23-35

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Coaching | Coaching loads | ☐ | |
| 2 | Locate 1:1 scheduling | Schedule button/link visible | ☐ | |
| 3 | Click to schedule | Calendar/booking UI opens | ☐ | |
| 4 | Select available time slot | Slot selectable | ☐ | |
| 5 | Confirm booking | Session scheduled | ☐ | |
| 6 | Verify confirmation | Confirmation shown | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COACH-008: 1:1 Window Closed (Day 36+)

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User at Day 36+

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as user Day 36+ | Dashboard loads | ☐ | |
| 2 | Navigate to Coaching | Coaching loads | ☐ | |
| 3 | Attempt to schedule 1:1 | Window closed message | ☐ | |
| 4 | Verify can still access coaching content | Content accessible | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COACH-009: My Sessions View

**Priority:** High | **Time:** 5 min  
**Prerequisites:** User at Day 22+ with booked session

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Coaching | Coaching loads | ☐ | |
| 2 | Find "My Sessions" tab | Tab visible | ☐ | |
| 3 | Click My Sessions | Sessions list loads | ☐ | |
| 4 | Verify booked session visible | Shows date/time | ☐ | |
| 5 | Can cancel session (if allowed) | Cancel option works | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-COACH-010: AI Roleplay Feature

**Priority:** Medium | **Time:** 5 min  
**Prerequisites:** User at Day 22+, feature enabled

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to AI Roleplay | Feature loads (if available) | ☐ | |
| 2 | Select scenario | Scenarios listed | ☐ | |
| 3 | Start roleplay | Interaction begins | ☐ | |
| 4 | Complete interaction | Can finish session | ☐ | |
| 5 | View feedback/results | Summary shown | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 6: Locker Zone (10 Scenarios)

### ZONE-LOCK-001: Locker Access - Day 1

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** New user at Day 1

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as Day 1 user | Dashboard loads | ☐ | |
| 2 | Locate Locker nav item | Visible in navigation | ☐ | |
| 3 | Click Locker | Locker loads (no gate) | ☐ | |
| 4 | Verify empty state | Shows "no saved items" message | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-LOCK-002: Save Content to Locker

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** User with content access

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Content Library | Library loads | ☐ | |
| 2 | Find content item with save option | Bookmark/save icon visible | ☐ | |
| 3 | Click save/bookmark icon | Content saved | ☐ | |
| 4 | Verify save confirmation | Toast/indicator shown | ☐ | |
| 5 | Navigate to Locker | Locker loads | ☐ | |
| 6 | Verify saved item appears | Item in Locker list | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-LOCK-003: View Saved Content

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User with saved content

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Locker | Locker loads | ☐ | |
| 2 | Verify saved items visible | List of saved content | ☐ | |
| 3 | Click saved item | Opens content viewer | ☐ | |
| 4 | Verify content accessible | Full content available | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-LOCK-004: Remove from Locker

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User with saved content

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Locker | Locker loads | ☐ | |
| 2 | Find saved item | Item visible | ☐ | |
| 3 | Click remove/unsave | Remove option works | ☐ | |
| 4 | Confirm removal | Confirmation dialog | ☐ | |
| 5 | Item removed from Locker | No longer in list | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-LOCK-005: Locker Categories/Filters

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** User with multiple saved items

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Locker | Locker loads | ☐ | |
| 2 | Locate filter/category options | Filters visible | ☐ | |
| 3 | Filter by content type | Filtered results shown | ☐ | |
| 4 | Clear filter | All items return | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-LOCK-006: Create Personal Note

**Priority:** Medium | **Time:** 5 min  
**Prerequisites:** User at any day

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Locker | Locker loads | ☐ | |
| 2 | Find "Add Note" option | Note creation available | ☐ | |
| 3 | Click to create note | Note editor opens | ☐ | |
| 4 | Enter note title and content | Text accepted | ☐ | |
| 5 | Save note | Note saved | ☐ | |
| 6 | Verify note in Locker | Note visible in list | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-LOCK-007: Edit Personal Note

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** User with existing note

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Locker | Locker loads | ☐ | |
| 2 | Find existing note | Note visible | ☐ | |
| 3 | Click to edit | Editor opens | ☐ | |
| 4 | Modify content | Changes accepted | ☐ | |
| 5 | Save changes | Updates saved | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-LOCK-008: Delete Personal Note

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** User with existing note

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Locker | Locker loads | ☐ | |
| 2 | Find existing note | Note visible | ☐ | |
| 3 | Click delete option | Delete available | ☐ | |
| 4 | Confirm deletion | Confirmation shown | ☐ | |
| 5 | Note removed | No longer in list | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-LOCK-009: Locker Search

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** User with multiple saved items

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Locker | Locker loads | ☐ | |
| 2 | Locate search input | Search visible | ☐ | |
| 3 | Enter search term | Search accepted | ☐ | |
| 4 | Verify results | Matching items shown | ☐ | |
| 5 | Clear search | All items return | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### ZONE-LOCK-010: Locker Persistence

**Priority:** High | **Time:** 5 min  
**Prerequisites:** User with saved content

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Verify Locker has saved items | Items visible | ☐ | |
| 2 | Logout | Session ends | ☐ | |
| 3 | Login again | Dashboard loads | ☐ | |
| 4 | Navigate to Locker | Locker loads | ☐ | |
| 5 | Verify items still present | Data persisted | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Test Execution Summary

| Section | Scenarios | Status | Notes |
|---------|-----------|--------|-------|
| Community Access | 4 | ☐ | |
| Community Tabs | 5 | ☐ | |
| Community Interactions | 6 | ☐ | |
| Coaching Access | 4 | ☐ | |
| Coaching Features | 6 | ☐ | |
| Locker Zone | 10 | ☐ | |
| **TOTAL** | **35** | | |

---

## Bug Template

```markdown
**Scenario ID:** ZONE-XXX-XXX
**Title:** [Brief description]
**Severity:** Critical/High/Medium/Low
**Environment:** https://leaderreps-test.web.app
**User:** [Day X user]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**

**Actual Result:**

**Screenshots:**
[Attach images]

**Console Errors:**
[Paste errors]
```

---

*Last Updated: January 2026*
