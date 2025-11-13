import { useState, useEffect, useCallback } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, writeBatch, getDoc } from 'firebase/firestore'; 

import { 
    useAppServices 
} from '../App'; // Assuming App context export is available via relative path or provided globally

import {
    PDP_COLLECTION, PDP_DOCUMENT, COMMITMENT_COLLECTION, COMMITMENT_DOCUMENT, PLANNING_COLLECTION, 
    PLANNING_DOCUMENT, LEADERSHIP_TIERS, CONTENT_LIBRARY, COACHING_COLLECTION
} from '../data/Constants'; 

// --- FIRESTORE PATHING UTILITY ---
const getPath = (collection, document, userId, appId) => 
    userId ? `/artifacts/${appId}/users/${userId}/${collection}/${document}` : null;


// --- COMMITMENT DEFAULTS (Moved from App.jsx) ---
const DEFAULT_COMMITMENT_DATA = {
    lastCommitmentDate: new Date().toISOString().split('T')[0], 
    history: [
        { date: '2025-10-10', score: '3/3' },
        { date: '2025-10-16', score: '3/3' },
    ],
    active_commitments: [
        { id: 102, text: 'Identify and block out 90 minutes for "Deep Work" on a high-leverage task.', status: 'Committed', linkedGoal: 'Improve Team Execution Quality', linkedTier: 'T3', targetColleague: null },
    ],
    reflection_journal: '',
};

// --- PLANNING DEFAULTS (Moved from App.jsx) ---
const DEFAULT_PLANNING_DATA = {
    vision: 'To lead a team recognized globally for its innovative speed and psychological safety by 2028.',
    mission: 'To empower every team member to take calculated risks and own the outcomes, driving a culture of continuous learning and customer-centric excellence.',
    okrs: [
        { id: 1, objective: 'Dramatically improve team execution quality and velocity', keyResults: [
            { id: 101, kr: 'Reduce customer-reported bugs from 45 to 15 per quarter.' },
            { id: 102, kr: 'Increase team code coverage on critical features from 70% to 95%.' }
        ]},
    ],
    last_premortem_decision: 'N/A',
};


/**
 * Hook for PDP Data (Read/Write Roadmap)
 */
export const usePDPData = (db, userId, isAuthReady) => {
    const { appId } = useAppServices();
    const [pdpData, setPdpData] = useState(undefined); 
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const pdpPath = getPath(PDP_COLLECTION, PDP_DOCUMENT, userId, appId);

    useEffect(() => {
        if (!db || !isAuthReady || !userId || !pdpPath) {
             if(isAuthReady) setIsLoading(false);
             return;
        }

        setError(null);
        const docRef = doc(db, pdpPath);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setPdpData(docSnap.data());
            } else {
                setPdpData(null);
            }
            setIsLoading(false);
        }, (e) => {
            console.error("Error subscribing to PDP data:", e);
            setError("Real-time data synchronization failed. Check network or security rules.");
            setIsLoading(false);
            setPdpData(null); 
        });

        return () => unsubscribe();
    }, [db, userId, isAuthReady, pdpPath, appId]);

    const updatePdpData = useCallback(async (dataToUpdate) => {
        if (!db || !userId || !pdpPath) return false;
        
        try {
            const docRef = doc(db, pdpPath);
            await updateDoc(docRef, { ...dataToUpdate, lastUpdate: new Date().toISOString() });
            return true;
        } catch (e) {
            console.error("Error updating PDP data:", e);
            return false;
        }
    }, [pdpPath, db, userId]);

    const saveNewPlan = useCallback(async (newPlanData) => {
        if (!db || !userId || !pdpPath) return false;
        
        try {
            const docRef = doc(db, pdpPath);
            await setDoc(docRef, { 
                ...newPlanData, 
                ownerUid: userId,
                lastUpdate: new Date().toISOString(),
                currentMonth: 1,
            });
            return true;
        } catch (e) {
            console.error("Error saving new PDP document:", e);
            return false;
        }
    }, [pdpPath, db, userId]);

    return { pdpData, isLoading, error, updatePdpData, saveNewPlan };
};


/**
 * Hook for Commitment Data (Read/Write Daily Scorecard)
 */
export const useCommitmentData = (db, userId, isAuthReady) => {
    const { appId } = useAppServices();
    const [commitmentData, setCommitmentData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const commitmentPath = getPath(COMMITMENT_COLLECTION, COMMITMENT_DOCUMENT, userId, appId);

    const needsReset = (data) => {
        if (!data) return false;
        const today = new Date().toISOString().split('T')[0];
        return data.lastCommitmentDate !== today;
    };

    useEffect(() => {
        if (!db || !isAuthReady || !userId || !commitmentPath) {
             if(isAuthReady) setIsLoading(false);
             return;
        }

        setError(null);
        const docRef = doc(db, commitmentPath);

        const unsubscribe = onSnapshot(docRef, async (docSnap) => {
            let currentData;
            if (docSnap.exists()) {
                currentData = docSnap.data();
            } else {
                try {
                    await setDoc(docRef, DEFAULT_COMMITMENT_DATA);
                    currentData = DEFAULT_COMMITMENT_DATA;
                } catch (e) {
                    console.error("Error creating default Commitment document:", e);
                    setError("Could not initialize Commitment data.");
                    setIsLoading(false);
                    return;
                }
            }

            if (needsReset(currentData)) {
                // --- DAILY RESET LOGIC ---
                const today = new Date().toISOString().split('T')[0];
                
                const yesterdayScore = currentData.active_commitments.length > 0
                    ? `${currentData.active_commitments.filter(c => c.status === 'Committed').length}/${currentData.active_commitments.length}`
                    : '0/0';

                const newHistory = [...currentData.history];
                const lastDate = currentData.lastCommitmentDate;
                
                if (newHistory.length === 0 || newHistory[newHistory.length - 1].date !== lastDate) {
                     newHistory.push({ date: lastDate, score: yesterdayScore });
                }

                if (newHistory.length > 7) {
                    newHistory.splice(0, newHistory.length - 7);
                }

                const resetCommitments = currentData.active_commitments.map(c => ({
                    ...c,
                    status: 'Pending',
                }));

                const batch = writeBatch(db);
                batch.update(docRef, {
                    lastCommitmentDate: today,
                    history: newHistory,
                    active_commitments: resetCommitments,
                    reflection_journal: '', 
                });

                try {
                    await batch.commit();
                } catch (e) {
                    console.error("Error resetting daily commitments via batch:", e);
                    setError("Failed to reset daily scorecard.");
                }
            } else {
                setCommitmentData(currentData);
            }
            setIsLoading(false);
        }, (e) => {
            console.error("Error subscribing to Commitment data:", e);
            setError("Commitment data synchronization failed.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId, isAuthReady, commitmentPath, appId]);


    const updateCommitmentData = useCallback(async (dataToUpdateOrFunction) => {
        if (!db || !userId || !commitmentPath) return false;

        try {
            const docRef = doc(db, commitmentPath);
            let dataToUpdate = dataToUpdateOrFunction;
            
            if (typeof dataToUpdateOrFunction === 'function') {
                const docSnap = await getDoc(docRef);
                const currentData = docSnap.exists() ? docSnap.data() : null;
                if (!currentData) throw new Error("Commitment data not found for functional update.");
                
                dataToUpdate = dataToUpdateOrFunction(currentData);
            }

            await updateDoc(docRef, dataToUpdate);
            return true;
        } catch (e) {
            console.error("Error updating Commitment data:", e);
            return false;
        }
    }, [commitmentPath, db, userId]);

    return { commitmentData, isLoading, error, updateCommitmentData };
};


/**
 * Hook for Planning Data (Read/Write Vision/OKRs/Pre-Mortem)
 */
export const usePlanningData = (db, userId, isAuthReady) => {
    const { appId } = useAppServices();
    const [planningData, setPlanningData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const planningPath = getPath(PLANNING_COLLECTION, PLANNING_DOCUMENT, userId, appId);

    useEffect(() => {
        if (!db || !isAuthReady || !userId || !planningPath) {
            if(isAuthReady) setIsLoading(false);
            return;
        }

        setError(null);
        const docRef = doc(db, planningPath);

        const unsubscribe = onSnapshot(docRef, async (docSnap) => {
            if (docSnap.exists()) {
                setPlanningData(docSnap.data());
                setIsLoading(false);
            } else {
                try {
                    await setDoc(docRef, DEFAULT_PLANNING_DATA);
                    setPlanningData(DEFAULT_PLANNING_DATA);
                    setIsLoading(false);
                } catch (e) {
                    console.error("Error creating default Planning document:", e);
                    setError("Could not initialize Planning data.");
                    setIsLoading(false);
                }
            }
        }, (e) => {
            console.error("Error subscribing to Planning data:", e);
            setError("Planning data synchronization failed.");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId, isAuthReady, planningPath, appId]);

    const updatePlanningData = useCallback(async (dataToUpdate) => {
        if (!db || !userId || !planningPath) return false;

        try {
            const docRef = doc(db, planningPath);
            await updateDoc(docRef, dataToUpdate);
            return true;
        } catch (e) {
            console.error("Error updating Planning data:", e);
            return false;
        }
    }, [planningPath, db, userId]);

    return { planningData, isLoading, error, updatePlanningData };
};

// --- AUTH UTILITIES (Simplified, relying on Firebase SDK) ---
export const authService = {
    async signIn(email, password) {
        const auth = getAuth();
        return signInWithEmailAndPassword(auth, email, password);
    },
    async signUp(email, password) {
        const auth = getAuth();
        return createUserWithEmailAndPassword(auth, email, password);
    },
    async resetPassword(email) {
        const auth = getAuth();
        return sendPasswordResetEmail(auth, email);
    },
    async signOut() {
        const auth = getAuth();
        return signOut(auth);
    }
};
