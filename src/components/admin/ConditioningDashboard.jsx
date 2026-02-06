// src/components/admin/ConditioningDashboard.jsx
// Trainer view for Conditioning Layer accountability
// Shows all cohort members' rep status, completion rates, patterns, and flags

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices';
import conditioningService, { REP_STATUS, getCurrentWeekId, QUALITY_DIMENSIONS } from '../../services/conditioningService';
import { Card } from '../ui';
import { TrainerNudgePanel } from '../conditioning';
import { 
  Users, CheckCircle, AlertTriangle, Clock, RefreshCw,
  Target, ChevronDown, ChevronUp, User, Calendar,
  BarChart3, FileText, ThumbsUp, MessageSquare, Handshake, Lightbulb,
  TrendingDown, Shield, Zap, Eye
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';

// ============================================
// PATTERN BADGE COMPONENT
// ============================================
const PatternBadge = ({ pattern }) => {
  const patternConfig = {
    consecutive_misses: { icon: TrendingDown, label: 'Missed Weeks', color: 'red' },
    chronic_late: { icon: Clock, label: 'Last Minute', color: 'amber' },
    safety_reps: { icon: Shield, label: 'Safety Reps', color: 'blue' },
    vague_debriefs: { icon: MessageSquare, label: 'Vague Debriefs', color: 'purple' },
    no_commitment: { icon: Handshake, label: 'No Commitment', color: 'orange' },
    quality_decline: { icon: TrendingDown, label: 'Quality Drop', color: 'red' }
  };
  
  const config = patternConfig[pattern.type] || { icon: AlertTriangle, label: pattern.type, color: 'gray' };
  const Icon = config.icon;
  
  const colorClasses = {
    red: 'bg-red-100 text-red-700 border-red-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200'
  };
  
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses[config.color]}`}>
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  );
};

// ============================================
// USER ROW COMPONENT
// ============================================
const UserRow = ({ summary, isExpanded, onToggle }) => {
  const { currentWeek, consecutiveMissedWeeks, needsAttention, patterns = [] } = summary;
  
  return (
    <div className={`border-b border-gray-100 last:border-b-0 ${needsAttention ? 'bg-red-50' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            currentWeek?.requiredRepCompleted 
              ? 'bg-green-100 text-green-700' 
              : needsAttention 
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-700'
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
              {summary.displayName || summary.email || summary.userId}
            </div>
            <div className="text-sm text-gray-500">
              {currentWeek?.totalCompleted || 0} completed, {currentWeek?.totalActive || 0} active
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Patterns */}
          {patterns.slice(0, 2).map((p, idx) => (
            <PatternBadge key={idx} pattern={p} />
          ))}
          {patterns.length > 2 && (
            <span className="text-xs text-gray-500">+{patterns.length - 2} more</span>
          )}
          
          {consecutiveMissedWeeks > 0 && patterns.every(p => p.type !== 'consecutive_misses') && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">
              {consecutiveMissedWeeks} week{consecutiveMissedWeeks !== 1 ? 's' : ''} missed
            </span>
          )}
          {needsAttention && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
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
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-gray-50">
          {/* Pattern Details */}
          {patterns.length > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Detected Patterns
              </h4>
              <div className="space-y-2">
                {patterns.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        p.severity === 'high' ? 'bg-red-500' : 
                        p.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-gray-700">{p.message}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      p.severity === 'high' ? 'bg-red-100 text-red-700' :
                      p.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {p.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <h4 className="text-sm font-medium text-gray-700 mb-2">This Week's Reps</h4>
          {currentWeek?.reps?.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No reps committed this week</p>
          ) : (
            <div className="space-y-2">
              {(currentWeek?.reps || []).map((rep) => (
                <div 
                  key={rep.id}
                  className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{rep.person}</span>
                    <span className="text-xs text-gray-500">({rep.repType})</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    rep.status === REP_STATUS.COMPLETED ? 'bg-green-100 text-green-700' :
                    rep.status === REP_STATUS.MISSED ? 'bg-amber-100 text-amber-700' :
                    rep.status === REP_STATUS.CANCELED ? 'bg-gray-100 text-gray-500' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {rep.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// COHORT SELECTOR
// ============================================
const CohortSelector = ({ cohorts, selectedCohortId, onSelect }) => {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Cohort:</label>
      <select
        value={selectedCohortId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">Select a cohort...</option>
        {cohorts.map((cohort) => (
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
  
  const { totalUsers, usersCompleted, usersNeedingAttention } = cohortSummary;
  const completionRate = totalUsers > 0 ? Math.round((usersCompleted / totalUsers) * 100) : 0;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-corporate-navy">{totalUsers}</div>
            <div className="text-sm text-gray-500">Total Leaders</div>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{usersCompleted}</div>
            <div className="text-sm text-gray-500">Rep Done</div>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Target className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{completionRate}%</div>
            <div className="text-sm text-gray-500">Completion Rate</div>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{usersNeedingAttention}</div>
            <div className="text-sm text-gray-500">Need Attention</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ============================================
// QUALITY METRICS (Phase 2)
// ============================================
const DIMENSION_CONFIG = {
  [QUALITY_DIMENSIONS.SPECIFIC_LANGUAGE]: { icon: MessageSquare, label: 'Specific Language', color: 'blue' },
  [QUALITY_DIMENSIONS.CLEAR_REQUEST]: { icon: Target, label: 'Clear Request', color: 'green' },
  [QUALITY_DIMENSIONS.NAMED_COMMITMENT]: { icon: Handshake, label: 'Named Commitment', color: 'amber' },
  [QUALITY_DIMENSIONS.REFLECTION]: { icon: Lightbulb, label: 'Reflection', color: 'purple' }
};

const QualityMetrics = ({ cohortQualityStats }) => {
  if (!cohortQualityStats) return null;
  
  const { 
    totalWithEvidence, 
    level1Rate, 
    qualityRate, 
    dimensionStats 
  } = cohortQualityStats;
  
  if (totalWithEvidence === 0) {
    return (
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-corporate-navy" />
          <h3 className="font-semibold text-corporate-navy">Quality Metrics</h3>
        </div>
        <p className="text-sm text-gray-500 italic">No debriefs submitted yet for this cohort.</p>
      </Card>
    );
  }
  
  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-corporate-navy" />
        <h3 className="font-semibold text-corporate-navy">Quality Metrics</h3>
      </div>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-corporate-navy">{totalWithEvidence}</div>
          <div className="text-xs text-gray-500">Debriefs</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{level1Rate}%</div>
          <div className="text-xs text-blue-600">Level 1 Rate</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{qualityRate}%</div>
          <div className="text-xs text-green-600">Quality Pass</div>
        </div>
      </div>
      
      {/* Dimension Breakdown */}
      <h4 className="text-sm font-medium text-gray-700 mb-2">Dimension Pass Rates</h4>
      <div className="space-y-2">
        {Object.entries(dimensionStats || {}).map(([dimension, stats]) => {
          const config = DIMENSION_CONFIG[dimension];
          if (!config) return null;
          const Icon = config.icon;
          const colorClass = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            amber: 'bg-amber-500',
            purple: 'bg-purple-500'
          }[config.color] || 'bg-gray-500';
          
          return (
            <div key={dimension} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
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
    </Card>
  );
};

// ============================================
// PATTERN SUMMARY (Phase 3)
// ============================================
const PatternSummary = ({ userSummaries }) => {
  // Aggregate patterns across all users
  const patternStats = useMemo(() => {
    const counts = {};
    let usersWithPatterns = 0;
    
    userSummaries.forEach(summary => {
      if (summary.patterns && summary.patterns.length > 0) {
        usersWithPatterns++;
        summary.patterns.forEach(p => {
          counts[p.type] = (counts[p.type] || 0) + 1;
        });
      }
    });
    
    return {
      usersWithPatterns,
      totalUsers: userSummaries.length,
      counts
    };
  }, [userSummaries]);
  
  const patternLabels = {
    consecutive_misses: { label: 'Consecutive Misses', icon: TrendingDown, color: 'red' },
    chronic_late: { label: 'Last-Minute Completions', icon: Clock, color: 'amber' },
    safety_reps: { label: 'Avoiding Challenge', icon: Shield, color: 'blue' },
    vague_debriefs: { label: 'Vague Debriefs', icon: MessageSquare, color: 'purple' },
    no_commitment: { label: 'No Commitments', icon: Handshake, color: 'orange' }
  };
  
  if (Object.keys(patternStats.counts).length === 0) {
    return null;
  }
  
  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-5 h-5 text-corporate-navy" />
        <h3 className="font-semibold text-corporate-navy">Pattern Detection</h3>
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          {patternStats.usersWithPatterns} of {patternStats.totalUsers} leaders
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(patternStats.counts)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => {
            const config = patternLabels[type];
            if (!config) return null;
            const Icon = config.icon;
            const colorClasses = {
              red: 'bg-red-50 border-red-200 text-red-700',
              amber: 'bg-amber-50 border-amber-200 text-amber-700',
              blue: 'bg-blue-50 border-blue-200 text-blue-700',
              purple: 'bg-purple-50 border-purple-200 text-purple-700',
              orange: 'bg-orange-50 border-orange-200 text-orange-700'
            };
            
            return (
              <div 
                key={type}
                className={`p-3 rounded-lg border ${colorClasses[config.color]}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs opacity-75">leader{count !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
      </div>
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
      
      // Get conditioning summaries for each user
      const summaries = [];
      for (const user of users) {
        try {
          const summary = await conditioningService.getUserConditioningSummary(db, user.id, selectedCohortId);
          summaries.push({
            ...summary,
            email: user.email,
            displayName: user.displayName
          });
        } catch (err) {
          console.error(`Error getting summary for user ${user.id}:`, err);
          summaries.push({
            userId: user.id,
            email: user.email,
            currentWeek: { requiredRepCompleted: false, totalCompleted: 0, totalActive: 0, reps: [] },
            consecutiveMissedWeeks: 0,
            unresolvedMissedReps: 0,
            needsAttention: false,
            error: true
          });
        }
      }
      
      // Sort: needs attention first, then by completion status
      summaries.sort((a, b) => {
        if (a.needsAttention && !b.needsAttention) return -1;
        if (!a.needsAttention && b.needsAttention) return 1;
        if (!a.currentWeek?.requiredRepCompleted && b.currentWeek?.requiredRepCompleted) return -1;
        if (a.currentWeek?.requiredRepCompleted && !b.currentWeek?.requiredRepCompleted) return 1;
        return 0;
      });
      
      setUserSummaries(summaries);
      
      // Calculate cohort summary
      setCohortSummary({
        cohortId: selectedCohortId,
        weekId: getCurrentWeekId(),
        totalUsers: summaries.length,
        usersCompleted: summaries.filter(s => s.currentWeek?.requiredRepCompleted).length,
        usersNeedingAttention: summaries.filter(s => s.needsAttention).length
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
        qualityRate: totalWithEvidence > 0 ? Math.round((totalMeetsStandard / totalWithEvidence) * 100) : 0,
        dimensionStats: aggregatedDimensions
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
          <p className="text-gray-600">Track leadership rep accountability across your cohort</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
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
        <Card className="mb-6 p-4 border-l-4 border-l-red-500 bg-red-50">
          <p className="text-red-700">{error}</p>
        </Card>
      )}
      
      {/* Stats Summary */}
      <StatsSummary cohortSummary={cohortSummary} />
      
      {/* Quality Metrics (Phase 2) */}
      <QualityMetrics cohortQualityStats={cohortQualityStats} />
      
      {/* Pattern Detection (Phase 3) */}
      {userSummaries.length > 0 && (
        <PatternSummary userSummaries={userSummaries} />
      )}
      
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
      
      {/* No cohort selected */}
      {!selectedCohortId && (
        <Card className="p-6 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Select a cohort to view conditioning data</p>
        </Card>
      )}
      
      {/* User List */}
      {selectedCohortId && (
        <Card>
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-corporate-navy">
              Leaders ({userSummaries.length})
            </h2>
          </div>
          
          {isLoadingUsers ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading leader data...</p>
            </div>
          ) : userSummaries.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No leaders in this cohort</p>
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
