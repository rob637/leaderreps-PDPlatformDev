// src/components/admin/Ascent2Center.jsx
// Ascent 2 - Admin-only hub. Simple horizontal tabs, no inner sidebar.

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mountain, ArrowLeft, ShieldAlert, Loader,
  Users, Stethoscope, UserCheck, Dumbbell,
  BookOpen, PlayCircle, FileText, GraduationCap, Layers,
  Zap, MessageSquare, CheckCircle2, BellOff, Bell, Sparkles, Phone,
  RefreshCw, ChevronRight,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { useNavigation } from '../../providers/NavigationProvider';
import Conditioning from '../screens/Conditioning';
import useLeaderProfile from '../../hooks/useLeaderProfile';
import { useLabEnrollment } from '../../hooks/useLabEnrollment';
import {
  collection, query, where, getDocs,
} from 'firebase/firestore';
import {
  COACHING_SESSIONS_COLLECTION,
  COMMUNITY_SESSIONS_COLLECTION,
  SESSION_STATUS,
} from '../../data/Constants';

const TEAL = '#47A88D';
const ORANGE = '#E04E1B';
const NAVY = '#002E47';

const TABS = [
  { id: 'community', label: 'Community', icon: Users },
  { id: 'content', label: 'Content', icon: BookOpen },
  { id: 'conditioning', label: 'Conditioning', icon: Zap },
  { id: 'sms', label: 'SMS Nudge', icon: MessageSquare },
];

const EVENT_TYPES = [
  { id: 'coaching_clinic', label: 'Coaching Clinic', icon: Stethoscope, accent: TEAL, nav: 'community-hub' },
  { id: 'open_gym', label: 'Open Gym', icon: Dumbbell, accent: ORANGE, nav: 'community-hub' },
  { id: 'leader_circle', label: 'Leader Circle', icon: Users, accent: '#8B5CF6', nav: 'community-hub' },
  { id: 'one_on_one', label: '1-on-1', icon: UserCheck, accent: NAVY, nav: 'community-hub' },
];

const CONTENT_PILLARS = [
  { id: 'documents', label: 'Documents', icon: FileText, color: NAVY, collection: 'content_documents', nav: 'documents-index' },
  { id: 'videos', label: 'Videos', icon: PlayCircle, color: TEAL, collection: 'content_videos', nav: 'videos-index' },
  { id: 'courses', label: 'Courses', icon: GraduationCap, color: '#8B5CF6', collection: 'content_courses', nav: 'library' },
  { id: 'readreps', label: 'Read Reps', icon: BookOpen, color: ORANGE, collection: 'content_readings', nav: 'read-reps-index' },
  { id: 'dailyreps', label: 'Daily Reps', icon: Layers, color: '#059669', collection: 'daily_reps_library', nav: 'conditioning' },
];

const NUDGE_TIERS = [
  {
    id: 'off',
    label: 'Nothing',
    icon: BellOff,
    detail: 'No text messages - you can always turn this on later.',
    color: '#94a3b8',
    includes: [],
  },
  {
    id: 'light',
    label: 'Light Touch',
    icon: Bell,
    detail: 'Session reminders and key program announcements.',
    color: TEAL,
    includes: ['Session reminders', 'Key announcements'],
  },
  {
    id: 'standard',
    label: 'Standard',
    icon: Zap,
    detail: 'Morning activation, session reminders, milestone celebrations.',
    color: ORANGE,
    includes: ['Morning activation', 'Session reminders', 'Milestone alerts'],
  },
  {
    id: 'lab',
    label: 'LeaderReps Lab',
    icon: Sparkles,
    detail: 'The full coaching loop - daily nudges, streak challenges, lab content, real-time accountability.',
    color: '#8B5CF6',
    includes: ['Daily coaching nudges', 'Streak challenges', 'Lab content', 'Accountability check-ins'],
  },
];

const fade = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } };

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <Loader className="w-6 h-6 animate-spin text-corporate-teal" />
    </div>
  );
}

function CommunityTab({ db, navigate }) {
  const [counts, setCounts] = useState({});
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [coachSnap, commSnap] = await Promise.all([
        getDocs(query(collection(db, COACHING_SESSIONS_COLLECTION), where('status', '!=', SESSION_STATUS.CANCELLED))),
        getDocs(query(collection(db, COMMUNITY_SESSIONS_COLLECTION), where('status', '!=', SESSION_STATUS.CANCELLED))),
      ]);
      const all = [
        ...coachSnap.docs.map((d) => d.data()),
        ...commSnap.docs.map((d) => d.data()),
      ];
      const c = {};
      all.forEach((s) => {
        c[s.sessionType] = (c[s.sessionType] || 0) + 1;
      });
      setCounts(c);
      setUpcoming(
        all
          .filter((s) => (s.date || '') >= todayStr)
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
          .slice(0, 3)
      );
    } catch (e) {
      console.error('[Ascent2] community load', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Spinner />;

  return (
    <motion.div {...fade} className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {EVENT_TYPES.map((et) => {
          const Icon = et.icon;
          const count = counts[et.id] || 0;
          return (
            <button
              key={et.id}
              onClick={() => navigate(et.nav)}
              className="text-left p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl" style={{ background: `${et.accent}18` }}>
                  <Icon className="w-4 h-4" style={{ color: et.accent }} />
                </div>
                <span className="text-[11px] font-bold" style={{ color: et.accent }}>{count} scheduled</span>
              </div>
              <p className="font-semibold text-sm text-slate-800 dark:text-white">{et.label}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                Manage <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </button>
          );
        })}
      </div>

      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Upcoming</p>
            <button onClick={load} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <RefreshCw className="w-3 h-3 text-slate-400" />
            </button>
          </div>
          <div className="space-y-2">
            {upcoming.map((s, i) => {
              const et = EVENT_TYPES.find((e) => e.id === s.sessionType);
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: et?.accent || TEAL }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                      {s.title || et?.label || s.sessionType}
                    </p>
                    <p className="text-xs text-slate-400">{s.date}{s.time ? ` · ${s.time}` : ''}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ContentTab({ db, navigate }) {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const results = {};
      await Promise.all(
        CONTENT_PILLARS.map(async (p) => {
          try {
            results[p.id] = (await getDocs(collection(db, p.collection))).size;
          } catch {
            results[p.id] = null;
          }
        })
      );
      setCounts(results);
    } catch (e) {
      console.error('[Ascent2] content load', e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    load();
  }, [load]);

  const total = Object.values(counts).reduce((s, v) => s + (v || 0), 0);

  return (
    <motion.div {...fade} className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-corporate-navy rounded-2xl text-white">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">Total Assets</p>
          <p className="text-3xl font-black mt-0.5">{loading ? '…' : total}</p>
        </div>
        <button
          onClick={() => navigate('library')}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
        >
          Browse Library
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {CONTENT_PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => navigate(p.nav)}
              className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all text-left group"
            >
              <div className="p-2 rounded-lg flex-shrink-0" style={{ background: `${p.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: p.color }} />
              </div>
              <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{p.label}</p>
              <span className="text-sm font-bold" style={{ color: p.color }}>
                {loading ? '–' : (counts[p.id] ?? '?')}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function ConditioningTab() {
  return <Conditioning embedded={true} />;
}

function SmsTab() {
  const { profile, loading, saving, saveProfile } = useLeaderProfile();
  const { enrolled: labEnrolled } = useLabEnrollment();
  const [phone, setPhone] = useState('');
  const [tier, setTier] = useState('off');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setPhone(profile.phoneNumber || '');
    setTier(profile.smsNudgeTier || (profile.preferSMS ? 'standard' : 'off'));
  }, [profile?.phoneNumber, profile?.smsNudgeTier, profile?.preferSMS]);

  const originalTier = profile?.smsNudgeTier || (profile?.preferSMS ? 'standard' : 'off');
  const originalPhone = profile?.phoneNumber || '';
  const isDirty = phone !== originalPhone || tier !== originalTier;

  const handleSave = async () => {
    const ok = await saveProfile({
      phoneNumber: phone,
      preferSMS: tier !== 'off',
      smsNudgeTier: tier,
      notificationSettings: { channels: { sms: tier !== 'off' } },
    });
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) return <Spinner />;

  return (
    <motion.div {...fade} className="space-y-5">
      {labEnrolled && (
        <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <Sparkles className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">LeaderReps Lab Active</p>
            <p className="text-xs text-purple-500 mt-0.5">Your SMS experience is already managed through the Lab. Changes here will sync.</p>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          <Phone className="w-3 h-3" /> Mobile Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-corporate-teal/40"
        />
        <p className="text-[11px] text-slate-400 leading-snug">
          US numbers only. Adding your number links it to your LeaderReps account.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nudge Level</p>
        {NUDGE_TIERS.map((t) => {
          const Icon = t.icon;
          const isActive = tier === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              className="w-full text-left p-4 rounded-xl border-2 transition-all"
              style={
                isActive
                  ? { borderColor: t.color, backgroundColor: `${t.color}0D` }
                  : { borderColor: '#e2e8f0', backgroundColor: 'white' }
              }
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl flex-shrink-0 mt-0.5" style={{ background: `${t.color}18` }}>
                  <Icon className="w-4 h-4" style={{ color: t.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-800 dark:text-white">{t.label}</p>
                    {t.id === 'lab' && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${t.color}22`, color: t.color }}>
                        Full Experience
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{t.detail}</p>
                  <AnimatePresence>
                    {isActive && t.includes.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-1.5 mt-2"
                      >
                        {t.includes.map((item) => (
                          <span key={item} className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${t.color}15`, color: t.color }}>
                            {item}
                          </span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center mt-0.5"
                  style={
                    isActive
                      ? { borderColor: t.color, backgroundColor: t.color }
                      : { borderColor: '#cbd5e1', backgroundColor: 'transparent' }
                  }
                >
                  {isActive && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {tier !== 'off' && !phone.trim() && (
        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
          Add your mobile number above to enable text nudges.
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !isDirty || (tier !== 'off' && !phone.trim())}
        className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold bg-corporate-navy hover:bg-[#003d5c] disabled:opacity-40 text-white rounded-xl transition-all shadow-sm"
      >
        {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : saving ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</> : <>Save Preferences</>}
      </button>
    </motion.div>
  );
}

const Ascent2Center = () => {
  const { isAdmin, isLoading, db, navigate } = useAppServices();
  const { navParams } = useNavigation();
  const [activeTab, setActiveTab] = useState(navParams?.tab || 'community');

  useEffect(() => {
    if (navParams?.tab) setActiveTab(navParams.tab);
  }, [navParams]);

  if (isLoading) return <Spinner />;

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-red-400 mb-3" />
        <h1 className="text-xl font-bold text-corporate-navy dark:text-white">Admin Only</h1>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'community':
        return <CommunityTab db={db} navigate={navigate} />;
      case 'content':
        return <ContentTab db={db} navigate={navigate} />;
      case 'conditioning':
        return <ConditioningTab />;
      case 'sms':
        return <SmsTab />;
      default:
        return <CommunityTab db={db} navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="bg-corporate-navy px-5 py-4 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => navigate('admin-hub')}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="p-2 bg-white/10 rounded-xl">
          <Mountain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold text-white leading-none">Ascent 2</h1>
          <p className="text-[11px] text-white/40 mt-0.5">Admin Only</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 flex-shrink-0">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'border-corporate-teal text-corporate-teal-ink'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-5 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Ascent2Center;
