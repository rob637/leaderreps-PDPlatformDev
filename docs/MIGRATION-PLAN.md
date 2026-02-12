# Application Data Migration Plan

## Executive Summary
The capability to migrate application data (Content, Configuration, Plans) between environments (Dev -> Test -> Prod) is **already built** into the platform. This plan outlines the steps to **enable** and **operationalize** this capability by configuring the necessary security credentials and establishing a standard promotion workflow.

## 1. Current Capabilities
The platform includes a robust migration tool (`scripts/migrate-app-data.js`) that:
*   **Selectively Migrates**: Moves "Application Data" (Content, LOVs, Dev Plans) while preserving "User Data" (Profiles, Progress) in the target environment.
*   **Supports Environments**: Configured for Dev, Test, and Production.
*   **Automated Commands**: Integrated into `package.json` as `npm run data:export` and `npm run data:import`.

## 2. Implementation Plan

### Phase 1: Security Configuration (Immediate)
**Objective**: Enable the migration scripts to authenticate with Firebase.

1.  **Generate Service Accounts**:
    *   Go to [Firebase Console > Project Settings > Service Accounts](https://console.firebase.google.com/project/leaderreps-pd-platform/settings/serviceaccounts/adminsdk) for **DEV**.
    *   Click "Generate new private key".
    *   Rename the file to: `leaderreps-pd-platform-firebase-adminsdk.json`.
    *   Repeat for **TEST** project (`leaderreps-test`), renaming to: `leaderreps-test-firebase-adminsdk.json`.
    *   *(Future)* Repeat for **PROD**.

2.  **Secure the Repository**:
    *   **Action Taken**: The `.gitignore` file has been updated to exclude `*-firebase-adminsdk.json` to prevent accidental commits.
    *   **Task**: Place the downloaded JSON files in the **root** of the workspace.

### Phase 2: Verification (Dry Run)
**Objective**: Confirm the export process works without affecting data.

1.  **Run Export**:
    ```bash
    npm run data:export dev
    ```
2.  **Verify Output**:
    *   Check the `./data-exports/` directory.
    *   Confirm a JSON file exists (e.g., `app-data-dev-YYYY-MM-DD.json`).
    *   Inspect the file to ensure it contains `development_plan_v1`, `content_readings`, etc., but **NOT** `users`.

### Phase 3: Execution (Promotion to Test)
**Objective**: Promote the latest Dev content to the Test environment.

1.  **Run Import**:
    ```bash
    # Replace with your actual export filename
    npm run data:import test ./data-exports/app-data-dev-2025-12-12.json
    ```
2.  **Verify in Test**:
    *   Log in to the Test environment app.
    *   Verify the new content (e.g., new readings, updated 26-week plan) is visible.
    *   Verify existing test users are still intact.

## 3. Standard Operating Procedure (SOP)

### When to Migrate
*   **Weekly**: After the "Content Freeze" on Fridays, promote Dev content to Test for QA.
*   **Ad-Hoc**: When a critical configuration change (e.g., Feature Flag) is needed for testing.

### The Workflow
1.  **Developer**: Commits changes and verifies in Dev.
2.  **Release Manager**:
    *   Runs `npm run data:export dev`.
    *   Runs `npm run data:import test <file>`.
3.  **QA**: Validates in Test.
4.  **Release Manager**:
    *   Runs `npm run data:import prod <file>` (Once Prod is live).

## 4. Future Automation (CI/CD)
To fully automate this in GitHub Actions:
1.  **Secrets**: Store the contents of the JSON key files as GitHub Secrets (e.g., `FIREBASE_SERVICE_ACCOUNT_DEV`).
2.  **Workflow**: Create a `.github/workflows/promote-content.yml` that:
    *   Writes the secret to a file during the build.
    *   Runs the `data:export` and `data:import` commands.
    *   Deletes the key file.

---
*See `DATA-MIGRATION-GUIDE.md` for technical details on collection mappings.*
