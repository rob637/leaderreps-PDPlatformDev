# 🏛️ Resource Library Architecture & Workplan

## 🎯 Objective
Create a unified, widget-driven system for Super Admins to manage Content, Community, and Coaching artifacts (MP4, PDF, Google Docs) and link them to the Development Plan. These resources should only be visible to users when unlocked by their current week in the plan.

## 🏗️ Architectural Concept: "The Vault & The Key"

We will separate the **Storage** of resources from the **Scheduling** of resources.

1.  **The Vault (Resource Library):** A centralized repository for all artifacts.
    *   **Collections:** `resources` (or utilizing existing `content_readings`, `content_videos` with enhanced metadata).
    *   **Artifact Types:**
        *   🎥 **Video:** MP4 (Hosted in Firebase Storage) or URL (Vimeo/YouTube).
        *   📄 **Document:** PDF (Hosted in Firebase Storage).
        *   🔗 **Link:** Google Doc/Sheet/Slide URL.
    *   **Metadata:** Title, Description, Thumbnail, Type, Duration/Read Time.

2.  **The Key (Development Plan Linkage):**
    *   The Development Plan (`development_plan_v1`) will no longer just have text labels.
    *   Items in `content`, `community`, `coaching` arrays will have a `resourceId` field pointing to "The Vault".

3.  **The Gatekeeper (Access Control):**
    *   **Dashboard Widget:** Checks `currentWeek` -> displays linked resources.
    *   **Library Pages:** Filter the Vault: `Show Resource IF (Resource.linkedWeek <= User.currentWeek)`.

---

## 🛠️ Workplan

### Phase 1: The Vault (Backend & Admin)
**Goal:** Allow Super Admins to upload and manage files.

1.  **Enhance `ContentManager.jsx`:**
    *   Add **File Upload** capability using Firebase Storage (currently only supports URLs).
    *   Support drag-and-drop for MP4s and PDFs.
    *   Auto-generate or allow upload of thumbnails.
    *   Add a "Resource Type" selector (Video, PDF, External Link).

2.  **Unified Resource Service:**
    *   Update `contentService.js` to handle file uploads and storage references.

### Phase 2: The Key (Dev Plan Integration)
**Goal:** Link resources to the Weekly Plan.

1.  **Update `DevPlanManager.jsx`:**
    *   In the "Edit Week" modal, for Content/Community/Coaching items:
    *   Replace the simple text input with a **"Smart Resource Selector"**.
    *   **Selector Features:**
        *   Search/Filter the "Vault".
        *   "Create New" shortcut (opens mini-upload modal).
        *   Preview selected resource.
    *   Store `resourceId`, `resourceType`, and `resourceThumbnail` in the plan item.

### Phase 3: The Display (User Experience)
**Goal:** Beautiful, widget-driven consumption.

1.  **Smart Widget (`DevelopmentPlanWidget.jsx`):**
    *   Update the item list rendering.
    *   If an item has a `resourceId`:
        *   Show a "Play" (Video) or "Read" (PDF/Doc) icon.
        *   **Click Action:** Open the **Universal Resource Viewer**.

2.  **Universal Resource Viewer (Component):**
    *   A slick Modal/Overlay component.
    *   **Video:** Embedded Player (custom controls, progress tracking).
    *   **PDF:** Embedded PDF Viewer.
    *   **Google Doc:** Opens in a new tab (or embedded iframe if permissions allow).

3.  **Notifications:**
    *   Update `Notifications` widget (already done!) to ensure it deep-links to the viewer when a new resource is unlocked.

### Phase 4: The Library (Archives)
**Goal:** "Show me everything I've unlocked."

1.  **Update Destination Pages:**
    *   **Content (Readings/Videos):**
        *   `LeadershipVideos.jsx` (Videos)
        *   `BusinessReadings.jsx` (PDFs/Docs)
        *   `Library.jsx` (Central Hub)
    *   **Community:**
        *   `CommunityScreen.jsx` (Community artifacts/links)
    *   **Coaching:**
        *   `CoachingLabScreen.jsx` (Coaching resources)

2.  **Logic Update:**
    *   Change the data fetching logic in these screens.
    *   Instead of showing *all* content, show:
        *   **Global Content:** (Always visible, generic).
        *   **Unlocked Content:** (Items from the Dev Plan where `week <= currentWeek`).
    *   Add a "New" badge for items unlocked this week.

---

## 💡 The "Nifty" Features (Bonus)
*   **"Admin Preview Mode":** In the Admin Portal, let the admin "View as Week X" to verify exactly what a user sees.
*   **Progress Tracking:** For Videos/PDFs, track if the user actually opened/finished them (store in `user_progress`).
*   **Confetti Unlock:** When a user logs in on a new week, show a "New Resources Unlocked" celebration modal.

## 📝 Next Steps
1.  Approve this architecture.
2.  I will begin with **Phase 1: Enhancing the Content Manager with File Uploads**.
