import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase.js';

const labCoach = httpsCallable(functions, 'labCoach');
const labCompleteOnboarding = httpsCallable(functions, 'labCompleteOnboarding');
const labUpdateProfile = httpsCallable(functions, 'labUpdateProfile');
const labRfKudosAssist = httpsCallable(functions, 'labRfKudosAssist');

/**
 * Send a message to the AI coach and get a response.
 * Creates a new conversation if no conversationId is provided.
 *
 * @param {string} text — The user's message
 * @param {object} options
 * @param {string} [options.conversationId] — Existing conversation to continue
 * @param {string} [options.mode] — coach | practice | mirror | debrief | onboarding
 * @param {number} [options.weekNumber] — Current week (1-6)
 * @returns {Promise<{response: string, conversationId: string}>}
 */
export async function sendMessage(text, { conversationId, mode = 'coach', weekNumber = 1, experimentContext } = {}) {
  const result = await labCoach({
    text,
    conversationId,
    mode,
    weekNumber,
    experimentContext,
  });
  return result.data;
}

/**
 * Complete the onboarding process — builds the initial Leadership Profile
 * from the onboarding conversation.
 *
 * @param {string} conversationId — The onboarding conversation ID
 * @returns {Promise<{success: boolean, profile: object}>}
 */
export async function completeOnboarding(conversationId) {
  const result = await labCompleteOnboarding({ conversationId });
  return result.data;
}

/**
 * Trigger a profile re-analysis based on recent conversations.
 *
 * @returns {Promise<{success: boolean, updated: boolean}>}
 */
export async function updateProfile() {
  const result = await labUpdateProfile({});
  return result.data;
}

/**
 * Coach a reinforcing-feedback ("RF Kudos") draft.
 *
 * Returns specificity/behavioral/impact scores, what's working, what to
 * sharpen, and a polished version the user can adopt or ignore.
 *
 * @param {object} payload
 * @param {string} payload.recipientName
 * @param {string} payload.situation
 * @param {string} payload.behavior
 * @param {string} payload.impact
 * @param {string} [payload.draft]  composed full-text draft (optional)
 * @returns {Promise<{
 *   quality: 'strong'|'good'|'needs-work',
 *   summary: string,
 *   scores: { specificity: number, behavioral: number, impact: number },
 *   strengths: string[],
 *   suggestions: string[],
 *   polished: string,
 * }>}
 */
export async function getRfKudosFeedback(payload) {
  const result = await labRfKudosAssist(payload);
  return result.data;
}
