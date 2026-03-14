---
description: Create a new dashboard widget
---

Create a new widget component in `src/components/widgets/`.

Requirements:
1. Follow the widget pattern in `src/components/widgets/.instructions.md`
2. Use `useAppServices()` for data access
3. Wrap content in `<Card>` from `../ui` with title, icon, and accent props
4. Accept `helpText` prop
5. Guard render: return null if required data isn't ready
6. Use Tailwind for styling with dark mode support
7. Use `lucide-react` icons

Widget name: {{name}}
Widget purpose: {{purpose}}
Data source: {{dataSource}}
