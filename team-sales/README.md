# Team Sales Hub

A streamlined CRM and Sales Navigation tool for the LeaderReps sales team.

## Features

### CRM (Prospects)
- **List View** - Sortable, filterable table with inline editing
- **Pipeline View** - Drag-and-drop Kanban board 
- **Detail Panel** - Quick view and edit prospect info
- **Team Partitioning** - Each team member sees their own prospects by default
- **Admin View** - Rob can see all team prospects and stats

### Coming Soon (Phase 2)
- Outreach Center - Daily task queue, email templates, sequences
- Activities Log - Call logging, meeting notes, interaction timeline

## Team Access

| User | Role | Visibility |
|------|------|------------|
| rob@leaderreps.com | Admin | All team prospects |
| ryan@leaderreps.com | Member | Own prospects only |
| jeff@leaderreps.com | Member | Own prospects only |
| cristina@leaderreps.com | Member | Own prospects only |

## Tech Stack

- **React 18** + Vite 5
- **Tailwind CSS 3** for styling
- **Zustand** for state management
- **Firebase** (Firestore) for data - shares data with Corporate Command Center
- **@dnd-kit** for drag-and-drop
- **@tanstack/react-table** for data tables
- **cmdk** for command palette (⌘K)
- **react-hot-toast** for notifications

## Development

```bash
# Navigate to team-sales folder
cd team-sales

# Install dependencies
npm install

# Create .env.local with Firebase config
cp .env.example .env.local
# Edit .env.local with actual Firebase credentials

# Start development server
npm run dev
# Opens at http://localhost:5175
```

## Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Firebase (from root directory)
cd ..
firebase deploy --only hosting:team-sales
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K / Ctrl+K | Open command palette |
| ↑ / ↓ | Navigate in lists |
| Enter | Select/confirm |
| Esc | Close modals/panels |

## Data Model

This app shares Firestore data with the Corporate Command Center:

```
corporate_prospects/
  ├── id
  ├── name, email, phone, linkedin
  ├── company, title
  ├── stage (new, contacted, qualified, demo, proposal, negotiation, won, lost)
  ├── owner / ownerEmail (team member assignment)
  ├── value (deal value)
  ├── notes
  ├── createdAt, updatedAt
```

## Design Principles

Inspired by best-in-breed tools:
- **Linear** - Clean, keyboard-first, command palette
- **Close.io** - Activity timeline, quick logging
- **Pipedrive** - Visual pipeline, drag-and-drop
- **Notion** - Inline editing, minimal friction

## Related

- [Corporate Command Center](../corporate/) - Full admin hub (Rob only)
- [Main App](../) - LeaderReps PD Platform
