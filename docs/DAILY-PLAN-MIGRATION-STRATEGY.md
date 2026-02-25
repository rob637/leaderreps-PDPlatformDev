# Daily Plan Migration Strategy
## Moving from Legacy "Development Plan" to "Daily Plan" Architecture

### 1. Executive Summary
The current "Daily Plan" architecture still relies on the legacy `development_plan` Firestore document for critical user data (daily progress, assessment history, start dates). To safely remove the Legacy Plan, we must migrate this data to a new, dedicated home within the Daily Plan architecture.

### 2. Data Inventory
The following fields are currently stored in `development_plan` and must be migrated:

| Field | Purpose | New Location (Proposed) |
|-------|---------|-------------------------|
| `dailyProgress` | Tracks completion of daily tasks | `users/{userId}/daily_plan/progress` |
| `assessmentHistory` | Stores Leadership Skills Baseline results | `users/{userId}/assessments/baseline` |
| `currentAssessment` | Most recent assessment snapshot | `users/{userId}/assessments/baseline` |
| `startDate` | Program start date | `users/{userId}` (Root profile) |
| `cohortId` | User's cohort assignment | `users/{userId}` (Root profile) |
| `focusAreas` | Derived from assessment, used for gating | `users/{userId}/profile/focus_areas` |

### 3. Migration Phases

#### Phase 1: Data Structure Definition & Dual Write (Safe Start)
**Goal:** Ensure new data is saved to the new location while keeping the old system working.
1.  **Define New Schema:** Create the Firestore schema for `daily_plan` user data.
2.  **Update Write Operations:** Modify `useDailyPlan` and `BaselineAssessmentWidget` to write to **BOTH** the old `development_plan` and the new location.
    *   *Example:* When a user checks a box, update `development_plan.dailyProgress` AND `users/{uid}/daily_plan/progress`.
3.  **Verify:** Ensure data is appearing in both places.

#### Phase 2: Data Backfill (Migration Script)
**Goal:** Move existing user data to the new structure.
1.  **Create Migration Script:** A Node.js script (admin context) to:
    *   Iterate through all users.
    *   Read their `development_plan` document.
    *   Copy `dailyProgress` to the new collection.
    *   Copy `assessmentHistory` to the new collection.
    *   Ensure `startDate` and `cohortId` are set on the root user profile.
2.  **Run Migration:** Execute the script in a controlled environment (Dev first, then Prod).

#### Phase 3: Switch Read Source (The Switch)
**Goal:** Point the application to read from the new location.
1.  **Update `useDailyPlan`:** Change the data fetching logic to subscribe to the new `daily_plan` user document instead of `developmentPlanData`.
2.  **Update `useDayBasedAccessControl`:** Point the "Leadership Skills Baseline" check to the new assessment location.
3.  **Update Widgets:** Ensure `BaselineAssessmentWidget` reads from the new history.
4.  **Test:** Verify the Dashboard works without `developmentPlanData`.

#### Phase 4: Cleanup (Final Removal)
**Goal:** Remove the legacy code.
1.  **Remove Listener:** Comment out/delete the `development_plan` listener in `createAppServices.js`.
2.  **Remove Route:** Delete the `development-plan` route in `ScreenRouter.jsx`.
3.  **Delete Code:** Remove `DevPlanManager`, `useDevPlan`, and related legacy components.

### 4. Technical Implementation Details

#### Proposed New Data Structure
```javascript
// users/{userId}/daily_plan/progress
{
  completedTasks: {
    "1": { ... }, // Day 1
    "2": { ... }  // Day 2
  },
  lastUpdated: Timestamp
}

// users/{userId}/assessments/baseline
{
  history: [ ... ],
  current: { ... },
  lastUpdated: Timestamp
}
```

### 5. Rollback Plan
If issues arise during Phase 3 (Read Switch):
1.  Revert the code changes to `useDailyPlan` to point back to `developmentPlanData`.
2.  Since Phase 1 (Dual Write) is active, the old data source will still be up-to-date.

### 6. Next Steps
1.  Approve this plan.
2.  Begin Phase 1: Implement Dual Write logic.
