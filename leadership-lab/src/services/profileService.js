import {
  doc, getDoc, getDocs, onSnapshot,
  collection, query, orderBy, where, limit,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import collections, { userPaths } from '../config/collections.js';

/**
 * Load the current Leadership Profile for a user.
 *
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getLeadershipProfile(userId) {
  const ref = doc(db, collections.users, userId, 'leadershipProfile', 'current');
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

/**
 * Subscribe to real-time updates of the Leadership Profile.
 *
 * @param {string} userId
 * @param {function} callback — called with the profile object (or null)
 * @returns {function} unsubscribe
 */
export function subscribeToProfile(userId, callback) {
  const ref = doc(db, collections.users, userId, 'leadershipProfile', 'current');
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

/**
 * Get the user's tension map for display.
 * Returns an array of {left, right, position, evidence} objects.
 *
 * @param {object|null} profile — The Leadership Profile
 * @returns {Array}
 */
export function getTensions(profile) {
  if (!profile || !profile.tensions) return [];
  return profile.tensions.map((t) => ({
    left: t.left,
    right: t.right,
    position: typeof t.position === 'number' ? t.position : 50,
    evidence: t.evidence || '',
  }));
}

/**
 * Get the dual profile summaries.
 *
 * @param {object|null} profile
 * @returns {{presented: string, observed: string}}
 */
export function getDualProfile(profile) {
  return {
    presented: profile?.presentedSelf || '',
    observed: profile?.observedSelf || '',
  };
}

/**
 * Load all reveals for a user, sorted by creation time.
 *
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getReveals(userId) {
  const paths = userPaths(userId);
  const ref = collection(db, paths.reveals);
  const q = query(ref, orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Load high-significance evidence items for a user.
 *
 * @param {string} userId
 * @param {number} [maxItems=20]
 * @returns {Promise<object[]>}
 */
export async function getKeyEvidence(userId, maxItems = 20) {
  const ref = collection(db, collections.users, userId, 'evidence');
  const q = query(ref, where('significance', '==', 'high'), limit(maxItems));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Load all challenges/experiments for a user, sorted by week.
 *
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getChallenges(userId) {
  const paths = userPaths(userId);
  const ref = collection(db, paths.challenges);
  const q = query(ref, orderBy('weekNumber', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Load all weekly reflections for a user, sorted by week.
 *
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function getReflections(userId) {
  const paths = userPaths(userId);
  const ref = collection(db, paths.reflections);
  const q = query(ref, orderBy('weekNumber', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
