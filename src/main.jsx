// IMPORTANT: run global notepad BEFORE anything else 
import './globals/notepad.js';

import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

/**
 * Inject Firebase config from Vite env into a global BEFORE App loads.
 * Netlify env var must be ONE-LINE JSON, e.g.:
 * {"apiKey":"…","authDomain":"…","projectId":"…","appId":"…"}
 */
(function injectFirebaseConfig() {
  const raw = import.meta.env.VITE_FIREBASE_CONFIG;

  if (!raw) {
    console.error('VITE_FIREBASE_CONFIG is missing. Set it in Netlify → Site settings → Environment.');
    return;
  }

  try {
    // Normal case: raw is a JSON string
    window.__firebase_config = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e1) {
    // Fallback: sanitize common issues (single quotes/newlines)
    try {
      const cleaned = String(raw)
        .trim()
        .replace(/(\r\n|\n|\r)/g, '')
        .replace(/'/g, '"');
      window.__firebase_config = JSON.parse(cleaned);
      console.warn('VITE_FIREBASE_CONFIG required sanitizing (quotes/newlines). Parsed successfully.');
    } catch (e2) {
      console.error('VITE_FIREBASE_CONFIG is not valid JSON. Received:', raw, '\nError:', e2);
    }
  }
})();

// Lazy-load the app AFTER config injection
const App = lazy(() => import('./App.jsx'));

// Mount
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element with id="root" not found. Ensure <div id="root"></div> exists in index.html.');
}

createRoot(container).render(
  <React.StrictMode>
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <App />
    </Suspense>
  </React.StrictMode>
);