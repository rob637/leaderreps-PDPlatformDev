# Day-by-Day Architecture: Work Instructions

This document provides instructions on how to manage and use the new Day-by-Day functionality in the LeaderReps platform.

## 1. Overview

The platform has shifted from a week-based model to a **Day-by-Day** model.
- **Prep Phase (Days -14 to -1)**: Users prepare for the program.
- **Core Program (Days 1 to 70)**: Content unlocks daily based on the user's cohort start date.
- **Post-Program (Day 71+)**: Free trial / alumni phase.

---

## 2. For Administrators

### A. Managing Cohorts
*Cohorts are groups of users who start the program on the same day.*

1.  Navigate to **Admin Portal** > **Management** > **Cohorts**.
2.  **Create a Cohort**:
    - Click **New Cohort**.
    - Enter a Name (e.g., "January 2026 Alpha").
    - Select a **Start Date**. This date corresponds to **Day 1** of the program.
    - Click **Save**.
3.  **Assign Users**:
    - Click the **User Plus** icon on a cohort card.
    - Search for users by name or email.
    - Select users to add them to the cohort.
    - Click **Save Assignments**.
    - *Note: This will automatically update the user's `startDate` to match the cohort.*

### B. Managing the Daily Plan
*The Daily Plan defines what happens on each specific day of the journey.*

1.  Navigate to **Admin Portal** > **Management** > **Daily Plan (New)**.
2.  **Navigation**:
    - Use the Week Selector (top right) to jump between weeks (Prep Phase, Week 1, Week 2, etc.).
3.  **Editing a Day**:
    - Click on any Day Card to open the **Day Editor**.
    - **Title & Focus**: Set the theme for the day.
    - **Is Weekend**: Check this to mark it as a rest day (lighter content).
    - **Actions & Reps**:
        - Add "Daily Reps" (checkbox items for the user).
        - Use **Propagate** to copy actions to all weekdays (Mon-Fri) of the current week.
    - **Unlocked Content**:
        - Click **Add** to select content from the library (Courses, Readings, Media).
        - Any content added here will **unlock** for the user on this day.
    - **Dashboard Widgets**:
        - Toggle which widgets appear on the user's dashboard for this specific day.
        - *Example: Turn off "Win The Day" during the Prep Phase.*
4.  **Saving**: Click the **Save** icon in the top right of the editor.

---

## 3. For Users (The Experience)

### A. The Prep Gate
- When a user first joins, if they have not completed their **Leader Profile** or **Leadership Skills Baseline**, they will see a "Prep Gate" on their dashboard.
- They **cannot** access Day 1 content until these items are complete.

### B. Daily Unlocking
- Once the Prep Gate is passed:
    - If today is **before** their Cohort Start Date, they are in the **Prep Phase** (Day -14 to -1).
    - If today is **on or after** their Cohort Start Date, they are in the **Core Program**.
- Content unlocks automatically at midnight.

### C. Catch Up Mode
- If a user misses a day (doesn't log in or complete actions), it is marked as "Missed".
- A **"Catch Up"** alert will appear on their dashboard.
- Clicking it opens a modal showing all missed days and allowing them to complete key actions without navigating back in time.

---

## 4. Troubleshooting & Testing

### Time Travel (For Testing)
1.  Go to **Admin Portal** > **Engineering** > **Test Center**.
2.  Use the **Time Travel** widget to simulate different dates.
    - *Example: Set date to Cohort Start Date + 5 days to see Day 6 content.*
3.  Click **Reset** to return to real time.

### Common Issues
- **User stuck on Day 1**: Check if they are assigned to a Cohort with a future start date.
- **Content not unlocking**: Ensure the content item is added to the specific Day in the Daily Plan Manager.
