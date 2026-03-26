// src/components/admin/RedAnalyticsPanel.jsx
// Admin view for cohort-wide RED (Redirecting Feedback) analytics
// Shows aggregate metrics, patterns, and flags for intervention

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, TrendingUp, TrendingDown, Target, Users,
  AlertTriangle, CheckCircle, Clock, ArrowRight, ChevronDown, ChevronUp,
  BarChart3, Activity, Lightbulb, RefreshCw, Download, Filter
} from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import { collection, getDocs, query, where } from 'firebase/firestore';
import redPatternService from '../../services/redPatternService';

/**
 * Admin RED Analytics Panel
 * Shows cohort-wide statistics and identifies users needing intervention
 */
const RedAnalyticsPanel = ({ cohortId = null }) => {
  const { db } = useAppServices();

  const [isLoading, setIsLoading] = useState(true);
  const [aggregateStats, setAggregateStats] = useState(null);
  const [userBreakdown, setUserBreakdown] = useState([]);
  const [alertUsers, setAlertUsers] = useState([]);
  const [openThreads, setOpenThreads] = useState([]);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Load aggregate analytics
  const loadAnalytics = useCallback(async () => {
    if (!db) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      // Get all users (or cohort members)
      let usersQuery = collection(db, 'users');
      if (cohortId) {
        usersQuery = query(usersQuery, where('cohortId', '==', cohortId));
      }
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Aggregate stats across all users
      let totalReds = 0;
      let totalCtls = 0;
      let totalBehaviorChanged = 0;
      let totalThreadsOpen = 0;
      const scenarioTotals = {};
      const difficultyTotals = { easy: 0, moderate: 0, hard: 0, very_hard: 0 };
      const gapTotals = {};
      const userStats = [];
      const alerts = [];
      const threads = [];

      // Process each user
      for (const u of users) {
        try {
          // Get user's RED reps
          const repsRef = collection(db, 'users', u.id, 'conditioning_reps');
          const repsQuery = query(repsRef, where('repType', '==', 'deliver_redirecting_feedback'));
          const repsSnapshot = await getDocs(repsQuery);
          const reps = repsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

          if (reps.length === 0) continue;

          let userRedCount = 0;
          let userCtlCount = 0;
          let userBehaviorChanged = 0;
          let userOpenThreads = 0;

          for (const rep of reps) {
            userRedCount++;
            totalReds++;

            // Count CTLs
            if (rep.ctlData) {
              userCtlCount++;
              totalCtls++;
              if (rep.ctlData.decision === 'changed') {
                userBehaviorChanged++;
                totalBehaviorChanged++;
              }
            }

            // Count open threads
            if (rep.awaitingCTL) {
              userOpenThreads++;
              totalThreadsOpen++;
              threads.push({
                userId: u.id,
                userEmail: u.email,
                repId: rep.id,
                person: rep.person,
                ctlDueDate: rep.ctlDueDate,
                createdAt: rep.createdAt
              });
            }

            // Aggregate scenarios
            const scenario = rep.evidence?.redEvidence?.situation?.selected || 
                           rep.situation?.selected || 'other';
            scenarioTotals[scenario] = (scenarioTotals[scenario] || 0) + 1;

            // Aggregate difficulty
            const diff = rep.evidence?.redEvidence?.difficulty;
            if (diff && difficultyTotals[diff] !== undefined) {
              difficultyTotals[diff]++;
            }

            // Aggregate gaps
            const gap = rep.evidence?.redEvidence?.internalGap;
            if (gap) {
              gapTotals[gap] = (gapTotals[gap] || 0) + 1;
            }
          }

          // Store user stats
          if (userRedCount > 0) {
            const userStat = {
              userId: u.id,
              email: u.email,
              name: u.displayName || u.email,
              redCount: userRedCount,
              ctlCount: userCtlCount,
              ctlRate: userRedCount > 0 ? Math.round((userCtlCount / userRedCount) * 100) : 0,
              behaviorChangedCount: userBehaviorChanged,
              changeRate: userCtlCount > 0 ? Math.round((userBehaviorChanged / userCtlCount) * 100) : 0,
              openThreads: userOpenThreads
            };
            userStats.push(userStat);

            // Flag users needing attention
            // Low CTL completion, high open threads, or no behavior change
            if (userRedCount >= 3 && userCtlCount === 0) {
              alerts.push({
                ...userStat,
                alertType: 'no_ctls',
                message: 'No Close the Loop completions despite multiple REDs'
              });
            } else if (userOpenThreads >= 3) {
              alerts.push({
                ...userStat,
                alertType: 'many_open',
                message: `${userOpenThreads} open feedback threads awaiting CTL`
              });
            } else if (userCtlCount >= 3 && userBehaviorChanged === 0) {
              alerts.push({
                ...userStat,
                alertType: 'no_change',
                message: 'Multiple CTLs completed but no behavior changes observed'
              });
            }
          }
        } catch (userErr) {
          console.warn(`Error processing user ${u.id}:`, userErr);
        }
      }

      // Sort user stats
      userStats.sort((a, b) => b.redCount - a.redCount);

      // Sort threads by due date (oldest first - most urgent)
      threads.sort((a, b) => (a.ctlDueDate || '').localeCompare(b.ctlDueDate || ''));

      setAggregateStats({
        totalReds,
        totalCtls,
        ctlRate: totalReds > 0 ? Math.round((totalCtls / totalReds) * 100) : 0,
        totalBehaviorChanged,
        changeRate: totalCtls > 0 ? Math.round((totalBehaviorChanged / totalCtls) * 100) : 0,
        totalThreadsOpen,
        totalUsers: userStats.length,
        scenarios: scenarioTotals,
        difficulty: difficultyTotals,
        gaps: gapTotals
      });

      setUserBreakdown(userStats);
      setAlertUsers(alerts);
      setOpenThreads(threads);

    } catch (err) {
      console.error('Error loading admin RED analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [db, cohortId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Render loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-corporate-teal" />
          <h3 className="font-semibold text-corporate-navy dark:text-white">RED Analytics (Admin)</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-corporate-teal" />
          <span className="ml-2 text-gray-500">Loading analytics...</span>
        </div>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-corporate-teal" />
          <h3 className="font-semibold text-corporate-navy dark:text-white">RED Analytics (Admin)</h3>
        </div>
        <div className="text-center py-6 text-red-500">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" />
          <p>{error}</p>
          <button 
            onClick={loadAnalytics}
            className="mt-3 text-sm text-corporate-teal hover:underline"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-corporate-teal" />
          <h3 className="font-semibold text-corporate-navy dark:text-white">RED Analytics (Admin)</h3>
        </div>
        <button 
          onClick={loadAnalytics}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'alerts', label: `Alerts (${alertUsers.length})`, icon: AlertTriangle },
          { id: 'threads', label: `Open Threads (${openThreads.length})`, icon: Clock },
          { id: 'users', label: 'Users', icon: Users }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              selectedTab === tab.id
                ? 'border-corporate-teal text-corporate-teal'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && aggregateStats && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Total REDs"
              value={aggregateStats.totalReds}
              icon={MessageSquare}
              color="teal"
            />
            <MetricCard
              label="CTL Rate"
              value={`${aggregateStats.ctlRate}%`}
              subValue={`${aggregateStats.totalCtls} completed`}
              icon={CheckCircle}
              color="blue"
            />
            <MetricCard
              label="Behavior Changed"
              value={`${aggregateStats.changeRate}%`}
              subValue={`${aggregateStats.totalBehaviorChanged} changed`}
              icon={TrendingUp}
              color="green"
            />
            <MetricCard
              label="Open Threads"
              value={aggregateStats.totalThreadsOpen}
              icon={Clock}
              color={aggregateStats.totalThreadsOpen > 10 ? 'red' : 'amber'}
            />
          </div>

          {/* Scenario Distribution */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Scenario Distribution
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(aggregateStats.scenarios)
                .sort((a, b) => b[1] - a[1])
                .map(([scenario, count]) => (
                  <div key={scenario} className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded">
                    <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                      {(redPatternService.SCENARIO_TYPE_LABELS[scenario] || scenario).replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium text-corporate-teal">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Difficulty Breakdown */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Difficulty Breakdown
            </h4>
            <div className="flex gap-4">
              {['easy', 'moderate', 'hard', 'very_hard'].map(level => {
                const count = aggregateStats.difficulty[level] || 0;
                const total = Object.values(aggregateStats.difficulty).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={level} className="flex-1 text-center">
                    <div className={`text-lg font-bold ${
                      level === 'very_hard' ? 'text-red-600' :
                      level === 'hard' ? 'text-orange-600' :
                      level === 'moderate' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{count}</div>
                    <div className="text-xs text-gray-500 capitalize">{level.replace('_', ' ')}</div>
                    <div className="text-xs text-gray-400">{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {selectedTab === 'alerts' && (
        <div className="space-y-3">
          {alertUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
              <p>No users flagged for attention</p>
            </div>
          ) : (
            alertUsers.map((alert, idx) => (
              <div 
                key={`${alert.userId}-${idx}`}
                className={`p-4 rounded-lg border ${
                  alert.alertType === 'no_change' ? 'bg-red-50 border-red-200' :
                  alert.alertType === 'no_ctls' ? 'bg-amber-50 border-amber-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{alert.name}</div>
                    <div className="text-sm text-gray-600">{alert.email}</div>
                    <div className="text-sm mt-1 text-amber-700">{alert.message}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div>{alert.redCount} REDs</div>
                    <div>{alert.ctlCount} CTLs</div>
                    <div className="text-green-600">{alert.changeRate}% changed</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Open Threads Tab */}
      {selectedTab === 'threads' && (
        <div className="space-y-3">
          {openThreads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
              <p>No open feedback threads</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">User</th>
                    <th className="pb-2">Person</th>
                    <th className="pb-2">CTL Due</th>
                    <th className="pb-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {openThreads.slice(0, 20).map((thread, idx) => {
                    const isOverdue = thread.ctlDueDate && new Date(thread.ctlDueDate) < new Date();
                    return (
                      <tr key={`${thread.repId}-${idx}`} className="border-b border-gray-100">
                        <td className="py-2">{thread.userEmail}</td>
                        <td className="py-2">{thread.person || '—'}</td>
                        <td className={`py-2 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                          {thread.ctlDueDate || '—'}
                          {isOverdue && <span className="ml-1">(overdue)</span>}
                        </td>
                        <td className="py-2 text-gray-500">
                          {thread.createdAt ? new Date(thread.createdAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {openThreads.length > 20 && (
                <div className="text-center py-2 text-sm text-gray-500">
                  Showing 20 of {openThreads.length} threads
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <div className="space-y-3">
          {userBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No RED data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2">User</th>
                    <th className="pb-2 text-center">REDs</th>
                    <th className="pb-2 text-center">CTLs</th>
                    <th className="pb-2 text-center">CTL Rate</th>
                    <th className="pb-2 text-center">Changed</th>
                    <th className="pb-2 text-center">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {userBreakdown.map(user => (
                    <tr key={user.userId} className="border-b border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-2">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="py-2 text-center">{user.redCount}</td>
                      <td className="py-2 text-center">{user.ctlCount}</td>
                      <td className="py-2 text-center">
                        <span className={user.ctlRate >= 70 ? 'text-green-600' : user.ctlRate >= 40 ? 'text-amber-600' : 'text-red-600'}>
                          {user.ctlRate}%
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        <span className={user.changeRate >= 50 ? 'text-green-600' : 'text-amber-600'}>
                          {user.changeRate}%
                        </span>
                      </td>
                      <td className="py-2 text-center">
                        {user.openThreads > 0 ? (
                          <span className={user.openThreads >= 3 ? 'text-red-600 font-medium' : 'text-amber-600'}>
                            {user.openThreads}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

/**
 * Metric Card Component
 */
const MetricCard = ({ label, value, subValue, icon, color }) => {
  const colorClasses = {
    teal: 'bg-corporate-teal/10 text-corporate-teal',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600'
  };

  const IconEl = icon;

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color] || colorClasses.teal}`}>
      <div className="flex items-center gap-2 mb-1">
        <IconEl className="w-4 h-4" />
        <span className="text-xs uppercase tracking-wide opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subValue && <div className="text-xs opacity-70">{subValue}</div>}
    </div>
  );
};

export default RedAnalyticsPanel;
