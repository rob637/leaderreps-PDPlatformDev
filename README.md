# LeaderReps PD Platform

A modern, serverless Professional Development Platform built for leadership training.

## 🏗 Architecture & Tech Stack

The platform is built on a modern, high-performance stack designed for scalability and developer experience:

*   **Frontend Framework**: React 18 with Vite (Fast HMR, optimized builds).
*   **Styling**: Tailwind CSS for utility-first, responsive design.
*   **Backend**: Serverless architecture using Firebase (Auth, Firestore, Hosting).
*   **State Management**: React Context Providers (`DataProvider`, `FeatureProvider`) for clean, global state management without Redux complexity.

## 🚀 Key Features

### Dynamic Widget System ("Widget Lab")
A standout feature allowing admins to modify dashboard components at runtime.
*   **FeatureManager**: Controls widget availability and configuration.
*   **WidgetEditor**: Provides a live coding environment where admins can inject logic into a `REAL_SCOPE`, effectively acting as a frontend CMS.

### Performance
*   **Lazy Loading**: Utilizes `React.lazy` and `Suspense` via `ScreenRouter` to load screens on-demand, keeping the initial bundle size minimal.
*   **Optimized Assets**: Vite-powered build process.

### Admin Tooling
*   **DevPlanManager**: Comprehensive tool for managing the 26-week development journey.
*   **ContentManager**: Centralized management for readings, videos, and courses.
*   **Sync Capabilities**: Tools to sync local configuration (like LOVs) directly to Firestore.

## 📂 Project Structure

The codebase follows a modular, separation-of-concerns pattern:

*   `src/services/`: Encapsulates Firebase logic (e.g., `contentService.js`, `ensureUserDocs.js`), keeping UI components clean.
*   `src/hooks/`: Reusable logic (e.g., `useDevPlan`, `useNavigationHistory`).
*   `src/components/ui/`: Reusable atomic UI components.
*   `src/components/screens/`: Page-level components loaded by the router.
*   `src/components/admin/`: Administrative tools and editors.

## 🔒 Security

Security is handled via robust **Firestore Rules**:

*   **Role-Based Access**: User data is strictly locked to the owner (`request.auth.uid == userId`).
*   **Admin Privileges**: Controlled via a secure allowlist in `firestore.rules` and database metadata.
*   **Content Protection**: Public content is read-only; user artifacts are private.

## 🛠 Development

### Prerequisites
*   Node.js >= 20.x
*   npm

### Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Deploy to Firebase Hosting
npm run deploy
```

## 💡 Recommended Enhancements

### 🏗️ Architecture & Scalability

1.  **Refactor Widget Configuration (The "God Object" Fix)**
    *   **Current State:** All widget configurations are stored in a single Firestore document (`config/features`).
    *   **Risk:** Firestore documents have a 1MB limit. As you add more widgets or complex code to them, you will hit this limit, crashing the app.
    *   **Recommendation:** Migrating widgets to a subcollection (e.g., `config/features/widgets/{widgetId}`). This allows for infinite scalability and faster initial loads (only load enabled widgets).

2.  **Migrate to TypeScript**
    *   **Current State:** The project uses standard JavaScript (`.jsx`).
    *   **Benefit:** Given the complex data structures in the **Development Plan** (weeks, phases, content items) and the **Widget Lab**, TypeScript would prevent entire classes of bugs (like the `ReferenceError` we just fixed) by enforcing data shapes at compile time.

3.  **Implement Firebase Custom Claims for RBAC**
    *   **Current State:** Admin access is controlled by a hardcoded list of emails in `firestore.rules` and client-side checks.
    *   **Recommendation:** Use Firebase Authentication Custom Claims to tag users as `admin` or `editor`. This removes hardcoded emails from your security rules, makes checking permissions faster (no database lookup needed), and is more secure.

### 🛡️ Reliability & Security

4.  **Production Error Monitoring**
    *   **Recommendation:** Integrate a tool like **Sentry** or **LogRocket**.
    *   **Why:** The "Widget Lab" allows runtime code execution. If a widget crashes in production (like the `currentWeekNumber` issue), you currently rely on user reports. Automated monitoring would alert you immediately with the stack trace and user context.

5.  **Widget Versioning & Rollback UI**
    *   **Current State:** The `FeatureProvider` saves history to `widget_history`, but there is no UI to view or restore previous versions.
    *   **Recommendation:** Build a "History" tab in the **Widget Editor** that allows admins to diff changes and one-click revert to a previous working version of a widget.

### ⚡ User Experience & Performance

6.  **Optimistic UI Updates**
    *   **Current State:** Some actions (like checking off a "Daily Rep") appear to wait for the Firestore round-trip before updating the UI.
    *   **Recommendation:** Implement optimistic updates. When a user clicks a checkbox, update the UI state *immediately*, then send the request to Firebase. If it fails, revert the change and show an error. This makes the app feel instant.

7.  **Offline-First Support**
    *   **Current State:** The app has a PWA manifest, but heavy reliance on live data might break functionality offline.
    *   **Recommendation:** Explicitly configure Firestore offline persistence and add "Offline Mode" indicators. Ensure critical features like "Daily Reps" and "Readings" work on a plane or subway by caching the user's active week data.

### 💻 Developer Experience (DevOps)

8.  **CI/CD Pipeline (GitHub Actions)**
    *   **Recommendation:** Set up a GitHub Action workflow that automatically runs:
        1.  `npm run lint` (to catch syntax errors).
        2.  `npm test` (to verify logic).
        3.  `npm run build` (to ensure the build passes).
    *   **Benefit:** This prevents broken code from ever being merged to the `main` branch or deployed.

9.  **Component Documentation (Storybook)**
    *   **Current State:** You have a nice library of UI components in `src/components/ui`.
    *   **Recommendation:** Install **Storybook** to document these components in isolation. This helps ensure design consistency and makes it easier for new developers (or AI agents) to understand which buttons, cards, and inputs are available to use.

10. **Automated Testing for "Business Logic"**
    *   **Recommendation:** Expand `vitest` coverage specifically for the `useDevPlan` hook and `DevPlanManager` logic.
    *   **Why:** The logic for calculating "Current Week" based on start dates, offsets, and time travel is complex. Unit tests would ensure that edge cases (like leap years or starting mid-week) don't break the user's progress tracking.
