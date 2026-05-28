// src/components/lab/RFKudosPublicStart.jsx
//
// Public Reinforcing Feedback Kudos lead magnet. NOT anonymous —
// the leader is attributed (their name + voice). A leader drafts a
// kudos for one of their direct reports, our AI coach grades it on
// the same DRF rubric the in-platform tool uses (Behavior / Impact /
// Reinforcement, 0-3 each), and returns a stronger version the
// leader can copy and send themselves from their own channel.
//
// Backend: POST gradeRFKudos (functions/index.js)
// Captures: rfkudos_leads/{id}
//
// Reached via ?rf-kudos-start
// No login required.

import React, { useState, useRef, useEffect } from 'react';
import {
  ThumbsUp,
  Sparkles,
  ArrowRight,
  Award,
  Loader2,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Target,
} from 'lucide-react';

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const GRADE_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/gradeRFKudos`;
const LAB_URL = 'https://leaderreps-lab.web.app/';
const MAX_DRAFT = 1500;

const SAMPLES = [
  {
    label: 'Quiet impact',
    text:
      'Hey — really wanted to flag that you handled the client call yesterday well. Calm, prepared, and you brought them back on track. Nice work.',
  },
  {
    label: 'Coaching a peer',
    text:
      'I noticed you spent 20 minutes after standup walking Jordan through the deploy process. That kind of generosity is what I want more of from you. Thank you.',
  },
  {
    label: 'Speaking up',
    text:
      'In the planning meeting you pushed back on the timeline when nobody else would. That kind of judgment is exactly the bar I want on this team.',
  },
];

function ScoreBar({ value, max = 3 }) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  const tone =
    value >= 3
      ? 'bg-emerald-500'
      : value === 2
        ? 'bg-teal-500'
        : value === 1
          ? 'bg-amber-500'
          : 'bg-rose-500';
  return (
    <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
      <div
        className={`h-full ${tone} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ScoreRow({ label, score, anchor }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-sm font-bold text-corporate-navy dark:text-white">
          {label}
        </div>
        <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          {score} / 3
          {anchor ? (
            <span className="ml-2 text-xs text-slate-500">· {anchor}</span>
          ) : null}
        </div>
      </div>
      <ScoreBar value={score} />
    </div>
  );
}

export default function RFKudosPublicStart() {
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const fillSample = (sample) => {
    setDraft(sample.text);
  };

  const validate = () => {
    if (!leaderName.trim()) return 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leaderEmail))
      return 'Please enter a valid email.';
    if (!recipientName.trim())
      return 'Please enter the name of the person you want to recognize.';
    if (draft.trim().length < 10)
      return 'Please write at least a sentence or two for your draft.';
    return null;
  };

  const handleGrade = async () => {
    setError('');
    setResult(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(GRADE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderName: leaderName.trim(),
          leaderEmail: leaderEmail.trim(),
          recipientName: recipientName.trim(),
          draft: draft.trim(),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || data.error) {
        setError(data.error || `Grading failed (${resp.status})`);
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.strongerVersion || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // no-op
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setDraft('');
  };

  const goLab = () => {
    window.location.href = LAB_URL;
  };

  return (
    <div className="min-h-screen bg-[#FFFAF8] dark:bg-slate-950">
      {/* Hero */}
      <header className="bg-corporate-navy text-white">
        <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-corporate-teal mb-3">
            <ThumbsUp className="w-4 h-4" />
            Reinforcing Feedback Kudos
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight max-w-3xl">
            Draft a kudos. Get AI-coached on it in 10 seconds.
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl leading-relaxed">
            Write a piece of recognition for someone on your team in your
            own voice. Our AI coach grades it for specificity,
            behavior-anchoring, and impact — then shows you a sharper
            version you can send today. Free. No sign-up to try.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-6">
        {/* Composer */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-card">
          <h2 className="text-xl font-extrabold text-corporate-navy dark:text-white mb-1">
            Your draft
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
            This kudos will be from <em>you</em> to someone on your team —
            we won&rsquo;t send anything for you, we just coach the draft.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                placeholder="e.g. Maya R."
                maxLength={80}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-corporate-navy dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-corporate-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                Your email
              </label>
              <input
                type="email"
                value={leaderEmail}
                onChange={(e) => setLeaderEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-corporate-navy dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-corporate-teal"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                We&rsquo;ll send tips for your next rep. No spam.
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Who is the kudos for?
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="First name is fine — e.g. Priya"
              maxLength={80}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-corporate-navy dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            />
          </div>

          <div className="mb-2">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
              Your kudos draft
            </label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              maxLength={MAX_DRAFT}
              placeholder="Write what you'd actually say. Don't pre-edit — the rep is more useful when the AI sees your real default."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm text-corporate-navy dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-corporate-teal leading-relaxed resize-y"
            />
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex flex-wrap gap-1.5">
                {SAMPLES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => fillSample(s)}
                    className="text-[11px] px-2 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-corporate-teal/5 hover:border-corporate-teal/40 transition-colors"
                  >
                    Sample: {s.label}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500">
                {draft.length} / {MAX_DRAFT}
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 flex items-start gap-2 text-sm text-rose-700 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleGrade}
            disabled={loading}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-corporate-orange text-white text-sm font-bold hover:bg-corporate-orange/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Coaching your draft…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Get AI feedback
              </>
            )}
          </button>
        </section>

        {/* Result */}
        {result ? (
          <section
            ref={resultRef}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-card space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-corporate-teal mb-1">
                  <Award className="w-4 h-4" />
                  Your grade
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-corporate-navy dark:text-white">
                  {result.overall} / 9
                </h2>
                {result.headline ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {result.headline}
                  </p>
                ) : null}
              </div>
              <div
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                  result.pass
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                }`}
              >
                {result.pass ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" /> Needs work
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <ScoreRow
                label="Behavior"
                score={result.scores?.behavior ?? 0}
                anchor={result.behaviorLabel}
              />
              <ScoreRow
                label="Impact"
                score={result.scores?.impact ?? 0}
                anchor={result.impactLabel}
              />
              <ScoreRow
                label="Reinforcement"
                score={result.scores?.reinforcement ?? 0}
                anchor={result.reinforcementLabel}
              />
            </div>

            {result.strongerVersion ? (
              <div className="rounded-xl border border-corporate-teal/30 bg-corporate-teal/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-corporate-teal" />
                  <h3 className="text-sm font-extrabold text-corporate-navy dark:text-white uppercase tracking-wide">
                    Stronger version
                  </h3>
                </div>
                <p className="text-sm md:text-base text-corporate-navy dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                  {result.strongerVersion}
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-corporate-teal text-white text-xs font-bold hover:bg-corporate-teal/90 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy stronger version
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Try another draft
                  </button>
                </div>
              </div>
            ) : null}

            {Array.isArray(result.tips) && result.tips.length > 0 ? (
              <div>
                <h3 className="text-sm font-extrabold text-corporate-navy dark:text-white uppercase tracking-wide mb-2">
                  Tips for next time
                </h3>
                <ul className="space-y-1.5">
                  {result.tips.map((tip, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-corporate-teal shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-xl bg-corporate-navy text-white p-5 text-center">
              <p className="text-sm md:text-base font-semibold">
                Want to track your reps over time and see your scores climb?
              </p>
              <button
                type="button"
                onClick={goLab}
                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-corporate-orange text-white text-sm font-bold hover:bg-corporate-orange/90 transition-colors"
              >
                Open Leadership Lab — free
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        ) : null}

        {/* Why this rep matters — only show before first grade */}
        {!result ? (
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-card">
            <h2 className="text-lg md:text-xl font-extrabold text-corporate-navy dark:text-white mb-3">
              Why a single rep matters
            </h2>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Most leaders under-deliver reinforcing feedback by about 3×.
              The ratio of reinforcing to redirecting should run at least
              3:1 — most leaders run closer to 1:3. When the only feedback
              your team hears is corrective, they learn to brace for
              criticism rather than reach for growth. Catching people doing
              things right is a leadership behavior, not a personality
              trait. It takes practice.
            </p>
          </section>
        ) : null}

        <footer className="text-center text-xs text-slate-500 dark:text-slate-400 pt-4">
          A LeaderReps Lab experiment. Questions? Email
          <a
            href="mailto:hello@leaderreps.com"
            className="text-corporate-teal hover:underline ml-1"
          >
            hello@leaderreps.com
          </a>
          .
        </footer>
      </main>
    </div>
  );
}
