# Day-by-Day Architecture & Migration Workplan

## Executive Summary
This document outlines the technical strategy to shift the LeaderReps platform from a **Week-Based** content release model to a **Day-by-Day** model. This change enables precise control over the user journey, supports a "Prep Phase" (negative days), and aligns content delivery with a daily schedule defined in the `8-week.csv` master plan.

## 1. Core Concepts

### 1.1. The "Day" as the Atomic Unit
- **Current:** Content unlocks by `weekNumber` (1-26).
- **New:** Content unlocks by `dayNumber` (relative to Start Date).
- **Range:** Supports negative days (e.g., Day -14 to -1) for Prep Work and positive days (Day 1 to 71+) for the Core Program.

### 1.2. Cohort-Based Timing
- **Cohort Entity:** A group of users sharing a common `startDate`.
- **Synchronization:** All users in a cohort are on the same "System Day" regardless of when they log in.
- **Calculation:** `Current Day = floor((Today - CohortStartDate) / 1 Day)`

### 1.3. Lock & Key Evolution
- **Granularity:** Unlocking happens daily at 00:00 local time (or server time).
- **Scope:**
    - **Prep Phase:** Unlocks "Leader Profile", "Leadership Skills Baseline", "Pre-workbooks".
    - **Core Phase:** Unlocks "Daily Reps", "Weekly Focus", "Content", "Media".

---

## 2. Data Architecture Changes

### 2.1. Firestore Schema Updates

#### A. New Collection: `daily_plan_v1`
Replaces (or augments) `development_plan_v1`.
```json
{
  "dayNumber": 1,          // Integer: -14, -1, 1, 5, etc.
  "weekNumber": 1,         // Reference to the parent week (for grouping)
  "title": "Start Week 1", // From CSV "Desc/Notes"
  "focus": "Delivering CLEAR Feedback", // From CSV "Weekly Focus"
  "actions": [             // From CSV "This Week's Actions" / "Daily Reps"
    { "id": "action-1", "type": "daily_rep", "label": "Strive for 5" },
    { "id": "action-2", "type": "workout", "label": "Workout S1" }
  ],
  "content": [             // From CSV "Content"
    { "id": "course-1", "type": "course", "title": "QS S1 Workbook" }
  ],
  "dashboard": {           // Dashboard configuration for this day
    "showWinTheDay": true,
    "showDailyReps": true
  }
}
```

#### B. New Collection: `cohorts`
To manage groups of users.
```json
{
  "id": "cohort-jan-2026",
  "name": "January 2026 Alpha",
  "startDate": "2026-01-01T00:00:00Z",
  "memberIds": ["user1", "user2"]
}
```

#### C. User Document Updates (`users/{userId}`)
```json
{
  "cohortId": "cohort-jan-2026", // Link to cohort
  "startDate": "2026-01-01T00:00:00Z", // Denormalized for easy access (or override)
  "dailyProgress": {
    "day-1": {
      "completedItems": ["action-1"],
      "status": "completed"
    }
  }
}
```

---

## 3. Migration Strategy

### 3.1. CSV Ingestion Script
Create a script `scripts/import-daily-plan.js` to parse `8-week.csv` and populate `daily_plan_v1`.
- **Mapping:**
    - `Sys Day` (1-71) & `Week:Day` (-14 to -1) -> `dayNumber`
    - `Desc/Notes` -> `title`
    - `Weekly Focus` -> `focus`
    - `Content` columns -> `content` array (requires lookup of Resource IDs)

### 3.2. User Data Migration
- Assign existing users to a "Legacy Cohort" or set their `startDate` to preserve their current progress.
- Convert `weekProgress` to `dailyProgress` (optional, or keep parallel during transition).

---

## 4. Implementation Steps

### Phase 1: Foundation (Backend & Hooks)
1.  **Implement `useDailyPlan` Hook:**
    -   Clone/Refactor `useDevPlan`.
    -   Implement `currentDay` calculation: `floor((Now - StartDate) / 86400000)`.
    -   Handle negative days logic.
    -   **Hybrid Pacing Logic:**
        -   Calculate `unlockedDay` (based on time).
        -   Calculate `completedDay` (based on user progress).
        -   Expose `missedDays` array (days < `unlockedDay` that are not `completed`).

### Phase 2: Dashboard & UI
1.  **Dashboard Redesign:**
    -   Replace "Current Week" header with "Day X: [Title]".
    -   Show "Today's Focus" and "Today's Actions".
    -   Display "Prep Work" section if `currentDay < 1`.
    -   **Catch Up Mode:**
        -   If `missedDays.length > 0`, show a "Catch Up" alert/section.
        -   Allow users to jump to missed days without losing access to "Today".
    -   **Weekend/Rest Day Styling:**
        -   Visual distinction for Days 6 & 7 (e.g., softer colors, "Rest & Reflect" badge).
    -   **Widget Refactoring:**
        -   `ThisWeeksActionsWidget` -> `DailyActionsWidget` (pulls from `daily_plan_v1`).
        -   `WinTheDayWidget`: Ensure it saves data keyed by `YYYY-MM-DD` (already likely does, but verify).
        -   `PMReflectionWidget`: Ensure it saves data keyed by `YYYY-MM-DD`.
2.  **Timeline/Calendar View:**
    -   Create a view to see the 8-week journey.
    -   Visual distinction between "Past" (Completed), "Present" (Active), "Future" (Locked).

### Phase 3: Cohort Management
1.  **Admin Interface:**
    -   Create "Cohort Manager" in Admin Panel.
    -   Ability to create Cohort, set Start Date, and add Users.
2.  **User Onboarding:**
    -   When a user registers, assign them to an upcoming Cohort.

### Phase 4: Admin Command Center Updates
*Crucial for long-term management without developer intervention.*

1.  **New Tool: `DailyPlanManager.jsx`**
    -   **Week View Editing:** Although data is daily, provide a "Week View" to see 7 days at once.
    -   **Drag & Drop:** Move content between days easily.
    -   **Propagate Feature:** "Apply this Daily Rep to Mon-Fri" button.
    -   **Edit:** Click a day to edit its Title, Focus, Daily Reps, and Content.
    -   **Integration:**
        -   **Daily Reps:** Select from `DailyRepsLibrary`.
        -   **Content:** Select from `UnifiedContentManager` / `ContentManager`.
        -   **Widgets:** Toggle visibility of widgets (Win The Day, PM Reflection) per day.
2.  **Update `DevPlanManager.jsx`:**
    -   Deprecate or refactor to be a "Week Grouper" for the daily plan (e.g., setting the theme for the week).
3.  **Cohort Manager:**
    -   New tab in Admin Portal.
    -   Create/Edit Cohorts (Name, Start Date).
    -   View/Move Users between cohorts.

---

## 5. Testing Strategy

### 5.1. Time Travel Testing
-   Update the "Time Travel" debug tool to jump by **Days** instead of Weeks.
-   Verify:
    -   Set time to `StartDate - 14 days`: Verify Prep content is visible.
    -   Set time to `StartDate + 0 days` (Day 1): Verify Week 1 content unlocks.
    -   Set time to `StartDate + 8 days` (Day 9): Verify Week 2 content unlocks.

### 5.2. Cohort Sync
-   Create two test users in the same cohort.
-   Verify they see the exact same content on the same real-world day.

---

## 6. Questions for Discussion
1.  **Prep Phase Access:** Should Prep content be available *immediately* upon signup, or only 14 days before start? (Recommendation: Immediately available, but "due" by Day 1).
2.  **Missed Days:** If a user misses Day 5, can they do it on Day 6? (Recommendation: Yes, "Catch Up" mode, but Day 6 content also unlocks).
3.  **Weekends:** The CSV includes 7 days/week. Is content lighter on weekends? (CSV shows "Available - prompt/remind" but fewer specific actions).

