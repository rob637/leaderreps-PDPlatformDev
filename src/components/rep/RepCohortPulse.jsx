// src/components/rep/RepCohortPulse.jsx
// Shows community awareness - how the cohort is doing

import React from 'react';
import { Users, Trophy, Calendar, TrendingUp } from 'lucide-react';

/**
 * RepCohortPulse - Quick community stats shown within Rep conversation
 * Creates "we're in this together" feeling
 */
const RepCohortPulse = ({ 
  cohortName = 'Your Cohort',
  activeLeaders = 0,
  totalLeaders = 0,
  todayCompletions = 0,
  weeklyWins = 0,
  topFocus = 'Leadership Growth',
  nextEvent = null
}) => {
  const completionPercent = totalLeaders > 0 
    ? Math.round((todayCompletions / totalLeaders) * 100) 
    : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-corporate-navy to-corporate-teal px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">{cohortName}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Active Leaders */}
          <div className="bg-teal-50 dark:bg-teal-900/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-corporate-teal dark:text-teal-400">
              {activeLeaders}/{totalLeaders}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Active Today
            </div>
          </div>

          {/* Today's Completions */}
          <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-corporate-navy dark:text-slate-200">
              {completionPercent}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Today's Reps Done
            </div>
          </div>

          {/* Weekly Wins */}
          <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
            <Trophy className="w-5 h-5 text-corporate-orange dark:text-orange-400" />
            <div>
              <div className="text-lg font-bold text-corporate-orange dark:text-orange-400">{weeklyWins}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Wins This Week</div>
            </div>
          </div>

          {/* Top Focus */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <TrendingUp className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            <div>
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{topFocus}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Top Focus</div>
            </div>
          </div>
        </div>

        {/* Next Event (if available) */}
        {nextEvent && (
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 border border-dashed border-gray-200 dark:border-gray-600">
            <Calendar className="w-4 h-4 text-corporate-teal dark:text-teal-400" />
            <span>Next: <span className="font-medium text-slate-800 dark:text-slate-200">{nextEvent}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepCohortPulse;
