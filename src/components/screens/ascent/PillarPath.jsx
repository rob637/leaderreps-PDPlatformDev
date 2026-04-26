// src/components/screens/ascent/PillarPath.jsx
//
// Ascent — YOUR PATH: three-pillar selector + workstream expander.
//
// Layout:
//   ┌─────────────────────────────────────────────────────────────┐
//   │  YOUR PATH                                                   │
//   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
//   │  │ Lead Work    │ │ Lead Team ●  │ │ Lead Self    │        │
//   │  │ ✓ Foundation │ │ Active       │ │ Q3 2026      │        │
//   │  └──────────────┘ └──────────────┘ └──────────────┘        │
//   │                                                              │
//   │  ← Expanded workstream when a pillar is selected →          │
//   │  ○ → ○ → ○ → ● → ○ → ○  (horizontal skill nodes)           │
//   └─────────────────────────────────────────────────────────────┘
//
// Clicking a pillar card expands its workstream inline.
// Clicking a skill node fires onOpenSkill(skill, pillarId).
// Lead Team nodes fire onOpenConversation(conversationId) instead.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Users, Heart, CheckCircle2, Lock,
  ChevronRight, ChevronDown, Circle, Sparkles, Clock,
  Target, MessageSquare, HelpCircle, Compass,
  Zap, AlertTriangle, RefreshCw, Star,
  User, Activity, Shield, FileText, Share2, CheckSquare,
} from 'lucide-react';
import { PILLARS, LEAD_WORK_SKILLS, LEAD_SELF_SKILLS } from './pillarLibrary.js';
import { CONVERSATIONS } from './conversationLibrary.js';
import { STEP_KEYS } from '../../../hooks/useAscentJourney.js';

// ─── Icon maps ────────────────────────────────────────────────────────────

const PILLAR_ICONS = { Briefcase, Users, Heart };

const SKILL_ICONS = {
  Compass, Target, CheckSquare, Share2, FileText,
  User, Activity, Zap, MessageSquare, RefreshCw, Shield, Heart,
  HelpCircle, AlertTriangle, Star,
};

const CONVO_ICONS = {
  Target, MessageSquare, HelpCircle, Compass, Users,
  Zap, AlertTriangle, RefreshCw, Star,
};

// ─── Progress helpers ─────────────────────────────────────────────────────

const journeyState = (journey) => {
  if (!journey) return 'todo';
  const done = STEP_KEYS.filter((k) => journey?.steps?.[k]?.done).length;
  if (done === STEP_KEYS.length) return 'done';
  if (done > 0) return 'active';
  return 'todo';
};

// Returns 0-1 completion ratio for a pillar
const pillarProgress = (pillarId, getJourney) => {
  if (pillarId === 'lead-team') {
    const total = CONVERSATIONS.length;
    if (total === 0) return 0;
    const done = CONVERSATIONS.filter((c) => journeyState(getJourney?.(c.id)) === 'done').length;
    return done / total;
  }
  return pillarId === 'lead-work' ? 0.3 : 0; // Lead Work: Foundation partial
};

// ─── Progress ring (SVG) ─────────────────────────────────────────────────

const ProgressRing = ({ pct, accent, size = 44 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={accent}
        strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
};

// ─── Pillar selector card ─────────────────────────────────────────────────

const PillarCard = ({ pillar, isOpen, progress, onClick }) => {
  const Icon = PILLAR_ICONS[pillar.icon] || Briefcase;
  const isActive = pillar.status === 'active';
  const isAvailable = pillar.status === 'available';
  const isComing = pillar.status === 'coming';
  const completePct = isAvailable ? Math.max(progress, 0.25) : progress;

  const badgeColors = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    teal:    'bg-corporate-teal/15 text-corporate-teal',
    indigo:  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  };

  return (
    <motion.button
      layout
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={isComing}
      className={`flex-1 min-w-0 flex flex-col items-center text-center p-4 rounded-2xl border-2 transition-all relative overflow-hidden ${
        isOpen
          ? 'border-corporate-teal shadow-md bg-white dark:bg-slate-800'
          : isAvailable || isActive
            ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-corporate-teal/60 hover:shadow-sm cursor-pointer'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 cursor-default opacity-70'
      }`}
      style={isOpen ? { borderColor: pillar.accent } : undefined}
    >
      {/* Faint accent wash when open */}
      {isOpen && (
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{ background: pillar.accent }}
        />
      )}

      {/* Progress ring + icon */}
      <div className="relative mb-2">
        <ProgressRing pct={completePct} accent={pillar.accent} />
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: pillar.accent }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Title */}
      <div className="text-sm font-extrabold text-corporate-navy dark:text-white leading-tight">
        {pillar.title}
      </div>

      {/* Badge */}
      <div className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeColors[pillar.badgeTone]}`}>
        {pillar.badge}
      </div>

      {/* Open indicator */}
      {!isComing && (
        <div className="mt-1.5">
          {isOpen
            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      )}
    </motion.button>
  );
};

// ─── Single skill node in the workstream ────────────────────────────────

const SkillNode = ({ skill, convo, state, isFocus, onClick, delay }) => {
  const label = convo
    ? convo.title.replace('The ', '').replace(' Conversation', '')
    : skill?.title || '';
  const accent = convo?.accent || skill?.accent || '#47A88D';
  const Icon = convo
    ? (CONVO_ICONS[convo.icon] || MessageSquare)
    : (SKILL_ICONS[skill?.icon] || Circle);
  const isLocked = skill?.status === 'coming';
  const isDone = state === 'done';
  const isActive = state === 'active';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center"
    >
      <button
        onClick={isLocked ? undefined : onClick}
        disabled={isLocked}
        className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 p-3 min-w-[96px] max-w-[112px] transition-all text-center ${
          isDone
            ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
            : isFocus
              ? 'border-corporate-teal bg-corporate-teal/5 shadow-md'
              : isActive
                ? 'border-corporate-teal/50 bg-white dark:bg-slate-800'
                : isLocked
                  ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 opacity-60 cursor-not-allowed'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-corporate-teal/60 hover:-translate-y-0.5 cursor-pointer'
        }`}
      >
        {/* State dot */}
        <div className="absolute -top-1.5 -right-1.5">
          {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500 bg-white dark:bg-slate-800 rounded-full" />}
          {isActive && !isDone && (
            <div className="w-3 h-3 rounded-full bg-corporate-teal border-2 border-white dark:border-slate-800 animate-pulse" />
          )}
          {isFocus && !isDone && !isActive && (
            <Sparkles className="w-4 h-4 text-corporate-teal bg-white dark:bg-slate-800 rounded-full" />
          )}
        </div>

        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5"
          style={{ background: `${accent}18`, color: accent }}
        >
          {isLocked ? <Lock className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        </div>

        {/* Label */}
        <div className="text-[11px] font-bold text-corporate-navy dark:text-white leading-tight line-clamp-2">
          {label}
        </div>

        {/* Sub-state */}
        <div className="text-[9px] uppercase tracking-wider mt-1 text-slate-400">
          {isDone ? 'done' : isActive ? 'in progress' : isLocked ? 'Q3 2026' : 'to do'}
        </div>
      </button>
    </motion.div>
  );
};

const NodeConnector = () => (
  <div className="shrink-0 flex items-center self-center text-slate-300 dark:text-slate-600 pb-4">
    <ChevronRight className="w-4 h-4" />
  </div>
);

// ─── Workstream expander ─────────────────────────────────────────────────

const WorkstreamPanel = ({ pillar, getJourney, focusId, onOpenConvo, onOpenSkill }) => {
  let skills = [];
  if (pillar.skillSource === 'leadTeam') {
    skills = CONVERSATIONS.map((c) => ({ type: 'convo', data: c }));
  } else if (pillar.skillSource === 'leadWork') {
    skills = LEAD_WORK_SKILLS.map((s) => ({ type: 'skill', data: s }));
  } else if (pillar.skillSource === 'leadSelf') {
    skills = LEAD_SELF_SKILLS.map((s) => ({ type: 'skill', data: s }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 200 }}
      className="overflow-hidden"
    >
      <div className="pt-1 pb-1">
        {/* Pillar description */}
        <div className="px-1 mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">{pillar.description}</p>
        </div>

        {/* Lead Work: Foundation complete banner */}
        {pillar.id === 'lead-work' && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-800 dark:text-emerald-200">Foundation Complete</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300">
                You built these skills in Foundation. Click any to deepen your practice.
              </div>
            </div>
          </div>
        )}

        {/* Lead Self: Coming soon banner */}
        {pillar.id === 'lead-self' && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
            <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
            <div>
              <div className="text-sm font-bold text-indigo-800 dark:text-indigo-200">Launching Q3 2026</div>
              <div className="text-xs text-indigo-700 dark:text-indigo-300">
                Preview the content below — full program unlocks this summer.
              </div>
            </div>
          </div>
        )}

        {/* Horizontal scroll workstream */}
        <div className="overflow-x-auto -mx-1 px-1 pb-2">
          <div className="flex items-start gap-1 w-max">
            {skills.map(({ type, data }, i) => {
              if (type === 'convo') {
                const c = data;
                const jState = journeyState(getJourney?.(c.id));
                const isFocus = focusId === c.id;
                return (
                  <React.Fragment key={c.id}>
                    <SkillNode
                      convo={c}
                      state={jState}
                      isFocus={isFocus}
                      onClick={() => onOpenConvo?.(c)}
                      delay={0.03 * i}
                    />
                    {i < skills.length - 1 && <NodeConnector />}
                  </React.Fragment>
                );
              }
              // type === 'skill'
              const s = data;
              return (
                <React.Fragment key={s.id}>
                  <SkillNode
                    skill={s}
                    state={s.source === 'foundation' ? 'done' : 'todo'}
                    isFocus={false}
                    onClick={() => onOpenSkill?.(s)}
                    delay={0.03 * i}
                  />
                  {i < skills.length - 1 && <NodeConnector />}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────

const PillarPath = ({
  focusId,
  getJourney,
  onPickConversation,
  onOpenConvo,
  onOpenSkill,
}) => {
  // Default open: lead-team (the active pillar)
  const [openPillar, setOpenPillar] = useState('lead-team');

  const toggle = (pillarId) => {
    setOpenPillar((prev) => (prev === pillarId ? null : pillarId));
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
            Your Path
          </div>
          <div className="text-sm font-bold text-corporate-navy dark:text-white">
            Lead Work · Lead Team · Lead Self
          </div>
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          Tap a pillar to explore
        </div>
      </div>

      {/* Three pillar cards */}
      <div className="flex gap-3 mb-2">
        {PILLARS.map((pillar) => (
          <PillarCard
            key={pillar.id}
            pillar={pillar}
            isOpen={openPillar === pillar.id}
            progress={pillarProgress(pillar.id, getJourney)}
            onClick={() => toggle(pillar.id)}
          />
        ))}
      </div>

      {/* Expanded workstream */}
      <AnimatePresence mode="wait">
        {openPillar && (() => {
          const pillar = PILLARS.find((p) => p.id === openPillar);
          if (!pillar || pillar.status === 'coming' && false) return null; // always render preview
          return (
            <WorkstreamPanel
              key={openPillar}
              pillar={pillar}
              getJourney={getJourney}
              focusId={focusId}
              onOpenConvo={onOpenConvo}
              onOpenSkill={onOpenSkill}
            />
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default PillarPath;
