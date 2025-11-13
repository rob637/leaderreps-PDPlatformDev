// src/components/system/ConfigGate.jsx
import React from 'react';
import ConfigError from './ConfigError';

/** Parse Firebase config from Vite env (one-line JSON). Show a friendly screen if missing. */
function ConfigGate({ children }) {
  // NOTE: This config reading logic relies on Vite's import.meta.env, 
  // which works even when hosted on GitHub Pages after a Vite build.
  const raw = import.meta.env.VITE_FIREBASE_CONFIG;
  let cfg = null, err = null;
  
  if (!raw) {
    err = 'VITE_FIREBASE_CONFIG is not defined in the environment.';
  } else {
    try {
      cfg = JSON.parse(raw);
      window.__FIREBASE_CONFIG__ = cfg;
    } catch (e) {
      err = `Failed to parse VITE_FIREBASE_CONFIG: ${e.message}`;
    }
  }

  if (err) {
    console.error(err);
    return <ConfigError message={err} />;
  }

  return children;
}

export default ConfigGate;
