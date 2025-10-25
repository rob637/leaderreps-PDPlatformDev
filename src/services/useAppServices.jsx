// src/services/useAppServices.jsx

import { useMemo, useCallback, useContext, createContext, useState, useEffect } from 'react';

// --- FIREBASE IMPORTS (Mocks for local execution, ready for real SDK) ---
// Note: In a live environment, using 'onSnapshot' directly (without the initial blocking 'getDoc' to check existence/seed) is the fastest way to render.
const mockGetDoc = async (docRef) => ({ exists: () => false, data: () => null, docRef });
const mockSetDoc = async (docRef, data) => { console.log(`[Firestore Mock] SET Document: ${docRef} Data:`, data); return true; };
const mockUpdateDoc = async (docRef, data) => { console.log(`[Firestore Mock] UPDATE Document: ${docRef} Data:`, data); return true; };
const mockOnSnapshot = (docRef, callback) => { 
    console.log(`[Firestore Mock] Subscribing to: ${docRef}`);
    
    // Simulate instantaneous local data availability or immediate response
    const key = docRef.split('/').pop(); 
    let initialData = JSON.parse(localStorage.getItem(`lr_seed_${key}`)); 
    if (key === 'config') initialData = JSON.parse(localStorage.getItem(`lr_seed_config`));
    
    if (initialData) {
        // Simulate immediate snapshot return (fastest path)
        callback({ exists: () => true, data: () => initialData });
    } else {
        // Simulate a slight network delay before returning mock data
        const timer = setTimeout(() => {
            // Use mock data to prevent errors if no local data exists
            callback({ exists: () => true, data: () => ({ /* minimal fallback structure */ }) });
        }, 50); // Reduced delay to 50ms for performance tuning
    }

    return () => { 
        // console.log(`[Firestore Mock] Unsubscribing from: ${docRef}`);
        // if (timer) clearTimeout(timer); // If we added a timer, clear it
    };
};
const mockDoc = (db, collection, doc) => `${db}/${collection}/${doc}`;


// --- MOCK CONSTANTS (Kept for fallback/initial definitions) ---
const GEMINI_MODEL = 'gemini-1.5-flash-latest';
const LEADERSHIP_TIERS_FALLBACK = {
    T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
    T5: { id: 'T5', name: 'Strategy & Vision', icon: 'TrendingUp', color: 'cyan-600' },
};

// --- CORE MOCK DATA DEFINITIONS (Used for local storage initialization/seeding) ---
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

// --- 0. DEFAULT SERVICES FALLBACK ---
const DEFAULT_SERVICES = {
    // ... (rest of DEFAULT_SERVICES structure remains the same) ...
    navigate: () => { console.warn("Navigation called before context initialization."); },
    callSecureGeminiAPI: async () => ({ candidates: [{ content: { parts: [{ text: "API Not Configured" }] } }] }),
    updatePdpData: async () => true, 
    saveNewPlan: async () => true, 
    updateCommitmentData: async () => true, 
    updatePlanningData: async () => true,
    updateGlobalMetadata: async () => true, // NEW: Mock update function
    hasGeminiKey: () => false,
    
    user: null, userId: null, db: null, auth: null, isAuthReady: false,
    pdpData: MOCK_PDP_DATA, commitmentData: MOCK_COMMITMENT_DATA, planningData: MOCK_PLANNING_DATA, 
    isLoading: false, error: null, hasPendingDailyPractice: false,
    appId: 'default-app-id', IconMap: {}, GEMINI_MODEL, API_KEY: '',
    LEADERSHIP_TIERS: LEADERSHIP_TIERS_FALLBACK, MOCK_ACTIVITY_DATA,
    COMMITMENT_BANK: {}, QUICK_CHALLENGE_CATALOG: [], SCENARIO_CATALOG: [],
    READING_CATALOG_SERVICE: {}, VIDEO_CATALOG: {}, LEADERSHIP_DOMAINS: [],
    RESOURCE_LIBRARY: {},
};

// --- CONTEXT CREATION ---
export const AppServiceContext = createContext(DEFAULT_SERVICES); // Initializing with default services

// ====================================================================
// --- 1. FIREBASE DATA HOOKS (Migrated from localStorage to Firestore logic) ---
// ====================================================================

// Base hook structure for loading and subscribing to a single user document
const useFirestoreData = (db, userId, isAuthReady, docName, mockData, keySuffix) => {
    const [data, setData] = useState(mockData);
    // CRITICAL FIX: Start loading as true, but resolve quickly via onSnapshot
    const [isLoading, setIsLoading] = useState(true); 
    const docPath = useMemo(() => mockDoc(db, 'users', userId) + `/${docName}`, [db, userId, docName]);

    useEffect(() => {
        // If not authenticated or no DB, exit quickly
        if (!isAuthReady || !userId || !db) {
            setIsLoading(false);
            return;
        }

        const docRef = docPath;

        // CRITICAL PERFORMANCE FIX: 
        // 1. Remove the blocking 'getDoc' check. We rely solely on the real-time listener ('onSnapshot').
        // 2. In a real app, if the document doesn't exist, the listener callback fires with doc.exists()=false, 
        //    and a separate cloud function would seed the data asynchronously.
        // 3. Here, we subscribe immediately and set the loading state to false on the *first* snapshot received, 
        //    even if it's empty.

        const unsubscribe = mockOnSnapshot(docRef, (doc) => {
            // This is the CRITICAL point: the first snapshot resolves the loading state.
            // The data structure (doc.data() or mockData) is used immediately.
            if (doc.exists()) {
                setData(doc.data());
            } else {
                // Document doesn't exist yet (or deleted) - use safe mock.
                // In a live app, the seeding happens in the background.
                setData(mockData); 
            }
            // Set loading to false after the first read resolves (Fastest possible load time)
            setIsLoading(false); 
        });

        // ADDED 5s TIMEOUT TOLERANCE
        const safetyTimer = setTimeout(() => {
             console.warn(`Firestore subscription timeout for ${docName}. Forcing load state to false.`);
             setIsLoading(false);
        }, 5000); // Increased from 1500ms to 5000ms

        return () => { 
            unsubscribe(); 
            clearTimeout(safetyTimer);
        };

    }, [db, userId, isAuthReady, docPath, docName, mockData]);
    
    // Function to handle atomic data updates via Firestore
    const updateData = useCallback(async (updater) => {
        const currentData = data;
        const newData = updater(currentData);
        
        // 5. Perform non-destructive write to Firestore
        const docRef = docPath;
        try {
             await mockUpdateDoc(docRef, newData); 
             return true;
        } catch (e) {
             console.error(`Firestore update failed for ${docName}:`, e);
             return false;
        }
    }, [data, docPath, docName]);

    return { data, isLoading, error: null, updateData, docPath };
}


// --- 1a. Commitment Data Hook ---
export const useCommitmentData = (db, userId, isAuthReady) => {
    const { data: commitmentData, isLoading, error, updateData: updateCommitmentData } = useFirestoreData(
        db, 
        userId, 
        isAuthReady, 
        'commitment_data/scorecard', // Firestore path suffix
        MOCK_COMMITMENT_DATA, 
        'commit'
    );
    
    return { commitmentData, isLoading, error, updateCommitmentData };
};


// --- 1b. PDP Data Hook ---
export const usePDPData = (db, userId, isAuthReady) => {
    const { data: pdpData, isLoading, error, updateData: updatePdpData } = useFirestoreData(
        db, 
        userId, 
        isAuthReady, 
        'pdp/roadmap', // Firestore path suffix
        MOCK_PDP_DATA, 
        'pdp'
    );
    
    // Separate function for initial plan generation (saves/overwrites the whole doc)
    const saveNewPlan = useCallback(async (plan) => {
        const docRef = mockDoc(db, 'users', userId) + '/pdp/roadmap';
        try {
            await mockSetDoc(docRef, plan);
            return true;
        } catch (e) {
            console.error('New plan save failed:', e);
            return false;
        }
    }, [db, userId]);

    return { pdpData, isLoading, error, updatePdpData, saveNewPlan };
};


// --- 1c. Planning Data Hook ---
export const usePlanningData = (db, userId, isAuthReady) => {
    const { data: planningData, isLoading, error, updateData: updatePlanningData } = useFirestoreData(
        db, 
        userId, 
        isAuthReady, 
        'planning_data/hub', // Firestore path suffix
        MOCK_PLANNING_DATA, 
        'planning'
    );

    return { planningData, isLoading, error, updatePlanningData };
};


// --- 1d. Global Metadata Hook (Reads the metadata/config document) ---
export const useGlobalMetadata = (db, isAuthReady) => {
    const [metadata, setMetadata] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthReady) { setLoading(false); return; }
        
        const docRef = mockDoc(db, 'metadata', 'config');

        // CRITICAL PERFORMANCE FIX: Rely on the snapshot for the first load resolution.
        const unsubscribe = mockOnSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setMetadata(data); // Using the raw data object for simplicity in this flow
            } else {
                console.error("CRITICAL: Global metadata document 'metadata/config' not found. Using fallbacks.");
                setMetadata({}); 
            }
            // Set loading to false immediately on first data receipt
            setLoading(false);
        });
        
        // ADDED 5s TIMEOUT TOLERANCE
        const safetyTimer = setTimeout(() => {
             console.warn(`Global Metadata subscription timeout. Forcing load state to false.`);
             setLoading(false);
        }, 5000); // Increased from 1500ms to 5000ms

        return () => { 
            unsubscribe();
            clearTimeout(safetyTimer);
        };
    }, [db, isAuthReady]);

    return { metadata, isLoading: loading };
};

// --- NEW GLOBAL METADATA UPDATE FUNCTION ---
export const updateGlobalMetadata = async (db, data) => {
    // This is the absolute path for the global config document
    const docRef = mockDoc(db, 'metadata', 'config'); 
    try {
        // Use mockSetDoc to overwrite the config document completely
        await mockSetDoc(docRef, data); 
        console.log("Global Metadata Updated Successfully (metadata/config).");
        return true;
    } catch (e) {
        console.error("Global Metadata Update Failed:", e);
        return false;
    }
};


// ====================================================================
// --- 2. MAIN CONTEXT CONSUMER HOOK ---
// ====================================================================

export function useAppServices() {
    const context = useContext(AppServiceContext);
    
    if (context === null || context === undefined) {
        return DEFAULT_SERVICES; 
    }
    return context;
}