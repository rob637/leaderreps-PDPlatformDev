import {
  collection,
  doc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import collections, { cohortPaths } from '../config/collections.js';

/**
 * Load cohort members with only public-facing data (name, week, status indicator).
 * Does NOT load leadership profiles, conversations, or engagement metrics.
 *
 * @param {string} cohortId
 * @returns {Promise<object[]>}
 */
export async function getCohortMembersPublic(cohortId) {
  const membersRef = collection(db, ...cohortPaths(cohortId).members.split('/'));
  const membersSnap = await getDocs(membersRef);

  const memberPromises = membersSnap.docs.map(async (memberDoc) => {
    const userId = memberDoc.id;

    const userRef = doc(db, collections.users, userId);
    const userSnap = await getDoc(userRef);
    const userProfile = userSnap.exists() ? userSnap.data() : {};

    // Resolve the most recent activity timestamp from any signal we track.
    // Lab activity is recorded as `lastSmsResponseAt` on the SMS path; some
    // users (web-only Reveal acks, etc.) may have `lastActiveAt` instead.
    const tsToMillis = (v) => {
      if (!v) return 0;
      if (typeof v.toDate === 'function') return v.toDate().getTime();
      if (v instanceof Date) return v.getTime();
      return new Date(v).getTime() || 0;
    };
    const lastActivityMs = Math.max(
      tsToMillis(userProfile.lastSmsResponseAt),
      tsToMillis(userProfile.lastActiveAt),
    );

    return {
      id: userId,
      name:
        userProfile.firstName ||
        userProfile.displayName ||
        'Cohort Member',
      currentWeek: userProfile.currentWeek || 1,
      // Only expose a simple active/inactive status
      isActive: lastActivityMs > 0
        ? (Date.now() - lastActivityMs) < 4 * 86400000
        : false,
    };
  });

  return Promise.all(memberPromises);
}
