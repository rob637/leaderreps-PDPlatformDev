import { Link, useLocation, useNavigate } from 'react-router-dom';
import ModerationResult from '../components/ModerationResult.jsx';

export default function Sent() {
  const navigate = useNavigate();
  const { state } = useLocation();

  if (!state) {
    // Direct navigation — nothing to show.
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-navy/60">No recent kudos to show.</p>
        <Link
          to="/"
          className="inline-block mt-4 text-teal font-semibold hover:underline"
        >
          Send one now →
        </Link>
      </div>
    );
  }

  const { decision, recipientName, original, allowEdit, draft, returnTo } =
    state;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      {decision !== 'reject' && (
        <section className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal/15 text-teal text-3xl mb-3">
            ♥
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy">
            On its way to {recipientName}
          </h1>
          <p className="mt-2 text-navy/70">
            They&apos;ll get an email shortly with your anonymous kudos.
          </p>
        </section>
      )}

      <ModerationResult result={state} original={original} />

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        {allowEdit ? (
          <button
            type="button"
            onClick={() =>
              navigate(returnTo || '/', {
                replace: true,
                state: draft ? { draft } : undefined,
              })
            }
            className="flex-1 rounded-xl bg-teal text-white font-bold py-3 hover:bg-teal/90"
          >
            Edit and try again
          </button>
        ) : (
          <Link
            to="/"
            className="flex-1 text-center rounded-xl bg-teal text-white font-bold py-3 hover:bg-teal/90"
          >
            Send another kudos
          </Link>
        )}
        <a
          href="https://leaderreps.com"
          target="_blank"
          rel="noreferrer"
          className="flex-1 text-center rounded-xl border-2 border-navy/15 text-navy font-bold py-3 hover:border-teal hover:text-teal"
        >
          Learn about LeaderReps
        </a>
      </div>
    </div>
  );
}
