/**
 * Centralized admin email source.
 *
 * Single source of truth for the admin allow-list on the client. Always
 * prefers `metadata/config.adminemails` (live, server-managed) and falls back
 * to a baked-in seed list ONLY when Firestore is unreachable. This avoids the
 * drift problem where a newly-promoted admin (added to metadata/config) had
 * no admin UI because the local hardcoded list lagged.
 *
 * The fallback seed list MUST stay in sync with the hardcoded admins in
 * `firestore.rules` `isAdmin()` to preserve defense-in-depth, but it is not
 * the authoritative client list — it is only used when the network call fails.
 */
import { doc, getDoc } from 'firebase/firestore';

// Fallback seed — used only when metadata/config cannot be read.
// Keep in sync with firestore.rules isAdmin().
export const FALLBACK_ADMIN_EMAILS = Object.freeze([
  'rob@sagecg.com',
  'ryan@leaderreps.com',
  'admin@leaderreps.com',
  'cristina@leaderreps.com',
]);

/**
 * Fetch the live admin email list from Firestore.
 * @param {import('firebase/firestore').Firestore} db
 * @returns {Promise<string[]>} lowercased admin emails
 */
export async function fetchAdminEmails(db) {
  try {
    const snap = await getDoc(doc(db, 'metadata', 'config'));
    if (snap.exists() && Array.isArray(snap.data().adminemails)) {
      return snap.data().adminemails.map((e) => String(e).toLowerCase());
    }
  } catch (err) {
    console.warn('[adminAuth] fetchAdminEmails fallback:', err?.message || err);
  }
  return FALLBACK_ADMIN_EMAILS.map((e) => e.toLowerCase());
}

/**
 * Check whether a user email is in the admin list.
 * @param {string|null|undefined} email
 * @param {string[]} adminEmails - already-lowercased list (from fetchAdminEmails)
 */
export function isAdminEmail(email, adminEmails) {
  if (!email || !Array.isArray(adminEmails)) return false;
  return adminEmails.includes(String(email).toLowerCase());
}
