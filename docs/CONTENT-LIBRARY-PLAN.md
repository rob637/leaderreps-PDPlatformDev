# Content Management Library - Canonical Architecture Plan

## 1. Executive Summary & Core Principles
We are redesigning the Content Management system to serve as the "Canonical Content Model" for the Arena platform. This moves us from a siloed approach to a unified, intent-based architecture.

### Core Principles
1.  **Browse by Intent, Not Granularity:** Users browse Programs, Workouts, Skills, and Tools. They do *not* browse Exercises or Reps directly.
2.  **Unified Content Inventory:** All content lives in one central library.
3.  **Separation of Inventory vs. Delivery:** The Content Library is the *Inventory*. The Development Plan is the *Prescription Pad* that assigns inventory without duplicating it.
4.  **Reusability:** A single Workout can exist in multiple Programs. A single Tool can be attached to multiple Workouts.
5.  **Metadata-Driven Discovery:** Everything is cross-tagged by Skill, Difficulty, Time, and Role.

## 2. Data Model (Firestore Adaptation)

We will adapt the relational model into a scalable Firestore document structure.

### A. The `content_library` Collection
This is the backbone. Every piece of content is a document in this collection.

**Base Fields (All Types):**
```javascript
{
  id: "uuid",
  type: "PROGRAM" | "WORKOUT" | "EXERCISE" | "REP" | "READ_REP" | "TOOL",
  title: "String",
  slug: "String", // unique-url-friendly
  shortDescription: "String",
  longDescription: "HTML/Markdown",
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  
  // Universal Metadata
  skills: ["skill_id_1", "skill_id_2"], // Array of IDs
  primarySkill: "skill_id_1",
  difficulty: "FOUNDATION" | "PRO" | "ADVANCED",
  estimatedTimeMin: Number,
  roles: ["NEW_MANAGER", "EXECUTIVE"],
  
  // System
  createdAt: Timestamp,
  updatedAt: Timestamp,
  authorId: "user_id"
}
```

### B. Type-Specific Details (Stored in `details` object)

**1. Program (`type: PROGRAM`)**
```javascript
details: {
  durationWeeks: 4,
  pace: "1 workout/week",
  outcomeSummary: "String",
  // Ordered References
  workouts: [
    { contentId: "wkt_id_1", order: 1, required: true, notes: "Week 1 Focus" },
    { contentId: "wkt_id_2", order: 2, required: true }
  ]
}
```

**2. Workout (`type: WORKOUT`)**
```javascript
details: {
  sessionType: "COHORT" | "1:1" | "SELF_PACED",
  facilitatorNotes: "String",
  // Ordered References
  exercises: [
    { contentId: "ex_id_1", order: 1, blockLabel: "Warm-up" },
    { contentId: "ex_id_2", order: 2, blockLabel: "Main Set" }
  ],
  // Linked Resources
  relatedTools: ["tool_id_1"],
  relatedReadReps: ["rr_id_1"]
}
```

**3. Exercise (`type: EXERCISE`)**
```javascript
details: {
  exerciseType: "ROLEPLAY" | "REFLECTION" | "DRILL",
  instructions: "String",
  materials: "String",
  // Ordered References
  reps: [
    { contentId: "rep_id_1", order: 1, intensity: "MILD" },
    { contentId: "rep_id_2", order: 2, intensity: "INTENSE" }
  ]
}
```

**4. Rep (`type: REP`)**
```javascript
details: {
  prompt: "String", // The "Do This" text
  script: "String", // Example output
  reflection: "String",
  minTime: 5
}
```

**5. Read & Rep (`type: READ_REP`)**
```javascript
details: {
  author: "String",
  bookTitle: "String",
  link: "URL",
  section: "Chapter 1",
  warmup: "String"
}
```

**6. Tool (`type: TOOL`)**
```javascript
details: {
  toolType: "CHECKLIST" | "TEMPLATE" | "ASSESSMENT",
  fileUrl: "URL",
  isPrintable: true
}
```

### C. The `skills` Collection
*   `id`: "skill_feedback"
*   `name`: "Feedback"
*   `pillar`: "LEAD_PEOPLE"
*   `description`: "String"

## 3. UX/UI Architecture (Admin & User)

### Global Navigation (User View)
*   **Dashboard** (Personalized Plan)
*   **Programs** (Structured Paths)
*   **Workouts** (Training Sessions)
*   **Skills** (Capability Library)
*   **Read & Reps** (Books)
*   **Tools** (Resources)
*   *Search (Global)*

### Admin Command Center Structure
The Admin UI must mirror this mental model but allow for the "assembly" of these parts.

**1. Unified Content Manager**
*   **Sidebar Filters:** Programs, Workouts, Skills, Read & Reps, Tools.
*   **Hidden/Sub-Filters:** Exercises, Reps (accessed via Workouts or "All Content" toggle).

**2. Editors (The Assembly Line)**
*   **Program Editor:**
    *   Metadata fields.
    *   **"Workout Picker":** A modal to search/select existing Workouts to add to the sequence.
*   **Workout Editor:**
    *   Metadata fields.
    *   **"Exercise Picker":** Search/select Exercises.
    *   **"Resource Picker":** Attach Tools/Read & Reps.
*   **Exercise Editor:**
    *   **"Rep Builder":** Create Reps inline or select existing ones.

## 4. Development Plan Integration
The Development Plan is a **delivery engine**, not a content bucket.

**Collection:** `development_plans`
```javascript
{
  userId: "uid",
  status: "ACTIVE",
  blocks: [
    {
      label: "Week 1",
      startDate: Timestamp,
      // The Prescription
      assignments: [
        { contentId: "wkt_id_1", type: "WORKOUT", status: "PENDING" },
        { contentId: "tool_id_1", type: "TOOL", status: "VIEWED" },
        { contentId: "rr_id_1", type: "READ_REP", status: "COMPLETED" }
      ]
    }
  ]
}
```

## 5. Wireframes (Conceptual)

### A. Dashboard (User)
```text
---------------------------------------------------
| Welcome, Ryan                                   |
---------------------------------------------------
| THIS WEEK IN YOUR PLAN                          |
| [ Workout: Feedback Foundations ]               |
| [ 3 Required Reps ]                             |
| [ CLEAR Tool Attached ]                         |
---------------------------------------------------
| QUICK ACCESS                                    |
| [ Programs ] [ Workouts ] [ Skills ] [ Tools ]  |
---------------------------------------------------
```

### B. Single Workout View (User)
```text
---------------------------------------------------
| Feedback Workout                                |
---------------------------------------------------
| Skill: Feedback | Time: 60 min | Level: Found.  |
---------------------------------------------------
| EXERCISES                                       |
| 1. Feedback Mindset Primer                      |
| 2. Reinforcing Roleplay                         |
|    -> Rep (Mild)                                |
|    -> Rep (Moderate)                            |
---------------------------------------------------
| TOOLS                                           |
| • CLEAR Cheat Sheet                             |
---------------------------------------------------
| [ Add to Development Plan ]                     |
---------------------------------------------------
```

## 6. Implementation Roadmap

### Phase 1: Foundation (Service Layer)
1.  Create `src/services/unifiedContentService.js`.
2.  Define the `CONTENT_TYPES` enum and schema validation.
3.  Implement `getUnifiedContent`, `addUnifiedContent`, `updateUnifiedContent`.

### Phase 2: Admin UI (The Builder)
1.  Build `UnifiedContentManager.jsx` shell.
2.  Implement `ContentList` with type filtering.
3.  Create `ContentEditor` wrapper that loads specific forms based on type.
4.  Build the "Selector" components (WorkoutSelector, ExerciseSelector).

### Phase 3: User UI (The Browser)
1.  Update `App.jsx` routing to support `/programs`, `/workouts`, `/skills`, etc.
2.  Build the `ContentLibraryLayout` (Sidebar + Grid).
3.  Create detail views for each top-level type.

### Phase 4: Migration
1.  Script to migrate `content_readings` -> `content_library` (Type: READ_REP).
2.  Script to migrate `content_courses` -> `content_library` (Type: PROGRAM).

## 7. Critical Guardrails
*   **No Top-Level "Exercises" Tab:** Users never browse exercises directly.
*   **No "Misc" Category:** Everything must be a Tool, Read & Rep, or proper content type.
*   **Mandatory Skill Tagging:** All content must have at least one primary skill.
*   **Search is Global:** Search queries the entire `content_library` index.
