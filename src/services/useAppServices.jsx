// src/services/useAppServices.jsx

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'; 
import { doc, onSnapshot } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth'; 


// --- GEMINI CONFIGURATION (Kept for completeness) ---
const MODE = (import.meta.env?.VITE_GEMINI_MODE || globalThis?.window?.__GEMINI_MODE || 'serverless').trim();
const DIRECT_KEY = (
  import.meta.env?.VITE_GEMINI_KEY ||
  import.meta.env?.VITE_GEMINI_API_KEY ||
  globalThis?.window?.__GEMINI_API_KEY || ''
).trim();
const DEFAULT_MODEL =
  (import.meta.env?.VITE_GEMINI_MODEL || globalThis?.window?.__GEMINI_MODEL || 'gemini-1.5-flash').trim();


// --- Firestore Collection Constants ---
const USERS_COLLECTION = 'users';
const PDP_COLLECTION = 'leadership_plan';
const PLANNING_COLLECTION = 'planning'; 

// --- App Context Setup ---
const AppServicesContext = createContext(null);

// Default service object to safely destructure against if the context is null
const DEFAULT_SERVICES = {
    navigate: (path, params) => {
        if (typeof window !== 'undefined' && typeof window.__appNavigate === 'function') {
            window.__appNavigate(path, params);
        } else {
            console.log('MOCK NAVIGATION:', path, params);
        }
    },
 
    user: {},
    commitmentData: {},
    pdpData: {},
    planningData: {},
    LEADERSHIP_TIERS: {},
    hasPendingDailyPractice: false,
    isLoading: true, // Indicates loading until real services take over
    callSecureGeminiAPI: () => {}, 
    hasGeminiKey: () => false,
    // Add all other required function stubs
    updateCommitmentData: () => {},
    updatePdpData: () => {},
    updatePlanningData: () => {},
    GEMINI_MODEL: DEFAULT_MODEL,
};

export function useAppServices() {

  const ctx = useContext(AppServicesContext);
  // Safe wrappers: prefer real impls from context, otherwise use defaults
  const safeCallSecureGeminiAPI = async (payload) => {
    try {
      if (typeof (ctx && ctx.callSecureGeminiAPI) === 'function') {
        const out = await ctx.callSecureGeminiAPI(payload);
        const txt = out?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof txt === 'string' && txt.trim()) return out;
        console.warn('[AI] Empty response; using mock fallback.');
      }
    } catch (e) {
      console.warn('[AI] Real call failed; using mock fallback.', e);
    }
    return DEFAULT_SERVICES.callSecureGeminiAPI(payload);
  };

  const safeHasGeminiKey = () => {
    try {
      return typeof (ctx && ctx.hasGeminiKey) === 'function' ? !!ctx.hasGeminiKey() : true;
    } catch {
      return true;
    }
  };

  // Merge defaults with context; override AI funcs with safe versions; keep navigate present
  
  // Unified AI caller: prefer context, fall back to default; always return a shaped response
  const callSecureGeminiAPI = async (payload = {}) => {
    try {
      if (ctx && typeof ctx.callSecureGeminiAPI === 'function') {
        const out = await ctx.callSecureGeminiAPI(payload);
        const parts = out?.candidates?.[0]?.content?.parts || [];
        const text = parts.map(p => (typeof p === 'string' ? p : (p?.text || ''))).join('\n').trim();
        if (text) return out;
        console.warn('[AI] Context call returned empty text; using default fallback.');
      }
    } catch (e) {
      console.warn('[AI] Context call failed; using default fallback.', e);
    }
    // Default fallback (may forward to window.__callSecureGeminiAPI internally)
    const out = await DEFAULT_SERVICES.callSecureGeminiAPI(payload);
    const parts = out?.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => (typeof p === 'string' ? p : (p?.text || ''))).join('\n').trim();
    if (text) return out;
    // Ultimate fallback: shaped minimal response
    return { candidates: [{ content: { parts: [{ text: 'AI unavailable. Showing a minimal fallback.' }] } }] };
  };

  return {
    ...DEFAULT_SERVICES,
    ...(ctx || {}),
    navigate: (ctx && typeof ctx.navigate==='function') ? ctx.navigate : DEFAULT_SERVICES.navigate,
    callSecureGeminiAPI,
  };

}



// --- Mock/Static Data for Fallbacks ---
const MOCK_USER_DATA = { name: 'Jane Executive', email: 'jane.executive@acme.com', firstLogin: true };
const MOCK_COMMITMENT_DATA = { active_commitments: [{}], history: [] };
const MOCK_PDP_DATA = { currentMonth: 4, assessment: { selfRatings: { T3: 6 } } };
const MOCK_PLANNING_DATA = { okrs: [{}], last_premortem_decision: new Date().toISOString() };
const LEADERSHIP_TIERS = { 'T1': { id: 'T1', name: 'Self-Awareness' } };
// --- End Mock/Static Data ---


// --- Data Fetching Hook (Firestore Live Subscriptions) ---
const useFirestoreData = (db, collectionName, docId) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!db || !docId) {
            setData(null);
            setIsLoading(false);
            return;
        }

        const dataRef = doc(db, collectionName, docId);
        
        const unsubscribe = onSnapshot(dataRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                setData(docSnapshot.data());
            } else {
                setData(null);
            }
            setIsLoading(false);
            setError(null);
        }, (err) => {
            console.error(`Firestore subscription failed for ${collectionName}/${docId}:`, err);
            setError(err.message);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db, collectionName, docId]);

    return {     navigate,
data, isLoading, error };
};


/**
 * The core function that provides the global state and services, designed to be called 
 * once inside App.jsx's DataProvider component.
 */
export function createServiceValue(firebaseServices, userId) {
  
  const { db, auth } = firebaseServices || { db: null, auth: null };

  // 1. Subscribe to Live Data
  const { data: userData, isLoading: userLoading } = useFirestoreData(db, USERS_COLLECTION, userId);
  const { data: pdpDataLive, isLoading: pdpLoading } = useFirestoreData(db, PDP_COLLECTION, userId);
  const { data: planningDataLive, isLoading: planningLoading } = useFirestoreData(db, PLANNING_COLLECTION, userId);
  
  // Combine Live Data with Mocks for robustness
  const pdpData = pdpDataLive || MOCK_PDP_DATA;
  const planningData = planningDataLive || MOCK_PLANNING_DATA;
  const commitmentData = MOCK_COMMITMENT_DATA; 

  // Combine Loading States
  const isLoading = userLoading || pdpLoading || planningLoading;
  
  // Combine User Data and Auth Info
  const user = useMemo(() => {
      if (auth?.currentUser) {
          return {
              userId: auth.currentUser.uid,
              name: auth.currentUser.displayName || userData?.name,
              email: auth.currentUser.email,
              firstLogin: userData?.firstLogin || true,
              ...userData
          };
      }
      return MOCK_USER_DATA;
  }, [auth?.currentUser, userData]);


  // --- Data Write Stubs (REQUIRED FOR PRODUCTION) ---
  const updateCommitmentData = async (updater) => {
      console.log('PRODUCTION STUB: updateCommitmentData - Requires implementation with Firestore setDoc/updateDoc.');
      return true;
  };
  
  const updatePdpData = async (updater) => {
      console.log('PRODUCTION STUB: updatePdpData - Requires implementation with Firestore setDoc/updateDoc.');
      return true;
  };

  const updatePlanningData = async (updater) => {
      console.log('PRODUCTION STUB: updatePlanningData - Requires implementation with Firestore setDoc/updateDoc.');
      return true;
  };

  // --- Utility Functions ---
  const hasGeminiKey = () => MODE === 'serverless' || Boolean(DIRECT_KEY);
  const callSecureGeminiAPI = async (payload = {}) => { 
      console.log("PRODUCTION STUB: callSecureGeminiAPI called.");
      return {}; 
  }; 
  const navigate = (path, params) => {
  if (typeof window !== 'undefined' && typeof window.__appNavigate === 'function') {
    window.__appNavigate(path, params);
  } else {
    console.log('MOCK NAVIGATION:', path, params);
  }
};
  const hasPendingDailyPractice = commitmentData?.active_commitments?.some(c => c.status === 'Pending') || false;


  return { 
    callSecureGeminiAPI, 
    hasGeminiKey, 
    navigate, 
    
    // EXPOSED LIVE/MOCK DATA
    user,
    commitmentData,
    pdpData,
    planningData,
    LEADERSHIP_TIERS,
    hasPendingDailyPractice,
    isLoading, 
    
    // EXPOSED DATA UPDATE FUNCTIONS
    updateCommitmentData,
    updatePdpData,
    updatePlanningData,

    GEMINI_MODEL: DEFAULT_MODEL,
  };
}

// Placeholder to satisfy main.jsx import (as previously identified)
export function AppServicesProvider({ children }) {
    return <React.Fragment>{children}</React.Fragment>;
}