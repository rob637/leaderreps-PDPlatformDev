// src/services/useAppServices.jsx

import { useMemo, useCallback, useContext, createContext, useState, useEffect } from 'react';

// --- MOCK CONSTANTS (Kept for fallback/initial definitions) ---
const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const LEADERSHIP_TIERS_FALLBACK = {
    T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
    T5: { id: 'T5', name: 'Strategy & Vision', icon: 'TrendingUp', color: 'cyan-600' },
};

// --- CORE MOCK DATA DEFINITIONS (Used for local storage initialization) ---
const MOCK_PDP_DATA = { currentMonth: 1, assessment: { selfRatings: { T1: 5, T2: 5, T3: 5, T4: 5, T5: 5 } }, plan: [], practice_sessions: [] };
const MOCK_COMMITMENT_DATA = { active_commitments: [], history: [], reflection_journal: '', resilience_log: {} };
const MOCK_PLANNING_DATA = { okrs: [], last_premortem_decision: '2025-01-01', vision: '', mission: '' };
const MOCK_ACTIVITY_DATA = {
    daily_target_rep: "Define your rep.",
    identity_statement: "I am a principled leader.",
    total_reps_completed: 0, 
    total_coaching_labs: 0,    
    today_coaching_labs: 0,     
};

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

    // Constants & Mock Data Access (Used by Dashboard/DailyPractice)
    appId: 'default-app-id', 
    IconMap: {}, 
    GEMINI_MODEL, 
    API_KEY: '',
    LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK, 
    MOCK_ACTIVITY_DATA,
    // New Metadata Defaults
    COMMITMENT_BANK: {},
    QUICK_CHALLENGE_CATALOG: [],
    SCENARIO_CATALOG: [],
    READING_CATALOG_SERVICE: {},
    VIDEO_CATALOG: {},
    LEADERSHIP_DOMAINS: [],
    RESOURCE_LIBRARY: {},
};

// --- CONTEXT CREATION ---
export const AppServiceContext = createContext(null);

// ====================================================================
// --- 1. CORE DATA HOOKS (Functional Logic) ---
// Note: These hooks are simplified to use localStorage instead of Firebase 
// for the provided scope, but maintain the update pattern for future Firebase integration.
// ====================================================================

export const usePDPData = (db, userId, isAuthReady) => {
  const key = useMemo(() => `lrpdp_${userId || 'anon'}`, [userId]);

  const [pdpData, setPdpData] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : MOCK_PDP_DATA; // Use full mock for initial state
    } catch {
      return MOCK_PDP_DATA;
    }
  });

  useEffect(() => {
    try {
      if (pdpData === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(pdpData));
    } catch {}
  }, [key, pdpData]);

  const updatePdpData = useCallback(async (updater) => {
    setPdpData(prev => {
        const next = (typeof updater === 'function' ? updater(prev) : updater);
        return next ?? prev;
    });
    return true;
  }, []);

  const saveNewPlan = useCallback(async (plan) => {
    setPdpData(plan);
    try { localStorage.setItem(key, JSON.stringify(plan)); } catch {}
    return true;
  }, [key]);

  return { pdpData, isLoading: false, error: null, updatePdpData, saveNewPlan };
};


export const useCommitmentData = (db, userId, isAuthReady) => {
  const key = useMemo(() => `lrcommit_${userId || 'anon'}`, [userId]);

  const [commitmentData, setCommitmentData] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : MOCK_COMMITMENT_DATA;
    } catch {
      return MOCK_COMMITMENT_DATA;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(commitmentData));
    } catch {}
  }, [key, commitmentData]);

  const updateCommitmentData = useCallback(async (updater) => {
    setCommitmentData(prev => {
      const next = (typeof updater === 'function') ? updater(prev || MOCK_COMMITMENT_DATA) : updater;
      return next ?? prev;
    });
    return true;
  }, []);

  return {
    commitmentData,
    isLoading: false,
    error: null,
    updateCommitmentData,
  };
};

export const usePlanningData = (db, userId, isAuthReady) => {
    const key = useMemo(() => `lrplanning_${userId || 'anon'}`, [userId]);

    const [planningData, setPlanningData] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : MOCK_PLANNING_DATA;
        } catch {
            return MOCK_PLANNING_DATA;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(planningData));
        } catch {}
    }, [key, planningData]);

    const updatePlanningData = useCallback(async (updater) => { 
        setPlanningData(prev => {
            const next = (typeof updater === 'function') ? updater(prev || MOCK_PLANNING_DATA) : updater;
            return next ?? prev;
        });
        return true; 
    }, []);

    return {
        planningData, 
        isLoading: false, 
        error: null, 
        updatePlanningData
    };
};

// --- NEW HOOK FOR GLOBAL METADATA LOADING ---
export const useGlobalMetadata = (db, isAuthReady) => {
    // This hook simulates loading the necessary configuration data from Firestore (metadata/config)
    const [metadata, setMetadata] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // SIMULATION: In a real app, you would fetch Firestore document 'metadata/config' once.
        const simulateFetch = () => {
            // Since we successfully imported master_import.json, we simulate its structure here:
            // This simulation data must match the structure of master_import.json's metadata.config
            const MOCK_METADATA_FROM_FIRESTORE = {
                leadership_tiers: {
                    'T1': { id: 'T1', name: 'Self-Awareness', hex: '#2563EB' },
                    'T2': { id: 'T2', name: 'Operational Excellence', hex: '#06B6D4' },
                    'T3': { id: 'T3', name: 'Strategic Execution', hex: '#10B981' },
                    'T4': { id: 'T4', name: 'People Development', hex: '#F5A800' },
                    'T5': { id: 'T5', name: 'Visionary Leadership', hex: '#E04E1B' },
                },
                commitment_bank: { /* ... mock bank structure ... */ },
                quick_challenge_catalog: [{ rep: "Take a deep breath.", tier: "T1" }],
                scenario_library: [{ id: 1, title: "The Deflector", persona: "Deflector" }],
                video_library: { INSPIRATIONAL: [{ title: "Sinek" }] },
                leadership_domains: [{ id: "women-exec", title: "Women's Track" }],
                resource_library: { "women-exec": [{ title: "Playbook" }] },
                mock_activity_data: MOCK_ACTIVITY_DATA,
            };

            setMetadata({
                LEADERSHIP_TIERS: MOCK_METADATA_FROM_FIRESTORE.leadership_tiers,
                COMMITMENT_BANK: MOCK_METADATA_FROM_FIRESTORE.commitment_bank,
                QUICK_CHALLENGE_CATALOG: MOCK_METADATA_FROM_FIRESTORE.quick_challenge_catalog,
                SCENARIO_CATALOG: MOCK_METADATA_FROM_FIRESTORE.scenario_library,
                VIDEO_CATALOG: MOCK_METADATA_FROM_FIRESTORE.video_library,
                LEADERSHIP_DOMAINS: MOCK_METADATA_FROM_FIRESTORE.leadership_domains,
                RESOURCE_LIBRARY: MOCK_METADATA_FROM_FIRESTORE.resource_library,
                MOCK_ACTIVITY_DATA: MOCK_METADATA_FROM_FIRESTORE.mock_activity_data,
            });
            setLoading(false);
        };

        // Only fetch once authentication is ready (or immediately if using mock data)
        if (db || !isAuthReady) { 
            simulateFetch();
        }
    }, [db, isAuthReady]);

    return { metadata, isLoading: loading };
};


// ====================================================================
// --- 2. MAIN CONTEXT CONSUMER HOOK (Structural/Safety Change) ---
// ====================================================================

export function useAppServices() {
    const context = useContext(AppServiceContext);
    
    // CRITICAL FIX: Use the complete DEFAULT_SERVICES object as a fallback
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