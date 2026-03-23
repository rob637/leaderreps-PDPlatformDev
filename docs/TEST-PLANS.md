md
# 🧪 LeaderReps PD Platform - Test Plans

> **Comprehensive testing documentation for quality assurance**  
> *Last Updated: March 23, 2026*

---

## Overview

This document outlines test plans for ensuring the LeaderReps PD Platform functions correctly across all features and user scenarios.

---

## Table of Contents

1. [Testing Environments](#1-testing-environments)
2. [Conditioning Reps Tests](#2-conditioning-reps-tests)
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
14. [Deployment Tests](#14-deployment-tests)

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

## 2. Conditioning Reps Tests

### 2.1 Committing to a Rep

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CR-001 | View Reps | Navigate to Conditioning screen | Reps display | |
| CR-002 | Commit to Rep | Click commit button on rep | Status changes to "Committed" | |
| CR-003 | Prep Required | Select Rep that requires prep | Prep form opens | |
| CR-004 | Prep Not Required | Select Rep that does not require prep | Status changes to "Committed" | |

### 2.2 Preparing a Rep

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CR-010 | Fill Prep Form | Fill out all fields in the prep form | Data is saved, status updates to "Prepared" | |
| CR-011 | Save Prep Progress | Fill out part of the prep form, save | Progress is saved; can resume later | |
| CR-012 | Cancel Prep | Start prep, then cancel | Returns to rep list, status remains "Committed" | |

### 2.3 Scheduling a Rep

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CR-020 | Schedule Rep | Choose a date and time | Rep is scheduled, status updates | |
| CR-021 | Reschedule Rep | Modify the scheduled time | Time is updated | |
| CR-022 | Cancel Scheduled Rep | Cancel the scheduled rep | Rep is canceled, status updates | |

### 2.4 Executing a Rep

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CR-030 | Mark as Executed | Mark rep as executed | Status changes to "Executed" | |

### 2.5 Debriefing a Rep

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CR-040 | Enter Debrief | Fill in debriefing questions | Data is saved | |
| CR-041 | Complete Debrief | Submit a completed debrief | Status updates to "Debriefed" | |

### 2.6 Evidence Submission

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CR-050 | Upload Evidence | Upload video or reflection | Evidence is saved and associated with rep | |
| CR-051 | Review Evidence | View uploaded evidence | Evidence displays correctly | |

### 2.7 Week Roll Over

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CR-060 | Uncompleted Reps Carry Over | Don't complete rep before week end | Reps appear in the next week | |
| CR-061 | Completed Reps Are Archived | Completed reps do not carry over | Only uncompleted reps show | |
| CR-062 | Week Counter | Progress to a new week | Week counter updates | |

### 2.8 Missed Debriefing

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CR-070 | Missed Debrief Submission | Complete rep without debriefing | Form for "missed debrief" displays | |
| CR-071 | Missed Debrief Required | Try to submit with empty field | Validation message | |

### 2.9 Filters and Sorting

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CR-080 | Filter by Type | Select rep type | Only reps of that type are displayed | |
| CR-081 | Sort by Deadline | Sort reps by deadline | Reps are sorted correctly | |

### 2.10 Required Rep Completed

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CR-090 | Complete Required Rep | Complete at least 1 rep within the week | requiredRepCompleted is `true` for the current week | |
| CR-091 | No Rep Completed | Don't complete any rep within the week | requiredRepCompleted is `false` for the current week | |

### 2.11 Cancel Rep

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| CR-100 | Cancel Rep Before Executed | Cancel a committed or prepared rep | Rep is cancelled, and the status is updated to cancelled | |
| CR-101 | Cancel Rep After Executed | Try to cancel a rep after it has been executed | Cancellation is prevented, or an error message is displayed | |
| CR-102 | Provide Cancel Reason | When canceling a rep, ensure a reason is provided | Rep cannot be cancelled without providing a valid cancel reason | |

---

## 3. Development Plan Tests

### 3.1 Plan Enrollment

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DEV-001 | New User Enrollment | Create new account, access Dev Plan | Enrollment prompt displays | |
| DEV-002 | Start Plan | Click "Start Plan" button | Plan initialized, Week 1 active | |
| DEV-003 | Leadership Skills Baseline | Complete assessment | Results saved, recommendations show | |

### 3.2 Week Navigation

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| DEV-010 | View Timeline | Navigate to Dev Plan screen | All 8 weeks visible | |
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

### 6.2 Content Manager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-010 | Add Video | Upload new video | Video saved to vault | |
| ADM-011 | Add Reading | Add new reading | Reading saved | |
| ADM-012 | Edit Content | Modify existing content | Changes saved | |
| ADM-013 | Deactivate Content | Toggle inactive | Content hidden | |
| ADM-014 | File Upload | Upload PDF | File stored, URL saved | |

### 6.3 System Widgets

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-020 | View Widgets | Go to System Widgets | All widgets listed | |
| ADM-021 | Disable Widget | Toggle widget off | Widget hidden from app | |
| ADM-022 | Enable Widget | Toggle widget on | Widget visible in app | |
| ADM-023 | Reorder Widgets | Drag to reorder | Order persists | |

### 6.4 System Tools

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-030 | Time Traveler | Set time offset | App shows future/past date | |
| ADM-031 | Reset Time | Clear time offset | App shows current date | |
| ADM-032 | View Diagnostics | Go to Diagnostics tab | System stats display | |

### 6.5 ContentAdminHome (Unified Content Manager)

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-040 | Access UCM | Go to ContentAdminHome tab | UCM Interface loads | |
| ADM-041 | Create New Content | Click "Create" | New content form opens | |
| ADM-042 | Edit Existing Content | Select content and click "Edit" | Content editor opens | |
| ADM-043 | Delete Content | Select content and click "Delete" | Content is removed after confirmation | |

### 6.6 Media Library

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-050 | Access Media Library | Go to Media Library tab | Media Library loads | |
| ADM-051 | Upload Media | Upload an image or video | Media is uploaded successfully | |
| ADM-052 | Delete Media | Select media and click "Delete" | Media is deleted after confirmation | |

### 6.7 System Diagnostics

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-060 | Access Diagnostics | Go to System Diagnostics tab | Diagnostics information is displayed | |
| ADM-061 | Check Firebase Status | Review Firebase status | Firebase connection status is shown | |

### 6.8 Feature Manager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-070 | Access Feature Manager | Go to Feature Manager tab | Available features are listed | |
| ADM-071 | Enable Feature | Toggle feature on | Feature is enabled | |
| ADM-072 | Disable Feature | Toggle feature off | Feature is disabled | |

### 6.9 Documentation Center

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-080 | Access Documentation | Go to Documentation Center tab | Documentation loads | |
| ADM-081 | Verify Content | Review documentation | Information accurate | |

### 6.10 Test Center

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-090 | Access Test Center | Go to Test Center tab | Testing tools load | |
| ADM-091 | Run Unit Tests | Execute unit tests | Tests run and results displayed | |

### 6.11 LOV Manager (List of Values)

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-100 | Access LOV Manager | Go to LOV Manager tab | LOV Management interface loads | |
| ADM-101 | Create New LOV | Create a new list of values | New LOV is created | |
| ADM-102 | Edit Existing LOV | Modify an existing list of values | LOV is updated successfully | |
| ADM-103 | Delete LOV | Delete a list of values | LOV is deleted after confirmation | |

### 6.12 DailyRepsLibrary

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------| Krankenwagen.de/-----------|-----------------|-----------|
| ADM-110 | Access Daily Reps Library | Go to Daily Reps Library tab | The library loads | |
| ADM-111 | Add New Rep | Create a new daily rep | New rep is added successfully | |
| ADM-112 | Edit Existing Rep | Modify an existing rep | Rep is updated | |
| ADM-113 | Delete Rep | Delete a daily rep | The rep is deleted | |

### 6.13 DailyPlanManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-120 | Access Daily Plan Manager | Go to Daily Plan Manager tab | Manager loads | |
| ADM-121 | Create New Plan | Create a new daily plan | New plan is created | |
| ADM-122 | Edit Existing Plan | Modify an existing plan | The plan is updated | |
| ADM-123 | Delete Plan | Delete a daily plan | Plan is deleted | |

### 6.14 CohortManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-130 | Access Cohort Manager | Go to Cohort Manager tab | The manager loads | |
| ADM-131 | Create New Cohort | Create a new cohort | New cohort is created | |
| ADM-132 | Edit Existing Cohort | Modify an existing cohort | Cohort is updated | |
| ADM-133 | Delete Cohort | Delete a cohort | Cohort is deleted | |

### 6.15 UserManagement

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-140 | Access User Management | Go to User Management tab | Management interface loads | |
| ADM-141 | Search for User | Search for a user by email or ID | Relevant users are displayed | |
| ADM-142 | Edit User Details | Modify user details | Details are updated | |
| ADM-143 | Delete User | Delete a user | User is deleted | |

### 6.16 LeaderProfileReports

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-150 | Access Leader Profile Reports | Go to Leader Profile Reports tab | Reports interface loads | |
| ADM-151 | Generate Report | Generate a report for a specific user | Report is generated | |
| ADM-152 | View Report | View a generated report | Report data is displayed | |

### 6.17 NotificationManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-160 | Access Notification Manager | Go to Notification Manager tab | Notification Management interface loads | |
| ADM-161 | Create New Notification | Create a new notification | Notification is created | |
| ADM-162 | Send Notification | Send a created notification | Notification is sent | |
| ADM-163 | Edit Existing Notification | Modify existing notification | Notification is updated | |
| ADM-164 | Delete Notification | Delete a notification | Notification is deleted | |

### 6.18 CommunityManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-170 | Access Community Manager | Go to Community Manager tab | Community Management interface loads | |
| ADM-171 | Manage Users | Add or remove users from community groups | User assignments are updated | |
| ADM-172 | View Community Activity | View posts, comments, and other activity | Activity stream is displayed | |

### 6.19 CoachingManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-180 | Access Coaching Manager | Go to Coaching Manager tab | Coaching Management interface loads | |
| ADM-181 | Assign Coaches | Assign coaches to users or groups | Coach assignments are updated | |
| ADM-182 | View Coaching Sessions | View scheduled or completed coaching sessions | Session details are displayed | |

### 6.20 LevelSignOffQueue
| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-190 | Access Level Sign Off Queue | Go to Level Sign Off Queue tab | Level Sign Off Queue Management interface loads | |
| ADM-191 | View Pending Sign-Offs | Review items pending level approval | Pending sign-offs are displayed | |
| ADM-192 | Approve Level | Approve a specific level sign-off request | Level sign-off is approved | |
| ADM-193 | Reject Level | Reject a specific level sign-off request | Level sign-off is rejected | |

### 6.21 SessionAttendanceQueue

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-200 | Access Session Attendance Queue | Go to Session Attendance Queue tab | Session Attendance Queue Management interface loads | |
| ADM-201 | View Pending Attendance | Review items pending attendance review | Pending attendances are displayed | |
| ADM-202 | Approve Attendance | Approve a specific attendance request | Attendance is approved | |
| ADM-203 | Reject Attendance | Reject a specific attendance request | Attendance is rejected | |

### 6.22 CoachingCertificationQueue

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-210 | Access Coaching Certification Queue | Go to Coaching Certification Queue tab | Coaching Certification Queue Management interface loads | |
| ADM-211 | View Pending Certifications | Review items pending certification approval | Pending certifications are displayed | |
| ADM-212 | Approve Certification | Approve a specific certification request | Certification is approved | |
| ADM-213 | Reject Certification | Reject a specific certification request | Certification is rejected | |

### 6.23 CommunicationsManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-220 | Access Communications Manager | Go to Communications Manager tab | Communications Management interface loads | |
| ADM-221 | Send Email | Create and send a test email | Email is sent | |
| ADM-222 | Send SMS | Create and send a test SMS | SMS is sent | |

### 6.24 AnnouncementsManager

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-230 | Access Announcements Manager | Go to Announcements Manager tab | Announcements Management interface loads | |
| ADM-231 | Create New Announcement | Create a new announcement | Announcement is created | |
| ADM-232 | Publish Announcement | Publish a created announcement | Announcement is published | |
| ADM-233 | Edit Existing Announcement | Modify existing announcement | Announcement is updated | |
| ADM-234 | Delete Announcement | Delete an announcement | Announcement is deleted | |

### 6.25 ConditioningDashboard

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-240 | Access Conditioning Dashboard | Go to Conditioning Dashboard tab | Conditioning Dashboard interface loads | |
| ADM-241 | View Conditioning Metrics | Review conditioning data and charts | Metrics are displayed | |

### 6.26 ConditioningConfig

| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-250 | Access Conditioning Config | Go to Conditioning Config tab | Conditioning Configuration interface loads | |
| ADM-251 | Configure Conditioning Settings | Modify conditioning parameters | Settings are saved | |

### 6.27 UxAuditPanel
| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-260 | Access UX Audit Panel | Go to UX Audit Panel tab | UX Audit Panel interface loads | |
| ADM-261 | Review UX Issues | Examine identified user experience issues | UX issues are displayed | |

### 6.28 VideoSeriesManager
| Test ID | Test Case | Steps | Expected Result | Pass/Fail |
|---------|-----------|-------|-----------------|-----------|
| ADM-270 | Access Video Series Manager | Go to Video Series Manager tab | Video Series Manager interface loads | |
| ADM-271 | Create Video Series | Create a new video series | Video series created | |
| ADM-272 | Add Video To Series | Add videos to an existing series | Video added to series | |

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
| WID-021 | Catchup Alert Display | Missed Daily Reps | Catchup alert is displayed at the top | |
| WID-022 | Catchup Alert Functionality | Click View Missed Button | Catchup modal opens | |

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
|---------|-----------|-------|-----------------| Krankenwagen.de/-----------|
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