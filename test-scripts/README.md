# 📋 LeaderReps Manual Test Scripts

> **Comprehensive User Scenario Test Scripts**  
> *Version 1.0 | January 2026*

This folder contains executable manual test scripts for the LeaderReps PD Platform.

## 📁 Folder Structure

```
test-scripts/
├── README.md                    # This file
├── 00-smoke-test.md            # Critical path (36 scenarios) - run every deployment
├── 01-prep-phase/              # Prep Phase tests (18 scenarios)
│   ├── PREP-001-new-user-registration.md
│   ├── PREP-002-quick-start-accelerator.md
│   └── ...
├── 02-dev-phase/               # Dev Phase tests (131 scenarios)
│   ├── am-bookend/
│   ├── pm-bookend/
│   ├── scorecard-streak/
│   ├── content-library/
│   ├── community/
│   ├── coaching/
│   └── locker/
├── 03-post-phase/              # Post Phase tests (9 scenarios)
├── 04-cross-cutting/           # Auth, Nav, Errors, Responsive (73 scenarios)
└── execution-log.md            # Track test executions
```

## 🚀 Quick Start

### Run the Smoke Test
Before any deployment, execute `00-smoke-test.md` (~3-4 hours):
1. Open the smoke test file
2. Follow each scenario step-by-step
3. Mark PASS/FAIL for each step
4. Log any bugs in GitHub Issues with label `bug/smoke-test`

### Full Regression
Run all scripts (~16-20 hours) before major releases.

## 📊 Test Execution Workflow

1. **Prepare Environment**
   - Clear browser cache
   - Use TEST environment: https://leaderreps-test.web.app
   - Reset Time Travel to current date

2. **Execute Scripts**
   - Follow steps exactly as written
   - Take screenshots on failures
   - Note any deviations

3. **Log Results**
   - Update `execution-log.md` with results
   - Create GitHub Issues for failures
   - Get sign-off from QA Lead

## 🏷️ GitHub Issue Labels for Bugs

```
bug/critical    - System unusable
bug/high        - Major feature broken
bug/medium      - Feature impaired
bug/low         - Minor/cosmetic

area/prep       - Prep Phase
area/dev        - Dev Phase  
area/post       - Post Phase
area/auth       - Authentication
area/content    - Content Library
area/nav        - Navigation

status/new      - Just reported
status/confirmed - Reproduced
status/fixed    - Fix deployed
status/verified - Fix verified
```

## 📝 Test Script Format

Each test script follows this structure:

```
# TS-XXX-NNN: Test Name

## Metadata
- Priority: Critical/High/Medium/Low
- Estimated Time: X minutes
- Prerequisites: [List]

## Setup
1. Step-by-step setup instructions

## Test Steps
| Step | Action | Expected Result | Pass/Fail |
|------|--------|-----------------|-----------|
| 1    | Do X   | Y happens       | [ ]       |

## Execution Log
| Date | Tester | Environment | Result | Bugs |
|------|--------|-------------|--------|------|

## Sign-Off
- Tester: _________________ Date: _______
- QA Lead: ________________ Date: _______
```

---

*For full requirements, see [TEST-SCRIPT-REQUIREMENTS.md](../TEST-SCRIPT-REQUIREMENTS.md)*
