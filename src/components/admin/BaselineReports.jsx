// src/components/admin/BaselineReports.jsx
// Trainer view of all leaders' Skills Baseline assessments.
// Mirrors the structure of LeaderProfileReports.jsx.
//
// Source: modules/{uid}/development_plan/current
//   - currentAssessment: { date, answers: { q1..q15 }, openEnded[], cycle }
//   - assessmentHistory:  [ { same shape }, ... ]

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import {
  Loader, Download, Search, ChevronUp, ChevronDown, X,
  User, Target, BarChart3, AlertTriangle,
} from 'lucide-react';

// ============================================
// QUESTION CATALOG (mirrors BaselineAssessmentSimple)
// ============================================
const FREQUENCY_QUESTIONS = [
  { id: 'q1', text: 'Defined criteria for success when assigning work.', category: 'Clarity' },
  { id: 'q2', text: 'Named ownership and confirmed acceptance.', category: 'Ownership' },
  { id: 'q3', text: 'Gave reinforcing feedback tied to behavior + impact.', category: 'Feedback' },
  { id: 'q4', text: 'Gave redirecting feedback when behavior missed standard.', category: 'Feedback' },
  { id: 'q5', text: 'Followed up on work rather than assuming.', category: 'Follow-Through' },
  { id: 'q6', text: 'Modeled vulnerability by acknowledging a miss of my own.', category: 'Vulnerability' },
  { id: 'q7', text: 'Checked after feedback to confirm behavior changed.', category: 'Follow-Through' },
  { id: 'q8', text: 'Noticed patterns early instead of escalating.', category: 'Awareness' },
  { id: 'q9', text: 'Asked direct report for their plan when stalled.', category: 'Ownership' },
  { id: 'q10', text: 'Adjusted approach when met with feedback resistance.', category: 'Adaptability' },
];
const AGREEMENT_QUESTIONS = [
  { id: 'q11', text: 'I have a clear intention for difficult moments.', category: 'Intentionality' },
  { id: 'q12', text: 'I have practical tools for hard conversations.', category: 'Tools' },
  { id: 'q13', text: 'I hold regular one-on-ones with reports.', category: 'Structure' },
];
const SCORED_QUESTIONS = [...FREQUENCY_QUESTIONS, ...AGREEMENT_QUESTIONS]; // 13 scored Q's, 1-4 scale
const MAX_SCORE = 4;
const STANDARD = 3; // "Agree" / frequent — anything below is a gap

// ============================================
// SORT CONFIG
// ============================================
const SORTABLE_COLUMNS = [
  { key: 'userName', label: 'Leader' },
  { key: 'cycle', label: 'Cycle' },
  { key: 'avgScore', label: 'Avg Score' },
  { key: 'gapCount', label: 'Gaps' },
  { key: 'completeness', label: 'Complete %' },
  { key: 'date', label: 'Last Taken' },
];

// ============================================
// METRICS
// ============================================
const computeMetrics = (assessment) => {
  if (!assessment || !assessment.answers) {
    return { avgScore: 0, gapCount: 0, completeness: 0, scoredCount: 0, byCategory: {} };
  }
  const answers = assessment.answers;
  const scored = SCORED_QUESTIONS.map(q => ({ q, value: Number(answers[q.id]) }))
    .filter(x => Number.isFinite(x.value) && x.value > 0);
  const sum = scored.reduce((s, x) => s + x.value, 0);
  const avgScore = scored.length > 0 ? sum / scored.length : 0;
  const gapCount = scored.filter(x => x.value < STANDARD).length;

  const hasOpenText = typeof answers.q14 === 'string' && answers.q14.trim().length > 0;
  const hasMultiSelect = Array.isArray(answers.q15) && answers.q15.length > 0;
  const completeness = Math.round(((scored.length + (hasOpenText ? 1 : 0) + (hasMultiSelect ? 1 : 0)) / 15) * 100);

  // Aggregate by category
  const byCategory = {};
  SCORED_QUESTIONS.forEach(q => {
    const v = Number(answers[q.id]);
    if (!Number.isFinite(v) || v <= 0) return;
    if (!byCategory[q.category]) byCategory[q.category] = { sum: 0, count: 0 };
    byCategory[q.category].sum += v;
    byCategory[q.category].count += 1;
  });
  Object.keys(byCategory).forEach(k => {
    byCategory[k].avg = byCategory[k].sum / byCategory[k].count;
  });

  return { avgScore, gapCount, completeness, scoredCount: scored.length, byCategory };
};

const formatDate = (isoOrTs) => {
  if (!isoOrTs) return 'N/A';
  try {
    const d = isoOrTs?.toDate?.() || new Date(isoOrTs);
    return d.toLocaleDateString();
  } catch {
    return 'N/A';
  }
};

// ============================================
// BADGES
// ============================================
const ScoreBadge = ({ score }) => {
  const pct = (score / MAX_SCORE) * 100;
  const color = pct >= 80 ? 'green' : pct >= 60 ? 'amber' : 'red';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700 dark:bg-${color}-900/30`}>
      {score.toFixed(2)} / {MAX_SCORE}
    </span>
  );
};

// ============================================
// DETAIL MODAL
// ============================================
const BaselineDetailModal = ({ row, onClose }) => {
  if (!row) return null;
  const { latest, history } = row;
  const metrics = computeMetrics(latest);

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-8 pb-safe bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-corporate-navy to-corporate-teal-ink text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{row.userName}</h2>
              <p className="text-white/80 text-sm">{row.userEmail}</p>
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="bg-white/15 px-2 py-0.5 rounded-full">Cycle {latest?.cycle ?? 1}</span>
                <span>Last taken {formatDate(latest?.date)}</span>
                <span>{history.length} cycle{history.length !== 1 ? 's' : ''} on file</span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40 text-center">
              <div className="text-xs uppercase text-slate-500">Avg Score</div>
              <div className="text-2xl font-bold text-corporate-navy dark:text-white">
                {metrics.avgScore.toFixed(2)}
                <span className="text-sm text-slate-400"> / {MAX_SCORE}</span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40 text-center">
              <div className="text-xs uppercase text-slate-500">Gaps (&lt; {STANDARD})</div>
              <div className="text-2xl font-bold text-amber-600">{metrics.gapCount}</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/40 text-center">
              <div className="text-xs uppercase text-slate-500">Completeness</div>
              <div className="text-2xl font-bold text-corporate-teal-ink">{metrics.completeness}%</div>
            </div>
          </div>

          {/* By category */}
          <div>
            <h3 className="font-semibold text-corporate-navy dark:text-white mb-2 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Category Averages
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(metrics.byCategory)
                .sort((a, b) => a[1].avg - b[1].avg)
                .map(([cat, data]) => (
                  <div key={cat} className="flex items-center justify-between p-2 rounded border border-slate-200 dark:border-slate-700">
                    <span className="text-sm">{cat}</span>
                    <ScoreBadge score={data.avg} />
                  </div>
                ))}
            </div>
          </div>

          {/* Per-question */}
          <div>
            <h3 className="font-semibold text-corporate-navy dark:text-white mb-2">Per-Question Scores</h3>
            <div className="space-y-1.5">
              {SCORED_QUESTIONS.map(q => {
                const v = Number(latest?.answers?.[q.id]);
                const isGap = Number.isFinite(v) && v < STANDARD;
                return (
                  <div key={q.id} className={`flex items-start gap-3 p-2 rounded ${isGap ? 'bg-red-50 dark:bg-red-900/10' : 'bg-slate-50 dark:bg-slate-700/30'}`}>
                    <span className="text-xs font-mono text-slate-400 w-8 flex-shrink-0">{q.id}</span>
                    <span className="text-sm flex-1">{q.text}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono flex-shrink-0">
                      {Number.isFinite(v) && v > 0 ? v : '—'}
                    </span>
                    {isGap && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Open ended */}
          {latest?.answers?.q14 && (
            <div>
              <h3 className="font-semibold text-corporate-navy dark:text-white mb-2">Current Challenge</h3>
              <p className="text-sm bg-slate-50 dark:bg-slate-700/40 p-3 rounded italic">
                &ldquo;{latest.answers.q14}&rdquo;
              </p>
            </div>
          )}

          {/* Avoidance patterns */}
          {Array.isArray(latest?.answers?.q15) && latest.answers.q15.length > 0 && (
            <div>
              <h3 className="font-semibold text-corporate-navy dark:text-white mb-2">Moments They Tend to Avoid</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {latest.answers.q15.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* History */}
          {history.length > 1 && (
            <div>
              <h3 className="font-semibold text-corporate-navy dark:text-white mb-2">Cycle History</h3>
              <div className="space-y-1">
                {history.map((h, i) => {
                  const m = computeMetrics(h);
                  return (
                    <div key={i} className="flex items-center justify-between text-sm p-2 rounded border border-slate-200 dark:border-slate-700">
                      <span>Cycle {h.cycle ?? i + 1} &mdash; {formatDate(h.date)}</span>
                      <ScoreBadge score={m.avgScore} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="text-xs text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
            User ID: {row.userId?.slice(0, 12)}...
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================
// SORTABLE TABLE HEADER
// ============================================
const SortableHeader = ({ column, currentSort, onSort }) => {
  const isActive = currentSort.key === column.key;
  const isAsc = currentSort.direction === 'asc';
  return (
    <button
      onClick={() => onSort(column.key)}
      className="flex items-center gap-1 hover:text-corporate-teal-ink transition-colors group"
    >
      <span>{column.label}</span>
      <div className="flex flex-col">
        <ChevronUp className={`w-3 h-3 -mb-1 ${isActive && isAsc ? 'text-corporate-teal-ink' : 'text-slate-300 group-hover:text-slate-400'}`} />
        <ChevronDown className={`w-3 h-3 ${isActive && !isAsc ? 'text-corporate-teal-ink' : 'text-slate-300 group-hover:text-slate-400'}`} />
      </div>
    </button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const BaselineReports = () => {
  const { db } = useAppServices();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const results = await Promise.all(users.map(async (u) => {
          try {
            const planRef = doc(db, `modules/${u.id}/development_plan/current`);
            const planSnap = await getDoc(planRef);
            if (!planSnap.exists()) return null;
            const plan = planSnap.data();
            const history = Array.isArray(plan.assessmentHistory) ? plan.assessmentHistory : [];
            const latest = plan.currentAssessment || (history.length > 0 ? history[history.length - 1] : null);
            if (!latest) return null;
            return {
              userId: u.id,
              userName: u.displayName || u.name || u.email || 'Unknown',
              userEmail: u.email || '',
              latest,
              history,
            };
          } catch {
            return null;
          }
        }));

        setRows(results.filter(Boolean));
      } catch (err) {
        console.error('Error fetching baselines:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [db]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const processedRows = useMemo(() => {
    const enriched = rows.map(r => {
      const m = computeMetrics(r.latest);
      return {
        ...r,
        cycle: r.latest?.cycle ?? 1,
        date: r.latest?.date || null,
        avgScore: m.avgScore,
        gapCount: m.gapCount,
        completeness: m.completeness,
      };
    });

    const term = searchTerm.toLowerCase();
    const filtered = term
      ? enriched.filter(r =>
          r.userName.toLowerCase().includes(term) ||
          r.userEmail.toLowerCase().includes(term))
      : enriched;

    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'date') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      aVal = (aVal || '').toString().toLowerCase();
      bVal = (bVal || '').toString().toLowerCase();
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    return filtered;
  }, [rows, searchTerm, sortConfig]);

  const exportCSV = () => {
    const scoredHeaders = SCORED_QUESTIONS.map(q => q.id);
    const headers = [
      'Name', 'Email', 'Cycle', 'Last Taken',
      'Avg Score', 'Gap Count', 'Completeness %',
      ...scoredHeaders,
      'Q14 Challenge', 'Q15 Avoidance Patterns',
    ];
    const csv = [
      headers.join(','),
      ...processedRows.map(r => {
        const a = r.latest?.answers || {};
        const cells = [
          `"${r.userName}"`,
          `"${r.userEmail}"`,
          r.cycle,
          formatDate(r.date),
          r.avgScore.toFixed(2),
          r.gapCount,
          r.completeness,
          ...scoredHeaders.map(q => (Number.isFinite(Number(a[q])) ? a[q] : '')),
          `"${(a.q14 || '').toString().replace(/"/g, '""')}"`,
          `"${(Array.isArray(a.q15) ? a.q15.join('; ') : '').replace(/"/g, '""')}"`,
        ];
        return cells.join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `skills_baseline_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy dark:text-white">Skills Baseline</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {processedRows.length} leader{processedRows.length !== 1 ? 's' : ''} have completed a baseline &bull; Click any row for full breakdown
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 bg-white dark:bg-slate-800"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                {SORTABLE_COLUMNS.map(col => (
                  <th key={col.key} className="px-4 py-3">
                    <SortableHeader column={col} currentSort={sortConfig} onSort={handleSort} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {processedRows.map(r => (
                <tr
                  key={r.userId}
                  onClick={() => setSelectedRow(r)}
                  className="hover:bg-corporate-teal/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-corporate-navy/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-corporate-navy" />
                      </div>
                      <div>
                        <div className="font-medium text-corporate-navy dark:text-white">{r.userName}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{r.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      Cycle {r.cycle}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={r.avgScore} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.gapCount === 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30' :
                      r.gapCount <= 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30'
                    }`}>
                      <Target className="w-3 h-3" />
                      {r.gapCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            r.completeness >= 80 ? 'bg-green-500' :
                            r.completeness >= 50 ? 'bg-amber-500' : 'bg-red-400'
                          }`}
                          style={{ width: `${r.completeness}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        r.completeness >= 80 ? 'text-green-600' :
                        r.completeness >= 50 ? 'text-amber-600' : 'text-red-500'
                      }`}>
                        {r.completeness}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {formatDate(r.date)}
                  </td>
                </tr>
              ))}
              {processedRows.length === 0 && (
                <tr>
                  <td colSpan={SORTABLE_COLUMNS.length} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No leaders have completed a baseline assessment yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRow && (
        <BaselineDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
      )}
    </div>
  );
};

export default BaselineReports;
