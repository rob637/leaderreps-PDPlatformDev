const API_BASE =
  import.meta.env.VITE_API_BASE ||
  'https://us-central1-leaderreps-pd-platform.cloudfunctions.net';

async function call(name, body) {
  const res = await fetch(`${API_BASE}/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok || !data?.success) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/**
 * Send a new kudos. Triggers AI moderation server-side; if accepted/rewritten,
 * the message is persisted and email is queued.
 *
 * @param {object} payload
 * @param {string} payload.recipientName
 * @param {string} payload.recipientEmail
 * @param {string} payload.message
 * @param {string} payload.senderEmail   (captured for abuse prevention, never shown)
 * @param {string} [payload.parentKudosId]  for pay-it-forward chains
 * @param {string} payload.forwardOrigin  origin to embed in outbound email link
 */
export function sendKudos(payload) {
  return call('sendKudos', payload);
}

/**
 * Public read of a single kudos by id. Returns sanitized data only —
 * never includes the sender email or moderation internals.
 */
export function getKudos(kudosId) {
  return call('getKudos', { kudosId });
}
