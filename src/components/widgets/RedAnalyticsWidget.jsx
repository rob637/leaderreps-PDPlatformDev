// src/components/widgets/RedAnalyticsWidget.jsx
// Personal RED (Redirecting Feedback) analytics dashboard
// Shows feedback patterns, success rates, and coaching insights

import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquare, TrendingUp, TrendingDown, Target, Users,
  AlertTriangle, CheckCircle, Clock, ArrowRight, ChevronDown, ChevronUp,
  BarChart3, Activity, Lightbulb
} from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import redPatternService from '../../services/redPatternService';

/**
 * Personal RED Analytics Widget
 * Shows the user their feedback patterns and success rates
 */
const RedAnalyticsWidget = ({ helpText }) => {
  const { user, db } = useAppServices();
  const userId = user?.uid;

  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const [error, setError] = useState(null);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    if (!userId || !db) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Load all analytics in parallel
      const [
        scenarioData,
        difficultyData,
        gapData,
        personData,
        trendData,
        prioritiesData
      ] = await Promise.all([
        redPatternService.getScenarioDistribution(db, userId),
        redPatternService.getDifficultyDistribution(db, userId),
        redPatternService.getInternalGapDistribution(db, userId),
        redPatternService.getPersonAnalytics(db, userId),
        redPatternService.getTrendAnalysis(db, userId),
        redPatternService.identifyCoachingPriorities(db, userId)
      ]);

      setAnalytics({
        scenarios: scenarioData,
        difficulty: difficultyData,
        gaps: gapData,
        people: personData,
        trends: trendData,
        priorities: prioritiesData
      });
    } catch (err) {
      console.error('Error loading RED analytics:', err);
      setError('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [userId, db]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    setExpandedSection(prev => prev === sectionId ? null : sectionId);
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-corporate-teal" />
          <h3 className="font-semibold text-corporate-navy dark:text-white">Feedback Analytics</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Card>
    );
  }

  // Render error or no data state
  if (error || !analytics || analytics.scenarios.total === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-corporate-teal" />
          <h3 className="font-semibold text-corporate-navy dark:text-white">Feedback Analytics</h3>
        </div>
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {error || 'Complete some Redirecting Feedback reps to see your analytics'}
          </p>
        </div>
      </Card>
    );
  }

  const { scenarios, difficulty, gaps, people, trends, priorities } = analytics;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-corporate-teal" />
          <h3 className="font-semibold text-corporate-navy dark:text-white">Feedback Analytics</h3>
        </div>
        {helpText && (
          <span className="text-xs text-gray-400">{helpText}</span>
        )}
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-corporate-teal/10 rounded-lg">
          <div className="text-2xl font-bold text-corporate-teal">{scenarios.total}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total REDs</div>
        </div>
        <div className="text-center p-3 bg-corporate-orange/10 rounded-lg">
          <div className="text-2xl font-bold text-corporate-orange">{people.totalPeople}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">People</div>
        </div>
        <div className="text-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
            {trends.trendDirection === 'increasing' && <TrendingUp className="w-5 h-5" />}
            {trends.trendDirection === 'declining' && <TrendingDown className="w-5 h-5" />}
            {trends.trendDirection === 'stable' && <Activity className="w-5 h-5" />}
            {trends.trendDirection === 'insufficient_data' && '—'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Trend</div>
        </div>
      </div>

      {/* Coaching Priorities (if any) */}
      {priorities.priorities.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Coaching Insight</span>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {priorities.priorities[0].message}
          </p>
          {priorities.priorities[0].recommendation && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              → {priorities.priorities[0].recommendation}
            </p>
          )}
        </div>
      )}

      {/* Scenario Distribution */}
      <CollapsibleSection
        title="Feedback Scenarios"
        icon={<Target className="w-4 h-4" />}
        isExpanded={expandedSection === 'scenarios'}
        onToggle={() => toggleSection('scenarios')}
      >
        <div className="space-y-2">
          {Object.entries(scenarios.distribution)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([key, data]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">{data.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-corporate-teal rounded-full"
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{data.count}</span>
                </div>
              </div>
            ))}
        </div>
      </CollapsibleSection>

      {/* Difficulty Distribution */}
      <CollapsibleSection
        title="Difficulty Levels"
        icon={<Activity className="w-4 h-4" />}
        isExpanded={expandedSection === 'difficulty'}
        onToggle={() => toggleSection('difficulty')}
      >
        <div className="space-y-2">
          {['easy', 'moderate', 'hard', 'very_hard'].map(level => {
            const data = difficulty.distribution[level];
            if (!data || data.count === 0) return null;
            return (
              <div key={level} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                  {level.replace('_', ' ')}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        level === 'very_hard' ? 'bg-red-500' :
                        level === 'hard' ? 'bg-orange-500' :
                        level === 'moderate' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{data.count}</span>
                </div>
              </div>
            );
          })}
          {difficulty.averageDifficultyScore && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
              Average difficulty: <span className="capitalize">{difficulty.averageDifficultyScore.replace('_', ' ')}</span>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Person Analytics */}
      <CollapsibleSection
        title="By Person"
        icon={<Users className="w-4 h-4" />}
        isExpanded={expandedSection === 'people'}
        onToggle={() => toggleSection('people')}
      >
        <div className="space-y-3">
          {Object.entries(people.byPerson)
            .sort((a, b) => b[1].totalReds - a[1].totalReds)
            .slice(0, 5)
            .map(([name, stats]) => (
              <div key={name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    stats.needsAttention ? 'bg-red-500' :
                    stats.behaviorChangeRate >= 50 ? 'bg-green-500' :
                    'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">{stats.totalReds} REDs</span>
                  {stats.loopsClosed > 0 && (
                    <span className={stats.behaviorChangeRate >= 50 ? 'text-green-600' : 'text-amber-600'}>
                      {stats.behaviorChangeRate}% changed
                    </span>
                  )}
                  {stats.needsAttention && (
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          {people.peopleNeedingAttention > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-amber-600">
              {people.peopleNeedingAttention} person(s) may need escalation
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Internal Gaps */}
      {gaps.withGapCount > 0 && (
        <CollapsibleSection
          title="Internal Gaps"
          icon={<AlertTriangle className="w-4 h-4" />}
          isExpanded={expandedSection === 'gaps'}
          onToggle={() => toggleSection('gaps')}
        >
          <div className="space-y-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              {gaps.withGapPercentage}% of your REDs had an internal gap
            </div>
            {Object.entries(gaps.distribution)
              .filter(([key]) => key !== 'none' && key !== 'unspecified')
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 4)
              .map(([key, data]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{data.label}</span>
                  <span className="text-xs text-gray-500">{data.count}</span>
                </div>
              ))}
            {gaps.mostCommonGap && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                Most common: {redPatternService.INTERNAL_GAP_LABELS[gaps.mostCommonGap]}
              </div>
            )}
          </div>
        </CollapsibleSection>
      )}

      {/* Weekly Trend (last 4 weeks) */}
      {trends.trends.length >= 2 && (
        <CollapsibleSection
          title="Recent Activity"
          icon={<Clock className="w-4 h-4" />}
          isExpanded={expandedSection === 'trends'}
          onToggle={() => toggleSection('trends')}
        >
          <div className="space-y-2">
            {trends.trends.slice(-4).reverse().map(week => (
              <div key={week.period} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600 dark:text-gray-300">{week.period}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{week.count} REDs</span>
                  {week.behaviorChanged > 0 && (
                    <span className="text-xs text-green-600">
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      {week.behaviorChanged}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </Card>
  );
};

/**
 * Collapsible section component
 */
const CollapsibleSection = ({ title, icon, isExpanded, onToggle, children }) => {
  return (
    <div className="border-t border-gray-100 dark:border-gray-800">
      <button
        onClick={onToggle}
        className="w-full py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors -mx-2 px-2 rounded"
      >
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="pb-3 px-1">
          {children}
        </div>
      )}
    </div>
  );
};

export default RedAnalyticsWidget;
