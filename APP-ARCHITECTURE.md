# Application Architecture & File Map

This document provides a comprehensive map of the LeaderReps application codebase, detailing the purpose and location of key files and directories. It is designed to help developers and the Kaizen AI understand the system structure.

## 1. Core Application Entry Points

| File | Location | Purpose |
|------|----------|---------|
| `main.jsx` | `src/main.jsx` | The application entry point. Mounts the React app, initializes providers (Auth, Router, Feature), and handles global error boundaries. |
| `App.jsx` | `src/App.jsx` | The root component. Sets up the main routing structure, layout wrappers, and global context providers. |
| `index.html` | `/index.html` | The main HTML template. Contains the root div for React and global meta tags. |
| `vite.config.mjs` | `/vite.config.mjs` | Configuration for the Vite build tool, including plugins, aliases, and build settings. |

## 2. Configuration & Environment

| File | Location | Purpose |
|------|----------|---------|
| `firebaseConfig.js` | `src/config/firebaseConfig.js` | Initializes the Firebase app and exports auth, firestore, storage, and functions instances. Handles environment-specific config (Dev vs Test vs Prod). |
| `widgetTemplates.js` | `src/config/widgetTemplates.js` | **CRITICAL**. Defines the templates for the dynamic widget system. Contains the code strings for widgets like `win-the-day`, `daily-plan`, etc., and their metadata. |
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

## 4. Component Structure

### 4.1 Admin Portal (`src/components/admin/`)
| File | Purpose |
|------|---------|
| `AdminPortal.jsx` | The main layout and router for the Admin interface. |
| `FeatureManager.jsx` | The "Widget Manager". Allows admins to enable/disable widgets, reorder them, and edit their settings/documentation. |
| `DocumentationCenter.jsx` | The hub for viewing and updating system documentation (Admin Guide, User Guide, Architecture). Includes the Kaizen AI updater. |
| `ContentManager.jsx` | Interface for managing the Content Library (uploading videos, creating articles). |
| `UserManager.jsx` | Interface for viewing and managing user accounts and permissions. |

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
| `check-admin-config.js` | `/check-admin-config.js` | Utility to verify admin permissions and configuration. |

---
*This document is maintained by the Kaizen AI system. Last updated: December 2025.*
