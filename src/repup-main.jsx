// src/repup-main.jsx
// Entry point for the standalone RepUp PWA

import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import ErrorBoundary from './components/system/ErrorBoundary';
import ConfigGate from './components/system/ConfigGate';

// === CAPTURE PWA INSTALL PROMPT EARLY ===
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPWAPrompt = e;
  window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
});

window.addEventListener('appinstalled', () => {
  window.deferredPWAPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-installed'));
});
// === END PWA INSTALL PROMPT CAPTURE ===

const RepUpApp = lazy(() => import('./RepUpApp'));

const container = document.getElementById('repup-root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigGate>
        <Suspense fallback={
          <div className="min-h-screen bg-gradient-to-br from-corporate-navy to-corporate-teal flex flex-col items-center justify-center text-white">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <p className="mt-4 text-lg font-semibold">RepUp</p>
            <p className="mt-1 text-sm opacity-80">Loading...</p>
          </div>
        }>
          <RepUpApp />
        </Suspense>
      </ConfigGate>
    </ErrorBoundary>
  </React.StrictMode>
);
