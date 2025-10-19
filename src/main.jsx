import './debug-overlay.js';  // must be first so it catches early crashes

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Simple error boundary so crashes render text instead of a white screen
class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { error: null } }
  static getDerivedStateFromError(error){ return { error } }
  componentDidCatch(error, info){ console.error('App crashed:', error, info); }
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

// Smoke-test UI you can force via ?debug=1
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

// Toggle with ?debug=1 to bypass <App />
const params = new URLSearchParams(window.location.search);
const useSmoke = params.get('debug') === '1';

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML += '<pre style="padding:16px;background:#111;color:#eee">No #root element found in index.html</pre>';
} else {
  createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        {useSmoke ? <SmokeTest/> : <App/>}
      </ErrorBoundary>
    </React.StrictMode>
  );
}
