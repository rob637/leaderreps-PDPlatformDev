// src/services/useAppServices.jsx
import React, { createContext, useContext, useMemo } from 'react';

// Serverless is the default (recommended). Set VITE_GEMINI_MODE=direct only for local dev.
const MODE = import.meta.env.VITE_GEMINI_MODE || 'serverless'; // 'serverless' | 'direct'
const DIRECT_KEY = import.meta.env.VITE_GEMINI_KEY || '';      // Only used in 'direct' mode

const AppServicesContext = createContext(null);

export function useAppServices() {
  const ctx = useContext(AppServicesContext);
  if (!ctx) throw new Error('useAppServices must be used within <AppServicesProvider>');
  return ctx;
}

function createServiceValue() {
  // If we're in serverless mode, we don't need a browser key at all.
  const hasGeminiKey = () => MODE === 'serverless' || Boolean(DIRECT_KEY);

  // This is the *only* function your UI should call for AI:
  const callSecureGeminiAPI = async (payload) => {
    if (MODE === 'serverless') {
      // Hits a Netlify function (see gemini.js below)
      const res = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Serverless call failed (${res.status}): ${text || 'no body'}`);
      }
      return await res.json();
    }

    // DIRECT mode (dev only; never commit/use in production)
    if (!DIRECT_KEY) throw new Error('Direct mode selected but VITE_GEMINI_KEY is empty.');
    const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${DIRECT_KEY}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Pass through your existing shape: { systemInstruction, contents, tools }
      body: JSON.stringify({
        system_instruction: payload.systemInstruction,
        contents: payload.contents,
        tools: payload.tools,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Gemini API error (${res.status}): ${text || 'no body'}`);
    }
    return await res.json();
  };

  // Mocked stubs you already depend on
  const updateCommitmentData = (commitment) => { console.log('Commitment Added:', commitment.title); return true; };
  const navigate = (path) => { console.log('Navigating to:', path); };

  return { callSecureGeminiAPI, hasGeminiKey, updateCommitmentData, navigate };
}

export function AppServicesProvider({ children }) {
  const services = useMemo(createServiceValue, []);
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}
