# Contributing to LeaderReps Platform

## 🏛️ UI Architecture Guidelines

This project uses a **World Class UI Architecture** with a single source of truth for all UI components. **Please follow these guidelines strictly** to maintain code quality and prevent architectural drift.

---

## 📦 Before You Code

### 1. Read the UI Documentation
```bash
cat src/components/ui/README.md
```

### 2. Run Architecture Check
```bash
npm run lint:ui
```

---

## ✅ UI Component Rules

### Rule 1: Always Import from `@ui`

```jsx
// ✅ CORRECT
import { Button, Card, Heading, Text } from '../ui';
import { Button, Card } from '../../ui';

// ❌ WRONG - Will fail architecture check
import { Button } from '../shared/Button';
import { Card } from './MyLocalCard';
```

### Rule 2: Never Define Your Own Button/Card

```jsx
// ❌ WRONG - Will block deployment
const Button = ({ children }) => <button>{children}</button>;
const Card = ({ children }) => <div>{children}</div>;

// ✅ CORRECT - Use the canonical versions
import { Button, Card } from '../ui';
```

### Rule 3: Use Tailwind Corporate Colors

```jsx
// ✅ CORRECT
<div className="bg-corporate-navy text-white">
<span className="text-corporate-teal">

// ❌ WRONG
<div style={{ backgroundColor: '#0B3B5B' }}>
<span style={{ color: '#47A88D' }}>
```

### Rule 4: Use Typography Components

```jsx
// ✅ CORRECT
import { Heading, Text, PageHeader } from '../ui';

<PageHeader title="Dashboard" description="Welcome back!" />
<Heading level="h2" variant="section">Settings</Heading>
<Text variant="muted">Last updated today</Text>

// ❌ AVOID
<h1 className="text-3xl font-bold text-corporate-navy">Dashboard</h1>
<p className="text-slate-500">Welcome back!</p>
```

---

## 🏗️ Creating New Screens

When creating a new screen component:

```jsx
// src/components/screens/features/MyNewScreen.jsx
import React from 'react';
import { Card, PageHeader, Button, Text } from '../../ui';

const MyNewScreen = () => (
  <div className="p-8 max-w-6xl mx-auto">
    <PageHeader 
      title="My New Feature" 
      description="Description of the feature" 
    />
    <Card>
      <div className="p-6">
        <Text>Content goes here</Text>
        <Button variant="primary">Action</Button>
      </div>
    </Card>
  </div>
);

export default MyNewScreen;
```

---

## 🔧 Creating New UI Components

If you need a new reusable component:

1. **Create it in `src/components/ui/`**
2. **Export from `src/components/ui/index.js`**
3. **Use the `cn()` utility for class merging**

```jsx
// src/components/ui/NewWidget.jsx
import React from 'react';
import { cn } from '../../lib/utils';

export const NewWidget = ({ className, children, ...props }) => {
  return (
    <div className={cn("base-tailwind-classes", className)} {...props}>
      {children}
    </div>
  );
};

// Then add to index.js:
export { NewWidget } from './NewWidget';
```

---

## 🔒 Enforcement

Architecture is enforced at multiple levels:

| Level | Tool | Blocks Deploy? |
|-------|------|----------------|
| Editor | ESLint `no-restricted-imports` | ⚠️ Warning |
| Pre-commit | `npm run precommit` | ❌ If errors |
| Pre-deploy | `./scripts/ui-architecture-check.sh` | ❌ If errors |

---

## 📋 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] `npm run lint:ui` passes with no errors
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] New screens import from `@ui` (not local components)
- [ ] No hardcoded corporate hex colors
- [ ] Typography uses `<Heading>`, `<Text>`, `<PageHeader>` where possible

---

## 🚀 Deployment

Deployment scripts automatically run architecture checks:

```bash
# These will FAIL if architecture violations exist
./deploy-dev.sh "commit message"
./deploy-test.sh "commit message"
```

---

## ❓ FAQ

**Q: Can I create local components for my feature?**
A: Yes, but they must re-export from `@ui`:
```jsx
// myfeature/MyFeatureComponents.jsx
export { Button, Card } from '../../ui';
export const MySpecialWidget = () => { ... };
```

**Q: What if I need to override a component's styles?**
A: Use the `className` prop with `cn()`:
```jsx
<Button className="bg-purple-600 hover:bg-purple-700">Custom</Button>
```

**Q: The architecture check is blocking my deploy but I need to ship!**
A: Fix the violations first. There are no exceptions. This prevents future technical debt.
