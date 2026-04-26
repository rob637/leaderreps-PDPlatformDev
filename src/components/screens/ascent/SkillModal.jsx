// src/components/screens/ascent/SkillModal.jsx
//
// Ascent — Skill drill-down modal for Lead Work and Lead Self skills.
// (Lead Team conversations use ConversationModal instead.)
//
// Shows: script bullets, framework, prompt starters, CTAs.
// Same structural feel as ConversationModal so the UX is consistent.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, BookOpen, Video, Calendar, Send, Copy, Check,
  Compass, Target, CheckSquare, Share2, FileText, User,
  Activity, Zap, MessageSquare, RefreshCw, Shield, Heart,
} from 'lucide-react';

const ICONS = {
  Compass, Target, CheckSquare, Share2, FileText,
  User, Activity, Zap, MessageSquare, RefreshCw, Shield, Heart,
  Calendar,
};

const SkillModal = ({ skill, onClose, navigate }) => {
  const [copiedIdx, setCopiedIdx] = useState(null);

  if (!skill) return null;

  const Icon = ICONS[skill.icon] || BookOpen;
  const accent = skill.accent || '#002E47';
  const isComingSoon = skill.status === 'coming';

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
                <div className="flex items-center gap-2">
                  <div className="text-xs uppercase tracking-wider opacity-80">
                    {skill.source === 'foundation' ? 'Lead Work · Foundation Skill' : 'Lead Self · Inner Game'}
                  </div>
                  {isComingSoon && (
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
                      Q3 2026
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-extrabold mt-0.5">{skill.title}</h2>
                <p className="text-sm opacity-90 mt-1">{skill.tagline}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto px-6 py-5 space-y-5">

            {/* Foundation note (Lead Work only) */}
            {skill.foundationNote && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">{skill.foundationNote}</p>
              </div>
            )}

            {/* Coming soon banner */}
            {isComingSoon && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                <div className="text-sm text-indigo-800 dark:text-indigo-200">
                  This skill launches in Q3 2026. The content below is a preview — you can read through it now.
                </div>
              </div>
            )}

            {/* Video Script */}
            {Array.isArray(skill.videoScript) && skill.videoScript.length > 0 && (
              <div
                className="rounded-2xl border-2 p-4"
                style={{ borderColor: `${accent}55`, background: `${accent}0d` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4" style={{ color: accent }} />
                  <div className="text-[11px] uppercase tracking-wider font-bold" style={{ color: accent }}>
                    Script · {skill.videoMinutes} min
                  </div>
                </div>
                <ol className="space-y-2">
                  {skill.videoScript.map((point, i) => (
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

            {/* Framework */}
            {skill.framework && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Framework</div>
                  <div className="font-bold text-corporate-navy dark:text-white">{skill.framework.name}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{skill.framework.summary}</div>
                </div>
                <ol className="divide-y divide-slate-200 dark:divide-slate-700">
                  {skill.framework.steps.map((s, i) => (
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
            {Array.isArray(skill.promptStarters) && skill.promptStarters.length > 0 && (
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">
                  Try saying it like this
                </div>
                <ul className="space-y-2">
                  {skill.promptStarters.map((p, i) => (
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

          {/* Footer */}
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900/30">
            <div className="flex flex-wrap gap-2">
              {skill.videoUrl ? (
                <button
                  onClick={() => navigate?.('leadership-videos')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: accent }}
                >
                  <Video className="w-4 h-4" /> Watch the {skill.videoMinutes}-min video
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed">
                  <Video className="w-4 h-4" /> Video coming soon
                </span>
              )}
              <button
                onClick={() => navigate?.('rep-coach')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-600 text-corporate-navy dark:text-white hover:bg-white dark:hover:bg-slate-800"
              >
                <Send className="w-4 h-4" /> Practice with Rep
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SkillModal;
