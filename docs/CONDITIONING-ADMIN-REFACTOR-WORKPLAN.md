# Conditioning Rep Types Admin Refactor Workplan

## Problem Statement

The conditioning rep system deviates from the established admin-manageable architecture pattern used throughout LeaderReps. While widgets, content library items, daily plan actions, and coaching sessions are all Firestore-driven and admin-editable, the conditioning rep taxonomy is hardcoded in JavaScript (`repTaxonomy.js`, `conditioningService.js`).

**Impact:**
- Adding/editing rep types requires code deployment
- No admin visibility into rep type configuration
- Prompts and progression rules can't be A/B tested without deployments
- Inconsistent with the "sys admin can manage" philosophy

## Scale Considerations

The system must handle growth:
- **Multiple Milestones**: Currently 5 Foundation milestones, but could expand to 10+ with Ascent phase
- **Multiple Reps per Milestone**: Each milestone has 3-6 required "Real Reps" plus optional extras
- **Rep Type Reuse**: Same rep type might appear in multiple milestones with different contexts
- **Progressive Complexity**: Later milestones may use harder versions of earlier rep types
- **Cohort Variations**: Different cohorts might have different milestone configurations

---

## Current Architecture

### Hardcoded in JavaScript

| Asset | Location | Contents |
|-------|----------|----------|
| Rep Type Definitions | `src/services/repTaxonomy.js` | 20+ rep types with labels, descriptions, categories |
| Scaffolding Prompts | `src/services/repTaxonomy.js` | Per-rep coaching prompts for Lvl 1-3 |
| Quality Dimensions | `src/services/conditioningService.js` | Scoring criteria (clarity, specificity, etc.) |
| Category Groupings | `src/services/repTaxonomy.js` | 6 categories (Reinforcing, Redirecting, 1:1, etc.) |
| Linked Rep Rules | `src/services/repTaxonomy.js` | Prerequisite mapping for unlock logic |
| Milestone Mappings | `src/services/repTaxonomy.js` | Which reps unlock at each Foundation milestone |
| Coach Prompts | `src/services/conditioningService.js` | AI coaching prompt templates |

### Already in Firestore (Good Pattern)

| Asset | Collection | Admin UI |
|-------|------------|----------|
| Content Items | `unified-content/` | Content Manager |
| Daily Plan Actions | `daily_plan_v1/{dayId}` | Day Builder |
| Coaching Session Types | Config + registrations | Coaching Manager |
| Feature Flags | `config/features` | Admin Settings |

---

## Target Architecture

### Data Model Philosophy

The key insight is separating:
1. **Rep Type Definitions** - The "what" (universal, reusable across milestones)
2. **Milestone Configurations** - The "when" (which reps appear in which milestone)
3. **Milestone Rep Assignments** - The "how" (specific config for a rep within a milestone)

This allows:
- Same rep type used in multiple milestones with different difficulty/prompts
- Adding new milestones without touching rep type definitions
- Bulk operations (move all reps from M3 to M4)
- Cohort-specific milestone configurations

### New Firestore Collections

```
conditioning_categories/{categoryId}
├── id: string (e.g., "reinforcing_redirecting")
├── label: string
├── description: string
├── icon: string (lucide icon name)
├── sortOrder: number
├── isActive: boolean
└── createdAt/updatedAt: timestamp

conditioning_rep_types/{repTypeId}
├── id: string (e.g., "set_clear_expectations")
├── categoryId: string (FK to categories)
├── label: string
├── shortLabel: string
├── description: string
├── detailedDescription: string
├── exampleScenarios: string[]
├── defaultScaffoldingPrompts: {
│   level1: string[],
│   level2: string[],
│   level3: string[]
│ }
├── qualityDimensions: string[] (IDs of dimensions to evaluate)
├── prerequisites: string[] (rep type IDs - global prereqs)
├── baseDifficultyTier: number (1-3, default difficulty)
├── estimatedMinutes: number
├── isActive: boolean
├── sortOrder: number
└── metadata: {
    createdAt: timestamp,
    updatedAt: timestamp,
    createdBy: string
  }

# NEW: Milestone definitions (program structure)
conditioning_milestones/{milestoneId}
├── id: string (e.g., "foundation_1", "ascent_1")
├── phase: string ("foundation" | "ascent" | "mastery")
├── milestoneNumber: number (1-5 for foundation, 1-N for ascent)
├── label: string ("Reinforcing")
├── description: string
├── theme: string (visual theme key)
├── icon: string
├── requiredRepCount: number (how many reps must be completed)
├── sortOrder: number
├── isActive: boolean
└── metadata: {...}

# NEW: Junction table - which reps are in which milestone
conditioning_milestone_reps/{assignmentId}
├── id: string (auto-generated)
├── milestoneId: string (FK to milestones)
├── repTypeId: string (FK to rep_types)
├── isRequired: boolean (required vs optional/extra practice)
├── sortOrder: number (display order within milestone)
├── difficultyOverride: number | null (override base difficulty for this milestone)
├── scaffoldingOverride: {...} | null (milestone-specific prompts)
├── contextLabel: string | null (e.g., "for your Expectation" suffix)
├── dependsOnRepInMilestone: string | null (must complete this rep first, within milestone)
├── isActive: boolean
└── metadata: {...}

conditioning_quality_dimensions/{dimensionId}
├── id: string (e.g., "clarity")
├── label: string
├── description: string
├── scoringGuidance: {
│   excellent: string,
│   good: string,
│   developing: string
│ }
├── weight: number (for composite scoring)
├── appliesToCategories: string[] (which categories use this)
└── isActive: boolean

conditioning_coach_prompts/{promptId}
├── id: string
├── promptType: string (evidence_capture, debrief, followup, etc.)
├── repTypeId: string | null (null = applies to all)
├── milestoneId: string | null (null = applies to all milestones)
├── template: string (with {{placeholders}})
├── isActive: boolean
└── version: number
```

### Example Data Structure

**Milestone 1: Reinforcing** might have:
```javascript
// conditioning_milestone_reps documents
{ milestoneId: "foundation_1", repTypeId: "set_clear_expectations", isRequired: true, sortOrder: 1 }
{ milestoneId: "foundation_1", repTypeId: "make_clean_handoff", isRequired: true, sortOrder: 2, contextLabel: "for your Expectation", dependsOnRepInMilestone: "set_clear_expectations" }
{ milestoneId: "foundation_1", repTypeId: "deliver_reinforcing_feedback", isRequired: true, sortOrder: 3 }
{ milestoneId: "foundation_1", repTypeId: "make_clean_handoff", isRequired: true, sortOrder: 4, contextLabel: "for your Feedback", dependsOnRepInMilestone: "deliver_reinforcing_feedback" }
```

**Milestone 3: One-on-One** might reuse the same rep types with harder scaffolding:
```javascript
{ milestoneId: "foundation_3", repTypeId: "set_clear_expectations", isRequired: true, sortOrder: 1, 
  difficultyOverride: 2, scaffoldingOverride: { level1: ["More advanced prompt..."] } }
```

### Admin UI Extension

Add "Conditioning" section to Admin Panel with tabs:

1. **Milestones** (NEW - primary management view)
   - List all milestones by phase
   - Click milestone → see assigned reps
   - Drag-drop reorder reps within milestone
   - Add/remove rep assignments
   - Configure required vs optional
   - Set milestone-specific overrides

2. **Rep Types** - Master rep type library
   - CRUD for rep type definitions
   - See which milestones use each rep type
   - Bulk assign to milestones

3. **Categories** - Manage groupings

4. **Quality Dimensions** - Configure scoring criteria

5. **Coach Prompts** - Edit AI prompt templates
   - Filter by milestone and/or rep type
   - Preview with sample data

6. **Preview** - Test full flow with selected milestone/rep

---

## Migration Strategy

### Phase 1: Data Migration (Day 1)

1. **Create migration script** `scripts/migrations/migrate-rep-taxonomy-to-firestore.cjs`
   - Extract categories from `repTaxonomy.js` → `conditioning_categories`
   - Extract rep type definitions → `conditioning_rep_types`
   - Extract quality dimensions → `conditioning_quality_dimensions`
   - Extract milestone mappings → `conditioning_milestones`
   - Create junction records → `conditioning_milestone_reps`
   - Extract coach prompts → `conditioning_coach_prompts`
   - Generate verification report

2. **Seed initial data** to dev environment:
   - 6 categories
   - 20+ rep types (master definitions)
   - 5 Foundation milestones
   - ~25 milestone-rep assignments (current M1 has 5 reps)
   - Quality dimensions
   - Coach prompt templates

### Phase 2: Service Layer Refactor (Day 1-2)

1. **Create `repTypeService.js`**
   ```javascript
   export const repTypeService = {
     // Master data
     getAllRepTypes: async (db) => {...},
     getRepTypeById: async (db, repTypeId) => {...},
     getRepTypesByCategory: async (db, categoryId) => {...},
     getCategories: async (db) => {...},
     getQualityDimensions: async (db) => {...},
     
     // Milestone-aware queries (the key new functionality)
     getMilestones: async (db, phase = null) => {...},
     getMilestoneById: async (db, milestoneId) => {...},
     getMilestoneReps: async (db, milestoneId) => {...},
     getRequiredRepsForMilestone: async (db, milestoneId) => {...},
     getOptionalRepsForMilestone: async (db, milestoneId) => {...},
     
     // Combined view (rep type + milestone-specific config)
     getEnrichedMilestoneReps: async (db, milestoneId) => {
       // Returns rep types merged with milestone-specific overrides
       // e.g., { ...repType, contextLabel, difficultyOverride, sortOrder }
     },
     
     // User progress queries
     getUnlockedMilestones: async (db, userId) => {...},
     getCompletedRepsInMilestone: async (db, userId, milestoneId) => {...},
     
     // Coach prompts
     getCoachPrompt: async (db, promptType, repTypeId, milestoneId) => {
       // Cascading lookup: milestone+rep specific → rep specific → default
     },
   };
   ```

2. **Add caching layer** with cache key strategy:
   ```javascript
   // Cache keys
   `rep_types` → all rep type definitions
   `categories` → all categories
   `milestones` → all milestone definitions
   `milestone_reps:{milestoneId}` → reps for specific milestone
   
   // Cache invalidation via Firestore listeners (admin only)
   // Or simple TTL-based (5 min) for non-admin users
   ```

3. **Create `useRepTypes` and `useMilestoneReps` hooks**
   ```javascript
   // Master data hook
   export const useRepTypes = () => {
     const [repTypes, setRepTypes] = useState([]);
     const [categories, setCategories] = useState([]);
     const [loading, setLoading] = useState(true);
     // ...
   };
   
   // Milestone-specific hook (used by widgets/screens)
   export const useMilestoneReps = (milestoneId) => {
     const [reps, setReps] = useState([]);
     const [loading, setLoading] = useState(true);
     // Returns enriched rep data with milestone overrides applied
   };
   ```

### Phase 3: Component Updates (Day 2)

1. **Update consumers** to use new hooks instead of importing from `repTaxonomy.js`:
   - `ConditioningWidget.jsx` → use `useMilestoneReps(currentMilestoneId)`
   - `ConditioningScreen.jsx` → use `useMilestoneReps`
   - `EvidenceCaptureWizard.jsx` → rep type from props (already enriched)
   - `RepCommitFlow.jsx` → use enriched rep data
   - `RepFlowWizard.jsx` → use enriched rep data
   - `ThisWeeksActionsWidget.jsx` → use `useMilestoneReps` for action items
   - `DevelopmentJourneyWidget.jsx` → use milestone data for progress

2. **Update AI prompts** to use cascading lookup:
   ```javascript
   // In conditioningService.assessRepQuality:
   const prompt = await repTypeService.getCoachPrompt(
     db, 
     'evidence_assessment', 
     rep.repType, 
     rep.milestoneId // NEW: pass milestone for context-specific prompts
   );
   ```

3. **Update daily_plan_v1 integration**
   - Milestone documents reference `conditioning_milestone_reps` by ID
   - Action items resolve rep display data at render time

### Phase 4: Admin UI (Day 2-3)

1. **Create `ConditioningManager.jsx`** admin component with tabs:

   **Milestones Tab** (primary view):
   ```
   ┌─────────────────────────────────────────────────────────┐
   │ Foundation Phase                                        │
   ├─────────────────────────────────────────────────────────┤
   │ [M1] Reinforcing          5 reps    ✓ Active   [Edit]  │
   │ [M2] Redirecting          5 reps    ✓ Active   [Edit]  │
   │ [M3] One-on-One           6 reps    ✓ Active   [Edit]  │
   │ [M4] Redirecting Adv      5 reps    ✓ Active   [Edit]  │
   │ [M5] Readiness            6 reps    ✓ Active   [Edit]  │
   ├─────────────────────────────────────────────────────────┤
   │ Ascent Phase                    [+ Add Milestone]      │
   ├─────────────────────────────────────────────────────────┤
   │ (No milestones defined yet)                            │
   └─────────────────────────────────────────────────────────┘
   ```

   **Milestone Editor** (click Edit):
   ```
   ┌─────────────────────────────────────────────────────────┐
   │ Milestone 1: Reinforcing                               │
   ├─────────────────────────────────────────────────────────┤
   │ Required Reps (drag to reorder):                       │
   │ ┌───────────────────────────────────────────────────┐  │
   │ │ ≡ Set Clear Expectations        Tier 1   [Config] │  │
   │ │ ≡ Clean Handoff (for Exp.)      Tier 1   [Config] │  │
   │ │ ≡ Reinforcing Feedback          Tier 1   [Config] │  │
   │ │ ≡ Clean Handoff (for Feedback)  Tier 1   [Config] │  │
   │ └───────────────────────────────────────────────────┘  │
   │                                                         │
   │ [+ Add Rep to Milestone]                               │
   │                                                         │
   │ Optional/Extra Practice Reps:                          │
   │ (none configured)                                      │
   │ [+ Add Optional Rep]                                   │
   └─────────────────────────────────────────────────────────┘
   ```

   **Rep Assignment Config** (click Config):
   ```
   ┌─────────────────────────────────────────────────────────┐
   │ Configure: Set Clear Expectations in M1                │
   ├─────────────────────────────────────────────────────────┤
   │ Context Label:  [_____________________] (optional)     │
   │ Difficulty:     [Use Default (1)] ▼                    │
   │ Depends On:     [None] ▼                               │
   │                                                         │
   │ □ Override scaffolding prompts for this milestone      │
   │   Level 1: [________________________]                  │
   │   Level 2: [________________________]                  │
   │   Level 3: [________________________]                  │
   │                                                         │
   │ [Save] [Cancel] [Remove from Milestone]                │
   └─────────────────────────────────────────────────────────┘
   ```

2. **Rep Types Tab** - Library management:
   - List all rep types with category badges
   - Usage count (how many milestones reference this rep)
   - Edit master definition (label, description, default prompts)
   - Can't delete if referenced by milestones

3. **Add to admin navigation**
   - New sidebar item: "Conditioning"
   - Sub-items: Milestones, Rep Library, Settings

### Phase 5: Cleanup & Verification (Day 3)

1. **Remove hardcoded data** from `repTaxonomy.js`
   - Keep only utility functions if any
   - Or deprecate entire file

2. **Update documentation**
   - Admin guide for managing rep types
   - Architecture docs

3. **Test all flows**
   - Rep selection
   - Evidence capture
   - AI coaching prompts
   - Unlock/progression logic

---

## Backward Compatibility

During migration:
- **Fallback pattern**: If Firestore fetch fails, fall back to hardcoded data
- **Feature flag**: `USE_FIRESTORE_REP_TYPES` to toggle during rollout
- **No user data changes**: `conditioning_reps` collection stays the same

---

## Estimated Effort

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Data Migration | 3-4 hours | None |
| Phase 2: Service Layer | 4-5 hours | Phase 1 |
| Phase 3: Component Updates | 4-5 hours | Phase 2 |
| Phase 4: Admin UI | 6-8 hours | Phase 2 |
| Phase 5: Cleanup & Test | 3-4 hours | All |
| **Total** | **~2.5-3 days** | |

---

## Benefits After Refactor

1. **Admin Self-Service**: Add new milestones and reps without developer involvement
2. **Scalable Structure**: Add Ascent phase milestones without code changes
3. **A/B Testing**: Test different prompts/descriptions without deployments
4. **Flexibility**: Same rep type can appear multiple times with different configs
5. **Localization Ready**: Add i18n fields to documents when needed
6. **Analytics Integration**: Track which rep types are most/least used
7. **Consistency**: Follows established Firestore-driven content pattern
8. **Audit Trail**: Firestore timestamps show who changed what

---

## Files to Modify

### Delete/Deprecate
- `src/services/repTaxonomy.js` (after migration)

### Create
- `src/services/repTypeService.js` (core service)
- `src/hooks/useRepTypes.js` (master data hook)
- `src/hooks/useMilestoneReps.js` (milestone-specific hook)
- `src/components/admin/ConditioningManager.jsx` (main admin UI)
- `src/components/admin/MilestoneEditor.jsx` (milestone config)
- `src/components/admin/RepAssignmentConfig.jsx` (rep-in-milestone config)
- `scripts/migrations/migrate-rep-taxonomy-to-firestore.cjs`

### Modify
- `src/services/conditioningService.js` (use new service for prompts)
- `src/components/conditioning/ConditioningWidget.jsx`
- `src/components/screens/ConditioningScreen.jsx`
- `src/components/conditioning/EvidenceCaptureWizard.jsx`
- `src/components/conditioning/RepCommitFlow.jsx`
- `src/components/conditioning/RepFlowWizard.jsx`
- `src/components/widgets/ThisWeeksActionsWidget.jsx`
- `src/components/widgets/DevelopmentJourneyWidget.jsx`
- `src/components/admin/AdminSidebar.jsx` (add nav item)
- `daily_plan_v1/milestone-{N}` documents (reference new IDs)

---

## Decision Points

Before starting, decide:

1. **Cache Strategy**: In-memory (simpler) vs. localStorage (persists across refreshes)?
2. **Admin Permissions**: Existing admin check or new "content_admin" role?
3. **Versioning**: Should prompt changes create new versions or overwrite?
4. **Validation**: How strict on rep type schema? JSON schema validation?
5. **Milestone ID Format**: `foundation_1` vs `milestone_1` vs numeric?
6. **Cohort Variations**: Same milestone collections for all cohorts, or cohort-specific?
7. **Rep Reuse Strategy**: When same rep appears twice in milestone, one doc with array or two docs?
8. **Migration Approach**: Big bang (all at once) or gradual (feature flag per milestone)?

---

## Growth Scenarios Supported

### Scenario 1: Add Ascent Phase Milestones
Admin creates new milestones via UI:
- Add "Ascent Milestone 1" with phase="ascent"
- Assign existing rep types from library
- Configure difficulty overrides (harder than Foundation)
- No code changes needed

### Scenario 2: Add New Rep Type
Admin creates new rep type in library:
- Define label, description, default prompts
- Assign to category
- Then assign to one or more milestones
- Each milestone can have different difficulty/context

### Scenario 3: Reorder Reps in Milestone
Admin drags reps in milestone editor:
- Updates `sortOrder` field
- User sees new order immediately
- No deployment needed

### Scenario 4: A/B Test New Prompts
Admin creates milestone-specific prompt override:
- Original prompt stays as default
- Override only affects one milestone
- Compare completion rates between milestones

---

## Priority

**Recommended**: Complete current conditioning feature first, then schedule this refactor for a dedicated sprint. The hardcoded approach works and can ship - this refactor is about long-term maintainability, not blocking functionality.
