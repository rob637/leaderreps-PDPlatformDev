# RepUp Standalone PWA

RepUp is a standalone Progressive Web App for Leadership Conditioning that shares the same Firebase backend and codebase as the main LeaderReps platform.

## Features

- **Reps Tab**: Track and manage leadership conditioning reps
- **Coach Tab**: AI-powered leadership coaching (uses the same `reppyCoach` Cloud Function)
- **Same Authentication**: Uses FirebaseAuth - users sign in with the same account as the main app
- **Shared Data**: All conditioning data syncs with the main LeaderReps platform
- **PWA Support**: Installable as a standalone app on mobile and desktop

## URLs

| Environment | URL |
|------------|-----|
| Dev | https://repup-dev.web.app |
| Test | https://repup-test.web.app |
| Production | TBD |

## Setup (One-time)

Before first deployment, create the Firebase Hosting sites:

### Dev Environment
```bash
firebase hosting:sites:create repup-dev --project leaderreps-pd-platform
```

### Test Environment
```bash
firebase hosting:sites:create repup-test --project leaderreps-test
```

## Deployment

### Deploy RepUp to Dev
```bash
npm run deploy:repup:dev
```

### Deploy RepUp to Test
```bash
npm run deploy:repup:test
```

## Architecture

RepUp shares the main codebase by using Vite's multi-page app feature:

```
/                    → index.html (main LeaderReps app)
/repup.html          → repup.html (RepUp standalone PWA)
```

Both apps share:
- `/src/services/` - Firebase services, conditioning service, etc.
- `/src/providers/` - DataProvider, TimeProvider, etc.
- `/src/components/` - Shared UI components
- `/src/hooks/` - Shared hooks (useDailyPlan, useAppServices, etc.)

RepUp-specific files:
- `repup.html` - HTML entry point
- `src/repup-main.jsx` - React entry point
- `src/RepUpApp.jsx` - Main app component
- `src/components/rep/RepUpCoach.jsx` - Coach tab component
- `public/repup-manifest.webmanifest` - PWA manifest

## Icons

RepUp uses custom icons located at:
- `/public/icons/repup-icon-192.png`
- `/public/icons/repup-icon-512.png`

To create custom RepUp icons, replace these files with your designed icons.

## PWA Installation

Users can install RepUp as a standalone app:

1. Navigate to the RepUp URL in a mobile browser
2. Tap "Add to Home Screen" (iOS) or "Install App" (Android/Chrome)
3. The app will install with the RepUp icon and name

## Development

To work on RepUp locally:

```bash
npm run dev
```

Then open `http://localhost:5173/repup.html` in your browser.

## Troubleshooting

### "repup.html not found in build"
Make sure `vite.config.mjs` includes the multi-page input:
```javascript
rollupOptions: {
  input: {
    main: './index.html',
    repup: './repup.html',
  },
  ...
}
```

### Firebase Hosting site not found
Create the hosting site first:
```bash
firebase hosting:sites:create repup-dev --project leaderreps-pd-platform
```
