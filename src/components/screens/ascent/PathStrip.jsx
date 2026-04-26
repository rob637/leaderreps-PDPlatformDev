// src/components/screens/ascent/PathStrip.jsx
//
// Lead Team — "Your Path" horizontal strip.
//
// Foundation ✓ → [active] → upcoming → … → Lead Self (locked)
// Visualizes the user's build-your-own journey.

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Lock, Circle, ChevronRight, Briefcase, Heart,
  Target, MessageSquare, HelpCircle, Compass, Users,
  Zap, AlertTriangle, RefreshCw, Star,
} from 'lucide-react';
import { CONVERSATIONS } from './conversationLibrary.js';
import { STEP_KEYS } from '../../../hooks/useAscentJourney.js';

const ICONS = { Target, MessageSquare, HelpCircle, Compass, Users, Zap, AlertTriangle, RefreshCw, Star };

const stateOf = (journey) => {
  if (!journey) return 'todo';
  const done = STEP_KEYS.filter((k) => journey?.steps?.[k]?.done).length;
  if (done === 0) return 'todo';
  if (done === STEP_KEYS.length) return 'done';
  return 'active';
};

const Node = ({ children, accent, state, label, sub, onClick, isFocus, delay }) => {
  const base = 'relative shrink-0 flex flex-col items-center justify-center rounded-2xl border-2 px-3 py-2 min-w-[110px] transition-all';
  const tone = state === 'done'
    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
    : isFocus
      ? 'border-corporate-teal bg-corporate-teal/5 shadow-md'
      : state === 'active'
        ? 'border-corporate-teal/50 bg-white dark:bg-slate-800'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      disabled={!onClick}
      className={`${base} ${tone} ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : 'cursor-default'}`}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center mb-1"
        style={{ background: `${accent}18`, color: accent }}
      >
        {children}
      </div>
      <div className="text-[11px] font-bold text-corporate-navy dark:text-white text-center leading-tight max-w-[90px] truncate">
        {label}
      </div>
      <div className="text-[10px] uppercase tracking-wider mt-0.5 flex items-center gap-1 text-slate-500">
        {state === 'done' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
        {state === 'active' && <Circle className="w-3 h-3 text-corporate-teal" />}
        {state === 'locked' && <Lock className="w-3 h-3" />}
        {sub}
      </div>
    </motion.button>
  );
};

const Connector = () => (
  <div className="shrink-0 flex items-center text-slate-300 dark:text-slate-600 px-1">
    <ChevronRight className="w-4 h-4" />
  </div>
);

const PathStrip = ({ focusId, getJourney, onPickConversation }) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
            Your Path
          </div>
          <div className="text-sm font-bold text-corporate-navy dark:text-white">
            Lead Work → Lead Team → Lead Self
          </div>
        </div>
      </div>

      <div className="flex items-stretch overflow-x-auto pb-1 -mx-1 px-1">
        <Node
          accent="#002E47"
          state="done"
          label="Lead Work"
          sub="Done"
          delay={0}
        >
          <Briefcase className="w-5 h-5" />
        </Node>
        <Connector />

        {CONVERSATIONS.map((c, i) => {
          const Icon = ICONS[c.icon] || MessageSquare;
          const j = getJourney?.(c.id);
          const st = stateOf(j);
          const isFocus = focusId === c.id;
          return (
            <React.Fragment key={c.id}>
              <Node
                accent={c.accent}
                state={st}
                label={c.title.replace('The ', '').replace(' Conversation', '')}
                sub={st === 'done' ? 'Done' : st === 'active' ? 'In progress' : 'To do'}
                onClick={() => onPickConversation?.(c.id)}
                isFocus={isFocus}
                delay={0.04 * (i + 1)}
              >
                <Icon className="w-5 h-5" />
              </Node>
              {i < CONVERSATIONS.length - 1 && <Connector />}
            </React.Fragment>
          );
        })}

        <Connector />
        <Node
          accent="#6366F1"
          state="locked"
          label="Lead Self"
          sub="Soon"
          delay={0.04 * (CONVERSATIONS.length + 1)}
        >
          <Heart className="w-5 h-5" />
        </Node>
      </div>
    </div>
  );
};

export default PathStrip;
