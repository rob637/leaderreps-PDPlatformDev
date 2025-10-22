// src/services/useAppServices.jsx
/* eslint-disable no-console */
import React from 'react';

const DEFAULT_MODEL = 'gemini-1.5-flash';

export function useAppServices() {
  const MODE = import.meta.env.VITE_GEMINI_MODE || 'serverless';
  const DIRECT_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

  const hasGeminiKey = () =>
    (typeof window !== 'undefined' && typeof window.__callSecureGeminiAPI === 'function')
    || MODE === 'serverless'
    || Boolean(DIRECT_KEY);

  const callSecureGeminiAPI = async (payload = {}) => {
    // 1) Prefer the window bridge created in App.jsx
    if (typeof window !== 'undefined' && typeof window.__callSecureGeminiAPI === 'function') {
      return await window.__callSecureGeminiAPI(payload);
    }

    // 2) Serverless proxy (Netlify function)
    if (MODE === 'serverless') {
      const res = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: DEFAULT_MODEL, ...payload }),
      });
      if (!res.ok) throw new Error(`Serverless call failed: ${res.status}`);
      return await res.json();
    }

    // 3) Direct REST call (only if you intentionally want to call Google directly from the browser)
    if (DIRECT_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1/models/${DEFAULT_MODEL}:generateContent?key=${DIRECT_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Direct call failed: ${res.status}`);
      return await res.json();
    }

    throw new Error('No Gemini configuration detected');
  };

  const navigate = (path, params) => {
    if (typeof window !== 'undefined' && typeof window.__appNavigate === 'function') {
      window.__appNavigate(path, params);
    } else {
      console.log('MOCK NAVIGATION:', path, params);
    }
  };

  return {
    callSecureGeminiAPI,
    hasGeminiKey,
    navigate,
    GEMINI_MODEL: DEFAULT_MODEL,
  };
}

// Keep as a pass-through so main.jsx can wrap <App />
export function AppServicesProvider({ children }) {
  return <>{children}</>;
}
