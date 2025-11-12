import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// FIX: Removed the unnecessary import of AppServicesProvider since DataProvider is used in App.jsx.
// import { AppServicesProvider } from './services/useAppServices.jsx'; 

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

/** Error boundary so crashes don’t white-screen */
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(err, info) { console.error('App crash:', err, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, maxWidth: 720, margin: '48px auto', lineHeight: 1.5 }}>
          <h2>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f8fa', padding: 12, borderRadius: 8 }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Parse Firebase config from Vite env (one-line JSON). Show a friendly screen if missing. */
function ConfigGate({ children }) {
  // NOTE: This config reading logic relies on Vite's import.meta.env, 
  // which works even when hosted on GitHub Pages after a Vite build.
  const raw = import.meta.env.VITE_FIREBASE_CONFIG;
  let cfg = null, err = null;
  
  if (!raw) {
    // Since we are moving from Netlify to a GitHub Pages/Vite pipeline, the VITE_FIREBASE_CONFIG 
    // must be injected either via a CI tool (like GitHub Actions) or a manual placeholder.
    // However, for Vite build to complete successfully, the placeholder must often resolve.
    // We will leave this warning for debugging the build environment variables.
    err = 'VITE_FIREBASE_CONFIG is missing. Set it in your CI/Build environment variables.';
  } else {
    try {
      cfg = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e1) {
      try {
        const cleaned = String(raw).trim().replace(/(\r\n|\n|\r)/g, '').replace(/'/g, '"');
        cfg = JSON.parse(cleaned);
        console.warn('VITE_FIREBASE_CONFIG required sanitizing; parsed successfully.');
      } catch (e2) {
        err = 'VITE_FIREBASE_CONFIG is not valid JSON.';
      }
    }
  }

  const required = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missing = cfg ? required.filter(k => !cfg[k]) : required;

  if (err || missing.length) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: '48px auto', lineHeight: 1.6 }}>
        <h2>App not configured</h2>
        <p>The site is missing required Firebase configuration, so the app can’t start. Add this one-line JSON:</p>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f8fa', padding: 12, borderRadius: 8 }}>
{`VITE_FIREBASE_CONFIG={"apiKey":"…","authDomain":"…","projectId":"…","appId":"…","storageBucket":"…","messagingSenderId":"…"}
`}
        </pre>
        {err && <p style={{ color: '#b00020' }}><strong>Error:</strong> {err}</p>}
        {missing && missing.length > 0 && <p><strong>Missing keys:</strong> {missing.join(', ')}</p>}
      </div>
    );
  }

  // Expose for clients that read from window (optional)
  if (typeof window !== 'undefined') window.__firebase_config = cfg;

  return children;
}

const App = lazy(() => import('./App.jsx')); // default export assumed

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element with id="root" not found. Ensure <div id="root"></div> exists in index.html.');
}

// 1. Register the Service Worker right away
registerServiceWorker(); 

createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigGate>
        {/* FIX: Removed the superfluous AppServicesProvider wrapper around the App component */}
        <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
          <App />
        </Suspense>
      </ConfigGate>
    </ErrorBoundary>
  </React.StrictMode>
);