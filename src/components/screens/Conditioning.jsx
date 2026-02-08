// src/components/screens/Conditioning.jsx
// Conditioning Layer - Real Leadership Rep Accountability
// Mobile-first design for use between Foundation sessions
// Updated for 16 Rep Types (020726)

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import conditioningService, { 
  REP_STATUS, 
  getWeekBoundaries,
  STATE_TRANSITIONS
} from '../../services/conditioningService.js';
import { REP_TYPES, getRepType, isPrepRequired } from '../../services/repTaxonomy.js';
import { Card, Button } from '../ui';
import { 
  StructuredEvidenceModal,
  QualityAssessmentCard,
  PracticeRetryCard,
  TrainerNudgeNotification,
  CommitRepForm,
  RepTypeBadge,
  RepProgressionTracker,
  PrepRequirementBadge,
  HighRiskPrepModal,
  MissedRepDebriefModal
} from '../conditioning';
import { 
  Plus, Check, X, AlertTriangle, Clock, User, 
  ChevronRight, RefreshCw, MessageSquare, Users,
  Target, Calendar, CheckCircle, XCircle, AlertCircle,
  FileText
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

// ============================================
// STATUS BADGE COMPONENT (Updated for new states)
// ============================================
const StatusBadge = ({ status }) => {
  const configs = {
    // New granular states
    [REP_STATUS.COMMITTED]: { 
      bg: 'bg-blue-100', 
      text: 'text-blue-700', 
      label: 'Committed',
      icon: Clock
    },
    [REP_STATUS.PREPARED]: { 
      bg: 'bg-indigo-100', 
      text: 'text-indigo-700', 
      label: 'Prepared',
      icon: FileText
    },
    [REP_STATUS.SCHEDULED]: { 
      bg: 'bg-purple-100', 
      text: 'text-purple-700', 
      label: 'Scheduled',
      icon: Calendar
    },
    [REP_STATUS.EXECUTED]: { 
      bg: 'bg-teal-100', 
      text: 'text-teal-700', 
      label: 'Executed',
      icon: Check
    },
    [REP_STATUS.DEBRIEFED]: { 
      bg: 'bg-green-100', 
      text: 'text-green-700', 
      label: 'Complete',
      icon: CheckCircle
    },
    [REP_STATUS.MISSED]: { 
      bg: 'bg-amber-100', 
      text: 'text-amber-700', 
      label: 'Missed',
      icon: AlertCircle
    },
    [REP_STATUS.CANCELED]: { 
      bg: 'bg-gray-100', 
      text: 'text-gray-500', 
      label: 'Canceled',
      icon: XCircle
    },
    // Legacy aliases - map to new states
    'active': { 
      bg: 'bg-blue-100', 
      text: 'text-blue-700', 
      label: 'Active',
      icon: Clock
    },
    'completed': { 
      bg: 'bg-green-100', 
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
const WeekStatusHeader = ({ weeklyStatus, nudgeStatus }) => {
  const { weekStart, weekEnd, requiredRepCompleted, totalCompleted, totalActive } = weeklyStatus || {};
  
  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <Card className="mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-corporate-navy">This Week's Reps</h2>
            <p className="text-sm text-gray-500">
              {formatDate(weekStart)} - {formatDate(weekEnd)}
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            requiredRepCompleted 
              ? 'bg-green-100 text-green-700' 
              : 'bg-amber-100 text-amber-700'
          }`}>
            {requiredRepCompleted ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Requirement Met</span>
              </>
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span className="font-medium">1 Rep Required</span>
              </>
            )}
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span><strong>{totalCompleted || 0}</strong> Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            <span><strong>{totalActive || 0}</strong> Active</span>
          </div>
        </div>
        
        {/* Nudge Message */}
        {nudgeStatus && nudgeStatus.type !== 'none' && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            nudgeStatus.type === 'urgent' || nudgeStatus.type === 'escalation'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : nudgeStatus.type === 'warning'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{nudgeStatus.message}</span>
            </div>
          </div>
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
  onPractice, 
  onStateChange,
  onOpenPrep,
  evidence, 
  isLoading 
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showProgression, setShowProgression] = useState(false);
  
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
          {/* Header Row */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-corporate-navy" />
              <span className="font-semibold text-corporate-navy">{rep.person}</span>
            </div>
            <StatusBadge status={rep.status} />
          </div>
          
          {/* Type & Deadline Row */}
          <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
            <RepTypeBadge repType={rep.repType} />
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span className={isOverdue ? 'text-amber-600 font-medium' : ''}>
                {formatDeadline(rep.deadline)}
              </span>
            </div>
          </div>
          
          {/* Prep Requirement Badge */}
          {canTakeAction && (
            <div className="mb-3">
              <PrepRequirementBadge repType={rep.repType} riskLevel={rep.riskLevel} size="small" />
            </div>
          )}
          
          {/* Notes */}
          {rep.notes && (
            <p className="text-sm text-gray-600 mb-3 italic">"{rep.notes}"</p>
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
            <div className="text-sm text-gray-500 mb-3">
              <span className="font-medium">Reason:</span> {rep.cancelReason}
            </div>
          )}
          
          {/* Progression Tracker - Collapsible (Active reps only) */}
          {canTakeAction && (
            <div className="mb-3">
              <button
                onClick={() => setShowProgression(!showProgression)}
                className="text-xs text-corporate-navy hover:underline flex items-center gap-1"
              >
                {showProgression ? 'Hide' : 'Show'} Progress Tracker
                <ChevronRight className={`w-3 h-3 transition-transform ${showProgression ? 'rotate-90' : ''}`} />
              </button>
              {showProgression && (
                <div className="mt-2">
                  <RepProgressionTracker
                    rep={rep}
                    onStateChange={handleStateChange}
                    showActions={true}
                    compact={false}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* Quick Action Buttons - Active/Missed Reps */}
          {canTakeAction && !showProgression && (
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
          
          {/* Completed/Debriefed Rep - Show Evidence */}
          {(rep.status === 'debriefed' || rep.status === 'completed') && (
            <div className="pt-2 border-t border-gray-100">
              {evidence ? (
                <>
                  {/* Quality Assessment Display */}
                  {evidence.qualityAssessment && (
                    <QualityAssessmentCard 
                      qualityAssessment={evidence.qualityAssessment}
                      onPractice={onPractice ? (dimension) => onPractice(rep, dimension) : null}
                      compact={true}
                    />
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    <span>Debrief submitted</span>
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
        </div>
      </Card>
      
      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-4">
              <h3 className="text-lg font-bold text-corporate-navy mb-2">Cancel Rep</h3>
              <p className="text-sm text-gray-600 mb-4">
                Why are you canceling this rep? (Required)
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Person left role, meeting canceled..."
                className="w-full p-3 border border-gray-300 rounded-lg text-sm mb-4 min-h-[100px]"
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
const MissedRepsSection = ({ missedReps, onOpenDebrief, isLoading }) => {
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
      <p className="text-sm text-gray-600 mb-3">
        Complete a quick debrief to understand what happened and set up for success next week.
      </p>
      {missedReps.map((rep) => (
        <Card key={rep.id} className="mb-2 border-l-4 border-l-amber-500">
          <div className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{rep.person}</span>
                <span className="text-sm text-gray-500 ml-2">({getRepTypeLabel(rep.repType)})</span>
                {rep.missedDebrief && (
                  <span className="text-xs text-green-600 ml-2">✓ Debriefed</span>
                )}
              </div>
              <Button
                onClick={() => onOpenDebrief(rep)}
                disabled={isLoading}
                size="sm"
                className={rep.missedDebrief 
                  ? "bg-gray-500 hover:bg-gray-600 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
                }
              >
                {rep.missedDebrief ? (
                  <>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Re-debrief
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3 mr-1" />
                    Debrief
                  </>
                )}
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
const Conditioning = () => {
  const { user, userProfile, db } = useAppServices();
  const userId = user?.uid;
  const cohortId = userProfile?.cohortId;
  
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
      // Filter for active states (committed, prepared, scheduled)
      const activeStates = ['committed', 'prepared', 'scheduled', 'active'];
      const currentWeekActive = active.filter(r => activeStates.includes(r.status));
      
      // Get completed reps from weekly status
      // Filter for completed states (debriefed, executed, completed)
      const completedStates = ['debriefed', 'executed', 'completed'];
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
  
  // Handlers
  const handleCommitRep = async (repData) => {
    if (!userId || !cohortId || !db) return;
    
    try {
      setIsSubmitting(true);
      await conditioningService.commitRep(db, userId, {
        ...repData,
        cohortId
      });
      setShowCommitForm(false);
      await loadData();
    } catch (err) {
      console.error('Error committing rep:', err);
      setError('Failed to commit rep. Please try again.');
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
  const handleStartPractice = async (rep, dimension) => {
    if (!userId || !db) return;
    
    try {
      const evidence = evidenceMap[rep.id];
      const context = {
        originalResponse: evidence?.responses?.[dimension] || '',
        repType: rep.repType,
        person: rep.person
      };
      await conditioningService.createPracticeRetry(db, userId, rep.id, dimension, context);
      await loadData();
    } catch (err) {
      console.error('Error creating practice retry:', err);
      setError('Failed to start practice. Please try again.');
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
  
  // No cohort check
  if (!cohortId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Card className="p-6 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-corporate-navy mb-2">No Cohort Assigned</h2>
          <p className="text-gray-600">
            Conditioning is available for leaders enrolled in a cohort program.
          </p>
        </Card>
      </div>
    );
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-corporate-navy animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-corporate-navy text-white p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold">Conditioning</h1>
          <p className="text-sm text-white/80">Real leadership reps between sessions</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {/* Error Banner */}
        {error && (
          <Card className="mb-4 border-l-4 border-l-red-500 bg-red-50">
            <div className="p-3 flex items-center justify-between">
              <span className="text-red-700 text-sm">{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          </Card>
        )}
        
        {/* Week Status Header */}
        <WeekStatusHeader weeklyStatus={weeklyStatus} nudgeStatus={nudgeStatus} />
        
        {/* Trainer Nudge Notifications */}
        <TrainerNudgeNotification db={db} userId={userId} />
        
        {/* Missed Reps Section */}
        <MissedRepsSection 
          missedReps={missedReps}
          onOpenDebrief={handleOpenMissedDebrief}
          isLoading={isSubmitting}
        />
        
        {/* Practice Retries Section */}
        {pendingRetries.length > 0 && (
          <div className="mb-6">
            <PracticeRetryCard 
              retries={pendingRetries}
              onComplete={handlePracticeComplete}
            />
          </div>
        )}
        
        {/* Active Reps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-corporate-navy">Active Reps</h3>
            <span className="text-sm text-gray-500">{activeReps.length} rep{activeReps.length !== 1 ? 's' : ''}</span>
          </div>
          
          {activeReps.length === 0 ? (
            <Card className="p-6 text-center border-dashed border-2">
              <Target className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No active reps this week</p>
              <Button
                onClick={() => setShowCommitForm(true)}
                className="bg-corporate-navy hover:bg-corporate-navy/90 text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Commit to a Rep
              </Button>
            </Card>
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
                isLoading={isSubmitting}
              />
            ))
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
                onPractice={handleStartPractice}
                evidence={evidenceMap[rep.id]}
                isLoading={false}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Floating Action Button */}
      {activeReps.length > 0 && (
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
    </div>
  );
};

export default Conditioning;
