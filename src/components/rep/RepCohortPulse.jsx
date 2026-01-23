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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
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
          <div className="bg-rep-teal-light rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-corporate-teal">
              {activeLeaders}/{totalLeaders}
            </div>
            <div className="text-xs text-rep-text-secondary font-medium">
              Active Today
            </div>
          </div>

          {/* Today's Completions */}
          <div className="bg-rep-navy-light rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-corporate-navy">
              {completionPercent}%
            </div>
            <div className="text-xs text-rep-text-secondary font-medium">
              Today's Reps Done
            </div>
          </div>

          {/* Weekly Wins */}
          <div className="flex items-center gap-2 bg-rep-coral-light rounded-lg p-3">
            <Trophy className="w-5 h-5 text-corporate-orange" />
            <div>
              <div className="text-lg font-bold text-corporate-orange">{weeklyWins}</div>
              <div className="text-xs text-rep-text-secondary">Wins This Week</div>
            </div>
          </div>

          {/* Top Focus */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
            <TrendingUp className="w-5 h-5 text-rep-text-secondary" />
            <div>
              <div className="text-sm font-medium text-rep-text-primary truncate">{topFocus}</div>
              <div className="text-xs text-rep-text-secondary">Top Focus</div>
            </div>
          </div>
        </div>

        {/* Next Event (if available) */}
        {nextEvent && (
          <div className="mt-3 flex items-center gap-2 text-sm text-rep-text-secondary bg-rep-warm-white rounded-lg p-3 border border-dashed border-gray-200">
            <Calendar className="w-4 h-4 text-corporate-teal" />
            <span>Next: <span className="font-medium text-rep-text-primary">{nextEvent}</span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepCohortPulse;
