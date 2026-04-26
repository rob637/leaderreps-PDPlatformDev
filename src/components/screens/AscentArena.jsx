// src/components/screens/AscentArena.jsx
//
// Ascent — Lead Team home (journey-first + Explore mode, April 2026)
//
// Two modes the user can step in and out of freely:
//   "My Journey" (default) — focus + 4-step JourneyCard + Path strip
//   "Explore"              — Foundation content (filtered to focus),
//                             Community sessions, Live Cohort waitlists,
//                             full Conversation Library
//
// A persistent JourneyResumeBar appears in Explore so the user always has
// a one-tap way back to their next step.
//
// Three-pillar framing kept: Lead Work · Lead Team (active) · Lead Self (soon).
// Vocabulary contract preserved: Anchor / Pulse / Worklist / Open Gym / Round.

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  Mountain, Compass, Activity, Flame, Users, Briefcase, Heart,
  Sparkles, ArrowRight, Lock, CheckCircle2, Bell, ChevronRight,
  Map as MapIcon, Telescope, BookOpen, Target, MessageSquare,
  Star, HelpCircle, Zap, AlertTriangle, RefreshCw,
} from 'lucide-react';

import { useAppServices } from '../../services/useAppServices.jsx';
import { useAscentJourney } from '../../hooks/useAscentJourney.js';
import ConversationModal from './ascent/ConversationModal.jsx';
import SkillModal from './ascent/SkillModal.jsx';
import PillarPath from './ascent/PillarPath.jsx';
import { CONVERSATIONS } from './ascent/conversationLibrary.js';

// ─── Icon map for conversations ───────────────────────────────────────────
const CONVO_ICON_MAP = {
  Users, Target, MessageSquare, Star, HelpCircle,
  Compass, Zap, AlertTriangle, RefreshCw,
};

// ─── Explore: Section header ──────────────────────────────────────────────
const ExploreSectionHeader = ({ icon: Icon, title, subtitle, accent }) => (
  <div className="flex items-start gap-3 mb-5">
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ background: `${accent}18`, color: accent }}
    >
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <h3 className="font-extrabold text-corporate-navy dark:text-white text-base leading-tight">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ─── Explore: Quick Practice ──────────────────────────────────────────────
const QUICK_PRACTICE_PROMPTS = [
  {
    id: 'qp-1on1',
    label: 'Prepare a 1:1',
    description: 'Practice the three questions that make 1:1s actually work',
    accent: '#6366F1',
    gradient: 'from-indigo-500/10 to-violet-500/5',
    border: 'border-indigo-200 dark:border-indigo-800',
    skillTitle: 'The 1:1 Conversation',
    skillTagline: 'The container that holds everything else.',
  },
  {
    id: 'qp-feedback',
    label: 'Give hard feedback',
    description: 'Work through SBI — say the thing with clarity and care',
    accent: '#47A88D',
    gradient: 'from-teal-500/10 to-emerald-500/5',
    border: 'border-teal-200 dark:border-teal-800',
    skillTitle: 'The Feedback Conversation',
    skillTagline: 'Say the thing — kindly, specifically, now.',
  },
  {
    id: 'qp-recognition',
    label: 'Land recognition',
    description: 'Turn "great job" into specific praise that actually sticks',
    accent: '#10B981',
    gradient: 'from-emerald-500/10 to-green-500/5',
    border: 'border-emerald-200 dark:border-emerald-800',
    skillTitle: 'The Recognition Conversation',
    skillTagline: 'Specific praise lands. Generic praise disappears.',
  },
  {
    id: 'qp-coaching',
    label: "Coach, don't tell",
    description: 'Practice asking the question instead of giving the answer',
    accent: '#E04E1B',
    gradient: 'from-orange-500/10 to-red-400/5',
    border: 'border-orange-200 dark:border-orange-800',
    skillTitle: 'The Coaching Conversation',
    skillTagline: "Ask, don't tell.",
  },
  {
    id: 'qp-expectation',
    label: 'Set clear expectations',
    description: 'Write clarity into a handoff before the work starts',
    accent: '#002E47',
    gradient: 'from-slate-500/8 to-blue-400/5',
    border: 'border-slate-200 dark:border-slate-700',
    skillTitle: 'The Expectation Conversation',
    skillTagline: 'Set (or reset) what good looks like.',
  },
  {
    id: 'qp-decision',
    label: 'Navigate a decision',
    description: 'One-way door or two-way door? Decide, communicate, move',
    accent: '#349881',
    gradient: 'from-teal-500/8 to-cyan-500/5',
    border: 'border-teal-200 dark:border-teal-800',
    skillTitle: 'The Decision Conversation',
    skillTagline: 'Decide, communicate, move.',
  },
];

const ExploreQuickPractice = ({ navigate }) => (
  <div>
    <ExploreSectionHeader
      icon={Sparkles}
      title="Practice Right Now"
      subtitle="Pick a scenario — Rep coaches you through it in under 5 minutes"
      accent="#47A88D"
    />
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {QUICK_PRACTICE_PROMPTS.map((p) => (
        <motion.button
          key={p.id}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate?.('rep-coach', {
            mode: 'practice',
            skillTitle: p.skillTitle,
            skillTagline: p.skillTagline,
          })}
          className={`bg-gradient-to-br ${p.gradient} border-2 ${p.border} rounded-2xl p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 group`}
        >
          <div
            className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full mb-2.5"
            style={{ background: `${p.accent}18`, color: p.accent }}
          >
            <Sparkles className="w-2.5 h-2.5" /> Rep
          </div>
          <div className="font-extrabold text-corporate-navy dark:text-white text-sm leading-tight">
            {p.label}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug">
            {p.description}
          </div>
          <div
            className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: p.accent }}
          >
            Start <ArrowRight className="w-3 h-3" />
          </div>
        </motion.button>
      ))}
    </div>
  </div>
);

// ─── Explore: Conversation Library ───────────────────────────────────────
const ConvoCard = ({ convo, jState, onClick }) => {
  const isDone = jState === 'done';
  const isActive = jState === 'active';
  const Icon = CONVO_ICON_MAP[convo.icon] || MessageSquare;

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group relative flex flex-col text-left rounded-2xl border-2 bg-white dark:bg-slate-800 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
      style={{ borderColor: isDone ? '#6EE7B7' : isActive ? convo.accent : '#E2E8F0' }}
    >
      {/* Accent wash */}
      <div
        className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.06] -translate-y-6 translate-x-6 pointer-events-none"
        style={{ background: convo.accent }}
      />
      {/* Icon + badge row */}
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: isDone ? '#D1FAE5' : `${convo.accent}18`, color: isDone ? '#059669' : convo.accent }}
        >
          {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        </div>
        <span
          className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={
            isDone
              ? { background: '#D1FAE5', color: '#065F46' }
              : isActive
                ? { background: `${convo.accent}18`, color: convo.accent }
                : { background: '#F1F5F9', color: '#94A3B8' }
          }
        >
          {isDone ? 'Done · Review' : isActive ? 'In Progress' : 'To Do'}
        </span>
      </div>
      <div className="font-extrabold text-corporate-navy dark:text-white text-sm leading-tight">
        {convo.title.replace('The ', '')}
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
        {convo.tagline}
      </div>
      <div
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold"
        style={{ color: convo.accent }}
      >
        {isDone ? 'Review' : isActive ? 'Continue' : 'Open'} <ArrowRight className="w-3 h-3" />
      </div>
    </motion.button>
  );
};

const ExploreConversationLibrary = ({ getJourney, onOpenConvo }) => (
  <div>
    <ExploreSectionHeader
      icon={BookOpen}
      title="The Conversation Library"
      subtitle="Nine conversations that define how you lead — tap any to dive in or review"
      accent="#002E47"
    />
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {CONVERSATIONS.map((c) => {
        const j = getJourney?.(c.id);
        const done = ['learn', 'prep', 'practice', 'reflect'].filter((k) => j?.steps?.[k]?.done).length;
        const jState = done === 4 ? 'done' : done > 0 ? 'active' : 'todo';
        return (
          <ConvoCard
            key={c.id}
            convo={c}
            jState={jState}
            onClick={() => onOpenConvo?.(c)}
          />
        );
      })}
    </div>
  </div>
);

// ─── Explore: Community ───────────────────────────────────────────────────
const LIVE_PRACTICE_OPTIONS = [
  {
    label: 'Practice / Reps',
    sub: 'Bring a real scenario. Get live coaching. Leave with a plan.',
    icon: Activity,
    accent: '#47A88D',
    screen: 'coaching-hub',
    tag: 'Most popular',
  },
  {
    label: 'Leader Circles',
    sub: 'Peer mastermind — hear how other leaders navigate your same problems.',
    icon: Users,
    accent: '#6366F1',
    screen: 'community-hub',
    tag: null,
  },
  {
    label: 'Coaching Clinics',
    sub: 'Facilitator-led deep-dive on a single skill. Ryan owns the agenda.',
    icon: Sparkles,
    accent: '#E04E1B',
    screen: 'coaching-hub',
    tag: 'With Ryan',
  },
];

const ExploreCommunity = ({ navigate }) => (
  <div>
    <ExploreSectionHeader
      icon={Users}
      title="Live Practice"
      subtitle="Solo reps build vocabulary. Live reps build skill."
      accent="#47A88D"
    />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {LIVE_PRACTICE_OPTIONS.map((item) => {
        const Icon = item.icon;
        return (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate?.(item.screen)}
            className="flex flex-col text-left rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${item.accent}18`, color: item.accent }}
              >
                <Icon className="w-5 h-5" />
              </div>
              {item.tag && (
                <span
                  className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ background: `${item.accent}18`, color: item.accent }}
                >
                  {item.tag}
                </span>
              )}
            </div>
            <div className="font-extrabold text-corporate-navy dark:text-white text-sm">{item.label}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{item.sub}</div>
            <div
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold"
              style={{ color: item.accent }}
            >
              View schedule <ArrowRight className="w-3 h-3" />
            </div>
          </motion.button>
        );
      })}
    </div>
  </div>
);

// ─── Explore: Lead Self ───────────────────────────────────────────────────
const LEAD_SELF_PREVIEWS = [
  { id: 'ls-energy',     title: 'Managing Your Energy',     tagline: 'Leaders who run on fumes lead on fumes.',                      accent: '#6366F1' },
  { id: 'ls-identity',   title: 'Leadership Identity',      tagline: 'Who you are as a leader — not just what you do.',               accent: '#8B5CF6' },
  { id: 'ls-presence',   title: 'Executive Presence',       tagline: 'The room reads you before you speak.',                         accent: '#A78BFA' },
  { id: 'ls-resilience', title: 'Resilience Under Pressure', tagline: 'How you respond when things break defines your ceiling.',       accent: '#7C3AED' },
];

const ExploreLeadSelf = ({ db, userId, userEmail }) => {
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!db || !userId) return undefined;
    (async () => {
      try {
        const ref = doc(db, 'waitlists', 'lead-self', 'signups', userId);
        const snap = await getDoc(ref);
        if (!cancelled && snap.exists()) setJoined(true);
      } catch (e) {
        console.warn('[ExploreLeadSelf] check failed:', e?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [db, userId]);

  const join = async () => {
    if (!db || !userId || busy || joined) return;
    setBusy(true);
    try {
      const ref = doc(db, 'waitlists', 'lead-self', 'signups', userId);
      await setDoc(ref, {
        userId, email: userEmail || null,
        source: 'explore-tab', signedUpAt: serverTimestamp(),
      }, { merge: true });
      setJoined(true);
    } catch (e) {
      console.warn('[ExploreLeadSelf] join failed:', e?.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50/60 to-violet-50/30 dark:from-indigo-900/10 dark:to-violet-900/10 p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 -translate-y-16 translate-x-16 bg-indigo-400 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300 mb-2">
            <Lock className="w-2.5 h-2.5" /> Coming Q3 2026
          </div>
          <h3 className="font-extrabold text-corporate-navy dark:text-white text-base">Lead Self — The Third Pillar</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-lg">
            Energy. Identity. Presence. The work of leading yourself so the team has someone worth following.
          </p>
        </div>
        <button
          onClick={join}
          disabled={joined || busy || !userId}
          className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            joined
              ? 'bg-emerald-100 text-emerald-700 cursor-default dark:bg-emerald-900/30 dark:text-emerald-300'
              : busy
                ? 'bg-indigo-400 text-white cursor-wait'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
          }`}
        >
          {joined
            ? <><CheckCircle2 className="w-4 h-4" /> You're on the list</>
            : <><Bell className="w-4 h-4" /> {busy ? 'Adding…' : 'Notify me'}</>}
        </button>
      </div>
      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
        {LEAD_SELF_PREVIEWS.map((skill) => (
          <div
            key={skill.id}
            className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-white/70 dark:bg-slate-800/40 p-3.5 overflow-hidden relative"
          >
            <div
              className="absolute top-0 right-0 w-12 h-12 rounded-full opacity-20 -translate-y-4 translate-x-4 pointer-events-none"
              style={{ background: skill.accent }}
            />
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
              style={{ background: `${skill.accent}18`, color: skill.accent }}
            >
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-corporate-navy dark:text-white text-xs leading-tight">
              {skill.title}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
              {skill.tagline}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Main screen ----------

const AscentArena = () => {
  const { user, db, navigate } = useAppServices();
  const journey = useAscentJourney();

  const [openConvo, setOpenConvo] = useState(null);
  const [openSkill, setOpenSkill] = useState(null);
  const [activeTab, setActiveTab] = useState('journey');

  const userId = user?.uid || user?.userId || null;

  const firstName = (user?.displayName || user?.firstName || 'Leader').split(' ')[0];
  const quarterLabel = useMemo(() => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `Q${q} ${now.getFullYear()}`;
  }, []);

  const handlePickFocus = (conversationId) => {
    journey.actions.setFocus(conversationId);
  };

  // Open a conversation modal — if it's already done, open as review without changing focus
  const handleOpenConvo = (convo) => {
    const j = journey.actions.getJourney(convo.id);
    const doneCount = ['learn', 'prep', 'practice', 'reflect'].filter((k) => j?.steps?.[k]?.done).length;
    const isDone = doneCount === 4;
    if (!isDone) handlePickFocus(convo.id);
    setOpenConvo(convo);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 24 }}
        className="relative rounded-3xl bg-gradient-to-br from-corporate-navy via-corporate-navy to-corporate-teal text-white p-6 sm:p-8 shadow-elevated overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-corporate-teal blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-indigo-500 blur-3xl" />
        </div>
        <div className="relative flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
            <Mountain className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs uppercase tracking-wider opacity-80">{quarterLabel} · Ascent</div>
              <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-corporate-teal/30 text-white border border-corporate-teal/40">
                Lead Team
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold mt-1 leading-tight">
              Welcome back, {firstName}.
            </h1>
            <p className="text-sm sm:text-base opacity-90 mt-2 max-w-2xl">
              Three pillars. Your path through all of them. Lead Work builds the foundation. Lead Team builds the conversations. Lead Self builds the leader.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Your Path — only visible in My Journey tab */}
      {activeTab === 'journey' && (
        <PillarPath
          focusId={journey.focusId}
          getJourney={journey.actions.getJourney}
          onPickConversation={handlePickFocus}
          onOpenConvo={handleOpenConvo}
          onOpenSkill={(skill) => setOpenSkill(skill)}
        />
      )}

      {/* Tab toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('journey')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'journey'
                ? 'bg-white dark:bg-slate-700 text-corporate-navy dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-corporate-navy'
            }`}
          >
            <MapIcon className="w-4 h-4" /> My Journey
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'explore'
                ? 'bg-white dark:bg-slate-700 text-corporate-navy dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-corporate-navy'
            }`}
          >
            <Telescope className="w-4 h-4" /> Explore
          </button>
        </div>
      </div>

      {/* ── EXPLORE TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'explore' && (
        <div className="space-y-10 pb-4">
          <ExploreQuickPractice navigate={navigate} />
          <ExploreConversationLibrary
            getJourney={journey.actions.getJourney}
            onOpenConvo={handleOpenConvo}
          />
          <ExploreCommunity navigate={navigate} />
          <ExploreLeadSelf
            db={db}
            userId={userId}
            userEmail={user?.email || null}
          />
        </div>
      )}

      {/* Conversation drill-down — content + 4-step journey progress in one card */}
      {openConvo && (
        <ConversationModal
          conversation={openConvo}
          journey={journey.actions.getJourney(openConvo.id)}
          onToggleStep={(stepKey) => journey.actions.toggleStep(openConvo.id, stepKey)}
          onStepCta={(stepKey) => {
            if (stepKey === 'practice') {
              setOpenConvo(null);
              navigate?.('coaching-hub');
            } else if (stepKey === 'reflect') {
              setOpenConvo(null);
              navigate?.('rep-coach', { mode: 'practice', skillTitle: openConvo.title, skillTagline: openConvo.tagline });
            }
          }}
          onPickNext={() => setOpenConvo(null)}
          onClose={() => setOpenConvo(null)}
          navigate={navigate}
        />
      )}

      {/* Skill drill-down (Lead Work / Lead Self skills) */}
      {openSkill && (
        <SkillModal
          skill={openSkill}
          onClose={() => setOpenSkill(null)}
          navigate={navigate}
        />
      )}
    </div>
  );
};

export default AscentArena;
