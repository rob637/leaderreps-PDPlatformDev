import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase.js';

const labCoach = httpsCallable(functions, 'labCoach');
const labCompleteOnboarding = httpsCallable(functions, 'labCompleteOnboarding');
const labUpdateProfile = httpsCallable(functions, 'labUpdateProfile');

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
export async function sendMessage(text, { conversationId, mode = 'coach', weekNumber = 1 } = {}) {
  const result = await labCoach({
    text,
    conversationId,
    mode,
    weekNumber,
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
