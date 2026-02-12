### React Error #130 Analysis Report

**1. Error Summary**

The application is throwing "Minified React error #130," which occurs when a component attempts to render `undefined`. This typically happens when a component that is expected to be a valid React element (like a function or a class) is `undefined` at render time. The error stack trace indicates the problem originates within a `<button>` element, which is deeply nested within the component tree and involves a `Suspense` boundary.

**2. Project Structure Overview**

The project is a React application built with Vite, using Firebase for backend services. The code is structured with a clear separation of components, services, routing, and configuration.

*   **`src/main.jsx`**: The application entry point. It sets up `React.StrictMode`, an `ErrorBoundary`, and a `Suspense` component to handle lazy-loaded components.
*   **`src/App.jsx`**: The root component that manages Firebase initialization, authentication, and top-level state. It conditionally renders the `AuthPanel` or the main `AppContent`.
*   **`src/routing/ScreenRouter.jsx`**: A router that uses `React.lazy` to dynamically import and render screen components based on the application's state.
*   **`src/components/`**: Contains UI components, separated into screens, layout, shared elements, etc.

**3. Relevant Source Code**

Here is the content of the key files involved in the rendering path leading to the error.

**`src/main.jsx`**
```jsx
import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import ErrorBoundary from './components/system/ErrorBoundary';
import ConfigGate from './components/system/ConfigGate';

console.log('🔍 [main.jsx] Starting application...');
console.log('🔍 [main.jsx] Import checks:');
console.log('  - ErrorBoundary:', typeof ErrorBoundary, ErrorBoundary);
console.log('  - ConfigGate:', typeof ConfigGate, ConfigGate);

if (typeof ErrorBoundary === 'undefined') {
  console.error('❌ [main.jsx] ErrorBoundary is UNDEFINED!');
}
if (typeof ConfigGate === 'undefined') {
  console.error('❌ [main.jsx] ConfigGate is UNDEFINED!');
}

// === PWA SERVICE WORKER REGISTRATION ===
const registerServiceWorker = () => {
  // Check if Service Workers are supported by the browser
  if ('serviceWorker' in navigator) {
    // Vite PWA plugin generates the worker as /sw.js in production build
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('SW registered successfully:', registration);
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  }
};
// === END PWA SERVICE WORKER REGISTRATION ===

console.log('🔍 [main.jsx] Lazy loading App component...');
const App = lazy(() => {
  console.log('🔍 [main.jsx] App lazy import triggered');
  return import('./App').then(module => {
    console.log('🔍 [main.jsx] App module loaded:', module);
    console.log('🔍 [main.jsx] App.default:', typeof module.default, module.default);
    if (typeof module.default === 'undefined') {
      console.error('❌ [main.jsx] App.default is UNDEFINED after import!');
    }
    return module;
  }).catch(err => {
    console.error('❌ [main.jsx] Error loading App:', err);
    throw err;
  });
});

const container = document.getElementById('root');
if (!container) {
  console.error('❌ [main.jsx] Root container not found!');
}
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigGate>
        <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
          <App />
        </Suspense>
      </ConfigGate>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register the service worker in production
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
}
```

**`src/App.jsx`**
```jsx
// src/App.jsx

import React, { useState, useEffect, useCallback, Suspense } from 'react';

// --- Core Services & Context ---
import {
  ensureUserDocs,
} from './services/ensureUserDocs.js';

// --- Firebase Imports (Authentication & Firestore) ---
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  setLogLevel,
} from 'firebase/firestore';

// --- UI/UX & Icons ---
import { Loader } from 'lucide-react';

// --- New Structure ---
import AuthPanel from './components/auth/AuthPanel.jsx';
import AppContent from './components/layout/AppContent.jsx';
import DataProvider from './providers/DataProvider.jsx';
import ConfigError from './components/system/ConfigError.jsx';

// 🔍 DEBUG: Log all imports to verify they're defined
console.log('🔍 [App.jsx] Import checks:');
console.log('  - AuthPanel:', typeof AuthPanel, AuthPanel);
console.log('  - AppContent:', typeof AppContent, AppContent);
console.log('  - DataProvider:', typeof DataProvider, DataProvider);
console.log('  - ConfigError:', typeof ConfigError, ConfigError);

// 🔍 DEBUG: Verify imports are not undefined
if (typeof AuthPanel === 'undefined') {
  console.error('❌ [App.jsx] AuthPanel is UNDEFINED!');
}
if (typeof AppContent === 'undefined') {
  console.error('❌ [App.jsx] AppContent is UNDEFINED!');
}
if (typeof DataProvider === 'undefined') {
  console.error('❌ [App.jsx] DataProvider is UNDEFINED!');
}
if (typeof ConfigError === 'undefined') {
  console.error('❌ [App.jsx] ConfigError is UNDEFINED!');
}


/* =========================================================
   MAIN APP COMPONENT
========================================================= */
function App() {
  const [firebaseConfig, setFirebaseConfig] = useState(null);
  const [firebaseServices, setFirebaseServices] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [navParams, setNavParams] = useState({});
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const config = typeof window.__FIREBASE_CONFIG__ !== 'undefined' ? window.__FIREBASE_CONFIG__ : undefined;
    if (config) {
      setFirebaseConfig(config);
      const app = initializeApp(config);
      const auth = getAuth(app);
      const db = getFirestore(app);
      setLogLevel('error');
      setFirebaseServices({ app, auth, db });
    }
  }, []);

  useEffect(() => {
    if (!firebaseServices) return;
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (user) {
        ensureUserDocs(firebaseServices.db, user.uid);
      }
    });
    return () => unsubscribe();
  }, [firebaseServices]);

  const navigate = useCallback((screen, params = {}) => {
    setCurrentScreen(screen);
    setNavParams(params);
  }, []);

  const isAuthRequired = !user && isAuthReady;

  console.log('🔍 [App.jsx] Render state:', {
    firebaseConfig: !!firebaseConfig,
    isAuthReady,
    user: !!user,
    isAuthRequired
  });

  if (!firebaseConfig) {
    console.log('🔍 [App.jsx] Rendering ConfigError');
    if (typeof ConfigError === 'undefined') {
      console.error('❌ [App.jsx] ConfigError is UNDEFINED at render time!');
      return <div>Error: ConfigError component is undefined</div>;
    }
    return <ConfigError message="Firebase configuration is missing." />;
  }

  if (!isAuthReady) {
    console.log('🔍 [App.jsx] Rendering loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-10 w-10 text-corporate-teal" />
      </div>
    );
  }

  console.log('🔍 [App.jsx] About to render main app');
  console.log('🔍 [App.jsx] Pre-render component checks:');
  console.log('  - DataProvider:', typeof DataProvider);
  console.log('  - AuthPanel:', typeof AuthPanel);
  console.log('  - AppContent:', typeof AppContent);

  if (typeof DataProvider === 'undefined') {
    console.error('❌ [App.jsx] DataProvider is UNDEFINED at render time!');
    return <div>Error: DataProvider component is undefined</div>;
  }

  if (isAuthRequired && typeof AuthPanel === 'undefined') {
    console.error('❌ [App.jsx] AuthPanel is UNDEFINED at render time!');
    return <div>Error: AuthPanel component is undefined</div>;
  }

  if (!isAuthRequired && typeof AppContent === 'undefined') {
    console.error('❌ [App.jsx] AppContent is UNDEFINED at render time!');
    return <div>Error: AppContent component is undefined</div>;
  }

  return (
    <DataProvider
      firebaseServices={firebaseServices}
      userId={user?.uid}
      isAuthReady={isAuthReady}
      navigate={navigate}
      user={user}
    >
      {isAuthRequired ? (
        <AuthPanel auth={firebaseServices.auth} onSuccess={() => {}} />
      ) : (
        <AppContent
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
          user={user}
          navParams={navParams}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          isAuthRequired={isAuthRequired}
          isNavExpanded={isNavExpanded}
          setIsNavExpanded={setIsNavExpanded}
          auth={firebaseServices.auth}
        />
      )}
    </DataProvider>
  );
}

export default App;
```

**`src/routing/ScreenRouter.jsx`**
```jsx
// src/routing/ScreenRouter.jsx

import React, { lazy, Suspense } from 'react';
import { MembershipGate } from '../components/ui/MembershipGate.jsx';

const ScreenMap = {
  'roadmap-tracker': lazy(() =>
    import('../components/screens/RoadmapTracker.jsx')
  ),
  dashboard: lazy(() => import('../components/screens/Dashboard.jsx')),
  'development-plan': lazy(() =>
    import('../components/screens/DevelopmentPlan.jsx')
  ),
  'coaching-lab': lazy(() => import('../components/screens/CoachingLabScreen.jsx')),
  'daily-practice': lazy(() =>
    import('../components/screens/DailyPractice.jsx')
  ),
  'planning-hub': lazy(() => import('../components/screens/PlanningHub.jsx')),
  'business-readings': lazy(() =>
    import('../components/screens/BusinessReadings.jsx')
  ),
  'quick-start-accelerator': lazy(() =>
    import('../components/screens/QuickStartAccelerator.jsx')
  ),
  'executive-reflection': lazy(() =>
    import('../components/screens/ExecutiveReflection.jsx')
  ),
  community: lazy(() => import('../components/screens/CommunityScreen.jsx')),
  'applied-leadership': lazy(() =>
    import('../components/screens/AppliedLeadership.jsx')
  ),
  'leadership-videos': lazy(() =>
    import('../components/screens/LeadershipVideos.jsx')
  ),
  'app-settings': lazy(() => import('../components/screens/AppSettings.jsx')),
  'membership-upgrade': lazy(() =>
    import('../components/screens/MembershipUpgrade.jsx')
  ),
  'admin-functions': lazy(() =>
    import('../components/screens/AdminFunctions.jsx')
  ),
  'data-maintenance': lazy(() =>
    import('../components/screens/AdminDataMaintenance.jsx')
  ),
  'debug-data': lazy(() => import('../components/screens/DebugDataViewer.jsx')),
  'membership-module': lazy(() =>
    import('../components/screens/MembershipModule.jsx')
  ),
};

const NotFoundScreen = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-red-600">Screen Not Found</h1>
    <p className="text-gray-700 mt-2">The requested screen does not exist.</p>
  </div>
);

const ScreenRouter = ({ currentScreen, navParams }) => {
  const Component = ScreenMap[currentScreen] || NotFoundScreen;
  
  // --- DEBUGGING ---
  console.log(`[ScreenRouter] Rendering screen: '${currentScreen}'`);
  if (Component) {
    console.log(`[ScreenRouter]   -> Component found:`, Component);
    if (typeof Component === 'undefined') {
      console.error(`❌ [ScreenRouter] CRITICAL: Component for '${currentScreen}' is UNDEFINED.`);
    }
  } else {
    console.warn(`[ScreenRouter]   -> No component found for '${currentScreen}'. Rendering NotFoundScreen.`);
  }
  // --- END DEBUGGING ---

  const screenTierRequirements = {
    'development-plan': 'basic',
    'business-readings': 'professional',
    'applied-leadership': 'professional',
  };

  const requiredTier = screenTierRequirements[currentScreen];
  
  const componentElement = (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <Component key={currentScreen} {...(navParams || {})} />
    </Suspense>
  );

  if (requiredTier) {
    return (
      <MembershipGate requiredTier={requiredTier} featureName={currentScreen}>
        {componentElement}
      </MembershipGate>
    );
  }

  return componentElement;
};


export default ScreenRouter;
```

**4. Hypothesis and Potential Root Cause**

The error is most likely caused by a **failed dynamic import** via `React.lazy`. When `import()` fails to resolve a module or the resolved module does not have a `default` export, `React.lazy` receives `undefined`, which React then tries to render, causing Error #130.

Given the stack trace includes `Suspense`, the error is happening within a lazy-loaded component. The `ScreenRouter.jsx` is the primary location for this pattern.

The problem could be one of the following:

1.  **Incorrect Export**: One of the screen components listed in `ScreenMap` in `ScreenRouter.jsx` is not using a `export default`. `React.lazy` requires the dynamically imported component to be a default export.
2.  **Circular Dependency**: A circular dependency between modules can lead to one of the modules being `undefined` when imported. For example, if `Dashboard.jsx` imports a utility that in turn imports something from `Dashboard.jsx` (or a component that uses it), it could create a loop.
3.  **Build Tool Issue (Vite)**: There might be an issue with how Vite is bundling the modules. The extensive logging added to the source files suggests this is a persistent and non-obvious problem, which can sometimes point to tooling or configuration issues. A corrupted cache in Vite could also be a culprit.
4.  **A Problem in a Child Component**: The error originates in a `<button>`. While the lazy-loaded screen component itself might be loading correctly, a component *rendered by that screen* could be the one that is `undefined`. For example, if `Dashboard.jsx` tries to render `<MyButton />` but `MyButton` was not imported correctly, it would be `undefined`.

**5. Recommended Next Steps for Investigation**

1.  **Verify Exports**: Manually check each file in `src/components/screens/` to ensure it has a `export default` statement for the main component.
2.  **Analyze the Failing Screen**: The `currentScreen` state in `App.jsx` defaults to `'dashboard'`. The investigation should start with `src/components/screens/Dashboard.jsx`. Examine all its imports and the components it renders, especially any that render a `<button>`.
3.  **Check for Circular Dependencies**: Use a tool like `madge` (`npx madge --circular src`) to detect circular dependencies in the project.
4.  **Isolate the Problem**: Try to simplify `ScreenRouter.jsx` by removing all but one route (e.g., the dashboard) to see if the error persists. If it goes away, add routes back one by one to find the problematic one.
5.  **Clear Caches**: Delete the `node_modules` directory and the `package-lock.json` file, then run `npm install`. Also, try starting the Vite dev server with the `--force` flag (`npm run dev -- --force`) to clear Vite's dependency cache.
