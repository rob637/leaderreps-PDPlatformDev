# UI Component Library

## 🏛️ World Class Architecture

This is the **canonical UI component library** for the LeaderReps platform. All UI components should be imported from this directory.

## 📦 Available Components

### Core Components
| Component | Import | Usage |
|-----------|--------|-------|
| `Button` | `import { Button } from '@ui'` | All buttons |
| `Card` | `import { Card } from '@ui'` | Content containers |
| `Input` | `import { Input } from '@ui'` | Text inputs |
| `Checkbox` | `import { Checkbox } from '@ui'` | Checkboxes |
| `Badge` | `import { Badge } from '@ui'` | Status badges |
| `Modal` | `import { Modal } from '@ui'` | Modal dialogs |
| `Tooltip` | `import { Tooltip } from '@ui'` | Tooltips |
| `ProgressBar` | `import { ProgressBar } from '@ui'` | Progress indicators |
| `LoadingState` | `import { LoadingState } from '@ui'` | Loading states (preferred) |
| `LoadingSpinner` | `import { LoadingSpinner } from '@ui'` | Simple spinner |
| `Select` | `import { Select } from '@ui'` | Dropdowns |
| `Alert` | `import { Alert } from '@ui'` | Alert messages |

### Typography Components
| Component | Import | Usage |
|-----------|--------|-------|
| `Heading` | `import { Heading } from '@ui'` | All headings (h1-h6) |
| `Text` | `import { Text } from '@ui'` | Body text with variants |
| `PageHeader` | `import { PageHeader } from '@ui'` | Page title + description |

### Layout Components
| Component | Import | Usage |
|-----------|--------|-------|
| `PageLayout` | `import { PageLayout } from '@ui'` | **Page wrapper with consistent header** |
| `PageSection` | `import { PageSection } from '@ui'` | Section container |
| `PageGrid` | `import { PageGrid } from '@ui'` | Responsive grid |
| `PageEmptyState` | `import { PageEmptyState } from '@ui'` | Empty state placeholder |

### Widget Components
| Component | Import | Usage |
|-----------|--------|-------|
| `WidgetCard` | `import { WidgetCard } from '@ui'` | Dashboard widgets |
| `WidgetGrid` | `import { WidgetGrid } from '@ui'` | Widget grid layout |
| `StatWidget` | `import { StatWidget } from '@ui'` | Stat display widgets |

### Data Components
| Component | Import | Usage |
|-----------|--------|-------|
| `DataTable` | `import { DataTable } from '@ui'` | Data tables |
| `Tabs` | `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@ui'` | Tabbed interfaces |
| `FilterBar` | `import { FilterBar, FilterSearch } from '@ui'` | Search/filter UI |
| `List, ListItem` | `import { List, ListItem } from '@ui'` | List displays |

### Form Components
| Component | Import | Usage |
|-----------|--------|-------|
| `FormField` | `import { FormField } from '@ui'` | Form field with label |
| `FormSection` | `import { FormSection } from '@ui'` | Form section grouping |
| `FormActions` | `import { FormActions } from '@ui'` | Form submit buttons |

### Utilities
| Utility | Import | Usage |
|---------|--------|-------|
| `cn` | `import { cn } from '@ui'` | Class name merging (clsx + tailwind-merge) |
| `designTokens` | `import tokens from '@ui/design-tokens'` | Design system values |

---

## 🎨 Design Tokens (Single Source of Truth)

Import from `design-tokens.js` for programmatic access to design values:

```jsx
import tokens from '../ui/design-tokens';

// Access values
tokens.colors.navy          // '#002E47'
tokens.typography.pageTitle // 'text-2xl md:text-3xl font-bold text-corporate-navy'
tokens.radius.card          // 'rounded-2xl'
```

### Standard Typography Classes
| Element | Tailwind Classes |
|---------|-----------------|
| Page Title | `text-2xl md:text-3xl font-bold text-corporate-navy` |
| Section Title | `text-xl font-bold text-corporate-navy` |
| Card Title | `text-lg font-semibold text-corporate-navy` |
| Subtitle | `text-sm text-slate-600` |
| Body | `text-sm text-slate-700` |
| Caption | `text-xs text-slate-500` |

### Standard Spacing
| Element | Classes |
|---------|---------|
| Page Padding | `p-4 sm:p-6 lg:p-8` |
| Section Gap | `gap-6 lg:gap-8` |
| Card Padding | `p-4 sm:p-5` |
| Button Gap | `gap-3` |

### Standard Border Radius
| Element | Class |
|---------|-------|
| Cards, Modals | `rounded-2xl` |
| Buttons, Inputs | `rounded-xl` |
| Small elements | `rounded-lg` |
| Circular | `rounded-full` |

---

## ✅ DO's

```jsx
// ✅ CORRECT: Import from canonical UI
import { Button, Card, PageLayout, LoadingState } from '../ui';

// ✅ CORRECT: Use PageLayout for all screens
<PageLayout 
  title="My Screen"
  subtitle="Description here"
  onNavigate={() => navigate('dashboard')}
>
  {/* content */}
</PageLayout>

// ✅ CORRECT: Use LoadingState for loading
if (isLoading) return <LoadingState message="Loading..." />;

// ✅ CORRECT: Use Modal for dialogs
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalHeader><ModalTitle>Title</ModalTitle></ModalHeader>
  <ModalBody>Content</ModalBody>
  <ModalFooter><Button>Close</Button></ModalFooter>
</Modal>

// ✅ CORRECT: Use Tailwind corporate colors
<div className="bg-corporate-navy text-white">
<span className="text-corporate-teal">
```

---

## ❌ DON'Ts

```jsx
// ❌ WRONG: Define your own Button/Card/LoadingSpinner
const Button = ({ children }) => <button>{children}</button>;
const LoadingSpinner = () => <div className="animate-spin">...</div>;

// ❌ WRONG: Inline modal implementation
<div className="fixed inset-0 bg-black/50">  // Use <Modal> instead!

// ❌ WRONG: Inconsistent typography
<h1 className="text-4xl">  // Some pages
<h1 className="text-2xl">  // Other pages - INCONSISTENT!

// ❌ WRONG: Hardcode corporate hex colors
<div style={{ backgroundColor: '#002E47' }}>
```

---

## 🎨 Corporate Color System

Use Tailwind classes, not hex values:

| Color | Tailwind Class | Hex |
|-------|----------------|-----|
| Navy | `text-corporate-navy`, `bg-corporate-navy` | `#002E47` |
| Teal | `text-corporate-teal`, `bg-corporate-teal` | `#47A88D` |
| Orange | `text-corporate-orange`, `bg-corporate-orange` | `#E04E1B` |

---

## 🔒 Enforcement

Architecture is enforced via:

1. **Pre-Deploy Check**: `./scripts/ui-architecture-check.sh` runs before deploy (15 checks)
2. **Deploy Scripts**: Both `deploy-dev.sh` and `deploy-test.sh` block on violations
3. **Code Review**: PRs should verify UI imports

### Architecture Checks Include:
- ✅ No rogue Button/Card definitions
- ✅ No deprecated imports
- ✅ Screen UI adoption rate (100%)
- ✅ No excessive hardcoded hex colors
- ✅ Typography adoption
- ✅ Service layer compliance
- ✅ PageLayout adoption
- ✅ No rogue StatCard/LoadingSpinner definitions
- ✅ WidgetCard adoption
- ✅ No rogue Modal implementations
- ✅ No inline table definitions
- ✅ No rogue Tab definitions
- ✅ Filter/List component availability

---

## 🏗️ Creating New Components

1. Create component in `src/components/ui/`
2. Export from `src/components/ui/index.js`
3. Use `cn()` utility for class merging
4. Follow design tokens for consistent styling
5. Add to README

```jsx
// NewComponent.jsx
import React from 'react';
import { cn } from '../../lib/utils';

export const NewComponent = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-2xl border border-slate-200 p-4", // Standard card pattern
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};
```

---

## 📋 Screen Implementation Checklist

When creating a new screen:

- [ ] Import `PageLayout` from `@ui`
- [ ] Wrap content in `<PageLayout title="..." subtitle="...">`
- [ ] Use `LoadingState` for loading states
- [ ] Use `Modal` for any dialogs
- [ ] Use `Button`, `Card`, `Input` from `@ui`
- [ ] Use corporate color classes (not hex values)
- [ ] Follow typography standards from design tokens
