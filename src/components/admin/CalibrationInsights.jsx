// src/components/admin/CalibrationInsights.jsx
//
// Slice 3 — Calibration insights dashboard. Surfaces per-rep-type drift,
// trainer accuracy ratings, top tags, and override frequency. Lets admins
// toggle the few-shot feature flag (config/features.calibrationFewShot).
//
// Used inside RepCalibrationPanel.

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { getRepType } from '../../services/repTaxonomy';
import { getFewShotFlag, setFewShotFlag } from '../../services/calibrationService';

const fmtDate = (ms) => {
  if (!ms) return '—';
  try { return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  catch { return '—'; }
};

const driftTone = (delta) => {
  if (delta == null) return { icon: Minus, cls: 'text-slate-400', label: 'no data' };
  if (delta > 12) return { icon: TrendingUp, cls: 'text-corporate-orange', label: 'engine high' };
  if (delta < -12) return { icon: TrendingDown, cls: 'text-corporate-orange', label: 'engine low' };
  if (delta > 5 || delta < -5) return { icon: Minus, cls: 'text-amber-500', label: 'mild drift' };
  return { icon: CheckCircle2, cls: 'text-corporate-teal', label: 'aligned' };
};

const topTags = (tagCounts, n = 3) =>
  Object.entries(tagCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);

const CalibrationInsights = ({ stats }) => {
  const { db } = useAppServices();
  const [flag, setFlag] = useState({ enabled: false, maxExamples: 3 });
  const [flagLoading, setFlagLoading] = useState(true);
  const [savingFlag, setSavingFlag] = useState(false);
  const [flagError, setFlagError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const f = await getFewShotFlag(db);
        if (!cancelled) setFlag(f);
      } finally {
        if (!cancelled) setFlagLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [db]);

  const toggleEnabled = async () => {
    setSavingFlag(true);
    setFlagError(null);
    try {
      const next = { enabled: !flag.enabled, maxExamples: flag.maxExamples };
      await setFewShotFlag(db, next);
      setFlag(next);
    } catch (e) {
      setFlagError(e?.message || String(e));
    } finally {
      setSavingFlag(false);
    }
  };

  const setMaxExamples = async (n) => {
    setSavingFlag(true);
    setFlagError(null);
    try {
      const next = { enabled: flag.enabled, maxExamples: n };
      await setFewShotFlag(db, next);
      setFlag(next);
    } catch (e) {
      setFlagError(e?.message || String(e));
    } finally {
      setSavingFlag(false);
    }
  };

  const entries = Object.entries(stats || {});

  return (
    <section className="space-y-4">
      {/* Few-shot flag control */}
      <div className="rounded-lg border border-corporate-orange/30 bg-corporate-orange/5 dark:bg-corporate-orange/10 p-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-corporate-orange flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-corporate-navy dark:text-white">
              Few-shot calibration injection
              {flagLoading ? (
                <Loader2 className="inline-block w-3 h-3 ml-2 animate-spin text-slate-400" />
              ) : (
                <span className={`ml-2 text-xs font-medium ${flag.enabled ? 'text-corporate-teal' : 'text-slate-500'}`}>
                  {flag.enabled ? `ON · top ${flag.maxExamples}` : 'OFF'}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              When ON, the AI scorer is prompted with the most recent expert
              trainer calibrations for the matching rep type. Recommended once
              a rep type has 10+ submitted calibrations.
            </p>

            {!flagLoading && (
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={toggleEnabled}
                  disabled={savingFlag}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-corporate-navy dark:text-white disabled:opacity-50"
                >
                  {flag.enabled ? (
                    <ToggleRight className="w-7 h-7 text-corporate-teal" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-400" />
                  )}
                  {flag.enabled ? 'Disable' : 'Enable'}
                </button>

                {flag.enabled && (
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-500">Max examples:</span>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setMaxExamples(n)}
                        disabled={savingFlag || n === flag.maxExamples}
                        className={`w-6 h-6 rounded text-[11px] font-semibold transition-colors ${
                          flag.maxExamples === n
                            ? 'bg-corporate-orange text-white'
                            : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 hover:border-corporate-orange disabled:opacity-50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}

                {savingFlag && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
              </div>
            )}

            {flagError && (
              <p className="text-xs text-rose-600 mt-2 flex items-center gap-1">
                <AlertTriangle size={12} /> {flagError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Per-rep-type insights */}
      {entries.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
              Per-rep-type insights
            </p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {entries.map(([type, s]) => {
              const rt = getRepType(type);
              const drift = driftTone(s.avgDelta);
              const Icon = drift.icon;
              const acc = s.accuracyCounts || { correct: 0, partial: 0, incorrect: 0 };
              const accTotal = acc.correct + acc.partial + acc.incorrect;
              const correctPct = accTotal ? Math.round((acc.correct / accTotal) * 100) : null;
              const ready = s.count >= 10;
              const tags = topTags(s.tagCounts);
              return (
                <div key={type} className="px-3 py-3 grid grid-cols-12 gap-3 items-start text-xs">
                  <div className="col-span-12 md:col-span-3">
                    <div className="font-semibold text-slate-700 dark:text-slate-200">
                      {rt?.label || type}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {s.count} calibration{s.count === 1 ? '' : 's'}
                      {ready && <span className="ml-1 text-emerald-600">· L2 ready</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Last reviewed {fmtDate(s.lastUpdated)}
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-3">
                    <div className={`flex items-center gap-1.5 font-semibold ${drift.cls}`}>
                      <Icon className="w-4 h-4" />
                      Δ {s.avgDelta == null ? '—' : (s.avgDelta > 0 ? '+' : '') + s.avgDelta}
                      <span className="text-[11px] font-normal text-slate-500">({drift.label})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Engine pass {s.passRateEngine ?? '—'}% · Trainer pass {s.passRateTrainer ?? '—'}%
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-3">
                    <div className="font-semibold text-slate-700 dark:text-slate-200">
                      AI accuracy
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {accTotal === 0 ? (
                        'not yet rated'
                      ) : (
                        <>
                          {correctPct}% correct
                          {' · '}
                          {acc.partial} partial
                          {' · '}
                          {acc.incorrect} wrong
                        </>
                      )}
                    </div>
                    {s.overrideCount > 0 && (
                      <div className="text-[11px] text-corporate-orange mt-0.5">
                        {s.overrideCount} verdict override{s.overrideCount === 1 ? '' : 's'}
                      </div>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-3">
                    <div className="font-semibold text-slate-700 dark:text-slate-200">Top tags</div>
                    {tags.length === 0 ? (
                      <div className="text-[11px] text-slate-400 mt-0.5">none yet</div>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags.map(([tag, n]) => (
                          <span
                            key={tag}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          >
                            {tag} · {n}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default CalibrationInsights;
