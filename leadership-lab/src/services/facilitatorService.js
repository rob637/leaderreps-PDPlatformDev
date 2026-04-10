import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase.js';

/**
 * Load full War Room data — cohort info, members, alerts, summary.
 * Calls labWarRoom Cloud Function.
 *
 * @param {string} cohortId
 * @returns {Promise<{ cohort, members, alerts, summary }>}
 */
export async function getWarRoomData(cohortId) {
  const fn = httpsCallable(functions, 'labWarRoom');
  const result = await fn({ cohortId });
  return result.data;
}

/**
 * Load a single member's full data for Deep Dive view.
 * Calls labDeepDive Cloud Function.
 *
 * @param {string} cohortId
 * @param {string} memberId
 * @returns {Promise<object>}
 */
export async function getMemberDeepDive(cohortId, memberId) {
  const fn = httpsCallable(functions, 'labDeepDive');
  const result = await fn({ cohortId, memberId });
  return result.data;
}

/**
 * Generate an AI-powered session plan for a cohort's current week.
 * Calls labSessionPlanner Cloud Function.
 *
 * @param {string} cohortId
 * @param {number} [sessionDuration=60]
 * @returns {Promise<{ success, planId, weekNumber, weekTheme, plan }>}
 */
export async function generateSessionPlan(cohortId, sessionDuration = 60) {
  const fn = httpsCallable(functions, 'labSessionPlanner');
  const result = await fn({ cohortId, sessionDuration });
  return result.data;
}

/**
 * Send a manual text to a cohort member as the facilitator.
 * Calls labSendText Cloud Function.
 *
 * @param {string} cohortId
 * @param {string} memberId
 * @param {string} message
 * @returns {Promise<{ success, conversationId, messageSid }>}
 */
export async function sendText(cohortId, memberId, message) {
  const fn = httpsCallable(functions, 'labSendText');
  const result = await fn({ cohortId, memberId, message });
  return result.data;
}
