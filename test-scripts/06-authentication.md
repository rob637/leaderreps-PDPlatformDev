# 📋 Authentication Test Scripts

> **Complete Test Coverage for Authentication**  
> *16 Scenarios | ~1-2 Hours | Tests Login, Signup, Logout*

---

## Overview

Authentication covers all user access scenarios:
- Email/password login
- Invite-based registration
- Logout
- Session management
- Password reset

---

## Pre-Execution Checklist

```
□ Environment: https://leaderreps-test.web.app
□ Valid test credentials available
□ Admin access for invite generation
□ Fresh email for new signup testing
□ Incognito browser for clean sessions
```

---

## Test Scenarios

### CROSS-AUTH-001: Email Login - Valid

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Existing user account

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to login page | Login form displays | ☐ | |
| 2 | Enter valid email | Email accepted | ☐ | |
| 3 | Enter valid password | Password masked | ☐ | |
| 4 | Click "Sign In" | Loading indicator | ☐ | |
| 5 | Dashboard loads | Successfully logged in | ☐ | |
| 6 | User name displayed | Correct user shown | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-002: Email Login - Wrong Password

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Existing user account

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to login page | Login form displays | ☐ | |
| 2 | Enter valid email | Email accepted | ☐ | |
| 3 | Enter WRONG password: `wrongpassword123` | Password entered | ☐ | |
| 4 | Click "Sign In" | Processing, then error | ☐ | |
| 5 | Error message shown | "Incorrect email or password" | ☐ | |
| 6 | Still on login page | NOT redirected | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-003: Email Login - Unregistered Email

**Priority:** High | **Time:** 2 min  
**Prerequisites:** None

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to login page | Login form displays | ☐ | |
| 2 | Enter unregistered email: `nobody@fake.com` | Email entered | ☐ | |
| 3 | Enter any password | Password entered | ☐ | |
| 4 | Click "Sign In" | Processing, then error | ☐ | |
| 5 | Error message shown | Generic error (don't reveal if exists) | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-004: Email Login - Empty Fields

**Priority:** High | **Time:** 2 min  
**Prerequisites:** None

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to login page | Login form displays | ☐ | |
| 2 | Leave email empty | Blank | ☐ | |
| 3 | Leave password empty | Blank | ☐ | |
| 4 | Click "Sign In" | Validation error | ☐ | |
| 5 | Error indicates required fields | Email/password required | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-005: Email Login - Invalid Email Format

**Priority:** Medium | **Time:** 2 min  
**Prerequisites:** None

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Enter invalid email: `notanemail` | Entered | ☐ | |
| 2 | Enter any password | Entered | ☐ | |
| 3 | Click "Sign In" | Validation error | ☐ | |
| 4 | Error indicates invalid email | "Enter valid email" | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-006: Email Login - Case Sensitivity

**Priority:** Medium | **Time:** 2 min  
**Prerequisites:** User with lowercase email

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Enter email with UPPERCASE: `ROB@SAGECG.COM` | Email entered | ☐ | |
| 2 | Enter correct password | Password entered | ☐ | |
| 3 | Click "Sign In" | Attempts login | ☐ | |
| 4 | Login successful | Email case-insensitive | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED  
**Note:** Document actual behavior

---

### CROSS-AUTH-007: Logout

**Priority:** Critical | **Time:** 2 min  
**Prerequisites:** Logged in user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Start from Dashboard | User logged in | ☐ | |
| 2 | Click profile menu/avatar | Menu opens | ☐ | |
| 3 | Click "Sign Out" | Processing | ☐ | |
| 4 | Redirected to login | Login page displays | ☐ | |
| 5 | Navigate to /dashboard | Redirected back to login | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-008: Session Persistence

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Logged in user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login to app | Dashboard loads | ☐ | |
| 2 | Close browser tab | Tab closed | ☐ | |
| 3 | Open new tab to app | Navigate to app | ☐ | |
| 4 | Verify still logged in | Dashboard loads (no login) | ☐ | |
| 5 | Close entire browser | Browser closed | ☐ | |
| 6 | Reopen browser to app | Check session | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED  
**Note:** Document if session persists after browser restart

---

### CROSS-AUTH-009: Multiple Tabs

**Priority:** Medium | **Time:** 3 min  
**Prerequisites:** Logged in user

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Open app in Tab 1 | Dashboard loads | ☐ | |
| 2 | Open app in Tab 2 | Dashboard loads | ☐ | |
| 3 | Complete action in Tab 1 | Action succeeds | ☐ | |
| 4 | Refresh Tab 2 | Sees updated state | ☐ | |
| 5 | Logout in Tab 1 | Logged out | ☐ | |
| 6 | Refresh Tab 2 | Should be logged out | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-010: Password Reset - Request

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Existing user account

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Navigate to login page | Login displays | ☐ | |
| 2 | Click "Forgot Password" | Reset form opens | ☐ | |
| 3 | Enter registered email | Email entered | ☐ | |
| 4 | Click "Send Reset Link" | Request submitted | ☐ | |
| 5 | Success message | "Check email" message | ☐ | |
| 6 | Verify email received | Reset email in inbox | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-011: Password Reset - Complete

**Priority:** High | **Time:** 5 min  
**Prerequisites:** Reset email received

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Click reset link in email | Reset form opens | ☐ | |
| 2 | Enter new password | Password accepted | ☐ | |
| 3 | Confirm new password | Matches | ☐ | |
| 4 | Click "Reset Password" | Processing | ☐ | |
| 5 | Success message | Password updated | ☐ | |
| 6 | Login with new password | Login successful | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-012: Invite Signup - Valid

**Priority:** Critical | **Time:** 5 min  
**Prerequisites:** Fresh invite link

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Admin generates invite | Link created | ☐ | |
| 2 | Open invite link | Registration form | ☐ | |
| 3 | Email pre-populated | Cannot change email | ☐ | |
| 4 | Enter First Name: `Test` | Accepted | ☐ | |
| 5 | Enter Last Name: `User` | Accepted | ☐ | |
| 6 | Enter Password: `TestPass123!` | Accepted | ☐ | |
| 7 | Click "Create Account" | Processing | ☐ | |
| 8 | Dashboard loads | Account created | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-013: Invite Signup - Expired/Invalid

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Expired or tampered invite link

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Open invalid/expired invite | Link processed | ☐ | |
| 2 | Error message displayed | "Invalid or expired invite" | ☐ | |
| 3 | Cannot proceed to register | Blocked | ☐ | |
| 4 | Link to contact admin | Help option shown | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-014: Invite Signup - Duplicate Email

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Invite for already-registered email

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Open invite for existing user | Registration form | ☐ | |
| 2 | Attempt to create account | Submit registration | ☐ | |
| 3 | Error message | "Account already exists" | ☐ | |
| 4 | Redirect to login | Login option provided | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-015: Protected Routes

**Priority:** Critical | **Time:** 3 min  
**Prerequisites:** Logged out state

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Clear all cookies/logout | Not authenticated | ☐ | |
| 2 | Navigate to /dashboard | Redirected to login | ☐ | |
| 3 | Navigate to /content | Redirected to login | ☐ | |
| 4 | Navigate to /dev-plan | Redirected to login | ☐ | |
| 5 | Navigate to /admin | Redirected to login | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

### CROSS-AUTH-016: Admin-Only Routes

**Priority:** High | **Time:** 3 min  
**Prerequisites:** Non-admin user logged in

| Step | Action | Expected Result | Pass/Fail | Notes |
|------|--------|-----------------|-----------|-------|
| 1 | Login as regular user | Dashboard loads | ☐ | |
| 2 | Navigate to /admin | Access denied OR redirect | ☐ | |
| 3 | Admin menu not visible | No admin link in sidebar | ☐ | |
| 4 | Try direct URL to admin pages | Blocked | ☐ | |

**Result:** ☐ PASS ☐ FAIL ☐ BLOCKED

---

## Summary Table

| ID | Scenario | Priority | Result |
|----|----------|----------|--------|
| CROSS-AUTH-001 | Email Login Valid | Critical | |
| CROSS-AUTH-002 | Wrong Password | Critical | |
| CROSS-AUTH-003 | Unregistered Email | High | |
| CROSS-AUTH-004 | Empty Fields | High | |
| CROSS-AUTH-005 | Invalid Email Format | Medium | |
| CROSS-AUTH-006 | Case Sensitivity | Medium | |
| CROSS-AUTH-007 | Logout | Critical | |
| CROSS-AUTH-008 | Session Persistence | High | |
| CROSS-AUTH-009 | Multiple Tabs | Medium | |
| CROSS-AUTH-010 | Password Reset Request | High | |
| CROSS-AUTH-011 | Password Reset Complete | High | |
| CROSS-AUTH-012 | Invite Signup Valid | Critical | |
| CROSS-AUTH-013 | Invite Expired | High | |
| CROSS-AUTH-014 | Duplicate Email | High | |
| CROSS-AUTH-015 | Protected Routes | Critical | |
| CROSS-AUTH-016 | Admin Routes | High | |

**Total: 16 Scenarios**  
**Critical: 5 | High: 8 | Medium: 3**

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| QA Lead | | | |

---

*Authentication Test Scripts Complete*
