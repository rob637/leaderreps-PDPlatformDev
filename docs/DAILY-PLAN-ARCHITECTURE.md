# Daily Plan Architecture - Progressive Resource Unlocking

## Overview

The Daily Plan uses a **progressive resource unlocking model** where:

1. **Media Vault** → Raw content is uploaded (videos, documents, courses, etc.)
2. **Resource Wrapper** → Content gets metadata wrapper (title, type, thumbnail, description)
3. **Daily Plan** → Wrapped resources are linked to daily actions
4. **Progressive Unlocking** → As users progress through days, more resources unlock

> **Key Insight**: As leaders progress through the course, resources unlock giving them more and more access to the library.

## Key Principle: Actions Unlock Resources

There is **no separate "Content" section** in the Daily Plan. Instead:

- Each day has an `actions` array
- Each action can optionally have a `resourceId` linking to a Resource-Wrapped item
- When a user reaches that day, the linked resource is **unlocked**
- Once unlocked, the resource remains accessible forever in their library

### The Resource Journey
```
┌─────────────┐     ┌──────────────────┐     ┌────────────┐     ┌──────────────┐
│ Media Vault │ ──▶ │ Resource Wrapper │ ──▶ │ Daily Plan │ ──▶ │   Unlocked   │
│  (Upload)   │     │   (Metadata)     │     │  (Link)    │     │  (Access)    │
└─────────────┘     └──────────────────┘     └────────────┘     └──────────────┘
```

### Action Structure
```javascript
{
  id: 'action-xxx',
  type: 'daily_rep' | 'task' | 'reflection' | 'workout',
  label: 'Complete 5:1 Feedback Exercise',
  // Optional: Link to resource (unlocks the resource)
  resourceId: 'abc123',
  resourceTitle: 'Feedback Worksheet',
  resourceType: 'document' | 'video' | 'book' | 'course',
  isCompleted: false
}
```

### Unlocked Resources Calculation

Resources are unlocked when:
1. An action with a `resourceId` exists on a day <= current day
2. Legacy: A day has a `content[]` array (backward compatibility)

```javascript
// From useDailyPlan.js
unlockedResources = dailyPlan
  .filter(day => day.dayNumber <= currentDbDay)
  .flatMap(day => [
    ...(day.actions || []).filter(a => a.resourceId),
    ...(day.content || [])  // Legacy support
  ]);
```

## Three Phase System

| Phase | DB Days | Weeks | Missed Day Tracking |
|-------|---------|-------|---------------------|
| PRE-START (Prep) | 1-14 | -2, -1 | No |
| START (Foundations) | 15-70 | 1-8 | Yes |
| POST-START | 71+ | 9+ | No |

## Development Plan Integration

The 8-week **Development Plan** is integrated INTO the Daily Plan, not separate from it.

### How It Works

| Phase | Days | What It Is | Label |
|-------|------|------------|-------|
| Pre-Start | 1-14 | Prep activities before program | "Prep Phase" |
| **Development Plan** | 15-70 | 8-week core program (Weeks 1-8) | **"Development Plan"** |
| Post-Start | 71+ | Ongoing maintenance | "Next Reps" |

### Key Points

- **Single Data Source**: All days live in `daily_plan_v1` collection
- **Still Called Development Plan**: Days 15-70 (Weeks 1-8) are displayed as "Development Plan" or "Week X"
- **Progressive Unlocking**: Resources linked to Development Plan days unlock as users progress
- **Weekly View Available**: Can still show weekly groupings for the Development Plan weeks

### Legacy Collection (`development_plan_v1`)

The original weekly data structure:
- `content[]` - Weekly content items
- `reps[]` - Daily practice activities  
- `workouts[]` - Weekly workouts
- `community[]` - Community activities
- `coaching[]` - Coaching sessions

This data should be migrated INTO `daily_plan_v1` days 15-70, with resources properly wrapped and linked to actions.

## Admin UI (DailyPlanManager)

### Day Configuration
- Title
- Focus
- Is Weekend
- Actions (with optional resource links)
- Dashboard Widget Visibility (Lock & Key)

### No Separate Content Section
Content is added by:
1. Creating an action
2. Clicking "Attach Content" on the action
3. Selecting from content library
4. Resource is now linked and will be unlocked on this day

### Linked Resources Summary
When a day has actions with linked resources, a summary card shows:
- Number of linked resources
- Resource titles and types
- Note that they're "automatically unlocked"

## File Structure

```
src/
├── hooks/
│   ├── useDailyPlan.js     # Core hook - three phases, daily data
│   └── useDevPlan.js       # Legacy wrapper - weekly view
├── components/
│   ├── admin/
│   │   └── DailyPlanManager.jsx  # Admin UI
│   └── screens/
│       └── Dashboard.jsx   # Uses shouldShow() for Lock & Key
```

## Action Types

```javascript
export const ACTION_TYPES = {
  daily_rep: { label: 'Daily Rep', icon: 'Zap', color: 'teal' },
  task: { label: 'Task', icon: 'CheckSquare', color: 'blue' },
  reflection: { label: 'Reflection', icon: 'BookOpen', color: 'purple' },
  workout: { label: 'Workout', icon: 'Dumbbell', color: 'orange' },
  reading: { label: 'Reading', icon: 'Book', color: 'green' }
};
```
