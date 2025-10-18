// main.jsx
import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; 

// --- START OF REQUIRED FIREBASE CONFIG INJECTION ---
// 1. Check for the environment variable exposed by Vite
const firebaseConfigString = import.meta.env.VITE_FIREBASE_CONFIG; 

if (firebaseConfigString) {
    // 2. Set the global variable that App.jsx looks for in its initialization logic.
    // This makes the config available globally *before* App.jsx is imported and executed.
    window.__firebase_config = firebaseConfigString;
} else {
    // Optional: Log an error if the configuration is missing, 
    // which helps debugging the "Initializing Authentication..." screen.
    console.error("VITE_FIREBASE_CONFIG is missing in the .env file or build process. Firebase will not initialize.");
}
// --- END OF REQUIRED FIREBASE CONFIG INJECTION ---

// Code-split App
const App = lazy(() => import('./App.jsx'));

const container = document.getElementById('root');
if (!container) {
  throw new Error("Root element with id 'root' not found. Ensure <div id=\"root\"></div> exists in index.html.");
}

createRoot(container).render(
  <React.StrictMode>
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <App />
    </Suspense>
  </React.StrictMode>
);