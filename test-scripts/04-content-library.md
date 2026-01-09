# 📋 Content Library Test Scripts

> **Complete Test Coverage for Content Library**  
> *22 Scenarios | ~2-3 Hours | Tests Content Access & Viewing*

---

## Overview

The Content Library provides access to all program content including:
- **Videos**: Leadership development video content
- **Readings**: Articles, PDFs, written materials
- **Tools**: Templates, worksheets, assessments
- **Categories**: Organized by week, topic, skill area

---

## Pre-Execution Checklist

```
□ Environment: https://leaderreps-test.web.app
□ Test users at various days (Day 1, Day 15, Day 65)
□ Content exists in Firestore for test days
□ Browser DevTools ready (Network tab for media loading)
□ Volume on for video audio testing
```

---

## Test Scenarios

### DEV-CON-001: Access Content Library

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Day 1+ user logged in

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click "Content" in sidebar | Navigation occurs | ☐ | |
| 2 | Content Library loads | Page displays | ☐ | |
| 3 | Verify page title | "Content Library" or similar | ☐ | |
| 4 | Verify no console errors | DevTools clean | ☐ | |
| 5 | Verify loading completes | No spinners stuck | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-002: Content Grid Display

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Content Library loaded

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View content area | Content items displayed | ☐ | |
| 2 | Verify grid/list layout | Items arranged properly | ☐ | |
| 3 | Verify thumbnails load | Images display | ☐ | |
| 4 | Verify titles visible | Content titles shown | ☐ | |
| 5 | Verify content type indicator | Video/Reading/Tool icons | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-003: Filter - By Content Type

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Multiple content types exist

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Find filter/dropdown | Filter controls visible | ☐ | |
| 2 | Select "Videos" filter | Only videos shown | ☐ | |
| 3 | Select "Readings" filter | Only readings shown | ☐ | |
| 4 | Select "Tools" filter | Only tools shown | ☐ | |
| 5 | Clear filter / Select "All" | All types shown | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-004: Filter - By Week/Day

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Content tagged by week

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Find week/day filter | Filter option visible | ☐ | |
| 2 | Select "Week 1" | Only Week 1 content shown | ☐ | |
| 3 | Select "Week 3" | Only Week 3 content shown | ☐ | |
| 4 | Clear filter | All available content shown | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-005: Search - Basic

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Content Library loaded

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Find search input | Search field visible | ☐ | |
| 2 | Type: `leadership` | Search activates | ☐ | |
| 3 | Results update | Matching content shown | ☐ | |
| 4 | Results relevant | Titles/descriptions contain "leadership" | ☐ | |
| 5 | Clear search | All content returns | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-006: Search - No Results

**Priority:** Medium | **Time:** 2 min  
**Prerequisites:** Content Library loaded

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Search: `xyznonexistent123` | Search runs | ☐ | |
| 2 | No results display | Empty state message | ☐ | |
| 3 | Helpful message shown | "No content found" or similar | ☐ | |
| 4 | No errors | Handles gracefully | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-007: Unlocked Content - Day 1 User

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** Day 1 user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as Day 1 user | Dashboard loads | ☐ | |
| 2 | Navigate to Content Library | Library loads | ☐ | |
| 3 | Verify Day 1 content visible | Initial content accessible | ☐ | |
| 4 | Verify Day 2+ content locked/hidden | Future content not accessible | ☐ | |
| 5 | Try to click locked content (if visible) | Access denied or blocked | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-008: Unlocked Content - Day 15 User

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Day 15 user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as Day 15 user | Dashboard loads | ☐ | |
| 2 | Navigate to Content Library | Library loads | ☐ | |
| 3 | Verify Days 1-15 content accessible | Two weeks visible | ☐ | |
| 4 | Verify Day 16+ locked/hidden | Future content blocked | ☐ | |
| 5 | Count accessible items | More than Day 1 user | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-009: Video - Open Player

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Video content available

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Find a video item | Video in list | ☐ | |
| 2 | Click on video | Video detail/player opens | ☐ | |
| 3 | Player loads | Video player initialized | ☐ | |
| 4 | Video thumbnail/poster shown | Preview image visible | ☐ | |
| 5 | Play button visible | Can start playback | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-010: Video - Playback

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** Video player open

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click Play button | Video starts | ☐ | |
| 2 | Audio plays | Sound audible | ☐ | |
| 3 | Video visible | Picture displays | ☐ | |
| 4 | Progress bar updates | Shows playback position | ☐ | |
| 5 | Click Pause | Playback stops | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-011: Video - Seek/Scrub

**Priority:** High | **Time:** 2 min  
**Prerequisites:** Video playing

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click on progress bar at 50% | Video jumps to middle | ☐ | |
| 2 | Drag progress marker | Can scrub position | ☐ | |
| 3 | Click near end | Video jumps near end | ☐ | |
| 4 | Click at start | Video resets to beginning | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-012: Video - Volume Control

**Priority:** Medium | **Time:** 2 min  
**Prerequisites:** Video playing with audio

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Find volume control | Volume slider/icon visible | ☐ | |
| 2 | Mute video | Audio stops | ☐ | |
| 3 | Unmute video | Audio resumes | ☐ | |
| 4 | Adjust volume lower | Audio quieter | ☐ | |
| 5 | Adjust volume higher | Audio louder | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-013: Video - Fullscreen

**Priority:** Medium | **Time:** 2 min  
**Prerequisites:** Video playing

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Find fullscreen button | Icon visible | ☐ | |
| 2 | Click fullscreen | Video fills screen | ☐ | |
| 3 | Video continues playing | No interruption | ☐ | |
| 4 | Press Escape or click exit | Returns to normal | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-014: Video - Close Player

**Priority:** High | **Time:** 1 min  
**Prerequisites:** Video player open

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Find close/back button | Exit option visible | ☐ | |
| 2 | Click close | Player closes | ☐ | |
| 3 | Returns to Content Library | Library displays | ☐ | |
| 4 | No audio still playing | Video fully stopped | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-015: Reading - Open

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Reading content available

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Find a reading item | Reading in list | ☐ | |
| 2 | Click on reading | Reading opens | ☐ | |
| 3 | Content displays | Text/PDF visible | ☐ | |
| 4 | Title matches | Same as in list | ☐ | |
| 5 | Scrollable | Can scroll through content | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-016: Reading - Navigation

**Priority:** High | **Time:** 2 min  
**Prerequisites:** Reading open (multi-page)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Scroll through reading | Content flows | ☐ | |
| 2 | If paginated, navigate pages | Next/prev works | ☐ | |
| 3 | If PDF, zoom controls | Can zoom in/out | ☐ | |
| 4 | Close reading | Returns to Library | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-017: Tool - Open

**Priority:** High | **Time:** 2 min  
**Prerequisites:** Tool/worksheet available

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Find a tool item | Tool in list | ☐ | |
| 2 | Click on tool | Tool opens | ☐ | |
| 3 | Instructions displayed | How-to visible | ☐ | |
| 4 | Download option (if applicable) | Can download file | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-018: Tool - Download

**Priority:** Medium | **Time:** 2 min  
**Prerequisites:** Downloadable tool available

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Open tool with download | Tool displays | ☐ | |
| 2 | Click download button | Download starts | ☐ | |
| 3 | File downloads | Appears in downloads | ☐ | |
| 4 | File opens correctly | PDF/Word/etc. valid | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-019: Locked Content Indicator

**Priority:** High | **Time:** 3 min  
**Prerequisites:** User with future locked content

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Content Library | Content displays | ☐ | |
| 2 | Find locked content (if visible) | Lock icon or grayed out | ☐ | |
| 3 | Hover over locked item | Shows unlock date/requirement | ☐ | |
| 4 | Click locked item | Either blocked or shows "not yet available" | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-020: Content Progress Tracking

**Priority:** Medium | **Time:** 5 min  
**Prerequisites:** Multiple content items

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Open and complete a video | Watch to end | ☐ | |
| 2 | Return to library | Content list displays | ☐ | |
| 3 | Verify completion indicator | Checkmark or "completed" badge | ☐ | |
| 4 | Open a reading | Read content | ☐ | |
| 5 | Mark as complete (if required) | Completion action | ☐ | |
| 6 | Verify tracking persists | Refresh, still complete | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-021: Mobile Content Library

**Priority:** High | **Time:** 5 min  
**Prerequisites:** Mobile device or emulation

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Open Content Library on mobile | Page loads | ☐ | |
| 2 | Layout responsive | Content fits screen | ☐ | |
| 3 | Tap to open content | Opens correctly | ☐ | |
| 4 | Video plays on mobile | Mobile playback works | ☐ | |
| 5 | Reading scrolls properly | Touch scrolling smooth | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-022: Content Loading Error Handling

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** DevTools Network tab

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Open Content Library | Content loads | ☐ | |
| 2 | Throttle network (slow 3G) | Simulate slow connection | ☐ | |
| 3 | Try to load content | Loading indicator shown | ☐ | |
| 4 | Content eventually loads OR | Timeout with message | ☐ | |
| 5 | Disable network | Show offline | ☐ | |
| 6 | Verify error message | "Cannot load" or retry option | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Summary Table

| ID | Scenario | Priority | Result |
|----|----------|----------|--------|
| DEV-CON-001 | Access Content Library | Critical | |
| DEV-CON-002 | Content Grid Display | Critical | |
| DEV-CON-003 | Filter By Type | High | |
| DEV-CON-004 | Filter By Week | High | |
| DEV-CON-005 | Basic Search | High | |
| DEV-CON-006 | No Results | Medium | |
| DEV-CON-007 | Unlocked Day 1 | Critical | |
| DEV-CON-008 | Unlocked Day 15 | High | |
| DEV-CON-009 | Video Open | Critical | |
| DEV-CON-010 | Video Playback | Critical | |
| DEV-CON-011 | Video Seek | High | |
| DEV-CON-012 | Video Volume | Medium | |
| DEV-CON-013 | Video Fullscreen | Medium | |
| DEV-CON-014 | Video Close | High | |
| DEV-CON-015 | Reading Open | Critical | |
| DEV-CON-016 | Reading Navigation | High | |
| DEV-CON-017 | Tool Open | High | |
| DEV-CON-018 | Tool Download | Medium | |
| DEV-CON-019 | Locked Indicator | High | |
| DEV-CON-020 | Progress Tracking | Medium | |
| DEV-CON-021 | Mobile Content | High | |
| DEV-CON-022 | Error Handling | Medium | |

**Total: 22 Scenarios**  
**Critical: 6 | High: 10 | Medium: 6**

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| QA Lead | | | |

---

*Content Library Test Scripts Complete*
