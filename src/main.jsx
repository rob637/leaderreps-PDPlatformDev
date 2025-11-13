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