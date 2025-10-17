// main.jsx
import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // must include your Tailwind @tailwind directives

// Code-split App to keep initial bundle smaller
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