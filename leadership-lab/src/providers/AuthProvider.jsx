import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithCustomToken, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../config/firebase.js';
import collections from '../config/collections.js';
import { AuthContext } from '../config/AuthContext.js';

// Admin emails that can manage cohorts (checked against metadata/config too)
const HARDCODED_ADMINS = [
  'rob@sagecg.com',
  'cristina@leaderreps.com',
  'ryan@leaderreps.com',
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileDocId, setProfileDocId] = useState(null);
  // Track the profile snapshot unsubscribe function
  let profileUnsub = null;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous profile listener
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        const email = (firebaseUser.email || '').toLowerCase();

        // Check admin status — hardcoded list + Firestore config
        let adminDetected = HARDCODED_ADMINS.includes(email);
        if (!adminDetected) {
          try {
            const configSnap = await getDoc(doc(db, 'metadata', 'config'));
            if (configSnap.exists()) {
              const adminEmails = (configSnap.data().adminemails || []).map((e) => e.toLowerCase());
              adminDetected = adminEmails.includes(email);
            }
          } catch {
            // Config not accessible — rely on hardcoded list
          }
        }

        // Check facilitator collection and load facilitator cohorts
        let facilitatorCohorts = null;
        if (!adminDetected) {
          try {
            const facSnap = await getDoc(doc(db, collections.facilitators || 'll-facilitators', firebaseUser.uid));
            if (facSnap.exists()) {
              adminDetected = true;
              facilitatorCohorts = facSnap.data().cohorts || [];
            }
          } catch {
            // Not a facilitator
          }
        }

        // For hardcoded/config admins, also load facilitator doc for cohort list
        if (adminDetected && !facilitatorCohorts) {
          try {
            const facSnap = await getDoc(doc(db, collections.facilitators || 'll-facilitators', firebaseUser.uid));
            if (facSnap.exists()) {
              facilitatorCohorts = facSnap.data().cohorts || [];
            }
          } catch {
            // No facilitator doc yet
          }
        }

        setIsAdmin(adminDetected);

        // Fetch user profile from ll-users collection
        // First try direct lookup by auth UID (email/password users)
        const profileRef = doc(db, collections.users, firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        let foundDocId = profileSnap.exists() ? firebaseUser.uid : null;

        // If not found, check for SMS-upgraded users (firebaseAuthUid field)
        if (!foundDocId) {
          try {
            const q = query(
              collection(db, collections.users || 'll-users'),
              where('firebaseAuthUid', '==', firebaseUser.uid),
              limit(1),
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
              foundDocId = snap.docs[0].id;
            }
          } catch {
            // Query failed — continue with null profile
          }
        }

        setProfileDocId(foundDocId);

        // Subscribe to real-time profile updates
        if (foundDocId) {
          const profileDocRef = doc(db, collections.users, foundDocId);
          profileUnsub = onSnapshot(profileDocRef, (snap) => {
            if (snap.exists()) {
              const profile = { ...snap.data(), _docId: foundDocId };
              // Merge facilitator cohort info into profile
              if (facilitatorCohorts && facilitatorCohorts.length > 0) {
                profile.cohortId = facilitatorCohorts[0];
                profile.facilitatorCohorts = facilitatorCohorts;
              }
              setUserProfile(profile);
            }
          });
        } else {
          const profile = {};
          profile._docId = null;
          if (facilitatorCohorts && facilitatorCohorts.length > 0) {
            profile.cohortId = facilitatorCohorts[0];
            profile.facilitatorCohorts = facilitatorCohorts;
          }
          setUserProfile(profile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }
    };
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signup = async (email, password, displayName) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Create user profile in ll-users
    await setDoc(doc(db, collections.users, result.user.uid), {
      email: result.user.email,
      displayName: displayName || '',
      role: 'member',
      currentPhase: 'pre-program',
      onboardingComplete: false,
      cohortId: null,
      createdAt: new Date().toISOString(),
    });
    return result.user;
  };

  const logout = () => signOut(auth);

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshProfile = async () => {
    if (!user) return;
    // Check direct UID first, then firebaseAuthUid lookup
    const profileRef = doc(db, collections.users, user.uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      setUserProfile({ ...profileSnap.data(), _docId: user.uid });
      return;
    }
    try {
      const q = query(
        collection(db, collections.users || 'll-users'),
        where('firebaseAuthUid', '==', user.uid),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setUserProfile({ ...snap.docs[0].data(), _docId: snap.docs[0].id });
      }
    } catch {
      // ignore
    }
  };

  /**
   * Sign in using a magic unlock code (from SMS link).
   * Calls the labRedeemUnlock endpoint, gets a custom token, signs in.
   */
  const signInWithUnlockCode = async (code) => {
    const url = import.meta.env.VITE_FUNCTIONS_URL
      ? `${import.meta.env.VITE_FUNCTIONS_URL}/labRedeemUnlock`
      : 'https://us-central1-leaderreps-pd-platform.cloudfunctions.net/labRedeemUnlock';

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to redeem unlock code');
    }

    // Sign in with the custom token — onAuthStateChanged will handle the rest
    await signInWithCustomToken(auth, data.token);
    return data;
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    refreshProfile,
    signInWithUnlockCode,
    isAuthenticated: !!user,
    isFacilitator: isAdmin || userProfile?.role === 'facilitator',
    isAdmin,
    isOnboarded: isAdmin || userProfile?.onboardingComplete === true,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
