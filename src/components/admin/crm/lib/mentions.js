/**
 * Mentions helpers
 *
 * Provides `extractMentions(text, members)` which scans a body of text
 * for `@token` patterns and returns matching team-member email addresses,
 * and `dispatchMentionNotifications` which writes notification docs to
 * `crm_notifications` (one per mentioned recipient).
 *
 * Token resolution order:
 *   1. Exact email match (case-insensitive)
 *   2. Exact local-part match (foo@bar.com → "foo")
 *   3. Whole-name match (e.g. "rob smith" → "rob.smith" or "rsmith")
 */

import { useNotificationsStore } from '../stores/notificationsStore';

const MENTION_RE = /@([a-zA-Z][a-zA-Z0-9._-]{1,40})/g;

export function extractMentions(text, members = []) {
  if (!text || typeof text !== 'string' || !members.length) return [];
  const tokens = new Set();
  let m;
  while ((m = MENTION_RE.exec(text)) !== null) {
    tokens.add(m[1].toLowerCase());
  }
  if (tokens.size === 0) return [];

  const matches = new Set();
  for (const token of tokens) {
    for (const member of members) {
      const email = (member.email || '').toLowerCase();
      if (!email) continue;
      const local = email.split('@')[0];
      const name = (member.name || member.displayName || '')
        .toLowerCase()
        .replace(/\s+/g, '');
      if (
        email === token ||
        local === token ||
        local.replace(/\./g, '') === token ||
        name === token
      ) {
        matches.add(email);
      }
    }
  }
  return Array.from(matches);
}

/**
 * Create a `crm_notifications` doc for each mentioned recipient.
 *
 * @param {object} args
 * @param {string} args.text - the body that may contain @mentions
 * @param {Array}  args.members - candidates (must include {email, name?})
 * @param {object} args.context - {entityType, entityId, prospectName?, link?}
 * @param {string} args.actorEmail - email of the person mentioning
 */
export async function dispatchMentionNotifications({
  text,
  members,
  context,
  actorEmail,
}) {
  const recipients = extractMentions(text, members).filter(
    (r) => r !== (actorEmail || '').toLowerCase()
  );
  if (!recipients.length) return [];

  const { addNotification } = useNotificationsStore.getState();
  const created = [];
  for (const recipient of recipients) {
    try {
      const id = await addNotification({
        recipientEmail: recipient,
        type: 'mention',
        title: `You were mentioned`,
        message:
          (context?.prospectName ? `On ${context.prospectName}: ` : '') +
          (text || '').slice(0, 200),
        link: context?.link || { tab: 'prospects', entityId: context?.entityId },
      });
      created.push(id);
    } catch (err) {
      // Non-fatal — surface in console only
      // eslint-disable-next-line no-console
      console.warn('Failed to create mention notification', err);
    }
  }
  return created;
}
