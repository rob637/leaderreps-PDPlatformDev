// src/services/useAppServices.jsx

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'; // <-- FIXED IMPORT
// IMPORT FIREBASE CORE MODULES
import { getFirestore, doc, onSnapshot } from 'firebase/firestore'; 
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

export function useAppServices() {
  const ctx = useContext(AppServicesContext);
  if (!ctx) throw new Error('useAppServices must be used within <AppServicesProvider>');
  return ctx;
}

// --- Mock/Static Data for Fallbacks ---
const MOCK_USER_DATA = { name: 'Jane Executive', email: 'jane.executive@acme.com', firstLogin: false };
const MOCK_COMMITMENT_DATA = { active_commitments: [], history: [] };
const MOCK_PDP_DATA = { currentMonth: 1, assessment: { selfRatings: {} } };
const MOCK_PLANNING_DATA = { okrs: [], last_premortem_decision: new Date().toISOString() };
const LEADERSHIP_TIERS = { 'T1': { id: 'T1', name: 'Self-Awareness' } };
// --- End Mock/Static Data ---


// --- Data Fetching Hook (Firestore Live Subscriptions) ---
const useFirestoreData = (db, collectionName, docId) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // CRITICAL FIX: Ensure db and docId are valid before proceeding
        if (!db || !docId) {
            setData(null);
            setIsLoading(false);
            return;
        }

        const dataRef = doc(db, collectionName, docId);
        
        // Setup Realtime Listener
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

    return { data, isLoading, error };
};


function createServiceValue(firebaseServices, userId) {
  // CRITICAL FIX: Destructure db and auth safely, using defaults if firebaseServices is null
  const { db, auth } = firebaseServices || { db: null, auth: null };

  // 1. Subscribe to User Profile Data
  const { data: userData, isLoading: userLoading } = useFirestoreData(db, USERS_COLLECTION, userId);

  // 2. Subscribe to PDP Data
  const { data: pdpDataLive, isLoading: pdpLoading } = useFirestoreData(db, PDP_COLLECTION, userId);

  // 3. Subscribe to Planning Data
  const { data: planningDataLive, isLoading: planningLoading } = useFirestoreData(db, PLANNING_COLLECTION, userId);
  
  // Combine Live Data with Mocks for robustness (until data is written live)
  const pdpData = pdpDataLive || MOCK_PDP_DATA;
  const planningData = planningDataLive || MOCK_PLANNING_DATA;
  const commitmentData = MOCK_COMMITMENT_DATA; // Static Mock for now

  // Combine Loading States
  const isLoading = userLoading || pdpLoading || planningLoading;
  
  // Combine User Data and Auth Info
  const user = useMemo(() => {
      // Prioritize Firebase auth user details, then Firestore data, then static mock
      if (auth?.currentUser) {
          return {
              userId: auth.currentUser.uid,
              name: auth.currentUser.displayName || userData?.name || auth.currentUser.email?.split('@')[0],
              email: auth.currentUser.email,
              firstLogin: userData?.firstLogin || false,
              ...userData
          };
      }
      return MOCK_USER_DATA;
  }, [auth?.currentUser, userData]);


  // --- Data Write Stubs (Requires implementation using `setDoc` or `updateDoc`) ---
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

  // --- Utility Functions (Kept from App.jsx/previous iteration) ---
  const hasGeminiKey = () => MODE === 'serverless' || Boolean(DIRECT_KEY);
  const callSecureGeminiAPI = async (payload = {}) => { /* ... API call logic ... */ }; // Full logic needed if you enable direct mode
  const navigate = (path) => { console.log('MOCK NAVIGATION: Navigating to:', path); };
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

export function AppServicesProvider({ children, firebaseServices, userId }) {
  // CRITICAL FIX: Pass firebaseServices and userId to createServiceValue
  const services = useMemo(() => createServiceValue(firebaseServices, userId), [firebaseServices, userId]); 
  
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}