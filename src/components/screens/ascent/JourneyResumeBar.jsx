// src/components/screens/ascent/JourneyResumeBar.jsx
//
// Lead Team — sticky resume bar shown when user is exploring (Explore tab,
// content screens, etc). One tap returns them to their next step.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mountain } from 'lucide-react';
import { getConversationById } from './conversationLibrary.js';
import { STEP_META } from '../../../hooks/useAscentJourney.js';

const JourneyResumeBar = ({ focusId, nextStepKey, onResume, sticky = true }) => {
  if (!focusId) return null;
  const convo = getConversationById(focusId);
  if (!convo) return null;
  const step = nextStepKey ? STEP_META[nextStepKey] : null;
  const accent = convo.accent || '#47A88D';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className={`${sticky ? 'sticky top-2 z-30' : ''} mx-auto`}
      >
        <button
          onClick={onResume}
          className="w-full group flex items-center gap-3 rounded-xl border-2 border-corporate-teal/40 bg-white/95 dark:bg-slate-800/95 backdrop-blur shadow-card hover:shadow-card-hover hover:border-corporate-teal transition-all px-3 py-2 text-left"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${accent}18`, color: accent }}
          >
            <Mountain className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
              Your journey · {convo.title}
            </div>
            <div className="text-sm font-semibold text-corporate-navy dark:text-white truncate">
              {step
                ? `Next step: ${step.label} — ${step.sub}`
                : 'Journey complete — pick your next focus'}
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md text-white shrink-0"
            style={{ background: accent }}
          >
            Continue <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default JourneyResumeBar;
