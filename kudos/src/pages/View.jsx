import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getKudos } from '../api.js';

/**
 * Public recipient view. Loads the kudos via Cloud Function (sanitized,
 * no sender info). Shows the message and a "send one to someone else" CTA.
 */
export default function View() {
  const { kudosId } = useParams();
  const [kudos, setKudos] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getKudos(kudosId)
      .then((res) => {
        if (!cancelled) setKudos(res.kudos);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load this kudos.');
      });
    return () => {
      cancelled = true;
    };
  }, [kudosId]);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-rose-600 font-semibold">{error}</p>
        <Link
          to="/"
          className="inline-block mt-4 text-teal font-semibold hover:underline"
        >
          Send a new kudos →
        </Link>
      </div>
    );
  }

  if (!kudos) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-navy/60">
        Loading your kudos…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <section className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal/15 text-teal text-3xl mb-3">
          ♥
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
          {kudos.recipientName}, someone wanted you to know…
        </h1>
        <p className="mt-2 text-navy/60 text-sm">
          A 100% anonymous kudos. The sender isn&apos;t visible — that&apos;s
          on purpose.
        </p>
      </section>

      <article className="bg-white rounded-2xl shadow-pop p-6 sm:p-8">
        <p className="text-lg text-navy leading-relaxed whitespace-pre-wrap">
          {kudos.message}
        </p>
        {kudos.chainPosition > 0 && (
          <p className="mt-6 text-xs uppercase tracking-wide text-teal font-semibold">
            ✨ This is kudos #{kudos.chainPosition + 1} in a chain of kindness
          </p>
        )}
      </article>

      <section className="bg-teal/5 border border-teal/20 rounded-2xl p-6 text-center">
        <h2 className="text-xl font-extrabold text-navy">
          Want to make someone else&apos;s day?
        </h2>
        <p className="mt-2 text-navy/70 text-sm">
          Pass it on. Send a fresh anonymous kudos to anyone you like.
        </p>
        <Link
          to={`/forward/${kudosId}`}
          className="inline-block mt-4 rounded-xl bg-teal text-white font-bold px-6 py-3 hover:bg-teal/90"
        >
          Send one to someone else
        </Link>
      </section>
    </div>
  );
}
