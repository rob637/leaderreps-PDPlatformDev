// src/components/screens/developmentplan/AssessmentHistory.jsx
// Growth view for the Leadership Skills Baseline. Shows a timeline of all takes,
// a side-by-side compare of any two takes, per-category sparklines over time,
// and a reflection log of open-ended/multi-select answers.

import React, { useMemo, useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ClipboardCheck, Calendar } from 'lucide-react';
import { useAppServices } from '../../../services/useAppServices';
import { useNavigation } from '../../../providers/NavigationProvider';
import { Card, Button } from '../../ui';
import {
  enrichAssessment,
  diffAssessments,
  QUESTION_VERSIONS,
  CURRENT_QUESTION_VERSION,
} from '../../../services/assessmentScoring';

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const DeltaPill = ({ delta }) => {
  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full text-xs font-semibold">
        <TrendingUp className="w-3 h-3" /> +{delta.toFixed(2)}
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full text-xs font-semibold">
        <TrendingDown className="w-3 h-3" /> {delta.toFixed(2)}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold">
      <Minus className="w-3 h-3" /> 0.00
    </span>
  );
};

// Tiny inline sparkline for a single category's avg over time.
const Sparkline = ({ points, max = 4 }) => {
  const w = 120;
  const h = 28;
  if (!points || points.length === 0) return <svg width={w} height={h} />;
  if (points.length === 1) {
    const cy = h - (points[0] / max) * h;
    return (
      <svg width={w} height={h}>
        <circle cx={w / 2} cy={cy} r={3} className="fill-corporate-teal" />
      </svg>
    );
  }
  const step = w / (points.length - 1);
  const d = points.map((p, i) => {
    const x = i * step;
    const y = h - (p / max) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} className="stroke-corporate-teal" strokeWidth="2" fill="none" />
      {points.map((p, i) => {
        const x = i * step;
        const y = h - (p / max) * h;
        return <circle key={i} cx={x} cy={y} r={2} className="fill-corporate-teal" />;
      })}
    </svg>
  );
};

const AssessmentHistory = () => {
  const { developmentPlanData } = useAppServices();
  const { navigate } = useNavigation();

  const history = useMemo(() => {
    const raw = developmentPlanData?.assessmentHistory || [];
    return raw
      .map(enrichAssessment)
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [developmentPlanData?.assessmentHistory]);

  const [fromId, setFromId] = useState(null);
  const [toId, setToId] = useState(null);

  const fromIdResolved = fromId || history[0]?.id || null;
  const toIdResolved = toId || history[history.length - 1]?.id || null;

  const fromAssessment = history.find((h) => h.id === fromIdResolved);
  const toAssessment = history.find((h) => h.id === toIdResolved);
  const diff = useMemo(
    () => diffAssessments(fromAssessment, toAssessment),
    [fromAssessment, toAssessment]
  );

  // Per-category series across all takes (uses union of categories seen).
  const categorySeries = useMemo(() => {
    const cats = new Set();
    history.forEach((a) => Object.keys(a.scores?.byCategory || {}).forEach((c) => cats.add(c)));
    const series = {};
    cats.forEach((c) => {
      series[c] = history.map((a) => a.scores?.byCategory?.[c]?.avg ?? 0);
    });
    return series;
  }, [history]);

  const questionSet = QUESTION_VERSIONS[CURRENT_QUESTION_VERSION];

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <button
          onClick={() => navigate('locker')}
          className="flex items-center gap-2 text-sm text-corporate-teal-ink hover:underline mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Locker
        </button>
        <Card accent="NAVY">
          <div className="p-8 text-center">
            <ClipboardCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-corporate-navy">No assessments yet</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              Complete the Leadership Skills Baseline to start tracking growth.
            </p>
            <div className="mt-4">
              <Button onClick={() => navigate('locker')}>Go to Locker</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('locker')}
          className="flex items-center gap-2 text-sm text-corporate-teal-ink hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Locker
        </button>
        <span className="text-xs text-slate-500">{history.length} assessment{history.length !== 1 ? 's' : ''}</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-corporate-navy">Leadership Skills — Growth</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          Track how your self-rated leadership skills have shifted over time.
        </p>
      </div>

      {/* Timeline */}
      <Card accent="TEAL">
        <div className="p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Timeline</h2>
          <div className="space-y-2">
            {history.map((a, idx) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-corporate-navy text-white flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-corporate-navy dark:text-white flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDate(a.date)}
                      <span className="text-xs text-slate-400">· cycle {a.cycle ?? idx + 1}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Overall {a.scores?.overall?.toFixed(2) ?? '—'} / 4 ·{' '}
                      {a.scores?.gapCount ?? 0} gap{(a.scores?.gapCount ?? 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Compare */}
      {history.length >= 2 && diff && (
        <Card accent="NAVY">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Compare</h2>
              <div className="flex items-center gap-2 text-xs">
                <label className="text-slate-500">From</label>
                <select
                  className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-corporate-navy dark:text-white"
                  value={fromIdResolved || ''}
                  onChange={(e) => setFromId(e.target.value)}
                >
                  {history.map((a, idx) => (
                    <option key={a.id} value={a.id}>
                      #{idx + 1} · {formatDate(a.date)}
                    </option>
                  ))}
                </select>
                <label className="text-slate-500 ml-2">To</label>
                <select
                  className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-800 text-corporate-navy dark:text-white"
                  value={toIdResolved || ''}
                  onChange={(e) => setToId(e.target.value)}
                >
                  {history.map((a, idx) => (
                    <option key={a.id} value={a.id}>
                      #{idx + 1} · {formatDate(a.date)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!diff.sameVersion && (
              <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                These assessments use different question versions. Only overlapping categories are comparable.
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-3">
              <span className="text-sm font-semibold text-corporate-navy dark:text-white">Overall</span>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500">{diff.overall.from.toFixed(2)}</span>
                <span className="text-slate-400">→</span>
                <span className="text-corporate-navy dark:text-white font-semibold">{diff.overall.to.toFixed(2)}</span>
                <DeltaPill delta={diff.overall.delta} />
              </div>
            </div>

            <div className="space-y-1">
              {Object.entries(diff.byCategory)
                .sort(([, a], [, b]) => b.delta - a.delta)
                .map(([cat, d]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <span className="text-sm text-corporate-navy dark:text-white">{cat}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-slate-500 tabular-nums">{d.from.toFixed(2)}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-corporate-navy dark:text-white font-medium tabular-nums">{d.to.toFixed(2)}</span>
                      <DeltaPill delta={d.delta} />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}

      {/* Category trends */}
      {history.length >= 2 && (
        <Card accent="TEAL">
          <div className="p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
              Category trends (avg out of {questionSet.scaleMax})
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(categorySeries).map(([cat, pts]) => {
                const first = pts[0] ?? 0;
                const last = pts[pts.length - 1] ?? 0;
                const delta = Math.round((last - first) * 100) / 100;
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-corporate-navy dark:text-white">{cat}</div>
                      <div className="text-xs text-slate-500">
                        {first.toFixed(2)} → {last.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkline points={pts} max={questionSet.scaleMax} />
                      <DeltaPill delta={delta} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Reflection log */}
      <Card accent="NAVY">
        <div className="p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Reflection log</h2>
          <div className="space-y-3">
            {[...history].reverse().map((a, idx) => {
              const reflection = a.answers?.q14;
              const multi = Array.isArray(a.answers?.q15) ? a.answers.q15 : [];
              const other = a.answers?.q15_other;
              if (!reflection && multi.length === 0 && !other) return null;
              return (
                <div
                  key={a.id}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <div className="text-xs text-slate-500 mb-1">
                    {formatDate(a.date)} · cycle {a.cycle ?? history.length - idx}
                  </div>
                  {reflection && (
                    <p className="text-sm text-corporate-navy dark:text-white whitespace-pre-wrap">{reflection}</p>
                  )}
                  {(multi.length > 0 || other) && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {multi.map((m) => (
                        <span
                          key={m}
                          className="text-xs px-2 py-0.5 rounded-full bg-corporate-teal/10 text-corporate-teal-ink border border-corporate-teal/30"
                        >
                          {m}
                        </span>
                      ))}
                      {other && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          Other: {other}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AssessmentHistory;
