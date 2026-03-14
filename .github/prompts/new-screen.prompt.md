---
description: Create a new screen and register it in the app
---

Create a new screen for the LeaderReps PD Platform.

Steps:
1. Create `src/components/screens/{{ScreenName}}.jsx` following patterns in `src/components/screens/.instructions.md`
2. Add lazy import entry in `src/routing/ScreenRouter.jsx`
3. Add breadcrumb config in `src/config/breadcrumbConfig.js`
4. Use `useAppServices()` for data, `useFeatures()` for feature flags, access control hooks for permissions

Screen name: {{ScreenName}}
Screen purpose: {{purpose}}
Navigation key: {{navKey}}
