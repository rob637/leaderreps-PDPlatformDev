// src/components/screens/ascent/ConversationModal.jsx
//
// Lead Team — Conversation drill-down modal.
// Shows: tagline, when/avoid, framework steps, prompt starters, CTAs.
// "Wow but simple" — clean motion, no clutter, copy that earns trust.

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Target, MessageSquare, HelpCircle, Compass, Users,
  PlayCircle, Send, Calendar, Copy, Check,
  Zap, AlertTriangle, RefreshCw, Star, BookOpen, Video,
  Trophy, ArrowRight,
} from 'lucide-react';
import { getFrameworkById } from './frameworks.js';
import { STEP_KEYS, STEP_META } from '../../../hooks/useAscentJourney.js';

const ICONS = { Target, MessageSquare, HelpCircle, Compass, Users, Zap, AlertTriangle, RefreshCw, Star };

const STEP_CTA_LABEL = {
  learn:    'Read the script',
  prep:     'Open prep card',
  practice: 'Schedule a rep',
  reflect:  'Add a field note',
};

const ConversationModal = ({ conversation, journey, onToggleStep, onStepCta, onPickNext, onClose, navigate }) => {
  const [copiedIdx, setCopiedIdx] = useState(null);
  const bodyRef = useRef(null);
  const scriptRef = useRef(null);
  const frameworkRef = useRef(null);

  if (!conversation) return null;
  const Icon = ICONS[conversation.icon] || MessageSquare;
  const framework = getFrameworkById(conversation.frameworkId);
  const accent = conversation.accent || '#47A88D';

  const doneCount = onToggleStep ? STEP_KEYS.filter(k => !!journey?.steps?.[k]?.done).length : 0;
  const complete = onToggleStep ? doneCount === STEP_KEYS.length : false;
  const nextStepKey = complete ? null : (onToggleStep ? STEP_KEYS.find(k => !journey?.steps?.[k]?.done) : null);

  const handleInternalStepCta = (stepKey) => {
    if (stepKey === 'learn' && scriptRef.current && bodyRef.current) {
      bodyRef.current.scrollTo({ top: scriptRef.current.offsetTop - 12, behavior: 'smooth' });
    } else if (stepKey === 'prep' && frameworkRef.current && bodyRef.current) {
      bodyRef.current.scrollTo({ top: frameworkRef.current.offsetTop - 12, behavior: 'smooth' });
    } else {
      onStepCta?.(stepKey);
    }
  };

  const copyStarter = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch (_) {
      /* clipboard unavailable */
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="bg-white dark:bg-slate-800 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="px-6 py-5 text-white relative"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3 pr-10">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider opacity-80">Lead Team · Conversation</div>
                <h2 className="text-2xl font-extrabold mt-0.5">{conversation.title}</h2>
                <p className="text-sm opacity-90 mt-1">{conversation.tagline}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div ref={bodyRef} className="overflow-y-auto px-6 py-5 space-y-5">

            {/* Journey Progress — 4-step tracker */}
            {onToggleStep && (
              <div className="rounded-2xl border-2 p-4" style={{ borderColor: `${accent}44`, background: `${accent}08` }}>
                {/* Step dots + labels */}
                <div className="flex items-start gap-1 mb-4">
                  {STEP_KEYS.map((k, i) => {
                    const done = !!journey?.steps?.[k]?.done;
                    const isNextStep = k === nextStepKey;
                    return (
                      <React.Fragment key={k}>
                        <button
                          onClick={() => onToggleStep(k)}
                          className="flex flex-col items-center flex-1 min-w-0"
                          title={done ? 'Mark incomplete' : 'Mark complete'}
                        >
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 transition-colors ${
                            done ? 'bg-emerald-500' : isNextStep ? 'bg-corporate-teal' : 'bg-slate-200 dark:bg-slate-700'
                          }`}>
                            {done
                              ? <Check className="w-3.5 h-3.5 text-white" />
                              : <div className={`w-2 h-2 rounded-full ${isNextStep ? 'bg-white' : 'bg-slate-400 dark:bg-slate-500'}`} />
                            }
                          </div>
                          <span className={`text-[9px] uppercase tracking-wider font-bold leading-tight text-center ${
                            done ? 'text-emerald-600 dark:text-emerald-400' : isNextStep ? 'text-corporate-teal' : 'text-slate-400'
                          }`}>{STEP_META[k].label}</span>
                        </button>
                        {i < STEP_KEYS.length - 1 && (
                          <div className="shrink-0 w-6 h-0.5 mt-3 self-start rounded-full" style={{ background: `${accent}30` }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Active step action or completion */}
                {complete ? (
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-corporate-orange shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-corporate-navy dark:text-white">Conversation complete!</div>
                        <div className="text-xs text-slate-500">Don't stop — pick the next one.</div>
                      </div>
                    </div>
                    <button
                      onClick={onPickNext}
                      className="shrink-0 inline-flex items-center gap-1 text-sm font-semibold text-white px-3 py-1.5 rounded-lg"
                      style={{ background: accent }}
                    >
                      Next <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : nextStepKey ? (
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-bold" style={{ color: accent }}>
                        Next · {STEP_META[nextStepKey].label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{STEP_META[nextStepKey].sub}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleInternalStepCta(nextStepKey)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white"
                        style={{ background: accent }}
                      >
                        {STEP_CTA_LABEL[nextStepKey]}
                      </button>
                      <button
                        onClick={() => onToggleStep(nextStepKey)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                      >
                        ✓ Done
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Video Script */}
            {Array.isArray(conversation.videoScript) && conversation.videoScript.length > 0 && (
              <div
                ref={scriptRef}
                className="rounded-2xl border-2 p-4"
                style={{ borderColor: `${accent}55`, background: `${accent}0d` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4" style={{ color: accent }} />
                  <div className="text-[11px] uppercase tracking-wider font-bold" style={{ color: accent }}>
                    Video Script · {conversation.videoMinutes} min
                  </div>
                </div>
                <ol className="space-y-2">
                  {conversation.videoScript.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span
                        className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                        style={{ background: accent }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">{point}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* When / Avoid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3">
                <div className="text-[11px] uppercase tracking-wider font-bold text-emerald-700 dark:text-emerald-300">When to use</div>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{conversation.when}</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-3">
                <div className="text-[11px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-300">What to avoid</div>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{conversation.avoid}</p>
              </div>
            </div>

            {/* Framework */}
            {framework && (
              <div ref={frameworkRef} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Framework</div>
                  <div className="font-bold text-corporate-navy dark:text-white">{framework.name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{framework.summary}</div>
                </div>
                <ol className="divide-y divide-slate-200 dark:divide-slate-700">
                  {framework.steps.map((s, i) => (
                    <li key={s.label} className="flex items-start gap-3 px-4 py-3">
                      <div
                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: accent }}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-corporate-navy dark:text-white">{s.label}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">{s.prompt}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Prompt starters */}
            {Array.isArray(conversation.promptStarters) && conversation.promptStarters.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">
                  Try saying it like this
                </div>
                <ul className="space-y-2">
                  {conversation.promptStarters.map((p, i) => (
                    <li
                      key={i}
                      className="group flex items-start justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/30 px-3 py-2 hover:border-corporate-teal/50"
                    >
                      <p className="text-sm text-corporate-navy dark:text-white italic">"{p}"</p>
                      <button
                        onClick={() => copyStarter(p, i)}
                        aria-label="Copy"
                        className="shrink-0 text-slate-400 hover:text-corporate-teal opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {copiedIdx === i ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer CTAs */}
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900/30">
            <div className="flex flex-wrap gap-2">
              {conversation.videoUrl ? (
                <button
                  onClick={() => navigate?.('leadership-videos')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: accent }}
                >
                  <PlayCircle className="w-4 h-4" /> Watch the {conversation.videoMinutes}-min video
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (scriptRef.current && bodyRef.current) {
                      bodyRef.current.scrollTo({ top: scriptRef.current.offsetTop - 12, behavior: 'smooth' });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-600 text-corporate-navy dark:text-white hover:bg-white dark:hover:bg-slate-800"
                >
                  <Video className="w-4 h-4" /> Read the transcript
                </button>
              )}
              <button
                onClick={() => navigate?.('coaching-hub')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-600 text-corporate-navy dark:text-white hover:bg-white dark:hover:bg-slate-800"
              >
                <Calendar className="w-4 h-4" /> Practice / Reps
              </button>
              <button
                onClick={() => navigate?.('rep-coach', { mode: 'practice', skillTitle: conversation.title, skillTagline: conversation.tagline })}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-600 text-corporate-navy dark:text-white hover:bg-white dark:hover:bg-slate-800"
              >
                <Send className="w-4 h-4" /> Prep with Rep
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConversationModal;
