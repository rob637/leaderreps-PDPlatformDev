// src/services/useAppServices.jsx

import { useMemo, useCallback, useContext, createContext, useState, useEffect } from 'react';

// --- MOCK CONSTANTS (Duplicated from App.jsx for independent hook compilation) ---
const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const LEADERSHIP_TIERS = {
    T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
    T2: { id: 'T2', name: 'Lead Work & Execution', icon: 'Briefcase', color: 'green-600' },
    T3: { id: 'T3', name: 'Lead People & Coaching', icon: 'Users', color: 'yellow-600' },
    T4: { id: 'T4', name: 'Conflict & Team Health', icon: 'AlertTriangle', color: 'red-600' },
    T5: { id: 'T5', name: 'Strategy & Vision', icon: 'TrendingUp', color: 'cyan-600' },
};

// --- CORE MOCK DATA DEFINITIONS (Derived from App.jsx's MOCK_DATA) ---
const MOCK_PDP_DATA = { currentMonth: 1, assessment: { selfRatings: { T1: 5, T2: 5, T3: 5, T4: 5, T5: 5 } }, plan: [] };
const MOCK_COMMITMENT_DATA = { active_commitments: [], history: [], reflection_journal: '' };
const MOCK_PLANNING_DATA = { okrs: [], last_premortem_decision: '2025-01-01' };

// --- 0. DEFAULT SERVICES FALLBACK (CRITICAL FIX for Destructuring Error) ---
const DEFAULT_SERVICES = {
    // Core Functions (No-op)
    navigate: () => { console.warn("Navigation called before context initialization."); },
    callSecureGeminiAPI: async () => ({ candidates: [{ content: { parts: [{ text: "API Not Configured" }] } }] }),
    updatePdpData: async () => true, 
    saveNewPlan: async () => true, 
    updateCommitmentData: async () => true, 
    updatePlanningData: async () => true,
    hasGeminiKey: () => false,
    
    // Core Data/State (Safe Defaults)
    user: null, 
    userId: null, 
    db: null, 
    auth: null, 
    isAuthReady: false,
    pdpData: MOCK_PDP_DATA, 
    commitmentData: MOCK_COMMITMENT_DATA, 
    planningData: MOCK_PLANNING_DATA, 
    isLoading: false, 
    error: null,
    hasPendingDailyPractice: false,

    // Constants
    appId: 'default-app-id', 
    IconMap: {}, 
    GEMINI_MODEL, 
    API_KEY: '',
    LEADERSHIP_TIERS, 
};

// --- CONTEXT CREATION ---
export const AppServiceContext = createContext(DEFAULT_SERVICES);

// ====================================================================
// --- 1. CORE DATA HOOKS (No Functional Change) ---
// ====================================================================
// Planning data hook (mock + local persistence)
export const usePlanningData = (db, userId, isAuthReady) => {
  const STORAGE_KEY = `lrpd:planning:${userId || 'anon'}`;

  // useState/useEffect must be imported at the top:
  // import { useMemo, useCallback, useContext, createContext, useState, useEffect } from 'react';

  const [planningData, setPlanningData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : MOCK_PLANNING_DATA;
    } catch {
      return MOCK_PLANNING_DATA;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(planningData)); } catch {}
  }, [STORAGE_KEY, planningData]);

  // Accepts either (prev) => next or a full object
  const updatePlanningData = useCallback(async (updater) => {
    setPlanningData(prev => (typeof updater === 'function' ? updater(prev) : updater) ?? prev);
    return true;
  }, []);

  return { planningData, isLoading: false, error: null, updatePlanningData };
};

export const usePDPData = (db, userId, isAuthReady) => {
 const key = useMemo(() => `lrpdp_${userId || 'anon'}`, [userId]);

  const [pdpData, setPdpData] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;        // null = no plan yet
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (pdpData === null) sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify(pdpData));
    } catch {/* ignore storage errors */}
  }, [key, pdpData]);

  const updatePdpData = useCallback(async (updater) => {
    setPdpData(prev => (typeof updater === 'function' ? updater(prev) : updater));
    return true;
  }, []);

  const saveNewPlan = useCallback(async (newPlan) => {
    const payload = Array.isArray(newPlan)
      ? { currentMonth: 1, assessment: { selfRatings: { T1:5, T2:5, T3:5, T4:5, T5:5 } }, plan: newPlan }
      : newPlan;
    setPdpData(payload);
    try { sessionStorage.setItem(key, JSON.stringify(payload)); } catch {}
    return true;
  }, [key]);

  return { pdpData, isLoading: false, error: null, updatePdpData, saveNewPlan };
};export const useCommitmentData = (db, userId, isAuthReady) => {
  const STORAGE_KEY = `lrpd:commitments:${userId || 'anon'}`;

  const [commitmentData, setCommitmentData] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : MOCK_COMMITMENT_DATA;
    } catch {
      return MOCK_COMMITMENT_DATA;
    }
  });

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(commitmentData));
    } catch {
      /* ignore quota errors */
    }
  }, [STORAGE_KEY, commitmentData]);

  // Updater API mirrors your current usage: accepts either a function(prev)=>next or a full object
  const updateCommitmentData = useCallback(async (updater) => {
    setCommitmentData(prev => {
      const next = (typeof updater === 'function') ? updater(prev) : updater;
      return next ?? prev;
    });
    return true; // keep your current callers happy
  }, []);

  return { commitmentData, isLoading: false, error: null, updateCommitmentData };
};
// ====================================================================
// --- 2. MAIN CONTEXT CONSUMER HOOK (Structural/Safety Change) ---
// ====================================================================

export function useAppServices() {
    const context = useContext(AppServiceContext);
    
    // CRITICAL FIX: Use the complete DEFAULT_SERVICES object as a fallback
    // to prevent destructuring errors when the component is not yet wrapped by the Provider.
    if (context === null || context === undefined) {
        console.error("useAppServices called outside AppServiceContext.Provider. Returning default services.");
        return DEFAULT_SERVICES; 
    }
    return context;
}

// ====================================================================
// --- 3. EXPORT FOR APP.JSX USE (No Functional Change) ---
// ====================================================================

export function AppServicesProvider({ children }) {
    // This is a placeholder since the actual provider logic lives in DataProvider in App.jsx
    return children;
}