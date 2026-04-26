// src/components/admin/AccountabilityInsights.jsx
// Trainer-facing dashboard for Accountability Assessment data.
//
// Reads from the `accountability-leads` Firestore collection (one doc per
// submitter). Stats are computed live in the browser so that marking a
// submission as a test entry immediately updates all percentages, with no
// Cloud Function or recalculation script required.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  Users,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  Loader,
  ExternalLink,
} from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';

// Question ordering that matches the assessment — used to display columns
// in the same order the assessment presents them.
const QUESTION_IDS = [
  { id: 'clear-expectations',           label: 'Clear Expectations' },
  { id: 'clean-handoff',                label: 'Clean Handoff' },
  { id: 'avoiding-rescue',              label: 'Avoiding Rescue' },
  { id: 'follow-up',                    label: 'Follow-Up' },
  { id: 'timely-redirecting-feedback',  label: 'Timely Feedback' },
  { id: 'reinforcing-feedback',         label: 'Reinforcing Feedback' },
  { id: 'pattern-recognition',          label: 'Pattern Recognition' },
];

// Map from the assessment app's SCORE_LABELS_BY_KEY values → question id.
// The assessment app stores per-question scores keyed by these label strings.
const SCORE_LABEL_TO_ID = {
  'Clear Expectations':        'clear-expectations',
  'Clean Handoff':             'clean-handoff',
  'Avoiding Rescue':           'avoiding-rescue',
  'Follow-Up on the Work':     'follow-up',
  'Follow-Up':                 'follow-up',
  'Timely Redirecting Feedback': 'timely-redirecting-feedback',
  'Timely Feedback':           'timely-redirecting-feedback',
  'Reinforcing Feedback':      'reinforcing-feedback',
  'Pattern Recognition':       'pattern-recognition',
};

const BAND_LABELS = {
  '6-7': 'Strong System',
  '3-5': 'Room to Strengthen',
  '0-2': 'Not Yet Installed',
};

const BAND_COLORS = {
  'strong-system':          'bg-teal-100 text-teal-800',
  'room-to-strengthen':     'bg-orange-100 text-orange-800',
  'system-not-yet-installed': 'bg-navy-100 text-slate-700',
};

const pct = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0);

// ── PercentBar ───────────────────────────────────────────────────────────────
const PercentBar = ({ value, colorClass = 'bg-corporate-teal' }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${colorClass}`}
        style={{ width: `${value}%` }}
      />
    </div>
    <span className="text-xs font-bold text-slate-600 w-8 text-right">{value}%</span>
  </div>
);

// ── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
    <div className="p-2.5 rounded-lg bg-corporate-navy/5">
      <Icon className="w-5 h-5 text-corporate-navy" />
    </div>
    <div>
      <p className="text-2xl font-black text-corporate-navy">{value}</p>
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ── AccountabilityInsights ───────────────────────────────────────────────────
const AccountabilityInsights = () => {
  const { db } = useAppServices();
  const [leads, setLeads] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [togglingId, setTogglingId] = useState(null);
  const [toggleError, setToggleError] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // ── Load leads + global stats ──────────────────────────────────────────
  // Note: sorting is done client-side to avoid needing a Firestore index.
  const load = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [snap, statsResult] = await Promise.all([
        getDocs(collection(db, 'accountability-leads')),
        getDoc(doc(db, 'accountability-stats', 'global')).catch(() => null),
      ]);
      setLeads(snap.docs.map((d) => ({ _id: d.id, ...d.data() })));
      setGlobalStats(statsResult?.exists?.() ? statsResult.data() : null);
    } catch (err) {
      console.error('AccountabilityInsights: failed to load leads', err);
      setLoadError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => { load(); }, [load]);

  // ── Toggle isTest flag ──────────────────────────────────────────────────
  const toggleTest = async (lead) => {
    setTogglingId(lead._id);
    setToggleError(null);
    try {
      const newVal = !lead.isTest;
      await updateDoc(doc(db, 'accountability-leads', lead._id), { isTest: newVal });
      setLeads((prev) =>
        prev.map((l) => (l._id === lead._id ? { ...l, isTest: newVal } : l))
      );
    } catch (err) {
      console.error('Failed to toggle isTest', err);
      setToggleError('Could not save — check Firestore permissions.');
      setTimeout(() => setToggleError(null), 4000);
    } finally {
      setTogglingId(null);
    }
  };

  // ── Computed stats (exclude test entries) ───────────────────────────────
  const realLeads = useMemo(() => leads.filter((l) => !l.isTest), [leads]);

  // Normalise scoreBand → one of '6-7' | '3-5' | '0-2'.
  // Old 5-question submissions used '4-5', '2-3', '0-1' or archetype strings;
  // fall back to computing from yesCount + totalQuestions.
  const normalizeBand = useCallback((lead) => {
    const band = lead.results?.scoreBand;
    if (band === '6-7' || band === '3-5' || band === '0-2') return band;
    const yes = lead.results?.yesCount ?? 0;
    const total = lead.results?.totalQuestions ?? 7;
    // Use proportional thresholds so 5-question and 7-question both map sensibly
    const pctYes = total > 0 ? yes / total : 0;
    if (pctYes >= 0.75) return '6-7';
    if (pctYes >= 0.30) return '3-5';
    return '0-2';
  }, []);

  const bandCounts = useMemo(() => {
    const counts = { '6-7': 0, '3-5': 0, '0-2': 0 };
    realLeads.forEach((l) => { counts[normalizeBand(l)]++; });
    return counts;
  }, [realLeads, normalizeBand]);

  // Check which per-question data format is available
  const hasPerLeadQuestions = useMemo(
    () => realLeads.some((l) => Array.isArray(l.results?.questionResults) && l.results.questionResults.length > 0),
    [realLeads]
  );

  const hasScoresData = useMemo(
    () => realLeads.some((l) => l.results?.scores && Object.keys(l.results.scores).length > 0),
    [realLeads]
  );

  const questionStats = useMemo(() => {
    const stats = {};
    QUESTION_IDS.forEach(({ id, label }) => {
      stats[id] = { label, yes: 0, notYet: 0 };
    });

    if (hasPerLeadQuestions) {
      // Best format — questionResults array per lead (test-exclusion aware)
      realLeads.forEach((lead) => {
        const qr = lead.results?.questionResults || [];
        qr.forEach((item) => {
          if (!item?.id || !stats[item.id]) return;
          if (item.answer === 'yes') stats[item.id].yes++;
          else stats[item.id].notYet++;
        });
      });
    } else if (hasScoresData) {
      // Fallback — use the results.scores map (keyed by label string, value 100=yes / 0=not-yet)
      // This exists on all submissions from the 7-question assessment app.
      realLeads.forEach((lead) => {
        const sc = lead.results?.scores || {};
        Object.entries(sc).forEach(([label, val]) => {
          const id = SCORE_LABEL_TO_ID[label];
          if (!id || !stats[id]) return;
          if (val === 100) stats[id].yes++;
          else stats[id].notYet++;
        });
      });
    } else if (globalStats?.questions) {
      // Last-resort fallback — use global aggregate counters
      // (test entries not excluded; shown with a warning badge)
      QUESTION_IDS.forEach(({ id }) => {
        const q = globalStats.questions[id];
        if (q) {
          stats[id].yes = q.yes || 0;
          stats[id].notYet = q.notYet || 0;
        }
      });
    }

    return stats;
  }, [realLeads, hasPerLeadQuestions, hasScoresData, globalStats]);

  // ── Filtered + sorted table rows ───────────────────────────────────────
  const tableRows = useMemo(() => {
    const q = search.toLowerCase();
    let rows = leads.filter((l) => {
      if (!q) return true;
      return (
        (l.email || '').toLowerCase().includes(q) ||
        (l.firstName || '').toLowerCase().includes(q)
      );
    });

    rows = [...rows].sort((a, b) => {
      let av = a[sortField];
      let bv = b[sortField];
      if (sortField === 'createdAt') {
        av = av?.toMillis?.() ?? av ?? 0;
        bv = bv?.toMillis?.() ?? bv ?? 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [leads, search, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-corporate-teal" />
      : <ChevronDown className="w-3 h-3 text-corporate-teal" />;
  };

  const fmt = (ts) => {
    if (!ts) return '—';
    const d = ts?.toDate?.() ?? new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const bandPill = (lead) => {
    const key = lead.results?.archetype || 'room-to-strengthen';
    const band = lead.results?.scoreBand;
    const label = BAND_LABELS[band] || lead.results?.scoreLabel || band || '—';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${BAND_COLORS[key] || 'bg-slate-100 text-slate-600'}`}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader className="w-7 h-7 animate-spin text-corporate-teal" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center p-16 gap-3">
        <XCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm font-semibold text-red-600">Failed to load assessment data</p>
        <p className="text-xs text-slate-400">{loadError}</p>
        <button onClick={load} className="mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-corporate-teal text-white hover:bg-corporate-teal/90">
          Retry
        </button>
      </div>
    );
  }

  const total = realLeads.length;

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-corporate-navy">Assessment Insights</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Accountability System Pulse Check · real submissions only (test entries excluded from stats)
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm text-slate-600 font-medium transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ── Toggle error toast ───────────────────────────────────────── */}
      {toggleError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
          <XCircle className="w-4 h-4 shrink-0" />
          {toggleError}
        </div>
      )}

      {/* ── Top-line stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users}     label="Total Submissions" value={total} sub={`${leads.filter(l => l.isTest).length} test excluded`} />
        <StatCard icon={TrendingUp} label="Strong System (6-7)" value={bandCounts['6-7']} sub={`${pct(bandCounts['6-7'], total)}% of real`} />
        <StatCard icon={BarChart3}  label="Room to Strengthen (3-5)" value={bandCounts['3-5']} sub={`${pct(bandCounts['3-5'], total)}%`} />
        <StatCard icon={XCircle}   label="Not Yet Installed (0-2)" value={bandCounts['0-2']} sub={`${pct(bandCounts['0-2'], total)}%`} />
      </div>

      {/* ── Per-question breakdown ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
            Question by Question — % answering "Not Yet"
          </h3>
          {!hasPerLeadQuestions && hasScoresData && (
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full">
              From scores map · test entries excluded
            </span>
          )}
          {!hasPerLeadQuestions && !hasScoresData && globalStats?.questions && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              Using aggregate data · test entries not excluded
            </span>
          )}
        </div>
        <div className="space-y-4">
          {QUESTION_IDS.map(({ id, label }) => {
            const s = questionStats[id];
            if (!s) return null;
            const answered = s.yes + s.notYet;
            const notYetPct = pct(s.notYet, answered);
            const yesPct = pct(s.yes, answered);
            return (
              <div key={id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <span className="text-xs text-slate-400">{answered} responses · {s.yes} yes · {s.notYet} not yet</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-corporate-teal font-bold uppercase mb-1">Yes — {yesPct}%</p>
                    <PercentBar value={yesPct} colorClass="bg-corporate-teal" />
                  </div>
                  <div>
                    <p className="text-[10px] text-corporate-orange font-bold uppercase mb-1">Not Yet — {notYetPct}%</p>
                    <PercentBar value={notYetPct} colorClass="bg-corporate-orange" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {total > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ready-to-use stats (based on {total} real submissions)</p>
            <ul className="space-y-1">
              {QUESTION_IDS.map(({ id, label }) => {
                const s = questionStats[id];
                if (!s) return null;
                const answered = s.yes + s.notYet;
                const notYetPct = pct(s.notYet, answered);
                return (
                  <li key={id} className="text-xs text-slate-600">
                    <strong>{notYetPct}%</strong> of managers said they're inconsistent or not yet doing: <em>{label}</em>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* ── Individual submissions table ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex-1">
            Individual Submissions ({leads.length})
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search email or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th
                  className="px-4 py-3 text-left font-bold text-slate-500 cursor-pointer hover:text-slate-700 select-none"
                  onClick={() => toggleSort('email')}
                >
                  <span className="flex items-center gap-1">Email <SortIcon field="email" /></span>
                </th>
                <th className="px-4 py-3 text-left font-bold text-slate-500">Name</th>
                <th
                  className="px-4 py-3 text-left font-bold text-slate-500 cursor-pointer hover:text-slate-700 select-none"
                  onClick={() => toggleSort('results.scoreBand')}
                >
                  <span className="flex items-center gap-1">Score Band <SortIcon field="results.scoreBand" /></span>
                </th>
                <th className="px-4 py-3 text-center font-bold text-slate-500">Yes Count</th>
                <th
                  className="px-4 py-3 text-left font-bold text-slate-500 cursor-pointer hover:text-slate-700 select-none"
                  onClick={() => toggleSort('createdAt')}
                >
                  <span className="flex items-center gap-1">Submitted <SortIcon field="createdAt" /></span>
                </th>
                <th className="px-4 py-3 text-center font-bold text-slate-500">
                  <span className="flex items-center justify-center gap-1"><FlaskConical className="w-3.5 h-3.5" /> Test?</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No submissions found.
                  </td>
                </tr>
              )}
              {tableRows.map((lead) => (
                <tr
                  key={lead._id}
                  className={`border-b border-slate-50 transition-colors ${lead.isTest ? 'bg-amber-50/60 opacity-70' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {lead.email || '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {lead.firstName || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {bandPill(lead)}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-700">
                    {lead.results?.yesCount ?? '—'} / {lead.results?.totalQuestions ?? 7}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {fmt(lead.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleTest(lead)}
                      disabled={togglingId === lead._id}
                      title={lead.isTest ? 'Mark as real submission' : 'Mark as test — exclude from stats'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        lead.isTest
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                      }`}
                    >
                      {togglingId === lead._id
                        ? <Loader className="w-4 h-4 animate-spin" />
                        : lead.isTest
                          ? <FlaskConical className="w-4 h-4" />
                          : <CheckCircle2 className="w-4 h-4" />
                      }
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leads.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>{leads.filter(l => l.isTest).length} test entries excluded from stats above</span>
            <a
              href="https://console.firebase.google.com/project/leaderreps-prod/firestore/data/accountability-leads"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-corporate-teal hover:underline font-medium"
            >
              Open in Firestore <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountabilityInsights;
