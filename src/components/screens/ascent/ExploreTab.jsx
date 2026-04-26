// src/components/screens/ascent/ExploreTab.jsx
//
// Lead Team — "Explore" mode. Step out of the linear journey and roam:
//   • Foundation Content (filtered to your current focus)
//   • Conversation Library (full)
//   • Community shortcuts (Open Gym, Leader Circle)
//
// Every Foundation content card has an "Add to Learn step" link-back so
// stepping out doesn't break the journey loop — it can feed it.

import React from 'react';
import { motion } from 'framer-motion';
import {
  PlayCircle, BookOpen, Dumbbell, ArrowRight, Plus, ChevronRight,
  Calendar, Users, Sparkles, Layers, MessageSquare, Target, HelpCircle, Compass,
} from 'lucide-react';
import { CONVERSATIONS, getConversationById } from './conversationLibrary.js';
import { getFoundationContentForConversation } from './foundationContentMap.js';

const ICONS = { Target, MessageSquare, HelpCircle, Compass, Users };

const KIND_ICON = {
  video: PlayCircle,
  reading: BookOpen,
  series: Layers,
  rep: Dumbbell,
  screen: ArrowRight,
};

const KIND_LABEL = {
  video: 'Video',
  reading: 'Read',
  series: 'Series',
  rep: 'Rep',
  screen: 'Tool',
};

// ---------- Foundation content row ----------

const FoundationRow = ({ item, onOpen, onAddToJourney, alreadyDone, delay }) => {
  const Icon = KIND_ICON[item.kind] || ArrowRight;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-corporate-teal/50 hover:shadow-sm transition-all"
    >
      <button
        onClick={onOpen}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${item.accent}18`, color: item.accent }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
              From Foundation · {KIND_LABEL[item.kind]}
            </span>
            {item.minutes && (
              <span className="text-[10px] text-slate-400">· {item.minutes} min</span>
            )}
          </div>
          <div className="text-sm font-semibold text-corporate-navy dark:text-white truncate">
            {item.title}
          </div>
        </div>
      </button>
      <button
        onClick={onAddToJourney}
        disabled={alreadyDone}
        title={alreadyDone ? 'Already credited to your Learn step' : 'Credit this to your Learn step'}
        className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-md transition-all ${
          alreadyDone
            ? 'bg-emerald-50 text-emerald-700 cursor-default'
            : 'border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-corporate-teal/10 hover:border-corporate-teal/50 hover:text-corporate-teal'
        }`}
      >
        {alreadyDone ? '✓ In journey' : <><Plus className="w-3 h-3" /> Add to Learn</>}
      </button>
    </motion.div>
  );
};

// ---------- Library mini-card ----------

const LibraryCard = ({ convo, isFocus, onOpen, onMakeFocus, delay }) => {
  const Icon = ICONS[convo.icon] || MessageSquare;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`group rounded-2xl border-2 p-4 transition-all bg-white dark:bg-slate-800 ${
        isFocus
          ? 'border-corporate-teal shadow-md'
          : 'border-slate-200 dark:border-slate-700 hover:border-corporate-teal/60'
      }`}
    >
      <button onClick={() => onOpen(convo)} className="w-full text-left">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${convo.accent}18`, color: convo.accent }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-corporate-navy dark:text-white text-sm leading-snug">
              {convo.title}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
              {convo.tagline}
            </p>
          </div>
        </div>
      </button>
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
        {isFocus ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-corporate-teal">
            <Sparkles className="w-3 h-3" /> Your current focus
          </span>
        ) : (
          <button
            onClick={() => onMakeFocus(convo.id)}
            className="text-[11px] font-semibold text-corporate-teal hover:text-corporate-subtle-teal inline-flex items-center gap-1"
          >
            Make this my focus <ArrowRight className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => onOpen(convo)}
          className="text-[11px] text-slate-500 hover:text-corporate-navy"
        >
          Preview
        </button>
      </div>
    </motion.div>
  );
};

// ---------- Live Cohort coming-soon card ----------

const LiveCohortCard = ({ id, title, when, blurb, accent, joined, busy, onJoin, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative rounded-2xl p-5 overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
    style={{ background: `linear-gradient(135deg, ${accent}10, transparent 60%)` }}
  >
    <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20" style={{ background: accent }} />
    <div className="relative">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded text-white"
          style={{ background: accent }}
        >
          <Calendar className="w-3 h-3" /> Live Cohort
        </span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{when}</span>
      </div>
      <h3 className="font-extrabold text-corporate-navy dark:text-white mt-2 text-lg">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{blurb}</p>
      <button
        onClick={() => onJoin(id)}
        disabled={joined || busy}
        className={`mt-4 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
          joined
            ? 'bg-emerald-100 text-emerald-700 cursor-default'
            : busy
              ? 'text-white cursor-wait'
              : 'text-white hover:opacity-90'
        }`}
        style={!joined ? { background: accent } : undefined}
      >
        {joined ? '✓ You\'re on the list' : busy ? 'Adding…' : 'Get notified when it opens'}
      </button>
    </div>
  </motion.div>
);

// ---------- Main Explore tab ----------

const ExploreTab = ({
  focusId,
  navigate,
  onOpenConvo,
  onMakeFocus,
  onAddFoundationToLearn,
  isLearnDone,
  cohortWaitlists,
  onJoinCohort,
}) => {
  const focusConvo = focusId ? getConversationById(focusId) : null;
  const foundationItems = focusId ? getFoundationContentForConversation(focusId) : [];

  return (
    <div className="space-y-6">
      {/* Foundation content (filtered) */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-corporate-navy dark:text-slate-400">
              From your Foundation
            </div>
            <h2 className="text-lg font-extrabold text-corporate-navy dark:text-white">
              {focusConvo
                ? `Reinforce what you learned — tied to ${focusConvo.title}`
                : 'Pick a focus to see tailored Foundation content'}
            </h2>
          </div>
        </div>
        {foundationItems.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-500">
            Pick a focus on the My Journey tab to see Foundation content tailored to it.
          </div>
        ) : (
          <div className="space-y-2">
            {foundationItems.map((item, i) => (
              <FoundationRow
                key={`${item.kind}-${item.title}`}
                item={item}
                delay={0.04 * i}
                alreadyDone={isLearnDone}
                onOpen={() => navigate?.(item.screen)}
                onAddToJourney={() => onAddFoundationToLearn?.(item)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Community */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-corporate-teal">
              Community · Practice live
            </div>
            <h2 className="text-lg font-extrabold text-corporate-navy dark:text-white">
              Register for an Open Gym or Leader Circle
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigate?.('coaching-hub')}
            className="text-left rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-corporate-teal bg-white dark:bg-slate-800 p-4 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-corporate-teal/15 text-corporate-teal flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-corporate-navy dark:text-white">Open Gyms</div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  60-minute facilitated sessions to work a real issue with peers.
                </p>
                <span className="text-xs font-semibold text-corporate-teal inline-flex items-center gap-1 mt-2">
                  See schedule <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </button>
          <button
            onClick={() => navigate?.('community-hub')}
            className="text-left rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-corporate-teal bg-white dark:bg-slate-800 p-4 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-corporate-orange/15 text-corporate-orange flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-corporate-navy dark:text-white">Leader Circles</div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                  Small recurring cohorts. Same group, sharper every week.
                </p>
                <span className="text-xs font-semibold text-corporate-orange inline-flex items-center gap-1 mt-2">
                  Join one <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* Live Cohort coming soon */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-300">
              Coming soon · Live training cohorts
            </div>
            <h2 className="text-lg font-extrabold text-corporate-navy dark:text-white">
              The next courses we're building
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LiveCohortCard
            id="lead-team-live"
            title="Lead Team — Live Cohort"
            when="Q3 2026"
            blurb="A 6-week instructor-led version of the Lead Team work you're doing now. Small groups. Real practice. Same conversation library — facilitated."
            accent="#47A88D"
            joined={!!cohortWaitlists?.['lead-team-live']}
            busy={cohortWaitlists?.busy === 'lead-team-live'}
            onJoin={onJoinCohort}
            delay={0.05}
          />
          <LiveCohortCard
            id="lead-self-live"
            title="Lead Self — Live Cohort"
            when="Q4 2026"
            blurb="Energy. Identity. Presence. The work of leading yourself so the team has someone worth following. 6 weeks, live."
            accent="#6366F1"
            joined={!!cohortWaitlists?.['lead-self-live']}
            busy={cohortWaitlists?.busy === 'lead-self-live'}
            onJoin={onJoinCohort}
            delay={0.1}
          />
        </div>
      </section>

      {/* Conversation library */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
              Library · All conversations
            </div>
            <h2 className="text-lg font-extrabold text-corporate-navy dark:text-white">
              Browse — make any one your focus
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONVERSATIONS.map((c, i) => (
            <LibraryCard
              key={c.id}
              convo={c}
              isFocus={c.id === focusId}
              onOpen={onOpenConvo}
              onMakeFocus={onMakeFocus}
              delay={0.04 * i}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default ExploreTab;
