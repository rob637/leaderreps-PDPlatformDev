// src/services/useAppServices.jsx
import React, { createContext, useContext, useMemo, useState } from 'react';

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

// --- MOCK DATA FOR DASHBOARD CONSISTENCY ---
const MOCK_USER_DATA = {
    id: 'user-123',
    name: 'Jane Executive', 
    email: 'jane.executive@acme.com',
    firstLogin: false, // Set to 'true' to simulate a returning user ('Welcome back')
};

const MOCK_COMMITMENT_DATA = { 
    active_commitments: [
        { id: 1, status: 'Pending', linkedTier: 'T2' }, 
        { id: 2, status: 'Committed', linkedTier: 'T5' },
        { id: 3, status: 'Pending', linkedTier: 'T2' },
        { id: 4, status: 'Committed', linkedTier: 'T3' },
    ],
    history: [
        { date: '2025-10-14', score: '3/3', reflection: 'Perfect day!' },
        { date: '2025-10-15', score: '3/3', reflection: 'Perfect day!' },
        { date: '2025-10-16', score: '3/3', reflection: 'Perfect day!' },
        { date: '2025-10-17', score: '4/5', reflection: 'Missed one.' }, 
    ],
    resilience_log: { '2025-10-19': { energy: 4, focus: 7 } }
};

const MOCK_PDP_DATA = {
    currentMonth: 4,
    assessment: { selfRatings: { T1: 8, T2: 3, T3: 6, T4: 7, T5: 5 } }, 
    plan: [{month:'Current', theme: 'Mastering Strategy', requiredContent: []}]
};

const MOCK_PLANNING_DATA = {
    okrs: [
        { id: 1, objective: 'Improve Execution Quality', daysHeld: 45 },
        { id: 2, objective: 'Expand Market Share', daysHeld: 15 },
    ],
    last_premortem_decision: new Date('2025-10-10').toISOString(),
};

const LEADERSHIP_TIERS = {
    'T1': { id: 'T1', name: 'Self-Awareness', icon: 'Target', color: 'bg-blue-100 text-blue-700', hex: '#2563EB' },
    'T2': { id: 'T2', name: 'Operational Excellence', icon: 'Mic', color: 'bg-cyan-100 text-cyan-700', hex: '#06B6D4' },
    'T3': { id: 'T3', name: 'Strategic Execution', icon: 'Briefcase', color: 'bg-green-100 text-green-700', hex: '#10B981' },
    'T4': { id: 'T4', name: 'People Development', icon: 'Users', color: 'bg-yellow-100 text-yellow-700', hex: '#F5A800' },
    'T5': { id: 'T5', name: 'Visionary Leadership', icon: 'TrendingUp', color: 'bg-red-100 text-red-700', hex: '#E04E1B' },
};
// --- END MOCK DATA ---


function createServiceValue() {
  
  // NOTE: Initializing state with mock data needed by the Dashboard and other components
  const [commitmentData, setCommitmentData] = useState(MOCK_COMMITMENT_DATA);
  const [pdpData, setPdpData] = useState(MOCK_PDP_DATA);
  const [planningData, setPlanningData] = useState(MOCK_PLANNING_DATA);
  const [user, setUser] = useState(MOCK_USER_DATA);

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

  // --- MOCK DATA HANDLERS (Simulates persistence needed by Dashboard) ---
  const updateCommitmentData = async (updater) => {
    // Simulates an async DB update
    await new Promise(resolve => setTimeout(resolve, 300));
    setCommitmentData(prevData => {
        const newData = typeof updater === 'function' ? updater(prevData) : updater;
        console.log('COMMITMENT DATA MOCK WRITE:', newData);
        return { ...prevData, ...newData };
    });
    return true;
  };
  
  const updatePdpData = async (updater) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setPdpData(prevData => {
        const newData = typeof updater === 'function' ? updater(prevData) : updater;
        console.log('PDP DATA MOCK WRITE:', newData);
        return { ...prevData, ...newData };
    });
    return true;
  };

  const updatePlanningData = async (updater) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setPlanningData(prevData => {
        const newData = typeof updater === 'function' ? updater(prevData) : updater;
        console.log('PLANNING DATA MOCK WRITE:', newData);
        return { ...prevData, ...newData };
    });
    return true;
  };

  const navigate = (path) => { 
      // NOTE: This remains a console log placeholder. 
      console.log('MOCK NAVIGATION: Navigating to:', path); 
  };
  
  // NOTE: This value is mocked for the dashboard component's use
  const hasPendingDailyPractice = commitmentData.active_commitments.some(c => c.status === 'Pending');

  return { 
    callSecureGeminiAPI, 
    hasGeminiKey, 
    navigate, 
    
    // EXPOSED MOCK DATA FOR DASHBOARD
    user,
    commitmentData,
    pdpData,
    planningData,
    LEADERSHIP_TIERS, // Exposes the Tier definitions
    hasPendingDailyPractice,

    // EXPOSED DATA UPDATE FUNCTIONS
    updateCommitmentData,
    updatePdpData,
    updatePlanningData,

    // Expose default model name for consistency
    GEMINI_MODEL: DEFAULT_MODEL,
  };
}

export function AppServicesProvider({ children }) {
  // Memoize the value, but let the hooks inside manage their own state
  // We use useMemo here instead of simply calling createServiceValue so state is persistent across renders
  const services = useMemo(createServiceValue, []); 
  
  // Expose the services context to the children
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}