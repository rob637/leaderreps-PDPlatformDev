// src/components/screens/ConditioningLight.jsx
//
// Ascent Revamp — Conditioning Tool (Light) — REPLACES legacy Conditioning.
// See REVAMP-PLAN.md §6 for the full v1 spec.
//
// Flow:
//   1. Single "Practice a Rep" entry (rrType selector).
//   2. One open text box + optional mic (Web Speech API).
//   3. Submit → calls `evaluateRep` Cloud Function.
//   4. Verdict screen: Pass / Not Yet badge + Quick Read pills +
//      one observation + (one question if not Strong).
//
// Hard rules (from spec):
//   - NO numeric scores ever shown to user.
//   - NO planned-vs-logged distinction.
//   - Reps stored in `users/{uid}/reps_light` (new collection).

import React, { useMemo, useState } from 'react';
import {
  Zap, Loader2, ArrowLeft, RotateCcw,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getBreadcrumbs } from '../../config/breadcrumbConfig.js';
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';
import { useAppServices } from '../../services/useAppServices';
import VoiceTextarea from '../conditioning/VoiceTextarea';

// ---------------------------------------------------------------------------
// RR catalog — names + condition keys MUST match functions/conditioning/rrConfig.js
// exactly (case-sensitive). Quick Read pills render whatever the engine returns,
// so the keys here are only used for the input-step prompt copy.
// ---------------------------------------------------------------------------
const RR_TYPES = [
  {
    key: 'DRF',
    name: 'Reinforcing Feedback',
    blurb: 'Catch a specific behavior, name the impact, reinforce it so it repeats.',
    promptHint:
      'Describe the feedback you gave: the specific behavior, the impact it had, and how you reinforced it.',
  },
  {
    key: 'RED',
    name: 'Redirecting Feedback',
    blurb: 'Name the behavior, the impact, and make a clear request — directly.',
    promptHint:
      'Describe the redirecting feedback: the behavior, the impact, what you asked them to do differently, and how you delivered it.',
  },
  {
    key: 'FUW',
    name: 'Follow-Up on Work',
    blurb: 'Anchor follow-up to specific work, surface progress, hold ownership.',
    promptHint:
      'Describe the follow-up: which piece of work it was anchored to, how you checked progress, and who owned next steps.',
  },
  {
    key: 'SCE',
    name: 'Set Clear Expectations',
    blurb: 'Name the expectation, define what success looks like, confirm ownership.',
    promptHint:
      'Describe how you set the expectation: what you asked for, how you defined success, and who owns delivering it.',
  },
];

// LABEL_TIER maps every v2 label (Specific, Concrete, Vague, Implied, ...) to
// one of four tiers: strong | adequate | weak | missing. Kept inline so the
// UI bundle doesn’t pull from the functions/ directory.
const LABEL_TIER = {
  // strong
  Specific: 'strong', Concrete: 'strong', Explicit: 'strong', Clear: 'strong',
  Direct: 'strong', Clean: 'strong', Anchored: 'strong', Visible: 'strong',
  Named: 'strong', Defined: 'strong', Observable: 'strong', Confirmed: 'strong',
  Strong: 'strong',
  // adequate
  Present: 'adequate', Implicit: 'adequate', Partial: 'adequate',
  'In-group': 'adequate', Mixed: 'adequate', General: 'adequate',
  Soft: 'adequate', Acknowledged: 'adequate', Adequate: 'adequate',
  // weak
  Vague: 'weak', Generic: 'weak', Async: 'weak', Hedged: 'weak',
  Weak: 'weak', Sentiment: 'weak', Implied: 'weak', Assumed: 'weak',
  // missing
  Missing: 'missing', Indirect: 'missing', Avoided: 'missing',
};

const tierClass = (label) => {
  const tier = LABEL_TIER[label] || 'missing';
  switch (tier) {
    case 'strong':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    case 'adequate':
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800';
    case 'weak':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    case 'missing':
    default:
      return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800';
  }
};

const conditionLabel = (k) =>
  k
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const ConditioningLight = () => {
  const [step, setStep] = useState('select'); // select | input | submitting | verdict
  const [rrType, setRrType] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [verdict, setVerdict] = useState(null);

  const { navigate } = useAppServices();

  const rr = useMemo(() => RR_TYPES.find((r) => r.key === rrType), [rrType]);
  const isPass = verdict?.result === 'pass';

  const reset = () => {
    setStep('select');
    setRrType(null);
    setTranscript('');
    setError(null);
    setVerdict(null);
  };

  const startNew = () => {
    setStep('select');
    setRrType(null);
    setTranscript('');
    setError(null);
    setVerdict(null);
  };

  const submit = async () => {
    if (!rrType || !transcript.trim()) return;
    setStep('submitting');
    setError(null);
    try {
      const functions = getFunctions();
      const evaluateRep = httpsCallable(functions, 'evaluateRep');
      const res = await evaluateRep({ rrType, transcript: transcript.trim() });
      setVerdict(res.data);
      setStep('verdict');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('evaluateRep failed', err);
      setError(err?.message || 'Could not evaluate this rep. Try again.');
      setStep('input');
    }
  };

  // -------------------------------------------------------------------------
  // Step: select RR
  // -------------------------------------------------------------------------
  if (step === 'select') {
    return (
      <div className="max-w-[860px] mx-auto p-4 sm:p-6 lg:p-8">
        <BreadcrumbNav items={getBreadcrumbs('conditioning-light')} navigate={navigate} />
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Zap className="w-8 h-8 text-corporate-teal" />
            <h1
              className="text-3xl font-bold text-corporate-navy dark:text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Practice a Rep
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Pick the rep type, write or say your attempt, get a verdict.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {RR_TYPES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => { setRrType(r.key); setStep('input'); }}
              className="group text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 border-l-4 border-l-corporate-teal rounded-2xl p-5 shadow-card hover:shadow-pop hover:-translate-y-1 hover:border-corporate-teal/60 transition-all duration-200 ease-out will-change-transform focus:outline-none focus:ring-2 focus:ring-corporate-teal/40"
            >
              <div className="text-xs font-semibold tracking-wider text-corporate-teal-ink mb-1">
                {r.key}
              </div>
              <h2 className="text-base font-semibold text-corporate-navy dark:text-white mb-1">
                {r.name}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {r.blurb}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Step: input transcript
  // -------------------------------------------------------------------------
  if (step === 'input' || step === 'submitting') {
    const submitting = step === 'submitting';
    return (
      <div className="max-w-[860px] mx-auto p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-corporate-teal-ink mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Pick a different rep
        </button>

        <header className="mb-4">
          <div className="text-xs font-semibold tracking-wider text-corporate-teal-ink">
            {rr.key}
          </div>
          <h1
            className="text-2xl font-bold text-corporate-navy dark:text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {rr.name}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {rr.promptHint}
          </p>
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
          <VoiceTextarea
            value={transcript}
            onChange={setTranscript}
            disabled={submitting}
            rows={8}
            placeholder="Type or tap the mic to speak your rep…"
          />
          <div className="flex items-center justify-end pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={submit}
              disabled={submitting || transcript.trim().length < 5}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Evaluating…' : 'Submit Rep'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {verdict && !isPass && (verdict.observation || verdict.question) && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">Feedback from your last attempt</p>
            {verdict.observation && <p className="text-sm text-slate-800 dark:text-slate-200 mb-1">{verdict.observation}</p>}
            {verdict.question && <p className="text-sm text-slate-600 dark:text-slate-400 italic">{verdict.question}</p>}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Step: verdict
  // -------------------------------------------------------------------------
  const isInvalid = verdict?.validity === 'invalid';
  const quickRead = verdict?.quickRead || {};

  return (
    <div className="max-w-[860px] mx-auto p-4 sm:p-6 lg:p-8">
      <div className={`rounded-2xl p-6 mb-4 border ${
        isPass
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
          : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
      }`}>
        <div className="flex items-center gap-3">
          {isPass ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          ) : (
            <AlertCircle className="w-8 h-8 text-amber-600" />
          )}
          <div>
            <div className="text-xs font-semibold tracking-wider text-slate-500">
              {rr?.key} — {rr?.name}
            </div>
            <h1
              className="text-2xl font-bold text-corporate-navy dark:text-white"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {isPass ? 'Pass' : 'Not Yet'}
            </h1>
          </div>
        </div>
      </div>

      {/* Your rep — show the leader's own submitted text so the debrief
          has the rep in view alongside the verdict and feedback. */}
      {transcript && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
            Your Rep
          </h2>
          <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
            {transcript}
          </p>
        </div>
      )}

      {!isInvalid && Object.keys(quickRead).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
            Quick Read
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(quickRead).map(([cond, tier]) => (
              <span
                key={cond}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${tierClass(tier)}`}
              >
                <span className="font-medium">{conditionLabel(cond)}</span>
                <span className="opacity-75">·</span>
                <span>{tier}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {verdict?.observation && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
            {verdict?.patternTriggered ? 'Leadership Tendency' : 'Observation'}
          </h2>
          {verdict?.patternTriggered && (
            <p className="text-xs text-corporate-orange mb-2 font-medium">
              A pattern is showing up across your recent reps.
            </p>
          )}
          <p className="text-slate-900 dark:text-slate-100">{verdict.observation}</p>
        </div>
      )}

      {verdict?.question && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
            Try this next time
          </h2>
          <p className="text-slate-900 dark:text-slate-100">{verdict.question}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 mt-6">
        {!isPass && (
          <button
            type="button"
            onClick={() => { setStep('input'); setError(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-corporate-teal text-corporate-teal-ink bg-white dark:bg-slate-900 hover:bg-corporate-teal/10"
          >
            <ArrowLeft className="w-4 h-4" />
            Revise &amp; Resubmit
          </button>
        )}
        <button
          type="button"
          onClick={startNew}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90"
        >
          <RotateCcw className="w-4 h-4" />
          Practice Another Rep
        </button>
      </div>
    </div>
  );
};

export default ConditioningLight;
