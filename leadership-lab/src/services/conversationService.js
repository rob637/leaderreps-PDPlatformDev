import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import collections from '../config/collections.js';

/**
 * Load a single conversation by ID.
 *
 * @param {string} userId
 * @param {string} conversationId
 * @returns {Promise<object|null>}
 */
export async function getConversation(userId, conversationId) {
  const ref = doc(db, collections.users, userId, 'conversations', conversationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Load all conversations for a user, most recent first.
 *
 * @param {string} userId
 * @param {number} [maxResults=20]
 * @returns {Promise<object[]>}
 */
export async function getConversations(userId, maxResults = 20) {
  const ref = collection(db, collections.users, userId, 'conversations');
  const q = query(ref, orderBy('updatedAt', 'desc'), limit(maxResults));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Subscribe to real-time updates for a single conversation.
 * Useful for showing new messages as they arrive.
 *
 * @param {string} userId
 * @param {string} conversationId
 * @param {function} callback — called with the updated conversation object
 * @returns {function} unsubscribe
 */
export function subscribeToConversation(userId, conversationId, callback) {
  const ref = doc(db, collections.users, userId, 'conversations', conversationId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    }
  });
}

/**
 * Subscribe to real-time updates for the user's conversation list.
 *
 * @param {string} userId
 * @param {function} callback — called with an array of conversation objects
 * @param {number} [maxResults=20]
 * @returns {function} unsubscribe
 */
export function subscribeToConversations(userId, callback, maxResults = 20) {
  const ref = collection(db, collections.users, userId, 'conversations');
  const q = query(ref, orderBy('updatedAt', 'desc'), limit(maxResults));
  return onSnapshot(q, (snap) => {
    const conversations = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(conversations);
  });
}

/**
 * Get the last message preview from a conversation.
 *
 * @param {object} conversation
 * @returns {{text: string, role: string, time: string}|null}
 */
export function getLastMessagePreview(conversation) {
  const messages = conversation?.messages;
  if (!messages || messages.length === 0) return null;
  const last = messages[messages.length - 1];
  return {
    text: last.content.length > 80 ? last.content.slice(0, 80) + '…' : last.content,
    role: last.role,
    time: last.timestamp,
  };
}

/**
 * Format a conversation's relative time for display.
 *
 * @param {object} conversation
 * @returns {string}
 */
export function formatConversationTime(conversation) {
  const updated = conversation?.updatedAt;
  if (!updated) return '';

  const date = updated.toDate ? updated.toDate() : new Date(updated);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get a human-readable label for a conversation mode.
 *
 * @param {string} mode
 * @returns {string}
 */
export function getModeLabel(mode) {
  const labels = {
    coach: 'Coach',
    practice: 'Practice',
    mirror: 'Mirror',
    debrief: 'Debrief',
    onboarding: 'Onboarding',
  };
  return labels[mode] || 'Coach';
}
