// src/services/useAppServices.jsx

import { useMemo, useCallback, useContext, createContext } from 'react';

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
const AppServiceContext = createContext(null);

// ====================================================================
// --- 1. CORE DATA HOOKS (No Functional Change) ---
// ====================================================================

export const usePDPData = (db, userId, isAuthReady) => {
    const mockPdpData = useMemo(() => MOCK_PDP_DATA, []);

    const updatePdpData = useCallback(async (updater) => { 
        console.log('Mock PDP Update triggered.'); 
        return true; 
    }, []); 

    const saveNewPlan = useCallback(async (plan) => { 
        console.log('Mock PDP Save triggered.'); 
        return true; 
    }, []);
    
    return {
        pdpData: mockPdpData, 
        isLoading: false, 
        error: null, 
        updatePdpData, 
        saveNewPlan
    };
};

export const useCommitmentData = (db, userId, isAuthReady) => {
    const mockCommitmentData = useMemo(() => MOCK_COMMITMENT_DATA, []);

    const updateCommitmentData = useCallback(async (updater) => { 
        console.log('Mock Commitment Update triggered.'); 
        return true; 
    }, []);
    
    return {
        commitmentData: mockCommitmentData, 
        isLoading: false, 
        error: null, 
        updateCommitmentData
    };
};

export const usePlanningData = (db, userId, isAuthReady) => {
    const mockPlanningData = useMemo(() => MOCK_PLANNING_DATA, []);
    
    const updatePlanningData = useCallback(async (updater) => { 
        console.log('Mock Planning Update triggered.'); 
        return true; 
    }, []);

    return {
        planningData: mockPlanningData, 
        isLoading: false, 
        error: null, 
        updatePlanningData
    };
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