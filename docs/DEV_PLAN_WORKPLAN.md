# Development Plan Rebuild - Workplan

## Overview
This workplan outlines the steps to rebuild the Development Plan module ("The Heart of the App") based on the new 26-week schedule specification. The goal is to create a robust, admin-managed system that drives the user experience through weekly blocks of Content, Community, and Coaching.

## Phase 1: Data Architecture & Schema Design
**Objective:** Define the rigid data structure that will power the application.

1.  **Formalize WeekBlock Schema**:
    *   Implement the `WeekBlock` schema as defined in the specs.
    *   Ensure strict typing for `Content`, `Community`, and `Coaching` associations.
    *   Define `ReminderTemplate` structure for notification hooks.

2.  **Establish List of Values (LOVs)**:
    *   Utilize the existing `LOVManager` to define standard vocabularies.
    *   **Required LOVs**:
        *   `Program Phases` (QuickStart, Spaced Learning, etc.)
        *   `Pillars` (Lead Self, Lead Work, Lead People)
        *   `Skills` (Feedback, Trust, 1:1s, etc.)
        *   `Difficulty Levels` (Foundation, Intermediate, Advanced)
        *   `Content Types` (Workout, Read & Rep, etc.)
        *   `Community Types` (Leader Circle, etc.)
        *   `Coaching Types` (Open Gym, etc.)

3.  **Firestore Collection Strategy**:
    *   **`development_plan_v1`**: Collection to store the master plan. Documents keyed by `weekId` (e.g., `week-01`).
    *   **`user_progress`**: Sub-collection under `users` or top-level collection to track individual user status per week (unlocked, completed items, reflections).

## Phase 2: Admin Management Console
**Objective:** Empower admins to manage the plan without code changes.

1.  **Create `DevPlanManager` Component**:
    *   New tab in **Admin Command Center**.
    *   **List View**: Display all 26 weeks with status indicators (Draft/Published).
    *   **Editor View**: Comprehensive form to create/edit a `WeekBlock`.
        *   **Identity**: Title, Focus, Phase (Dropdown from LOV).
        *   **Scheduling**: Start Offset, Estimated Time.
        *   **Associations**: Dynamic list builders for Content, Community, Coaching items.
        *   **Metadata**: Multi-select for Skills and Pillars (from LOV).
        *   **Reminders**: Configuration for weekly nudges.
    *   **Navigation**: Allow admins to jump between weeks easily.
    *   **Widget Concept**: Design the editor as a self-contained module that could be reused.

2.  **Integration with LOV System**:
    *   Connect the Editor View dropdowns to the `LOVManager` data source.

## Phase 3: User State & Logic Engine
**Objective:** "The Brain" that decides what a user sees.

1.  **User Profile Updates**:
    *   Ensure every user has a `programStartDate` or `cohortId`.

2.  **Logic Engine (`useDevPlan` Hook)**:
    *   Calculate `currentWeekNumber` based on `programStartDate` vs `today`.
    *   Fetch the specific `WeekBlock` for that number.
    *   Handle "Time Travel" overrides for testing (already supported by `TimeTraveler` widget).
    *   Determine `isUnlocked` and `isActive` status.

## Phase 4: Dashboard & Widget Implementation
**Objective:** The user-facing experience.

1.  **Rebuild `PlanTracker` Screen**:
    *   Update the main Development Plan screen to render the *dynamic* `WeekBlock` data.
    *   Display the 3 pillars (Content, Community, Coaching) clearly.
    *   Implement "Mark Complete" logic for individual items.
    *   Integrate Reflection prompts.
    *   **Navigation**: Add "Previous Week" / "Next Week" buttons.
        *   *Constraint*: Only the *current* week (or past weeks) can be updated. Future weeks are read-only previews.

2.  **Update Dashboard Widget**:
    *   Enhance the `development-plan` widget to show a summary of the *current* week's focus and progress.
    *   Ensure it links deep into the full `PlanTracker` view.

3.  **Locker Integration**:
    *   Update Locker Controller to display the correct "Week X" status.

## Phase 5: Data Migration & Seeding
**Objective:** Populate the first 8 weeks.

1.  **Seed Script / Manual Entry**:
    *   Input the data from the provided spreadsheets (Weeks 1-8) into the new system.
    *   Verify all Content/Community/Coaching IDs match existing system resources.

## Execution Order
1.  **Setup LOVs**: Create the necessary lists in Admin.
2.  **Build Admin Manager**: Create the tool to input the data.
3.  **Input Data**: Enter the first 8 weeks.
4.  **Build Logic Engine**: Connect user state to the data.
5.  **Update UI**: Revamp the Dashboard and Plan views.

---
*Ready to proceed with Phase 1 & 2.*
