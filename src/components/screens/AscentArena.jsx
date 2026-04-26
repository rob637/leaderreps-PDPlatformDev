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
  Sparkles, ArrowRight, Lock, CheckCircle2, Bell, Calendar, ChevronRight,
  Map as MapIcon, Telescope,
} from 'lucide-react';

import { useAppServices } from '../../services/useAppServices.jsx';
import { useAnchors } from '../../hooks/useAnchors';
import { useAscentJourney } from '../../hooks/useAscentJourney.js';
import { getConversationById } from './ascent/conversationLibrary.js';
import ConversationModal from './ascent/ConversationModal.jsx';
import SkillModal from './ascent/SkillModal.jsx';
import FocusPicker from './ascent/FocusPicker.jsx';
import JourneyCard from './ascent/JourneyCard.jsx';
import PillarPath from './ascent/PillarPath.jsx';
import JourneyResumeBar from './ascent/JourneyResumeBar.jsx';
import ExploreTab from './ascent/ExploreTab.jsx';

// ---------- Lead Work compressed (Foundation reinforcement) ----------

const LeadWorkCompressed = ({ navigate }) => {
  const { activeAnchors, currentWeekPulse, streakWeeks, loading } = useAnchors();

  const onTrack = useMemo(() => {
    if (!currentWeekPulse?.perAnchor) return 0;
    return Object.values(currentWeekPulse.perAnchor).filter((p) => p.status === 'on_track').length;
  }, [currentWeekPulse]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-5"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-corporate-navy/10 text-corporate-navy dark:text-white flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
              Lead Work · Foundation reinforcement
            </div>
            <div className="font-extrabold text-corporate-navy dark:text-white">
              Keep your reps sharp
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate?.('conditioning')}
          className="text-xs font-semibold text-corporate-teal hover:text-corporate-subtle-teal inline-flex items-center gap-1"
        >
          Open <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
          <Compass className="w-4 h-4 mx-auto text-corporate-navy dark:text-white opacity-70" />
          <div className="text-2xl font-extrabold text-corporate-navy dark:text-white mt-1">
            {loading ? '…' : `${activeAnchors.length}/3`}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Anchors</div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
          <Activity className="w-4 h-4 mx-auto text-corporate-teal" />
          <div className="text-2xl font-extrabold text-corporate-navy dark:text-white mt-1">
            {loading ? '…' : onTrack}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">On track</div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
          <Flame className="w-4 h-4 mx-auto text-corporate-orange" />
          <div className="text-2xl font-extrabold text-corporate-navy dark:text-white mt-1">
            {loading ? '…' : streakWeeks}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Wk streak</div>
        </div>
      </div>
    </motion.div>
  );
};

// ---------- Community (3 session types) ----------

const CommunityCard = ({ navigate }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.25 }}
    className="rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-5"
  >
    <div className="flex items-start gap-2 mb-3">
      <div className="w-9 h-9 rounded-lg bg-corporate-teal/15 text-corporate-teal flex items-center justify-center">
        <Users className="w-5 h-5" />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
          Lead Team · Community
        </div>
        <div className="font-extrabold text-corporate-navy dark:text-white">
          Three ways to practice live
        </div>
      </div>
    </div>
    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
      The reps you do solo build the vocabulary. The reps you do with people build the skill.
    </p>
    <div className="space-y-2">
      <button
        onClick={() => navigate?.('coaching-hub')}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-corporate-teal/60 hover:bg-corporate-teal/5 transition-all text-left"
      >
        <span className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-corporate-teal" />
          <span className="text-sm font-semibold text-corporate-navy dark:text-white">
            Practice / Reps
          </span>
          <span className="text-xs text-slate-500">— bring a real scenario</span>
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>
      <button
        onClick={() => navigate?.('community-hub')}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-corporate-teal/60 hover:bg-corporate-teal/5 transition-all text-left"
      >
        <span className="flex items-center gap-2">
          <Users className="w-4 h-4 text-corporate-teal" />
          <span className="text-sm font-semibold text-corporate-navy dark:text-white">
            Leader Circles
          </span>
          <span className="text-xs text-slate-500">— peer mastermind cohort</span>
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>
      <button
        onClick={() => navigate?.('coaching-hub')}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-corporate-orange/60 hover:bg-corporate-orange/5 transition-all text-left"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-corporate-orange" />
          <span className="text-sm font-semibold text-corporate-navy dark:text-white">
            Coaching Clinics
          </span>
          <span className="text-xs text-slate-500">— facilitator-led, trainer owns agenda</span>
        </span>
        <ChevronRight className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  </motion.div>
);

// ---------- Lead Self teaser ----------

const LeadSelfTeaser = ({ db, userId, userEmail }) => {
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);

  // Check existing signup on mount
  useEffect(() => {
    let cancelled = false;
    if (!db || !userId) return undefined;
    (async () => {
      try {
        const ref = doc(db, 'waitlists', 'lead-self', 'signups', userId);
        const snap = await getDoc(ref);
        if (!cancelled && snap.exists()) setJoined(true);
      } catch (e) {
        // non-fatal
        console.warn('[LeadSelfTeaser] check failed:', e?.message || e);
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
        userId,
        email: userEmail || null,
        source: 'ascent-arena',
        signedUpAt: serverTimestamp(),
      }, { merge: true });
      setJoined(true);
    } catch (e) {
      console.warn('[LeadSelfTeaser] join failed:', e?.message || e);
      // Optimistic — keep button enabled so they can retry
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative rounded-2xl p-5 overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800 dark:to-indigo-900/20"
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 -translate-y-12 translate-x-12 bg-indigo-400" />
      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
          <Heart className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-[11px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-300">
              Lead Self
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              <Lock className="w-2.5 h-2.5" /> Coming soon
            </span>
          </div>
          <h3 className="font-extrabold text-corporate-navy dark:text-white mt-1">
            The third pillar — coming after Lead Team
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Energy. Identity. Presence. The work of leading yourself so the team has someone worth following.
          </p>
          <button
            onClick={join}
            disabled={joined || busy || !userId}
            className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              joined
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : busy
                  ? 'bg-indigo-400 text-white cursor-wait'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {joined ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> You're on the list
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" /> {busy ? 'Adding…' : 'Notify me when it launches'}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ---------- Main screen ----------

const COHORT_IDS = ['lead-team-live', 'lead-self-live'];

const AscentArena = ({ navigate }) => {
  const { user, db } = useAppServices();
  const journey = useAscentJourney();

  const [openConvo, setOpenConvo] = useState(null);
  const [openSkill, setOpenSkill] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('journey'); // 'journey' | 'explore'
  const [cohortWaitlists, setCohortWaitlists] = useState({}); // { [cohortId]: true, busy: cohortId|null }

  const userId = user?.uid || user?.userId || null;

  const firstName = (user?.displayName || user?.firstName || 'Leader').split(' ')[0];
  const quarterLabel = useMemo(() => {
    const now = new Date();
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `Q${q} ${now.getFullYear()}`;
  }, []);

  // Open the picker on first visit (after hydration, no focus set)
  useEffect(() => {
    if (journey.hydrated && !journey.focusId) {
      setShowPicker(true);
    }
  }, [journey.hydrated, journey.focusId]);

  // Hydrate existing cohort waitlist signups
  useEffect(() => {
    let cancelled = false;
    if (!db || !userId) return undefined;
    (async () => {
      const next = {};
      for (const cohortId of COHORT_IDS) {
        try {
          const ref = doc(db, 'waitlists', cohortId, 'signups', userId);
          const snap = await getDoc(ref);
          if (snap.exists()) next[cohortId] = true;
        } catch (e) {
          console.warn('[AscentArena] cohort check failed:', cohortId, e?.message || e);
        }
      }
      if (!cancelled) setCohortWaitlists((prev) => ({ ...prev, ...next }));
    })();
    return () => { cancelled = true; };
  }, [db, userId]);

  const focusConvo = journey.focusId ? getConversationById(journey.focusId) : null;

  const handlePickFocus = async (conversationId) => {
    await journey.actions.setFocus(conversationId);
    setShowPicker(false);
    setActiveTab('journey');
  };

  const handleStepCta = (stepKey) => {
    if (!focusConvo) return;
    if (stepKey === 'learn') {
      setOpenConvo(focusConvo); // opens modal with the script
    } else if (stepKey === 'prep') {
      setOpenConvo(focusConvo);
    } else if (stepKey === 'practice') {
      navigate?.('coaching-hub');
    } else if (stepKey === 'reflect') {
      navigate?.('rep-coach');
    }
  };

  const handleToggleStep = (stepKey) => {
    if (!journey.focusId) return;
    journey.actions.toggleStep(journey.focusId, stepKey);
  };

  const handleJoinCohort = async (cohortId) => {
    if (!db || !userId || cohortWaitlists[cohortId]) return;
    setCohortWaitlists((prev) => ({ ...prev, busy: cohortId }));
    try {
      const ref = doc(db, 'waitlists', cohortId, 'signups', userId);
      await setDoc(ref, {
        userId,
        email: user?.email || null,
        cohortId,
        source: 'ascent-arena-explore',
        signedUpAt: serverTimestamp(),
      }, { merge: true });
      setCohortWaitlists((prev) => ({ ...prev, [cohortId]: true, busy: null }));
    } catch (e) {
      console.warn('[AscentArena] cohort join failed:', cohortId, e?.message || e);
      setCohortWaitlists((prev) => ({ ...prev, busy: null }));
    }
  };

  const handleAddFoundationToLearn = () => {
    if (!journey.focusId || !journey.focusJourney) return;
    if (!journey.focusJourney.steps?.learn) {
      journey.actions.toggleStep(journey.focusId, 'learn');
    }
  };

  const handleResumeJourney = () => {
    setActiveTab('journey');
    // Smooth scroll to top so the JourneyCard is visible
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isLearnDone = !!journey.focusJourney?.steps?.learn;

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

      {/* Your Path — three-pillar selector + workstream */}
      <PillarPath
        focusId={journey.focusId}
        getJourney={journey.actions.getJourney}
        onPickConversation={handlePickFocus}
        onOpenConvo={(convo) => setOpenConvo(convo)}
        onOpenSkill={(skill) => setOpenSkill(skill)}
      />

      {/* Tab toggle — step in/out of the journey */}
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

      {activeTab === 'journey' ? (
        <>
          {/* Your Next Step — the heart of the journey */}
          {focusConvo ? (
            <JourneyCard
              conversation={focusConvo}
              journey={journey.focusJourney}
              nextStepKey={journey.nextStepKey}
              onStepCta={handleStepCta}
              onToggleStep={handleToggleStep}
              onChangeFocus={() => setShowPicker(true)}
              onPickNext={() => setShowPicker(true)}
            />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-corporate-teal/40 bg-corporate-teal/5 p-6 text-center">
              <Sparkles className="w-8 h-8 mx-auto text-corporate-teal" />
              <h3 className="font-extrabold text-corporate-navy dark:text-white mt-2">
                Pick your first focus
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                Ascent is built around one conversation at a time. Choose where to start.
              </p>
              <button
                onClick={() => setShowPicker(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm text-white bg-corporate-teal hover:bg-corporate-teal/90"
              >
                Pick a conversation <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Lead Work + Community side-by-side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div id="lead-work-card">
              <LeadWorkCompressed navigate={navigate} />
            </div>
            <CommunityCard navigate={navigate} />
          </div>

          {/* Lead Self teaser */}
          <div id="lead-self-card">
            <LeadSelfTeaser
              db={db}
              userId={userId}
              userEmail={user?.email || null}
            />
          </div>
        </>
      ) : (
        <>
          {/* Sticky resume bar so the journey is always one tap away */}
          {focusConvo && (
            <JourneyResumeBar
              focusId={journey.focusId}
              nextStepKey={journey.nextStepKey}
              onResume={handleResumeJourney}
            />
          )}

          <ExploreTab
            focusId={journey.focusId}
            navigate={navigate}
            onOpenConvo={setOpenConvo}
            onMakeFocus={handlePickFocus}
            onAddFoundationToLearn={handleAddFoundationToLearn}
            isLearnDone={isLearnDone}
            cohortWaitlists={cohortWaitlists}
            onJoinCohort={handleJoinCohort}
          />
        </>
      )}

      {/* First-run / change-focus picker */}
      <FocusPicker
        open={showPicker}
        firstName={firstName}
        onPick={handlePickFocus}
      />

      {/* Conversation drill-down (Lead Team conversations) */}
      {openConvo && (
        <ConversationModal
          conversation={openConvo}
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
