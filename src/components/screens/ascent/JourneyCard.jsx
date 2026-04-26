// src/components/screens/ascent/JourneyCard.jsx
//
// Lead Team — "Your Next Step" card.
//
// One card. One next action. Four-step journey for a single conversation:
//   ① Learn  ② Prep  ③ Practice  ④ Reflect
//
// Each step has its own primary CTA + an explicit "Mark complete" tap.
// When all four are done, the card flips to a celebrate state and prompts
// the user to pick the next conversation.

import React from 'react';
import { motion } from 'framer-motion';
import {
  PlayCircle, Send, Calendar, Edit3, CheckCircle2, Circle,
  ArrowRight, RefreshCw, Trophy, Target, MessageSquare, HelpCircle, Compass, Users,
  Zap, AlertTriangle, Star,
} from 'lucide-react';
import { STEP_KEYS, STEP_META } from '../../../hooks/useAscentJourney.js';
import { getFrameworkById } from './frameworks.js';

const ICONS = { Target, MessageSquare, HelpCircle, Compass, Users, Zap, AlertTriangle, RefreshCw, Star };

const STEP_CTA = {
  learn:    { label: 'Watch the video',   icon: PlayCircle, target: 'leadership-videos' },
  prep:     { label: 'Open prep card',    icon: Edit3,      target: null /* opens modal */ },
  practice: { label: 'Find an Open Gym',  icon: Calendar,   target: 'coaching-hub' },
  reflect:  { label: 'Add a Field Note',  icon: Send,       target: 'rep-coach' },
};

const StepRow = ({ stepKey, journey, isNext, accent, onCta, onToggle }) => {
  const meta = STEP_META[stepKey];
  const cta = STEP_CTA[stepKey];
  const CtaIcon = cta.icon;
  const done = !!journey?.steps?.[stepKey]?.done;

  return (
    <motion.div
      animate={{ scale: isNext && !done ? 1 : 0.99 }}
      className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all ${
        done
          ? 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-900/10 dark:border-emerald-800'
          : isNext
            ? 'border-corporate-teal bg-corporate-teal/5 shadow-sm'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
      }`}
    >
      <button
        onClick={() => onToggle(stepKey)}
        aria-label={done ? 'Mark incomplete' : 'Mark complete'}
        className="shrink-0 mt-0.5"
      >
        {done ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        ) : (
          <Circle className={`w-6 h-6 ${isNext ? 'text-corporate-teal' : 'text-slate-300'}`} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${done ? 'text-slate-500 line-through' : 'text-corporate-navy dark:text-white'}`}>
            {meta.label}
          </span>
          {isNext && !done && (
            <span
              className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded text-white"
              style={{ background: accent }}
            >
              Next
            </span>
          )}
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{meta.sub}</p>
        {!done && (
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={() => onCta(stepKey)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: accent }}
            >
              <CtaIcon className="w-3.5 h-3.5" /> {cta.label}
            </button>
            <button
              onClick={() => onToggle(stepKey)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              Mark complete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const JourneyCard = ({
  conversation,
  journey,
  nextStepKey,
  onStepCta,
  onToggleStep,
  onChangeFocus,
  onPickNext,
}) => {
  if (!conversation) return null;

  const Icon = ICONS[conversation.icon] || MessageSquare;
  const accent = conversation.accent || '#47A88D';
  const framework = getFrameworkById(conversation.frameworkId);
  const doneCount = STEP_KEYS.filter((k) => journey?.steps?.[k]?.done).length;
  const totalSteps = STEP_KEYS.length;
  const pct = Math.round((doneCount / totalSteps) * 100);
  const complete = doneCount === totalSteps;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 24 }}
      className="rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-elevated overflow-hidden"
    >
      {/* Header */}
      <div
        className="px-5 py-4 text-white relative"
        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wider opacity-80">
                Your focus · Lead Team
              </div>
              <div className="font-extrabold text-lg leading-tight">{conversation.title}</div>
              <div className="text-xs opacity-90 mt-0.5 truncate">{conversation.tagline}</div>
            </div>
          </div>
          <button
            onClick={onChangeFocus}
            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-white/15 hover:bg-white/25"
            title="Pick a different focus"
          >
            <RefreshCw className="w-3 h-3" /> Change
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] opacity-90 mb-1">
            <span>Step {Math.min(doneCount + (complete ? 0 : 1), totalSteps)} of {totalSteps}</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', damping: 20 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {complete ? (
          <div className="text-center py-4">
            <Trophy className="w-10 h-10 mx-auto text-corporate-orange" />
            <h3 className="font-extrabold text-corporate-navy dark:text-white mt-2 text-lg">
              Nice work — {conversation.title.toLowerCase()} complete.
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-sm mx-auto">
              Don't stop the momentum. Pick the next conversation to work on.
            </p>
            <button
              onClick={onPickNext}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm text-white bg-corporate-teal hover:bg-corporate-teal/90"
            >
              Pick my next focus <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {STEP_KEYS.map((k) => (
              <StepRow
                key={k}
                stepKey={k}
                journey={journey}
                isNext={k === nextStepKey}
                accent={accent}
                onCta={onStepCta}
                onToggle={onToggleStep}
              />
            ))}

            {framework && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Framework you'll use
                </div>
                <div className="text-sm font-semibold text-corporate-navy dark:text-white">
                  {framework.name}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default JourneyCard;
