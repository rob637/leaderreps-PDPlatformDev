// src/components/lab/IdentityBuilder.jsx
//
// LeaderReps Lab — Leadership Identity Statement Builder
// Public, anonymous, frictionless. Reached via ?identity-start.
//
// Flow:
//   1. Welcome  → one-tap start
//   2. Q1..Q4   → one short prompt per screen, big calm typography
//   3. Crafting → Gemini generates 3 styled variations (Bold / Grounded / Aspirational)
//   4. Pick     → leader chooses + (optionally) refines
//   5. Capture  → optional email to receive a printable card
//
// Quality bar: Apple/Google-grade clarity — one decision per screen, smooth
// motion, no clutter, a single primary action, a quiet "skip" everywhere.

import React, { useEffect, useMemo, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader,
  Check,
  Copy,
  RefreshCw,
  Mail,
  Quote,
  ShieldCheck,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Firebase bootstrap                                                          */
/* -------------------------------------------------------------------------- */
function getStandaloneFirebase() {
  const config =
    typeof window !== 'undefined' && window.__FIREBASE_CONFIG__
      ? window.__FIREBASE_CONFIG__
      : null;
  if (!config) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return {
    app,
    auth: getAuth(app),
    functions: getFunctions(app, 'us-central1'),
  };
}

/* -------------------------------------------------------------------------- */
/* Question bank — short, evocative, rooted in identity (not behavior)        */
/* -------------------------------------------------------------------------- */
const QUESTIONS = [
  {
    id: 'word',
    label: 'One word',
    prompt: 'What one word do you want your team to use when they describe you?',
    helper: 'Honest. Steady. Curious. Direct. — pick your word.',
    placeholder: 'e.g. steady',
    maxLen: 40,
  },
  {
    id: 'best',
    label: 'At your best',
    prompt: 'When are you at your best as a leader?',
    helper: 'A moment, a meeting, a season — describe it briefly.',
    placeholder: 'When the team is under pressure and I…',
    maxLen: 240,
    multiline: true,
  },
  {
    id: 'known',
    label: 'Known for',
    prompt: 'What do you most want to be known for?',
    helper: 'Not your title. Not your output. Who you are.',
    placeholder: 'Calling out the truth with care.',
    maxLen: 200,
    multiline: true,
  },
  {
    id: 'gap',
    label: 'The gap',
    prompt: 'What does your team need from you that they aren\'t getting enough of?',
    helper: 'Be honest. This is for you, not a review.',
    placeholder: 'Direct, specific feedback.',
    maxLen: 200,
    multiline: true,
  },
];

/* -------------------------------------------------------------------------- */
/* Reusable bits                                                               */
/* -------------------------------------------------------------------------- */
const BG = ({ children }) => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#eef2f7_100%)] dark:bg-slate-950 flex flex-col">
    {children}
  </div>
);

const TopBar = ({ step, total, onBack }) => (
  <div className="px-6 pt-6 pb-3 flex items-center gap-4 max-w-2xl mx-auto w-full">
    <button
      onClick={onBack}
      disabled={step <= 0}
      className="p-2 -ml-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-0 transition"
      aria-label="Back"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
    <div className="flex-1 flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all ${
            i <= step ? 'bg-corporate-teal' : 'bg-slate-200 dark:bg-slate-800'
          }`}
        />
      ))}
    </div>
    <span className="text-xs font-medium text-slate-400 tabular-nums w-10 text-right">
      {Math.min(step + 1, total)}/{total}
    </span>
  </div>
);

const PrimaryButton = ({ children, disabled, onClick, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-corporate-navy text-white text-base font-semibold shadow-card hover:shadow-elevated disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed transition-all"
  >
    {children}
  </button>
);

const TextLink = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-sm font-medium text-slate-400 hover:text-slate-700 transition"
  >
    {children}
  </button>
);

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

/* -------------------------------------------------------------------------- */
/* Main component                                                              */
/* -------------------------------------------------------------------------- */
const TOTAL_STEPS = 1 /* welcome */ + QUESTIONS.length + 1 /* result */;

const IdentityBuilder = () => {
  const [services, setServices] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [bootError, setBootError] = useState(null);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [variations, setVariations] = useState(null); // { bold, grounded, aspirational }
  const [chosenKey, setChosenKey] = useState('grounded');
  const [editedStatement, setEditedStatement] = useState('');
  const [emailPhase, setEmailPhase] = useState('idle'); // idle|saving|saved|error
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [savedToken, setSavedToken] = useState(null);

  /* --------------------------------- boot --------------------------------- */
  useEffect(() => {
    const fb = getStandaloneFirebase();
    if (!fb) {
      setBootError(
        'We can\'t reach our service right now. Please refresh in a moment.'
      );
      return;
    }
    setServices(fb);
    const unsub = onAuthStateChanged(fb.auth, async (u) => {
      if (!u) {
        try {
          await signInAnonymously(fb.auth);
        } catch (e) {
          console.error('[IdentityBuilder] anon auth failed', e);
          setBootError(
            'We couldn\'t start your session. Please refresh and try again.'
          );
        }
        return;
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  /* ------------------------------- step math ------------------------------ */
  // step 0 = welcome
  // step 1..QUESTIONS.length = questions
  // step QUESTIONS.length + 1 = result
  const isWelcome = step === 0;
  const isResult = step === QUESTIONS.length + 1;
  const currentQuestionIdx = step - 1;
  const currentQuestion =
    !isWelcome && !isResult ? QUESTIONS[currentQuestionIdx] : null;

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  /* ------------------------------- generate ------------------------------- */
  const generate = async () => {
    if (!services || !authReady) return;
    setGenerating(true);
    setGenError(null);
    setVariations(null);
    try {
      const fn = httpsCallable(services.functions, 'generateIdentityStatement');
      const res = await fn({ answers });
      const data = res?.data || {};
      if (!data.variations) {
        throw new Error('Empty response from coach.');
      }
      setVariations(data.variations);
      // default to "grounded" if present, else first available
      const preferred = data.variations.grounded
        ? 'grounded'
        : Object.keys(data.variations)[0];
      setChosenKey(preferred);
      setEditedStatement(data.variations[preferred] || '');
    } catch (e) {
      console.error('[IdentityBuilder] generate failed', e);
      setGenError(
        'The coach had trouble drafting your statement. Try again in a moment.'
      );
    } finally {
      setGenerating(false);
    }
  };

  // Auto-generate on entering result step the first time
  useEffect(() => {
    if (isResult && !variations && !generating && authReady) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResult, authReady]);

  // Keep editedStatement in sync when user picks a different variation
  useEffect(() => {
    if (variations && variations[chosenKey]) {
      setEditedStatement(variations[chosenKey]);
    }
  }, [chosenKey, variations]);

  /* --------------------------------- save --------------------------------- */
  const saveLead = async () => {
    if (!services || !authReady) return;
    const cleaned = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      setEmailError('Please enter a valid email.');
      return;
    }
    setEmailPhase('saving');
    setEmailError(null);
    try {
      const fn = httpsCallable(services.functions, 'saveIdentityLead');
      const res = await fn({
        email: cleaned,
        statement: editedStatement,
        answers,
        chosenKey,
      });
      const data = res?.data || {};
      setSavedToken(data.token || null);
      setEmailPhase('saved');
    } catch (e) {
      console.error('[IdentityBuilder] saveLead failed', e);
      setEmailError('Could not send. Please try again.');
      setEmailPhase('error');
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`"${editedStatement}"`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  /* --------------------------------- render ------------------------------- */
  if (bootError) {
    return (
      <BG>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-corporate-navy mb-3">
              Hmm, something&rsquo;s off.
            </h1>
            <p className="text-slate-600">{bootError}</p>
          </div>
        </div>
      </BG>
    );
  }

  return (
    <BG>
      <TopBar step={step} total={TOTAL_STEPS} onBack={back} />

      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* ============================ WELCOME =========================== */}
            {isWelcome && (
              <motion.div key="welcome" {...fade} className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-corporate-teal/10 text-corporate-teal text-xs font-semibold tracking-wide uppercase mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  LeaderReps Lab
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold text-corporate-navy dark:text-white tracking-tight leading-[1.1] mb-5">
                  Build your<br />
                  <span className="text-corporate-teal">Leadership Identity</span><br />
                  in 90 seconds.
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg mx-auto mb-10 leading-relaxed">
                  Four short questions. Then an AI-crafted statement that
                  captures who you are when you lead at your best — in your
                  own words.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <PrimaryButton
                    onClick={next}
                    disabled={!authReady}
                  >
                    {authReady ? (
                      <>
                        Begin <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Loading
                      </>
                    )}
                  </PrimaryButton>
                </div>
                <p className="mt-8 text-xs text-slate-400 inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Anonymous. Nothing is saved unless you ask us to email it.
                </p>
              </motion.div>
            )}

            {/* ============================ QUESTION =========================== */}
            {currentQuestion && (
              <motion.div key={currentQuestion.id} {...fade}>
                <div className="text-xs font-semibold uppercase tracking-wider text-corporate-teal mb-3">
                  {currentQuestion.label}
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-corporate-navy dark:text-white tracking-tight leading-tight mb-3">
                  {currentQuestion.prompt}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-base">
                  {currentQuestion.helper}
                </p>

                {currentQuestion.multiline ? (
                  <textarea
                    autoFocus
                    rows={4}
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) =>
                      setAnswers((a) => ({
                        ...a,
                        [currentQuestion.id]: e.target.value.slice(
                          0,
                          currentQuestion.maxLen
                        ),
                      }))
                    }
                    placeholder={currentQuestion.placeholder}
                    className="w-full text-lg p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none transition resize-none placeholder:text-slate-300"
                  />
                ) : (
                  <input
                    autoFocus
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) =>
                      setAnswers((a) => ({
                        ...a,
                        [currentQuestion.id]: e.target.value.slice(
                          0,
                          currentQuestion.maxLen
                        ),
                      }))
                    }
                    placeholder={currentQuestion.placeholder}
                    className="w-full text-2xl py-5 px-1 border-0 border-b-2 border-slate-200 dark:border-slate-700 bg-transparent focus:ring-0 focus:border-corporate-teal outline-none transition placeholder:text-slate-300"
                  />
                )}

                <div className="mt-3 text-right text-xs text-slate-400 tabular-nums">
                  {(answers[currentQuestion.id] || '').length}/
                  {currentQuestion.maxLen}
                </div>

                <div className="mt-10 flex items-center justify-between gap-4">
                  <TextLink onClick={next}>Skip</TextLink>
                  <PrimaryButton onClick={next}>
                    {step === QUESTIONS.length ? (
                      <>
                        Craft my statement <Sparkles className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Continue <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </PrimaryButton>
                </div>
              </motion.div>
            )}

            {/* ============================ RESULT ============================ */}
            {isResult && (
              <motion.div key="result" {...fade}>
                {generating && (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-corporate-teal/10 mb-6">
                      <Loader className="w-6 h-6 text-corporate-teal animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-corporate-navy dark:text-white mb-2">
                      Crafting your statement…
                    </h2>
                    <p className="text-slate-500">
                      Listening to what you said. Pulling the threads together.
                    </p>
                  </div>
                )}

                {!generating && genError && (
                  <div className="text-center py-12">
                    <p className="text-slate-700 mb-6">{genError}</p>
                    <PrimaryButton onClick={generate}>
                      <RefreshCw className="w-4 h-4" /> Try again
                    </PrimaryButton>
                  </div>
                )}

                {!generating && variations && (
                  <ResultView
                    variations={variations}
                    chosenKey={chosenKey}
                    setChosenKey={setChosenKey}
                    editedStatement={editedStatement}
                    setEditedStatement={setEditedStatement}
                    onRegenerate={generate}
                    onCopy={copy}
                    copied={copied}
                    email={email}
                    setEmail={setEmail}
                    emailPhase={emailPhase}
                    emailError={emailError}
                    onSave={saveLead}
                    savedToken={savedToken}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </BG>
  );
};

/* -------------------------------------------------------------------------- */
/* Result sub-view                                                             */
/* -------------------------------------------------------------------------- */
const VARIATION_META = {
  bold: { label: 'Bold', tone: 'Decisive, future-facing' },
  grounded: { label: 'Grounded', tone: 'Honest, day-to-day true' },
  aspirational: { label: 'Aspirational', tone: 'Who you\'re becoming' },
};

const ResultView = ({
  variations,
  chosenKey,
  setChosenKey,
  editedStatement,
  setEditedStatement,
  onRegenerate,
  onCopy,
  copied,
  email,
  setEmail,
  emailPhase,
  emailError,
  onSave,
  savedToken,
}) => {
  const keys = useMemo(
    () => Object.keys(variations).filter((k) => VARIATION_META[k]),
    [variations]
  );

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-corporate-teal mb-3">
        Your draft
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold text-corporate-navy dark:text-white tracking-tight leading-tight mb-2">
        Here&rsquo;s how you lead.
      </h2>
      <p className="text-slate-500 mb-8">
        Pick the voice that feels most like you. Edit anything.
      </p>

      {/* Variation tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {keys.map((k) => (
          <button
            key={k}
            onClick={() => setChosenKey(k)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
              chosenKey === k
                ? 'bg-corporate-navy text-white border-corporate-navy'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {VARIATION_META[k].label}
          </button>
        ))}
      </div>

      {/* Statement card */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-card p-7 sm:p-9 mb-3">
        <Quote className="absolute top-5 left-5 w-6 h-6 text-corporate-teal/40" />
        <textarea
          rows={4}
          value={editedStatement}
          onChange={(e) => setEditedStatement(e.target.value.slice(0, 500))}
          className="w-full pl-8 text-xl sm:text-2xl font-medium leading-relaxed text-corporate-navy dark:text-white bg-transparent border-0 focus:ring-0 outline-none resize-none placeholder:text-slate-300"
        />
        <div className="flex items-center justify-between mt-2 pl-8">
          <p className="text-xs text-slate-400">
            {VARIATION_META[chosenKey]?.tone}
          </p>
          <span className="text-xs text-slate-300 tabular-nums">
            {editedStatement.length}/500
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-10">
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:border-slate-300 transition"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> Copy
            </>
          )}
        </button>
        <button
          onClick={onRegenerate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:border-slate-300 transition"
        >
          <RefreshCw className="w-4 h-4" /> Regenerate
        </button>
      </div>

      {/* Email capture */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-3xl border border-slate-200/80 dark:border-slate-700 p-6 sm:p-7">
        {emailPhase === 'saved' ? (
          <div className="text-center py-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-3">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-corporate-navy mb-1">
              Sent. Check your inbox.
            </h3>
            <p className="text-sm text-slate-500">
              We emailed you a printable card you can keep on your desk.
            </p>
            {savedToken && (
              <p className="text-xs text-slate-400 mt-3">
                Reference: {savedToken.slice(0, 8)}…
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-xl bg-corporate-teal/10">
                <Mail className="w-5 h-5 text-corporate-teal" />
              </div>
              <div>
                <h3 className="text-base font-bold text-corporate-navy dark:text-white">
                  Email yourself a printable card
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Optional. We won&rsquo;t spam you — one email, then nothing.
                </p>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSave();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@work.com"
                className="flex-1 px-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none transition"
              />
              <button
                type="submit"
                disabled={emailPhase === 'saving'}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-corporate-navy text-white text-sm font-semibold shadow-card hover:shadow-elevated disabled:bg-slate-300 disabled:shadow-none transition"
              >
                {emailPhase === 'saving' ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Sending
                  </>
                ) : (
                  <>
                    Send it <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            {emailError && (
              <p className="mt-3 text-sm text-red-600">{emailError}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default IdentityBuilder;
