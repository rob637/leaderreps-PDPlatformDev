# CRM Developer Setup Guide

## Quick Start

1. Open the repo in GitHub Codespaces (or clone locally)
2. Navigate to the CRM app:
   ```bash
   cd team-sales
   npm install
   ```
3. Copy the env file:
   ```bash
   cp .env.example .env.local
   ```
4. Start the dev server:
   ```bash
   npm run dev
   # Opens at http://localhost:5175
   ```

## Your Working Directory

You should only modify files inside:
- `team-sales/` — The standalone CRM app (arena.leaderreps.com)
- `src/components/admin/crm/` — The embedded CRM copy (keep in sync)

**Do NOT modify** files outside these directories without permission.

## Tech Stack (CRM-specific)

| Layer | Tech |
|---|---|
| Framework | React 18 (JSX, no TypeScript) |
| Build | Vite |
| Routing | React Router |
| State | Zustand stores (in `src/stores/`) |
| Styling | Tailwind CSS |
| Tables | @tanstack/react-table |
| Drag & Drop | @dnd-kit |
| Forms | react-hook-form |
| Backend | Firebase (Firestore, Auth) |

## Branch Naming

Always use the `crm/` prefix:
```bash
git checkout -b crm/feature-name
```

Examples:
- `crm/pipeline-drag-drop`
- `crm/email-template-builder`
- `crm/analytics-dashboard`

## Workflow

1. Create a `crm/` branch from `main`
2. Make your changes in `team-sales/` (and mirror to `src/components/admin/crm/` if needed)
3. Test locally with `npm run dev`
4. Push and create a Pull Request
5. Rob reviews and merges

## Key Files

- `team-sales/src/App.jsx` — Routes and top-level layout
- `team-sales/src/stores/` — Zustand state stores (prospectsStore, etc.)
- `team-sales/src/pages/` — Page components (ProspectsPage, etc.)
- `team-sales/src/components/` — Reusable UI components
- `team-sales/src/lib/firebase.js` — Firebase config and helpers

## Deployment

You do NOT deploy. Rob handles deployment:
- Dev: `firebase deploy --only hosting:team-sales --project leaderreps-pd-platform`
- The CRM is served at https://arena.leaderreps.com

## Firebase Collections (CRM uses)

- `prospects/` — Prospect records
- `activities/` — Activity log
- `sequences/` — Email sequences
- `outreach/` — Outreach campaigns
- `tasks/` — Task management
