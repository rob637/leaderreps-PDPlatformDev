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

// --- CONTEXT CREATION ---
// This context will be defined and provided in App.jsx, but needs a definition here for components to use.
const AppServiceContext = createContext(null);

// --- 1. CORE DATA HOOKS (MOCKED FOR LOCAL DEVELOPMENT/TESTING) ---
// In a real production environment, these functions would contain Firebase/Firestore logic.

export const usePDPData = (db, userId, isAuthReady) => {
    // FIX 1: Provide basic but non-null mock data for data provider to consume.
    const mockPdpData = useMemo(() => ({
        currentMonth: 1, 
        assessment: { selfRatings: { T1: 5, T2: 5, T3: 5, T4: 5, T5: 5 } }, 
        plan: [] 
    }), []);

    const updatePdpData = useCallback(async (updater) => { 
        console.log('Mock PDP Update triggered.'); 
        return true; 
    }, []); 

    const saveNewPlan = useCallback(async (plan) => { 
        console.log('Mock PDP Save triggered.'); 
        // In reality, this triggers a data refresh and populates pdpData in the context.
        return true; 
    }, []);
    
    return {
        pdpData: mockPdpData, 
        isLoading: false, // Must be false to prevent Dashboard hanging
        error: null, 
        updatePdpData, 
        saveNewPlan
    };
};

export const useCommitmentData = (db, userId, isAuthReady) => {
    // FIX 2: Provide default, safe commitment data.
    const mockCommitmentData = useMemo(() => ({
        active_commitments: [], 
        history: [],
        reflection_journal: '' 
    }), []);

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
    // FIX 3: Provide default, safe planning data.
    const mockPlanningData = useMemo(() => ({
        okrs: [], 
        last_premortem_decision: '2025-01-01' 
    }), []);
    
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


// --- 2. MAIN CONTEXT CONSUMER HOOK ---
// This hook provides ALL application services and data, consumed by all screens.
export function useAppServices() {
    // FIX 4: Use a default value to prevent crash if consumed outside of provider
    const context = useContext(AppServiceContext);
    if (context === undefined) {
        // Fallback or throw an error for debugging (depending on preference)
        console.error("useAppServices must be used within an AppServiceContext.Provider.");
        return { 
            isLoading: false, 
            LEADERSHIP_TIERS,
            // Provide no-op functions for safety
            navigate: () => {}, 
            // CRITICAL FIX 5: Corrected syntax error by replacing the misplaced ']' with '}'
            callSecureGeminiAPI: async () => ({ candidates: [{ content: { parts: [{ text: "API Not Configured" }] } }] }),
            hasGeminiKey: () => false,
            // ... rest of the mock defaults
        }; 
    }
    return context;
}

// --- 3. EXPORT FOR APP.JSX USE ---

// FIX 6: The App.jsx structure assumes the Context Provider logic is separate.
// We must export AppServicesProvider if it's meant to wrap the app. 
export function AppServicesProvider({ children }) {
    // NOTE: The actual Provider component logic is inside DataProvider in App.jsx,
    // which handles combining data hooks with Firebase context.
    return children;
}