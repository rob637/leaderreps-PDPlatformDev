// src/components/widgets/ConditioningWidget.jsx
// Dashboard widget for Conditioning - navigates to full Conditioning screen
// V1 UX Update: Removed slide-in panel in favor of consistent navigation

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dumbbell, Target, CheckCircle, Clock,
  ChevronRight, Plus, FileText, AlertCircle
} from 'lucide-react';
import { Card, Button } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import conditioningService, { REP_STATUS, getWeekBoundaries } from '../../services/conditioningService';

// ============================================
// CONDITIONING WIDGET
// ============================================
const ConditioningWidget = ({ helpText }) => {
  const { user, db, developmentPlanData, userProfile, navigate } = useAppServices();
  const { cohortData } = useDailyPlan();
  const userId = user?.uid;
  const cohortId = developmentPlanData?.cohortId || cohortData?.id || userProfile?.cohortId;
  
  const [weeklyStatus, setWeeklyStatus] = useState(null);
  const [activeCount, setActiveCount] = useState(0);
  const [pendingDebriefs, setPendingDebriefs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load quick status data
  const loadStatus = useCallback(async () => {
    if (!userId || !cohortId || !db) {
      setIsLoading(false);
      return;
    }

    try {
      const [status, active] = await Promise.all([
        conditioningService.getWeeklyStatus(db, userId, null, cohortId),
        conditioningService.getActiveReps(db, userId, cohortId)
      ]);
      
      setWeeklyStatus(status);
      setActiveCount(active?.length || 0);
      
      // Count completed reps without evidence (pending debriefs)
      const completedReps = (status?.reps || []).filter(r => r.status === REP_STATUS.COMPLETED);
      let pendingCount = 0;
      for (const rep of completedReps) {
        const evidence = await conditioningService.getEvidence(db, userId, rep.id);
        if (!evidence) pendingCount++;
      }
      setPendingDebriefs(pendingCount);
    } catch (err) {
      console.error('Error loading conditioning status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, cohortId, db]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Handle navigation to conditioning screen
  const handleNavigate = () => {
    navigate?.('conditioning');
  };

  // No cohort = show enrollment prompt
  if (!cohortId) {
    return (
      <Card 
        title="Conditioning" 
        icon={Dumbbell} 
        accent="TEAL"
        helpText={helpText}
        data-repup-step="conditioning"
      >
        <div className="text-center py-2">
          <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-600 text-sm">
            Conditioning is available when you're enrolled in a cohort program.
          </p>
        </div>
      </Card>
    );
  }

  const { weekStart, weekEnd } = getWeekBoundaries();
  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  
  const requiredMet = weeklyStatus?.requiredRepCompleted || false;
  const completedCount = weeklyStatus?.totalCompleted || 0;
  
  // CTA text based on state
  const ctaText = requiredMet 
    ? 'Commit to another Real Rep' 
    : 'Commit to your Real Rep';

  return (
    <Card 
      title="Conditioning Real Rep" 
      icon={Dumbbell} 
      accent="TEAL"
      helpText={helpText}
      data-repup-step="conditioning"
      variant="interactive"
      onClick={handleNavigate}
    >
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-corporate-teal/20 border-t-corporate-teal rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Weekly Requirement Status */}
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              requiredMet 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            }`}>
              {requiredMet ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-green-800 text-sm">Weekly Requirement Met!</p>
                    <p className="text-xs text-green-600">{completedCount} rep{completedCount !== 1 ? 's' : ''} completed this week</p>
                  </div>
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-amber-800 text-sm">1 Rep Required This Week</p>
                    <p className="text-xs text-amber-600">
                      {activeCount > 0 
                        ? `${activeCount} active rep${activeCount !== 1 ? 's' : ''} in progress`
                        : 'Commit to a rep to get started'
                      }
                    </p>
                  </div>
                </>
              )}
              <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>

            {/* Pending Debriefs Alert */}
            {pendingDebriefs > 0 && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs text-amber-700">
                  <strong>{pendingDebriefs}</strong> rep{pendingDebriefs !== 1 ? 's' : ''} need{pendingDebriefs === 1 ? 's' : ''} debrief
                </span>
              </div>
            )}

            {/* Quick Stats */}
            <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span><strong>{completedCount}</strong> Completed</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span><strong>{activeCount}</strong> Active</span>
                </div>
              </div>
              <span className="text-xs text-slate-400">
                {formatDate(weekStart)} - {formatDate(weekEnd)}
              </span>
            </div>
            
            {/* CTA Button */}
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
              requiredMet 
                ? 'bg-green-100 hover:bg-green-200 text-green-700' 
                : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
            }`}>
              <Plus className="w-4 h-4" />
              <span>{ctaText}</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </div>
          </div>
        )}
      </Card>
  );
};

export default ConditioningWidget;
