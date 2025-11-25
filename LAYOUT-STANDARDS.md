# Layout Standards Guide

This document defines the standardized layout components for the LeaderReps platform. All new development should use these canonical components to ensure visual consistency and maintainability.

## Quick Reference

| Layout Type | Component | Import |
|-------------|-----------|--------|
| **Page Container** | `PageLayout` | `from '../ui'` |
| **Widget/Card Block** | `WidgetCard` | `from '../ui'` |
| **Statistics Display** | `StatWidget` | `from '../ui'` |
| **Form Fields** | `FormField` | `from '../ui'` |
| **Loading States** | `LoadingState` | `from '../ui'` |
| **Empty States** | `PageEmptyState` | `from '../ui'` |

---

## 1. Page Layout (`PageLayout`)

**Purpose:** Consistent page structure with header, back navigation, and responsive sidebar support.

**When to use:** Every screen/page in the application.

```jsx
import { PageLayout, PageSection, PageGrid } from '../ui';

function MyScreen() {
  return (
    <PageLayout
      title="My Screen Title"
      subtitle="Optional subtitle text"
      icon={MyIcon}
      navigate={navigate}
      backTo="/home"
      backLabel="Home"
    >
      {/* Page content */}
    </PageLayout>
  );
}
```

### PageLayout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | required | Page heading |
| `subtitle` | string | - | Optional subheading |
| `icon` | Component | - | Lucide icon component |
| `navigate` | function | - | Navigation function from react-router |
| `backTo` | string | '/' | Back button destination |
| `backLabel` | string | 'Back' | Back button text |
| `sidebar` | ReactNode | - | Content for right sidebar (desktop only) |
| `sidebarWidth` | string | 'w-80' | Sidebar width class |

### Sub-components

- **`PageSection`** - Divides content with optional title
- **`PageGrid`** - Responsive grid (2-3 columns)
- **`PageEmptyState`** - For disabled/empty features

---

## 2. Widget Card (`WidgetCard`)

**Purpose:** Consistent container for dashboard widgets, feature cards, and content blocks.

**When to use:** Dashboard widgets, feature displays, content sections.

```jsx
import { WidgetCard, WidgetGrid } from '../ui';

function Dashboard() {
  return (
    <WidgetGrid columns={2}>
      <WidgetCard
        title="Daily Tasks"
        subtitle="Complete your practice"
        icon={CheckCircle}
        accent="teal"
        action={{ label: "View All", onClick: () => navigate('/tasks') }}
      >
        <TaskList tasks={tasks} />
      </WidgetCard>
      
      <WidgetCard
        title="Recent Activity"
        icon={Activity}
        accent="navy"
        isLoading={loading}
      >
        <ActivityList />
      </WidgetCard>
    </WidgetGrid>
  );
}
```

### WidgetCard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | - | Widget heading |
| `subtitle` | string | - | Secondary text |
| `icon` | Component | - | Lucide icon component |
| `accent` | string | 'navy' | Top border color: navy, teal, orange, red, green, blue, purple |
| `action` | object | - | `{ label, onClick }` for header action button |
| `isLoading` | boolean | false | Shows loading spinner |
| `isEmpty` | boolean | false | Shows empty state |
| `emptyMessage` | string | 'No data available' | Empty state message |
| `error` | string | - | Error message to display |
| `onClick` | function | - | Makes entire card clickable |
| `noPadding` | boolean | false | Removes content padding |

### Sub-components

- **`WidgetHeader`** - Standalone header for custom layouts
- **`WidgetGrid`** - Responsive grid for widget collections

---

## 3. Stat Widget (`StatWidget`)

**Purpose:** Consistent statistic/metric display for dashboards.

**When to use:** KPIs, metrics, numeric displays, stat cards.

```jsx
import { StatWidget, StatWidgetGrid } from '../ui';

function Stats() {
  return (
    <StatWidgetGrid>
      <StatWidget
        label="Tasks Completed"
        value="8/10"
        icon={CheckCircle}
        accent="teal"
        trend={12}
        trendLabel="vs last week"
        onClick={() => navigate('/tasks')}
      />
      
      <StatWidget
        label="Current Streak"
        value="7 days"
        icon={Flame}
        accent="orange"
      />
    </StatWidgetGrid>
  );
}
```

### StatWidget Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | required | Metric description |
| `value` | string/number | required | The stat value |
| `icon` | Component | - | Lucide icon component |
| `accent` | string | 'navy' | Color theme |
| `trend` | number | - | Percentage change (+ or -) |
| `trendLabel` | string | - | Context for trend ("vs last month") |
| `variant` | string | 'default' | Size: default, compact, large |
| `onClick` | function | - | Makes stat clickable |

### Sub-components

- **`StatWidgetGrid`** - Responsive grid for stat collections

---

## 4. Form Field (`FormField`)

**Purpose:** Consistent form field layout with label, input, error, and help text.

**When to use:** All form inputs.

```jsx
import { FormField, FormSection, FormActions, Input, Button } from '../ui';

function MyForm() {
  return (
    <form onSubmit={handleSubmit}>
      <FormSection title="Personal Information" description="Your basic details">
        <FormField 
          label="Email" 
          required 
          error={errors.email}
          help="We'll never share your email"
        >
          <Input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </FormField>
        
        <FormField label="Bio">
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} />
        </FormField>
      </FormSection>
      
      <FormActions>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </FormActions>
    </form>
  );
}
```

### FormField Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Field label |
| `required` | boolean | false | Shows asterisk |
| `error` | string | - | Error message |
| `help` | string | - | Help text (hidden when error shown) |
| `layout` | string | 'vertical' | 'vertical' or 'horizontal' |
| `htmlFor` | string | - | For accessibility |

### Sub-components

- **`FormSection`** - Groups related fields with title
- **`FormActions`** - Container for submit/cancel buttons

---

## 5. Loading States (`LoadingState`)

**Purpose:** Consistent loading indicators and skeletons.

**When to use:** Any async data loading.

```jsx
import { LoadingState, Skeleton, SkeletonCard } from '../ui';

// Full container loading
{isLoading && <LoadingState message="Loading dashboard..." />}

// Full page loading
{isLoading && <LoadingState fullPage message="Initializing..." />}

// Skeleton loading
{isLoading ? (
  <div className="space-y-4">
    <SkeletonCard />
    <SkeletonCard />
  </div>
) : (
  <ActualContent />
)}

// Custom skeleton
<Skeleton className="h-40 w-full rounded-xl" />
```

### LoadingState Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `message` | string | - | Loading message |
| `size` | string | 'md' | Size: sm, md, lg |
| `fullPage` | boolean | false | Full viewport overlay |

### Skeleton Components

- **`Skeleton`** - Base shimmer element
- **`SkeletonCard`** - Pre-built card skeleton
- **`SkeletonStat`** - Pre-built stat widget skeleton
- **`SkeletonList`** - Pre-built list skeleton

---

## Accent Colors

All layout components support these accent colors:

| Accent | Use Case |
|--------|----------|
| `navy` | Default, primary actions |
| `teal` | Success, completion, positive |
| `orange` | Warnings, attention, actions |
| `red` | Errors, danger, critical |
| `green` | Growth, success |
| `blue` | Information |
| `purple` | Premium, special features |
| `yellow` | Highlights, caution |

---

## Architecture Checks

The deploy script automatically validates layout compliance:

1. **PageLayout adoption** - Main screens should use PageLayout
2. **Rogue StatCard definitions** - Use StatWidget instead
3. **Rogue loading definitions** - Use LoadingState instead
4. **WidgetCard adoption** - New widgets should use WidgetCard

Run manually:
```bash
./scripts/ui-architecture-check.sh
```

---

## Migration Guide

### From custom StatCard to StatWidget

**Before:**
```jsx
const StatCard = ({ label, value, color }) => (
  <div className="p-4 rounded-xl border" style={{ borderColor: color }}>
    <p className="text-xs">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);
```

**After:**
```jsx
import { StatWidget } from '../ui';

<StatWidget 
  label={label} 
  value={value} 
  accent="teal" 
  icon={TrendingUp}
/>
```

### From inline loading to LoadingState

**Before:**
```jsx
{isLoading && (
  <div className="flex justify-center py-8">
    <Loader className="animate-spin" />
  </div>
)}
```

**After:**
```jsx
import { LoadingState } from '../ui';

{isLoading && <LoadingState />}
```

---

## Questions?

See the component source files for full implementation details:
- `src/components/ui/PageLayout.jsx`
- `src/components/ui/WidgetCard.jsx`
- `src/components/ui/StatWidget.jsx`
- `src/components/ui/FormField.jsx`
- `src/components/ui/LoadingState.jsx`
