/**
 * RED Pattern Service
 * 
 * Provides analytics and pattern detection for Redirecting Feedback (RED) reps.
 * Tracks scenario distributions, difficulty trends, internal gap patterns,
 * person-based success rates, and surfaces coaching priorities.
 * 
 * Data is read from users/{userId}/conditioning_reps and feedback_threads
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  limit
} from 'firebase/firestore';

/**
 * Scenario type labels for display
 */
export const SCENARIO_TYPE_LABELS = {
  performance: 'Performance Issue',
  behavior: 'Behavior Issue', 
  missed_commitment: 'Missed Commitment',
  interpersonal: 'Interpersonal Issue',
  quality: 'Quality Issue',
  communication: 'Communication Issue',
  other: 'Other'
};

/**
 * Internal gap labels for display
 */
export const INTERNAL_GAP_LABELS = {
  reluctance_relationship: 'Reluctance due to relationship',
  reluctance_conflict: 'Reluctance due to conflict aversion',
  uncertainty_words: 'Uncertainty about what to say',
  uncertainty_approach: 'Uncertainty about approach',
  emotional_avoidance: 'Emotional avoidance',
  timing_concerns: 'Timing concerns',
  authority_concerns: 'Authority/power concerns',
  cultural_concerns: 'Cultural/diversity concerns',
  none: 'No internal gap',
  other: 'Other'
};

/**
 * Get all RED reps for a user
 */
async function getRedReps(db, userId, options = {}) {
  const { 
    startDate = null, 
    endDate = null, 
    person = null,
    limitCount = null 
  } = options;
  
  const repsRef = collection(db, 'users', userId, 'conditioning_reps');
  
  let constraints = [
    where('repType', '==', 'deliver_redirecting_feedback'),
    orderBy('createdAt', 'desc')
  ];
  
  if (startDate) {
    constraints.push(where('createdAt', '>=', startDate));
  }
  if (endDate) {
    constraints.push(where('createdAt', '<=', endDate));
  }
  if (person) {
    constraints.push(where('person', '==', person));
  }
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  
  // Note: Firestore requires composite indexes for multiple where clauses
  // Fallback: query by repType only and filter in memory
  try {
    const q = query(repsRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    // If index missing, fall back to simple query
    console.warn('Complex RED query failed, falling back to simple query:', err);
    const simpleQ = query(
      repsRef,
      where('repType', '==', 'deliver_redirecting_feedback')
    );
    const snapshot = await getDocs(simpleQ);
    let reps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filter in memory
    if (startDate) {
      reps = reps.filter(r => r.createdAt >= startDate);
    }
    if (endDate) {
      reps = reps.filter(r => r.createdAt <= endDate);
    }
    if (person) {
      reps = reps.filter(r => r.person === person);
    }
    
    // Sort
    reps.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    
    if (limitCount) {
      reps = reps.slice(0, limitCount);
    }
    
    return reps;
  }
}

/**
 * Get scenario type distribution for a user's RED reps
 * Returns counts and percentages by scenario type
 */
export async function getScenarioDistribution(db, userId, options = {}) {
  const reps = await getRedReps(db, userId, options);
  
  const distribution = {};
  let total = 0;
  
  for (const rep of reps) {
    const scenario = extractScenarioType(rep);
    if (scenario) {
      distribution[scenario] = (distribution[scenario] || 0) + 1;
      total++;
    }
  }
  
  // Convert to percentages
  const result = {};
  for (const [scenario, count] of Object.entries(distribution)) {
    result[scenario] = {
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      label: SCENARIO_TYPE_LABELS[scenario] || scenario
    };
  }
  
  return {
    distribution: result,
    total,
    mostCommon: Object.entries(result).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || null,
    leastCommon: Object.entries(result).sort((a, b) => a[1].count - b[1].count)[0]?.[0] || null
  };
}

/**
 * Get difficulty breakdown for RED reps
 * Returns distribution of self-reported difficulty levels
 */
export async function getDifficultyDistribution(db, userId, options = {}) {
  const reps = await getRedReps(db, userId, options);
  
  const difficultyLevels = {
    easy: { count: 0, label: 'Easy' },
    moderate: { count: 0, label: 'Moderate' },
    hard: { count: 0, label: 'Hard' },
    very_hard: { count: 0, label: 'Very Hard' },
    unspecified: { count: 0, label: 'Not Specified' }
  };
  
  let total = 0;
  
  for (const rep of reps) {
    const difficulty = rep.evidence?.redEvidence?.difficulty || 'unspecified';
    if (difficultyLevels[difficulty]) {
      difficultyLevels[difficulty].count++;
    } else {
      difficultyLevels.unspecified.count++;
    }
    total++;
  }
  
  // Add percentages
  for (const key of Object.keys(difficultyLevels)) {
    difficultyLevels[key].percentage = total > 0 
      ? Math.round((difficultyLevels[key].count / total) * 100) 
      : 0;
  }
  
  return {
    distribution: difficultyLevels,
    total,
    averageDifficultyScore: calculateDifficultyScore(difficultyLevels)
  };
}

/**
 * Get internal gap distribution
 * Shows what internal barriers leaders face most often
 */
export async function getInternalGapDistribution(db, userId, options = {}) {
  const reps = await getRedReps(db, userId, options);
  
  const distribution = {};
  let total = 0;
  let withGap = 0;
  
  for (const rep of reps) {
    const gap = rep.evidence?.redEvidence?.internalGap || 'unspecified';
    distribution[gap] = (distribution[gap] || 0) + 1;
    total++;
    if (gap !== 'none' && gap !== 'unspecified') {
      withGap++;
    }
  }
  
  // Convert to rich result
  const result = {};
  for (const [gap, count] of Object.entries(distribution)) {
    result[gap] = {
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      label: INTERNAL_GAP_LABELS[gap] || gap
    };
  }
  
  return {
    distribution: result,
    total,
    withGapCount: withGap,
    withGapPercentage: total > 0 ? Math.round((withGap / total) * 100) : 0,
    mostCommonGap: Object.entries(result)
      .filter(([k]) => k !== 'none' && k !== 'unspecified')
      .sort((a, b) => b[1].count - a[1].count)[0]?.[0] || null
  };
}

/**
 * Get person-based analytics
 * Shows success rates and patterns per person receiving feedback
 */
export async function getPersonAnalytics(db, userId, options = {}) {
  const reps = await getRedReps(db, userId, options);
  
  const personStats = {};
  
  for (const rep of reps) {
    const person = rep.person || 'Unknown';
    
    if (!personStats[person]) {
      personStats[person] = {
        totalReds: 0,
        loopsClosed: 0,
        behaviorChanged: 0,
        continuations: 0,
        avgDifficulty: [],
        scenarios: [],
        lastRedDate: null
      };
    }
    
    const stats = personStats[person];
    stats.totalReds++;
    
    // Track outcomes
    if (rep.status === 'loop_closed') {
      stats.loopsClosed++;
    }
    if (rep.ctlData?.decision === 'changed') {
      stats.behaviorChanged++;
    }
    if (rep.isContinuation) {
      stats.continuations++;
    }
    
    // Track difficulty
    const diff = rep.evidence?.redEvidence?.difficulty;
    if (diff) {
      stats.avgDifficulty.push(difficultyToNumber(diff));
    }
    
    // Track scenarios
    const scenario = extractScenarioType(rep);
    if (scenario && !stats.scenarios.includes(scenario)) {
      stats.scenarios.push(scenario);
    }
    
    // Track most recent
    if (!stats.lastRedDate || rep.createdAt > stats.lastRedDate) {
      stats.lastRedDate = rep.createdAt;
    }
  }
  
  // Compute derived stats
  const result = {};
  for (const [person, stats] of Object.entries(personStats)) {
    result[person] = {
      totalReds: stats.totalReds,
      loopsClosed: stats.loopsClosed,
      loopCloseRate: stats.totalReds > 0 
        ? Math.round((stats.loopsClosed / stats.totalReds) * 100) 
        : 0,
      behaviorChanged: stats.behaviorChanged,
      behaviorChangeRate: stats.loopsClosed > 0
        ? Math.round((stats.behaviorChanged / stats.loopsClosed) * 100)
        : 0,
      continuations: stats.continuations,
      avgDifficulty: stats.avgDifficulty.length > 0
        ? numberToDifficulty(Math.round(
            stats.avgDifficulty.reduce((a, b) => a + b, 0) / stats.avgDifficulty.length
          ))
        : null,
      scenarios: stats.scenarios,
      lastRedDate: stats.lastRedDate,
      // Flag for coaching attention
      needsAttention: stats.totalReds >= 3 && stats.behaviorChanged === 0
    };
  }
  
  return {
    byPerson: result,
    totalPeople: Object.keys(result).length,
    peopleNeedingAttention: Object.values(result).filter(p => p.needsAttention).length
  };
}

/**
 * Get trend analysis over time
 * Groups RED activity by week/month and tracks metrics
 */
export async function getTrendAnalysis(db, userId, options = {}) {
  const { period = 'week' } = options;
  const reps = await getRedReps(db, userId, options);
  
  const trends = {};
  
  for (const rep of reps) {
    const periodKey = getPeriodKey(rep.createdAt, period);
    
    if (!trends[periodKey]) {
      trends[periodKey] = {
        count: 0,
        completed: 0,
        behaviorChanged: 0,
        avgDifficulty: [],
        scenarios: {}
      };
    }
    
    const bucket = trends[periodKey];
    bucket.count++;
    
    if (rep.status === 'loop_closed') {
      bucket.completed++;
    }
    if (rep.ctlData?.decision === 'changed') {
      bucket.behaviorChanged++;
    }
    
    const diff = rep.evidence?.redEvidence?.difficulty;
    if (diff) {
      bucket.avgDifficulty.push(difficultyToNumber(diff));
    }
    
    const scenario = extractScenarioType(rep);
    if (scenario) {
      bucket.scenarios[scenario] = (bucket.scenarios[scenario] || 0) + 1;
    }
  }
  
  // Sort by period and compute derived values
  const sortedPeriods = Object.keys(trends).sort();
  const result = sortedPeriods.map(period => ({
    period,
    count: trends[period].count,
    completed: trends[period].completed,
    completionRate: trends[period].count > 0 
      ? Math.round((trends[period].completed / trends[period].count) * 100)
      : 0,
    behaviorChanged: trends[period].behaviorChanged,
    avgDifficulty: trends[period].avgDifficulty.length > 0
      ? numberToDifficulty(Math.round(
          trends[period].avgDifficulty.reduce((a, b) => a + b, 0) / trends[period].avgDifficulty.length
        ))
      : null,
    topScenario: Object.entries(trends[period].scenarios)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null
  }));
  
  return {
    trends: result,
    totalPeriods: result.length,
    // Calculate overall trend direction
    trendDirection: calculateTrendDirection(result)
  };
}

/**
 * Identify coaching priorities based on patterns
 * Returns actionable insights for the AI coach
 */
export async function identifyCoachingPriorities(db, userId) {
  const [
    scenarioData,
    difficultyData,
    gapData,
    personData,
    trendData
  ] = await Promise.all([
    getScenarioDistribution(db, userId),
    getDifficultyDistribution(db, userId),
    getInternalGapDistribution(db, userId),
    getPersonAnalytics(db, userId),
    getTrendAnalysis(db, userId)
  ]);
  
  const priorities = [];
  
  // Priority 1: Avoiding hard conversations
  if (difficultyData.distribution.very_hard.count === 0 && 
      difficultyData.distribution.hard.count < 2 &&
      difficultyData.total >= 5) {
    priorities.push({
      type: 'avoidance_pattern',
      severity: 'high',
      message: 'Leader may be avoiding difficult feedback conversations',
      insight: 'REDs are consistently rated as easy/moderate. Consider if harder conversations are being avoided.',
      recommendation: 'Encourage tackling a challenging feedback situation with AI coaching support.'
    });
  }
  
  // Priority 2: Same person, no behavior change
  const strugglePeople = Object.entries(personData.byPerson)
    .filter(([, stats]) => stats.totalReds >= 2 && stats.behaviorChangeRate === 0)
    .map(([name]) => name);
  
  if (strugglePeople.length > 0) {
    priorities.push({
      type: 'ineffective_feedback',
      severity: 'high',
      people: strugglePeople,
      message: `Feedback to ${strugglePeople.join(', ')} hasn't resulted in behavior change`,
      insight: 'Multiple feedback instances without observable change suggests need for escalation or different approach.',
      recommendation: 'Consider coaching on escalation paths or alternative feedback approaches.'
    });
  }
  
  // Priority 3: Consistent internal gap
  if (gapData.mostCommonGap && gapData.withGapPercentage >= 60) {
    priorities.push({
      type: 'internal_gap_pattern',
      severity: 'medium',
      gap: gapData.mostCommonGap,
      message: `Consistent internal barrier: ${INTERNAL_GAP_LABELS[gapData.mostCommonGap]}`,
      insight: `${gapData.withGapPercentage}% of RED reps mention internal gaps, most commonly "${INTERNAL_GAP_LABELS[gapData.mostCommonGap]}"`,
      recommendation: 'Focus coaching on building confidence in this specific area.'
    });
  }
  
  // Priority 4: Declining activity trend
  if (trendData.trendDirection === 'declining' && trendData.totalPeriods >= 4) {
    priorities.push({
      type: 'declining_activity',
      severity: 'medium',
      message: 'RED feedback frequency is declining',
      insight: 'The leader is practicing redirecting feedback less frequently over time.',
      recommendation: 'Re-engage with commitment-based planning and accountability check-ins.'
    });
  }
  
  // Priority 5: Limited scenario variety
  if (scenarioData.total >= 5) {
    const scenarioCount = Object.keys(scenarioData.distribution).length;
    if (scenarioCount <= 2) {
      priorities.push({
        type: 'limited_variety',
        severity: 'low',
        message: 'Limited variety in feedback scenarios',
        insight: `Only ${scenarioCount} scenario types practiced out of ${Object.keys(SCENARIO_TYPE_LABELS).length} available.`,
        recommendation: 'Encourage practicing feedback in different contexts to build versatility.'
      });
    }
  }
  
  // Priority 6: High loop abandonment
  const openLoops = await getOpenLoopCount(db, userId);
  if (openLoops > 3) {
    priorities.push({
      type: 'open_loops',
      severity: 'medium',
      count: openLoops,
      message: `${openLoops} feedback threads still open`,
      insight: 'Multiple open CTL threads suggest follow-through challenges.',
      recommendation: 'Focus on closing existing loops before starting new ones.'
    });
  }
  
  return {
    priorities: priorities.sort((a, b) => {
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    }),
    summary: {
      totalReds: scenarioData.total,
      avgDifficulty: difficultyData.averageDifficultyScore,
      gapRate: gapData.withGapPercentage,
      peopleCount: personData.totalPeople,
      trendDirection: trendData.trendDirection
    }
  };
}

/**
 * Generate a coaching context object for AI
 * Summarizes patterns in a format optimized for LLM consumption
 */
export async function generateCoachingContext(db, userId, targetPerson = null) {
  const priorities = await identifyCoachingPriorities(db, userId);
  
  let personContext = null;
  if (targetPerson) {
    const personData = await getPersonAnalytics(db, userId);
    personContext = personData.byPerson[targetPerson] || null;
  }
  
  return {
    coachingPriorities: priorities.priorities.slice(0, 3), // Top 3
    overallStats: priorities.summary,
    personContext,
    generatedAt: new Date().toISOString()
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Extract scenario type from rep data
 */
function extractScenarioType(rep) {
  // Check multiple locations where scenario might be stored
  const scenario = rep.evidence?.redEvidence?.situation?.selected
    || rep.situation?.selected
    || rep.evidence?.redEvidence?.scenarioType
    || rep.scenarioType
    || null;
  
  // Normalize to known types
  if (scenario && SCENARIO_TYPE_LABELS[scenario]) {
    return scenario;
  }
  
  // Try to match partial scenario names
  if (scenario) {
    const lower = scenario.toLowerCase();
    if (lower.includes('performance')) return 'performance';
    if (lower.includes('behavior')) return 'behavior';
    if (lower.includes('commitment')) return 'missed_commitment';
    if (lower.includes('interpersonal')) return 'interpersonal';
    if (lower.includes('quality')) return 'quality';
    if (lower.includes('communication')) return 'communication';
  }
  
  return 'other';
}

/**
 * Convert difficulty string to number for averaging
 */
function difficultyToNumber(difficulty) {
  const map = {
    easy: 1,
    moderate: 2,
    hard: 3,
    very_hard: 4
  };
  return map[difficulty] || 2;
}

/**
 * Convert number back to difficulty string
 */
function numberToDifficulty(num) {
  if (num <= 1.5) return 'easy';
  if (num <= 2.5) return 'moderate';
  if (num <= 3.5) return 'hard';
  return 'very_hard';
}

/**
 * Calculate weighted difficulty score
 */
function calculateDifficultyScore(distribution) {
  let total = 0;
  let weighted = 0;
  
  const weights = { easy: 1, moderate: 2, hard: 3, very_hard: 4 };
  
  for (const [level, { count }] of Object.entries(distribution)) {
    if (weights[level]) {
      total += count;
      weighted += count * weights[level];
    }
  }
  
  if (total === 0) return null;
  return numberToDifficulty(weighted / total);
}

/**
 * Get period key for trend grouping
 */
function getPeriodKey(dateStr, period) {
  if (!dateStr) return 'unknown';
  
  const date = new Date(dateStr);
  
  if (period === 'week') {
    // Get ISO week
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date - firstDayOfYear) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((dayOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
  }
  
  if (period === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  
  return dateStr.split('T')[0]; // Day
}

/**
 * Calculate trend direction from time series
 */
function calculateTrendDirection(trends) {
  if (trends.length < 3) return 'insufficient_data';
  
  // Compare first half to second half
  const midpoint = Math.floor(trends.length / 2);
  const firstHalf = trends.slice(0, midpoint);
  const secondHalf = trends.slice(midpoint);
  
  const firstAvg = firstHalf.reduce((sum, t) => sum + t.count, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, t) => sum + t.count, 0) / secondHalf.length;
  
  const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (changePercent > 20) return 'increasing';
  if (changePercent < -20) return 'declining';
  return 'stable';
}

/**
 * Count open feedback loops
 */
async function getOpenLoopCount(db, userId) {
  try {
    const repsRef = collection(db, 'users', userId, 'conditioning_reps');
    const q = query(
      repsRef,
      where('repType', '==', 'deliver_redirecting_feedback'),
      where('awaitingCTL', '==', true)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch {
    return 0;
  }
}

/**
 * Export all functions as default object
 */
export default {
  // Distribution analytics
  getScenarioDistribution,
  getDifficultyDistribution,
  getInternalGapDistribution,
  
  // Person-based analytics
  getPersonAnalytics,
  
  // Trend analysis
  getTrendAnalysis,
  
  // Coaching
  identifyCoachingPriorities,
  generateCoachingContext,
  
  // Constants
  SCENARIO_TYPE_LABELS,
  INTERNAL_GAP_LABELS
};
