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
| `LoadingSpinner` | `import { LoadingSpinner } from '@ui'` | Loading states |
| `Select` | `import { Select } from '@ui'` | Dropdowns |
| `Alert` | `import { Alert } from '@ui'` | Alert messages |

### Typography Components
| Component | Import | Usage |
|-----------|--------|-------|
| `Heading` | `import { Heading } from '@ui'` | All headings (h1-h6) |
| `Text` | `import { Text } from '@ui'` | Body text with variants |
| `PageHeader` | `import { PageHeader } from '@ui'` | Page title + description |

### Utilities
| Utility | Import | Usage |
|---------|--------|-------|
| `cn` | `import { cn } from '@ui'` | Class name merging (clsx + tailwind-merge) |

---

## ✅ DO's

```jsx
// ✅ CORRECT: Import from canonical UI
import { Button, Card, Heading } from '../ui';
import { Button, Card } from '../../ui';

// ✅ CORRECT: Use Typography components
<Heading level="h1" variant="page">Dashboard</Heading>
<Text variant="muted">Welcome back!</Text>

// ✅ CORRECT: Use Tailwind corporate colors
<div className="bg-corporate-navy text-white">
<span className="text-corporate-teal">

// ✅ CORRECT: Extend UI in feature-specific wrappers
// In developmentplan/DevPlanComponents.jsx:
export { Button, Card } from '../../ui';
export const ProgressBar = () => { /* custom */ };
```

---

## ❌ DON'Ts

```jsx
// ❌ WRONG: Define your own Button/Card
const Button = ({ children }) => <button>{children}</button>;
const Card = ({ children }) => <div className="...">{children}</div>;

// ❌ WRONG: Import from deprecated paths
import { Button } from '../shared/Button';
import { Card } from '../shared/UI';
import { Button } from '../../uiKit';

// ❌ WRONG: Hardcode corporate hex colors
<div style={{ backgroundColor: '#0B3B5B' }}>
<span style={{ color: '#47A88D' }}>

// ❌ WRONG: Create "implicit cards" with raw divs
<div className="bg-white p-6 rounded-xl shadow-sm border">
```

---

## 🎨 Corporate Color System

Use Tailwind classes, not hex values:

| Color | Tailwind Class | Hex |
|-------|----------------|-----|
| Navy | `text-corporate-navy`, `bg-corporate-navy` | `#0B3B5B` |
| Teal | `text-corporate-teal`, `bg-corporate-teal` | `#47A88D` |
| Orange | `text-corporate-orange`, `bg-corporate-orange` | `#E04E1B` |

---

## 🔒 Enforcement

Architecture is enforced via:

1. **ESLint Rule**: `no-restricted-imports` warns on deprecated paths
2. **Pre-Deploy Check**: `./scripts/ui-architecture-check.sh` runs before deploy
3. **Code Review**: PRs should verify UI imports

---

## 🏗️ Creating New Components

1. Create component in `src/components/ui/`
2. Export from `src/components/ui/index.js`
3. Use `cn()` utility for class merging
4. Follow existing patterns (see `Button.jsx`, `Card.jsx`)

```jsx
// NewComponent.jsx
import React from 'react';
import { cn } from '../../lib/utils';

export const NewComponent = ({ className, children, ...props }) => {
  return (
    <div className={cn("base-styles", className)} {...props}>
      {children}
    </div>
  );
};
```

---

## 📋 Feature-Specific Extensions

For domain-specific components, create a wrapper file that re-exports from `@ui`:

```jsx
// screens/myfeature/MyFeatureComponents.jsx
export { Button, Card, Badge } from '../../ui';

// Add feature-specific components
export const FeatureSpecificWidget = () => { ... };
```

This maintains the single source of truth while allowing extensions.
