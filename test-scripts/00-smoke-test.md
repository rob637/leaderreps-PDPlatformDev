# 🔥 Critical Path Smoke Test

> **Run before EVERY deployment to TEST or PROD**  
> *34 Scenarios | ~3-4 Hours | Tests Core User Journey*

---

## Pre-Execution Checklist

Before starting, complete ALL items:

```
□ Browser: Chrome (latest) or Firefox (latest)
□ Clear browser cache and cookies
□ Environment: https://leaderreps-test.web.app
□ Time Travel: Reset to current date (Admin → Test Center → Time Travel)
□ Test user ready: Use appropriate test account for scenario
□ GitHub Issues open for logging bugs
□ Screenshot tool ready (Snagit, browser DevTools, or Cmd+Shift+4)
```

---

## Section 1: Authentication (6 Scenarios)

### CROSS-AUTH-001: Email Login - Valid Credentials

**Priority:** Critical | **Time:** 2 min | **User:** Any existing test user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to https://leaderreps-test.web.app | Login screen displays with LeaderReps branding | ☐ | |
| 2 | Enter valid email: `rob@sagecg.com` | Email field accepts input | ☐ | |
| 3 | Enter valid password | Password field shows dots/masked | ☐ | |
| 4 | Click "Sign In" button | Loading indicator appears briefly | ☐ | |
| 5 | Observe redirect | Dashboard loads successfully | ☐ | |
| 6 | Verify user name displayed | User name appears in header/profile area | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-002: Email Login - Wrong Password

**Priority:** High | **Time:** 2 min | **User:** Any existing user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to login screen | Login form displays | ☐ | |
| 2 | Enter valid email: `rob@sagecg.com` | Email accepted | ☐ | |
| 3 | Enter WRONG password: `wrongpassword123` | Password field accepts input | ☐ | |
| 4 | Click "Sign In" button | Loading indicator, then error | ☐ | |
| 5 | Verify error message | "Incorrect email or password" message displays | ☐ | |
| 6 | Verify still on login screen | NOT redirected to dashboard | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-007: Logout

**Priority:** Critical | **Time:** 2 min | **User:** Logged in user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Start from Dashboard (logged in) | Dashboard displays | ☐ | |
| 2 | Click profile avatar/menu | Profile dropdown or menu opens | ☐ | |
| 3 | Click "Sign Out" or "Logout" | Processing indicator | ☐ | |
| 4 | Verify redirect | Login screen displays | ☐ | |
| 5 | Try navigating to /dashboard directly | Redirected back to login | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-014: Signup Via Invite Link

**Priority:** Critical | **Time:** 5 min | **User:** New (use unique email)

**Prerequisites:** Have a valid invite link from Admin → User Management → Send Invite

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Get invite link from Admin | Link in format: `...?token=xxx` | ☐ | |
| 2 | Open invite link in new incognito window | Registration form displays with email pre-filled | ☐ | |
| 3 | Verify email is pre-populated | Email field shows invited email (read-only) | ☐ | |
| 4 | Enter First Name: `Test` | Field accepts input | ☐ | |
| 5 | Enter Last Name: `User` | Field accepts input | ☐ | |
| 6 | Enter Password: `TestPass123!` | Password accepted (6+ chars) | ☐ | |
| 7 | Click "Create Account" | Processing indicator | ☐ | |
| 8 | Verify redirect to Dashboard | Dashboard loads for new user | ☐ | |
| 9 | Verify welcome message | First-time user welcome displays | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-NAV-001: Desktop Sidebar Navigation

**Priority:** Critical | **Time:** 5 min | **User:** Active user (Day 5+)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login and view Dashboard | Dashboard loads, sidebar visible | ☐ | |
| 2 | Click "Dev Plan" in sidebar | Development Plan screen loads | ☐ | |
| 3 | Click "Community" in sidebar | Community screen loads | ☐ | |
| 4 | Click "Content" in sidebar | Content Library screen loads | ☐ | |
| 5 | Click "Coaching" in sidebar | Coaching Hub screen loads | ☐ | |
| 6 | Click "Locker" in sidebar | Locker screen loads | ☐ | |
| 7 | Click "Dashboard" in sidebar | Returns to Dashboard | ☐ | |
| 8 | Verify no console errors | Open DevTools → Console, no red errors | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-NAV-002: Mobile Bottom Navigation

**Priority:** Critical | **Time:** 5 min | **User:** Active user

**Prerequisites:** Use mobile device OR Chrome DevTools device emulation (iPhone 12)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Open app at 375px width (mobile view) | Bottom navigation bar visible | ☐ | |
| 2 | Tap "Home" icon | Dashboard loads | ☐ | |
| 3 | Tap "Community" icon | Community screen loads | ☐ | |
| 4 | Tap "Content" icon | Content Library loads | ☐ | |
| 5 | Tap "Coaching" icon | Coaching Hub loads | ☐ | |
| 6 | Tap "Locker" icon | Locker screen loads | ☐ | |
| 7 | Verify icons match labels | Icons are recognizable and labeled | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 2: Prep Phase (5 Scenarios)

### PREP-001: New User Registration Experience

**Priority:** Critical | **Time:** 5 min | **User:** Brand new user via invite

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Accept invite and create account | Account created, Dashboard loads | ☐ | See CROSS-AUTH-014 |
| 2 | Verify Prep Phase state | Banner shows "Welcome" / prep phase content | ☐ | |
| 3 | Verify cohort assignment | User associated with correct cohort | ☐ | |
| 4 | Verify Prep Gate visible | Required prep items shown prominently | ☐ | |
| 5 | Attempt to access Day 1 content | Blocked - must complete prep first | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-003: Prep Gate Display

**Priority:** Critical | **Time:** 3 min | **User:** User in Prep Phase (prep incomplete)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as prep phase user | Dashboard loads | ☐ | |
| 2 | Verify Prep Gate section visible | Shows required items (Leader Profile, Baseline) | ☐ | |
| 3 | Verify progress indicator | Shows X of Y items complete | ☐ | |
| 4 | Verify items are clickable | Can click to open each prep item | ☐ | |
| 5 | Verify Day 1 content locked | Cannot access core program content | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-004: Leader Profile Creation

**Priority:** Critical | **Time:** 10 min | **User:** User in Prep Phase

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click "Leader Profile" from Prep Gate | Leader Profile form opens | ☐ | |
| 2 | Fill in required fields | All fields accept input | ☐ | |
| 3 | Enter Leadership Identity Statement | LIS field accepts text | ☐ | |
| 4 | Click Save/Submit | Processing indicator | ☐ | |
| 5 | Verify success message | "Profile saved" or similar confirmation | ☐ | |
| 6 | Return to Dashboard | Prep Gate shows Leader Profile as complete | ☐ | |
| 7 | Refresh page | Leader Profile still shows complete | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-006: Baseline Assessment Completion

**Priority:** Critical | **Time:** 15 min | **User:** User in Prep Phase

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click "Baseline Assessment" from Prep Gate | Assessment form/wizard opens | ☐ | |
| 2 | Answer all assessment questions | Questions are clear, answers saved | ☐ | |
| 3 | Navigate through all sections | Can progress through assessment | ☐ | |
| 4 | Submit final assessment | Processing indicator | ☐ | |
| 5 | Verify results display | Assessment results/recommendations shown | ☐ | |
| 6 | Return to Dashboard | Prep Gate shows Assessment as complete | ☐ | |
| 7 | Verify Prep Gate complete | All required items checked off | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### PREP-014: Day 1 Blocked Without Prep Complete

**Priority:** Critical | **Time:** 3 min | **User:** User with incomplete prep

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as user with incomplete prep | Dashboard loads in Prep state | ☐ | |
| 2 | Try to access Dev Plan | Shows prep required message OR limited view | ☐ | |
| 3 | Try to access Day 1 content in Library | Content locked or not visible | ☐ | |
| 4 | Verify can't bypass via URL | Direct URL to Day 1 content still blocked | ☐ | |
| 5 | Complete prep requirements | Now Day 1 becomes accessible | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 3: Day 1 & AM Bookend (10 Scenarios)

### DEV-D1-001: Day 1 Unlock After Prep Complete

**Priority:** Critical | **Time:** 3 min | **User:** User who just completed prep

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Complete all prep requirements | Prep Gate shows 100% | ☐ | |
| 2 | Dashboard updates | Day 1 content/widgets now visible | ☐ | |
| 3 | AM Bookend section appears | Grounding, Wins, Reps widgets display | ☐ | |
| 4 | Day 1 content accessible | Can access Day 1 videos/readings | ☐ | |
| 5 | Dev Plan shows Day 1 | Timeline highlights Day 1 | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-001: Grounding Rep Display

**Priority:** Critical | **Time:** 2 min | **User:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as Day 1+ user | Dashboard loads with AM Bookend | ☐ | |
| 2 | Locate Grounding Rep widget | Widget displays prominently | ☐ | |
| 3 | Verify Leadership Identity Statement | User's LIS text is displayed | ☐ | |
| 4 | Verify "I'm Grounded" button visible | Call-to-action button present | ☐ | |
| 5 | Status shows "Not complete" initially | Grounding not yet marked done | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-002: Grounding Rep Complete

**Priority:** Critical | **Time:** 2 min | **User:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Grounding Rep widget | Widget displays with LIS | ☐ | |
| 2 | Click "I'm Grounded" button | Button responds to click | ☐ | |
| 3 | Verify visual feedback | Button changes state (color, checkmark) | ☐ | |
| 4 | Verify status updates | Shows "Complete" or checked state | ☐ | |
| 5 | Verify Scorecard updates | Scorecard % increases | ☐ | |
| 6 | Refresh page | Grounding still shows complete | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-004: Win the Day - Enter First Priority

**Priority:** Critical | **Time:** 3 min | **User:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Locate "Win the Day" widget | Widget displays with Trophy icon, teal accent | ☐ | |
| 2 | Verify 3 fixed input slots | Three input fields with placeholders visible | ☐ | |
| 3 | Click first input field ("Enter Priority #1") | Field becomes active | ☐ | |
| 4 | Type: `Complete project proposal` | Text appears in field | ☐ | |
| 5 | Click outside field (blur) | Auto-saves silently | ☐ | |
| 6 | Verify checkbox enabled | Checkbox no longer grayed out | ☐ | |
| 7 | Refresh page | Priority text persists in first slot | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-005: Win the Day - Enter All 3 Priorities

**Priority:** Critical | **Time:** 3 min | **User:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Win the Day widget | 3 fixed input slots visible | ☐ | |
| 2 | Enter Priority #1: `Morning meeting` | Text in slot 1 | ☐ | |
| 3 | Enter Priority #2: `Review documents` | Text in slot 2 | ☐ | |
| 4 | Enter Priority #3: `Team check-in` | Text in slot 3 | ☐ | |
| 5 | Click "Save Priorities" button | Brief loading indicator | ☐ | |
| 6 | Verify all 3 checkboxes enabled | Can mark each complete | ☐ | |
| 7 | Refresh page | All 3 priorities persist | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-012: Daily Reps Display

**Priority:** Critical | **Time:** 2 min | **User:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Dashboard AM Bookend | Daily Reps section visible | ☐ | |
| 2 | Verify reps are displayed | One or more daily reps shown | ☐ | |
| 3 | Each rep has checkbox/action | Can interact with each rep | ☐ | |
| 4 | Rep text is meaningful | Reps make sense for current day/week | ☐ | |
| 5 | Verify reps match current day | Not yesterday's or tomorrow's reps | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-014: Daily Reps - Mark Complete

**Priority:** Critical | **Time:** 2 min | **User:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Daily Reps section | Reps displayed with checkboxes | ☐ | |
| 2 | Click checkbox on first rep | Checkbox fills/animates | ☐ | |
| 3 | Verify visual state change | Rep shows as complete | ☐ | |
| 4 | Verify Scorecard updates | Score percentage increases | ☐ | |
| 5 | Refresh page | Rep still shows complete | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-AM-016: AM Bookend Full Completion

**Priority:** Critical | **Time:** 5 min | **User:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Complete Grounding Rep | ✓ Shows complete | ☐ | |
| 2 | Enter and complete all 3 priorities | ✓ All checkboxes green | ☐ | |
| 3 | Complete all Daily Reps | ✓ All reps checked | ☐ | |
| 4 | Verify AM Bookend visual status | Section shows success state | ☐ | |
| 5 | Verify Scorecard | Reflects all AM items | ☐ | |
| 6 | Refresh page | All completions persist | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-SCR-001: Scorecard Display

**Priority:** Critical | **Time:** 2 min | **User:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Dashboard | Scorecard widget visible | ☐ | |
| 2 | Verify percentage shown | Shows 0-100% | ☐ | |
| 3 | Verify visual representation | Progress bar, circle, or similar | ☐ | |
| 4 | With no items complete | Shows 0% | ☐ | |
| 5 | Complete one item | Percentage increases | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-SCR-002: Scorecard Calculation

**Priority:** Critical | **Time:** 5 min | **User:** Day 1+ user (fresh day)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Start fresh day (0%) | Scorecard shows 0% | ☐ | |
| 2 | Complete Grounding | % increases proportionally | ☐ | |
| 3 | Complete 1 priority (checkbox) | % increases | ☐ | |
| 4 | Complete 2 more priorities | % increases more | ☐ | |
| 5 | Complete 1 Daily Rep | % increases | ☐ | |
| 6 | Complete all AM items | Should be close to 50% | ☐ | |
| 7 | Verify math makes sense | No strange jumps or decreases | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 4: PM Bookend (7 Scenarios)

### DEV-PM-001: PM Bookend Access

**Priority:** Critical | **Time:** 2 min | **User:** User with AM complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Complete AM Bookend (or have test user ready) | AM items done | ☐ | |
| 2 | Scroll to PM Bookend section | PM Bookend section visible | ☐ | |
| 3 | Verify PM header | "PM Bookend: Finish Strong" with moon icon | ☐ | |
| 4 | Verify PM Reflection widget | Card with "PM Reflection" title, navy accent | ☐ | |
| 5 | Verify 3 textarea fields visible | What went well?, What needs work?, Closing thought | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-002: Priority Completion in AM Bookend

**Priority:** Critical | **Time:** 2 min | **User:** User with priorities entered

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View Win the Day widget (AM Bookend) | 3 priorities entered | ☐ | |
| 2 | Click checkbox on Priority #1 | Checkbox fills with green check | ☐ | |
| 3 | Verify visual change | Row turns green, text gets strikethrough | ☐ | |
| 4 | Scorecard updates | % increases | ☐ | |
| 5 | Refresh page | Priority still shows complete | ☐ | |

**Note:** Priority completion is done in the AM Bookend via checkboxes on Win the Day widget. There is no separate "Win Review" in PM Bookend.

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-003: PM Reflection Form View

**Priority:** Critical | **Time:** 2 min | **User:** Any Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View PM Reflection widget | Card visible with navy accent | ☐ | |
| 2 | Verify "1. What went well?" field | Text area with "Celebrate a win..." placeholder | ☐ | |
| 3 | Verify "2. What needs work?" field | Text area with "Identify an improvement..." placeholder | ☐ | |
| 4 | Verify "3. Closing thought" field | Shorter text area with "What will I do 1% better tomorrow?" placeholder | ☐ | |
| 5 | Verify "Save Reflection" button | Button visible at bottom | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-012: Reflection Submit

**Priority:** Critical | **Time:** 3 min | **User:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | View PM Reflection widget | Form ready for input | ☐ | |
| 2 | Enter "What went well?": `Great team collaboration today` | Text accepted | ☐ | |
| 3 | Enter "What needs work?": `Start meetings on time` | Text accepted | ☐ | |
| 4 | Enter "Closing thought": `Prepare presentation` | Text accepted | ☐ | |
| 5 | Click "Save Reflection" | Loading spinner shows briefly | ☐ | |
| 6 | Verify success | Button returns to normal state | ☐ | |
| 7 | Verify Scorecard updates | PM completion reflected | ☐ | |
| 8 | Refresh page | All 3 fields retain text | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PM-017: PM Bookend Full Completion

**Priority:** Critical | **Time:** 5 min | **User:** User with AM complete

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Fill "What went well?" field | Text entered | ☐ | |
| 2 | Fill "What needs work?" field | Text entered | ☐ | |
| 3 | Fill "Closing thought" field | Text entered | ☐ | |
| 4 | Click "Save Reflection" | Saves successfully | ☐ | |
| 5 | Verify Scorecard | Near 100% for the day | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-ROLL-001: Daily Rollover (Time Travel Test)

**Priority:** Critical | **Time:** 10 min | **User:** Admin access required

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Complete AM + PM Bookend for current day | Day 100% complete | ☐ | |
| 2 | Go to Admin → Test Center → Time Travel | Time Travel widget loads | ☐ | |
| 3 | Set date to tomorrow (+1 day) | Date updates | ☐ | |
| 4 | Return to Dashboard (as test user) | New day loaded | ☐ | |
| 5 | Verify Scorecard reset to 0% | Fresh day | ☐ | |
| 6 | Verify Grounding not complete | Reset for new day | ☐ | |
| 7 | Verify new wins empty (or carryover if incomplete) | Win state correct | ☐ | |
| 8 | Verify new daily reps | Fresh reps for new day | ☐ | |
| 9 | Reset Time Travel to current | Clean up | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 5: Content & Plan (5 Scenarios)

### DEV-CON-001: Access Content Library

**Priority:** Critical | **Time:** 2 min | **User:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click "Content" in sidebar | Content Library loads | ☐ | |
| 2 | Verify page title | "Content Library" or similar | ☐ | |
| 3 | Verify content categories visible | Videos, Readings, Tools, etc. | ☐ | |
| 4 | Verify search/filter options | Can filter content | ☐ | |
| 5 | No errors on load | Page loads without issues | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-002: View Unlocked Content

**Priority:** Critical | **Time:** 3 min | **User:** Day 5+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Open Content Library | Library loads | ☐ | |
| 2 | Verify content items display | Multiple items visible | ☐ | |
| 3 | Content matches current day | Day 1-5 content available | ☐ | |
| 4 | No future content visible | Day 6+ content NOT shown | ☐ | |
| 5 | Click on a content item | Detail view opens | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-CON-010: Video Playback

**Priority:** Critical | **Time:** 3 min | **User:** Day 1+ user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Content Library | Library loads | ☐ | |
| 2 | Filter to Videos (or find a video) | Video item visible | ☐ | |
| 3 | Click on video | Video player opens | ☐ | |
| 4 | Click Play button | Video starts playing | ☐ | |
| 5 | Verify audio works | Sound plays (if applicable) | ☐ | |
| 6 | Pause video | Playback stops | ☐ | |
| 7 | Close video player | Returns to library | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-PLN-004: Future Days Locked

**Priority:** High | **Time:** 3 min | **User:** Day 5 user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to Dev Plan | Development Plan loads | ☐ | |
| 2 | View timeline/calendar | Days 1-5 visible and accessible | ☐ | |
| 3 | Try to click Day 6+ | Either locked or not clickable | ☐ | |
| 4 | Verify locked visual | Future days show lock icon or grayed | ☐ | |
| 5 | Attempt direct URL to Day 6 content | Access denied or redirected | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### DEV-ROLL-008: New Content Unlocks (Time Travel)

**Priority:** Critical | **Time:** 5 min | **User:** Admin + Day 5 user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | As Day 5 user, check Content Library | Day 1-5 content visible | ☐ | |
| 2 | Note content count | X items available | ☐ | |
| 3 | Go to Admin → Time Travel | Set to Day 6 | ☐ | |
| 4 | Return to Content Library | New content appeared | ☐ | |
| 5 | Content count increased | More than X items | ☐ | |
| 6 | Day 6 content accessible | Can open Day 6 items | ☐ | |
| 7 | Reset Time Travel | Return to current | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Section 6: Post Phase (3 Scenarios)

### POST-001: Day 70 to Day 71 Transition

**Priority:** Critical | **Time:** 10 min | **User:** Admin + Day 70 user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Set Time Travel to Day 70 | Dashboard shows Day 70 | ☐ | |
| 2 | Verify still in "Dev Phase" | Normal program experience | ☐ | |
| 3 | Complete Day 70 activities | Day 100% done | ☐ | |
| 4 | Set Time Travel to Day 71 | Date advances | ☐ | |
| 5 | Verify Post Phase state | Different banner/messaging | ☐ | |
| 6 | Verify all content accessible | No more locked content | ☐ | |
| 7 | Reset Time Travel | Clean up | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-003: Full Content Access (Post Phase)

**Priority:** High | **Time:** 5 min | **User:** Post Phase user (Day 71+)

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as Post Phase user (or Time Travel) | Dashboard loads | ☐ | |
| 2 | Navigate to Content Library | Library loads | ☐ | |
| 3 | Verify ALL content visible | Days 1-70 all accessible | ☐ | |
| 4 | No locked indicators | Everything unlocked | ☐ | |
| 5 | Can access any content item | Random sampling works | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### POST-004: Continue Daily Practice (Post Phase)

**Priority:** High | **Time:** 5 min | **User:** Post Phase user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as Post Phase user | Dashboard loads | ☐ | |
| 2 | Verify AM Bookend still available | Can do grounding, wins | ☐ | |
| 3 | Complete Grounding Rep | Works normally | ☐ | |
| 4 | Add Wins | Works normally | ☐ | |
| 5 | Verify PM Bookend available | Can do reflection | ☐ | |
| 6 | Scorecard still functions | Tracks daily progress | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Execution Summary

| Section | Scenarios | Passed | Failed | Blocked |
|---------|-----------|--------|--------|---------|
| Authentication | 6 | | | |
| Prep Phase | 5 | | | |
| Day 1 & AM Bookend | 10 | | | |
| PM Bookend | 5 | | | |
| Content & Plan | 5 | | | |
| Post Phase | 3 | | | |
| **TOTAL** | **34** | | | |

**Pass Rate:** ____%

---

## Sign-Off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tester | | | |
| QA Lead | | | |

---

## Bugs Logged

| Bug ID | Scenario | Severity | Description |
|--------|----------|----------|-------------|
| | | | |
| | | | |
| | | | |

---

*Smoke Test Complete*
