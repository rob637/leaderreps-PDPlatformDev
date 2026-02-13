// src/components/conditioning/CoachPromptsPanel.jsx
// Sprint 5: Coach Prompts Panel for Trainer Dashboard
// Displays detected behavior patterns and coaching questions for each user

import React, { useState, useEffect, useCallback } from 'react';
import conditioningService, { COACH_PROMPTS } from '../../services/conditioningService.js';
import { Card, Button } from '../ui';
import { 
  Brain, AlertTriangle, TrendingDown, Clock, Target,
  ChevronDown, ChevronUp, MessageSquare, RefreshCw,
  User, Lightbulb, Send, CheckCircle
} from 'lucide-react';

// ============================================
// PATTERN ICON & STYLING
// ============================================
const getPatternConfig = (patternId) => {
  const configs = {
    low_risk_pattern: {
      icon: Target,
      color: 'amber',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-300'
    },
    avoidance_pattern: {
      icon: Clock,
      color: 'orange',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-300'
    },
    prep_strong_followthrough_weak: {
      icon: TrendingDown,
      color: 'red',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-700',
      borderColor: 'border-red-300'
    },
    no_close_pattern: {
      icon: MessageSquare,
      color: 'sky',
      bgColor: 'bg-sky-100',
      textColor: 'text-sky-700',
      borderColor: 'border-sky-300'
    },
    consecutive_misses: {
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-200',
      textColor: 'text-red-800',
      borderColor: 'border-red-400'
    }
  };
  return configs[patternId] || { icon: Brain, color: 'gray', bgColor: 'bg-gray-100 dark:bg-gray-700', textColor: 'text-gray-700 dark:text-gray-200', borderColor: 'border-gray-300 dark:border-gray-600' };
};

const getPriorityBadge = (priority) => {
  const styles = {
    critical: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-gray-400 text-white'
  };
  return styles[priority] || styles.low;
};

// ============================================
// SINGLE PATTERN CARD
// ============================================
const PatternCard = ({ pattern, onSendNudge }) => {
  const [isSending, setIsSending] = useState(false);
  const [wasSent, setWasSent] = useState(false);
  const config = getPatternConfig(pattern.id);
  const Icon = config.icon;
  
  const handleSendNudge = async () => {
    setIsSending(true);
    try {
      await onSendNudge(pattern);
      setWasSent(true);
    } catch (err) {
      console.error('Error sending nudge:', err);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className={`p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${config.bgColor} ${config.textColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium text-sm ${config.textColor}`}>
              {pattern.name}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${getPriorityBadge(pattern.priority)}`}>
              {pattern.priority}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
            {pattern.detection?.summary || pattern.description}
          </p>
          
          {/* Coaching Question */}
          <div className="bg-white/60 dark:bg-slate-800/60 rounded p-2 mb-2">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-700 dark:text-gray-200 italic">
                "{pattern.coachingQuestion}"
              </p>
            </div>
          </div>
          
          {/* Action Button */}
          {wasSent ? (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="w-3 h-3" />
              Nudge sent
            </span>
          ) : (
            <button
              onClick={handleSendNudge}
              disabled={isSending}
              className="flex items-center gap-1 text-xs text-corporate-navy hover:text-corporate-blue transition-colors disabled:opacity-50"
            >
              {isSending ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
              {isSending ? 'Sending...' : 'Send coaching nudge'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// USER PATTERNS ROW
// ============================================
const UserPatternsRow = ({ userResult, userEmail, onSendNudge, isExpanded, onToggle }) => {
  const patternCount = userResult.patterns.length;
  const topPattern = userResult.topPattern;
  const topConfig = getPatternConfig(topPattern.id);
  const TopIcon = topConfig.icon;
  
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={onToggle}
        className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${
          topPattern.priority === 'critical' ? 'bg-red-50 dark:bg-red-900/20' : ''
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${topConfig.bgColor}`}>
            <TopIcon className={`w-5 h-5 ${topConfig.textColor}`} />
          </div>
          <div className="text-left">
            <div className="font-medium text-corporate-navy">
              {userEmail || userResult.userId}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {patternCount} pattern{patternCount !== 1 ? 's' : ''} detected • {userResult.totalReps} reps analyzed
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(topPattern.priority)}`}>
            {topPattern.name}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {/* Expanded Pattern Details */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 dark:bg-gray-800 space-y-3">
          {userResult.patterns.map((pattern, idx) => (
            <PatternCard 
              key={pattern.id + idx}
              pattern={pattern}
              onSendNudge={async () => await onSendNudge(userResult.userId, pattern)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COACH PROMPTS PANEL
// ============================================
export const CoachPromptsPanel = ({ 
  db, 
  cohortId, 
  userIds, 
  userEmails = {},
  onSendNudge,
  className = '' 
}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  
  // Load pattern detection results
  const loadPatterns = useCallback(async () => {
    if (!db || !cohortId || !userIds?.length) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const cohortResults = await conditioningService.getCohortCoachPrompts(db, cohortId, userIds);
      setResults(cohortResults);
      setLastRefresh(new Date());
      
      // Auto-expand first user if any patterns found
      if (cohortResults.length > 0 && !expandedUserId) {
        setExpandedUserId(cohortResults[0].userId);
      }
    } catch (err) {
      console.error('Error loading coach prompts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [db, cohortId, userIds, expandedUserId]);
  
  useEffect(() => {
    loadPatterns();
  }, [loadPatterns]);
  
  // Handle send nudge - returns promise for async feedback
  const handleSendNudge = async (userId, pattern) => {
    if (onSendNudge) {
      await onSendNudge(userId, pattern.nudgeMessage, pattern);
    }
  };
  
  // Summary stats
  const criticalCount = results.filter(r => r.topPattern?.priority === 'critical').length;
  const highCount = results.filter(r => r.topPattern?.priority === 'high').length;
  const totalPatterns = results.reduce((sum, r) => sum + r.patterns.length, 0);
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-corporate-navy/5 to-corporate-teal/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-corporate-navy/10">
              <Brain className="w-5 h-5 text-corporate-navy" />
            </div>
            <div>
              <h3 className="font-semibold text-corporate-navy">Coach Prompts</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Behavior patterns detected over 4 weeks
              </p>
            </div>
          </div>
          
          <button
            onClick={loadPatterns}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50"
            title="Refresh patterns"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {/* Summary Stats */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span className="text-gray-600 dark:text-gray-300">{criticalCount} Critical</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span className="text-gray-600 dark:text-gray-300">{highCount} High</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-corporate-teal"></span>
              <span className="text-gray-600 dark:text-gray-300">{totalPatterns} Total Patterns</span>
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing patterns...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={loadPatterns}
              className="mt-2 text-sm text-corporate-blue hover:underline"
            >
              Try again
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center">
            <Brain className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">No patterns detected</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All leaders are executing effectively
            </p>
          </div>
        ) : (
          results.map((userResult) => (
            <UserPatternsRow
              key={userResult.userId}
              userResult={userResult}
              userEmail={userEmails[userResult.userId]}
              onSendNudge={handleSendNudge}
              isExpanded={expandedUserId === userResult.userId}
              onToggle={() => setExpandedUserId(
                expandedUserId === userResult.userId ? null : userResult.userId
              )}
            />
          ))
        )}
      </div>
      
      {/* Footer */}
      {lastRefresh && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 dark:bg-gray-800">
          <p className="text-xs text-gray-400 text-center">
            Last analyzed: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
      )}
    </Card>
  );
};

export default CoachPromptsPanel;
