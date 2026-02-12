// src/components/screens/Conditioning.jsx
// Conditioning Layer - Real Leadership Rep Accountability
// Mobile-first design for use between Foundation sessions
// Updated for 16 Rep Types (020726)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useDailyPlan } from '../../hooks/useDailyPlan.js';
import { useSafeNavigation } from '../../providers/NavigationProvider.jsx';
import conditioningService, { 
  REP_STATUS, 
  getWeekBoundaries,
  STATE_TRANSITIONS
} from '../../services/conditioningService.js';
import { REP_TYPES, getRepType, isPrepRequired } from '../../services/repTaxonomy.js';
import { Card, Button, PageLayout } from '../ui';
import { 
  StructuredEvidenceModal,
  QualityAssessmentCard,
  PracticeRetryCard,
  TrainerNudgeNotification,
  CommitRepForm,
  RepTypeBadge,
  PrepRequirementBadge,
  HighRiskPrepModal,
  MissedRepDebriefModal,
  LoopClosureModal,
  RepDetailModal
} from '../conditioning';
import { 
  Plus, Check, X, AlertTriangle, Clock, User, 
  ChevronRight, RefreshCw, MessageSquare, Users,
  Target, Calendar, CheckCircle, XCircle, AlertCircle,
  FileText, Lightbulb, Dumbbell, Sparkles, HelpCircle
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

// ============================================
// STATUS BADGE COMPONENT (Updated for new states)
// ============================================
const StatusBadge = ({ status }) => {
  const configs = {
    // New granular states
    [REP_STATUS.COMMITTED]: { 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-700', 
      label: 'Committed',
      icon: Clock
    },
    [REP_STATUS.PREPARED]: { 
      bg: 'bg-indigo-100 dark:bg-indigo-900/30', 
      text: 'text-indigo-700', 
      label: 'Prepared',
      icon: FileText
    },
    [REP_STATUS.SCHEDULED]: { 
      bg: 'bg-purple-100 dark:bg-purple-900/30', 
      text: 'text-purple-700', 
      label: 'Scheduled',
      icon: Calendar
    },
    [REP_STATUS.EXECUTED]: { 
      bg: 'bg-teal-100 dark:bg-teal-900/30', 
      text: 'text-teal-700', 
      label: 'Executed',
      icon: Check
    },
    [REP_STATUS.DEBRIEFED]: { 
      bg: 'bg-green-100 dark:bg-green-900/30', 
      text: 'text-green-700', 
      label: 'Debriefed',
      icon: CheckCircle
    },
    [REP_STATUS.FOLLOW_UP_PENDING]: { 
      bg: 'bg-orange-100 dark:bg-orange-900/30', 
      text: 'text-orange-700', 
      label: 'Follow-Up',
      icon: RefreshCw
    },
    [REP_STATUS.LOOP_CLOSED]: { 
      bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
      text: 'text-emerald-700', 
      label: 'Loop Closed',
      icon: CheckCircle
    },
    [REP_STATUS.MISSED]: { 
      bg: 'bg-amber-100 dark:bg-amber-900/30', 
      text: 'text-amber-700', 
      label: 'Missed',
      icon: AlertCircle
    },
    [REP_STATUS.CANCELED]: { 
      bg: 'bg-gray-100 dark:bg-gray-700', 
      text: 'text-gray-500 dark:text-gray-400', 
      label: 'Canceled',
      icon: XCircle
    },
    // Legacy aliases - map to new states
    'active': { 
      bg: 'bg-blue-100 dark:bg-blue-900/30', 
      text: 'text-blue-700', 
      label: 'Active',
      icon: Clock
    },
    'completed': { 
      bg: 'bg-green-100 dark:bg-green-900/30', 
      text: 'text-green-700', 
      label: 'Complete',
      icon: CheckCircle
    }
  };
  
  const config = configs[status] || configs[REP_STATUS.COMMITTED];
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Note: RepTypeBadge is now imported from ../conditioning

// ============================================
// WEEK STATUS HEADER
// ============================================
const WeekStatusStrip = ({ weeklyStatus }) => {
  const { weekStart, weekEnd, requiredRepCompleted } = weeklyStatus || {};
  
  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm ${
      requiredRepCompleted 
        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
    }`}>
      <div className="flex items-center gap-2">
        {requiredRepCompleted ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-700 dark:text-green-300">Weekly requirement met</span>
          </>
        ) : (
          <>
            <Target className="w-4 h-4 text-amber-600" />
            <span className="font-medium text-amber-700 dark:text-amber-300">1 rep required this week</span>
          </>
        )}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {formatDate(weekStart)} - {formatDate(weekEnd)}
      </span>
    </div>
  );
};

// ============================================
// TODAY'S FOCUS CARD (Helps users know what to do NOW)
// ============================================
const TodaysFocusCard = ({ activeReps, onOpenPrep, onViewDetail, onAskCoach }) => {
  // Find the most urgent rep to focus on
  const focusRep = useMemo(() => {
    if (!activeReps || activeReps.length === 0) return null;
    
    // Priority: overdue > due today > due tomorrow > earliest deadline
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const sorted = [...activeReps].sort((a, b) => {
      const aDeadline = a.deadline?.toDate?.() || new Date(a.deadline) || new Date();
      const bDeadline = b.deadline?.toDate?.() || new Date(b.deadline) || new Date();
      return aDeadline - bDeadline;
    });
    
    // Find overdue or due today/tomorrow
    for (const rep of sorted) {
      const deadline = rep.deadline?.toDate?.() || new Date(rep.deadline);
      if (deadline < now) return { ...rep, urgency: 'overdue' };
      if (deadline < tomorrow) return { ...rep, urgency: 'today' };
    }
    
    // Otherwise return earliest
    return sorted[0] ? { ...sorted[0], urgency: 'upcoming' } : null;
  }, [activeReps]);
  
  if (!focusRep) return null;
  
  const deadline = focusRep.deadline?.toDate?.() || new Date(focusRep.deadline);
  const formatDeadline = () => {
    if (focusRep.urgency === 'overdue') return 'Overdue!';
    if (focusRep.urgency === 'today') return 'Due today';
    return deadline.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const needsPrep = focusRep.status === 'committed' && !focusRep.preparedAt;
  
  return (
    <Card className="mb-4 bg-gradient-to-r from-corporate-teal/10 to-corporate-navy/5 border-corporate-teal/20">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-corporate-teal" />
          <span className="text-xs font-semibold text-corporate-teal uppercase tracking-wide">Today's Focus</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-corporate-navy truncate">{focusRep.person}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {focusRep.repType?.replace(/_/g, ' ') || 'Leadership Rep'} • {formatDeadline()}
            </p>
          </div>
          <button
            onClick={() => needsPrep ? onOpenPrep?.(focusRep) : onViewDetail?.(focusRep)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              needsPrep 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-corporate-teal hover:bg-corporate-teal/90 text-white'
            }`}
          >
            {needsPrep ? 'Prep Now' : 'Take Action'}
          </button>
        </div>
        {onAskCoach && (
          <button
            onClick={onAskCoach}
            className="mt-3 text-xs text-corporate-navy/70 hover:text-corporate-teal flex items-center gap-1 transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            Nervous? Talk it through with your coach first
          </button>
        )}
      </div>
    </Card>
  );
};

// ============================================
// REP CARD COMPONENT (Updated for Sprint 2)
// ============================================
const RepCard = ({ 
  rep, 
  onComplete, 
  onCancel, 
  onAddDebrief, 
  onCloseLoop,
  onViewDetail,
  onPractice, 
  onStateChange,
  onOpenPrep,
  evidence, 
  isLoading 
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  const formatDeadline = (deadline) => {
    if (!deadline) return 'End of week';
    const d = deadline.toDate ? deadline.toDate() : new Date(deadline);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  // Check if rep is overdue (only for active/pending states)
  const isOverdue = useMemo(() => {
    // States that can be overdue: committed, prepared, scheduled
    const activeStates = ['committed', 'prepared', 'scheduled', 'active'];
    if (!rep.deadline || !activeStates.includes(rep.status)) return false;
    const deadline = rep.deadline.toDate ? rep.deadline.toDate() : new Date(rep.deadline);
    return deadline < new Date();
  }, [rep.deadline, rep.status]);
  
  // Check if prep is required but not done
  const needsPrep = useMemo(() => {
    if (rep.status !== 'committed') return false;
    return isPrepRequired(rep.repType, rep.riskLevel) && !rep.preparedAt;
  }, [rep.repType, rep.riskLevel, rep.status, rep.preparedAt]);
  
  const handleCancelSubmit = () => {
    if (cancelReason.trim()) {
      onCancel(rep.id, cancelReason.trim());
      setShowCancelModal(false);
      setCancelReason('');
    }
  };
  
  // Handle state change - route through prep if needed
  const handleStateChange = (repId, newState) => {
    if (newState === 'executed' && needsPrep) {
      // Open prep modal instead of executing directly
      onOpenPrep?.(rep);
      return;
    }
    
    if (newState === 'prepared') {
      // Open prep modal
      onOpenPrep?.(rep);
      return;
    }
    
    if (newState === 'debriefed') {
      // Route to debrief
      onAddDebrief?.(rep);
      return;
    }
    
    // Direct state transition
    onStateChange?.(repId, newState);
  };
  
  // States that allow taking action (complete/cancel)
  const activeStates = ['committed', 'prepared', 'scheduled', 'active'];
  const canTakeAction = activeStates.includes(rep.status) || rep.status === REP_STATUS.MISSED;
  
  return (
    <>
      <Card className={`mb-3 ${isOverdue ? 'border-l-4 border-l-amber-500' : ''}`}>
        <div className="p-4">
          {/* Header Row - Clickable to view details */}
          <div 
            className="flex items-start justify-between mb-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onViewDetail?.(rep)}
          >
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-corporate-navy" />
              <span className="font-semibold text-corporate-navy">{rep.person}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
            <StatusBadge status={rep.status} />
          </div>
          
          {/* Type & Deadline Row */}
          <div className="flex items-center gap-3 mb-3 text-sm text-gray-600 dark:text-gray-300">
            <RepTypeBadge repType={rep.repType} />
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span className={isOverdue ? 'text-amber-600 font-medium' : ''}>
                {formatDeadline(rep.deadline)}
              </span>
            </div>
          </div>
          
          {/* Prep Requirement Badge - only show when prep IS required */}
          {canTakeAction && isPrepRequired(rep.repType, rep.riskLevel) && (
            <div className="mb-3">
              <PrepRequirementBadge 
                repType={rep.repType} 
                riskLevel={rep.riskLevel} 
                prepCompleted={!!rep.preparedAt}
                size="small" 
              />
            </div>
          )}
          
          {/* Notes */}
          {rep.notes && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 italic">"{rep.notes}"</p>
          )}
          
          {/* Rolled Forward Indicator */}
          {rep.rolledForwardFrom && (
            <div className="flex items-center gap-1 text-xs text-amber-600 mb-3">
              <RefreshCw className="w-3 h-3" />
              <span>Rolled forward from previous week</span>
            </div>
          )}
          
          {/* Cancel Reason */}
          {rep.status === REP_STATUS.CANCELED && rep.cancelReason && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              <span className="font-medium">Reason:</span> {rep.cancelReason}
            </div>
          )}
          
          {/* Quick Action Buttons - Active/Missed Reps */}
          {canTakeAction && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              {needsPrep ? (
                <Button
                  onClick={() => onOpenPrep?.(rep)}
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2"
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Complete Prep First
                </Button>
              ) : (
                <Button
                  onClick={() => handleStateChange(rep.id, 'executed')}
                  disabled={isLoading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark Executed
                </Button>
              )}
              <Button
                onClick={() => setShowCancelModal(true)}
                disabled={isLoading}
                variant="outline"
                className="py-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {/* Executed Rep - Needs Debrief */}
          {rep.status === 'executed' && (
            <div className="pt-2 border-t border-gray-100">
              <Button
                onClick={() => onAddDebrief?.(rep)}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2"
              >
                <FileText className="w-4 h-4 mr-2" />
                Add Debrief to Complete
              </Button>
            </div>
          )}
          
          {/* Completed/Debriefed Rep - Show AI feedback */}
          {(rep.status === 'debriefed' || rep.status === 'completed') && (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              {evidence ? (
                <>
                  {/* Full Quality Assessment - AI reviewed feedback */}
                  {evidence.qualityAssessment && (
                    <QualityAssessmentCard 
                      qualityAssessment={evidence.qualityAssessment}
                      onPractice={onPractice ? (dimension, response) => onPractice(rep, dimension, response) : null}
                      compact={false}
                    />
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Debrief submitted</span>
                    </div>
                    <button
                      onClick={() => onCloseLoop?.(rep)}
                      className="text-xs text-corporate-teal hover:underline"
                    >
                      Close the loop →
                    </button>
                  </div>
                </>
              ) : (
                <Button
                  onClick={() => onAddDebrief?.(rep)}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full py-2 border-corporate-navy text-corporate-navy hover:bg-corporate-navy/5"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Add Debrief
                </Button>
              )}
            </div>
          )}
          
          {/* Follow-Up Pending - Show Close Loop option */}
          {rep.status === 'follow_up_pending' && (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              {/* AI Review */}
              {evidence?.qualityAssessment && (
                <QualityAssessmentCard 
                  qualityAssessment={evidence.qualityAssessment}
                  onPractice={onPractice ? (dimension, response) => onPractice(rep, dimension, response) : null}
                  compact={false}
                />
              )}
              <div className="flex items-center gap-2 text-xs text-orange-600 mb-2">
                <RefreshCw className="w-3 h-3" />
                <span>Tracking follow-up</span>
              </div>
              <Button
                onClick={() => onCloseLoop?.(rep)}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Close the Loop
              </Button>
            </div>
          )}
          
          {/* Loop Closed - Show completion */}
          {rep.status === 'loop_closed' && (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              {/* AI Review */}
              {evidence?.qualityAssessment && (
                <QualityAssessmentCard 
                  qualityAssessment={evidence.qualityAssessment}
                  onPractice={onPractice ? (dimension, response) => onPractice(rep, dimension, response) : null}
                  compact={false}
                />
              )}
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <CheckCircle className="w-3 h-3" />
                <span>Loop closed - Rep complete</span>
              </div>
              {rep.loopClosure?.outcome && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Outcome: {rep.loopClosure.outcome.replace(/_/g, ' ')}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
      
      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-4">
              <h3 className="text-lg font-bold text-corporate-navy mb-2">Cancel Rep</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Why are you canceling this rep? (Required)
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Person left role, meeting canceled..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm mb-4 min-h-[100px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowCancelModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCancelSubmit}
                  disabled={!cancelReason.trim() || isLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  Cancel Rep
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

// Note: CommitRepForm is now imported from ../conditioning

// ============================================
// MISSED REPS SECTION (Updated for Sprint 4)
// ============================================
const MissedRepsSection = ({ missedReps, onOpenDebrief, onRescueRep, isLoading }) => {
  if (!missedReps || missedReps.length === 0) return null;
  
  // Get rep type label using getRepType helper
  const getRepTypeLabel = (repTypeId) => {
    const repType = getRepType(repTypeId);
    return repType?.shortLabel || repType?.label || repTypeId;
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-corporate-navy">Missed Reps ({missedReps.length})</h3>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        Complete a quick debrief to understand what happened, or mark as done if you actually completed it.
      </p>
      {missedReps.map((rep) => (
        <Card key={rep.id} className="mb-2 border-l-4 border-l-amber-500">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium">{rep.person}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({getRepTypeLabel(rep.repType)})</span>
                {rep.missedDebrief && (
                  <span className="text-xs text-green-600 ml-2">✓ Debriefed</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onRescueRep && (
                <Button
                  onClick={() => onRescueRep(rep)}
                  disabled={isLoading}
                  size="sm"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  <Check className="w-3 h-3 mr-1" />
                  I did it
                </Button>
              )}
              <Button
                onClick={() => onOpenDebrief(rep)}
                disabled={isLoading}
                size="sm"
                className={`flex-1 ${
                  rep.missedDebrief 
                    ? 'bg-gray-500 hover:bg-gray-600 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                <FileText className="w-3 h-3 mr-1" />
                {rep.missedDebrief ? 'Re-debrief' : 'Couldn\'t do it'}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ============================================
// MAIN CONDITIONING SCREEN
// ============================================
const Conditioning = ({ embedded = false, showFloatingAction, onAskCoach }) => {
  // Default FAB visibility: show unless embedded (but can be overridden)
  const showFab = showFloatingAction ?? !embedded;
  const { user, developmentPlanData, db } = useAppServices();
  const { cohortData } = useDailyPlan();
  
  // Get navigation params (for opening commit form via navigation)
  // Uses safe version since Conditioning can be used outside NavigationProvider (e.g., RepUpApp)
  const navigation = useSafeNavigation();
  const navParams = navigation?.navParams || {};
  const userId = user?.uid;
  const cohortId = developmentPlanData?.cohortId || cohortData?.id || user?.cohortId;
  
  // State
  const [weeklyStatus, setWeeklyStatus] = useState(null);
  const [activeReps, setActiveReps] = useState([]);
  const [missedReps, setMissedReps] = useState([]);
  const [completedReps, setCompletedReps] = useState([]);
  const [evidenceMap, setEvidenceMap] = useState({});
  const [pendingRetries, setPendingRetries] = useState([]);
  const [nudgeStatus, setNudgeStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommitForm, setShowCommitForm] = useState(false);
  const [evidenceModalRep, setEvidenceModalRep] = useState(null);
  const [error, setError] = useState(null);
  
  // Load data
  const loadData = useCallback(async () => {
    if (!userId || !cohortId || !db) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Check for overdue reps first
      await conditioningService.checkAndMarkOverdueReps(db, userId, cohortId);
      
      // Load all data in parallel
      const [status, active, missed, nudge, retries] = await Promise.all([
        conditioningService.getWeeklyStatus(db, userId, null, cohortId),
        conditioningService.getActiveReps(db, userId, cohortId),
        conditioningService.getMissedReps(db, userId, cohortId),
        conditioningService.getNudgeStatus(db, userId, cohortId),
        conditioningService.getPendingRetries(db, userId)
      ]);
      
      // Separate active reps from missed ones in the active list
      // Filter for active states = reps needing user attention
      // 'executed' = done but needs debrief
      // 'follow_up_pending' = debriefed but needs loop closure
      const activeStates = ['committed', 'prepared', 'scheduled', 'executed', 'follow_up_pending', 'active'];
      const currentWeekActive = active.filter(r => activeStates.includes(r.status));
      
      // Get completed reps from weekly status
      // Filter for completed states = reps fully done (shown in "Completed This Week")
      const completedStates = ['debriefed', 'loop_closed', 'completed'];
      const completed = (status?.reps || []).filter(r => completedStates.includes(r.status));
      
      // Load evidence for completed reps
      const evidencePromises = completed.map(async (rep) => {
        const evidence = await conditioningService.getEvidence(db, userId, rep.id);
        return { repId: rep.id, evidence };
      });
      const evidenceResults = await Promise.all(evidencePromises);
      const newEvidenceMap = {};
      evidenceResults.forEach(({ repId, evidence }) => {
        if (evidence) {
          newEvidenceMap[repId] = evidence;
        }
      });
      
      setWeeklyStatus(status);
      setActiveReps(currentWeekActive);
      setCompletedReps(completed);
      setMissedReps(missed);
      setNudgeStatus(nudge);
      setPendingRetries(retries);
      setEvidenceMap(newEvidenceMap);
    } catch (err) {
      console.error('Error loading conditioning data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, cohortId, db]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Auto-open commit form if navigated with openCommitForm param
  useEffect(() => {
    if (navParams?.openCommitForm) {
      setShowCommitForm(true);
    }
  }, [navParams?.openCommitForm]);
  
  // Handlers
  const handleCommitRep = async (repData) => {
    console.log('[Conditioning] handleCommitRep called', { userId, cohortId, hasDb: !!db, repData });
    
    if (!userId || !cohortId || !db) {
      console.error('[Conditioning] Cannot commit rep - missing:', { userId: !userId, cohortId: !cohortId, db: !db });
      setError('Unable to commit rep. Please make sure you are enrolled in a cohort.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('[Conditioning] Calling conditioningService.commitRep...');
      const repId = await conditioningService.commitRep(db, userId, {
        ...repData,
        cohortId
      });
      console.log('[Conditioning] Rep committed successfully:', repId);
      setShowCommitForm(false);
      await loadData();
    } catch (err) {
      console.error('[Conditioning] Error committing rep:', err);
      setError(`Failed to commit rep: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCompleteRep = async (repId) => {
    if (!userId || !db) return;
    
    try {
      setIsSubmitting(true);
      await conditioningService.completeRep(db, userId, repId);
      await loadData();
    } catch (err) {
      console.error('Error completing rep:', err);
      setError('Failed to complete rep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelRep = async (repId, reason) => {
    if (!userId || !db) return;
    
    try {
      setIsSubmitting(true);
      await conditioningService.cancelRep(db, userId, repId, reason);
      await loadData();
    } catch (err) {
      console.error('Error canceling rep:', err);
      setError('Failed to cancel rep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRollForward = async (repId) => {
    if (!userId || !cohortId || !db) return;
    
    try {
      setIsSubmitting(true);
      await conditioningService.rollForwardRep(db, userId, repId, cohortId);
      await loadData();
    } catch (err) {
      console.error('Error rolling forward rep:', err);
      setError('Failed to recommit rep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Phase 2: Evidence submission handler
  const handleEvidenceSubmitted = async () => {
    setEvidenceModalRep(null);
    await loadData();
  };
  
  // Phase 2: Practice retry handler
  const handleStartPractice = async (rep, dimension, response) => {
    if (!userId || !db) return;
    
    try {
      // Create the practice retry
      const retryId = await conditioningService.createPracticeRetry(db, userId, rep.id, dimension);
      // Immediately complete it with the user's response
      if (response) {
        await conditioningService.completePracticeRetry(db, userId, retryId, response);
      }
      // Don't call loadData() — the inline UI handles success state
    } catch (err) {
      console.error('Error saving practice:', err);
      throw err; // Re-throw so DimensionRow can handle it
    }
  };
  
  // Phase 2: Practice completed handler
  const handlePracticeComplete = async () => {
    await loadData();
  };
  
  // Sprint 2: State transition handler
  const [prepModalRep, setPrepModalRep] = useState(null);
  
  const handleStateChange = async (repId, newState) => {
    if (!userId || !db) return;
    
    try {
      setIsSubmitting(true);
      await conditioningService.transitionRepState(db, userId, repId, newState);
      await loadData();
    } catch (err) {
      console.error('Error transitioning rep state:', err);
      setError(`Failed to update rep state: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Rescue a missed rep - mark as executed (user actually did it)
  const handleRescueMissedRep = async (rep) => {
    if (!userId || !db) return;
    
    try {
      setIsSubmitting(true);
      await conditioningService.transitionRepState(db, userId, rep.id, 'executed');
      await loadData();
    } catch (err) {
      console.error('Error rescuing missed rep:', err);
      setError('Failed to update rep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Sprint 2: Open prep modal
  const handleOpenPrep = (rep) => {
    setPrepModalRep(rep);
  };
  
  // Sprint 2: Submit prep and transition to prepared state
  const handlePrepSubmit = async (prepData) => {
    if (!userId || !db || !prepModalRep) return;
    
    try {
      setIsSubmitting(true);
      await conditioningService.saveRepPrep(db, userId, prepData.repId, prepData);
      setPrepModalRep(null);
      await loadData();
    } catch (err) {
      console.error('Error saving prep:', err);
      setError('Failed to save prep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Sprint 4: Missed rep debrief modal state
  const [missedDebriefRep, setMissedDebriefRep] = useState(null);
  
  const handleOpenMissedDebrief = (rep) => {
    setMissedDebriefRep(rep);
  };
  
  const handleMissedRecommit = async (repId) => {
    if (!userId || !cohortId || !db) return;
    try {
      setIsSubmitting(true);
      await conditioningService.rollForwardRep(db, userId, repId, cohortId);
      setMissedDebriefRep(null);
      await loadData();
    } catch (err) {
      console.error('Error recommitting rep:', err);
      setError('Failed to recommit rep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMissedModify = (rep) => {
    // Close debrief modal and open commit form with rep data pre-filled
    setMissedDebriefRep(null);
    setShowCommitForm(true);
    // Note: Could pass rep data to pre-fill the form in future enhancement
  };
  
  const handleMissedCancel = async (repId, reason) => {
    if (!userId || !db) return;
    try {
      setIsSubmitting(true);
      await conditioningService.cancelRep(db, userId, repId, reason);
      setMissedDebriefRep(null);
      await loadData();
    } catch (err) {
      console.error('Error canceling rep:', err);
      setError('Failed to cancel rep. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Phase 5: Loop closure modal state
  const [loopClosureRep, setLoopClosureRep] = useState(null);
  
  const handleOpenLoopClosure = (rep) => {
    setLoopClosureRep(rep);
  };
  
  const handleLoopClosureSubmit = async (closureData) => {
    if (!userId || !db) return;
    try {
      setIsSubmitting(true);
      await conditioningService.closeLoop(db, userId, closureData.repId, closureData);
      setLoopClosureRep(null);
      await loadData();
    } catch (err) {
      console.error('Error closing loop:', err);
      setError('Failed to close loop. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Phase 6: Rep detail modal state
  const [detailModalRep, setDetailModalRep] = useState(null);
  
  const handleOpenRepDetail = (rep) => {
    setDetailModalRep(rep);
  };
  
  // No cohort check
  if (!cohortId) {
    return (
      <PageLayout 
        title="Conditioning" 
        subtitle="Real leadership reps between sessions"
        icon={Target}
      >
        <Card className="p-6 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-corporate-navy mb-2">No Cohort Assigned</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Conditioning is available for leaders enrolled in a cohort program.
          </p>
        </Card>
      </PageLayout>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <PageLayout 
        title="Conditioning" 
        subtitle="Real leadership reps between sessions"
        icon={Target}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-corporate-navy animate-spin mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout 
      title="Conditioning" 
      subtitle="Real leadership reps between sessions"
      icon={Target}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Error Banner */}
        {error && (
          <Card className="mb-4 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20">
            <div className="p-3 flex items-center justify-between">
              <span className="text-red-700 text-sm">{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>
        )}
        
        {/* Compact Week Status */}
        <WeekStatusStrip weeklyStatus={weeklyStatus} />
        
        {/* Today's Focus Card - Only shown when 3+ active reps to help prioritize */}
        {activeReps.length >= 3 && (
          <TodaysFocusCard 
            activeReps={activeReps}
            onOpenPrep={handleOpenPrep}
            onViewDetail={handleOpenRepDetail}
            onAskCoach={onAskCoach}
          />
        )}
        
        {/* Trainer Nudge Notifications */}
        <TrainerNudgeNotification db={db} userId={userId} />
        
        {/* Missed Reps Section */}
        <MissedRepsSection 
          missedReps={missedReps}
          onOpenDebrief={handleOpenMissedDebrief}
          onRescueRep={handleRescueMissedRep}
          isLoading={isSubmitting}
        />
        
        {/* Active Reps */}
        <div className="mb-6">
          {activeReps.length > 1 && (
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-corporate-navy">Active Reps</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">{activeReps.length} reps</span>
            </div>
          )}
          
          {activeReps.length === 0 ? (
            completedReps.length > 0 || weeklyStatus?.totalCompleted > 0 ? (
              // Compact prompt when user already has completed reps
              <div className="flex items-center justify-center gap-3 py-4">
                <Button
                  onClick={() => setShowCommitForm(true)}
                  variant="outline"
                  className="border-corporate-teal text-corporate-teal hover:bg-corporate-teal/5 px-6"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Commit to Another Rep
                </Button>
              </div>
            ) : (
              // First-time user - show introductory messaging
              <Card className="p-8 text-center border-dashed border-2 border-corporate-teal/30 bg-gradient-to-br from-corporate-teal/5 to-transparent">
                <div className="w-16 h-16 mx-auto mb-4 bg-corporate-teal/10 rounded-full flex items-center justify-center">
                  <Dumbbell className="w-8 h-8 text-corporate-teal" />
                </div>
                <h3 className="font-bold text-lg text-corporate-navy mb-2">Ready to Build Your Leadership Muscle?</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2 max-w-sm mx-auto">
                  A "rep" is a real leadership moment you commit to practicing — 
                  like giving feedback, having a tough conversation, or delegating effectively.
                </p>
                <p className="text-sm text-corporate-teal font-medium mb-4">
                  Just 1 rep per week builds the habit.
                </p>
                <Button
                  onClick={() => setShowCommitForm(true)}
                  className="bg-corporate-navy hover:bg-corporate-navy/90 text-white px-6"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Commit to Your First Rep
                </Button>
                {onAskCoach && (
                  <button
                    onClick={onAskCoach}
                    className="mt-3 text-sm text-corporate-teal hover:underline flex items-center gap-1 mx-auto"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Not sure where to start? Ask your coach
                  </button>
                )}
              </Card>
            )
          ) : (
            activeReps.map((rep) => (
              <RepCard
                key={rep.id}
                rep={rep}
                onComplete={handleCompleteRep}
                onCancel={handleCancelRep}
                onStateChange={handleStateChange}
                onOpenPrep={handleOpenPrep}
                onAddDebrief={(rep) => setEvidenceModalRep(rep)}
                onCloseLoop={handleOpenLoopClosure}
                onViewDetail={handleOpenRepDetail}
                isLoading={isSubmitting}
              />
            ))
          )}
          
          {/* Stuck? Ask Coach - shows when there are active reps */}
          {activeReps.length > 0 && onAskCoach && (
            <button
              onClick={onAskCoach}
              className="w-full mt-2 py-2 text-sm text-corporate-teal hover:bg-corporate-teal/5 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Stuck on a rep? Talk it through with your coach
            </button>
          )}
        </div>
        
        {/* Completed This Week */}
        {completedReps.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-corporate-navy mb-3">Completed This Week</h3>
            {completedReps.map((rep) => (
              <RepCard
                key={rep.id}
                rep={rep}
                onComplete={() => {}}
                onCancel={() => {}}
                onStateChange={handleStateChange}
                onOpenPrep={handleOpenPrep}
                onAddDebrief={(rep) => setEvidenceModalRep(rep)}
                onCloseLoop={handleOpenLoopClosure}
                onViewDetail={handleOpenRepDetail}
                onPractice={handleStartPractice}
                evidence={evidenceMap[rep.id]}
                isLoading={false}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Floating Action Button - controlled by showFab */}
      {showFab && activeReps.length > 0 && (
        <button
          onClick={() => setShowCommitForm(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-corporate-navy text-white rounded-full shadow-lg flex items-center justify-center hover:bg-corporate-navy/90 transition-all active:scale-95"
          aria-label="Add new rep"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      
      {/* Commit Form Modal */}
      {showCommitForm && (
        <CommitRepForm
          onSubmit={handleCommitRep}
          onClose={() => setShowCommitForm(false)}
          isLoading={isSubmitting}
          activeRepsCount={activeReps.length}
        />
      )}
      
      {/* Structured Evidence Capture Modal (Sprint 3) */}
      {evidenceModalRep && (
        <StructuredEvidenceModal
          rep={evidenceModalRep}
          onClose={() => setEvidenceModalRep(null)}
          onSubmit={handleEvidenceSubmitted}
          isLoading={isSubmitting}
        />
      )}
      
      {/* High Risk Prep Modal */}
      {prepModalRep && (
        <HighRiskPrepModal
          isOpen={true}
          onClose={() => setPrepModalRep(null)}
          rep={prepModalRep}
          onSubmit={handlePrepSubmit}
          isLoading={isSubmitting}
        />
      )}
      
      {/* Missed Rep Debrief Modal (Sprint 4) */}
      {missedDebriefRep && (
        <MissedRepDebriefModal
          isOpen={true}
          onClose={() => setMissedDebriefRep(null)}
          rep={missedDebriefRep}
          onRecommit={handleMissedRecommit}
          onModify={handleMissedModify}
          onCancel={handleMissedCancel}
          isLoading={isSubmitting}
        />
      )}
      
      {/* Loop Closure Modal (Phase 5) */}
      {loopClosureRep && (
        <LoopClosureModal
          isOpen={true}
          onClose={() => setLoopClosureRep(null)}
          rep={loopClosureRep}
          onSubmit={handleLoopClosureSubmit}
          isLoading={isSubmitting}
        />
      )}
      
      {/* Rep Detail Modal (Phase 6) */}
      {detailModalRep && (
        <RepDetailModal
          isOpen={true}
          onClose={() => setDetailModalRep(null)}
          rep={detailModalRep}
        />
      )}
    </PageLayout>
  );
};

export default Conditioning;
