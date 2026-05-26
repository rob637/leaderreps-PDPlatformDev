/**
 * Visual panel that renders the moderation result returned by `sendKudos`.
 * Shows accept/rewrite/reject state with reason + concerns + diff.
 */
export default function ModerationResult({ result, original }) {
  if (!result) return null;
  const { decision, reason, rewritten, concerns = [], sentiment } = result;

  if (decision === 'accept') {
    return (
      <div className="rounded-xl border border-teal/30 bg-teal/5 p-4">
        <p className="font-bold text-teal flex items-center gap-2">
          <span aria-hidden>✓</span> Your kudos was sent
        </p>
        <p className="text-sm text-navy/70 mt-1">
          {reason || 'Looked great — delivered as written.'}
        </p>
        {sentiment && (
          <p className="text-xs text-navy/50 mt-2 uppercase tracking-wide">
            Tone: {sentiment}
          </p>
        )}
      </div>
    );
  }

  if (decision === 'rewrite') {
    return (
      <div className="rounded-xl border border-amber-400/40 bg-amber-50 p-4">
        <p className="font-bold text-amber-700 flex items-center gap-2">
          <span aria-hidden>✎</span> We softened your message a little
        </p>
        <p className="text-sm text-navy/70 mt-1">
          {reason ||
            'A few phrases could have been read the wrong way, so we adjusted them.'}
        </p>
        <div className="mt-3 rounded-lg bg-white p-3 border border-amber-200">
          <p className="text-xs uppercase tracking-wide text-navy/50 mb-1">
            Sent
          </p>
          <p className="text-navy whitespace-pre-wrap">{rewritten}</p>
        </div>
        {original && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-navy/60 font-semibold">
              See what changed
            </summary>
            <div className="mt-2 rounded-lg bg-white/70 p-3 border border-amber-100">
              <p className="text-xs uppercase tracking-wide text-navy/50 mb-1">
                Your original
              </p>
              <p className="text-navy/70 whitespace-pre-wrap">{original}</p>
            </div>
          </details>
        )}
      </div>
    );
  }

  // reject
  return (
    <div className="rounded-xl border border-rose-300 bg-rose-50 p-4">
      <p className="font-bold text-rose-700 flex items-center gap-2">
        <span aria-hidden>✕</span> We couldn&apos;t send this one
      </p>
      <p className="text-sm text-navy/70 mt-1">
        {reason ||
          'This message didn\'t pass our kindness check. Try rewording it.'}
      </p>
      {concerns.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1">
          {concerns.map((c) => (
            <li
              key={c}
              className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700"
            >
              {c}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-navy/60 mt-3">
        Kudos is for genuine, recipient-focused appreciation — no asks, no
        identifying hints, no backhanded compliments.
      </p>
    </div>
  );
}
