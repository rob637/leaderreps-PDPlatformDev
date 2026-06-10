import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { SCORE_BANDS } from '../data/questions';

const ScorePill = ({ band }) => {
  const config = SCORE_BANDS[band];
  if (!config) return null;
  return (
    <span
      className="inline-flex items-center px-3.5 py-1.5 rounded-full text-[11px] font-extrabold tracking-widest uppercase"
      style={{
        backgroundColor: `${config.color}1F`,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
};

const EmailGate = ({ onSubmit, submitting, submitError, submitted }) => {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);

  const validEmail = /\S+@\S+\.\S+/.test(email);
  const canSubmit = validEmail && !submitting;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({ email });
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#47A88D]/30 bg-[#47A88D]/5 p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-[#47A88D] mx-auto" />
        <h3 className="mt-3 text-lg font-extrabold text-[#002E47]">
          Your analysis and blueprint are on the way.
        </h3>
        <p className="mt-2 text-sm text-slate-700">
          Check your inbox in the next minute or two. If you don&rsquo;t see
          it, check spam or promotions.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
    >
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-5 h-5 text-[#47A88D]" />
        <h3 className="text-lg font-extrabold text-[#002E47]">
          Get your full analysis
        </h3>
      </div>

      <p className="text-sm text-slate-700 leading-relaxed">
        Enter your email to get your full analysis and the{' '}
        <strong>LeaderReps Accountability System Blueprint</strong> &mdash; a
        one-page reference showing what a fully functioning accountability
        system looks like in practice.
      </p>

      <p className="mt-3 text-sm text-slate-700 leading-relaxed">
        You&rsquo;ll also be subscribed to <em>One More Rep</em>, our free
        weekly leadership practice newsletter, built around real leadership
        moments, not theory. Unsubscribe anytime.
      </p>

      <div className="mt-5">
        <label className="block text-xs font-bold text-slate-600 mb-1">
          Your best email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#47A88D]"
          placeholder="you@company.com"
          disabled={submitting}
          required
        />
      </div>

      {submitError && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {touched && !canSubmit && !submitting && (
        <p className="mt-2 text-xs text-red-600">
          Enter a valid email address.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-colors ${
          canSubmit
            ? 'bg-[#47A88D] hover:bg-[#3a8a73] text-white'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {submitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Sending&hellip;
          </>
        ) : (
          <>
            Send my Analysis &amp; Blueprint
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};

const Results = ({
  results,
  onEmailSubmit,
  submitting,
  submitError,
  submitted,
  onRetake,
}) => {
  const band = SCORE_BANDS[results.band] || SCORE_BANDS.developing;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col"
    >
      {/* Header with logo */}
      <header className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img src="/logo-full.png" alt="LeaderReps" className="h-16 md:h-20" />
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Overall Score Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7 sm:p-10">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Your overall score
            </p>

            <div className="mt-3 flex items-baseline gap-3 flex-wrap">
              <span className="text-5xl sm:text-6xl font-extrabold text-[#002E47] leading-none">
                {results.overallScore.toFixed(1)}
              </span>
              <span className="text-2xl font-bold text-slate-400">/ 5</span>
              <ScorePill band={results.band} />
            </div>

            <p className="mt-6 text-base sm:text-lg text-slate-700 leading-relaxed">
              {band.summary}
            </p>
          </div>

          {/* Email gate */}
          <div className="mt-6">
            <EmailGate
              onSubmit={onEmailSubmit}
              submitting={submitting}
              submitError={submitError}
              submitted={submitted}
            />
          </div>

          {/* Retake */}
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onRetake}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-[#002E47] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retake the audit
            </button>
          </div>
        </div>
      </main>
    </motion.div>
  );
};

export default Results;
