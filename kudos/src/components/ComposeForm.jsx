import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendKudos } from '../api.js';
import { SAMPLES, MAX_LEN, MAX_NAME } from '../constants.js';

/**
 * Shared compose form used by both the root page and the forward page.
 * Owns its own state, validation, submission, and moderation outcome.
 *
 * If the user came back from the Sent page via "Edit and try again",
 * `location.state.draft` re-hydrates the previously entered values so they
 * don't have to retype anything.
 */
export default function ComposeForm({ parentKudosId, chainPosition }) {
  const navigate = useNavigate();
  const location = useLocation();
  const draft = location.state?.draft || null;
  const [recipientName, setRecipientName] = useState(
    () => draft?.recipientName || '',
  );
  const [recipientEmail, setRecipientEmail] = useState(
    () => draft?.recipientEmail || '',
  );
  const [message, setMessage] = useState(() => draft?.message || '');
  const [senderEmail, setSenderEmail] = useState(
    () => draft?.senderEmail || '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const valid =
    recipientName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail) &&
    message.trim().length >= 10 &&
    message.length <= MAX_LEN;

  const forwardOrigin =
    import.meta.env.VITE_PUBLIC_ORIGIN || window.location.origin;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!valid || submitting) return;
    setError(null);
    setSubmitting(true);
    const draftSnapshot = {
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim(),
      message: message.trim(),
      senderEmail: senderEmail.trim(),
    };
    const returnTo = location.pathname;
    try {
      const result = await sendKudos({
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim().toLowerCase(),
        message: message.trim(),
        senderEmail: senderEmail.trim().toLowerCase(),
        parentKudosId: parentKudosId || undefined,
        forwardOrigin,
      });
      navigate('/sent', {
        state: {
          decision: result.decision,
          reason: result.reason,
          rewritten: result.rewritten,
          concerns: result.concerns,
          sentiment: result.sentiment,
          original: message.trim(),
          recipientName: recipientName.trim(),
          chainPosition: chainPosition || null,
          draft: draftSnapshot,
          returnTo,
        },
      });
    } catch (err) {
      // If the function returns a moderation reject in the body, surface it.
      const data = err.data || {};
      if (data?.decision === 'reject') {
        navigate('/sent', {
          state: {
            decision: 'reject',
            reason: data.reason,
            concerns: data.concerns,
            original: message.trim(),
            recipientName: recipientName.trim(),
            allowEdit: true,
            draft: draftSnapshot,
            returnTo,
          },
        });
      } else if (err.status === 429) {
        setError(
          'You\'ve sent a lot of kudos recently. Please try again in a bit.',
        );
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {chainPosition != null && (
        <div className="rounded-xl bg-teal/10 border border-teal/30 p-3 text-sm text-navy">
          <p className="font-semibold text-teal">
            ✨ You&apos;re continuing a chain
          </p>
          <p className="mt-0.5 text-navy/70">
            This will be kudos #{chainPosition + 2} in the ripple. Someone sent
            you kindness — pass it on.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-navy mb-1">
          Their first name
        </label>
        <input
          type="text"
          required
          maxLength={MAX_NAME}
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-3 py-2 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
          placeholder="e.g. Jordan"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-navy mb-1">
          Their email
        </label>
        <input
          type="email"
          required
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-3 py-2 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
          placeholder="jordan@example.com"
        />
        <p className="text-xs text-navy/50 mt-1">
          We&apos;ll email them your kudos. They will not see your email or
          name.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-navy mb-1">
          Your kudos
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {SAMPLES.map((s) => (
            <button
              type="button"
              key={s.title}
              onClick={() => setMessage(s.text)}
              className="text-xs px-2.5 py-1 rounded-full bg-navy/5 hover:bg-teal/15 text-navy/70 hover:text-teal"
            >
              {s.title}
            </button>
          ))}
        </div>
        <textarea
          required
          rows={6}
          maxLength={MAX_LEN}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-3 py-2 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20 resize-y"
          placeholder="Tell them what you appreciate..."
        />
        <div className="flex justify-between text-xs text-navy/50 mt-1">
          <span>
            {message.length < 10
              ? 'A little more — at least 10 characters'
              : '\u00A0'}
          </span>
          <span>
            {message.length} / {MAX_LEN}
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-navy mb-1">
          Your email{' '}
          <span className="font-normal text-navy/50">
            (kept private — never shown to {recipientName.trim() || 'them'})
          </span>
        </label>
        <input
          type="email"
          required
          value={senderEmail}
          onChange={(e) => setSenderEmail(e.target.value)}
          className="w-full rounded-lg border border-navy/20 px-3 py-2 focus:outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
          placeholder="you@example.com"
        />
        <p className="text-xs text-navy/50 mt-1">
          We capture this only to prevent spam and abuse. It&apos;s never shown
          to the recipient and never used for marketing.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!valid || submitting}
        className="w-full rounded-xl bg-teal text-white font-bold py-3 hover:bg-teal/90 disabled:bg-navy/20 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Checking & sending…' : 'Send kudos'}
      </button>

      <p className="text-xs text-center text-navy/50">
        Every kudos is reviewed by AI to keep it kind. Hateful, identifying,
        passive-aggressive, or transactional messages are blocked.
      </p>
    </form>
  );
}
