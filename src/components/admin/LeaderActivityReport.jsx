// src/components/admin/LeaderActivityReport.jsx
// Comprehensive Leader Activity Analysis - Complete view of all user activity
// Shows onboarding, prep, sessions, conditioning reps, coaching, daily logs, etc.

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  collection, getDocs, query, where, orderBy, doc, getDoc 
} from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { Card } from '../ui';
import { RepDetailModal } from '../conditioning';
import { 
  Search, Loader, User, Calendar, CheckCircle, Circle, Clock, 
  Video, FileText, MessageSquare, Zap, Award, ChevronDown, 
  ChevronUp, Target, Activity, BookOpen, ArrowLeft, Download,
  Users, AlertTriangle, Settings, Star, Eye
} from 'lucide-react';

// ============================================
// PHASE SECTIONS
// ============================================
const PHASES = [
  { id: 'onboarding', label: 'Onboarding', icon: Settings, color: 'slate' },
  { id: 'prep', label: 'Prep Week', icon: BookOpen, color: 'blue' },
  { id: 'session-1', label: 'Session 1', icon: Target, color: 'green' },
  { id: 'session-2', label: 'Session 2', icon: Target, color: 'teal' },
  { id: 'session-3', label: 'Session 3', icon: Target, color: 'cyan' },
  { id: 'session-4', label: 'Session 4', icon: Target, color: 'indigo' },
  { id: 'session-5', label: 'Session 5', icon: Target, color: 'purple' },
  { id: 'session-6', label: 'Session 6', icon: Target, color: 'pink' },
  { id: 'session-7', label: 'Session 7', icon: Target, color: 'rose' },
  { id: 'session-8', label: 'Session 8', icon: Target, color: 'amber' },
  { id: 'post-program', label: 'Post-Program', icon: Award, color: 'corporate-teal' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp?.toDate?.() || new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatDateShort = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp?.toDate?.() || new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
    case 'loop_closed':
    case 'debriefed':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30';
    case 'in_progress':
    case 'active':
    case 'committed':
    case 'prepared':
    case 'executed':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30';
    case 'missed':
    case 'canceled':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30';
    default:
      return 'bg-slate-100 text-slate-600 dark:bg-slate-700';
  }
};

// ============================================
// COHORT SELECTOR
// ============================================
const CohortSelector = ({ cohorts, selectedCohortId, onSelect, loading }) => {
  // Sort cohorts alphabetically by name
  const sortedCohorts = [...cohorts].sort((a, b) => 
    (a.name || a.id).localeCompare(b.name || b.id)
  );
  
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Cohort:</label>
      <select
        value={selectedCohortId || ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={loading}
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 min-w-[200px]"
      >
        <option value="">All Cohorts</option>
        {sortedCohorts.map((cohort) => (
          <option key={cohort.id} value={cohort.id}>
            {cohort.name || `Cohort ${cohort.id.slice(0,8)}`}
          </option>
        ))}
      </select>
    </div>
  );
};

// ============================================
// COHORT SUMMARY STATS
// ============================================
const CohortSummaryStats = ({ users, leaderStats }) => {
  const totalLeaders = users.length;
  
  // Calculate aggregate stats
  const stats = useMemo(() => {
    if (!leaderStats || Object.keys(leaderStats).length === 0) {
      return { avgProgress: 0, onTrack: 0, needsAttention: 0, inactive: 0 };
    }
    
    let totalProgress = 0;
    let onTrack = 0;
    let needsAttention = 0;
    let inactive = 0;
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    users.forEach(user => {
      const stats = leaderStats[user.id] || {};
      const lastActive = stats.lastActive ? new Date(stats.lastActive) : null;
      const progress = stats.overallProgress || 0;
      totalProgress += progress;
      
      if (!lastActive || lastActive < sevenDaysAgo) {
        inactive++;
      } else if (progress >= 70 || lastActive >= threeDaysAgo) {
        onTrack++;
      } else {
        needsAttention++;
      }
    });
    
    return {
      avgProgress: totalLeaders > 0 ? Math.round(totalProgress / totalLeaders) : 0,
      onTrack,
      needsAttention,
      inactive
    };
  }, [users, leaderStats, totalLeaders]);
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-corporate-navy dark:text-white">{totalLeaders}</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">Total Leaders</div>
      </div>
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-green-600">{stats.onTrack}</div>
        <div className="text-sm text-green-600">On Track</div>
      </div>
      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-amber-600">{stats.needsAttention}</div>
        <div className="text-sm text-amber-600">Needs Attention</div>
      </div>
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
        <div className="text-3xl font-bold text-red-600">{stats.inactive}</div>
        <div className="text-sm text-red-600">Inactive (7+ days)</div>
      </div>
    </div>
  );
};

// ============================================
// LEADER SUMMARY ROW (Enhanced list item)
// ============================================
const LeaderSummaryRow = ({ leader, stats, isSelected, onSelect }) => {
  const lastActiveDate = stats?.lastActive ? new Date(stats.lastActive) : null;
  const now = new Date();
  const daysSinceActive = lastActiveDate 
    ? Math.floor((now - lastActiveDate) / (1000 * 60 * 60 * 24))
    : null;
  
  // Determine status
  const getStatus = () => {
    if (daysSinceActive === null || daysSinceActive >= 7) return { label: 'Inactive', color: 'bg-red-100 text-red-700 dark:bg-red-900/30' };
    if (daysSinceActive >= 3) return { label: 'At Risk', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' };
    return { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/30' };
  };
  
  const status = getStatus();
  const progress = stats?.overallProgress || 0;
  
  // Progress bar color
  const getProgressColor = (pct) => {
    if (pct >= 70) return 'bg-green-500';
    if (pct >= 40) return 'bg-amber-500';
    return 'bg-red-400';
  };
  
  return (
    <button
      onClick={() => onSelect(leader.id)}
      className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors grid grid-cols-12 gap-4 items-center ${
        isSelected ? 'bg-corporate-teal/10 border-l-4 border-corporate-teal' : ''
      }`}
    >
      {/* Name & Email - 3 cols */}
      <div className="col-span-3">
        <div className="font-medium text-corporate-navy dark:text-white truncate">
          {leader.displayName || leader.email?.split('@')[0] || 'Unknown'}
        </div>
        <div className="text-xs text-slate-500 truncate">{leader.email}</div>
      </div>
      
      {/* Progress Bar - 3 cols */}
      <div className="col-span-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${getProgressColor(progress)}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8">{progress}%</span>
        </div>
      </div>
      
      {/* Stats - 3 cols */}
      <div className="col-span-3 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1 text-green-600" title="Actions completed">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{stats?.actionsCompleted || 0}</span>
        </div>
        <div className="flex items-center gap-1 text-orange-600" title="Reps completed">
          <Zap className="w-3.5 h-3.5" />
          <span>{stats?.repsCompleted || 0}</span>
        </div>
        <div className="flex items-center gap-1 text-purple-600" title="Days logged">
          <FileText className="w-3.5 h-3.5" />
          <span>{stats?.daysLogged || 0}</span>
        </div>
      </div>
      
      {/* Status & Last Active - 3 cols */}
      <div className="col-span-3 flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
          {status.label}
        </span>
        <span className="text-xs text-slate-400">
          {lastActiveDate 
            ? daysSinceActive === 0 ? 'Today' : daysSinceActive === 1 ? 'Yesterday' : `${daysSinceActive}d ago`
            : 'Never'
          }
        </span>
      </div>
    </button>
  );
};

// ============================================
// LEADER SELECTOR (Enhanced with summary stats)
// ============================================
const LeaderSelector = ({ 
  leaders, 
  selectedLeaderId, 
  onSelect, 
  loading, 
  searchTerm, 
  onSearchChange,
  leaderStats,
  sortBy,
  onSortChange 
}) => {
  // Sort leaders based on selected sort option
  const sortedLeaders = useMemo(() => {
    if (!sortBy || sortBy === 'name') {
      return [...leaders].sort((a, b) => 
        (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '')
      );
    }
    
    return [...leaders].sort((a, b) => {
      const statsA = leaderStats?.[a.id] || {};
      const statsB = leaderStats?.[b.id] || {};
      
      switch (sortBy) {
        case 'progress':
          return (statsB.overallProgress || 0) - (statsA.overallProgress || 0);
        case 'progress-asc':
          return (statsA.overallProgress || 0) - (statsB.overallProgress || 0);
        case 'lastActive': {
          const dateA = statsA.lastActive ? new Date(statsA.lastActive) : new Date(0);
          const dateB = statsB.lastActive ? new Date(statsB.lastActive) : new Date(0);
          return dateB - dateA;
        }
        case 'inactive': {
          const activeA = statsA.lastActive ? new Date(statsA.lastActive) : new Date(0);
          const activeB = statsB.lastActive ? new Date(statsB.lastActive) : new Date(0);
          return activeA - activeB;
        }
        default:
          return 0;
      }
    });
  }, [leaders, leaderStats, sortBy]);
  
  return (
    <div className="space-y-3">
      {/* Search and Sort Row */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search leaders by name or email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 bg-white dark:bg-slate-800"
          />
        </div>
        <select
          value={sortBy || 'name'}
          onChange={(e) => onSortChange(e.target.value)}
          className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800"
        >
          <option value="name">Sort: Name</option>
          <option value="progress">Sort: Progress (High → Low)</option>
          <option value="progress-asc">Sort: Progress (Low → High)</option>
          <option value="lastActive">Sort: Recently Active</option>
          <option value="inactive">Sort: Most Inactive</option>
        </select>
      </div>
      
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-t-lg text-xs font-semibold text-slate-600 dark:text-slate-400">
        <div className="col-span-3">Leader</div>
        <div className="col-span-3">Overall Progress</div>
        <div className="col-span-3">Activity Stats</div>
        <div className="col-span-3">Status / Last Active</div>
      </div>
      
      {/* Leader List */}
      <div className="max-h-[400px] overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
            <div>Loading leader data...</div>
          </div>
        ) : sortedLeaders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No leaders found</div>
        ) : (
          sortedLeaders.map((leader) => (
            <LeaderSummaryRow
              key={leader.id}
              leader={leader}
              stats={leaderStats?.[leader.id]}
              isSelected={selectedLeaderId === leader.id}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

// ============================================
// ACTIVITY SECTION COMPONENT
// ============================================
const ActivitySection = ({ title, icon: Icon, color, items, expanded, onToggle, emptyMessage }) => {
  const colorClasses = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    teal: 'bg-teal-100 text-teal-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600',
    rose: 'bg-rose-100 text-rose-600',
    amber: 'bg-amber-100 text-amber-600',
    'corporate-teal': 'bg-corporate-teal/10 text-corporate-teal',
  };
  
  const completedCount = items.filter(i => 
    ['completed', 'loop_closed', 'debriefed'].includes(i.status)
  ).length;
  
  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.slate}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-corporate-navy dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {completedCount}/{items.length} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {completedCount === items.length && items.length > 0 && (
            <CheckCircle className="w-5 h-5 text-green-500" />
          )}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>
      
      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          {items.length === 0 ? (
            <div className="p-4 text-center text-slate-500 italic">
              {emptyMessage || 'No activity yet'}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="p-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <div className="mt-1">
                    {['completed', 'loop_closed', 'debriefed'].includes(item.status) ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : item.status === 'missed' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-corporate-navy dark:text-white">
                        {item.label || item.title || item.person || 'Activity'}
                      </span>
                      {item.type && (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                          {item.type}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(item.status)}`}>
                        {item.status || 'pending'}
                      </span>
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.completedAt && (
                      <p className="text-xs text-slate-400 mt-1">
                        Completed: {formatDate(item.completedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// ============================================
// CONDITIONING REPS SECTION
// ============================================
const ConditioningRepsSection = ({ reps, expanded, onToggle, userId }) => {
  const [selectedRep, setSelectedRep] = useState(null);
  
  const completedCount = reps.filter(r => 
    ['completed', 'loop_closed', 'debriefed'].includes(r.status)
  ).length;
  
  // Calculate average score from reps with quality assessments
  const scoredReps = reps.filter(r => r.qualityAssessment?.totalScore != null && r.qualityAssessment?.maxScore);
  const avgScoreData = scoredReps.length > 0
    ? {
        totalPoints: scoredReps.reduce((sum, r) => sum + (r.qualityAssessment.totalScore || 0), 0),
        maxPoints: scoredReps.reduce((sum, r) => sum + (r.qualityAssessment.maxScore || 0), 0)
      }
    : null;
  
  // Get score color based on percentage
  const getScoreColor = (score, maxScore) => {
    const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (pct >= 80) return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    if (pct >= 60) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
    return 'text-red-600 bg-red-100 dark:bg-red-900/30';
  };
  
  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-corporate-navy dark:text-white">Conditioning Reps</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {completedCount} completed, {reps.length} total
              {avgScoreData !== null && (
                <span className="ml-2">• Avg Score: <span className="font-semibold">{avgScoreData.totalPoints}/{avgScoreData.maxPoints}</span></span>
              )}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      
      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700">
          {reps.length === 0 ? (
            <div className="p-4 text-center text-slate-500 italic">No conditioning reps yet</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {reps.map((rep) => {
                const score = rep.qualityAssessment?.totalScore;
                const maxScore = rep.qualityAssessment?.maxScore;
                const meetsStandard = rep.qualityAssessment?.meetsStandard;
                
                return (
                  <button
                    key={rep.id}
                    onClick={() => setSelectedRep(rep)}
                    className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-corporate-navy dark:text-white">
                          {rep.person}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">
                          {rep.repType}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(rep.status)}`}>
                          {rep.status}
                        </span>
                        
                        {/* Score Badge */}
                        {score != null && maxScore && (
                          <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${getScoreColor(score, maxScore)}`}>
                            <Star className="w-3 h-3" />
                            {score}/{maxScore}
                          </span>
                        )}
                        {meetsStandard !== undefined && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            meetsStandard 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30' 
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                          }`}>
                            {meetsStandard ? '✓ Standard' : '⚠ Improve'}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{rep.weekId}</span>
                        <Eye className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    
                    {/* Brief evidence preview */}
                    {rep.evidence?.whatYouSaid && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                        "{rep.evidence.whatYouSaid.substring(0, 80)}..."
                      </p>
                    )}
                    
                    <div className="text-xs text-slate-400 mt-1">
                      Created: {formatDateShort(rep.createdAt)}
                      {rep.completedAt && ` | Completed: ${formatDateShort(rep.completedAt)}`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Rep Detail Modal */}
      {selectedRep && createPortal(
        <RepDetailModal
          isOpen={!!selectedRep}
          onClose={() => setSelectedRep(null)}
          rep={selectedRep}
          ownerUserId={userId}
        />,
        document.body
      )}
    </Card>
  );
};

// ============================================
// DAILY LOGS SECTION
// ============================================
const DailyLogsSection = ({ logs, expanded, onToggle }) => {
  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-corporate-navy dark:text-white">Daily Logs</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {logs.length} entries
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      
      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 max-h-[400px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="p-4 text-center text-slate-500 italic">No daily logs yet</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {logs.map((log, idx) => (
                <div key={log.id || idx} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-corporate-navy dark:text-white">
                      Day {log.dayNumber || log.id}
                    </span>
                    <span className="text-xs text-slate-400">{formatDateShort(log.date || log.createdAt)}</span>
                  </div>
                  {log.amCheckIn && (
                    <div className="mt-1 text-xs">
                      <span className="text-blue-600 font-medium">AM:</span>{' '}
                      {log.amCheckIn.intention || log.amCheckIn.focus || 'Completed'}
                    </div>
                  )}
                  {log.pmReflection && (
                    <div className="mt-1 text-xs">
                      <span className="text-purple-600 font-medium">PM:</span>{' '}
                      {log.pmReflection.win || log.pmReflection.reflection || 'Completed'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// ============================================
// VIDEO PROGRESS SECTION
// ============================================
const VideoProgressSection = ({ videos, expanded, onToggle }) => {
  const watchedCount = videos.filter(v => v.completed || v.progress >= 90).length;
  
  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 text-red-600">
            <Video className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-corporate-navy dark:text-white">Video Progress</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {watchedCount} videos watched
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>
      
      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 max-h-[300px] overflow-y-auto">
          {videos.length === 0 ? (
            <div className="p-4 text-center text-slate-500 italic">No video progress yet</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {videos.map((video, idx) => (
                <div key={video.id || idx} className="p-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm text-corporate-navy dark:text-white">
                      {video.title || video.videoId || video.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(100, video.progress || (video.completed ? 100 : 0))}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 w-10 text-right">
                      {Math.round(video.progress || (video.completed ? 100 : 0))}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// ============================================
// LEADER SUMMARY HEADER
// ============================================
const LeaderSummaryHeader = ({ leader, cohort, activityStats }) => {
  return (
    <Card className="p-4 mb-6">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-corporate-navy/10 flex items-center justify-center">
          <User className="w-8 h-8 text-corporate-navy" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-corporate-navy dark:text-white">
            {leader.displayName || leader.email?.split('@')[0] || 'Unknown Leader'}
          </h2>
          <p className="text-sm text-slate-500 mb-2">{leader.email}</p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            {cohort && (
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <Users className="w-4 h-4" />
                <span>{cohort.name || `Cohort ${cohort.id?.slice(0,8)}`}</span>
              </div>
            )}
            {leader.lastLogin && (
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                <span>Last login: {formatDateShort(leader.lastLogin)}</span>
              </div>
            )}
            {leader.createdAt && (
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>Joined: {formatDateShort(leader.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{activityStats.actionsCompleted}</div>
            <div className="text-xs text-green-600">Actions</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{activityStats.repsCompleted}</div>
            <div className="text-xs text-orange-600">Reps</div>
          </div>
          <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{activityStats.daysLogged}</div>
            <div className="text-xs text-purple-600">Days</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const LeaderActivityReport = () => {
  const { db } = useAppServices();
  
  // State
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [leaderStats, setLeaderStats] = useState({});
  
  // User activity data
  const [userData, setUserData] = useState(null);
  const [actionProgress, setActionProgress] = useState([]);
  const [conditioningReps, setConditioningReps] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [videoProgress, setVideoProgress] = useState([]);
  const [cohortInfo, setCohortInfo] = useState(null);
  
  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    onboarding: true,
    prep: true,
    'session-1': false,
    conditioning: true,
    dailyLogs: false,
    videos: false,
  });
  
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };
  
  // Load cohorts
  useEffect(() => {
    const loadCohorts = async () => {
      try {
        const cohortsSnap = await getDocs(collection(db, 'cohorts'));
        const cohortList = cohortsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCohorts(cohortList);
      } catch (err) {
        console.error('Error loading cohorts:', err);
      }
    };
    loadCohorts();
  }, [db]);
  
  // Load users based on cohort selection and compute summary stats
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setLeaderStats({});
      try {
        let usersQuery;
        if (selectedCohortId) {
          usersQuery = query(
            collection(db, 'users'),
            where('cohortId', '==', selectedCohortId)
          );
        } else {
          usersQuery = collection(db, 'users');
        }
        
        const usersSnap = await getDocs(usersQuery);
        const userList = usersSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
        setUsers(userList);
        
        // Load summary stats for each user (in parallel, batched)
        const statsMap = {};
        
        // Process users in batches of 10 to avoid overwhelming Firestore
        const batchSize = 10;
        for (let i = 0; i < userList.length; i += batchSize) {
          const batch = userList.slice(i, i + batchSize);
          
          await Promise.all(batch.map(async (user) => {
            try {
              // Get counts from subcollections
              const [actionsSnap, repsSnap, logsSnap] = await Promise.all([
                getDocs(query(collection(db, 'users', user.id, 'action_progress'))),
                getDocs(query(collection(db, 'users', user.id, 'conditioning_reps'))),
                getDocs(query(collection(db, 'users', user.id, 'daily_logs')))
              ]);
              
              const actionsCompleted = actionsSnap.docs.filter(d => d.data().status === 'completed').length;
              const repsCompleted = repsSnap.docs.filter(d => 
                ['completed', 'loop_closed', 'debriefed'].includes(d.data().status)
              ).length;
              const daysLogged = logsSnap.docs.length;
              
              // Calculate overall progress (simple formula: weighted completion)
              // Actions worth 40%, Reps worth 40%, Daily logs worth 20%
              const expectedActions = 20; // Rough estimate for 8-week program
              const expectedReps = 16; // ~2 per week
              const expectedDays = 40; // ~5 days per week * 8 weeks
              
              const actionProgress = Math.min(100, (actionsCompleted / expectedActions) * 100);
              const repProgress = Math.min(100, (repsCompleted / expectedReps) * 100);
              const logProgress = Math.min(100, (daysLogged / expectedDays) * 100);
              
              const overallProgress = Math.round((actionProgress * 0.4) + (repProgress * 0.4) + (logProgress * 0.2));
              
              // Find last active date
              let lastActive = user.lastLogin || user.updatedAt || user.createdAt;
              
              // Check most recent activity across subcollections
              const allDates = [];
              actionsSnap.docs.forEach(d => {
                const data = d.data();
                if (data.completedAt) allDates.push(data.completedAt);
              });
              repsSnap.docs.forEach(d => {
                const data = d.data();
                if (data.createdAt) allDates.push(data.createdAt);
                if (data.completedAt) allDates.push(data.completedAt);
              });
              logsSnap.docs.forEach(d => {
                const data = d.data();
                if (data.date) allDates.push(data.date);
                if (data.createdAt) allDates.push(data.createdAt);
              });
              
              // Find the most recent date
              const validDates = allDates
                .map(d => d?.toDate?.() || (d ? new Date(d) : null))
                .filter(d => d && !isNaN(d.getTime()));
              
              if (validDates.length > 0) {
                const mostRecent = new Date(Math.max(...validDates.map(d => d.getTime())));
                const lastLoginDate = lastActive?.toDate?.() || (lastActive ? new Date(lastActive) : null);
                if (!lastLoginDate || mostRecent > lastLoginDate) {
                  lastActive = mostRecent;
                }
              }
              
              statsMap[user.id] = {
                actionsCompleted,
                repsCompleted,
                daysLogged,
                totalActions: actionsSnap.docs.length,
                totalReps: repsSnap.docs.length,
                overallProgress,
                lastActive: lastActive?.toDate?.() || lastActive || null
              };
            } catch (err) {
              console.error(`Error loading stats for user ${user.id}:`, err);
              statsMap[user.id] = { actionsCompleted: 0, repsCompleted: 0, daysLogged: 0, overallProgress: 0, lastActive: null };
            }
          }));
        }
        
        setLeaderStats(statsMap);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [db, selectedCohortId]);
  
  // Filter users by search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(u => 
      u.displayName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);
  
  // Helper: Generate synthetic action items for computed completions (profile, assessment, etc.)
  // These are tracked in the user doc, not in action_progress subcollection
  const generateSyntheticActions = (user) => {
    const syntheticActions = [];
    const now = new Date();
    
    // 1. Leader Profile completion
    const leaderProfileComplete = user?.prepStatus?.leaderProfile || (
      user?.leaderProfile?.fullName &&
      user?.leaderProfile?.leadershipStyle &&
      user?.leaderProfile?.leadershipExperience
    );
    syntheticActions.push({
      id: 'synthetic-leader-profile',
      label: 'Complete Leader Profile',
      type: 'interactive',
      status: leaderProfileComplete ? 'completed' : 'pending',
      completedAt: leaderProfileComplete ? (user?.prepStatus?.leaderProfileAt || now) : null,
      _synthetic: true,
      _source: 'user.prepStatus.leaderProfile'
    });
    
    // 2. Baseline Assessment completion
    const baselineComplete = user?.prepStatus?.baselineAssessment || 
      !!(user?.assessmentHistory?.length > 0) ||
      !!(user?.assessmentResults);
    syntheticActions.push({
      id: 'synthetic-baseline-assessment',
      label: 'Complete Leadership Skills Baseline',
      type: 'interactive',
      status: baselineComplete ? 'completed' : 'pending',
      completedAt: baselineComplete ? (user?.prepStatus?.baselineAssessmentAt || now) : null,
      _synthetic: true,
      _source: 'user.prepStatus.baselineAssessment'
    });
    
    // 3. Foundation Commitment
    const foundationComplete = user?.prepStatus?.foundationCommitment || 
      !!(user?.foundationCommitment?.acknowledged);
    syntheticActions.push({
      id: 'synthetic-foundation-commitment',
      label: 'Accept Foundation Expectation',
      type: 'interactive',
      status: foundationComplete ? 'completed' : 'pending',
      completedAt: foundationComplete ? (user?.foundationCommitment?.acknowledgedAt || user?.prepStatus?.foundationCommitmentAt || now) : null,
      _synthetic: true,
      _source: 'user.foundationCommitment'
    });
    
    // 4. Notification Setup
    const notificationsComplete = user?.prepStatus?.notifications || false;
    syntheticActions.push({
      id: 'synthetic-notification-setup',
      label: 'Setup Notifications',
      type: 'interactive',
      status: notificationsComplete ? 'completed' : 'pending',
      completedAt: notificationsComplete ? (user?.prepStatus?.notificationsAt || now) : null,
      _synthetic: true,
      _source: 'user.prepStatus.notifications'
    });
    
    // 5. Conditioning Tutorial (if applicable)
    const conditioningTutorialComplete = user?.prepStatus?.conditioningTutorial || 
      !!(user?.conditioningTutorial?.completed);
    if (conditioningTutorialComplete || user?.conditioningTutorial) {
      syntheticActions.push({
        id: 'synthetic-conditioning-tutorial',
        label: 'Complete Conditioning Tutorial',
        type: 'interactive',
        status: conditioningTutorialComplete ? 'completed' : 'pending',
        completedAt: conditioningTutorialComplete ? (user?.conditioningTutorial?.completedAt || user?.prepStatus?.conditioningTutorialAt || now) : null,
        _synthetic: true,
        _source: 'user.conditioningTutorial'
      });
    }
    
    return syntheticActions;
  };

  // Load user activity data
  useEffect(() => {
    if (!selectedUserId) {
      setUserData(null);
      setActionProgress([]);
      setConditioningReps([]);
      setDailyLogs([]);
      setVideoProgress([]);
      setCohortInfo(null);
      return;
    }
    
    const loadUserActivity = async () => {
      setLoadingUser(true);
      try {
        // Get user doc
        const userSnap = await getDoc(doc(db, 'users', selectedUserId));
        if (!userSnap.exists()) {
          console.error('User not found');
          return;
        }
        const user = { id: userSnap.id, ...userSnap.data() };
        setUserData(user);
        
        // Get cohort info
        if (user.cohortId) {
          const cohortSnap = await getDoc(doc(db, 'cohorts', user.cohortId));
          if (cohortSnap.exists()) {
            setCohortInfo({ id: cohortSnap.id, ...cohortSnap.data() });
          }
        }
        
        // Get action_progress from subcollection
        const actionsSnap = await getDocs(
          query(collection(db, 'users', selectedUserId, 'action_progress'), orderBy('completedAt', 'desc'))
        );
        const actions = actionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Generate synthetic actions for computed completions (profile, assessment, etc.)
        // These are tracked in user doc, not action_progress subcollection
        const syntheticActions = generateSyntheticActions(user);
        
        // Merge: synthetic actions first (so they appear in Onboarding), then real actions
        // Filter out any action_progress items that duplicate synthetic ones
        const syntheticLabels = new Set(syntheticActions.map(a => a.label.toLowerCase()));
        const filteredActions = actions.filter(a => 
          !syntheticLabels.has((a.label || '').toLowerCase())
        );
        
        setActionProgress([...syntheticActions, ...filteredActions]);
        
        // Get conditioning_reps
        const repsSnap = await getDocs(
          query(collection(db, 'users', selectedUserId, 'conditioning_reps'), orderBy('createdAt', 'desc'))
        );
        const reps = repsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setConditioningReps(reps);
        
        // Get daily_logs
        const logsSnap = await getDocs(
          query(collection(db, 'users', selectedUserId, 'daily_logs'), orderBy('date', 'desc'))
        );
        const logs = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDailyLogs(logs);
        
        // Get videoProgress
        const videosSnap = await getDocs(
          collection(db, 'users', selectedUserId, 'videoProgress')
        );
        const videos = videosSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setVideoProgress(videos);
        
      } catch (err) {
        console.error('Error loading user activity:', err);
      } finally {
        setLoadingUser(false);
      }
    };
    
    loadUserActivity();
  }, [db, selectedUserId]);
  
  // Categorize actions by phase/session
  const categorizedActions = useMemo(() => {
    const categories = {};
    PHASES.forEach(phase => {
      categories[phase.id] = [];
    });
    
    actionProgress.forEach(action => {
      // Try to determine which phase this action belongs to
      const label = (action.label || '').toLowerCase();
      const id = (action.id || '').toLowerCase();
      
      // Synthetic interactive items (profile, assessment, etc.) go to Onboarding
      if (action._synthetic) {
        categories['onboarding'].push(action);
      } else if (label.includes('onboarding') || id.includes('onboarding')) {
        categories['onboarding'].push(action);
      } else if (label.includes('session 8') || id.includes('session-8')) {
        categories['session-8'].push(action);
      } else if (label.includes('session 7') || id.includes('session-7')) {
        categories['session-7'].push(action);
      } else if (label.includes('session 6') || id.includes('session-6')) {
        categories['session-6'].push(action);
      } else if (label.includes('session 5') || id.includes('session-5')) {
        categories['session-5'].push(action);
      } else if (label.includes('session 4') || id.includes('session-4')) {
        categories['session-4'].push(action);
      } else if (label.includes('session 3') || id.includes('session-3')) {
        categories['session-3'].push(action);
      } else if (label.includes('session 2') || id.includes('session-2')) {
        categories['session-2'].push(action);
      } else if (label.includes('session 1') || id.includes('session-1')) {
        categories['session-1'].push(action);
      } else if (label.includes('prep') || id.includes('prep')) {
        categories['prep'].push(action);
      } else {
        // Default to onboarding for unrecognized prep items
        categories['onboarding'].push(action);
      }
    });
    
    return categories;
  }, [actionProgress]);
  
  // Calculate activity stats
  const activityStats = useMemo(() => {
    return {
      actionsCompleted: actionProgress.filter(a => a.status === 'completed').length,
      repsCompleted: conditioningReps.filter(r => 
        ['completed', 'loop_closed', 'debriefed'].includes(r.status)
      ).length,
      daysLogged: dailyLogs.length,
    };
  }, [actionProgress, conditioningReps, dailyLogs]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">
            Leader Activity Report
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Complete analysis of leader activity across all program phases
          </p>
        </div>
      </div>
      
      {/* Cohort Selector */}
      <Card className="p-4">
        <CohortSelector
          cohorts={cohorts}
          selectedCohortId={selectedCohortId}
          onSelect={setSelectedCohortId}
          loading={loading}
        />
      </Card>
      
      {/* Cohort Summary Stats */}
      {users.length > 0 && (
        <CohortSummaryStats users={users} leaderStats={leaderStats} />
      )}
      
      {/* Leader List with Summary */}
      <Card className="p-4">
        <LeaderSelector
          leaders={filteredUsers}
          selectedLeaderId={selectedUserId}
          onSelect={setSelectedUserId}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          leaderStats={leaderStats}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </Card>
      
      {/* Selected Leader Content */}
      {selectedUserId && userData && (
        <>
          {loadingUser ? (
            <div className="flex items-center justify-center p-12">
              <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
            </div>
          ) : (
            <>
              {/* Leader Summary Header */}
              <LeaderSummaryHeader 
                leader={userData} 
                cohort={cohortInfo}
                activityStats={activityStats}
              />
              
              {/* Activity Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Actions by Phase */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-corporate-navy dark:text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Program Actions
                  </h3>
                  
                  {PHASES.map(phase => {
                    const items = categorizedActions[phase.id] || [];
                    // Only show phases that have items or are early phases
                    if (items.length === 0 && !['onboarding', 'prep', 'session-1'].includes(phase.id)) {
                      return null;
                    }
                    return (
                      <ActivitySection
                        key={phase.id}
                        title={phase.label}
                        icon={phase.icon}
                        color={phase.color}
                        items={items}
                        expanded={expandedSections[phase.id] || false}
                        onToggle={() => toggleSection(phase.id)}
                        emptyMessage={`No ${phase.label.toLowerCase()} actions completed yet`}
                      />
                    );
                  })}
                </div>
                
                {/* Right Column: Other Activity */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-corporate-navy dark:text-white flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activity & Progress
                  </h3>
                  
                  <ConditioningRepsSection
                    reps={conditioningReps}
                    userId={selectedUserId}
                    expanded={expandedSections.conditioning || false}
                    onToggle={() => toggleSection('conditioning')}
                  />
                  
                  <DailyLogsSection
                    logs={dailyLogs}
                    expanded={expandedSections.dailyLogs || false}
                    onToggle={() => toggleSection('dailyLogs')}
                  />
                  
                  <VideoProgressSection
                    videos={videoProgress}
                    expanded={expandedSections.videos || false}
                    onToggle={() => toggleSection('videos')}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}
      
      {/* No User Selected */}
      {!selectedUserId && (
        <Card className="p-12 text-center">
          <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Select a Leader
          </h3>
          <p className="text-slate-500">
            Choose a cohort and leader from the list above to view their complete activity report
          </p>
        </Card>
      )}
    </div>
  );
};

export default LeaderActivityReport;
