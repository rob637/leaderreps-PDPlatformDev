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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Zap, Mic, MicOff, Loader2, ArrowLeft, RotateCcw,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

// ---------------------------------------------------------------------------
// RR catalog — keep in sync with functions/conditioning/rrConfig.js
// ---------------------------------------------------------------------------
const RR_TYPES = [
  {
    key: 'DRF',
    name: 'Direct Request with Follow-Through',
    blurb: 'Make a clear, specific ask and confirm next steps.',
    promptHint:
      'Describe the request you made. Who, what, by when — and how you confirmed they got it.',
  },
  {
    key: 'RED',
    name: 'Request with Empathy and Direction',
    blurb: 'Lead with empathy, then make a clear, specific request.',
    promptHint:
      'Describe what you said: how you acknowledged the person, what you asked for, what direction you set.',
  },
  {
    key: 'FUW',
    name: 'Follow-Up Without Nagging',
    blurb: 'Re-engage with structure, no pressure or repetition.',
    promptHint:
      'Describe the follow-up: how you referenced the original ask and what new angle you brought.',
  },
  {
    key: 'SCE',
    name: 'Simplify a Complex Explanation',
    blurb: 'Strip jargon, lead with the takeaway, make it land.',
    promptHint:
      'What were you explaining? Write it the way you would actually say it to a non-expert.',
  },
];

const tierClass = (tier) => {
  switch (tier) {
    case 'Strong':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    case 'Adequate':
      return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800';
    case 'Weak':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    case 'Missing':
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
// Web Speech API hook
// ---------------------------------------------------------------------------
const useSpeechRecognition = (onResult) => {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setSupported(true);
    const r = new SR();
    r.continuous = true;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (event) => {
      let chunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          chunk += event.results[i][0].transcript + ' ';
        }
      }
      if (chunk) onResult(chunk.trim());
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r;
    return () => {
      try { r.stop(); } catch { /* noop */ }
    };
  }, [onResult]);

  const start = () => {
    if (!recogRef.current) return;
    try {
      recogRef.current.start();
      setListening(true);
    } catch { /* already started */ }
  };
  const stop = () => {
    if (!recogRef.current) return;
    try { recogRef.current.stop(); } catch { /* noop */ }
    setListening(false);
  };

  return { supported, listening, start, stop };
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const ConditioningLight = () => {
  const [step, setStep] = useState('select'); // select | input | submitting | verdict
  const [rrType, setRrType] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const [verdict, setVerdict] = useState(null);

  const rr = useMemo(() => RR_TYPES.find((r) => r.key === rrType), [rrType]);

  const appendSpeech = (chunk) =>
    setTranscript((t) => (t ? `${t} ${chunk}` : chunk));
  const speech = useSpeechRecognition(appendSpeech);

  const reset = () => {
    setStep('select');
    setRrType(null);
    setTranscript('');
    setError(null);
    setVerdict(null);
    speech.stop();
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
    speech.stop();
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
              className="text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            >
              <div className="text-xs font-semibold tracking-wider text-corporate-teal mb-1">
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
          className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-corporate-teal mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Pick a different rep
        </button>

        <header className="mb-4">
          <div className="text-xs font-semibold tracking-wider text-corporate-teal">
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
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            disabled={submitting}
            rows={8}
            placeholder="Type or speak your rep here…"
            className="w-full resize-none border-0 bg-transparent focus:ring-0 focus:outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
            {speech.supported ? (
              <button
                type="button"
                onClick={speech.listening ? speech.stop : speech.start}
                disabled={submitting}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
                  speech.listening
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {speech.listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {speech.listening ? 'Stop' : 'Speak'}
              </button>
            ) : (
              <span className="text-xs text-slate-400">
                Voice input not available in this browser
              </span>
            )}

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
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Step: verdict
  // -------------------------------------------------------------------------
  const isPass = verdict?.result === 'pass';
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
            Observation
          </h2>
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
