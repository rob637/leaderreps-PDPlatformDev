import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

/**
 * Detects whether the current user is enrolled in Leadership Lab.
 * The Lab owns SMS for any enrolled user — the PD platform must suppress
 * its own SMS channel to avoid duplicate texts on the shared 10DLC number.
 *
 * Returns:
 *   - loading: true until the lookup resolves
 *   - enrolled: boolean — true when ll-users record exists with smsOptIn !== false
 *   - profile: the matching ll-users doc data (or null)
 */
export function useLabEnrollment() {
  const { user } = useAuth();
  const [state, setState] = useState({
    loading: true,
    enrolled: false,
    profile: null,
  });

  useEffect(() => {
    let cancelled = false;
    if (!user?.uid) {
      setState({ loading: false, enrolled: false, profile: null });
      return undefined;
    }

    (async () => {
      try {
        // Direct lookup by Firebase Auth UID (email/password Lab users)
        let snap = await getDoc(doc(db, 'll-users', user.uid));
        let data = snap.exists() ? snap.data() : null;

        // Fallback: SMS-first users link via firebaseAuthUid field
        if (!data) {
          const q = query(
            collection(db, 'll-users'),
            where('firebaseAuthUid', '==', user.uid),
            limit(1)
          );
          const results = await getDocs(q);
          if (!results.empty) data = results.docs[0].data();
        }

        if (cancelled) return;
        const enrolled = !!data && data.smsOptIn !== false;
        setState({ loading: false, enrolled, profile: data });
      } catch {
        // Fail-open: assume not enrolled so we don't lock users out of toggles
        if (!cancelled) {
          setState({ loading: false, enrolled: false, profile: null });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  return state;
}

export default useLabEnrollment;
