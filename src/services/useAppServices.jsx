// src/services/useAppServices.jsx

import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
// IMPORT FIREBASE CORE MODULES
import { getFirestore, doc, onSnapshot } from 'firebase/firestore'; 
import { getAuth } from 'firebase/auth'; // Auth is used for user ID reference

// --- GEMINI CONFIGURATION (Kept from original file) ---
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

// --- Data Fetching Hook (Firestore Live Subscriptions) ---
const useFirestoreData = (db, collectionName, docId) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!db || !docId) {
            setIsLoading(false);
            return;
        }

        const dataRef = doc(db, collectionName, docId);
        
        // Setup Realtime Listener
        const unsubscribe = onSnapshot(dataRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                setData(docSnapshot.data());
            } else {
                // If the document doesn't exist, return a null state (e.g., for new users/uninitialized data)
                setData(null);
            }
            setIsLoading(false);
            setError(null);
        }, (err) => {
            console.error(`Firestore subscription failed for ${collectionName}/${docId}:`, err);
            setError(err.message);
            setIsLoading(false);
        });

        // Cleanup listener on component unmount or dependency change
        return () => unsubscribe();
    }, [db, collectionName, docId]);

    return { data, isLoading, error };
};


function createServiceValue(firebaseServices, userId) {
  const { db, auth } = firebaseServices;

  // 1. Subscribe to User Profile Data (for Name/FirstLogin)
  // Assumes User data is stored in the 'users' collection with the document ID being the userId
  const { data: userData, isLoading: userLoading } = useFirestoreData(db, USERS_COLLECTION, userId);

  // 2. Subscribe to PDP Data (The main roadmap)
  // Assumes PDP data is stored in the 'leadership_plan' collection with the document ID being the userId
  const { data: pdpData, isLoading: pdpLoading } = useFirestoreData(db, PDP_COLLECTION, userId);

  // 3. Subscribe to Planning Data (OKRs, Pre-Mortem, etc.)
  // Assumes Planning data is stored in the 'planning' collection with the document ID being the userId
  const { data: planningData, isLoading: planningLoading } = useFirestoreData(db, PLANNING_COLLECTION, userId);
  
  // NOTE: CommitmentData should ideally be part of the PDP or Planning data structure 
  // in a denormalized way for performance, but we will mock a static object 
  // until the final data structure is defined.
  const commitmentData = { active_commitments: [], history: [] };


  // Combine Loading States
  const isLoading = userLoading || pdpLoading || planningLoading;
  
  // Combine User Data and Auth Info
  const user = useMemo(() => {
      if (auth?.currentUser) {
          return {
              userId: auth.currentUser.uid,
              name: auth.currentUser.displayName || userData?.name || auth.currentUser.email?.split('@')[0],
              email: auth.currentUser.email,
              firstLogin: userData?.firstLogin || false, // Check a 'firstLogin' flag in Firestore
              ...userData // Spread the rest of the user profile data
          };
      }
      return null;
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
  const callSecureGeminiAPI = async (payload = {}) => { /* ... Firebase/API call logic ... */ }; // Need full logic from App.jsx
  const navigate = (path) => { console.log('MOCK NAVIGATION: Navigating to:', path); }; // Still mock for now
  const hasPendingDailyPractice = commitmentData?.active_commitments?.some(c => c.status === 'Pending') || false;


  return { 
    callSecureGeminiAPI, 
    hasGeminiKey, 
    navigate, 
    
    // EXPOSED LIVE DATA
    user,
    commitmentData, // Needs to be integrated into live fetch logic
    pdpData,
    planningData,
    LEADERSHIP_TIERS, // Static data can be defined here or imported
    hasPendingDailyPractice,
    isLoading, // Propagates loading state
    
    // EXPOSED DATA UPDATE FUNCTIONS (STUBS)
    updateCommitmentData,
    updatePdpData,
    updatePlanningData,

    GEMINI_MODEL: DEFAULT_MODEL,
  };
}

export function AppServicesProvider({ children, firebaseServices, userId }) {
  // Use a context value that depends on the external Firebase services and userId
  const services = createServiceValue(firebaseServices, userId); 
  
  return <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>;
}