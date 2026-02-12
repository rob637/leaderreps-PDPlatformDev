// src/components/widgets/ConditioningHistoryWidget.jsx
// Locker widget: Displays conditioning rep history grouped by week
// V1 UX: Added drill-down to view rep details

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dumbbell, CheckCircle, Clock, Target, Calendar,
  ChevronDown, ChevronUp, AlertTriangle, XCircle, ChevronRight
} from 'lucide-react';
import { Card } from '../ui';
import { RepDetailModal } from '../conditioning';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import conditioningService, { REP_STATUS, REP_TYPES, getCurrentWeekId, getWeekBoundaries } from '../../services/conditioningService';

const ConditioningHistoryWidget = ({ helpText }) => {
  const { user, db, developmentPlanData, userProfile } = useAppServices();
  const { cohortData } = useDailyPlan();
  const userId = user?.uid;
  const cohortId = developmentPlanData?.cohortId || cohortData?.id || userProfile?.cohortId;

  const [isLoading, setIsLoading] = useState(true);
  const [weeklyHistory, setWeeklyHistory] = useState([]);
  const [expandedWeeks, setExpandedWeeks] = useState(new Set());
  const [visibleWeeks, setVisibleWeeks] = useState(4);
  const [selectedRep, setSelectedRep] = useState(null);

  // Load conditioning history
  const loadHistory = useCallback(async () => {
    if (!userId || !cohortId || !db) {
      setIsLoading(false);
      return;
    }

    try {
      // Get all completed and canceled reps
      const history = await conditioningService.getRepHistory(db, userId, cohortId, 100);
      
      // Group by weekId
      const weekMap = new Map();
      
      for (const rep of history) {
        const weekId = rep.weekId || 'unknown';
        if (!weekMap.has(weekId)) {
          weekMap.set(weekId, {
            weekId,
            reps: [],
            completedCount: 0,
            canceledCount: 0
          });
        }
        const week = weekMap.get(weekId);
        week.reps.push(rep);
        if (rep.status === REP_STATUS.COMPLETED) {
          week.completedCount++;
        } else if (rep.status === REP_STATUS.CANCELED) {
          week.canceledCount++;
        }
      }

      // Sort weeks descending (newest first)
      const sortedWeeks = Array.from(weekMap.values()).sort((a, b) => {
        if (a.weekId === 'unknown') return 1;
        if (b.weekId === 'unknown') return -1;
        return b.weekId.localeCompare(a.weekId);
      });

      // Add week boundaries for display
      for (const week of sortedWeeks) {
        if (week.weekId && week.weekId !== 'unknown') {
          const boundaries = getWeekBoundaries(week.weekId);
          week.weekStart = boundaries.weekStart;
          week.weekEnd = boundaries.weekEnd;
        }
      }

      setWeeklyHistory(sortedWeeks);
    } catch (err) {
      console.error('Error loading conditioning history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, cohortId, db]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const toggleWeekExpanded = (weekId) => {
    setExpandedWeeks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(weekId)) {
        newSet.delete(weekId);
      } else {
        newSet.add(weekId);
      }
      return newSet;
    });
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate?.() || new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatWeekRange = (week) => {
    if (!week.weekStart || !week.weekEnd) return week.weekId;
    return `${formatDate(week.weekStart)} - ${formatDate(week.weekEnd)}`;
  };

  const getRepTypeLabel = (repType) => {
    const type = REP_TYPES.find(t => t.id === repType);
    return type?.label || repType || 'Rep';
  };

  const currentWeekId = getCurrentWeekId();
  const visibleHistory = weeklyHistory.slice(0, visibleWeeks);
  const hasMore = weeklyHistory.length > visibleWeeks;

  // No cohort = show enrollment prompt
  if (!cohortId) {
    return (
      <Card 
        title="Conditioning History" 
        icon={Dumbbell} 
        accent="NAVY"
        helpText={helpText}
      >
        <div className="text-center py-4">
          <Target className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Conditioning history will appear once you're enrolled in a cohort program.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title="Conditioning History" 
      icon={Dumbbell} 
      accent="NAVY"
      helpText={helpText}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-corporate-navy/20 border-t-corporate-navy rounded-full animate-spin" />
        </div>
      ) : weeklyHistory.length === 0 ? (
        <div className="text-center py-8">
          <Dumbbell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No conditioning reps yet</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
            Complete your first leadership rep to start building your history!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleHistory.map((week) => {
            const isCurrentWeek = week.weekId === currentWeekId;
            const isExpanded = expandedWeeks.has(week.weekId);
            const metRequirement = week.completedCount >= 1;

            return (
              <div 
                key={week.weekId}
                className={`rounded-xl border overflow-hidden ${
                  isCurrentWeek 
                    ? 'border-corporate-teal bg-teal-50/30 dark:bg-teal-900/20' 
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              >
                {/* Week Header */}
                <button
                  onClick={() => toggleWeekExpanded(week.weekId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      metRequirement 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : 'bg-amber-100 text-amber-600'
                    }`}>
                      {metRequirement ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
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
                        {week.completedCount} completed
                        {week.canceledCount > 0 && `, ${week.canceledCount} canceled`}
                        {!metRequirement && ' • Requirement not met'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-corporate-navy dark:text-white">
                      {week.completedCount}
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
                    {week.reps.length > 0 ? (
                      <div className="space-y-2">
                        {week.reps.map((rep, idx) => (
                          <button 
                            key={rep.id || idx}
                            onClick={() => setSelectedRep(rep)}
                            className="w-full flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-corporate-teal hover:bg-teal-50/30 dark:hover:bg-teal-900/20 transition-colors text-left cursor-pointer group"
                          >
                            <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              rep.status === REP_STATUS.COMPLETED
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-slate-100 dark:bg-slate-600 text-slate-400 dark:text-slate-300'
                            }`}>
                              {rep.status === REP_STATUS.COMPLETED ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-slate-800 dark:text-white">
                                  {rep.person || 'Unknown person'}
                                </span>
                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-full">
                                  {getRepTypeLabel(rep.repType)}
                                </span>
                                {rep.status === REP_STATUS.CANCELED && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                                    Canceled
                                  </span>
                                )}
                              </div>
                              {rep.completedAt && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                  Completed {formatDate(rep.completedAt)}
                                </p>
                              )}
                              {rep.cancelReason && (
                                <p className="text-xs text-red-500 mt-1">
                                  Reason: {rep.cancelReason}
                                </p>
                              )}
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-corporate-teal flex-shrink-0 mt-1" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-2">
                        No rep details available
                      </p>
                    )}
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
                  onClick={() => setVisibleWeeks(4)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all"
                >
                  Show Less
                </button>
              )}
              {hasMore && (
                <button 
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
      
      {/* Rep Detail Modal */}
      {selectedRep && (
        <RepDetailModal
          rep={selectedRep}
          onClose={() => setSelectedRep(null)}
        />
      )}
    </Card>
  );
};

export default ConditioningHistoryWidget;
