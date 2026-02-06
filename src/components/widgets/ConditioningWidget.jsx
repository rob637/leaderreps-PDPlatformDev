// src/components/widgets/ConditioningWidget.jsx
// Dashboard widget for Conditioning - shows quick status and opens slide-in panel
// Replaces the old daily-leader-reps widget

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Dumbbell, Target, CheckCircle, Clock,
  ChevronRight, Plus, FileText, AlertCircle
} from 'lucide-react';
import { Card, Button } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import conditioningService, { REP_STATUS, getWeekBoundaries } from '../../services/conditioningService';
import Conditioning from '../screens/Conditioning';

// ============================================
// CONDITIONING SLIDE-IN PANEL
// ============================================
const ConditioningPanel = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-in Panel - Full screen on mobile, side panel on desktop */}
      <div 
        className={`absolute top-0 right-0 h-full w-full md:max-w-2xl bg-white shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Conditioning</h2>
              <p className="text-xs text-white/70">Leadership Rep Practice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white font-medium"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
        
        {/* Panel Content - Full Conditioning Screen */}
        <div className="h-[calc(100%-60px)] overflow-y-auto">
          <Conditioning embedded={true} />
        </div>
      </div>
    </div>,
    document.body
  );
};

// ============================================
// CONDITIONING WIDGET
// ============================================
const ConditioningWidget = ({ helpText }) => {
  const { user, db, developmentPlanData, userProfile } = useAppServices();
  const { cohortData } = useDailyPlan();
  const userId = user?.uid;
  const cohortId = developmentPlanData?.cohortId || cohortData?.id || userProfile?.cohortId;
  
  const [isPanelOpen, setIsPanelOpen] = useState(false);
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

  // Refresh when panel closes
  const handleClosePanel = () => {
    setIsPanelOpen(false);
    loadStatus(); // Refresh status
  };

  // No cohort = show enrollment prompt
  if (!cohortId) {
    return (
      <Card 
        title="Conditioning" 
        icon={Dumbbell} 
        accent="TEAL"
        helpText={helpText}
        data-gazoo-step="conditioning"
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

  return (
    <>
      <Card 
        title="Conditioning" 
        icon={Dumbbell} 
        accent="TEAL"
        helpText={helpText}
        data-gazoo-step="conditioning"
        variant="interactive"
        onClick={() => setIsPanelOpen(true)}
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
                ? 'bg-green-50 border border-green-200' 
                : 'bg-amber-50 border border-amber-200'
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
          </div>
        )}
      </Card>

      {/* Slide-in Panel */}
      <ConditioningPanel 
        isOpen={isPanelOpen} 
        onClose={handleClosePanel} 
      />
    </>
  );
};

export default ConditioningWidget;
