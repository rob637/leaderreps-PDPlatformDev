# 📋 Test Script Requirements Document

> **LeaderReps PD Platform - Comprehensive User Test Script Initiative**  
> *Document Version: 2.0 | Created: January 9, 2026*

---

## Executive Summary

This document outlines the requirements for creating **comprehensive, bulletproof manual test scripts** for the LeaderReps PD Platform. These scripts will cover **every possible scenario** a user could encounter across all three phases: **Prep Phase**, **Dev Phase (Core Program)**, and **Post Phase**.

### Key Differentiators from Basic Test Plans
- **Complete User Journey Coverage**: Every screen, button, and interaction
- **Edge Cases & Error Scenarios**: Network failures, session timeouts, invalid inputs
- **State-Based Testing**: Users in different states see different things
- **Time-Sensitive Scenarios**: Daily rollover, streak logic, weekend grace
- **Multi-Device/Browser Coverage**: Desktop, tablet, mobile + all browsers
- **Accessibility Testing**: Keyboard navigation, screen readers
- **Negative Testing**: What happens when things go wrong?

### Objectives
1. **100% User Scenario Coverage** - If a user can do it, we test it
2. **Step-by-Step Clarity** - Anyone can execute these tests with zero ambiguity
3. **Traceable Results** - Every execution is logged and signed off
4. **Bug Workflow** - Clear process from discovery to resolution
5. **Regression Ready** - Run before every release
6. **Automation Ready** - Structured for future Playwright automation (no additional software needed)

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Test Script Structure](#2-test-script-structure)
3. [Phase-Based Test Coverage](#3-phase-based-test-coverage)
4. [Test Execution Workflow](#4-test-execution-workflow)
5. [Bug Logging Requirements](#5-bug-logging-requirements)
6. [Sign-Off Process](#6-sign-off-process)
7. [Test Data Requirements](#7-test-data-requirements)
8. [Test Environment Strategy](#8-test-environment-strategy)
9. [Deliverables](#9-deliverables)
10. [Implementation Timeline](#10-implementation-timeline)
11. [Appendix: Test Scenario Inventory](#appendix-test-scenario-inventory)

---

## 1. Current State Analysis

### What Exists
- **TEST-PLANS.md**: Contains test case tables with basic steps and expected results
- **Test accounts**: Admin and user test accounts defined
- **Time Travel tool**: Allows date simulation for testing time-sensitive features
- **Two test environments**: DEV and TEST Firebase projects

### Gaps to Address
| Gap | Impact | Solution |
|-----|--------|----------|
| No detailed step-by-step instructions | Testers must interpret steps | Create granular, numbered procedures |
| No pre-condition documentation | Tests may fail due to missing setup | Add explicit setup checklists |
| No sign-off mechanism | No audit trail of test execution | Add signature/date fields |
| No bug logging workflow | Issues not tracked systematically | Define bug documentation process |
| No test data specifications | Inconsistent test data usage | Create standard test data sets |
| No screenshots/visual references | Ambiguity about expected UI | Add reference screenshots |
| No execution tracking | Can't see overall test coverage | Create execution summary sheets |

---

## 2. Test Script Structure

### 2.1 Standard Test Script Template

Each test script will follow this structure:

```
╔══════════════════════════════════════════════════════════════════╗
║                     TEST SCRIPT HEADER                            ║
╠══════════════════════════════════════════════════════════════════╣
║ Script ID      : [TS-PHASE-AREA-###]                              ║
║ Script Name    : [Descriptive Name]                               ║
║ Phase          : Prep / Dev / Post                                ║
║ Feature Area   : [Feature Category]                               ║
║ Priority       : Critical / High / Medium / Low                   ║
║ Estimated Time : [X minutes]                                      ║
║ Last Updated   : [Date]                                           ║
║ Author         : [Name]                                           ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║                        PREREQUISITES                              ║
╠══════════════════════════════════════════════════════════════════╣
║ Environment    : DEV / TEST / LOCAL                               ║
║ Browser        : Chrome v120+ / Firefox v120+ / Safari v17+       ║
║ Test Account   : [Specific account or account type]               ║
║ User State     : [New user / Week 3 user / Admin / etc.]          ║
║ Time Setting   : [Current date / Time Travel to specific day]     ║
║ Dependencies   : [List any scripts that must run first]           ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║                      SETUP STEPS                                  ║
╠══════════════════════════════════════════════════════════════════╣
║ Step-by-step instructions to prepare for the test                 ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║                      TEST STEPS                                   ║
╠══════════════════════════════════════════════════════════════════╣
║ Detailed, numbered steps with expected results per step           ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║                    EXECUTION LOG                                  ║
╠══════════════════════════════════════════════════════════════════╣
║ Date / Tester / Environment / Result / Notes                      ║
╚══════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════╗
║                      SIGN-OFF                                     ║
╠══════════════════════════════════════════════════════════════════╣
║ Tester Signature / QA Lead Sign-off / Date                        ║
╚══════════════════════════════════════════════════════════════════╝
```

### 2.2 Test Step Format

Each test step will include:

| Field | Description | Example |
|-------|-------------|---------|
| **Step #** | Sequential number | 1, 2, 3... |
| **Action** | What the tester does | "Click the 'Start Plan' button" |
| **Input Data** | Specific data to enter | "Email: testuser@example.com" |
| **Expected Result** | What should happen | "Modal opens with enrollment form" |
| **Actual Result** | What actually happened | (Filled by tester) |
| **Status** | Pass / Fail / Blocked | (Filled by tester) |
| **Screenshot** | Reference or capture | "See Figure 2.1" or "Capture if fail" |
| **Notes** | Additional observations | (Filled by tester) |

### 2.3 Script ID Convention

```
TS-[PHASE]-[AREA]-[NUMBER]

Where:
- TS     = Test Script
- PHASE  = PREP, DEV, POST, ADMIN, CROSS (cross-cutting)
- AREA   = 3-letter code (see below)
- NUMBER = 3-digit sequential number

Area Codes:
- ONB = Onboarding
- GND = Grounding
- WIN = Wins
- REP = Daily Reps
- REF = Reflection
- SCR = Scorecard
- STK = Streak
- PLN = Development Plan
- CON = Content Library
- COM = Community
- COA = Coaching
- LOC = Locker
- PRO = Profile/Settings
- NAV = Navigation
- AUT = Authentication
- ADM = Admin Portal
```

---

## 3. Phase-Based Test Coverage

### 3.1 Prep Phase (Days -14 to -1)

The Prep Phase prepares users before their cohort officially starts.

#### User Journey Summary
```
User Journey: Prep Phase
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Day -14 to -7:  Account Creation → Quick Start Accelerator
Day -7 to -1:   Prep Gate Completion → Leader Profile → Baseline Assessment
Day 0:          Ready for Day 1 Content Unlock
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Test Scenarios Required

| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| PREP-001 | New User Registration | Email signup, Google OAuth, verification | Critical |
| PREP-002 | Quick Start Accelerator | Complete all QSA steps | Critical |
| PREP-003 | Prep Gate Display | Gate shown until prerequisites met | Critical |
| PREP-004 | Leader Profile Creation | All profile fields, save, validation | Critical |
| PREP-005 | LIS Maker Widget | Create/edit Leadership Identity Statement | High |
| PREP-006 | Baseline Assessment | Complete assessment, view results | Critical |
| PREP-007 | Prep Phase Content Access | Only Prep content visible | High |
| PREP-008 | Dev Plan Locked State | Core content locked during Prep | High |
| PREP-009 | Cohort Assignment | User assigned to cohort correctly | High |
| PREP-010 | Countdown to Day 1 | Display days until program start | Medium |
| PREP-011 | Prep Widget Visibility | Correct widgets shown for Prep phase | Medium |
| PREP-012 | Email Notifications (Prep) | Welcome, reminder emails received | Medium |
| PREP-013 | Prep Phase Content Only | Can only see Prep Phase content in library | High |
| PREP-014 | Day 1 Blocked Without Prep | Cannot access Day 1+ until prep complete | Critical |
| PREP-015 | Partial Prep Completion | One item done, one missing - still blocked | High |
| PREP-016 | Late Joiner - Accelerated | User joins 3 days before start | Medium |
| PREP-017 | Very Late Joiner - Quick Start | User joins 1 day before start | Medium |
| PREP-018 | Prep Day Navigation | Navigate between prep days | Medium |

### 3.2 Dev Phase - Core Program (Days 1 to 70)

The 70-day core program with daily content unlocks and practice.

#### User Journey Summary
```
User Journey: Dev Phase (Daily Cycle)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Morning (AM Bookend):
  └─ Grounding Rep → Win the Day (3 priorities) → Commit to Daily Reps

During Day:
  └─ Access unlocked Content → Complete Reps → Community engagement

Evening (PM Bookend):
  └─ Review Wins → Complete Reflection → View Scorecard

11:59 PM Rollover:
  └─ Archive day → Carryover incomplete wins → Update streak → Reset scorecard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Test Scenarios Required

**Day 1 First Experience (Critical Transition)**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| DEV-D1-001 | Day 1 Unlock | After prep complete, Day 1 accessible | Critical |
| DEV-D1-002 | Day 1 Welcome | First day welcome message/banner | High |
| DEV-D1-003 | Day 1 Content | Day 1 specific content unlocks | Critical |
| DEV-D1-004 | Day 1 Widgets | Correct widgets appear for Day 1 | High |
| DEV-D1-005 | Day 1 Reps | Day 1 specific reps assigned | High |

**AM Bookend**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| DEV-AM-001 | Grounding Rep Display | View Leadership Identity Statement | Critical |
| DEV-AM-002 | Grounding Rep Complete | Click "I'm Grounded" button | Critical |
| DEV-AM-003 | Grounding Persistence | Refresh - still shows complete | High |
| DEV-AM-004 | Win the Day - Add First Win | Add single win | Critical |
| DEV-AM-005 | Win the Day - Add 3 Wins | Add three wins (max) | Critical |
| DEV-AM-006 | Win the Day - Add 4th Win | Try adding 4th - behavior? | Medium |
| DEV-AM-007 | Win the Day - Edit Win | Click edit, modify text | High |
| DEV-AM-008 | Win the Day - Delete Win | Remove a win | High |
| DEV-AM-009 | Win the Day - Empty Win | Try submitting blank win | Medium |
| DEV-AM-010 | Win the Day - Long Text | Enter very long win text | Low |
| DEV-AM-011 | Win the Day - Special Chars | Enter emojis, special characters | Low |
| DEV-AM-012 | Daily Reps Display | Correct reps for current day | Critical |
| DEV-AM-013 | Daily Reps - Commit | Commit to doing a rep | High |
| DEV-AM-014 | Daily Reps - Complete | Mark rep as done | Critical |
| DEV-AM-015 | Daily Reps - Uncommit | Change committed back to uncommitted | Medium |
| DEV-AM-016 | AM Bookend Completion | All AM items done - status updates | Critical |
| DEV-AM-017 | AM Partial Complete | Some items done, some not | High |
| DEV-AM-018 | Catch Up Alert Display | Alert shows when days are missed | High |
| DEV-AM-019 | Catch Up Alert Click | Click alert opens modal | High |
| DEV-AM-020 | Catch Up Modal - View Missed | See list of missed days | High |
| DEV-AM-021 | Catch Up Modal - Complete Day | Complete a missed day | High |
| DEV-AM-022 | Catch Up Modal - Multiple Days | Complete multiple missed days | Medium |
| DEV-AM-023 | Catch Up Modal - Close | Close modal without completing | Medium |

**PM Bookend**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| DEV-PM-001 | PM Bookend Access | Navigate to Reflection screen | Critical |
| DEV-PM-002 | Win Review Display | See morning wins listed | Critical |
| DEV-PM-003 | Win Review - Mark Complete | Check off completed win | Critical |
| DEV-PM-004 | Win Review - Mark Incomplete | Leave win unchecked | High |
| DEV-PM-005 | Win Review - All Complete | All 3 wins checked | High |
| DEV-PM-006 | Win Review - None Complete | Zero wins checked | Medium |
| DEV-PM-007 | Win Review - Carry Over | Incomplete win behavior | High |
| DEV-PM-008 | Reflection - View Form | Good/Better/Best fields display | Critical |
| DEV-PM-009 | Reflection - Enter Good | Type in "What went well" | Critical |
| DEV-PM-010 | Reflection - Enter Better | Type in "What could be better" | Critical |
| DEV-PM-011 | Reflection - Enter Best | Type in "Focus for tomorrow" | Critical |
| DEV-PM-012 | Reflection - Submit | Complete and save reflection | Critical |
| DEV-PM-013 | Reflection - Empty Field | Try submit with blank field | High |
| DEV-PM-014 | Reflection - All Empty | Try submit all blank | High |
| DEV-PM-015 | Reflection - Long Text | Enter very long reflection | Low |
| DEV-PM-016 | Reflection - Special Chars | Emojis, special characters | Low |
| DEV-PM-017 | PM Bookend Completion | All PM items done | Critical |
| DEV-PM-018 | PM Partial Complete | Some items done | High |
| DEV-PM-019 | View Scorecard | See daily percentages | High |
| DEV-PM-020 | Scorecard Updates | Score changes as items complete | High |

**Scorecard & Streak**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| DEV-SCR-001 | Scorecard Display | Scorecard visible on dashboard | Critical |
| DEV-SCR-002 | Scorecard Calculation | Correct % for completed items | Critical |
| DEV-SCR-003 | Scorecard 0% | No items complete = 0% | High |
| DEV-SCR-004 | Scorecard 50% | Half items complete | High |
| DEV-SCR-005 | Scorecard 100% | All items complete = 100% | High |
| DEV-SCR-006 | Scorecard Real-time | Updates without refresh | High |
| DEV-SCR-007 | Streak Display | Current streak count visible | High |
| DEV-SCR-008 | Streak First Day | Day 1 streak = 1 | High |
| DEV-SCR-009 | Streak Increment | Complete day, streak +1 | High |
| DEV-SCR-010 | Streak Weekday Miss | Skip Monday, streak = 0 | Critical |
| DEV-SCR-011 | Streak Friday-Monday | Skip weekend, streak maintained | Critical |
| DEV-SCR-012 | Streak Saturday Activity | Weekend activity | Medium |
| DEV-SCR-013 | Streak Long Run | 10+ day streak | Medium |
| DEV-SCR-014 | Streak Recovery | After reset, rebuild streak | Medium |

**Daily Rollover (11:59 PM)**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| DEV-ROLL-001 | Rollover Triggers | System processes at midnight | Critical |
| DEV-ROLL-002 | Data Archival | Day data saved to daily_logs | Critical |
| DEV-ROLL-003 | Win Carryover | Incomplete wins appear next AM | High |
| DEV-ROLL-004 | All Wins Complete | No carryover when all done | High |
| DEV-ROLL-005 | Scorecard Reset | New day starts at 0% | High |
| DEV-ROLL-006 | Streak Calculation | Streak updated based on activity | High |
| DEV-ROLL-007 | Day Number Advances | currentDayNumber +1 | Critical |
| DEV-ROLL-008 | New Content Unlocks | Next day's content available | Critical |
| DEV-ROLL-009 | User Online at Midnight | Graceful transition | Medium |
| DEV-ROLL-010 | Week Boundary | Day 7 → Day 8 (Week 2) | High |

**Development Plan View**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| DEV-PLN-001 | Timeline View | See week/day overview | High |
| DEV-PLN-002 | Current Day Highlight | Today visually highlighted | High |
| DEV-PLN-003 | Past Days Accessible | Can click/view completed days | Medium |
| DEV-PLN-004 | Future Days Locked | Cannot access future days | High |
| DEV-PLN-005 | Week Transition | Week 1 → Week 2 | Critical |
| DEV-PLN-006 | Day Content View | View specific day's content | High |
| DEV-PLN-007 | Progress Indicators | Show completion status | Medium |
| DEV-PLN-008 | Navigate Between Days | Click different days | Medium |

**Content Library**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| DEV-CON-001 | Access Content Library | Navigate to Content screen | Critical |
| DEV-CON-002 | View Unlocked Content | See available content | Critical |
| DEV-CON-003 | Locked Content Hidden | Future content not visible | High |
| DEV-CON-004 | Content Search | Search by keyword | High |
| DEV-CON-005 | Filter by Type - Videos | Show only videos | High |
| DEV-CON-006 | Filter by Type - Readings | Show only readings | High |
| DEV-CON-007 | Filter by Type - Tools | Show only tools | High |
| DEV-CON-008 | Filter by Type - Workouts | Show only workouts | High |
| DEV-CON-009 | Clear Filters | Reset all filters | Medium |
| DEV-CON-010 | Video Playback | Click video, plays | Critical |
| DEV-CON-011 | Video Controls | Play/pause/seek/volume | High |
| DEV-CON-012 | Video Progress Save | Partial watch saved | Medium |
| DEV-CON-013 | Video Resume | Return to video, resumes | Medium |
| DEV-CON-014 | Video Completion | Watch to end, marked complete | High |
| DEV-CON-015 | Reading View | Open reading content | High |
| DEV-CON-016 | PDF Display | PDF renders correctly | High |
| DEV-CON-017 | External Link | Opens in new tab | Medium |
| DEV-CON-018 | Mark Complete | Manual completion toggle | High |
| DEV-CON-019 | Completion Persists | Refresh, still complete | High |
| DEV-CON-020 | Premium Content Gate | Free user sees upgrade prompt | High |
| DEV-CON-021 | Premium Content Access | Premium user can access | High |
| DEV-CON-022 | Content Details View | View full content details | Medium |
| DEV-CON-023 | Back Navigation | Return from content to library | Medium |

**Community**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| DEV-COM-001 | Access Community | Navigate to Community screen | High |
| DEV-COM-002 | Community Feed | See posts from cohort | High |
| DEV-COM-003 | Create Text Post | Write and publish text post | High |
| DEV-COM-004 | Create Post - Empty | Try posting blank | Medium |
| DEV-COM-005 | Create Post - Long | Very long post text | Low |
| DEV-COM-006 | View Post Detail | Click post to view | Medium |
| DEV-COM-007 | Comment on Post | Add comment to post | Medium |
| DEV-COM-008 | React to Post | Like/emoji reaction | Low |
| DEV-COM-009 | Delete Own Post | Remove your post | Medium |
| DEV-COM-010 | Edit Own Post | Modify your post | Low |
| DEV-COM-011 | Community Notifications | Get notified of replies | Low |

**Coaching**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| DEV-COA-001 | Access Coaching Hub | Navigate to Coaching screen | High |
| DEV-COA-002 | View Upcoming Sessions | See scheduled sessions | High |
| DEV-COA-003 | Session Details | View session info | Medium |
| DEV-COA-004 | Register for Session | Sign up for session | High |
| DEV-COA-005 | Cancel Registration | Cancel session signup | Medium |
| DEV-COA-006 | Join Live Session | Connect to active session | High |
| DEV-COA-007 | On-Demand Library | View recordings | Medium |
| DEV-COA-008 | Watch Recording | Play recorded session | Medium |
| DEV-COA-009 | AI Role Play | Access practice scenarios | Medium |
| DEV-COA-010 | AI Role Play - Run | Complete AI scenario | Medium |

**Locker (Personal Archive)**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| DEV-LOC-001 | Access Locker | Navigate to Locker screen | Medium |
| DEV-LOC-002 | My Journey Widget | See cohort/progress info | Medium |
| DEV-LOC-003 | Reflection History | View past reflections | Medium |
| DEV-LOC-004 | Reflection Detail | Click to view specific day | Medium |
| DEV-LOC-005 | Progress Overview | Overall stats display | Medium |
| DEV-LOC-006 | Achievement Badges | View earned badges | Low |
| DEV-LOC-007 | Export Data | Download personal data | Low |

### 3.3 Post Phase (Day 71+)

After the 70-day core program.

#### Test Scenarios Required

| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| POST-001 | Day 70 to 71 | Transition to post phase | Critical |
| POST-002 | Post Phase Banner | Welcome to alumni/post message | High |
| POST-003 | Full Content Access | All 70 days content available | High |
| POST-004 | Continue AM Bookend | Morning practice still works | High |
| POST-005 | Continue PM Bookend | Evening practice still works | High |
| POST-006 | Streak Continues | Streak tracking continues | Medium |
| POST-007 | View All History | Access all historical data | Medium |
| POST-008 | Alumni Community | Special alumni features | Medium |
| POST-009 | Re-enrollment Option | Option to restart journey | Low |

### 3.4 Cross-Cutting Scenarios (All Phases)

**Authentication & Session**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| CROSS-AUTH-001 | Login - Email/Password | Standard email login | Critical |
| CROSS-AUTH-002 | Login - Wrong Password | Invalid password error | High |
| CROSS-AUTH-003 | Login - Unknown Email | Email not found error | High |
| CROSS-AUTH-004 | Login - Empty Fields | Blank email/password | Medium |
| CROSS-AUTH-005 | Login - Google OAuth | Google sign-in button | High |
| CROSS-AUTH-006 | Login - Remember Me | Session persists | Medium |
| CROSS-AUTH-007 | Logout | Click logout, redirected | Critical |
| CROSS-AUTH-008 | Session Timeout | Long inactive, re-login | High |
| CROSS-AUTH-009 | Session Persistence | Close browser, reopen | High |
| CROSS-AUTH-010 | Multi-Tab Consistency | Same state across tabs | Medium |
| CROSS-AUTH-011 | Password Reset - Request | Enter email, send reset | High |
| CROSS-AUTH-012 | Password Reset - Email | Receive reset email | High |
| CROSS-AUTH-013 | Password Reset - Complete | Set new password | High |
| CROSS-AUTH-014 | Signup - Via Invite | Accept invite link | Critical |
| CROSS-AUTH-015 | Signup - Validation | Required fields | High |
| CROSS-AUTH-016 | Signup - Weak Password | Password too short | High |
| CROSS-AUTH-017 | Signup - Duplicate Email | Email already exists | High |
| CROSS-AUTH-018 | Signup - Invalid Invite | Expired/used invite | High |
| CROSS-AUTH-019 | Too Many Attempts | Account temporarily locked | Medium |

**Navigation**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| CROSS-NAV-001 | Desktop Sidebar | Click all nav items | Critical |
| CROSS-NAV-002 | Mobile Bottom Nav | Tap all nav items | Critical |
| CROSS-NAV-003 | Sidebar Collapse | Collapse/expand sidebar | Medium |
| CROSS-NAV-004 | Deep Linking | Direct URL to screen | High |
| CROSS-NAV-005 | Browser Back Button | Back button behavior | High |
| CROSS-NAV-006 | Bookmark Screen | Bookmark and return | Medium |
| CROSS-NAV-007 | Invalid URL | Non-existent route | Medium |
| CROSS-NAV-008 | Screen Transitions | Smooth transitions | Low |

**Profile & Settings**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| CROSS-PRO-001 | View Profile | Access profile screen | Medium |
| CROSS-PRO-002 | Edit Display Name | Change name | Medium |
| CROSS-PRO-003 | Edit Email | Change email address | Low |
| CROSS-PRO-004 | Change Password | Update password | Medium |
| CROSS-PRO-005 | Notification Prefs | Toggle notifications | Low |
| CROSS-PRO-006 | App Settings | View settings screen | Low |
| CROSS-PRO-007 | Time Zone | Time zone handling | Low |

**Error Handling & Edge Cases**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| CROSS-ERR-001 | Network Offline | Lose connection | High |
| CROSS-ERR-002 | Network Reconnect | Connection restored | High |
| CROSS-ERR-003 | Slow Network | 3G simulation | Medium |
| CROSS-ERR-004 | Server Error | 500 response handling | Medium |
| CROSS-ERR-005 | Data Load Failure | Firestore read fails | Medium |
| CROSS-ERR-006 | Save Failure | Write operation fails | Medium |
| CROSS-ERR-007 | Concurrent Edits | Two tabs edit same data | Low |
| CROSS-ERR-008 | Refresh During Save | Refresh while saving | Low |
| CROSS-ERR-009 | Long Text Input | Very long strings | Low |
| CROSS-ERR-010 | Special Characters | Unicode, emojis | Low |
| CROSS-ERR-011 | JavaScript Disabled | Graceful degradation | Low |

**Responsive & Browser**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| CROSS-RESP-001 | Desktop 1920px | Full desktop view | High |
| CROSS-RESP-002 | Desktop 1440px | Standard desktop | High |
| CROSS-RESP-003 | Laptop 1280px | Smaller desktop | High |
| CROSS-RESP-004 | Tablet 1024px | iPad Pro landscape | High |
| CROSS-RESP-005 | Tablet 768px | iPad portrait | High |
| CROSS-RESP-006 | Mobile 414px | iPhone Plus | Critical |
| CROSS-RESP-007 | Mobile 375px | iPhone Standard | Critical |
| CROSS-RESP-008 | Mobile 320px | iPhone SE | High |
| CROSS-RESP-009 | Chrome Latest | Full test suite | Critical |
| CROSS-RESP-010 | Firefox Latest | Full test suite | High |
| CROSS-RESP-011 | Safari Latest | Full test suite | High |
| CROSS-RESP-012 | Edge Latest | Full test suite | High |
| CROSS-RESP-013 | Mobile Safari | iOS browser | High |
| CROSS-RESP-014 | Chrome Android | Android browser | High |
| CROSS-RESP-015 | Portrait/Landscape | Orientation changes | Medium |

**Accessibility**
| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| CROSS-A11Y-001 | Keyboard Navigation | Tab through all elements | Medium |
| CROSS-A11Y-002 | Focus Indicators | Visible focus states | Medium |
| CROSS-A11Y-003 | Screen Reader | VoiceOver/NVDA test | Low |
| CROSS-A11Y-004 | Color Contrast | WCAG AA compliance | Low |
| CROSS-A11Y-005 | Font Scaling | Browser zoom 200% | Low |

### 3.5 Time-Sensitive Scenarios (Special)

| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| TIME-001 | Time Travel - Future | Test Center +7 days | High |
| TIME-002 | Time Travel - Past | Test Center -7 days | High |
| TIME-003 | Time Travel - Reset | Return to current | High |
| TIME-004 | Cross Midnight | User active at 11:59 PM | Medium |
| TIME-005 | Weekend Detection | Sat/Sun behavior | High |
| TIME-006 | End of Week | Day 7 → Day 8 | High |
| TIME-007 | End of Phase | Prep → Dev → Post | Critical |
| TIME-008 | DST Change | Daylight saving time | Low |

### 3.6 User State Variations

Different tests for users in different states:

| State | Prep Complete | Day # | Streak | Wins | Description |
|-------|--------------|-------|--------|------|-------------|
| Brand New | No | -14 | 0 | 0 | Just created account |
| Prep In Progress | Partial | -7 | 0 | 0 | Started prep items |
| Prep Complete | Yes | -1 | 0 | 0 | Ready for Day 1 |
| Day 1 User | Yes | 1 | 1 | 0 | First day of program |
| Week 1 Active | Yes | 5 | 5 | 3 | Mid first week |
| Week 3 Active | Yes | 15 | 10 | 3 | Mid program |
| Week 10 Active | Yes | 65 | 30 | 3 | Near end |
| Missed Days | Yes | 20 | 0 | 0 | Has missed days to catch up |
| Post Phase | Yes | 75 | 45 | 3 | Completed program |
| Free Tier | Yes | 10 | 5 | 3 | Limited access |
| Premium Tier | Yes | 10 | 5 | 3 | Full access |
| CROSS-AUTH-002 | Login - Google OAuth | Google sign-in | Critical |
| CROSS-AUTH-003 | Logout | Clean logout | High |
| CROSS-AUTH-004 | Password Reset | Reset via email | High |
| CROSS-AUTH-005 | Session Persistence | Stay logged in | High |
| CROSS-NAV-001 | Desktop Navigation | Sidebar navigation | Critical |
| CROSS-NAV-002 | Mobile Navigation | Bottom nav bar | Critical |
| CROSS-NAV-003 | Deep Linking | Direct URL access | Medium |
| CROSS-PRO-001 | View Profile | Access profile screen | Medium |
| CROSS-PRO-002 | Edit Profile | Update profile info | Medium |
| CROSS-PRO-003 | Notification Settings | Toggle notifications | Low |
| CROSS-RESP-001 | Desktop Rendering | 1440px width | High |
| CROSS-RESP-002 | Tablet Rendering | 768px width | High |
| CROSS-RESP-003 | Mobile Rendering | 375px width | High |

### 3.5 Admin Portal Test Scenarios

| Scenario ID | Scenario Name | Description | Priority |
|-------------|---------------|-------------|----------|
| ADMIN-ACC-001 | Admin Portal Access | Login as admin, access portal | Critical |
| ADMIN-ACC-002 | Non-Admin Blocked | Regular user cannot access | Critical |
| ADMIN-COH-001 | Create Cohort | Add new cohort | High |
| ADMIN-COH-002 | Assign Users to Cohort | Bulk assign users | High |
| ADMIN-COH-003 | Edit Cohort Dates | Modify start date | High |
| ADMIN-DPM-001 | View Daily Plan | See all days | High |
| ADMIN-DPM-002 | Edit Day Content | Add/remove content from day | High |
| ADMIN-DPM-003 | Configure Day Widgets | Toggle widgets per day | High |
| ADMIN-USR-001 | Search Users | Find user by email | High |
| ADMIN-USR-002 | Edit User | Modify user details | Medium |
| ADMIN-USR-003 | Time Travel User | Simulate user's day | High |
| ADMIN-CNT-001 | Add Content Item | Create new video/reading | High |
| ADMIN-CNT-002 | Edit Content Item | Modify existing content | High |
| ADMIN-CNT-003 | Deactivate Content | Hide content from users | Medium |
| ADMIN-FTR-001 | Toggle Feature Flag | Enable/disable feature | High |
| ADMIN-FTR-002 | Feature Propagation | Flag affects all users | High |

---

## 4. Test Execution Workflow

### 4.1 Pre-Execution Checklist

Before running any test scripts, the tester must:

```
□ Review test script completely before starting
□ Verify access to correct environment (DEV/TEST)
□ Confirm test account credentials work
□ Clear browser cache and cookies
□ Set correct Time Travel date (if required)
□ Verify test data is in expected state
□ Have bug logging form/tool ready
□ Note browser version and OS
□ Record start time
```

### 4.2 Execution Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TEST EXECUTION WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   START      │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Pre-Execution│──── If incomplete ──→ STOP, complete checklist
    │  Checklist   │
    └──────┬───────┘
           │ ✓ Complete
           ▼
    ┌──────────────┐
    │ Setup Steps  │──── If fails ──→ Document issue, STOP
    └──────┬───────┘
           │ ✓ Complete
           ▼
    ┌──────────────┐
    │ Execute Step │◄─────────────────────────────────────┐
    │     N        │                                       │
    └──────┬───────┘                                       │
           │                                               │
           ▼                                               │
    ┌──────────────┐                                       │
    │  Compare to  │                                       │
    │   Expected   │                                       │
    └──────┬───────┘                                       │
           │                                               │
     ┌─────┴─────┐                                         │
     │           │                                         │
  PASS         FAIL                                        │
     │           │                                         │
     │           ▼                                         │
     │    ┌──────────────┐                                 │
     │    │ Log Bug      │                                 │
     │    │ Take Screenshot│                               │
     │    │ Note Details │                                 │
     │    └──────┬───────┘                                 │
     │           │                                         │
     │    ┌──────┴───────┐                                 │
     │    │   Blocker?   │                                 │
     │    └──────┬───────┘                                 │
     │     Yes   │   No                                    │
     │     │     │                                         │
     │     │     └────────────────────────────────────┐    │
     │     │                                          │    │
     │     ▼                                          │    │
     │ ┌──────────────┐                               │    │
     │ │    STOP      │                               │    │
     │ │ Mark Blocked │                               │    │
     │ └──────────────┘                               │    │
     │                                                │    │
     └──────────────────┬─────────────────────────────┘    │
                        │                                   │
                        ▼                                   │
                 ┌──────────────┐                           │
                 │  More Steps? │───── Yes ─────────────────┘
                 └──────┬───────┘
                        │ No
                        ▼
                 ┌──────────────┐
                 │ Complete     │
                 │ Execution Log│
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │   Sign Off   │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │     END      │
                 └──────────────┘
```

### 4.3 Execution Tracking

Each test execution creates a record:

| Field | Description |
|-------|-------------|
| Execution ID | Auto-generated (EXEC-YYYYMMDD-###) |
| Script ID | Reference to test script |
| Environment | DEV / TEST |
| Tester Name | Who executed |
| Start Time | When started |
| End Time | When completed |
| Overall Result | PASS / FAIL / BLOCKED / INCOMPLETE |
| Pass Count | Number of passed steps |
| Fail Count | Number of failed steps |
| Bugs Logged | References to any bugs created |
| Notes | Additional observations |

---

## 5. Bug Logging Requirements

### 5.1 Bug Report Template

When a test step fails, log a bug with this information:

```
╔══════════════════════════════════════════════════════════════════╗
║                       BUG REPORT                                  ║
╠══════════════════════════════════════════════════════════════════╣
║ Bug ID        : BUG-[YYYYMMDD]-[###]                              ║
║ Title         : [Brief, descriptive title]                        ║
║ Severity      : Critical / High / Medium / Low                    ║
║ Priority      : P1 / P2 / P3 / P4                                ║
║ Status        : New / In Progress / Fixed / Verified / Closed     ║
╠══════════════════════════════════════════════════════════════════╣
║ DISCOVERY                                                         ║
╠══════════════════════════════════════════════════════════════════╣
║ Test Script   : [Script ID that found the bug]                    ║
║ Test Step     : [Step number where bug occurred]                  ║
║ Found By      : [Tester name]                                     ║
║ Found Date    : [Date]                                            ║
║ Environment   : [DEV / TEST]                                      ║
║ Browser/OS    : [Browser version, OS]                             ║
╠══════════════════════════════════════════════════════════════════╣
║ DESCRIPTION                                                       ║
╠══════════════════════════════════════════════════════════════════╣
║ Expected      : [What should have happened]                       ║
║ Actual        : [What actually happened]                          ║
║ Steps to      : 1. [Step 1]                                       ║
║ Reproduce     : 2. [Step 2]                                       ║
║                : 3. [Step 3]                                       ║
╠══════════════════════════════════════════════════════════════════╣
║ ATTACHMENTS                                                       ║
╠══════════════════════════════════════════════════════════════════╣
║ Screenshots   : [List of attached screenshots]                    ║
║ Console Logs  : [If applicable]                                   ║
║ Video         : [If applicable]                                   ║
╠══════════════════════════════════════════════════════════════════╣
║ RESOLUTION                                                        ║
╠══════════════════════════════════════════════════════════════════╣
║ Fixed By      : [Developer name]                                  ║
║ Fixed Date    : [Date]                                            ║
║ Fix Version   : [Release/commit]                                  ║
║ Verified By   : [Tester name]                                     ║
║ Verified Date : [Date]                                            ║
╚══════════════════════════════════════════════════════════════════╝
```

### 5.2 Severity Definitions

| Severity | Definition | Examples |
|----------|------------|----------|
| **Critical** | System unusable, data loss, security breach | Cannot login, data corruption, crash |
| **High** | Major feature broken, no workaround | Cannot complete AM Bookend, content won't load |
| **Medium** | Feature impaired, workaround exists | Edit button doesn't work but delete/recreate does |
| **Low** | Minor issue, cosmetic | Typo, minor UI misalignment |

### 5.3 Priority Definitions

| Priority | Response Time | Description |
|----------|---------------|-------------|
| **P1** | Immediate | Stop release, fix now |
| **P2** | Within 24 hours | Fix before next release |
| **P3** | Within sprint | Fix in current cycle |
| **P4** | Backlog | Fix when time permits |

---

## 6. Sign-Off Process

### 6.1 Individual Test Script Sign-Off

After completing a test script:

```
╔══════════════════════════════════════════════════════════════════╗
║                    TEST SCRIPT SIGN-OFF                           ║
╠══════════════════════════════════════════════════════════════════╣
║ Script ID     : _______________________                           ║
║ Environment   : DEV □   TEST □                                    ║
║ Execution Date: _______________________                           ║
╠══════════════════════════════════════════════════════════════════╣
║ RESULTS SUMMARY                                                   ║
║ Total Steps   : ____   Passed: ____   Failed: ____   Blocked: ____║
║ Bugs Logged   : [List bug IDs]                                    ║
╠══════════════════════════════════════════════════════════════════╣
║ TESTER CERTIFICATION                                              ║
║ I certify that I executed this test script according to the       ║
║ documented procedures and recorded accurate results.              ║
║                                                                   ║
║ Tester Name   : _______________________                           ║
║ Tester Signature: _____________________ Date: ___________         ║
╠══════════════════════════════════════════════════════════════════╣
║ QA LEAD REVIEW (if required)                                      ║
║ Reviewed By   : _______________________                           ║
║ Review Date   : _______________________                           ║
║ Approval      : APPROVED □   NEEDS RETEST □   REJECTED □          ║
║ Comments      : _____________________________________________     ║
╚══════════════════════════════════════════════════════════════════╝
```

### 6.2 Release Sign-Off

Before a release, aggregate sign-off:

```
╔══════════════════════════════════════════════════════════════════╗
║                    RELEASE TEST SIGN-OFF                          ║
╠══════════════════════════════════════════════════════════════════╣
║ Release Version: _______________________                          ║
║ Release Date   : _______________________                          ║
║ Environment    : _______________________                          ║
╠══════════════════════════════════════════════════════════════════╣
║ TEST EXECUTION SUMMARY                                            ║
╠══════════════════════════════════════════════════════════════════╣
║ Total Scripts     : ____                                          ║
║ Scripts Passed    : ____                                          ║
║ Scripts Failed    : ____                                          ║
║ Scripts Blocked   : ____                                          ║
║ Scripts Not Run   : ____                                          ║
║                                                                   ║
║ Pass Rate         : ____%                                         ║
╠══════════════════════════════════════════════════════════════════╣
║ BUG SUMMARY                                                       ║
╠══════════════════════════════════════════════════════════════════╣
║ Critical Open     : ____                                          ║
║ High Open         : ____                                          ║
║ Medium Open       : ____                                          ║
║ Low Open          : ____                                          ║
╠══════════════════════════════════════════════════════════════════╣
║ RELEASE DECISION                                                  ║
║ □ GO - All critical/high bugs resolved, acceptable pass rate      ║
║ □ GO WITH KNOWN ISSUES - Document accepted risks                  ║
║ □ NO GO - Critical issues remain, cannot release                  ║
╠══════════════════════════════════════════════════════════════════╣
║ APPROVALS                                                         ║
║ QA Lead      : _____________________ Date: ___________            ║
║ Dev Lead     : _____________________ Date: ___________            ║
║ Product Owner: _____________________ Date: ___________            ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 7. Test Data Requirements

### 7.1 Standard Test Users

| User ID | Email | Password | Role | State | Purpose |
|---------|-------|----------|------|-------|---------|
| TU-001 | testprep@test.com | TestPass123! | User | Prep Phase (Day -7) | Test Prep Phase flows |
| TU-002 | testday1@test.com | TestPass123! | User | Day 1 | Test first day experience |
| TU-003 | testweek3@test.com | TestPass123! | User | Day 15 (Week 3) | Test mid-program |
| TU-004 | testweek10@test.com | TestPass123! | User | Day 65 (Week 10) | Test late program |
| TU-005 | testpost@test.com | TestPass123! | User | Day 75 (Post Phase) | Test Post Phase |
| TU-006 | testmissed@test.com | TestPass123! | User | Day 20 + 5 missed | Test Catch Up |
| TU-007 | testfree@test.com | TestPass123! | Free User | Day 10 | Test Free tier limits |
| TU-008 | testpremium@test.com | TestPass123! | Premium | Day 10 | Test Premium access |
| TU-009 | testnew@test.com | TestPass123! | User | New account | Test onboarding |
| TU-010 | testadmin@test.com | TestPass123! | Admin | N/A | Test admin functions |

### 7.2 Test Data Reset Procedures

Before each test cycle, ensure:

```
□ Test users reset to known state
□ Daily logs cleared for fresh testing
□ Streak counts reset as needed
□ Content completion flags reset
□ Reflection history cleared
□ Time Travel reset to current date
```

### 7.3 Cohort Configuration

| Cohort Name | Start Date | Users | Purpose |
|-------------|------------|-------|---------|
| Test Cohort Alpha | Current Date - 7 | TU-001 | Prep Phase testing |
| Test Cohort Beta | Current Date | TU-002 | Day 1 testing |
| Test Cohort Gamma | Current Date - 14 | TU-003 | Week 3 testing |
| Test Cohort Delta | Current Date - 64 | TU-004 | Week 10 testing |
| Test Cohort Omega | Current Date - 74 | TU-005 | Post Phase testing |

---

## 8. Test Environment Strategy

### 8.1 Environment Usage

| Environment | URL | Purpose | When to Use |
|-------------|-----|---------|-------------|
| **DEV** | leaderreps-pd-platform.web.app | Feature testing, development QA | New features, bug fixes |
| **TEST** | leaderreps-test.web.app | UAT, regression, release testing | Pre-release validation |
| **LOCAL** | localhost:5173 | Developer testing | Debugging, quick checks |

### 8.2 Environment Preparation

Before testing in an environment:

```
DEV Environment Checklist:
□ Latest code deployed
□ Test users configured
□ Test cohorts created
□ Feature flags set appropriately
□ Time Travel reset

TEST Environment Checklist:
□ Release candidate deployed
□ Production-like data loaded
□ Test users with realistic data
□ All feature flags match production config
□ Time Travel disabled (test real time)
```

---

## 9. Deliverables

### 9.1 Test Script Deliverables

| Deliverable | Format | Description |
|-------------|--------|-------------|
| Test Scripts - Prep Phase | Markdown + Excel | All PREP scenario scripts |
| Test Scripts - Dev Phase | Markdown + Excel | All DEV scenario scripts |
| Test Scripts - Post Phase | Markdown + Excel | All POST scenario scripts |
| Test Scripts - Admin | Markdown + Excel | All ADMIN scenario scripts |
| Test Scripts - Cross-Cutting | Markdown + Excel | Auth, Nav, Responsive scripts |
| Bug Report Template | Markdown | Standardized bug format |
| Execution Log Template | Excel | Track test runs |
| Sign-Off Forms | PDF | Printable sign-off sheets |

### 9.2 Documentation Deliverables

| Deliverable | Format | Description |
|-------------|--------|-------------|
| Test Strategy Document | Markdown | This document |
| Test Data Guide | Markdown | How to set up test data |
| Environment Guide | Markdown | Environment configuration |
| Tester Training Guide | Markdown | How to execute tests |

### 9.3 Tracking Deliverables

| Deliverable | Format | Description |
|-------------|--------|-------------|
| Test Execution Dashboard | Excel/Notion | Real-time status |
| Bug Tracking Log | Excel/GitHub Issues | All bugs logged |
| Coverage Matrix | Excel | Tests vs. Features mapping |

---

## 10. Format & Tooling Recommendations

### 10.1 Recommended Format: Markdown + Excel Hybrid

**Why Markdown for Test Scripts:**
- Version controlled in Git alongside code
- Easy to read and edit
- Supports rich formatting (tables, checkboxes)
- Diff-friendly for change tracking
- Can be viewed directly on GitHub

**Why Excel for Execution Tracking:**
- Easy for non-technical testers
- Built-in formulas for pass rates
- Filtering and sorting capabilities
- Printable for sign-off
- Can generate charts/dashboards

### 10.2 Bug Tracking: GitHub Issues

**Recommendation:** Use GitHub Issues for bug tracking because:
- Already integrated with your codebase
- Free, no additional software
- Labels for severity/priority
- Assignees and milestones
- Links to commits/PRs for fixes
- Search and filtering built-in

**Label Structure:**
```
bug/critical, bug/high, bug/medium, bug/low
status/new, status/confirmed, status/fixed, status/verified
area/prep, area/dev, area/post, area/auth, area/content
```

### 10.3 Automation Strategy: Playwright (Built-In)

**Why Playwright:**
- Free and open source
- Already can be installed via npm (no extra software)
- I (Copilot) can write and run these scripts
- Cross-browser support (Chrome, Firefox, Safari)
- Built-in screenshots and video recording
- Works in your existing dev container

**Implementation Path:**
1. Phase 1: Manual scripts (current focus)
2. Phase 2: Convert Critical Path to Playwright
3. Phase 3: Full automation suite

**Sample Playwright Test (Preview):**
```javascript
// tests/prep-phase.spec.ts
import { test, expect } from '@playwright/test';

test('PREP-001: New user can create account via invite', async ({ page }) => {
  // Navigate to invite link
  await page.goto('/register?token=test-invite-token');
  
  // Fill registration form
  await page.fill('[name="firstName"]', 'Test');
  await page.fill('[name="lastName"]', 'User');
  await page.fill('[name="email"]', 'newuser@test.com');
  await page.fill('[name="password"]', 'TestPass123!');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

---

## 11. Implementation Timeline

### Proposed Timeline

```
Week 1: Foundation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Finalize test script template
□ Set up test data and users in TEST environment
□ Create execution tracking spreadsheet
□ Create GitHub Issue labels for bug tracking
□ Train team on test process

Week 2: Critical Path Scripts (Prep + Auth)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Write PREP-001 to PREP-018 (All Prep scenarios)
□ Write CROSS-AUTH-001 to CROSS-AUTH-019 (All Auth)
□ First execution - Prep & Auth flows
□ Log bugs, begin fixes

Week 3: AM/PM Bookends + Scorecard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Write DEV-D1-001 to DEV-D1-005 (Day 1 First Experience)
□ Write DEV-AM-001 to DEV-AM-023 (All AM scenarios)
□ Write DEV-PM-001 to DEV-PM-020 (All PM scenarios)
□ Write DEV-SCR-001 to DEV-SCR-014 (Scorecard/Streak)
□ Execute and log bugs

Week 4: Content, Community, Coaching, Locker
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Write DEV-CON-001 to DEV-CON-023 (Content Library)
□ Write DEV-COM-001 to DEV-COM-011 (Community)
□ Write DEV-COA-001 to DEV-COA-010 (Coaching)
□ Write DEV-LOC-001 to DEV-LOC-007 (Locker)
□ Full Dev Phase execution

Week 5: Rollover, Post Phase, Cross-Cutting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Write DEV-ROLL-001 to DEV-ROLL-010 (Rollover)
□ Write POST-001 to POST-009 (Post Phase)
□ Write CROSS-NAV, CROSS-PRO, CROSS-ERR scenarios
□ Write TIME-001 to TIME-008 (Time-sensitive)
□ Full regression execution

Week 6: Polish & Automation Foundation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Write CROSS-RESP and CROSS-A11Y scenarios
□ Refine scripts based on execution feedback
□ Install Playwright, create first automated smoke test
□ Final documentation review

Ongoing: Maintenance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Update scripts for new features
□ Run regression before releases
□ Expand Playwright automation coverage
□ Maintain bug log
□ Continuous improvement
```

---

## Appendix: Test Scenario Inventory

### Summary Count (Updated)

| Phase/Area | Scenario Count | Critical | High | Medium | Low |
|------------|----------------|----------|------|--------|-----|
| **PREP PHASE** | 18 | 5 | 7 | 6 | 0 |
| **DEV - Day 1 First** | 5 | 1 | 4 | 0 | 0 |
| **DEV - AM Bookend** | 23 | 6 | 12 | 5 | 0 |
| **DEV - PM Bookend** | 20 | 5 | 10 | 3 | 2 |
| **DEV - Scorecard/Streak** | 14 | 2 | 8 | 4 | 0 |
| **DEV - Rollover** | 10 | 4 | 5 | 1 | 0 |
| **DEV - Plan View** | 8 | 1 | 5 | 2 | 0 |
| **DEV - Content Library** | 23 | 3 | 12 | 6 | 2 |
| **DEV - Community** | 11 | 0 | 4 | 4 | 3 |
| **DEV - Coaching** | 10 | 0 | 4 | 6 | 0 |
| **DEV - Locker** | 7 | 0 | 0 | 5 | 2 |
| **POST PHASE** | 9 | 1 | 5 | 3 | 0 |
| **CROSS - Auth/Session** | 19 | 3 | 12 | 4 | 0 |
| **CROSS - Navigation** | 8 | 2 | 3 | 3 | 0 |
| **CROSS - Profile** | 7 | 0 | 0 | 4 | 3 |
| **CROSS - Error Handling** | 11 | 0 | 3 | 3 | 5 |
| **CROSS - Responsive** | 15 | 2 | 8 | 3 | 2 |
| **CROSS - Accessibility** | 5 | 0 | 0 | 2 | 3 |
| **TIME - Time-Sensitive** | 8 | 1 | 4 | 2 | 1 |
| **──────────────────** | **──────** | **──────** | **──────** | **──────** | **──────** |
| **GRAND TOTAL** | **231** | **36** | **106** | **66** | **23** |

### Critical Path Smoke Test (36 Scenarios)

Run these first to validate core functionality:

**Authentication (6)**
- CROSS-AUTH-001: Email Login
- CROSS-AUTH-002: Wrong Password Error
- CROSS-AUTH-007: Logout
- CROSS-AUTH-014: Signup Via Invite
- CROSS-NAV-001: Desktop Navigation
- CROSS-NAV-002: Mobile Navigation

**Prep Phase (5)**
- PREP-001: New User Registration
- PREP-003: Prep Gate Display
- PREP-004: Leader Profile Creation
- PREP-006: Baseline Assessment
- PREP-014: Day 1 Blocked Without Prep

**Day 1 & AM Bookend (10)**
- DEV-D1-001: Day 1 Unlock
- DEV-AM-001: Grounding Rep Display
- DEV-AM-002: Grounding Rep Complete
- DEV-AM-004: Add First Win
- DEV-AM-005: Add 3 Wins
- DEV-AM-012: Daily Reps Display
- DEV-AM-014: Daily Reps Complete
- DEV-AM-016: AM Bookend Completion
- DEV-SCR-001: Scorecard Display
- DEV-SCR-002: Scorecard Calculation

**PM Bookend (7)**
- DEV-PM-001: PM Bookend Access
- DEV-PM-002: Win Review Display
- DEV-PM-003: Win Mark Complete
- DEV-PM-008: Reflection View
- DEV-PM-012: Reflection Submit
- DEV-PM-017: PM Bookend Completion
- DEV-ROLL-001: Rollover Triggers

**Content & Plan (5)**
- DEV-CON-001: Access Content Library
- DEV-CON-002: View Unlocked Content
- DEV-CON-010: Video Playback
- DEV-PLN-004: Future Days Locked
- DEV-ROLL-008: New Content Unlocks

**Post Phase (3)**
- POST-001: Day 70 to 71 Transition
- POST-003: Full Content Access
- POST-004: Continue AM Bookend

### Recommended Execution Order

1. **Smoke Test (Critical Path)**: 36 scenarios, ~3-4 hours
   - Run before every deployment

2. **Phase-Specific Testing**: As needed
   - Prep Phase: 18 scenarios (~1.5 hours)
   - Dev Phase Full: 131 scenarios (~10-12 hours)
   - Post Phase: 9 scenarios (~1 hour)
   - Cross-Cutting: 73 scenarios (~6 hours)

3. **Full Regression**: All 231 scenarios, ~16-20 hours
   - Run before major releases
   - Can be split across multiple testers

---

## Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| QA Lead | | | |
| Dev Lead | | | |

---

*Document End*
