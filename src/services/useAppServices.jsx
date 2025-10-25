// src/services/useAppServices.jsx

import { useMemo, useCallback, useContext, createContext, useState, useEffect } from 'react';
// Add real Firestore bindings (used when a real `db` instance is present)
import { doc as fsDoc, setDoc as fsSetDoc, onSnapshot as fsOnSnapshot } from 'firebase/firestore';

// ====================================================================
// --- CRITICAL FIX: MOCK FIREBASE PERSISTENCE LAYER ---
// This global object simulates the Firestore cache and ensures data survives component remounts.
const __firestore_mock_store = typeof window !== 'undefined' ? (window.__firestore_mock_store || {}) : {};
if (typeof window !== 'undefined') window.__firestore_mock_store = __firestore_mock_store;

// Helper to set data in the mock store and return a mock snapshot object
const createMockSnapshot = (docPath, data, exists = true) => {
    __firestore_mock_store[docPath] = data; // Persist data
    return {
        exists: () => exists,
        data: () => data,
        docRef: docPath,
    };
};

// Mock functions now use the persistent store
const mockGetDoc = async (docRef) => {
    const data = __firestore_mock_store[docRef];
    return createMockSnapshot(docRef, data, !!data);
};

const mockSetDoc = async (docRef, data) => { 
    createMockSnapshot(docRef, data, true); // Overwrite entire document
    console.log(`[Firestore Mock] SET Document: ${docRef} Data saved to persistent mock store.`); 
    return true; 
};

const mockUpdateDoc = async (docRef, data) => { 
    const currentData = __firestore_mock_store[docRef] || {};
    const newData = { ...currentData, ...data };
    createMockSnapshot(docRef, newData, true); // Merge data
    console.log(`[Firestore Mock] UPDATE Document: ${docRef} Data merged into persistent mock store.`); 
    return true; 
};

const mockOnSnapshot = (docRef, callback) => { 
    console.log(`[Firestore Mock] Subscribing to: ${docRef}`);
    
    // Read directly from the persistent mock store
    const initialData = __firestore_mock_store[docRef];
    
    if (initialData) {
        // Return existing data immediately
        callback(createMockSnapshot(docRef, initialData, true));
    } else {
        // Return empty mock if not found (simulating a document that doesn't exist yet)
        callback(createMockSnapshot(docRef, {}, false)); 
    }
    
    // In a real app, this would return the unsubscribe function.
    return () => { 
        // Mock Unsubscribe
    };
};

const mockDoc = (db, collection, doc) => `${collection}/${doc}`;

// ====================================================================
// --- REAL FIRESTORE WRAPPERS (choose real if db exists, else mock) ---
// ====================================================================
const toDocRef = (db, path) => fsDoc(db, ...path.split('/'));

const onSnapshotEx = (db, path, cb) =>
  db
    ? fsOnSnapshot(toDocRef(db, path), snap => cb({
        exists: () => snap.exists(),
        data: () => snap.data(),
        docRef: path
      }))
    : mockOnSnapshot(path, cb);

const setDocEx = (db, path, data, merge = false) =>
  db
    ? fsSetDoc(toDocRef(db, path), data, merge ? { merge: true } : undefined)
    : mockSetDoc(path, data);

const updateDocEx = (db, path, data) => setDocEx(db, path, data, true);

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
    // Start loading as true, but resolve quickly via onSnapshot
    const [isLoading, setIsLoading] = useState(true); 
    const docPath = useMemo(() => mockDoc(db, 'users', userId) + `/${docName}`, [db, userId, docName]);

    useEffect(() => {
        // If not authenticated or no DB, exit quickly
        if (!isAuthReady || !userId) {
            setIsLoading(false);
            return;
        }

        const docRef = docPath;

        const unsubscribe = onSnapshotEx(db, docRef, (doc) => {
            // First snapshot resolves the loading state.
            if (doc.exists()) {
                setData(doc.data());
            } else {
                // Document doesn't exist yet (or deleted) - use safe mock.
                setData(mockData); 
            }
            setIsLoading(false); 
        });

        // 15s safety timeout
        const safetyTimer = setTimeout(() => {
             console.warn(`Firestore subscription timeout for ${docName}. Forcing load state to false.`);
             setIsLoading(false);
        }, 15000);

        return () => { 
            unsubscribe(); 
            clearTimeout(safetyTimer);
        };

    }, [db, userId, isAuthReady, docPath, docName, mockData]);
    
    // Function to handle atomic data updates (merge) via Firestore
    const updateData = useCallback(async (updater) => {
        const currentData = data;
        const newData = updater(currentData);
        const docRef = docPath;
        try {
             await updateDocEx(db, docRef, newData); // merge semantics
             return true;
        } catch (e) {
             console.error(`Firestore update failed for ${docName}:`, e);
             return false;
        }
    }, [data, docPath, docName, db]);

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
            await setDocEx(db, docRef, plan); // overwrite
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

        // Performance: rely on snapshot for first load resolution.
        const unsubscribe = onSnapshotEx(db, docRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setMetadata(data);
            } else {
                console.error("CRITICAL: Global metadata document 'metadata/config' not found. Using fallbacks.");
                setMetadata({}); 
            }
            setLoading(false);
        });
        
        // 15s safety timeout
        const safetyTimer = setTimeout(() => {
             console.warn(`Global Metadata subscription timeout. Forcing load state to false.`);
             setLoading(false);
        }, 15000);

        return () => { 
            unsubscribe();
            clearTimeout(safetyTimer);
        };
    }, [db, isAuthReady]);

    return { metadata, isLoading: loading };
};

// --- GLOBAL METADATA UPDATE FUNCTION (persist to metadata/config) ---
export const updateGlobalMetadata = async (db, data) => {
    const docRef = mockDoc(db, 'metadata', 'config'); 
    try {
        await setDocEx(db, docRef, data); // overwrite
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
