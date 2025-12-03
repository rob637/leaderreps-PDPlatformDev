# Data Migration Strategy Guide

## Overview

Your app has two distinct types of data:

| Type | Description | Migrates? |
|------|-------------|-----------|
| **Application Data** | System config, content libraries, 26-week plan, LOVs | ✅ YES |
| **User Data** | User profiles, progress, achievements, settings | ❌ NO |

---

## Data Categories

### 📦 Application Data (SHOULD Migrate)

These collections contain system-wide data that should be the same across environments:

| Collection | Purpose | Notes |
|------------|---------|-------|
| `development_plan_v1` | 26-week master plan | Created in Dev Plan Manager |
| `system_lovs` | Lists of Values (dropdowns) | Created in LOV Manager |
| `content_readings` | Reading library | Created in Content Manager |
| `content_videos` | Video library | Created in Content Manager |
| `content_courses` | Course catalog | Created in Content Manager |
| `content_coaching` | Coaching scenarios | Created in Coaching Manager |
| `metadata/*` | App config, catalogs | Admin emails, etc. |
| `config/*` | Feature flags | Widget visibility |
| `global/*` | Global metadata | Shared app settings |

### 👤 User Data (Should NOT Migrate)

These collections contain user-specific data:

| Collection | Purpose | Why Not Migrate |
|------------|---------|-----------------|
| `users/{userId}/*` | User profiles | Different test users per env |
| `modules/{userId}/*` | User progress | Environment-specific testing |
| `content_community` | Forum posts | User-generated content |
| `artifacts/{appId}/users/*` | User artifacts | Personal data |

---

## Migration Workflow

### Scenario 1: Initial Test Environment Setup

```bash
# 1. Export from Dev
node scripts/migrate-app-data.js export dev

# 2. Import to Test
node scripts/migrate-app-data.js import test ./data-exports/app-data-dev-2024-12-03.json
```

### Scenario 2: Sync Changes to Test After Dev Updates

```bash
# After making changes in Dev (LOVs, content, 26-week plan)
node scripts/migrate-app-data.js export dev
node scripts/migrate-app-data.js import test ./data-exports/app-data-dev-YYYY-MM-DD.json
```

### Scenario 3: Promote Test to Production

```bash
# Export from Test (after QA approval)
node scripts/migrate-app-data.js export test

# Import to Production
node scripts/migrate-app-data.js import prod ./data-exports/app-data-test-YYYY-MM-DD.json
```

---

## Prerequisites

### Service Account Keys

Each environment needs a service account key file:

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as:
   - Dev: `leaderreps-pd-platform-firebase-adminsdk.json`
   - Test: `leaderreps-test-firebase-adminsdk.json`
   - Prod: `leaderreps-production-firebase-adminsdk.json`

4. Add to `.gitignore` (already should be):
   ```
   *-firebase-adminsdk*.json
   serviceAccountKey.json
   ```

---

## Quick Commands

```bash
# List available exports
node scripts/migrate-app-data.js list

# Export from Dev
node scripts/migrate-app-data.js export dev

# Export from Test
node scripts/migrate-app-data.js export test

# Import to Test
node scripts/migrate-app-data.js import test <filepath>

# Import to Prod
node scripts/migrate-app-data.js import prod <filepath>
```

---

## Alternative: Firebase CLI Export/Import

For more granular control, you can use Firebase CLI:

```bash
# Export specific collection
firebase firestore:export gs://leaderreps-pd-platform.appspot.com/backups/app-data

# Import to another project
firebase use test
firebase firestore:import gs://leaderreps-pd-platform.appspot.com/backups/app-data
```

---

## Best Practices

### 1. Version Control for Seed Data
Keep seed data in code for initial setup:
- `src/data/seedLovs.js` - Default LOVs
- Add similar files for other initial data

### 2. Export Before Major Changes
```bash
node scripts/migrate-app-data.js export dev
# Then make changes...
# If something breaks, you have a backup
```

### 3. Environment-Specific Testing
- **Dev**: Developers make changes, test new features
- **Test**: QA team tests with production-like data
- **Prod**: End users, only tested features

### 4. Data Audit
Periodically review what's in each environment:
```bash
# Check what's different
node scripts/migrate-app-data.js export dev
node scripts/migrate-app-data.js export test
# Compare the JSON files
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      FIRESTORE DATABASE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  APPLICATION DATA (Migrates)          USER DATA (Doesn't)       │
│  ┌──────────────────────┐            ┌───────────────────┐     │
│  │ development_plan_v1  │            │ users/{userId}    │     │
│  │ system_lovs          │            │   └─ profile      │     │
│  │ content_readings     │            │   └─ settings     │     │
│  │ content_videos       │            │                   │     │
│  │ content_courses      │            │ modules/{userId}  │     │
│  │ content_coaching     │            │   └─ progress     │     │
│  │ metadata/*           │            │   └─ achievements │     │
│  │ config/*             │            │                   │     │
│  │ global/*             │            │ content_community │     │
│  └──────────────────────┘            │   (user posts)    │     │
│                                       └───────────────────┘     │
│         ↓ Export/Import                                         │
│  ┌──────────────────────┐                                       │
│  │ migrate-app-data.js  │                                       │
│  │ • export dev         │                                       │
│  │ • import test        │                                       │
│  │ • import prod        │                                       │
│  └──────────────────────┘                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Questions?

| Question | Answer |
|----------|--------|
| What if I want to copy one user's data? | Manual Firestore copy or custom script |
| How do I reset Test environment? | Delete collections, re-import from Dev |
| Can I sync specific collections only? | Modify `APP_DATA_COLLECTIONS` in script |
| What about storage (images, files)? | Need separate migration for Firebase Storage |
