// src/services/useAppServices.jsx
import React, { createContext, useContext, useMemo } from 'react';

// Default to serverless (production-safe). Use VITE_GEMINI_MODE=direct only for local dev.
const MODE =
  (import.meta.env?.VITE_GEMINI_MODE || globalThis?.window?.__GEMINI_MODE || 'serverless').trim(); // 'serverless' | 'direct'

// Dev-only key sources (never required in serverless)
const DIRECT_KEY = (
  import.meta.env?.VITE_GEMINI_KEY ||
  import.meta.env?.VITE_GEMINI_API_KEY ||     // tolerate either name locally
  globalThis?.window?.__GEMINI_API_KEY || ''  // optional window fallback in dev
).trim();

const DEFAULT_MODEL =
  (import.meta.env?.VITE_GEMINI_MODEL || globalThis?.window?.__GEMINI_MODEL || 'gemini-1.5-flash').trim();

const AppServicesContext = createContext(null);

export function useAppServices() {
  const ctx = useContext(AppServicesContext);
  if (!ctx) throw new Error('useAppServices must be used within <AppServicesProvider>');
  return ctx;
}

function createServiceValue() {
  // In serverless mode, browser never needs a key
  const hasGeminiKey = () => MODE === 'serverless' || Boolean(DIRECT_KEY);

  // Single AI entrypoint used by your screens
  const callSecureGeminiAPI = async (payload = {}) => {
    if (MODE === 'serverless') {
      // Hits Netlify Function at /.netlify/functions/gemini
      const res = await fetch('/.netlify/functions/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Serverless call failed (${res.status}): ${text || 'no body'}`);
      }
      return res.json();
    }

    // DIRECT mode (dev only; do not use in production)
    if (!DIRECT_KEY) {
      throw new Error('Direct mode selected but VITE_GEMINI_KEY/VITE_GEMINI_API_KEY is empty.');
    }

    const model = (payload.model || DEFAULT_MODEL).trim();

    // ✅ Use v1 (not v1beta), or you’ll get 404 “model not found for v1beta”
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${DIRECT_KEY}`;

    // ✅ v1 expects camelCase "systemInstruction"
    const body = {
      systemInstruction: payload.systemInstruction,
      contents: payload.contents,
    };
    if (payload.tools) body.tools = payload.tools; // optional

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`Gemini API error (${res.status}): ${text || 'no body'}`);
    }
    return JSON.parse(text || '{}');
  };

  // Stubs your UI depends on (unchanged)
  const updateCommitmentData = (commitment) => { console.log('Commitment Added:', commitment.title); return true; };
  const navigate = (path) => { console.log('Navigating to:', path); };

  return { callSecureGeminiAPI, hasGeminiKey, updateCommitmentData, navigate };
}

export function AppServicesProvider({ children }) {
  const services = useMemo(createServiceValue, []);
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}
