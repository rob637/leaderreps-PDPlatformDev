// src/services/userEmailService.js
// Centralized "change my email" logic.
//
// Keeps the user's email in sync across the places it lives:
//   - Firebase Auth login email      (via verifyBeforeUpdateEmail)
//   - users/{uid}.email              (what the Admin > Users list shows)
//   - user_data/{uid}/leader_profile/current.email (Leader Profile)
//   - metadata/config.adminemails    (admin allowlist, if applicable)
//
// Firebase Auth requires the new email to be verified before the login
// email actually changes — so we send the verification link AND eagerly
// update the Firestore copies so admin / profile reflect the change
// immediately. The user logs in with the OLD email until they click the
// verification link in the new inbox.

import {
  doc,
  updateDoc,
  setDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from './firebaseUtils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) =>
  typeof email === 'string' && EMAIL_RE.test(email.trim());

/**
 * Update the user's email everywhere it is stored.
 *
 * @param {object} params
 * @param {import('firebase/firestore').Firestore} params.db
 * @param {import('firebase/auth').Auth} params.auth
 * @param {string} params.uid
 * @param {string} params.currentEmail  Current email (auth/firestore — used to find admin allowlist entry)
 * @param {string} params.newEmail      New email address
 * @param {string} [params.password]    Optional current password, for reauth if Firebase requires it
 *
 * @returns {Promise<{
 *   firestoreUpdated: boolean,
 *   authStatus: 'verification_sent' | 'requires_reauth' | 'failed' | 'skipped',
 *   authError: string | null
 * }>}
 */
export async function changeUserEmail({
  db,
  auth,
  uid,
  currentEmail,
  newEmail,
  password,
}) {
  if (!db || !auth || !uid) throw new Error('Missing db/auth/uid');
  if (!isValidEmail(newEmail)) throw new Error('Please enter a valid email address.');

  const newEmailTrim = newEmail.trim();
  const newLower = newEmailTrim.toLowerCase();
  const oldLower = (currentEmail || '').trim().toLowerCase();

  if (newLower === oldLower) {
    throw new Error('That is already your current email.');
  }

  // --- 1. Firestore: users/{uid}.email --------------------------------------
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    {
      email: newEmailTrim,
      emailUpdatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // --- 2. Firestore: leader_profile.email -----------------------------------
  try {
    const profileRef = doc(db, `user_data/${uid}/leader_profile/current`);
    await setDoc(
      profileRef,
      { email: newEmailTrim, updatedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (e) {
    console.warn('[changeUserEmail] Could not update leader profile email:', e);
  }

  // --- 3. Admin allowlist swap ----------------------------------------------
  try {
    const cfgRef = doc(db, 'metadata', 'config');
    const cfgSnap = await getDoc(cfgRef);
    const list = (cfgSnap.exists() && Array.isArray(cfgSnap.data().adminemails))
      ? cfgSnap.data().adminemails
      : [];
    const isAdmin = list.some((e) => (e || '').toLowerCase() === oldLower);
    if (isAdmin) {
      await updateDoc(cfgRef, { adminemails: arrayRemove(oldLower) });
      await updateDoc(cfgRef, { adminemails: arrayUnion(newLower) });
    }
  } catch (e) {
    console.warn('[changeUserEmail] Could not sync admin allowlist:', e);
  }

  // --- 4. Firebase Auth login email (verification-first) --------------------
  let authStatus = 'skipped';
  let authError = null;
  const authUser = auth.currentUser;

  if (authUser) {
    try {
      await verifyBeforeUpdateEmail(authUser, newEmailTrim);
      authStatus = 'verification_sent';
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/requires-recent-login' && password) {
        // Try reauth-then-retry
        try {
          const cred = EmailAuthProvider.credential(authUser.email, password);
          await reauthenticateWithCredential(authUser, cred);
          await verifyBeforeUpdateEmail(authUser, newEmailTrim);
          authStatus = 'verification_sent';
        } catch (reauthErr) {
          authStatus = 'failed';
          authError = reauthErr?.message || 'Reauthentication failed.';
        }
      } else if (code === 'auth/requires-recent-login') {
        authStatus = 'requires_reauth';
        authError = 'Please re-enter your current password to change your login email.';
      } else {
        authStatus = 'failed';
        authError = err?.message || 'Could not send verification email.';
      }
    }
  }

  return { firestoreUpdated: true, authStatus, authError };
}
