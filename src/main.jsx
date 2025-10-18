// src/main.jsx
import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// --- REQUIRED FIREBASE CONFIG INJECTION (parsed JSON) ---
const raw = import.meta.env.VITE_FIREBASE_CONFIG;
if (raw) {
  try {
    window.__firebase_config = JSON.parse(raw); // <-- make it an OBJECT
  } catch (e) {
    console.error('VITE_FIREBASE_CONFIG is not valid JSON:', e);
  }
} else {
  console.error('VITE_FIREBASE_CONFIG is missing. Firebase will not initialize.');
}
// --- END INJECTION ---

const App = lazy(() => import('./App.jsx'));

const container = document.getElementById('root');
if (!container) throw new Error('Missing <div id="root"></div> in index.html');

createRoot(container).render(
  <React.StrictMode>
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <App />
    </Suspense>
  </React.StrictMode>
);