// src/components/admin/ConditioningDashboard.jsx
// Trainer view for Conditioning Layer accountability
// Shows all cohort members' rep status, completion rates, and flags

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useAppServices } from '../../services/useAppServices';
import conditioningService, { REP_STATUS, getCurrentWeekId, COACH_PROMPTS } from '../../services/conditioningService';
import { Card } from '../ui';
import { TrainerNudgePanel, CoachPromptsPanel, RepDetailModal } from '../conditioning';
import FacilitatorFeedbackPanel from './FacilitatorFeedbackPanel';
import { getRepType } from '../../services/repTaxonomy';
import { 
  Users, CheckCircle, AlertTriangle, Clock, RefreshCw,
  Target, ChevronDown, ChevronUp, User, Calendar,
  BarChart3, FileText, ThumbsUp, MessageSquare, Handshake, Lightbulb,
  Activity, Heart, TrendingUp, TrendingDown, History
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';

// ============================================
// USER ROW COMPONENT (with full rep history)
// ============================================
const UserRow = ({ summary, isExpanded, onToggle, db, cohortId }) => {
  const { currentWeek, consecutiveMissedWeeks, needsAttention, patterns } = summary;
  const [selectedRep, setSelectedRep] = useState(null);
  // Use pre-fetched data if available, otherwise load on expand
  const [allRepsData, setAllRepsData] = useState(summary.allRepsData || null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState({});
  
  const currentWeekId = useMemo(() => getCurrentWeekId(), []);
  
  // Load all reps when expanding (if not already pre-fetched)
  useEffect(() => {
    if (isExpanded && !allRepsData && !isLoadingHistory && db) {
      setIsLoadingHistory(true);
      // Pass null for cohortId to get ALL reps across all cohorts
      conditioningService.getAllRepsForUser(db, summary.userId, null)
        .then(data => {
          setAllRepsData(data);
          // Auto-expand current week
          setExpandedWeeks({ [currentWeekId]: true });
        })
        .catch(err => {
          console.error('Error loading rep history:', err);
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    } else if (isExpanded && allRepsData && Object.keys(expandedWeeks).length === 0) {
      // Auto-expand current week if data is already loaded
      setExpandedWeeks({ [currentWeekId]: true });
    }
  }, [isExpanded, allRepsData, isLoadingHistory, db, summary.userId, currentWeekId, expandedWeeks]);
  
  // Reset expanded weeks when collapsed (keep allRepsData for quick re-expand)
  useEffect(() => {
    if (!isExpanded) {
      setExpandedWeeks({});
    }
  }, [isExpanded]);
  
  const getRepTypeFriendlyName = (repTypeId) => {
    const repTypeConfig = getRepType(repTypeId);
    return repTypeConfig?.label || repTypeConfig?.shortLabel || repTypeId;
  };
  
  const toggleWeek = (weekId) => {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
  };
  
  const getWeekStats = (reps) => {
    const completed = reps.filter(r => ['debriefed', 'loop_closed', 'completed'].includes(r.status));
    const active = reps.filter(r => ['committed', 'prepared', 'scheduled', 'executed', 'debriefed', 'follow_up_pending', 'active'].includes(r.status));
    const missed = reps.filter(r => r.status === 'missed');
    const canceled = reps.filter(r => r.status === 'canceled');
    return { completed: completed.length, active: active.length, missed: missed.length, canceled: canceled.length, total: reps.length };
  };
  
  const formatWeekLabel = (weekId) => {
    if (weekId === currentWeekId) return 'Current Week';
    // weekId format is YYYY-WXX (e.g., "2025-W12")
    const match = weekId.match(/^(\d{4})-W(\d{2})$/);
    if (match) {
      return `Week ${parseInt(match[2], 10)}, ${match[1]}`;
    }
    return weekId;
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'debriefed':
      case 'loop_closed':
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700';
      case 'missed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700';
      case 'canceled':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700';
    }
  };
  
  return (
    <div className={`border-b border-gray-100 last:border-b-0 ${needsAttention ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            currentWeek?.requiredRepCompleted 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700' 
              : needsAttention 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
          }`}>
            {currentWeek?.requiredRepCompleted ? (
              <CheckCircle className="w-5 h-5" />
            ) : needsAttention ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>
          <div className="text-left">
            <div className="font-medium text-corporate-navy">
              {summary.email || summary.userId}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-corporate-teal">{summary.totalHistoricalReps || 0}</span> total reps
              {(currentWeek?.totalCompleted > 0 || currentWeek?.totalActive > 0) && (
                <span className="ml-2 text-gray-400">• This week: {currentWeek?.totalCompleted || 0} done, {currentWeek?.totalActive || 0} active</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {consecutiveMissedWeeks > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700">
              {consecutiveMissedWeeks} week{consecutiveMissedWeeks !== 1 ? 's' : ''} missed
            </span>
          )}
          {needsAttention && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 font-medium">
              Needs Attention
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {/* Expanded Details - Full Rep History */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-800">
          {/* Pattern alerts if any */}
          {patterns && patterns.length > 0 && (
            <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-700">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Patterns Detected:</p>
              <div className="flex flex-wrap gap-1">
                {patterns.map((p, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full ${
                    p.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700' :
                    p.severity === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-600'
                  }`}>
                    {p.name || p.type}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">Loading rep history...</span>
            </div>
          )}
          
          {/* Rep History by Week */}
          {allRepsData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-gray-500" />
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Rep History ({allRepsData.totalCount} total reps across {allRepsData.weekIds.length} weeks)
                </h4>
              </div>
              
              {allRepsData.weekIds.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No reps committed yet</p>
              ) : (
                <div className="space-y-1">
                  {allRepsData.weekIds.map((weekId) => {
                    const weekReps = allRepsData.byWeek[weekId];
                    const stats = getWeekStats(weekReps);
                    const isWeekExpanded = expandedWeeks[weekId];
                    const isCurrentWeek = weekId === currentWeekId;
                    
                    return (
                      <div key={weekId} className={`rounded border ${isCurrentWeek ? 'border-corporate-teal bg-corporate-teal/5' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800'}`}>
                        {/* Week header - clickable */}
                        <button
                          onClick={() => toggleWeek(weekId)}
                          className="w-full p-2 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors rounded-t"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className={`w-4 h-4 ${isCurrentWeek ? 'text-corporate-teal' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${isCurrentWeek ? 'text-corporate-teal' : 'text-gray-700 dark:text-gray-200'}`}>
                              {formatWeekLabel(weekId)}
                            </span>
                            {isCurrentWeek && (
                              <span className="text-xs px-1.5 py-0.5 bg-corporate-teal/20 text-corporate-teal rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {/* Week stats summary */}
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-green-600 dark:text-green-400">{stats.completed} done</span>
                              {stats.active > 0 && <span className="text-blue-600 dark:text-blue-400">{stats.active} active</span>}
                              {stats.missed > 0 && <span className="text-red-600 dark:text-red-400">{stats.missed} missed</span>}
                              {stats.canceled > 0 && <span className="text-gray-400">{stats.canceled} canceled</span>}
                            </div>
                            {isWeekExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>
                        
                        {/* Week reps - expandable */}
                        {isWeekExpanded && (
                          <div className="px-2 pb-2 space-y-1">
                            {weekReps.map((rep) => (
                              <button 
                                key={rep.id}
                                onClick={() => setSelectedRep(rep)}
                                className="flex items-center justify-between w-full p-2 bg-gray-50 dark:bg-slate-900/50 rounded border border-gray-100 dark:border-gray-700 hover:border-corporate-teal hover:bg-corporate-teal/5 transition-colors cursor-pointer text-left"
                              >
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3 text-gray-400" />
                                  <span className="text-sm font-medium">{rep.person || 'Unknown'}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">({getRepTypeFriendlyName(rep.repType)})</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(rep.status)}`}>
                                  {rep.status}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Rep Detail Modal - rendered via Portal to prevent hover flickering */}
      {selectedRep && createPortal(
        <RepDetailModal
          isOpen={!!selectedRep}
          onClose={() => setSelectedRep(null)}
          rep={selectedRep}
          ownerUserId={summary.userId}
        >
          <FacilitatorFeedbackPanel
            repId={selectedRep.id}
            repOwnerId={summary.userId}
          />
        </RepDetailModal>,
        document.body
      )}
    </div>
  );
};

// ============================================
// COHORT SELECTOR
// ============================================
const CohortSelector = ({ cohorts, selectedCohortId, onSelect }) => {
  // Sort cohorts alphabetically by name
  const sortedCohorts = [...cohorts].sort((a, b) => 
    (a.name || a.id).localeCompare(b.name || b.id)
  );
  
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Cohort:</label>
      <select
        value={selectedCohortId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">Select a cohort...</option>
        {sortedCohorts.map((cohort) => (
          <option key={cohort.id} value={cohort.id}>
            {cohort.name || cohort.id}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============================================
// STATS SUMMARY
// ============================================
const StatsSummary = ({ cohortSummary }) => {
  if (!cohortSummary) return null;
  
  const { totalUsers, usersCompleted, usersNeedingAttention, totalRepsCompleted = 0 } = cohortSummary;
  const completionRate = totalUsers > 0 ? Math.round((usersCompleted / totalUsers) * 100) : 0;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-corporate-navy">{totalUsers}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Leaders</div>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {totalRepsCompleted}
              <span className="text-sm font-normal text-gray-400 ml-1">reps</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              by {usersCompleted} leader{usersCompleted !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{completionRate}%</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Completion Rate</div>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{usersNeedingAttention}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Need Attention</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ============================================
// QUALITY METRICS (Phase 2)
// ============================================
// Using string keys directly to avoid TDZ issues with computed property keys at module level
// V2: 3 dimensions (specific_language, observed_response, reflection)
const DIMENSION_CONFIG = {
  'specific_language': { icon: MessageSquare, label: 'What You Said', color: 'blue' },
  'observed_response': { icon: Target, label: 'Their Response', color: 'green' },
  // Legacy V1 dimensions
  'clear_request': { icon: Target, label: 'Clear Request', color: 'green' },
  'named_commitment': { icon: Handshake, label: 'Named Commitment', color: 'amber' },
  'reflection': { icon: Lightbulb, label: 'Reflection', color: 'corporate-teal' }
};

const QualityMetrics = ({ cohortQualityStats }) => {
  if (!cohortQualityStats) return null;
  
  const { 
    totalWithEvidence, 
    level1Rate,
    level1Count,
    qualityRate, 
    dimensionStats,
    meetsStandardCount
  } = cohortQualityStats;
  
  if (totalWithEvidence === 0) {
    return (
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-corporate-navy" />
          <h3 className="font-semibold text-corporate-navy">Quality Metrics</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No debriefs submitted yet for this cohort.</p>
      </Card>
    );
  }
  
  // Calculate how many passed quality out of total debriefs
  const passedCount = meetsStandardCount || Math.round((qualityRate / 100) * totalWithEvidence);
  
  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-corporate-navy" />
        <h3 className="font-semibold text-corporate-navy">Quality Metrics</h3>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-2xl font-bold text-corporate-navy">{totalWithEvidence}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Debriefs</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{passedCount}</div>
          <div className="text-xs text-blue-600">Passed Review</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{qualityRate}%</div>
          <div className="text-xs text-green-600">Quality Pass</div>
        </div>
      </div>
      
      {/* Dimension Breakdown - only show if there are reps with dimension data */}
      {Object.values(dimensionStats || {}).some(s => s.total > 0) ? (
        <>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Dimension Pass Rates</h4>
          <div className="space-y-2">
            {Object.entries(dimensionStats || {}).map(([dimension, stats]) => {
              const config = DIMENSION_CONFIG[dimension];
              if (!config || stats.total === 0) return null;
              const Icon = config.icon;
              const colorClass = {
                blue: 'bg-blue-500',
                green: 'bg-green-500',
                amber: 'bg-amber-500',
                teal: 'bg-corporate-teal'
              }[config.color] || 'bg-gray-500';
              
              return (
                <div key={dimension} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                      <span>{config.label}</span>
                      <span>{stats.passed}/{stats.total} ({stats.rate}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${colorClass} transition-all`}
                        style={{ width: `${stats.rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          Dimension tracking not available for rep-type-specific assessments (SCE, DRF, etc.)
        </p>
      )}
    </Card>
  );
};

// ============================================
// COHORT HEALTH INDICATOR (Sprint 6)
// ============================================
const CohortHealthIndicator = ({ healthData, isLoading, cohortSummary }) => {
  if (!healthData && !isLoading) return null;
  
  const getHealthColor = (level) => ({
    healthy: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700', border: 'border-green-300', fill: 'bg-green-500' },
    caution: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700', border: 'border-amber-300', fill: 'bg-amber-500' },
    'at-risk': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700', border: 'border-orange-300', fill: 'bg-orange-500' },
    critical: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700', border: 'border-red-300', fill: 'bg-red-500' }
  })[level] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-200', border: 'border-gray-300 dark:border-gray-600', fill: 'bg-gray-500' };
  
  if (isLoading) {
    return (
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Calculating cohort health...</span>
        </div>
      </Card>
    );
  }
  
  const colors = getHealthColor(healthData.healthLevel);
  const { breakdown } = healthData;
  
  return (
    <Card className={`p-4 mb-6 border ${colors.border}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${colors.bg}`}>
            <Activity className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <h3 className="font-semibold text-corporate-navy">Cohort Health</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Leader participation (all time)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={`text-3xl font-bold ${colors.text}`}>{healthData.score}</div>
            <div className={`text-xs font-medium uppercase ${colors.text}`}>{healthData.healthLevel}</div>
          </div>
          
          {/* Circular progress indicator */}
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                strokeWidth="6"
                fill="none"
                className="stroke-gray-200"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${healthData.score * 1.76} 176`}
                className={`${colors.text.replace('text-', 'stroke-')}`}
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Breakdown - per leader counts */}
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-lg font-bold text-green-600">{breakdown.completedUserCount}</div>
          <div className="text-xs text-green-600">Leaders Done</div>
        </div>
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{breakdown.activeUserCount}</div>
          <div className="text-xs text-blue-600">In Progress</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-lg font-bold text-gray-600 dark:text-gray-300">{breakdown.incompleteUserCount}</div>
          <div className="text-xs text-gray-600 dark:text-gray-300">No Reps Yet</div>
        </div>
        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-lg font-bold text-red-600">{cohortSummary?.usersNeedingAttention || 0}</div>
          <div className="text-xs text-red-600">Need Attention</div>
        </div>
      </div>
      
      {/* Pattern alerts */}
      {cohortSummary?.usersNeedingAttention > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-gray-600 dark:text-gray-300">
            {cohortSummary.usersNeedingAttention} leader{cohortSummary.usersNeedingAttention !== 1 ? 's' : ''} need{cohortSummary.usersNeedingAttention === 1 ? 's' : ''} coaching attention
          </span>
        </div>
      )}
    </Card>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const ConditioningDashboard = () => {
  const { db, user } = useAppServices();
  const trainerId = user?.uid;
  
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohortId, setSelectedCohortId] = useState(null);
  const [userSummaries, setUserSummaries] = useState([]);
  const [cohortSummary, setCohortSummary] = useState(null);
  const [cohortQualityStats, setCohortQualityStats] = useState(null);
  const [cohortHealth, setCohortHealth] = useState(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  
  // Load cohorts
  useEffect(() => {
    const loadCohorts = async () => {
      try {
        const cohortsRef = collection(db, 'cohorts');
        const snapshot = await getDocs(cohortsRef);
        const cohortList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCohorts(cohortList);
        
        // Auto-select first cohort if available
        if (cohortList.length > 0 && !selectedCohortId) {
          setSelectedCohortId(cohortList[0].id);
        }
      } catch (err) {
        console.error('Error loading cohorts:', err);
        setError('Failed to load cohorts');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCohorts();
  }, [db, selectedCohortId]);
  
  // Load users for selected cohort
  const loadCohortData = useCallback(async () => {
    if (!selectedCohortId || !db) return;
    
    try {
      setIsLoadingUsers(true);
      setError(null);
      
      // Get users in this cohort
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('cohortId', '==', selectedCohortId));
      const usersSnapshot = await getDocs(usersQuery);
      
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get conditioning summaries for each user (including total historical reps)
      // PERF: Run all user queries in parallel instead of sequentially
      const summaryResults = await Promise.all(
        users.map(async (user) => {
          try {
            // Run both queries for this user in parallel
            const [summary, allRepsData] = await Promise.all([
              conditioningService.getUserConditioningSummary(db, user.id, selectedCohortId),
              conditioningService.getAllRepsForUser(db, user.id, null)
            ]);
            return {
              ...summary,
              email: user.email,
              displayName: user.displayName,
              totalHistoricalReps: allRepsData.totalCount || 0,
              allRepsData // Store for expanded view
            };
          } catch (err) {
            console.error(`Error getting summary for user ${user.id}:`, err);
            return {
              userId: user.id,
              email: user.email,
              currentWeek: { requiredRepCompleted: false, totalCompleted: 0, totalActive: 0, reps: [] },
              consecutiveMissedWeeks: 0,
              unresolvedMissedReps: 0,
              needsAttention: false,
              totalHistoricalReps: 0,
              error: true
            };
          }
        })
      );
      const summaries = summaryResults;
      
      // Sort: completed first, then needs attention, then by email
      summaries.sort((a, b) => {
        // Primary: completed users first
        const aCompleted = a.currentWeek?.requiredRepCompleted ? 1 : 0;
        const bCompleted = b.currentWeek?.requiredRepCompleted ? 1 : 0;
        if (aCompleted !== bCompleted) return bCompleted - aCompleted;
        
        // Secondary: needs attention (within non-completed group)
        if (a.needsAttention && !b.needsAttention) return -1;
        if (!a.needsAttention && b.needsAttention) return 1;
        
        // Tertiary: alphabetical by email
        return (a.email || '').localeCompare(b.email || '');
      });
      
      setUserSummaries(summaries);
      
      // Calculate cohort summary - use ALL TIME data, not just current week
      const totalRepsCompleted = summaries.reduce((sum, s) => sum + (s.totalHistoricalReps || 0), 0);
      const usersWithReps = summaries.filter(s => (s.totalHistoricalReps || 0) > 0).length;
      
      setCohortSummary({
        cohortId: selectedCohortId,
        weekId: getCurrentWeekId(),
        totalUsers: summaries.length,
        usersCompleted: usersWithReps, // Users who have done ANY reps
        usersNeedingAttention: summaries.filter(s => s.needsAttention).length,
        totalRepsCompleted
      });
      
      // Phase 2: Calculate cohort-wide quality stats
      const allQualityStats = await Promise.all(
        users.map(user => conditioningService.getQualityStats(db, user.id, selectedCohortId))
      );
      
      // Aggregate quality stats across cohort
      let totalWithEvidence = 0;
      let totalLevel1 = 0;
      let totalMeetsStandard = 0;
      const aggregatedDimensions = {};
      
      allQualityStats.forEach(stats => {
        totalWithEvidence += stats.evidenceSubmitted || 0;
        totalLevel1 += stats.level1Evidence || 0;
        totalMeetsStandard += stats.meetsStandard || 0;
        
        Object.entries(stats.dimensionStats || {}).forEach(([dim, dimStats]) => {
          if (!aggregatedDimensions[dim]) {
            aggregatedDimensions[dim] = { passed: 0, total: 0 };
          }
          aggregatedDimensions[dim].passed += dimStats.passed || 0;
          aggregatedDimensions[dim].total += dimStats.total || 0;
        });
      });
      
      // Calculate rates
      Object.keys(aggregatedDimensions).forEach(dim => {
        const { passed, total } = aggregatedDimensions[dim];
        aggregatedDimensions[dim].rate = total > 0 ? Math.round((passed / total) * 100) : 0;
      });
      
      setCohortQualityStats({
        totalWithEvidence,
        level1Rate: totalWithEvidence > 0 ? Math.round((totalLevel1 / totalWithEvidence) * 100) : 0,
        level1Count: totalLevel1,
        qualityRate: totalWithEvidence > 0 ? Math.round((totalMeetsStandard / totalWithEvidence) * 100) : 0,
        meetsStandardCount: totalMeetsStandard,
        dimensionStats: aggregatedDimensions
      });
      
      // Calculate cohort health from data we already have (no extra queries needed)
      // PERF: Reuse allRepsData instead of re-querying in getCohortHealthScore
      const DONE_STATUSES = ['executed', 'debriefed', 'loop_closed', 'follow_up_pending', 'completed'];
      const ACTIVE_STATUSES = ['committed', 'prepared', 'scheduled', 'active'];
      
      let completedUserCount = 0;
      let activeUserCount = 0;
      
      summaries.forEach(s => {
        const allReps = s.allRepsData?.allReps || [];
        const completedReps = allReps.filter(r => DONE_STATUSES.includes(r.status));
        const activeReps = allReps.filter(r => ACTIVE_STATUSES.includes(r.status));
        
        if (completedReps.length > 0) {
          completedUserCount++;
        } else if (activeReps.length > 0) {
          activeUserCount++;
        }
      });
      
      const totalUsers = summaries.length;
      const completionRate = totalUsers > 0 ? completedUserCount / totalUsers : 0;
      const activeRate = (completedUserCount + activeUserCount) / (totalUsers || 1);
      
      // Calculate health score
      let score = completionRate * 60 + activeRate * 20;
      score = Math.max(0, Math.min(100, Math.round(score)));
      
      let healthLevel;
      if (score >= 80) healthLevel = 'healthy';
      else if (score >= 60) healthLevel = 'caution';
      else if (score >= 40) healthLevel = 'at-risk';
      else healthLevel = 'critical';
      
      setCohortHealth({
        score,
        healthLevel,
        breakdown: {
          totalUsers,
          completedUserCount,
          activeUserCount,
          incompleteUserCount: totalUsers - completedUserCount - activeUserCount,
          completionRate: Math.round(completionRate * 100)
        }
      });
      
    } catch (err) {
      console.error('Error loading cohort data:', err);
      setError('Failed to load cohort data');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [selectedCohortId, db]);
  
  useEffect(() => {
    loadCohortData();
  }, [loadCohortData]);
  
  const currentWeekId = useMemo(() => getCurrentWeekId(), []);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-corporate-navy animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-corporate-navy">Conditioning Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Track leadership rep accountability across your cohort</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Week: {currentWeekId}</span>
          </div>
          <button
            onClick={loadCohortData}
            disabled={isLoadingUsers}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-corporate-navy text-white rounded-lg hover:bg-corporate-navy/90 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      {/* Cohort Selector */}
      <div className="mb-6">
        <CohortSelector
          cohorts={cohorts}
          selectedCohortId={selectedCohortId}
          onSelect={setSelectedCohortId}
        />
      </div>
      
      {/* Error */}
      {error && (
        <Card className="mb-6 p-4 border-l-4 border-l-red-500 bg-red-50 dark:bg-red-900/20">
          <p className="text-red-700">{error}</p>
        </Card>
      )}
      
      {/* Stats Summary */}
      <StatsSummary cohortSummary={cohortSummary} />
      
      {/* Cohort Health Indicator (Sprint 6) */}
      {selectedCohortId && (
        <CohortHealthIndicator 
          healthData={cohortHealth} 
          isLoading={isLoadingHealth}
          cohortSummary={cohortSummary} 
        />
      )}
      
      {/* Quality Metrics (Phase 2) */}
      <QualityMetrics cohortQualityStats={cohortQualityStats} />
      
      {/* Trainer Nudge Panel (Phase 3) */}
      {selectedCohortId && userSummaries.length > 0 && (
        <div className="mb-6">
          <TrainerNudgePanel
            db={db}
            trainerId={trainerId}
            cohortId={selectedCohortId}
            cohortUsers={userSummaries}
          />
        </div>
      )}
      
      {/* Coach Prompts Panel (Sprint 5) */}
      {selectedCohortId && userSummaries.length > 0 && (
        <div className="mb-6">
          <CoachPromptsPanel
            db={db}
            cohortId={selectedCohortId}
            userIds={userSummaries.map(u => u.userId)}
            userEmails={userSummaries.reduce((acc, u) => ({ ...acc, [u.userId]: u.email }), {})}
            onSendNudge={async (userId, message, pattern) => {
              try {
                // Send coaching nudge using the conditioningService
                const result = await conditioningService.sendBulkNudges(
                  db,
                  trainerId,
                  [userId],
                  selectedCohortId,
                  'coach_prompt', // nudge type for patterns
                  message
                );
                console.log('Coach prompt nudge sent:', { userId, pattern: pattern.name, result });
                // Could add a toast notification here for user feedback
              } catch (err) {
                console.error('Error sending coach prompt nudge:', err);
              }
            }}
          />
        </div>
      )}
      
      {/* No cohort selected */}
      {!selectedCohortId && (
        <Card className="p-6 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Select a cohort to view conditioning data</p>
        </Card>
      )}
      
      {/* User List */}
      {selectedCohortId && (
        <Card>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-corporate-navy">
              Leaders ({userSummaries.length})
            </h2>
          </div>
          
          {isLoadingUsers ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading leader data...</p>
            </div>
          ) : userSummaries.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400">No leaders in this cohort</p>
            </div>
          ) : (
            <div>
              {userSummaries.map((summary) => (
                <UserRow
                  key={summary.userId}
                  summary={summary}
                  isExpanded={expandedUserId === summary.userId}
                  onToggle={() => setExpandedUserId(
                    expandedUserId === summary.userId ? null : summary.userId
                  )}
                  db={db}
                  cohortId={selectedCohortId}
                />
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ConditioningDashboard;
