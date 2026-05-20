// src/components/widgets/PracticeRepsHistoryWidget.jsx
//
// Locker widget — Practice a Rep (Conditioning Light) history.
// Reads from /users/{uid}/reps_light written by the evaluateRep cloud function.
//
// May-11 #4: Adopts the week-grouped collapsible UI from
// ConditioningHistoryWidget. The Conditioning History widget itself is being
// retired (kept dormant in src/components/widgets/ for one release cycle).

import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import {
  Zap,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Award,
  XCircle,
} from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import {
  getCurrentWeekId,
  getWeekBoundaries,
} from '../../services/conditioningService';

const RR_LABELS = {
  DRF: 'Reinforcing Feedback',
  RED: 'Redirecting Feedback',
  SCE: 'Set Clear Expectations',
  FUW: 'Follow-Up on the Work',
};

const formatDate = (date) => {
  if (!date) return '';
  const d =
    date instanceof Date ? date : date.toDate?.() || new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDateTime = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Derive a weekId from a rep's createdAt timestamp (matches the conditioning
// history grouping convention so the two widgets feel identical).
const weekIdFor = (rep) => {
  const ts = rep.createdAt;
  if (!ts) return 'unknown';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return getCurrentWeekId(d);
};

const PracticeRepsHistoryWidget = ({ helpText }) => {
  const { user, db } = useAppServices();
  const userId = user?.uid;

  const [reps, setReps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedWeeks, setExpandedWeeks] = useState(new Set());
  const [expandedReps, setExpandedReps] = useState(new Set());
  const [visibleWeeks, setVisibleWeeks] = useState(4);

  useEffect(() => {
    if (!userId || !db) {
      setIsLoading(false);
      return undefined;
    }

    const q = query(
      collection(db, 'users', userId, 'reps_light'),
      orderBy('createdAt', 'desc'),
      limit(200),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setReps(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setIsLoading(false);
      },
      (err) => {
        console.error('PracticeRepsHistoryWidget: load failed', err);
        setIsLoading(false);
      },
    );
    return unsubscribe;
  }, [userId, db]);

  // Group reps by weekId, mirroring ConditioningHistoryWidget's structure.
  const weeklyHistory = useMemo(() => {
    const map = new Map();
    for (const rep of reps) {
      const weekId = weekIdFor(rep);
      if (!map.has(weekId)) {
        map.set(weekId, {
          weekId,
          reps: [],
          passedCount: 0,
          attemptedCount: 0,
        });
      }
      const week = map.get(weekId);
      week.reps.push(rep);
      week.attemptedCount += 1;
      if (rep.result === 'pass') week.passedCount += 1;
    }
    const sorted = Array.from(map.values()).sort((a, b) => {
      if (a.weekId === 'unknown') return 1;
      if (b.weekId === 'unknown') return -1;
      return b.weekId.localeCompare(a.weekId);
    });
    for (const week of sorted) {
      if (week.weekId !== 'unknown') {
        const { weekStart, weekEnd } = getWeekBoundaries(week.weekId);
        week.weekStart = weekStart;
        week.weekEnd = weekEnd;
      }
    }
    return sorted;
  }, [reps]);

  const toggleWeek = (weekId) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  };

  const toggleRep = (id) => {
    setExpandedReps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatWeekRange = (week) => {
    if (!week.weekStart || !week.weekEnd) return week.weekId;
    return `${formatDate(week.weekStart)} - ${formatDate(week.weekEnd)}`;
  };

  const currentWeekId = getCurrentWeekId();
  const visibleHistory = weeklyHistory.slice(0, visibleWeeks);
  const hasMore = weeklyHistory.length > visibleWeeks;

  return (
    <Card title="Practice Reps" icon={Zap} accent="NAVY" helpText={helpText}>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-corporate-navy/20 border-t-corporate-navy rounded-full animate-spin" />
        </div>
      ) : weeklyHistory.length === 0 ? (
        <div className="text-center py-8">
          <Zap className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            No Practice Reps yet
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            Try one from Practice a Rep to start building your history.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleHistory.map((week) => {
            const isCurrentWeek = week.weekId === currentWeekId;
            const isExpanded = expandedWeeks.has(week.weekId);

            return (
              <div
                key={week.weekId}
                className={`rounded-xl border overflow-hidden ${
                  isCurrentWeek
                    ? 'border-corporate-teal'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
                style={
                  isCurrentWeek
                    ? {
                        backgroundColor:
                          'var(--conditioning-current-week-bg, #f0fdfa)',
                      }
                    : undefined
                }
              >
                {/* Week Header */}
                <button
                  type="button"
                  onClick={() => toggleWeek(week.weekId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        week.passedCount > 0
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {week.passedCount > 0 ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {formatWeekRange(week)}
                        </span>
                        {isCurrentWeek && (
                          <span className="px-2 py-0.5 bg-corporate-teal text-white text-xs font-bold rounded-full">
                            THIS WEEK
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {week.passedCount} passed
                        {week.attemptedCount > week.passedCount &&
                          ` • ${
                            week.attemptedCount - week.passedCount
                          } needs work`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-corporate-navy dark:text-white">
                      {week.attemptedCount}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                </button>

                {/* Expanded Rep Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 p-4">
                    <ul className="space-y-2">
                      {week.reps.map((rep) => {
                        const isOpen = expandedReps.has(rep.id);
                        const isPass = rep.result === 'pass';
                        const tone = isPass
                          ? 'text-emerald-600'
                          : 'text-amber-600';
                        const label = RR_LABELS[rep.rrType] || rep.rrType || 'Rep';
                        return (
                          <li
                            key={rep.id}
                            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700"
                          >
                            <button
                              type="button"
                              onClick={() => toggleRep(rep.id)}
                              className="w-full flex items-start gap-3 p-3 hover:bg-teal-50/30 dark:hover:bg-teal-900/20 transition-colors text-left"
                              aria-expanded={isOpen}
                            >
                              <div
                                className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isPass
                                    ? 'bg-emerald-100 text-emerald-600'
                                    : 'bg-amber-100 text-amber-600'
                                }`}
                              >
                                {isPass ? (
                                  <Award className="w-4 h-4" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-slate-800 dark:text-white">
                                    {label}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold uppercase tracking-wide ${tone}`}
                                  >
                                    {isPass ? 'Pass' : 'Not Yet'}
                                  </span>
                                  {rep.patternKey && (
                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-corporate-orange bg-corporate-orange/10 px-1.5 py-0.5 rounded">
                                      Tendency surfaced
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                  {formatDateTime(rep.createdAt)}
                                </p>
                              </div>
                              {isOpen ? (
                                <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                              )}
                            </button>

                            {isOpen && (
                              <div className="px-3 pb-3 ml-9 space-y-3 text-sm">
                                {rep.transcript && (
                                  <div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                      Your Rep
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                      {rep.transcript}
                                    </p>
                                  </div>
                                )}
                                {rep.observation && (
                                  <div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                      Observation
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200">
                                      {rep.observation}
                                    </p>
                                  </div>
                                )}
                                {rep.question && (
                                  <div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                      {isPass ? 'Try Next' : 'Try Next Time'}
                                    </div>
                                    <p className="text-slate-700 dark:text-slate-200">
                                      {rep.question}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          {/* Show More / Less Controls */}
          {weeklyHistory.length > 4 && (
            <div className="flex justify-center gap-3 pt-3">
              {visibleWeeks > 4 && (
                <button
                  type="button"
                  onClick={() => setVisibleWeeks(4)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all"
                >
                  Show Less
                </button>
              )}
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setVisibleWeeks(visibleWeeks + 4)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-corporate-navy to-slate-700 hover:from-slate-700 hover:to-slate-600 rounded-xl shadow-sm hover:shadow transition-all"
                >
                  Show More ({weeklyHistory.length - visibleWeeks} remaining)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default PracticeRepsHistoryWidget;
