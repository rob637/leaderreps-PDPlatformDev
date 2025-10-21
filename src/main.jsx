// IMPORTANT: run global notepad BEFORE anything else
import './globals/notepad.js';

import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppServicesProvider } from './services/useAppServices.jsx';

/**
 * Inject Firebase config from Vite env into a global BEFORE App loads.
 * Netlify env var must be ONE-LINE JSON, e.g.:
 * {"apiKey":"…","authDomain":"…","projectId":"…","appId":"…"}
 */
(function injectFirebaseConfig() {
  const raw = import.meta.env.VITE_FIREBASE_CONFIG;

  if (!raw) {
    // Flag the specific error so our ConfigGate can display it
    window.__firebase_config_error = 'VITE_FIREBASE_CONFIG is missing. Set it in Netlify → Site settings → Environment.';
    console.error(window.__firebase_config_error);
    return;
  }

  try {
    // Normal case: raw is a JSON string
    window.__firebase_config = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e1) {
    // Fallback: sanitize common issues (single quotes/newlines)
    try {
      const cleaned = String(raw).trim().replace(/(\r\n|\n|\r)/g, '').replace(/'/g, '"');
      window.__firebase_config = JSON.parse(cleaned);
      console.warn('VITE_FIREBASE_CONFIG required sanitizing (quotes/newlines). Parsed successfully.');
    } catch (e2) {
      window.__firebase_config_error = `VITE_FIREBASE_CONFIG is not valid JSON. Received: ${String(raw)}`;
      console.error(window.__firebase_config_error, '\nError:', e2);
    }
  }
})();

//** OPTIONAL: seed safe defaults so first-time visitors don't crash on missing globals */
// --- Safe defaults so first-time visitors don't crash on missing globals ---
(function seedSafeGlobals() {
  const DEFAULT_PDP_DATA = { profile: { name: '', tier: 'Beginner' }, plans: [], settings: {} };

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage ? localStorage.getItem('pdpData') : null;
      const parsed = raw ? JSON.parse(raw) : null;

      if (!window.pdpData) {
        window.pdpData = parsed || DEFAULT_PDP_DATA;
      }
    } catch (_) {
      window.pdpData = DEFAULT_PDP_DATA;
    }
  }
})(); // <-- don't forget this!