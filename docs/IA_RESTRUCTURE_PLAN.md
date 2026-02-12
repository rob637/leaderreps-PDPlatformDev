# 🏗️ Information Architecture Restructure Plan

This document outlines the strategic plan to transition LeaderReps from a "Format-Based" architecture (Videos, Readings, etc.) to an "Intent-Based" architecture (Programs, Workouts, Skills, etc.), as requested.

---

## 1. Executive Summary

**Current State:**
- Content is siloed by file type (`content_videos`, `content_readings`).
- Navigation is mixed (Dashboard, Locker, Library, various feature labs).
- "Coaching" and "Content" are somewhat intertwined.
- The "Vault & Key" concept exists but is implemented with format-specific collections.

**Target State:**
- **Unified Content Library:** Organized by User Intent (Programs, Workouts, Skills, Read & Reps, Tools).
- **Hierarchy:** Programs → Workouts → Exercises → Reps.
- **Coaching Hub:** Distinct from Content. Organized by Time & Access (Live, On-Demand, My Coaching).
- **Development Plan:** A delivery engine that references the Content Library, not a content bucket itself.

---

## 2. Data Architecture Strategy

### A. The Unified `content` Collection
We will move away from separate collections (`content_videos`, `content_readings`) to a single, polymorphic `content` collection in Firestore.

**New Schema (`content` collection):**
```javascript
{
  id: "uuid",
  type: "PROGRAM" | "WORKOUT" | "EXERCISE" | "REP" | "READ_REP" | "TOOL",
  title: "String",
  slug: "String", // for URLs
  description: "String",
  
  // Metadata (Polymorphic)
  metadata: {
    // For Workouts
    durationMin: 60,
    difficulty: "FOUNDATION",
    
    // For Read & Reps
    bookAuthor: "String",
    
    // For Tools
    fileUrl: "String",
    toolType: "CHECKLIST"
  },
  
  // Relationships (Denormalized for read performance or separate collections)
  linkedSkills: ["skill_id_1", "skill_id_2"],
  
  // Status
  status: "PUBLISHED" | "DRAFT"
}
```

### B. Relationship Management
Since Firestore is NoSQL, we have two options for the hierarchy (Program -> Workout -> Exercise). We will use a **hybrid approach**:
1.  **Top-Level Documents:** Programs and Workouts are top-level documents.
2.  **References:** A Program document contains an array of Workout IDs (ordered). A Workout document contains an array of Exercise IDs.
3.  **Sub-collections (Optional):** For tight coupling (like Reps inside an Exercise), we might use sub-collections, but top-level is more flexible for reuse.

### C. The `coaching_sessions` Collection
Distinct from content.
```javascript
{
  id: "uuid",
  title: "Open Gym: Feedback",
  startTime: Timestamp,
  endTime: Timestamp,
  type: "OPEN_GYM" | "LEADER_CIRCLE",
  
  // The Link to Content
  linkedContentId: "workout_id_123", // Optional: The workout being taught
  
  coachId: "user_id",
  attendeeIds: ["user_id_1", "user_id_2"]
}
```

---

## 3. Frontend Architecture Strategy

### A. Navigation Overhaul (`ArenaSidebar.jsx`)
We will restructure the main navigation to match the "Clean Final Structure":
1.  **Dashboard**
2.  **Development Plan**
3.  **Programs** (New)
4.  **Workouts** (New)
5.  **Skills** (New)
6.  **Read & Reps** (New)
7.  **Tools** (New)
8.  **Coaching** (New Hub)

### B. New Screen Components (`src/components/screens/library/`)
We will create a new directory for the Intent-Based Library views:
- `ProgramsIndex.jsx` & `ProgramDetail.jsx`
- `WorkoutsIndex.jsx` & `WorkoutDetail.jsx`
- `SkillsIndex.jsx` & `SkillDetail.jsx`
- `ReadRepsIndex.jsx`
- `ToolsIndex.jsx`

### C. Coaching Hub Components (`src/components/screens/coaching/`)
- `CoachingHome.jsx`
- `LiveCalendar.jsx`
- `MyCoaching.jsx`

---

## 4. Migration Plan (Phased Approach)

### Phase 1: Foundation (Data Model)
1.  **Create Schema Definitions:** Define the Zod schemas or JSDoc types for the new `content` types.
2.  **Migration Script:** Write a script to read existing `content_videos` and `content_readings` and "upgrade" them into the new `content` collection with the correct `type` (e.g., a video becomes a `WORKOUT` or `TOOL` depending on context, or remains a raw resource referenced by a Workout).
    *   *Note:* We might keep raw assets (videos/pdfs) in a `resources` collection and have `content` items (Workouts/Tools) reference them.

### Phase 2: UI Skeleton (Navigation & Routing)
1.  **Update Router:** Add routes for `programs`, `workouts`, `skills`, etc., in `ScreenRouter.jsx`.
2.  **Update Sidebar:** Modify `ArenaSidebar.jsx` to reflect the new IA.
3.  **Create Placeholders:** Create the basic "Index" pages for each new section to verify navigation flow.

### Phase 3: Feature Implementation (The Views)
1.  **Implement "Workouts" View:** This is the "Gym Floor". It needs filtering by Skill, Time, Level.
2.  **Implement "Programs" View:** The structured paths.
3.  **Implement "Skills" View:** The pivot table view.

### Phase 4: Development Plan Integration
1.  **Update WeekBlock:** Ensure the Development Plan can render these new content types.
2.  **"Add to Plan" Feature:** Allow users to browse the library and add a Workout to their plan (if self-directed).

---

## 5. Immediate Next Steps (Action Items)

1.  **Approve this Plan:** Confirm this aligns with the vision.
2.  **Scaffold the UI:** I can immediately update the Sidebar and create the placeholder screens so you can "feel" the new navigation.
3.  **Data Migration:** I will write a script to map your current content to this new structure.

**Shall I proceed with Phase 2 (UI Skeleton) to give you a visual prototype of the new structure?**
