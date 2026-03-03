# Data Migration Strategy Guide

## Overview

Your app has THREE distinct types of data, each with a different sync direction:

| Type | Direction | Description |
|------|-----------|-------------|
| **Code** | Dev → Test → Prod | React code, cloud functions, firestore rules |
| **Content** | Prod → Test → Dev | Videos, readings, media vault, content library |
| **Config/Structure** | Dev → Test → Prod | Feature flags, daily plan structure, LOVs |
| **User Data** | ❌ Never migrates | User profiles, progress, cohort membership |

### Why Content Flows FROM Production

Content authors (non-developers) work in Production because:
- Real CDN URLs for video/image previews
- Production-quality media playback
- No risk of test data appearing in real content

**After editing content in Prod, immediately sync down:**
```bash
npm run data:sync-content-from-prod
```

### Why Config Flows TO Production

Configuration tied to code changes (new days in daily plan, feature flags, LOVs) 
should be developed and tested before going live:
```bash
npm run data:sync-config-to-prod
```

---

## Quick Reference - Which Command?

| I just... | Run this |
|-----------|----------|
| Edited videos/content in Prod | `npm run data:sync-content-from-prod` |
| Added new days to Daily Plan in Dev | `npm run data:sync-config-to-prod -- --to-test-only` (then deploy code) |
| Changed feature flags in Dev | `npm run data:sync-config-to-prod -- --to-test-only` |
| Need to sync everything from Prod | `npm run data:sync-content-from-prod` |

---

## Data Categories

### 📦 Application Data (Split by Direction)

#### Content Data (Prod → Dev direction)
| Collection | Purpose | Notes |
|------------|---------|-------|
| `media_assets` | Media Vault | Videos, images, documents |
| `content_library` | Unified Content Library | All content types |
| `content` | Legacy content | Migration holdover |
| `content_videos` | Video library | Individual videos |
| `content_readings` | Reading library | Articles, PDFs |
| `content_documents` | Document wrappers | Linked documents |
| `skills` | Skills Taxonomy | Skill definitions |
| `video_series` | Video playlists | Multi-video series |

#### Config Data (Dev → Prod direction)
| Collection | Purpose | Notes |
|------------|---------|-------|
| `development_plan_v1` | 26-week master plan | Structure changes |
| `daily_plan_v1` | Day-by-Day Daily Plan | New days, structure |
| `system_lovs` | Lists of Values | Dropdowns |
| `config/*` | Feature flags | Widget visibility |
| `metadata/*` | App config | Admin emails, etc. |
| `coaching_session_types` | Coaching types | Session structure |
| `community_session_types` | Community types | Event structure |

### 👤 User Data (Should NOT Migrate)

These collections contain user-specific data:

| Collection | Purpose | Why Not Migrate |
|------------|---------|-----------------|
| `users/{userId}/*` | User profiles | Different test users per env |
| `modules/{userId}/*` | User progress | Environment-specific testing |
| `content_community` | Forum posts | User-generated content |
| `artifacts/{appId}/users/*` | User artifacts | Personal data |
| `invitations/*` | User invitations | User-specific |
| `cohorts/*` | Cohort membership | Contains user refs (facilitator, memberIds) |

---

## Migration Workflows

### Scenario 1: Content Created/Edited in Production (MOST COMMON)

After adding videos, readings, or media in Prod:
```bash
npm run data:sync-content-from-prod
```
This exports from Prod and imports to both Test and Dev.

### Scenario 2: Config/Structure Changes in Dev

After adding new days to Daily Plan or changing feature flags:
```bash
# First, sync content FROM prod so you don't lose recent content
npm run data:sync-content-from-prod

# Then push your config changes (to Test only for QA first)
npm run data:sync-config-to-prod -- --to-test-only

# After QA approval, push to Prod
npm run data:sync-config-to-prod
```

### Scenario 3: Initial Test Environment Setup

```bash
# If Prod has the canonical data:
npm run data:sync-content-from-prod

# If Dev has the canonical data:
npm run data:sync-config-to-prod -- --to-test-only
```

### Manual Export/Import (Advanced)

For granular control, use the raw commands:
```bash
# Export from any environment
npm run data:export dev   # or test, prod

# Import to any environment
npm run data:import test ./data-exports/app-data-prod-YYYY-MM-DD.json
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
   - Prod: `leaderreps-prod-firebase-adminsdk.json`

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

## Cleaning Up Test Environment

If user data was accidentally migrated to Test, use the cleanup script:

```bash
# Preview what will be deleted (DRY RUN)
npm run cleanup:test-preview

# Actually delete the user data
npm run cleanup:test-execute
```

This will remove:
- `users` - User profiles
- `modules` - User progress data
- `invitations` - User invitations
- `cohorts` - Cohort definitions (contain user references)

⚠️ **WARNING**: Always run the preview first to verify what will be deleted!

---

## Questions?

| Question | Answer |
|----------|--------|
| What if I want to copy one user's data? | Manual Firestore copy or custom script |
| How do I reset Test environment? | Use `npm run cleanup:test-execute`, then re-import app data |
| Can I sync specific collections only? | Modify `APP_DATA_COLLECTIONS` in script |
| What about storage (images, files)? | Need separate migration for Firebase Storage |
| Why aren't cohorts migrated? | They contain user refs (facilitator IDs, member IDs) |
