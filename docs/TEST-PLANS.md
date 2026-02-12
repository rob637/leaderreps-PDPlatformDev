# 🧪 LeaderReps PD Platform - Test Plans

> **Comprehensive testing documentation for quality assurance**  
> *Last Updated: January 9, 2026*

---

## Overview

This document outlines test plans for ensuring the LeaderReps PD Platform functions correctly across all features and user scenarios.

---

## Table of Contents

1. [Testing Environments](#1-testing-environments)
2. [Daily Practice Tests](#2-daily-practice-tests)
3. [Development Plan Tests](#3-development-plan-tests)
4. [Content System Tests](#4-content-system-tests)
5. [Authentication Tests](#5-authentication-tests)
6. [Admin Portal Tests](#6-admin-portal-tests)
7. [Widget Tests](#7-widget-tests)
8. [Time-Based Feature Tests](#8-time-based-feature-tests)
9. [Cross-Browser Tests](#9-cross-browser-tests)
10. [Mobile/Responsive Tests](#10-mobileresponsive-tests)
11. [Performance Tests](#11-performance-tests)
12. [Regression Test Checklist](#12-regression-test-checklist)
13. [Cleanup Scripts Tests](#13-cleanup-scripts-tests)

---

## 1. Testing Environments

### Available Environments

| Environment | URL | Firebase Project | Purpose |
|-------------|-----|-----------------|---------|
| DEV | https://leaderreps-pd-platform.web.app | leaderreps-pd-platform | Development & primary testing |
| TEST | https://leaderreps-test.web.app | leaderreps-test | Staging & UAT |
| LOCAL | http://localhost:5173 | (DEV database) | Local development |

### Test Accounts

| Role | Email | Purpose |
|------|-------|---------|
| Admin | rob@sagecg.com | Full admin access testing |
| Admin | ryan@leaderreps.com | Secondary admin testing |
| Admin | admin@leaderreps.com | Tertiary admin testing |
| Free User | (create test account) | Free tier feature testing |
| Premium User | (create test account) | Premium feature testing |
| New User | (create test account) | Onboarding flow testing |

### Pre-Test Setup

1. Clear browser cache and cookies
2. Use incognito/private window for clean state
3. Note the current date and time
4. Document browser and OS version

---

## 2. Daily Practice Tests

### 2.1 AM Bookend - Grounding Rep

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DP-001 | View Grounding Rep | Navigate to Planning Hub | Identity statement displays | |
| DP-002 | Complete Grounding | Click "I'm Grounded" button | Status shows complete, scorecard updates | |
| DP-003 | Grounding Persistence | Refresh page after completing | Grounding still shows complete | |
| DP-004 | Grounding Reset | Wait for daily rollover | Grounding resets to incomplete | |

### 2.2 AM Bookend - Win the Day

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DP-010 | Add Win | Type in win input, press Enter | Win appears in list | |
| DP-011 | Add 3 Wins | Add three separate wins | All 3 display, status shows "3/3" | |
| DP-012 | Edit Win | Click edit icon on win | Can modify text | |
| DP-013 | Delete Win | Click delete icon on win | Win removed from list | |
| DP-014 | Win Persistence | Refresh after adding wins | Wins persist | |

### 2.3 AM Bookend - Daily Reps

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DP-020 | View Reps | Navigate to Planning Hub | Current week's reps display | |
| DP-021 | Commit to Rep | Click commit button on rep | Status changes to "Committed" | |
| DP-022 | Complete Rep | Mark rep as done | Scorecard updates | |
| DP-023 | Rep Source | Check rep labels | Match current Dev Plan week | |

### 2.4 PM Bookend - Win Review

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DP-030 | View Wins PM | Navigate to Reflection screen | Morning wins display for review | |
| DP-031 | Mark Complete | Check win as complete | Win marked ✓, scorecard updates | |
| DP-032 | Mark Incomplete | Leave win unchecked | Win marked for carryover | |
| DP-033 | Carryover Next Day | After rollover, check AM | Incomplete wins appear | |

### 2.5 PM Bookend - Reflection

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DP-040 | Enter Reflection | Type in Good/Better/Best fields | Text saves | |
| DP-041 | Complete Reflection | Fill all 3 fields, submit | Reflection marked complete | |
| DP-042 | Reflection Required | Try to submit with empty field | Validation message | |
| DP-043 | View Past Reflections | Go to Locker → Reflections | History displays | |

### 2.6 Scorecard

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DP-050 | Scorecard Display | View Dashboard or Reflection | Scorecard shows percentages | |
| DP-051 | Scorecard Calculation | Complete various items | Percentages calculate correctly | |
| DP-052 | Scorecard Reset | After daily rollover | Scorecard resets to 0% | |

### 2.7 Streak

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DP-060 | Streak Display | View Dashboard | Current streak count shows | |
| DP-061 | Streak Increment | Complete activity, wait for rollover | Streak +1 | |
| DP-062 | Weekend Grace | No activity Sat/Sun, check Monday | Streak maintained | |
| DP-063 | Weekday Reset | No activity weekday, check next day | Streak = 0 | |

### 2.8 Catch Up Alert & Modal

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DP-070 | Missed Days Alert | Skip logging in for a few days | Amber alert appears on dashboard | |
| DP-071 | View Missed Days | Click "View Missed" on alert | Catch up modal opens | |
| DP-072 | Catch Up Completion | Complete missed activities through modal | Scorecard reflects completion | |

---

## 3. Development Plan Tests

### 3.1 Plan Enrollment

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DEV-001 | New User Enrollment | Create new account, access Dev Plan | Enrollment prompt displays | |
| DEV-002 | Start Plan | Click "Start Plan" button | Plan initialized, Week 1 active | |
| DEV-003 | Baseline Assessment | Complete assessment | Results saved, recommendations show | |

### 3.2 Week Navigation

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DEV-010 | View Timeline | Navigate to Dev Plan screen | All 12 weeks visible | |
| DEV-011 | Current Week Highlight | View timeline | Current week highlighted | |
| DEV-012 | Future Weeks Locked | Click future week | Shows locked state | |
| DEV-013 | Past Weeks Accessible | Click completed week | Content accessible | |

### 3.3 Content Unlocking

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DEV-020 | Week 1 Content | View Content library as Week 1 user | Only Week 1 content visible | |
| DEV-021 | Cumulative Content | View Content as Week 3 user | Weeks 1-3 content visible | |
| DEV-022 | Content Filtering | Filter by category | Correct items display | |
| DEV-023 | Premium Content Lock | View premium content as Free user | Shows upgrade prompt | |

### 3.4 Weekly Reps

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DEV-030 | Week-Specific Reps | View Daily Reps | Reps match current week theme | |
| DEV-031 | Rep Labels | Check rep text | Matches Dev Plan week definition | |
| DEV-032 | Week Transition | Advance to next week | Reps update to new week | |

---

## 4. Content System Tests

### 4.1 Video Content

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CON-001 | Video Playback | Click video, press play | Video plays | |
| CON-002 | Video Progress | Watch partial video | Progress saved | |
| CON-003 | Video Completion | Watch to end | Marked complete | |
| CON-004 | YouTube Embed | Play YouTube video | Embeds correctly | |

### 4.2 Reading Content

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CON-010 | PDF Display | Open PDF reading | PDF renders | |
| CON-011 | External Link | Click external resource | Opens in new tab | |
| CON-012 | Reading Complete | Mark reading done | Status updates | |

### 4.3 Content Filtering

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CON-020 | Search | Enter search term | Relevant results | |
| CON-021 | Filter by Type | Select Videos only | Only videos show | |
| CON-022 | Filter by Tier | Select Premium only | Only premium show | |
| CON-023 | Clear Filters | Clear all filters | All content shows | |

---

## 5. Authentication Tests

### 5.1 Login

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| AUTH-001 | Email Login | Enter valid credentials | Login successful | |
| AUTH-002 | Invalid Password | Enter wrong password | Error message | |
| AUTH-003 | Unknown Email | Enter non-existent email | Appropriate error | |
| AUTH-004 | Google Login | Click Google sign-in | OAuth flow completes | |

### 5.2 Registration

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| AUTH-010 | New Account | Complete registration form | Account created | |
| AUTH-011 | Duplicate Email | Register existing email | Error message | |
| AUTH-012 | Weak Password | Enter password < 8 chars | Validation error | |
| AUTH-013 | Email Verification | Check email after register | Verification sent | |

### 5.3 Session Management

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| AUTH-020 | Session Persist | Close and reopen browser | Still logged in | |
| AUTH-021 | Logout | Click logout | Redirected to login | |
| AUTH-022 | Multi-Tab | Open multiple tabs | Session consistent | |

---

## 6. Admin Portal Tests

### 6.1 Access Control

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-001 | Admin Access | Login as admin, access Admin Portal | Portal loads | |
| ADM-002 | Non-Admin Blocked | Login as regular user, try /admin | Access denied | |
| ADM-003 | Admin Email Check | Add email to admin list | New admin can access | |

### 6.2 Dev Plan Manager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-010 | View Weeks | Go to Dev Plan tab | All 12 weeks listed | |
| ADM-011 | Edit Week | Click edit on week | Editor opens | |
| ADM-012 | Save Changes | Modify and save week | Changes persist | |
| ADM-013 | Add Content | Add resource to week | Resource linked | |
| ADM-014 | Remove Content | Remove resource from week | Resource unlinked | |
| ADM-015 | Draft Mode | Toggle draft mode | Week hidden from users | |

### 6.3 Content Manager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-020 | Add Video | Upload new video | Video saved to vault | |
| ADM-021 | Add Reading | Add new reading | Reading saved | |
| ADM-022 | Edit Content | Modify existing content | Changes saved | |
| ADM-023 | Deactivate Content | Toggle inactive | Content hidden | |
| ADM-024 | File Upload | Upload PDF | File stored, URL saved | |

### 6.4 System Widgets

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-030 | View Widgets | Go to System Widgets | All widgets listed | |
| ADM-031 | Disable Widget | Toggle widget off | Widget hidden from app | |
| ADM-032 | Enable Widget | Toggle widget on | Widget visible in app | |
| ADM-033 | Reorder Widgets | Drag to reorder | Order persists | |

### 6.5 System Tools

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-040 | Time Traveler | Set time offset | App shows future/past date | |
| ADM-041 | Reset Time | Clear time offset | App shows current date | |
| ADM-042 | View Diagnostics | Go to Diagnostics tab | System stats display | |

### 6.6 ContentAdminHome (Unified Content Manager)

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-050 | Access UCM | Go to ContentAdminHome tab | UCM Interface loads | |
| ADM-051 | Create New Content | Click "Create" | New content form opens | |
| ADM-052 | Edit Existing Content | Select content and click "Edit" | Content editor opens | |
| ADM-053 | Delete Content | Select content and click "Delete" | Content is removed after confirmation | |

### 6.7 Media Library

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-054 | Access Media Library | Go to Media Library tab | Media Library loads | |
| ADM-055 | Upload Media | Upload an image or video | Media is uploaded successfully | |
| ADM-056 | Delete Media | Select media and click "Delete" | Media is deleted after confirmation | |

### 6.8 System Diagnostics

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-070 | Access Diagnostics | Go to System Diagnostics tab | Diagnostics information is displayed | |
| ADM-071 | Check Firebase Status | Review Firebase status | Firebase connection status is shown | |

### 6.9 Feature Manager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-080 | Access Feature Manager | Go to Feature Manager tab | Available features are listed | |
| ADM-081 | Enable Feature | Toggle feature on | Feature is enabled | |
| ADM-082 | Disable Feature | Toggle feature off | Feature is disabled | |

### 6.10 Documentation Center

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-090 | Access Documentation | Go to Documentation Center tab | Documentation loads | |
| ADM-091 | Verify Content | Review documentation | Information accurate | |

### 6.11 Test Center

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-100 | Access Test Center | Go to Test Center tab | Testing tools load | |
| ADM-101 | Run Unit Tests | Execute unit tests | Tests run and results displayed | |

### 6.12 LOV Manager (List of Values)

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-110 | Access LOV Manager | Go to LOV Manager tab | LOV Management interface loads | |
| ADM-111 | Create New LOV | Create a new list of values | New LOV is created | |
| ADM-112 | Edit Existing LOV | Modify an existing list of values | LOV is updated successfully | |
| ADM-113 | Delete LOV | Delete a list of values | LOV is deleted after confirmation | |

### 6.13 DailyRepsLibrary

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-120 | Access Daily Reps Library | Go to Daily Reps Library tab | The library loads | |
| ADM-121 | Add New Rep | Create a new daily rep | New rep is added successfully | |
| ADM-122 | Edit Existing Rep | Modify an existing rep | Rep is updated | |
| ADM-123 | Delete Rep | Delete a daily rep | The rep is deleted | |

### 6.14 DailyPlanManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-130 | Access Daily Plan Manager | Go to Daily Plan Manager tab | Manager loads | |
| ADM-131 | Create New Plan | Create a new daily plan | New plan is created | |
| ADM-132 | Edit Existing Plan | Modify an existing plan | The plan is updated | |
| ADM-133 | Delete Plan | Delete a daily plan | Plan is deleted | |

### 6.15 CohortManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-140 | Access Cohort Manager | Go to Cohort Manager tab | The manager loads | |
| ADM-141 | Create New Cohort | Create a new cohort | New cohort is created | |
| ADM-142 | Edit Existing Cohort | Modify an existing cohort | Cohort is updated | |
| ADM-143 | Delete Cohort | Delete a cohort | Cohort is deleted | |

### 6.16 UserManagement

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-150 | Access User Management | Go to User Management tab | Management interface loads | |
| ADM-151 | Search for User | Search for a user by email or ID | Relevant users are displayed | |
| ADM-152 | Edit User Details | Modify user details | Details are updated | |
| ADM-153 | Delete User | Delete a user | User is deleted | |

### 6.17 LeaderProfileReports

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-160 | Access Leader Profile Reports | Go to Leader Profile Reports tab | Reports interface loads | |
| ADM-161 | Generate Report | Generate a report for a specific user | Report is generated | |
| ADM-162 | View Report | View a generated report | Report data is displayed | |

### 6.18 NotificationManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-170 | Access Notification Manager | Go to Notification Manager tab | Notification Management interface loads | |
| ADM-171 | Create New Notification | Create a new notification | Notification is created | |
| ADM-172 | Send Notification | Send a created notification | Notification is sent | |
| ADM-173 | Edit Existing Notification | Modify existing notification | Notification is updated | |
| ADM-174 | Delete Notification | Delete a notification | Notification is deleted | |

### 6.19 CommunityManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-180 | Access Community Manager | Go to Community Manager tab | Community Management interface loads | |
| ADM-181 | Manage Users | Add or remove users from community groups | User assignments are updated | |
| ADM-182 | View Community Activity | View posts, comments, and other activity | Activity stream is displayed | |

### 6.20 CoachingManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-190 | Access Coaching Manager | Go to Coaching Manager tab | Coaching Management interface loads | |
| ADM-191 | Assign Coaches | Assign coaches to users or groups | Coach assignments are updated | |
| ADM-192 | View Coaching Sessions | View scheduled or completed coaching sessions | Session details are displayed | |

---

## 7. Widget Tests

### 7.1 Weekly Focus Widget

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| WID-001 | Display Weekly Focus | View dashboard | Weekly focus displays correctly based on Dev Plan week | |
| WID-002 | Correct Week Number | Verify week number | Week number matches current week in Dev Plan | |

### 7.2 LIS Maker Widget

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| WID-010 | Input Identity Statement | Enter text in the textarea | Text is displayed in the textarea | |
| WID-011 | Save Identity Statement | Click 'Save' or equivalent action | Identity statement is saved and persists after refresh | |
| WID-012 | Character Limit | Exceed the character limit (if any) | Character limit is enforced and displayed | |

### 7.3 AM Bookend Header Widget
| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| WID-020 | Correct Header Display | Navigate to Planning Hub | Correct header displays. Sun icon, "AM Bookend: Start Strong" Text. | |

### 7.4 Roadmap Widget

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| WID-030 | Roadmap Display | View dashboard where the Roadmap Widget is enabled | Roadmap widget displays with title and idea list | |
| WID-031 | Correct Title | Verify roadmap title | Title matches the configured title | |
| WID-032 | Idea Display | Verify idea list | Ideas are displayed with titles and descriptions | |

---

## 8. Time-Based Feature Tests

### 8.1 Daily Rollover (11:59 PM)

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| TIME-001 | Rollover Triggers | Wait for 11:59 PM (or Time Travel) | Function executes | |
| TIME-002 | Data Archived | Check daily_logs collection | Today's data archived | |
| TIME-003 | Wins Carryover | Check next day's AM | Incomplete wins appear | |
| TIME-004 | Scorecard Reset | Check next day | Scorecard at 0% | |
| TIME-005 | Streak Updated | Check streak count | Correctly incremented/reset | |

### 8.2 Time Travel Testing

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| TIME-010 | Set Future Date | Use Time Traveler, set +7 days | App shows future date | |
| TIME-011 | Cross Midnight | Travel across midnight boundary | Day transition handled | |
| TIME-012 | Historic Data | Travel to past date with data | Historical data loads | |
| TIME-013 | Reset to Present | Clear time offset | Current date restored | |

---

## 9. Cross-Browser Tests

### 9.1 Browser Compatibility

| Test ID | Browser | Version | Key Tests | Pass/Fail |
|---------|---------|---------|-----------|-----------|
| BROWSER-001 | Chrome | Latest | Full smoke test | |
| BROWSER-002 | Firefox | Latest | Full smoke test | |
| BROWSER-003 | Safari | Latest | Full smoke test | |
| BROWSER-004 | Edge | Latest | Full smoke test | |
| BROWSER-005 | Mobile Safari | iOS 16+ | Mobile smoke test | |
| BROWSER-006 | Chrome Android | Latest | Mobile smoke test | |

### 9.2 Browser-Specific Checks

| Test ID | Test Case | Browsers | Expected Result | Pass/Fail |
|---------|-----------|----------|-----------------|-----------|
| BROWSER-010 | Notifications | All | Permission prompt works | |
| BROWSER-011 | File Upload | All | File picker opens | |
| BROWSER-012 | Video Playback | All | Videos play | |
| BROWSER-013 | CSS Rendering | All | Consistent styling | |

---

## 10. Mobile/Responsive Tests

### 10.1 Responsive Breakpoints

| Test ID | Screen Size | Device Example | Key Checks | Pass/Fail |
|---------|-------------|----------------|------------|-----------|
| RESP-001 | 320px | iPhone SE | No horizontal scroll | |
| RESP-002 | 375px | iPhone 12 | Layout correct | |
| RESP-003 | 768px | iPad | Tablet layout | |
| RESP-004 | 1024px | iPad Pro | Large tablet | |
| RESP-005 | 1440px | Desktop | Full desktop | |

### 10.2 Touch Interactions

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| TOUCH-001 | Tap Navigation | Tap sidebar items | Navigation works | |
| TOUCH-002 | Swipe (if applicable) | Swipe gestures | Responds correctly | |
| TOUCH-003 | Long Press | Long press elements | No unexpected behavior | |
| TOUCH-004 | Pinch Zoom | Pinch zoom page | Appropriate zoom | |

### 10.3 Mobile Navigation

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| MOB-001 | Bottom Nav | Tap bottom nav items | Correct screens load | |
| MOB-002 | Menu Open/Close | Open/close mobile menu | Smooth animation | |
| MOB-003 | Back Button | Use device back | Expected navigation | |

---

## 11. Performance Tests

### 11.1 Load Times

| Test ID | Metric | Target | Actual | Pass/Fail |
|---------|--------|--------|--------|-----------|
| PERF-001 | First Contentful Paint | < 2s | | |
| PERF-002 | Time to Interactive | < 4s | | |
| PERF-003 | Largest Contentful Paint | < 3s | | |
| PERF-004 | Cumulative Layout Shift | < 0.1 | | |

### 11.2 Data Operations

| Test ID | Test Case | Target | Actual | Pass/Fail |
|---------|-----------|--------|--------|-----------|
| PERF-010 | Dashboard Load | < 2s | | |
| PERF-011 | Content List Load | < 1s | | |
| PERF-012 | Save Operation | < 500ms | | |
| PERF-013 | Search Response | < 300ms | | |

### 11.3 Offline/PWA

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| PWA-001 | Service Worker | Check DevTools | SW registered | |
| PWA-002 | Cache Assets | Disconnect network | App shell loads | |
| PWA-003 | Install Prompt | Visit site | Add to home shows | |

---

## 12. Regression Test Checklist

### Pre-Deployment Checklist

Run this checklist before every production deployment:

#### Authentication
- [ ] Login with email/password
- [ ] Login with Google
- [ ] Logout
- [ ] Password reset flow

#### Daily Practice
- [ ] Complete Grounding Rep
- [ ] Add 3 wins
- [ ] Commit to daily reps
- [ ] Complete reflection
- [ ] Scorecard updates correctly

#### Development Plan
- [ ] Timeline displays correctly
- [ ] Current week content accessible
- [ ] Future content locked
- [ ] Weekly reps match plan

#### Content
- [ ] Videos play
- [ ] PDFs open
- [ ] Search works
- [ ] Filters work

#### Admin (if admin changes)
- [ ] Admin portal accessible
- [ ] Week editing saves
- [ ] Content management works
- [ ] Widget toggles work
- [ ] System Diagnostics accessible and displaying data
- [ ] Feature Manager works
- [ ] Unified Content Manager Works
- [ ] Media Library Works
- [ ] LOV Manager works
- [ ] Daily Reps Library works
- [ ] Daily Plan Manager works
- [ ] Cohort Manager works
- [ ] User Management works
- [ ] Leader Profile Reports works
- [ ] Notification Manager works
- [ ] Community Manager works
- [ ] Coaching Manager works

#### Cross-Cutting
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Notifications work
- [ ] Performance acceptable

---

## 13. Cleanup Scripts Tests

### 13.1 Dev Environment Cleanup

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CLEAN-001 | Dry Run Preview | Execute `npm run cleanup:dev-preview` | Lists users to be deleted without actual deletion | |
| CLEAN-002 | Execute Deletion | Execute `npm run cleanup:dev-execute` | Deletes test users from the DEV environment | |

### 13.2 Test Environment Cleanup

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CLEAN-010 | Dry Run Preview | Execute `npm run cleanup:test-preview` | Lists users to be deleted without actual deletion | |
| CLEAN-011 | Execute Deletion | Execute `npm run cleanup:test-execute` | Deletes test users from the TEST environment | |

---

## Test Execution Log

### Template

| Date | Tester | Environment | Tests Run | Pass | Fail | Notes |
|------|--------|-------------|-----------|------|------|-------|
| | | | | | | |
| | | | | | | |

### Recent Test Runs

| Date | Tester | Environment | Tests Run | Pass | Fail | Notes |
|------|--------|-------------|-----------|------|------|-------|
| 2026-01-09 | Automated | DEV | Baseline | - | - | Updated test plan |

---

## Bug Report Template

When documenting issues found during testing:

```markdown
## Bug Report

**Test ID:** [e.g., DP-005]
**Environment:** [DEV/TEST/PROD]
**Date:** [YYYY-MM-DD]
**Tester:** [Name]

**Summary:** [One line description]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Videos:**
[Attach if applicable]

**Browser/Device:**
[Browser name, version, OS]

**Severity:** [Critical/High/Medium/Low]

**Additional Notes:**
[Any other relevant information]
```

---

*Keep this document updated as new features are added and tests are executed.*
---