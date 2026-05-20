// src/components/screens/ascent/FocusPicker.jsx
//
// Lead Team — first-run focus picker.
//
// Blocking modal asked once: "What's the conversation you're avoiding right now?"
// Pick one, or "Show me where to start" → defaults to Feedback (the featured one).

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, ArrowRight, Target, MessageSquare, HelpCircle, Compass, Users,
  Zap, AlertTriangle, RefreshCw, Star,
} from 'lucide-react';
import { CONVERSATIONS, getFeaturedConversation } from './conversationLibrary.js';

const ICONS = { Target, MessageSquare, HelpCircle, Compass, Users, Zap, AlertTriangle, RefreshCw, Star };

const FocusPicker = ({ open, onPick, firstName = 'Leader' }) => {
  const [hovered, setHovered] = useState(null);

  if (!open) return null;
  const featured = getFeaturedConversation();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-corporate-navy/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="bg-white dark:bg-slate-800 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-br from-corporate-navy to-corporate-teal text-white">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
              <Sparkles className="w-3.5 h-3.5" /> Pick your focus
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
              Welcome to Ascent, {firstName}.
            </h2>
            <p className="text-sm sm:text-base opacity-90 mt-2">
              What's the conversation you've been avoiding? Pick one. We'll build a 4-step path
              around it — learn, prep, practice, reflect.
            </p>
          </div>

          {/* Picker grid */}
          <div className="overflow-y-auto px-6 py-5 space-y-3">
            {CONVERSATIONS.map((c) => {
              const Icon = ICONS[c.icon] || MessageSquare;
              const isHover = hovered === c.id;
              return (
                <motion.button
                  key={c.id}
                  whileHover={{ x: 4 }}
                  onMouseEnter={() => setHovered(c.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => onPick(c.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-corporate-teal hover:bg-corporate-teal/5 transition-all text-left"
                >
                  <div
                    className="shrink-0 w-11 h-11 rounded-lg flex items-center justify-center"
                    style={{ background: `${c.accent}18`, color: c.accent }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-corporate-navy dark:text-white">{c.title}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 truncate">
                      {c.tagline}
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-all ${
                      isHover ? 'text-corporate-teal-ink translate-x-1' : 'text-slate-400'
                    }`}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 bg-slate-50 dark:bg-slate-900/30 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">You can change this anytime.</p>
            <button
              onClick={() => onPick(featured.id)}
              className="text-sm font-semibold text-corporate-teal-ink hover:text-corporate-subtle-teal inline-flex items-center gap-1"
            >
              Not sure? Start me on {featured.title} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FocusPicker;
