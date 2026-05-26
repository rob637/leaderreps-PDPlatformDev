// src/components/admin/lab/BadBossBingoAdmin.jsx
// LeaderReps Lab — Bad Boss Bingo admin
//
// Manages the pool of bingo squares used by the public Bad Boss Bingo page.
// Provides CRUD for squares, a live preview of a randomly-generated card,
// and a lightweight analytics view of anonymous play activity.
//
// Firestore:
//   - bingo_squares/{squareId} — square pool (public read, admin write)
//   - bingo_plays/{playId}     — anonymous play records (server-written)
//   - bingo_config/active      — themes + card layout (admin write)

import React, { useEffect, useMemo, useState } from 'react';
import {
  Grid3x3, Plus, Trash2, Edit3, Save, X, ShieldAlert, RefreshCw,
  Eye, BarChart3, Sparkles, Check, AlertTriangle,
} from 'lucide-react';
import {
  collection, addDoc, doc, deleteDoc, updateDoc, setDoc, getDoc,
  query, orderBy, onSnapshot, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { BreadcrumbNav } from '../../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../../config/breadcrumbConfig.js';
import { useAppServices } from '../../../services/useAppServices';

const CATEGORIES = [
  'Micromanagement',
  'Communication',
  'Recognition',
  'Meetings',
  'Feedback',
  'Trust',
  'Workload',
  'Politics',
];

const SEED_SQUARES = [
  { text: 'Took credit for your idea in front of leadership', category: 'Recognition', severity: 3 },
  { text: 'Reschedules your 1:1 three weeks in a row', category: 'Communication', severity: 2 },
  { text: 'Replies-all with "per my last email"', category: 'Communication', severity: 1 },
  { text: 'Asks "any updates?" on something due tomorrow', category: 'Micromanagement', severity: 2 },
  { text: 'Sends a Slack at 11pm marked "no rush"', category: 'Workload', severity: 2 },
  { text: 'Says "we\'re like a family here"', category: 'Trust', severity: 2 },
  { text: 'Changes the deadline without changing the scope', category: 'Workload', severity: 3 },
  { text: 'Forwards your email to their boss without context', category: 'Trust', severity: 3 },
  { text: 'Books a meeting to discuss the next meeting', category: 'Meetings', severity: 1 },
  { text: 'Gives feedback in a public Slack channel', category: 'Feedback', severity: 3 },
  { text: 'Says "let\'s circle back" and never does', category: 'Communication', severity: 1 },
  { text: 'CCs your skip-level on a small mistake', category: 'Politics', severity: 3 },
  { text: 'Asks for a "quick favor" that takes 4 hours', category: 'Workload', severity: 2 },
  { text: 'Praises another team\'s work to motivate yours', category: 'Recognition', severity: 2 },
  { text: 'Reads emails on phone during your 1:1', category: 'Trust', severity: 2 },
  { text: 'Calls a meeting that could have been an email', category: 'Meetings', severity: 1 },
  { text: 'Asks "thoughts?" then ignores your answer', category: 'Feedback', severity: 2 },
  { text: 'Reorgs the team via Slack announcement', category: 'Communication', severity: 3 },
  { text: 'Pings on vacation about "something quick"', category: 'Workload', severity: 3 },
  { text: 'Says "great work!" without saying what was great', category: 'Recognition', severity: 1 },
  { text: 'Avoids the hard conversation for 6 months', category: 'Feedback', severity: 3 },
  { text: 'Adds you to a meeting 5 minutes before it starts', category: 'Meetings', severity: 1 },
  { text: 'Says "I\'m an open door" but is never available', category: 'Trust', severity: 2 },
  { text: 'Tells you the priority changed (again)', category: 'Communication', severity: 2 },
  { text: 'Asks for a status update on Slack DM hourly', category: 'Micromanagement', severity: 3 },
  { text: 'Shoots down ideas in front of the whole team', category: 'Feedback', severity: 3 },
  { text: 'Schedules a 5pm Friday "quick sync"', category: 'Meetings', severity: 2 },
  { text: 'Asks you to "be more strategic" with no specifics', category: 'Feedback', severity: 2 },
  { text: 'Tells you decision is made — asks for your input', category: 'Trust', severity: 2 },
  { text: 'Promotes the loudest person on the team', category: 'Recognition', severity: 3 },
  { text: 'Cancels your PTO the day before', category: 'Workload', severity: 3 },
  { text: 'Says "we\'ll talk about it in your review"', category: 'Feedback', severity: 2 },
  { text: 'Brings up your mistake from 2 years ago', category: 'Trust', severity: 3 },
  { text: 'Asks you to fix something they broke', category: 'Politics', severity: 2 },
  { text: 'Sends a calendar invite with no agenda', category: 'Meetings', severity: 1 },
  { text: 'Says "do more with less" with a straight face', category: 'Workload', severity: 2 },
  { text: 'Pretends to remember your name', category: 'Recognition', severity: 2 },
  { text: 'Asks the same question in every standup', category: 'Micromanagement', severity: 1 },
  { text: 'Tells you their problem is now your problem', category: 'Trust', severity: 2 },
  { text: 'Says "this should only take an hour" (it won\'t)', category: 'Workload', severity: 1 },
  { text: 'Decides via "consensus" but overrules anyway', category: 'Trust', severity: 3 },
  { text: 'Schedules a meeting during your lunch every week', category: 'Meetings', severity: 1 },
  { text: 'Says "let\'s take this offline" to shut you down', category: 'Communication', severity: 2 },
  { text: 'Asks "have you tried turning it off and on?"', category: 'Communication', severity: 1 },
  { text: 'Forwards a customer complaint with no context', category: 'Communication', severity: 2 },
  { text: 'Brings donuts on the day they announce layoffs', category: 'Trust', severity: 3 },
  { text: 'Says "I need this yesterday"', category: 'Workload', severity: 2 },
  { text: 'Requires you to be online but they\'re never on', category: 'Trust', severity: 3 },
  { text: 'Asks you to "wear many hats" (do 3 jobs)', category: 'Workload', severity: 3 },
  { text: 'Says "we\'re a flat organization" then pulls rank', category: 'Politics', severity: 3 },
];

const SEVERITY_COLORS = {
  1: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  2: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  3: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
};

const TabButton = ({ active, onClick, icon: Icon, children, count }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
      active
        ? 'bg-corporate-teal text-white'
        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
    }`}
  >
    <Icon className="w-4 h-4" />
    {children}
    {typeof count === 'number' && (
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'}`}>
        {count}
      </span>
    )}
  </button>
);

const SquareForm = ({ initial, onSave, onCancel }) => {
  const [text, setText] = useState(initial?.text || '');
  const [category, setCategory] = useState(initial?.category || CATEGORIES[0]);
  const [severity, setSeverity] = useState(initial?.severity || 2);
  const [active, setActive] = useState(initial?.active !== false);

  const canSave = text.trim().length > 0;

  return (
    <div className="bg-white dark:bg-slate-800 border border-corporate-teal rounded-xl p-4 space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Takes credit for your idea in a leadership meeting"
        rows={2}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
        maxLength={140}
      />
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mt-1 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full mt-1 px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
          >
            <option value={1}>1 — Mild</option>
            <option value={2}>2 — Moderate</option>
            <option value={3}>3 — Severe</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</label>
          <button
            type="button"
            onClick={() => setActive((v) => !v)}
            className={`w-full mt-1 px-2 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            }`}
          >
            {active ? 'Active' : 'Inactive'}
          </button>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ text: text.trim(), category, severity, active })}
          disabled={!canSave}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-corporate-teal hover:bg-corporate-teal/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </div>
  );
};

const BadBossBingoAdmin = () => {
  const { db, user, isAdmin, navigate } = useAppServices();
  const [activeTab, setActiveTab] = useState('squares');
  const [squares, setSquares] = useState([]);
  const [plays, setPlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [previewSeed, setPreviewSeed] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!db || !isAdmin) return;
    const qSquares = query(collection(db, 'bingo_squares'), orderBy('createdAt', 'desc'));
    const unsubSquares = onSnapshot(qSquares, (snap) => {
      setSquares(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));

    const qPlays = query(collection(db, 'bingo_plays'), orderBy('createdAt', 'desc'));
    const unsubPlays = onSnapshot(qPlays, (snap) => {
      setPlays(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {});

    return () => { unsubSquares(); unsubPlays(); };
  }, [db, isAdmin]);

  const visibleSquares = useMemo(() => {
    return squares.filter((s) => {
      if (filterCategory !== 'all' && s.category !== filterCategory) return false;
      if (showOnlyActive && s.active === false) return false;
      return true;
    });
  }, [squares, filterCategory, showOnlyActive]);

  const activeSquares = useMemo(() => squares.filter((s) => s.active !== false), [squares]);

  const previewCard = useMemo(() => {
    if (activeSquares.length === 0) return [];
    const pool = [...activeSquares];
    // Deterministic-ish shuffle keyed by previewSeed
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(((Math.sin(previewSeed + i) + 1) / 2) * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 25);
  }, [activeSquares, previewSeed]);

  const handleCreate = async (data) => {
    setBusy(true);
    try {
      await addDoc(collection(db, 'bingo_squares'), {
        ...data,
        createdAt: serverTimestamp(),
        createdBy: user?.email || null,
      });
      setCreating(false);
    } finally { setBusy(false); }
  };

  const handleUpdate = async (id, data) => {
    setBusy(true);
    try {
      await updateDoc(doc(db, 'bingo_squares', id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
      setEditingId(null);
    } finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this square? This cannot be undone.')) return;
    await deleteDoc(doc(db, 'bingo_squares', id));
  };

  const handleToggleActive = async (sq) => {
    await updateDoc(doc(db, 'bingo_squares', sq.id), {
      active: sq.active === false,
      updatedAt: serverTimestamp(),
    });
  };

  const handleSeed = async () => {
    if (squares.length > 0) {
      if (!window.confirm(`There are already ${squares.length} squares. Add ${SEED_SQUARES.length} starter squares anyway?`)) return;
    }
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      SEED_SQUARES.forEach((sq) => {
        const ref = doc(collection(db, 'bingo_squares'));
        batch.set(ref, {
          ...sq,
          active: true,
          createdAt: serverTimestamp(),
          createdBy: user?.email || null,
          seeded: true,
        });
      });
      await batch.commit();
    } finally { setSeeding(false); }
  };

  // Analytics aggregates
  const stats = useMemo(() => {
    const totalPlays = plays.length;
    const completed = plays.filter((p) => p.bingo === true || (p.markedCount || 0) >= 5).length;
    const avgMarked = totalPlays === 0 ? 0 : (plays.reduce((s, p) => s + (p.markedCount || 0), 0) / totalPlays);
    const emailCaptured = plays.filter((p) => p.email).length;
    const squareHeat = {};
    plays.forEach((p) => {
      (p.markedSquareIds || []).forEach((id) => {
        squareHeat[id] = (squareHeat[id] || 0) + 1;
      });
    });
    const topSquares = Object.entries(squareHeat)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id, count]) => ({
        id,
        count,
        text: squares.find((s) => s.id === id)?.text || '(deleted square)',
      }));
    return { totalPlays, completed, avgMarked, emailCaptured, topSquares };
  }, [plays, squares]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav items={getBreadcrumbs('lab-bad-boss-bingo')} navigate={navigate} />
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
              <Grid3x3 className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">Bad Boss Bingo</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Shareable bingo card of bad-management patterns. Gentle CTA back to LeaderReps.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 text-right">
            <div>{activeSquares.length} active squares</div>
            <div>{stats.totalPlays} plays · {stats.emailCaptured} emails</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <TabButton active={activeTab === 'squares'} onClick={() => setActiveTab('squares')} icon={Grid3x3} count={squares.length}>
            Square Library
          </TabButton>
          <TabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')} icon={Eye}>
            Card Preview
          </TabButton>
          <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={BarChart3} count={stats.totalPlays}>
            Analytics
          </TabButton>
        </div>

        {activeTab === 'squares' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input type="checkbox" checked={showOnlyActive} onChange={(e) => setShowOnlyActive(e.target.checked)} />
                Active only
              </label>
              <div className="flex-1" />
              {squares.length === 0 && (
                <button
                  onClick={handleSeed}
                  disabled={seeding}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-navy text-white text-sm font-semibold hover:bg-corporate-navy/90 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {seeding ? 'Seeding…' : `Seed ${SEED_SQUARES.length} starter squares`}
                </button>
              )}
              <button
                onClick={() => { setCreating(true); setEditingId(null); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90"
              >
                <Plus className="w-4 h-4" />
                New Square
              </button>
            </div>

            {creating && (
              <SquareForm onSave={handleCreate} onCancel={() => setCreating(false)} />
            )}

            {loading ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : visibleSquares.length === 0 ? (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <Grid3x3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No squares yet. Click "Seed starter squares" or "New Square" to begin.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibleSquares.map((sq) => (
                  <div
                    key={sq.id}
                    className={`bg-white dark:bg-slate-800 border rounded-xl p-4 ${sq.active === false ? 'border-slate-200 dark:border-slate-700 opacity-60' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    {editingId === sq.id ? (
                      <SquareForm
                        initial={sq}
                        onSave={(data) => handleUpdate(sq.id, data)}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-900 dark:text-white font-medium leading-snug">{sq.text}</p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {sq.category}
                            </span>
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${SEVERITY_COLORS[sq.severity || 2]}`}>
                              Sev {sq.severity || 2}
                            </span>
                            <button
                              onClick={() => handleToggleActive(sq)}
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${sq.active === false ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}
                            >
                              {sq.active === false ? 'Inactive' : 'Active'}
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setEditingId(sq.id); setCreating(false); }}
                              className="p-1.5 text-slate-400 hover:text-corporate-teal hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(sq.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-corporate-navy dark:text-white">5×5 Card Preview</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Live sample using {activeSquares.length} active squares.
                </p>
              </div>
              <button
                onClick={() => setPreviewSeed((s) => s + 1)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
                Reshuffle
              </button>
            </div>

            {previewCard.length < 25 ? (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  Need at least <strong>25 active squares</strong> to render a full 5×5 card.
                  Currently have <strong>{activeSquares.length}</strong>.
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-black text-corporate-navy dark:text-white">Bad Boss Bingo</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mark every square you've experienced this quarter.</p>
                </div>
                <div className="grid grid-cols-5 gap-2 aspect-square max-w-2xl mx-auto">
                  {previewCard.map((sq, i) => (
                    <div
                      key={sq.id}
                      className={`flex items-center justify-center text-center p-1 rounded text-[9px] leading-tight font-medium border ${
                        i === 12
                          ? 'bg-corporate-teal text-white border-corporate-teal'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {i === 12 ? 'FREE\nSPACE' : sq.text}
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-slate-400 mt-4">
                  Public page renders this with click-to-mark + share-to-LinkedIn.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Plays</p>
                <p className="text-2xl font-bold text-corporate-navy dark:text-white mt-1">{stats.totalPlays}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Got Bingo</p>
                <p className="text-2xl font-bold text-corporate-navy dark:text-white mt-1">{stats.completed}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Squares Marked</p>
                <p className="text-2xl font-bold text-corporate-navy dark:text-white mt-1">{stats.avgMarked.toFixed(1)}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Emails Captured</p>
                <p className="text-2xl font-bold text-corporate-navy dark:text-white mt-1">{stats.emailCaptured}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <h3 className="text-sm font-bold text-corporate-navy dark:text-white mb-3">Most-Marked Squares</h3>
              {stats.topSquares.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No plays yet.</p>
              ) : (
                <ol className="space-y-2">
                  {stats.topSquares.map((s, i) => (
                    <li key={s.id} className="flex items-center gap-3 text-sm">
                      <span className="w-6 text-right font-bold text-slate-400">{i + 1}.</span>
                      <span className="flex-1 text-slate-700 dark:text-slate-200">{s.text}</span>
                      <span className="font-semibold text-corporate-teal">{s.count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span>
                <strong className="text-corporate-teal">Live:</strong> public play page is deployed. Plays are recorded to <code>bingo_plays</code>.
              </span>
              <a
                href="/?bingo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-corporate-teal text-white text-xs font-semibold hover:bg-corporate-teal/90 transition-colors"
              >
                View public page →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BadBossBingoAdmin;
