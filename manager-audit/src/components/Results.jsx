import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Mail,
  RefreshCw,
  Linkedin,
  AlertCircle,
} from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_DIAGNOSTICS,
  CATEGORY_STRONG_NOTES,
  SCORE_BANDS,
} from '../data/questions';

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

const CategoryBlock = ({ catId, score, isStrong }) => {
  const cat = CATEGORIES[catId];
  if (!cat) return null;

  if (isStrong) {
    return (
      <div className="rounded-2xl border border-[#277A68]/30 bg-[#277A68]/5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#277A68]">
              {cat.label}
            </p>
            <p className="mt-1 text-base font-bold text-[#002E47]">
              Strong &middot; {score.toFixed(1)}/5
            </p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-[#277A68] flex-shrink-0" />
        </div>
        <p className="mt-2 text-sm text-slate-700 leading-relaxed">
          {CATEGORY_STRONG_NOTES[catId]}
        </p>
      </div>
    );
  }

  const diag = CATEGORY_DIAGNOSTICS[catId];
  const bandLabel = score >= 2.5 ? 'Developing' : 'Gap';
  const accent = score >= 2.5 ? '#C9913A' : '#B84825';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p
            className="text-[10px] font-extrabold uppercase tracking-widest"
            style={{ color: accent }}
          >
            {cat.label}
          </p>
          <p className="mt-1 text-base font-bold text-[#002E47]">
            {bandLabel} &middot; {score.toFixed(1)}/5
          </p>
        </div>
        <span
          className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase"
          style={{
            backgroundColor: `${accent}1A`,
            color: accent,
          }}
        >
          {bandLabel}
        </span>
      </div>

      <h3 className="text-lg font-extrabold text-[#002E47] leading-snug">
        {diag.headline}
      </h3>
      <p className="mt-2 text-sm text-slate-700 leading-relaxed">{diag.body}</p>

      <div className="mt-4 rounded-xl bg-[#002E47] text-white p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#47A88D]">
          The rep that closes the gap
        </p>
        <p className="mt-1.5 text-sm leading-relaxed">{diag.rep}</p>
      </div>

      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          What you&rsquo;ll see when this strengthens
        </p>
        <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
          {diag.youWillSee}
        </p>
      </div>
    </div>
  );
};

const EmailGate = ({ onSubmit, submitting, submitError, submitted }) => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [touched, setTouched] = useState(false);

  const validEmail = /\S+@\S+\.\S+/.test(email);
  const canSubmit = firstName.trim().length > 0 && validEmail && !submitting;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({ firstName, email, company });
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-[#277A68]/30 bg-[#277A68]/5 p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-[#277A68] mx-auto" />
        <h3 className="mt-3 text-lg font-extrabold text-[#002E47]">
          Your full audit is on the way.
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
      className="rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Mail className="w-5 h-5 text-[#277A68]" />
        <h3 className="text-lg font-extrabold text-[#002E47]">
          Email me the full audit
        </h3>
      </div>
      <p className="text-sm text-slate-600 mb-5">
        Get the complete breakdown by email so you can share it with your
        leadership team.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            First name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#277A68]"
            placeholder="Alex"
            disabled={submitting}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Work email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#277A68]"
            placeholder="alex@company.com"
            disabled={submitting}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            Company <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#277A68]"
            placeholder="Acme Inc."
            disabled={submitting}
          />
        </div>
      </div>

      {submitError && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {touched && !canSubmit && !submitting && (
        <p className="mt-2 text-xs text-red-600">
          Enter your first name and a valid work email.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-colors ${
          canSubmit
            ? 'bg-[#E04E1B] hover:bg-[#C04313] text-white'
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
            Send me the full audit
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="mt-3 text-[11px] text-slate-400 text-center">
        We&rsquo;ll never sell your email. Unsubscribe any time.
      </p>
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
  const orderedCategories = useMemo(
    () =>
      Object.values(CATEGORIES)
        .filter((c) => c.scored)
        .sort((a, b) => a.order - b.order),
    [],
  );

  const band = SCORE_BANDS[results.band] || SCORE_BANDS.developing;

  const shareUrl = 'https://leaderreps-manager-audit.web.app';
  const shareText = `I just took The Manager Accountability Audit from LeaderReps. My management team scored ${band.label}.`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen px-4 py-10"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header / Overall Score */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-7 sm:p-9">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            Your Manager Accountability Audit
          </p>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#002E47] leading-tight">
              Overall score: {results.overallScore.toFixed(1)}/5
            </h1>
            <ScorePill band={results.band} />
          </div>

          <h2 className="mt-4 text-xl sm:text-2xl font-extrabold text-[#002E47] leading-snug">
            {results.headline}
          </h2>

          <p className="mt-3 text-base text-slate-700 leading-relaxed">
            {results.summary}
          </p>
        </div>

        {/* Per-category breakdown */}
        <div className="mt-7">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-4">
            The Four Reps
          </p>
          <div className="space-y-4">
            {orderedCategories.map((cat) => {
              const score = results.categoryScores[cat.id] || 0;
              const isStrong = score >= 3.5;
              return (
                <CategoryBlock
                  key={cat.id}
                  catId={cat.id}
                  score={score}
                  isStrong={isStrong}
                />
              );
            })}
          </div>
        </div>

        {/* Email gate */}
        <div className="mt-8">
          <EmailGate
            onSubmit={onEmailSubmit}
            submitting={submitting}
            submitError={submitError}
            submitted={submitted}
          />
        </div>

        {/* Foundation CTA */}
        <div className="mt-8 rounded-3xl bg-[#002E47] text-white p-7 sm:p-9">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#47A88D]">
            Next Step
          </p>
          <h3 className="mt-2 text-xl sm:text-2xl font-extrabold leading-snug">
            Your audit showed you the gaps. Foundation is where you close them.
          </h3>
          <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
            Foundation is a small-cohort program where managers practice the
            exact reps you just scored &mdash; setting expectations, following
            up, reinforcing what works, redirecting what doesn&rsquo;t. Live
            reps, not theory.
          </p>
          <a
            href="https://www.leaderreps.com/foundation"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#E04E1B] hover:bg-[#C04313] font-bold text-sm transition-colors"
          >
            Learn about Foundation
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Share + retake */}
        <div className="mt-7 flex flex-wrap gap-3 items-center justify-between">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              shareUrl,
            )}&summary=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-[#002E47] hover:border-[#277A68] hover:text-[#277A68] transition-colors"
          >
            <Linkedin className="w-4 h-4" />
            Share on LinkedIn
          </a>

          <button
            type="button"
            onClick={onRetake}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:text-[#002E47] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retake the audit
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          A LeaderReps tool &middot; leaderreps.com
        </p>
      </div>
    </motion.div>
  );
};

export default Results;
