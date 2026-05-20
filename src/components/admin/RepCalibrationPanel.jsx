// src/components/admin/RepCalibrationPanel.jsx
//
// Rep Calibration L1 — trainer-facing rep queue + side drawer for rating
// completed reps against the engine's automated assessment. Storage layer
// in src/services/calibrationService.js. See that file for schema.

import React, { useEffect, useMemo, useState } from 'react';
import {
  ClipboardCheck, X, Loader2, CheckCircle2, AlertCircle, BadgeCheck,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { getRepType } from '../../services/repTaxonomy';
import {
  listReps,
  getCalibration,
  saveCalibration,
  getCalibrationStats,
} from '../../services/calibrationService';
import CalibrationInsights from './CalibrationInsights';
import RubricAddendumEditor from './RubricAddendumEditor';

const SCORE_OPTIONS = [1, 2, 3, 4, 5];
const TAG_OPTIONS = [
  'too-lenient',
  'too-strict',
  'missed-context',
  'wrong-rubric-weight',
  'good-call',
  'edge-case',
];

const fmtDate = (ts) => {
  if (!ts) return '';
  try {
    const d = ts.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts));
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch { return ''; }
};

const RepCalibrationDrawer = ({ rep, onClose, onSaved }) => {
  const { db, user } = useAppServices();
  const [trainerScore, setTrainerScore] = useState(3);
  const [trainerPassed, setTrainerPassed] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [tags, setTags] = useState([]);
  const [dimensionScores, setDimensionScores] = useState({});
  // adminReview block — surfaced to leader in their rep history
  const [aiAccuracy, setAiAccuracy] = useState(null); // 'correct'|'partial'|'incorrect'
  const [correctedResult, setCorrectedResult] = useState(null); // 'pass'|'notYet'|null
  const [trainerNote, setTrainerNote] = useState('');
  const [shareWithLeader, setShareWithLeader] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const repType = useMemo(() => getRepType(rep.repType), [rep.repType]);
  const rubric = repType?.rubric || [];

  // Pre-load existing calibration (if any) so re-opening a rep shows what
  // was previously submitted.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const existing = await getCalibration(db, rep.userId, rep.id);
        if (cancelled) return;
        if (existing) {
          if (typeof existing.trainerScore === 'number') setTrainerScore(existing.trainerScore);
          if (typeof existing.trainerPassed === 'boolean') setTrainerPassed(existing.trainerPassed);
          if (existing.feedback) setFeedback(existing.feedback);
          if (Array.isArray(existing.tags)) setTags(existing.tags);
          if (existing.dimensionScores) setDimensionScores(existing.dimensionScores);
          if (existing.aiAccuracy) setAiAccuracy(existing.aiAccuracy);
          if (existing.correctedResult) setCorrectedResult(existing.correctedResult);
          if (typeof existing.trainerNote === 'string') setTrainerNote(existing.trainerNote);
          if (typeof existing.shareWithLeader === 'boolean') setShareWithLeader(existing.shareWithLeader);
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [db, rep.userId, rep.id]);

  const toggleTag = (t) => setTags((cur) => (
    cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]
  ));

  const setDim = (id, v) => setDimensionScores((cur) => ({ ...cur, [id]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveCalibration(db, {
        userId: rep.userId,
        repId: rep.id,
        repType: rep.repType,
        cohortId: rep.cohortId || null,
        engineScore: rep.engineScore,
        enginePassed: rep.enginePassed,
        trainerId: user?.uid,
        trainerEmail: user?.email || null,
        trainerScore,
        trainerPassed,
        dimensionScores,
        feedback,
        tags,
        status: 'submitted',
        aiAccuracy,
        correctedResult,
        trainerNote,
        shareWithLeader,
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-label="Calibrate rep"
        className="ml-auto relative w-full max-w-2xl h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
      >
        <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-corporate-navy dark:text-white">
              Calibrate Rep
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {repType?.label || rep.repType || 'Unknown rep type'}
              {rep.cohortId ? ` · ${rep.cohortId}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : (
            <>
              {/* Engine assessment */}
              <section className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/60">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                  Engine Assessment
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-corporate-navy dark:text-white">
                    {rep.engineScore != null ? rep.engineScore : '—'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    rep.enginePassed === true
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : rep.enginePassed === false
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {rep.enginePassed === true ? 'Passed' : rep.enginePassed === false ? 'Did not pass' : 'Unscored'}
                  </span>
                </div>
                {rep.engineSummary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                    {rep.engineSummary}
                  </p>
                )}
                {rep.situationContext && (
                  <details className="mt-2">
                    <summary className="text-[11px] text-slate-500 cursor-pointer">Situation context</summary>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">
                      {rep.situationContext}
                    </p>
                  </details>
                )}
              </section>

              {/* Trainer score */}
              <section>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Your score (1 = far off · 5 = excellent)
                </label>
                <div className="flex items-center gap-2">
                  {SCORE_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTrainerScore(s)}
                      className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-colors ${
                        trainerScore === s
                          ? 'bg-corporate-teal text-white border-corporate-teal'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-corporate-teal'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <label className="mt-3 inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={trainerPassed}
                    onChange={(e) => setTrainerPassed(e.target.checked)}
                    className="rounded"
                  />
                  This rep would pass my bar
                </label>
              </section>

              {/* Per-dimension scores (rubric) */}
              {rubric.length > 0 && (
                <section>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Rubric (optional, 1-5 each)
                  </p>
                  <div className="space-y-2">
                    {rubric.map((r) => (
                      <div key={r.id} className="flex items-start justify-between gap-3">
                        <p className="text-xs text-slate-600 dark:text-slate-300 flex-1">
                          {r.prompt}
                        </p>
                        <div className="flex gap-1">
                          {SCORE_OPTIONS.map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setDim(r.id, s)}
                              className={`w-6 h-6 rounded text-[11px] font-semibold ${
                                dimensionScores[r.id] === s
                                  ? 'bg-corporate-navy text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Tags */}
              <section>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Tags
                </p>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={`px-2 py-1 rounded-full text-[11px] border transition-colors ${
                        tags.includes(t)
                          ? 'bg-corporate-teal/15 border-corporate-teal text-corporate-teal-ink dark:text-corporate-teal'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-corporate-teal'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </section>

              {/* Admin review — surfaced to leader (Slice 1) */}
              <section className="rounded-lg border border-corporate-teal/30 bg-corporate-teal/5 dark:bg-corporate-teal/10 p-3">
                <p className="text-xs font-semibold text-corporate-navy dark:text-white mb-2">
                  Was the AI verdict correct?
                </p>
                <div className="flex gap-2 mb-3">
                  {[
                    { v: 'correct', label: 'Correct' },
                    { v: 'partial', label: 'Partially' },
                    { v: 'incorrect', label: 'Wrong' },
                  ].map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAiAccuracy(aiAccuracy === v ? null : v)}
                      className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                        aiAccuracy === v
                          ? 'bg-corporate-teal text-white border-corporate-teal'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-corporate-teal'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {(aiAccuracy === 'partial' || aiAccuracy === 'incorrect') && (
                  <div className="mb-3">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Override the verdict shown to the leader?
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { v: null, label: 'Leave AI verdict' },
                        { v: 'pass', label: 'Mark as Passed' },
                        { v: 'notYet', label: 'Mark as Not yet' },
                      ].map(({ v, label }) => (
                        <button
                          key={String(v)}
                          type="button"
                          onClick={() => setCorrectedResult(v)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                            correctedResult === v
                              ? 'bg-corporate-navy text-white border-corporate-navy'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-corporate-navy'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Trainer note to the leader (public)
                </label>
                <textarea
                  rows={3}
                  value={trainerNote}
                  onChange={(e) => setTrainerNote(e.target.value)}
                  className="w-full text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-corporate-teal"
                  placeholder="Optional — a short note the leader will see on this rep…"
                />
                <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={shareWithLeader}
                    onChange={(e) => setShareWithLeader(e.target.checked)}
                    className="rounded"
                  />
                  Share this review with the leader
                </label>
              </section>

              {/* Feedback */}
              <section>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Notes (what would you want the engine to learn?)
                </label>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-corporate-teal"
                  placeholder="e.g. Engine missed the implicit power dynamic — leader was speaking up to a senior peer…"
                />
              </section>

              {error && (
                <div className="rounded border border-rose-300 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-xs px-3 py-2 inline-flex items-center gap-2">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
            </>
          )}
        </div>

        <footer className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 bg-slate-50 dark:bg-slate-800/60">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium rounded text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Save calibration
          </button>
        </footer>
      </aside>
    </div>
  );
};

const RepCalibrationPanel = () => {
  const { db } = useAppServices();
  const [reps, setReps] = useState([]);
  const [calibratedIds, setCalibratedIds] = useState(new Set());
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openRep, setOpenRep] = useState(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [repList, statsMap] = await Promise.all([
        listReps(db, { limitCount: 50 }),
        getCalibrationStats(db),
      ]);
      // Check which reps already have a calibration row.
      const ids = await Promise.all(repList.map(async (r) => {
        const c = await getCalibration(db, r.userId, r.id);
        return c ? `${r.userId}__${r.id}` : null;
      }));
      setCalibratedIds(new Set(ids.filter(Boolean)));
      setReps(repList);
      setStats(statsMap);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [db]);

  // Uncalibrated first.
  const sorted = useMemo(() => {
    const arr = [...reps];
    arr.sort((a, b) => {
      const ac = calibratedIds.has(`${a.userId}__${a.id}`);
      const bc = calibratedIds.has(`${b.userId}__${b.id}`);
      if (ac !== bc) return ac ? 1 : -1;
      return 0;
    });
    return arr;
  }, [reps, calibratedIds]);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-corporate-navy dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-corporate-orange" />
            Rep Calibration
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rate completed reps against the engine. Calibrations train future
            assessor tuning (L2) once we have 10-20 per rep type.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="text-xs font-medium px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {/* Per-rep-type insights (Slice 3) — drift, accuracy, tags, override count,
          and the few-shot feature flag. */}
      {Object.keys(stats).length > 0 && (
        <CalibrationInsights stats={stats} />
      )}

      {/* Editable rubric addendum per rrType (Slice 4). */}
      <RubricAddendumEditor />

      {error && (
        <div className="rounded border border-rose-300 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 text-xs px-3 py-2 inline-flex items-center gap-2">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading reps…
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-500 py-8 text-center">
          No reps with completed engine assessments yet.
        </p>
      ) : (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Rep</th>
                <th className="text-left px-3 py-2 font-semibold">User</th>
                <th className="text-left px-3 py-2 font-semibold">Engine</th>
                <th className="text-left px-3 py-2 font-semibold">Updated</th>
                <th className="text-right px-3 py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const rt = getRepType(r.repType);
                const isCalibrated = calibratedIds.has(`${r.userId}__${r.id}`);
                return (
                  <tr key={`${r.userId}__${r.id}`} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-700 dark:text-slate-200">
                        {rt?.shortLabel || rt?.label || r.repType || '—'}
                      </div>
                      <div className="text-[11px] text-slate-500">{r.cohortId || 'no cohort'}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300 font-mono">
                      {r.userId.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {r.engineScore != null ? r.engineScore : '—'}
                      </span>
                      {r.enginePassed != null && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          r.enginePassed
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                        }`}>
                          {r.enginePassed ? 'Pass' : 'Fail'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-500">{fmtDate(r.updatedAt)}</td>
                    <td className="px-3 py-2 text-right">
                      {isCalibrated ? (
                        <button
                          type="button"
                          onClick={() => setOpenRep(r)}
                          className="text-[11px] font-medium px-2 py-1 rounded inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        >
                          <BadgeCheck size={12} /> Calibrated
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOpenRep(r)}
                          className="text-[11px] font-semibold px-2 py-1 rounded bg-corporate-teal text-white hover:bg-corporate-teal/90"
                        >
                          Calibrate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {openRep && (
        <RepCalibrationDrawer
          rep={openRep}
          onClose={() => setOpenRep(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
};

export default RepCalibrationPanel;
