// src/main.jsx
import './debug-overlay.js'; // must be first

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Small helper so we can print to the overlay
const log = (msg) => (window.__debugAppend ? window.__debugAppend(msg) : console.log(msg));

// -------- ErrorBoundary so crashes render text instead of white screen
class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { error: null } }
  static getDerivedStateFromError(error){ return { error } }
  componentDidCatch(error, info){ console.error('App crashed:', error, info); log('App crashed: ' + (error?.message || error)); }
  render(){
    if (this.state.error) {
      const msg = String(this.state.error?.stack || this.state.error?.message || this.state.error);
      return (
        <pre style={{whiteSpace:'pre-wrap',padding:16,background:'#111',color:'#eee',minHeight:'100vh',margin:0}}>
{msg}
        </pre>
      );
    }
    return this.props.children;
  }
}

// -------- Optional SmokeTest UI (?debug=1)
function SmokeTest(){
  return (
    <div style={{
      position:'fixed', inset:0, display:'grid', placeItems:'center',
      fontFamily:'system-ui, sans-serif', fontSize:32, fontWeight:700,
      background:'#0f172a', color:'#a7f3d0'
    }}>
      React mounted ✔ — SmokeTest
    </div>
  );
}

const params = new URLSearchParams(window.location.search);
const useSmoke = params.get('debug') === '1';
const showEnv  = params.get('debug') === 'env';

// -------- Env presence printer (?debug=env)
function printEnv() {
  const KEYS = [
    'VITE_FIREBASE_API_KEY','VITE_FIREBASE_AUTH_DOMAIN','VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET','VITE_FIREBASE_MESSAGING_SENDER_ID','VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID'
  ];
  log('--- Env presence (import.meta.env.*) ---');
  KEYS.forEach(k => {
    const val = import.meta.env[k];
    log(`${k}: ${val ? '✅ present' : '❌ MISSING'}`);
  });
}

// -------- Mount
const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML += '<pre style="padding:16px;background:#111;color:#eee">No #root element found in index.html</pre>';
} else {
  // Render either SmokeTest or App
  createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        {useSmoke ? <SmokeTest/> : <App/>}
      </ErrorBoundary>
    </React.StrictMode>
  );

  // Watchdog: if App rendered nothing, say so clearly
  if (!useSmoke) {
    setTimeout(() => {
      const text = (rootEl.textContent || '').trim();
      const html = (rootEl.innerHTML || '').trim();
      if (!text && !html) {
        log('⚠️ Watchdog: <App /> rendered nothing after 3s. Likely causes:');
        log('- Waiting on auth state with no fallback UI');
        log('- React Router has no matching <Route> for "/"');
        log('- Missing env vars (try adding ?debug=env)');
      }
      if (showEnv) printEnv();
    }, 3000);
  } else {
    if (showEnv) printEnv();
  }
}
