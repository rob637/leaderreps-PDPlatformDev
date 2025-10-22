import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppServicesProvider } from './services/useAppServices.jsx'; // adjust path if needed

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
  const raw = import.meta.env.VITE_FIREBASE_CONFIG;
  let cfg = null, err = null;
  if (!raw) {
    err = 'VITE_FIREBASE_CONFIG is missing. Set it in Netlify → Site settings → Build & deploy → Environment.';
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

createRoot(container).render(
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

