// src/components/screens/IdentityStatement.jsx
//
// Leadership Identity Statement (LIS) — in-Ascent builder.
//
// This is NOT a lead magnet. It lives inside Ascent and produces a structured
// living artifact:
//
//   ANCHOR    — one word + one first-person sentence ("who I am at my best")
//   EVIDENCE  — 3 observable behaviors that prove the anchor
//   EDGE      — the trigger that pulls me off the anchor + a recovery move
//
// The artifact is persisted to:
//   developmentPlanData.dailyPracticeData.leadershipIdentity = { ... }
//
// Backward compatibility: we ALSO write `identityAnchor` (a string) so the
// existing GroundingRepWidget and any consumer reading the legacy field keeps
// working without migration.
//
// The Locker links here. Trainers can see the artifact through normal user
// reads (no separate UI in this PR — added later).

import React, { useEffect, useMemo, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions as firebaseFunctions } from '../../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Sparkles, Loader2, Check, Pencil, Save,
  Quote, Compass, Eye, AlertTriangle, RefreshCw, ShieldCheck, Star,
  Plus, X, History, Lightbulb, ChevronDown, ChevronUp, Zap, Layers,
  Heart, Moon,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { PageLayout } from '../ui/PageLayout';
import { Card } from '../ui';

// ---------------------------------------------------------------------------
// Question bank — drives the AI generation.
//
// CORE_QUESTIONS (4): the Quick Draft path. ~4 minutes.
// DEEP_QUESTIONS (3): added for Deep Dive path. Values, Purpose, Shadow.
//   - Shadow grounds the Edge card in actual self-knowledge instead of AI guess
//   - Values surfaces non-negotiables (Bill George / True North)
//   - Purpose answers "who am I leading for" (Quinn / Kouzes-Posner)
//
// Every prompt carries 3 example answers (real-feeling, plain English) that
// are surfaced via an inline "Stuck? See examples" disclosure on the question
// step. This is the difference between a survey and a tool.
// ---------------------------------------------------------------------------
const CORE_QUESTIONS = [
  {
    id: 'word',
    label: 'One word',
    icon: Compass,
    prompt: 'What one word do you want your team to use when they describe you?',
    helper: 'Honest. Steady. Curious. Direct. — pick your word.',
    placeholder: 'e.g. steady',
    maxLen: 40,
    examples: ['steady', 'curious', 'direct', 'honest', 'present'],
  },
  {
    id: 'best',
    label: 'At your best',
    icon: Star,
    prompt: 'When are you at your best as a leader?',
    helper: 'A moment, a meeting, a season — describe it briefly.',
    placeholder: 'When the team is under pressure and I…',
    maxLen: 240,
    multiline: true,
    examples: [
      'When something is breaking and the team is scattered, I get calm, name what we know, and pick the next move.',
      'In 1:1s when someone is stuck — I ask two questions before I offer anything.',
      'When the room is quiet and someone needs to say the hard thing, I go first.',
    ],
  },
  {
    id: 'known',
    label: 'Known for',
    icon: Quote,
    prompt: 'What do you most want to be known for?',
    helper: 'Not your title. Not your output. Who you are.',
    placeholder: 'Calling out the truth with care.',
    maxLen: 200,
    multiline: true,
    examples: [
      'Telling people the truth before it gets worse — and still rooting for them.',
      'Being the leader who actually listens — not the one waiting to talk.',
      'Making my people braver than they were when they started here.',
    ],
  },
  {
    id: 'gap',
    label: 'The gap',
    icon: AlertTriangle,
    prompt: "What does your team need from you that they aren't getting enough of?",
    helper: 'Be honest. This is for you, not a review.',
    placeholder: 'Direct, specific feedback.',
    maxLen: 200,
    multiline: true,
    examples: [
      'Direct feedback in the moment — not after I have stewed for two days.',
      'My full attention. I am there but distracted half the time.',
      'A clearer "no" — I say maybe when I mean no, and it slows everyone down.',
    ],
  },
];

const DEEP_QUESTIONS = [
  {
    id: 'values',
    label: 'Non-negotiables',
    icon: ShieldCheck,
    prompt: 'What 2–3 things will you not compromise on as a leader?',
    helper: 'The lines you will hold even when it costs you.',
    placeholder: 'Honesty even when it is awkward. Following through on what I say.',
    maxLen: 280,
    multiline: true,
    examples: [
      'Telling people the real story. Following through on what I commit to. Protecting my team\'s time.',
      'Doing what I said I would do. Not punishing people for bringing me bad news.',
      'Treating the most junior person in the room with the same respect as the CEO.',
    ],
  },
  {
    id: 'purpose',
    label: 'Who you serve',
    icon: Heart,
    prompt: 'Who are you leading for, and why does it matter?',
    helper: 'Past your KPIs. Who actually benefits when you lead well?',
    placeholder: 'Six engineers who deserve a manager who has their back.',
    maxLen: 280,
    multiline: true,
    examples: [
      'Eight people who picked this team for a reason — they deserve a manager who fights for them.',
      'The customers we never meet. If we are sloppy, somebody\'s day gets worse.',
      'The next generation of leaders on my team — I want them better than I was at their stage.',
    ],
  },
  {
    id: 'shadow',
    label: 'Under pressure',
    icon: Moon,
    prompt: 'When you are stressed or threatened, how do you show up that you are NOT proud of?',
    helper: 'Be honest — this becomes the trigger your Edge card watches for.',
    placeholder: 'I get short. I take over. I go quiet and avoid people.',
    maxLen: 280,
    multiline: true,
    examples: [
      'I take over the work instead of coaching through it. People stop bringing me problems.',
      'I get sharp and clipped. People start walking on eggshells around me.',
      'I go quiet and avoid the hard conversation. It festers and gets worse.',
    ],
  },
];

const QUESTIONS_BY_MODE = {
  quick: CORE_QUESTIONS,
  deep: [...CORE_QUESTIONS, ...DEEP_QUESTIONS],
};

// ---------------------------------------------------------------------------
// Sample LIS artifacts — shown on the intro screen so leaders can SEE what
// they're building toward before they start typing. Each one is fictional
// but plausible (anonymized composite).
// ---------------------------------------------------------------------------
const SAMPLE_ARTIFACTS = [
  {
    word: 'steady',
    statement: 'I am the steady voice in the room when the noise gets loud — calm, clear, and willing to make the call.',
    evidence: [
      'I name what we know and what we don\'t in the first 5 minutes of a crisis.',
      'I make the decision out loud, even when I\'m not sure, and own it.',
      'I check in 1:1 within 24 hours of a hard moment.',
    ],
    edge: {
      trigger: 'When deadlines compress, I default to barking orders and stop explaining.',
      recovery: 'I pause for 30 seconds and ask one question before I tell.',
    },
  },
  {
    word: 'curious',
    statement: 'I am the leader who asks one more question before I answer — because the real problem is rarely the first one named.',
    evidence: [
      'I ask "what would have to be true?" before I push back on an idea.',
      'I write down what I learned in every 1:1, not what I told them.',
      'I check my first reaction before I send the message.',
    ],
    edge: {
      trigger: 'When I think I already know the answer, I stop listening.',
      recovery: 'I say "tell me more" and actually wait for the next sentence.',
    },
  },
  {
    word: 'direct',
    statement: 'I am the leader who says the real thing the first time — with care, without softening it into nothing.',
    evidence: [
      'I name the hard thing in the first 5 minutes of a 1:1.',
      'I give the feedback in the room, not in the hallway after.',
      'I say "I was wrong" before anyone has to ask.',
    ],
    edge: {
      trigger: 'When I am tired or hurt, I get sharp and start pointing fingers.',
      recovery: 'I close the laptop, take a walk, and rewrite before I send.',
    },
  },
];

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------
const safeStr = (v) => (typeof v === 'string' ? v : '');

const buildLegacyAnchorString = (artifact) => {
  // The legacy `identityAnchor` is a single string. Use the anchor statement.
  return safeStr(artifact?.anchor?.statement).trim();
};

const normalizeArtifact = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const anchor = raw.anchor || {};
  const edge = raw.edge || {};
  const evidence = Array.isArray(raw.evidence) ? raw.evidence : [];
  return {
    anchor: {
      word: safeStr(anchor.word).trim(),
      statement: safeStr(anchor.statement).trim(),
    },
    evidence: evidence.map((e) => safeStr(e).trim()).filter(Boolean).slice(0, 5),
    edge: {
      trigger: safeStr(edge.trigger).trim(),
      recovery: safeStr(edge.recovery).trim(),
    },
    answers: raw.answers || {},
    alternates: Array.isArray(raw.alternates) ? raw.alternates.slice(0, 5) : [],
    versions: Array.isArray(raw.versions) ? raw.versions : [],
    updatedAt: raw.updatedAt || null,
    createdAt: raw.createdAt || null,
  };
};

const isArtifactComplete = (a) =>
  !!(a && a.anchor?.statement && a.evidence?.length >= 1);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const ProgressBar = ({ step, total }) => (
  <div className="flex items-center gap-1.5 mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1 flex-1 rounded-full transition-all ${
          i <= step ? 'bg-corporate-teal' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      />
    ))}
  </div>
);

// Inline examples disclosure — surfaces below each question so leaders can
// see how others answered without leaving the flow. Tap an example to use it
// as a starter (they can edit from there).
const ExamplesPeek = ({ examples, onUseExample }) => {
  const [open, setOpen] = useState(false);
  if (!examples || examples.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
      >
        <span className="inline-flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          Stuck? See how other leaders answered
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {open && (
        <ul className="px-3 pb-3 space-y-1.5">
          {examples.map((ex, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onUseExample(ex)}
                className="w-full text-left text-sm px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-corporate-teal hover:bg-corporate-teal/5 transition text-slate-700 dark:text-slate-300"
                title="Click to use as a starting point — you can edit it"
              >
                {ex}
              </button>
            </li>
          ))}
          <li className="text-[10px] text-slate-400 italic pt-1">
            Click any example to use it as a starter — then make it yours.
          </li>
        </ul>
      )}
    </div>
  );
};

const QuestionStep = ({ question, value, onChange, onNext, onBack, isFirst, isLast, stepNumber, totalSteps }) => {
  const Tag = question.multiline ? 'textarea' : 'input';
  const Icon = question.icon || Compass;
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-corporate-teal/10 text-corporate-teal">
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-corporate-teal">
            {question.label}
          </span>
          <span className="text-xs text-slate-400 ml-auto">
            {stepNumber} of {totalSteps}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold text-corporate-navy dark:text-white leading-tight">
          {question.prompt}
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{question.helper}</p>
      </div>

      <Tag
        type={question.multiline ? undefined : 'text'}
        rows={question.multiline ? 4 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, question.maxLen))}
        placeholder={question.placeholder}
        autoFocus
        className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-base focus:border-corporate-teal focus:outline-none focus:ring-2 focus:ring-corporate-teal/30 resize-none"
      />

      <ExamplesPeek
        examples={question.examples}
        onUseExample={(ex) => onChange(ex.slice(0, question.maxLen))}
      />

      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-xs text-slate-400">
          {value.length}/{question.maxLen}
        </div>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-corporate-teal text-white font-semibold hover:bg-corporate-teal/90"
        >
          {isLast ? 'Draft my statement' : 'Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

const AnchorCard = ({ artifact, editing, onChange, alternates, onPickAlternate }) => (
  <div className="p-5 rounded-2xl border-2 border-corporate-navy/20 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700">
    <div className="flex items-center gap-2 mb-2">
      <Compass className="w-4 h-4 text-corporate-navy dark:text-corporate-teal" />
      <span className="text-[11px] font-semibold uppercase tracking-wider text-corporate-navy dark:text-corporate-teal">
        Anchor
      </span>
      {artifact.anchor.word && (
        <span className="ml-auto text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-corporate-navy/10 dark:bg-corporate-teal/20 text-corporate-navy dark:text-corporate-teal">
          {artifact.anchor.word}
        </span>
      )}
    </div>
    {editing ? (
      <>
        <input
          type="text"
          value={artifact.anchor.word}
          onChange={(e) => onChange({ anchor: { ...artifact.anchor, word: e.target.value.slice(0, 40) } })}
          placeholder="One-word anchor (e.g. steady)"
          className="w-full mb-2 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-mono"
        />
        <textarea
          rows={3}
          value={artifact.anchor.statement}
          onChange={(e) => onChange({ anchor: { ...artifact.anchor, statement: e.target.value.slice(0, 280) } })}
          className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-base font-serif italic resize-none"
        />
      </>
    ) : (
      <p className="text-lg md:text-xl font-serif italic leading-snug text-slate-900 dark:text-slate-100">
        “{artifact.anchor.statement}”
      </p>
    )}

    {editing && alternates && alternates.length > 0 && (
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Try a different tone
        </div>
        <div className="space-y-1.5">
          {alternates.map((alt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPickAlternate(alt)}
              className="w-full text-left text-sm px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-corporate-teal hover:bg-corporate-teal/5 transition"
            >
              {alt}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

const EvidenceCard = ({ artifact, editing, onChange }) => {
  const evidence = artifact.evidence || [];

  const updateAt = (idx, val) => {
    const next = [...evidence];
    next[idx] = val.slice(0, 200);
    onChange({ evidence: next });
  };
  const removeAt = (idx) => {
    const next = evidence.filter((_, i) => i !== idx);
    onChange({ evidence: next });
  };
  const add = () => {
    if (evidence.length >= 5) return;
    onChange({ evidence: [...evidence, ''] });
  };

  return (
    <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-800 dark:to-emerald-900/10 dark:border-emerald-800">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Evidence
        </span>
        <span className="ml-auto text-[10px] text-slate-500">
          You'll know I'm living this when I…
        </span>
      </div>
      <ul className="space-y-2">
        {evidence.map((line, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="w-4 h-4 mt-1 text-emerald-600 flex-shrink-0" />
            {editing ? (
              <>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => updateAt(i, e.target.value)}
                  placeholder="I name the hard thing in the first 5 minutes."
                  className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-800 dark:text-slate-200">{line}</span>
            )}
          </li>
        ))}
        {evidence.length === 0 && !editing && (
          <li className="text-sm text-slate-400 italic">No evidence yet.</li>
        )}
      </ul>
      {editing && evidence.length < 5 && (
        <button
          type="button"
          onClick={add}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
        >
          <Plus className="w-3.5 h-3.5" /> Add another behavior
        </button>
      )}
    </div>
  );
};

const EdgeCard = ({ artifact, editing, onChange }) => {
  const edge = artifact.edge || {};
  return (
    <div className="p-5 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-white to-amber-50/40 dark:from-slate-800 dark:to-amber-900/10 dark:border-amber-800">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Edge
        </span>
        <span className="ml-auto text-[10px] text-slate-500">
          What pulls me off — and how I get back
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Trigger
          </div>
          {editing ? (
            <textarea
              rows={2}
              value={edge.trigger}
              onChange={(e) => onChange({ edge: { ...edge, trigger: e.target.value.slice(0, 240) } })}
              placeholder="When deadlines slip, I default to barking orders."
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm resize-none"
            />
          ) : (
            <p className="text-sm text-slate-800 dark:text-slate-200">{edge.trigger || '—'}</p>
          )}
        </div>

        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Recovery
          </div>
          {editing ? (
            <textarea
              rows={2}
              value={edge.recovery}
              onChange={(e) => onChange({ edge: { ...edge, recovery: e.target.value.slice(0, 240) } })}
              placeholder="I pause for 30 seconds and ask one question before I tell."
              className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm resize-none"
            />
          ) : (
            <p className="text-sm text-slate-800 dark:text-slate-200">{edge.recovery || '—'}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const HistoryDrawer = ({ versions }) => {
  const [open, setOpen] = useState(false);
  if (!versions || versions.length === 0) return null;
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
      >
        <History className="w-3.5 h-3.5" />
        {open ? 'Hide history' : `History (${versions.length})`}
      </button>
      {open && (
        <ul className="mt-2 space-y-2">
          {versions.map((v, i) => (
            <li
              key={i}
              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  {v.savedAt ? new Date(v.savedAt).toLocaleDateString() : 'Earlier'}
                  {v.source ? ` · ${v.source}` : ''}
                </span>
                {v.anchorWord && (
                  <span className="text-[10px] font-mono uppercase text-slate-500">{v.anchorWord}</span>
                )}
              </div>
              <p className="text-sm font-serif italic text-slate-700 dark:text-slate-300">
                “{v.anchorStatement}”
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Sample artifact preview — used on the intro screen so leaders can see what
// they're building toward. Compact 3-line summary; expand reveals evidence/edge.
const SampleArtifactCard = ({ sample }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-corporate-navy/10 dark:bg-corporate-teal/20 text-corporate-navy dark:text-corporate-teal">
            {sample.word}
          </span>
          <span className="text-[10px] text-slate-400 ml-auto inline-flex items-center gap-1">
            {open ? 'Hide details' : 'See full artifact'}
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        </div>
        <p className="text-sm font-serif italic text-slate-800 dark:text-slate-200 leading-snug">
          “{sample.statement}”
        </p>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700 space-y-3 text-sm">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-1.5 inline-flex items-center gap-1">
              <Eye className="w-3 h-3" /> Evidence
            </div>
            <ul className="space-y-1">
              {sample.evidence.map((e, i) => (
                <li key={i} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                  <span className="text-xs">{e}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-1 inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Edge
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 mb-1">
              <span className="font-semibold">Trigger:</span> {sample.edge.trigger}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Recovery:</span> {sample.edge.recovery}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// Path picker — the entry point for new users (or anyone re-building).
// Two clear paths, with example artifacts inline for inspiration.
const IntroPathPicker = ({ onPick, hasExisting }) => {
  const [examplesOpen, setExamplesOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-semibold text-corporate-navy dark:text-white leading-tight">
          {hasExisting ? 'Refine your Leadership Identity' : 'Build your Leadership Identity'}
        </h2>
        <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
          A living artifact: <span className="font-semibold">who you are at your best</span>,
          the <span className="font-semibold">behaviors that prove it</span>, and the
          <span className="font-semibold"> edge</span> that pulls you off course.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Not a slogan. Not a tagline. A practice you'll come back to.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Quick Draft */}
        <button
          type="button"
          onClick={() => onPick('quick')}
          className="group text-left p-5 rounded-2xl border-2 border-corporate-teal/30 bg-gradient-to-br from-white to-corporate-teal/5 dark:from-slate-800 dark:to-slate-800/50 hover:border-corporate-teal hover:shadow-card-hover transition"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-corporate-teal/15 text-corporate-teal">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-corporate-teal">
              Recommended for first pass
            </span>
          </div>
          <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">Quick Draft</h3>
          <p className="text-sm text-slate-500 mt-0.5">4 prompts · about 4 minutes</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            One word. At your best. Known for. The gap. AI drafts a structured artifact you can edit.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-corporate-teal group-hover:gap-2 transition-all">
            Start <ArrowRight className="w-4 h-4" />
          </div>
        </button>

        {/* Deep Dive */}
        <button
          type="button"
          onClick={() => onPick('deep')}
          className="group text-left p-5 rounded-2xl border-2 border-corporate-navy/20 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 hover:border-corporate-navy hover:shadow-card-hover transition"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-corporate-navy/10 text-corporate-navy dark:text-corporate-teal">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-corporate-navy dark:text-corporate-teal">
              Richer · grounded
            </span>
          </div>
          <h3 className="text-lg font-semibold text-corporate-navy dark:text-white">Deep Dive</h3>
          <p className="text-sm text-slate-500 mt-0.5">7 prompts · about 10 minutes</p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            Quick Draft <span className="font-semibold">plus</span> your non-negotiables, who you're leading
            for, and how you derail under pressure. Produces a sharper, more honest artifact.
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-corporate-navy dark:text-corporate-teal group-hover:gap-2 transition-all">
            Go deeper <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* Examples */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
        <button
          type="button"
          onClick={() => setExamplesOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
        >
          <span className="inline-flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            See three sample Leadership Identity artifacts
          </span>
          {examplesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {examplesOpen && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs text-slate-500 mb-1">
              Three composite examples of what a finished artifact looks like. Yours will sound
              different — that's the point.
            </p>
            {SAMPLE_ARTIFACTS.map((s, i) => (
              <SampleArtifactCard key={i} sample={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
const IdentityStatement = () => {
  const {
    dailyPracticeData,
    updateDailyPracticeData,
    navigate,
  } = useAppServices();

  // Read existing artifact (if any)
  const existingArtifact = useMemo(
    () => normalizeArtifact(dailyPracticeData?.leadershipIdentity),
    [dailyPracticeData?.leadershipIdentity]
  );
  const legacyAnchor = safeStr(dailyPracticeData?.identityAnchor).trim();

  // View modes:
  //   'view'      — has artifact, show it
  //   'intro'     — path picker (Quick Draft vs Deep Dive) + sample artifacts
  //   'questions' — answering N questions (4 quick / 7 deep)
  //   'crafting'  — calling the AI
  //   'edit'      — editing the structured artifact
  const initialMode = isArtifactComplete(existingArtifact) ? 'view' : 'intro';
  const [mode, setMode] = useState(initialMode);
  const [pathMode, setPathMode] = useState('quick'); // 'quick' | 'deep'
  const [step, setStep] = useState(0);

  const [answers, setAnswers] = useState({
    word: '',
    best: '',
    known: '',
    gap: '',
    values: '',
    purpose: '',
    shadow: '',
  });

  const [draftArtifact, setDraftArtifact] = useState(existingArtifact || null);
  const [alternates, setAlternates] = useState([]);
  const [genError, setGenError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Sync if data arrives later (initial Firestore subscription)
  useEffect(() => {
    if (existingArtifact && (mode === 'questions' || mode === 'intro') && isArtifactComplete(existingArtifact)) {
      setDraftArtifact(existingArtifact);
      setMode('view');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingArtifact?.anchor?.statement]);

  // ---------------- AI generation ----------------
  const generate = async () => {
    setGenError(null);
    setMode('crafting');
    try {
      const fn = httpsCallable(firebaseFunctions, 'generateIdentityStatement');
      const res = await fn({ answers });
      const data = res?.data || {};
      const a = data.artifact || {};
      const next = normalizeArtifact({
        anchor: {
          word: a.anchorWord || answers.word || '',
          statement: a.anchorStatement || '',
        },
        evidence: a.evidence || [],
        edge: {
          trigger: a.edgeTrigger || '',
          recovery: a.edgeRecovery || '',
        },
        alternates: a.alternates || [],
        answers,
      });
      if (!next?.anchor?.statement) {
        throw new Error('Empty draft from coach.');
      }
      setDraftArtifact(next);
      setAlternates(next.alternates || []);
      setMode('edit');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[LIS] generate failed', e);
      setGenError(
        e?.message?.includes('unauthenticated')
          ? 'Please sign in to use the AI draft.'
          : 'The coach had trouble drafting your statement. You can still write it manually below.'
      );
      // Fall back to a manual edit shell so they can keep going.
      const fallback = normalizeArtifact({
        anchor: { word: answers.word, statement: '' },
        evidence: ['', '', ''],
        edge: { trigger: '', recovery: '' },
        answers,
      });
      setDraftArtifact(fallback);
      setMode('edit');
    }
  };

  // ---------------- Save ----------------
  const save = async () => {
    if (!updateDailyPracticeData) {
      setSaveError('Not connected. Refresh and try again.');
      return;
    }
    if (!draftArtifact?.anchor?.statement?.trim()) {
      setSaveError('Add an anchor statement before saving.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const now = new Date().toISOString();
      const versions = Array.isArray(existingArtifact?.versions)
        ? existingArtifact.versions
        : [];

      // If anchor statement changed, push the previous one onto versions.
      let nextVersions = versions;
      if (
        existingArtifact?.anchor?.statement &&
        existingArtifact.anchor.statement !== draftArtifact.anchor.statement
      ) {
        nextVersions = [
          {
            savedAt: existingArtifact.updatedAt || now,
            anchorWord: existingArtifact.anchor.word || '',
            anchorStatement: existingArtifact.anchor.statement,
            source: 'self',
          },
          ...versions,
        ].slice(0, 10);
      }

      const payload = {
        leadershipIdentity: {
          anchor: {
            word: draftArtifact.anchor.word || '',
            statement: draftArtifact.anchor.statement.trim(),
          },
          evidence: (draftArtifact.evidence || [])
            .map((e) => safeStr(e).trim())
            .filter(Boolean)
            .slice(0, 5),
          edge: {
            trigger: safeStr(draftArtifact.edge?.trigger).trim(),
            recovery: safeStr(draftArtifact.edge?.recovery).trim(),
          },
          answers: { ...(draftArtifact.answers || answers) },
          versions: nextVersions,
          updatedAt: now,
          createdAt: existingArtifact?.createdAt || now,
        },
        // Backward-compat: keep the legacy single-string field alive so the
        // current Grounding Rep widget and any other consumer keeps working.
        identityAnchor: buildLegacyAnchorString({
          anchor: { statement: draftArtifact.anchor.statement.trim() },
        }),
      };

      const ok = await updateDailyPracticeData(payload);
      if (!ok) throw new Error('Save failed');
      setMode('view');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[LIS] save failed', e);
      setSaveError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ---------------- Render ----------------
  const activeQuestions = QUESTIONS_BY_MODE[pathMode] || CORE_QUESTIONS;
  const total = activeQuestions.length;
  const currentQ = activeQuestions[step];

  return (
    <PageLayout
      title="Leadership Identity"
      icon={Compass}
      subtitle="Who you are at your best — and the practice that keeps you there."
      navigate={navigate}
      backTo="locker"
      backLabel="Back to Locker"
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Locker', path: 'locker' },
        { label: 'Leadership Identity', path: null },
      ]}
      maxWidth="max-w-3xl"
    >
      {/* --------------------------- VIEW MODE --------------------------- */}
      {mode === 'view' && draftArtifact && isArtifactComplete(draftArtifact) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-corporate-teal" />
              Saved · only you and your trainer can see this
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('edit')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setAnswers((a) => ({ ...a, ...(existingArtifact?.answers || {}) }));
                  setStep(0);
                  setMode('intro');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Rebuild with AI
              </button>
            </div>
          </div>

          <AnchorCard artifact={draftArtifact} editing={false} onChange={() => {}} />
          <EvidenceCard artifact={draftArtifact} editing={false} onChange={() => {}} />
          <EdgeCard artifact={draftArtifact} editing={false} onChange={() => {}} />

          <HistoryDrawer versions={existingArtifact?.versions} />
        </div>
      )}

      {/* --------------------------- INTRO MODE -------------------------- */}
      {mode === 'intro' && (
        <IntroPathPicker
          hasExisting={!!(existingArtifact && isArtifactComplete(existingArtifact))}
          onPick={(picked) => {
            setPathMode(picked);
            setStep(0);
            setMode('questions');
          }}
        />
      )}

      {/* ------------------------ QUESTIONS MODE ------------------------ */}
      {mode === 'questions' && (
        <div>
          <ProgressBar step={step} total={total} />
          {step === 0 && !legacyAnchor && (
            <div className="mb-5 p-4 rounded-xl bg-corporate-teal/5 border border-corporate-teal/20">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-corporate-teal mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {pathMode === 'deep' ? (
                    <>Seven prompts. Then a coach AI drafts a structured Leadership Identity grounded in
                    your values, purpose, and honest self-knowledge. Takes about 10 minutes.</>
                  ) : (
                    <>Four short prompts. Then a coach AI drafts a structured Leadership Identity
                    you can edit, save, and refine over time. Takes about 4 minutes.</>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setMode('intro')}
                  className="ml-auto text-xs font-semibold text-slate-500 hover:text-slate-700 whitespace-nowrap"
                >
                  Change path
                </button>
              </div>
            </div>
          )}
          {step === 0 && legacyAnchor && !existingArtifact && (
            <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2 text-sm text-amber-900">
                <Star className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  You already have a statement saved:
                  <div className="mt-1 italic">“{legacyAnchor}”</div>
                  <div className="mt-1 text-xs">
                    Going through these prompts will draft a richer, structured version.
                    Your old statement stays unchanged until you save the new one.
                  </div>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <QuestionStep
              key={currentQ.id}
              question={currentQ}
              value={answers[currentQ.id] || ''}
              onChange={(v) => setAnswers((a) => ({ ...a, [currentQ.id]: v }))}
              onBack={() => {
                if (step === 0) setMode('intro');
                else setStep((s) => Math.max(0, s - 1));
              }}
              onNext={() => {
                if (step + 1 < total) setStep(step + 1);
                else generate();
              }}
              isFirst={false}
              isLast={step === total - 1}
              stepNumber={step + 1}
              totalSteps={total}
            />
          </AnimatePresence>
        </div>
      )}

      {/* ------------------------- CRAFTING MODE ------------------------- */}
      {mode === 'crafting' && (
        <div className="text-center py-16">
          <Loader2 className="w-10 h-10 animate-spin text-corporate-teal mx-auto mb-4" />
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            Crafting your Leadership Identity…
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Anchor, three pieces of evidence, and your edge.
          </p>
        </div>
      )}

      {/* --------------------------- EDIT MODE --------------------------- */}
      {mode === 'edit' && draftArtifact && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Edit anything. Save when it sounds like <em>you</em>.
            </div>
            <button
              type="button"
              onClick={() => {
                if (existingArtifact && isArtifactComplete(existingArtifact)) {
                  setDraftArtifact(existingArtifact);
                  setMode('view');
                } else {
                  setMode('intro');
                }
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          {genError && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              {genError}
            </div>
          )}

          <AnchorCard
            artifact={draftArtifact}
            editing
            onChange={(patch) => setDraftArtifact((d) => ({ ...d, ...patch }))}
            alternates={alternates}
            onPickAlternate={(alt) =>
              setDraftArtifact((d) => ({ ...d, anchor: { ...d.anchor, statement: alt } }))
            }
          />
          <EvidenceCard
            artifact={draftArtifact}
            editing
            onChange={(patch) => setDraftArtifact((d) => ({ ...d, ...patch }))}
          />
          <EdgeCard
            artifact={draftArtifact}
            editing
            onChange={(patch) => setDraftArtifact((d) => ({ ...d, ...patch }))}
          />

          {saveError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
              {saveError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={generate}
              disabled={mode === 'crafting'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" /> Re-draft with AI
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-corporate-teal text-white font-semibold hover:bg-corporate-teal/90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save my Leadership Identity'}
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default IdentityStatement;
