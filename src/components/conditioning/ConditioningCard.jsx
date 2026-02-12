// src/components/conditioning/ConditioningCard.jsx
// Dashboard Widget for Conditioning Layer
// Shows weekly rep status summary with link to full Conditioning screen

import React, { useState, useEffect, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  conditioningService, 
  REP_STATUS
} from '../../services/conditioningService.js';
import { Card } from '../ui';
import { 
  Target, CheckCircle, Clock, AlertTriangle, 
  ChevronRight, Dumbbell, Plus
} from 'lucide-react';

const ConditioningCard = ({ onNavigate }) => {
  const { user, userProfile, db } = useAppServices();
  const userId = user?.uid;
  const cohortId = userProfile?.cohortId;
  
  const [weeklyStatus, setWeeklyStatus] = useState(null);
  const [nudgeStatus, setNudgeStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const loadData = useCallback(async () => {
    if (!userId || !cohortId || !db) {
      setIsLoading(false);
      return;
    }
    
    try {
      // Check for overdue reps
      await conditioningService.checkAndMarkOverdueReps(db, userId, cohortId);
      
      const [status, nudge] = await Promise.all([
        conditioningService.getWeeklyStatus(db, userId, null, cohortId),
        conditioningService.getNudgeStatus(db, userId, cohortId)
      ]);
      
      setWeeklyStatus(status);
      setNudgeStatus(nudge);
    } catch (err) {
      console.error('Error loading conditioning status:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, cohortId, db]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Don't render if no cohort
  if (!cohortId) return null;
  
  // Loading state
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <div className="p-4">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    );
  }
  
  const { requiredRepCompleted, totalCompleted, totalActive, totalMissed } = weeklyStatus || {};
  const hasIssues = totalMissed > 0 || (nudgeStatus?.type === 'warning' || nudgeStatus?.type === 'urgent' || nudgeStatus?.type === 'escalation');
  
  // Determine CTA text based on state
  const ctaText = requiredRepCompleted 
    ? 'Commit to another Real Rep' 
    : 'Commit to your Real Rep';
  
  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
        hasIssues ? 'border-l-amber-500' : 
        requiredRepCompleted ? 'border-l-green-500' : 'border-l-gray-300'
      }`}
      onClick={() => onNavigate?.('conditioning')}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-corporate-navy" />
            <h3 className="font-bold text-corporate-navy">Conditioning</h3>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
        
        {/* Status Summary */}
        <div className="flex items-center gap-4 mb-3">
          {/* Requirement Status */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-sm ${
            requiredRepCompleted 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700' 
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
          }`}>
            {requiredRepCompleted ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Rep Done</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                <span className="font-medium">1 Rep Needed</span>
              </>
            )}
          </div>
          
          {/* Active Count */}
          {totalActive > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="w-4 h-4" />
              <span>{totalActive} active</span>
            </div>
          )}
          
          {/* Missed Count */}
          {totalMissed > 0 && (
            <div className="flex items-center gap-1 text-sm text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              <span>{totalMissed} missed</span>
            </div>
          )}
        </div>
        
        {/* Nudge Message (condensed) */}
        {nudgeStatus && nudgeStatus.type !== 'none' && !requiredRepCompleted && (
          <div className={`text-xs p-2 rounded ${
            nudgeStatus.type === 'urgent' || nudgeStatus.type === 'escalation'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700'
              : nudgeStatus.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700'
          }`}>
            {nudgeStatus.message}
          </div>
        )}
        
        {/* Success State */}
        {requiredRepCompleted && totalCompleted > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {totalCompleted} rep{totalCompleted !== 1 ? 's' : ''} completed this week
          </p>
        )}
        
        {/* CTA Button */}
        <div className={`flex items-center gap-2 mt-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
          requiredRepCompleted 
            ? 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 text-green-700' 
            : 'bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 text-amber-700'
        }`}>
          <Plus className="w-4 h-4" />
          <span>{ctaText}</span>
          <ChevronRight className="w-4 h-4 ml-auto" />
        </div>
      </div>
    </Card>
  );
};

export default ConditioningCard;
