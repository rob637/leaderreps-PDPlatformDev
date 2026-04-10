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

    return {
      id: userId,
      name: userProfile.displayName || 'Cohort Member',
      currentWeek: userProfile.currentWeek || 1,
      // Only expose a simple active/inactive status
      isActive: userProfile.lastActiveAt
        ? (Date.now() - (userProfile.lastActiveAt?.toDate?.()?.getTime() || 0)) < 4 * 86400000
        : false,
    };
  });

  return Promise.all(memberPromises);
}
