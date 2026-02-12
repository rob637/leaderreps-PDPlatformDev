md
# Application Architecture & File Map

This document provides a comprehensive map of the LeaderReps application codebase, detailing the purpose and location of key files and directories. It is designed to help developers and the Kaizen AI understand the system structure.

## 1. Core Application Entry Points

| File | Location | Purpose |
|------|----------|---------|
| `main.jsx` | `src/main.jsx` | The application entry point. Mounts the React app, initializes providers (Auth, Router, Feature), and handles global error boundaries. |
| `App.jsx` | `src/App.jsx` | The root component. Sets up the main routing structure, layout wrappers, and global context providers. |
| `index.html` | `/index.html` | The main HTML template. Contains the root div for React and global meta tags. |
| `vite.config.mjs` | `/vite.config.mjs` | Configuration for the Vite build tool, including plugins, aliases, and build settings. Includes `VISUALIZE` and `DEBUG` options for build analysis. |

## 2. Configuration & Environment

| File | Location | Purpose |
|------|----------|---------|
| `firebaseConfig.js` | `src/config/firebaseConfig.js` | Initializes the Firebase app and exports auth, firestore, storage, and functions instances. Handles environment-specific config (Dev vs Test vs Prod). |
| `widgetTemplates.js` | `src/config/widgetTemplates.js` | **CRITICAL**. Defines the templates for the dynamic widget system. Contains the code strings for widgets, including AM Bookend Header and Weekly Focus, with logic for dynamic content and user interaction. |
| `zoneConfig.js` | `src/config/zoneConfig.js` | Defines the layout zones (e.g., Dashboard, Locker, Community) and which widgets are allowed in each. |
| `tailwind.config.cjs` | `/tailwind.config.cjs` | Configuration for Tailwind CSS, including custom colors, fonts, and theme extensions. |

## 3. State Management & Services

The application uses a Service-Oriented Architecture (SOA) pattern injected via React Context.

| File | Location | Purpose |
|------|----------|---------|
| `useAppServices.jsx` | `src/services/useAppServices.jsx` | The main hook for accessing application services. Exposes `db`, `auth`, `user`, and domain-specific helpers. |
| `createAppServices.js` | `src/services/createAppServices.js` | Factory function that instantiates all service objects (Content, User, DailyLog, etc.) and binds them to the Firebase instance. |
| `contentService.js` | `src/services/contentService.js` | Manages fetching and filtering of content (Readings, Videos, Courses) from Firestore. |
| `dailyLogService.js` | `src/services/dailyLogService.js` | Handles the logic for daily user logs, including "Win the Day", reflections, and habit tracking. |
| `FeatureProvider.jsx` | `src/providers/FeatureProvider.jsx` | Manages the state of widgets (enabled/disabled, order, settings) for the current user. |
| `NavigationProvider.jsx` | `src/providers/NavigationProvider.jsx` | Provides navigation context and manages navigation parameters using the `useNavigation` hook. |

## 4. Component Structure

### 4.1 Admin Portal (`src/components/admin/`)
| File | Purpose |
|------|---------|
| `AdminPortal.jsx` | The main layout and router for the Admin interface. Manages admin authentication and displays different admin sections based on user role. |
| `AdminDashboard.jsx` | Displays key metrics and system overview for administrators. |
| `FeatureManager.jsx` | The "Widget Manager". Allows admins to enable/disable widgets, reorder them, and edit their settings/documentation. |
| `DocumentationCenter.jsx` | The hub for viewing and updating system documentation (Admin Guide, User Guide, Architecture). Includes the Kaizen AI updater. |
| `ContentAdminHome.jsx` | Interface for managing the Content Library (uploading videos, creating articles). |
| `MediaLibrary.jsx` | Component for managing media assets (images, videos, etc.) in the application. |
| `UserManagement.jsx` | Interface for viewing and managing user accounts and permissions. |
| `SystemDiagnostics.jsx` | Provides system health and diagnostic information. |
| `SystemWidgets.jsx` | Manages system-wide widgets and settings. |
| `TestCenter.jsx` | Allows administrators to run system tests and monitor results. |
| `CommunityManager.jsx` | Manages community-related features and content. |
| `CoachingManager.jsx` | Manages coaching programs and user assignments. |
| `LOVManager.jsx` | Manages List of Values (LOV) used throughout the application. |
| `DailyRepsLibrary.jsx` | Manages the library of Daily Reps content. |
| `DailyPlanManager.jsx` | Manages the structure and content of Daily Plans. |
| `CohortManager.jsx` | Manages user cohorts and group assignments. |
| `LeaderProfileReports.jsx` | Generates reports on leader profiles and progress. |
| `NotificationManager.jsx` | Manages application notifications and alerts. |

### 4.2 Widgets (`src/components/widgets/`)
Contains the React components for complex widgets. Simple widgets are defined as strings in `widgetTemplates.js`.
| File | Purpose |
|------|---------|
| `WinTheDayWidget.jsx` | The interactive "Win the Day" tracker. |
| `DevelopmentPlanWidget.jsx` | Displays the user's current weekly development plan. |
| `ThisWeeksActionsWidget.jsx` | Shows the checklist of actions for the current week. |

### 4.3 Screens (`src/components/screens/`)
| Directory | Purpose |
|-----------|---------|
| `dashboard/` | The main user dashboard. Contains `Dashboard.jsx` which renders the widget grid. |
| `locker/` | The user's personal "Locker" (Profile, History, Settings). |
| `developmentplan/` | The full Development Plan interface. |
| `community/` | Community feeds, discussions, and events. |

## 5. Backend & Cloud Functions

| File | Location | Purpose |
|------|----------|---------|
| `firestore.rules` | `/firestore.rules` | Security rules for the Firestore database. Defines who can read/write to which collections. |
| `storage.rules` | `/storage.rules` | Security rules for Firebase Storage (user uploads, content assets). |
| `functions/index.js` | `functions/index.js` | Firebase Cloud Functions. Handles backend logic like user creation triggers, daily rollovers, and notifications. |

## 6. Scripts & Automation

| File | Location | Purpose |
|------|----------|---------|
| `deploy-dev.sh` | `/deploy-dev.sh` | Script to build and deploy the application to the Development environment. |
| `deploy-test.sh` | `/deploy-test.sh` | Script to build and deploy to the Test environment. |
| `sync-dev-to-test.sh` | `/sync-dev-to-test.sh` | Script to sync data from the development environment to the test environment. |
| `scripts/ui-architecture-check.sh` | `/scripts/ui-architecture-check.sh` | Script to lint and validate the UI architecture. |
| `scripts/migrate-app-data.cjs` | `/scripts/migrate-app-data.cjs` | Node script for exporting and importing app data. |
| `scripts/cleanup-test-users.cjs` | `/scripts/cleanup-test-users.cjs` | Node script for cleaning up test users in development and test environments. |

## 7. Dependencies

The following key dependencies are used in the project:

| Package | Version | Description |
|---|---|---|
| `@google/genai` | `^1.27.0` | Google Generative AI API client. |
| `@monaco-editor/react` | `^4.7.0` | Monaco Editor (code editor) component for React. |
| `clsx` | `^2.1.1` | Utility for constructing `className` strings conditionally. |
| `csv-parse` | `^6.1.0` | CSV parsing library. |
| `dompurify` | `^3.3.0` | DOMPurify is a DOM-only, super-fast, uber-tolerant XSS sanitizer for HTML, MathML and SVG. |
| `dotenv` | `^17.2.3` | Loads environment variables from a .env file. |

## 8. Testing

| Command | Purpose |
|---|---|
| `npm run test` | Runs all tests. |
| `npm run test:run` | Executes the test suite. |
| `npm run test:coverage` | Generates test coverage reports. |

---
*This document is maintained by the Kaizen AI system. Last updated: January 9, 2026.*