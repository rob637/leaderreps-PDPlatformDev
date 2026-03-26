// src/test/red-services.test.jsx
// Tests for RED (Redirecting Feedback) services
// feedbackThreadService.js and redPatternService.js

import { describe, it, expect, beforeEach } from 'vitest';
import feedbackThreadService from '../services/feedbackThreadService.js';
import redPatternService from '../services/redPatternService.js';

// ============================================
// FEEDBACK THREAD SERVICE TESTS
// ============================================
describe('FeedbackThreadService', () => {
  
  describe('CTL_THREAD_STATES constants', () => {
    it('should have all required thread states', () => {
      expect(feedbackThreadService.CTL_THREAD_STATES).toBeDefined();
      expect(feedbackThreadService.CTL_THREAD_STATES.OPEN).toBe('open');
      expect(feedbackThreadService.CTL_THREAD_STATES.OPEN_CONTINUE).toBe('open_continue');
      expect(feedbackThreadService.CTL_THREAD_STATES.DEFERRED).toBe('deferred');
      expect(feedbackThreadService.CTL_THREAD_STATES.CLOSED).toBe('closed');
    });
  });

  describe('detectAntiGamingPattern', () => {
    it('should return detected: false for thread with insufficient cycles', () => {
      const threadData = {
        cycles: [
          { ctlDecision: 'changed' }
        ]
      };
      const result = feedbackThreadService.detectAntiGamingPattern(threadData);
      expect(result.detected).toBe(false);
      expect(result.patterns).toEqual([]);
    });

    it('should detect avoidance pattern when consecutive not_changed without feedback', () => {
      const threadData = {
        cycles: [
          { ctlDecision: 'not_changed', gaveFollowupFeedback: false },
          { ctlDecision: 'not_changed', gaveFollowupFeedback: false },
          { ctlDecision: 'not_changed', gaveFollowupFeedback: false }
        ]
      };
      const result = feedbackThreadService.detectAntiGamingPattern(threadData);
      expect(result.detected).toBe(true);
      expect(result.patterns.length).toBeGreaterThan(0);
      expect(result.patterns.some(p => p.type === 'avoidance_pattern')).toBe(true);
    });

    it('should detect excessive deferrals pattern', () => {
      const threadData = {
        cycles: [
          { ctlDecision: 'not_observed' },
          { ctlDecision: 'not_observed' }
        ],
        deferrals: 3
      };
      const result = feedbackThreadService.detectAntiGamingPattern(threadData);
      expect(result.detected).toBe(true);
      expect(result.patterns.some(p => p.type === 'excessive_deferrals')).toBe(true);
    });

    it('should return detected: false for healthy thread', () => {
      const threadData = {
        cycles: [
          { ctlDecision: 'not_changed', gaveFollowupFeedback: true },
          { ctlDecision: 'changed' }
        ],
        deferrals: 0
      };
      const result = feedbackThreadService.detectAntiGamingPattern(threadData);
      expect(result.detected).toBe(false);
    });
  });

  describe('exported functions', () => {
    it('should export all CRUD functions', () => {
      expect(typeof feedbackThreadService.createFeedbackThread).toBe('function');
      expect(typeof feedbackThreadService.getFeedbackThread).toBe('function');
      expect(typeof feedbackThreadService.getThreadByRedId).toBe('function');
      expect(typeof feedbackThreadService.getOpenThreads).toBe('function');
      expect(typeof feedbackThreadService.getThreadsDueForCtl).toBe('function');
    });

    it('should export all CTL completion functions', () => {
      expect(typeof feedbackThreadService.completeCtlChanged).toBe('function');
      expect(typeof feedbackThreadService.completeCtlNotChanged).toBe('function');
      expect(typeof feedbackThreadService.completeCtlDeferred).toBe('function');
      expect(typeof feedbackThreadService.addContinuationRed).toBe('function');
    });

    it('should export utility functions', () => {
      expect(typeof feedbackThreadService.linkRedToThread).toBe('function');
      expect(typeof feedbackThreadService.getThreadAnalytics).toBe('function');
      expect(typeof feedbackThreadService.markCtlReminderSent).toBe('function');
      expect(typeof feedbackThreadService.detectAntiGamingPattern).toBe('function');
    });

    it('should export constants', () => {
      expect(feedbackThreadService.CTL_DEFAULT_SCHEDULE_DAYS).toBeDefined();
      expect(typeof feedbackThreadService.CTL_DEFAULT_SCHEDULE_DAYS).toBe('number');
      expect(feedbackThreadService.CTL_DEFER_DEFAULT_DAYS).toBeDefined();
    });
  });
});

// ============================================
// RED PATTERN SERVICE TESTS
// ============================================
describe('RedPatternService', () => {
  
  describe('Constants', () => {
    it('should export scenario type labels', () => {
      expect(redPatternService.SCENARIO_TYPE_LABELS).toBeDefined();
      expect(redPatternService.SCENARIO_TYPE_LABELS.performance).toBe('Performance Issue');
      expect(redPatternService.SCENARIO_TYPE_LABELS.behavior).toBe('Behavior Issue');
      expect(redPatternService.SCENARIO_TYPE_LABELS.missed_commitment).toBe('Missed Commitment');
    });

    it('should export internal gap labels', () => {
      expect(redPatternService.INTERNAL_GAP_LABELS).toBeDefined();
      expect(redPatternService.INTERNAL_GAP_LABELS.reluctance_relationship).toBe('Reluctance due to relationship');
      expect(redPatternService.INTERNAL_GAP_LABELS.uncertainty_words).toBe('Uncertainty about what to say');
    });
  });

  describe('Exported functions', () => {
    it('should export all analytics functions', () => {
      expect(typeof redPatternService.getScenarioDistribution).toBe('function');
      expect(typeof redPatternService.getDifficultyDistribution).toBe('function');
      expect(typeof redPatternService.getInternalGapDistribution).toBe('function');
      expect(typeof redPatternService.getPersonAnalytics).toBe('function');
      expect(typeof redPatternService.getTrendAnalysis).toBe('function');
      expect(typeof redPatternService.identifyCoachingPriorities).toBe('function');
      expect(typeof redPatternService.generateCoachingContext).toBe('function');
    });
  });
});

// ============================================
// CONSTANTS TESTS (from constants.js)
// ============================================
describe('RED Constants', () => {
  // Dynamically import to test
  let constants;
  
  beforeEach(async () => {
    constants = await import('../components/conditioning/constants.js');
  });

  it('should have RED_SCENARIO_OPTIONS with intensity defaults', () => {
    expect(constants.RED_SCENARIO_OPTIONS).toBeDefined();
    expect(Array.isArray(constants.RED_SCENARIO_OPTIONS)).toBe(true);
    
    // Check each option has required fields
    for (const option of constants.RED_SCENARIO_OPTIONS) {
      expect(option.id).toBeDefined();
      expect(option.label).toBeDefined();
      expect(typeof option.intensityDefault).toBe('number');
    }
  });

  it('should have RED_DIFFICULTY_OPTIONS', () => {
    expect(constants.RED_DIFFICULTY_OPTIONS).toBeDefined();
    expect(Array.isArray(constants.RED_DIFFICULTY_OPTIONS)).toBe(true);
    
    const ids = constants.RED_DIFFICULTY_OPTIONS.map(o => o.id);
    expect(ids).toContain('low');
    expect(ids).toContain('moderate');
    expect(ids).toContain('high');
  });

  it('should have RED_INTERNAL_GAP_OPTIONS', () => {
    expect(constants.RED_INTERNAL_GAP_OPTIONS).toBeDefined();
    expect(Array.isArray(constants.RED_INTERNAL_GAP_OPTIONS)).toBe(true);
    
    const ids = constants.RED_INTERNAL_GAP_OPTIONS.map(o => o.id);
    expect(ids).toContain('nothing');
    expect(ids).toContain('mild');
    expect(ids).toContain('strong');
    expect(ids).toContain('avoided');
  });

  it('should have CTL_THREAD_STATES', () => {
    expect(constants.CTL_THREAD_STATES).toBeDefined();
    expect(constants.CTL_THREAD_STATES.OPEN).toBe('open');
    expect(constants.CTL_THREAD_STATES.CLOSED).toBe('closed');
  });

  it('should have CTL_DECISION_OPTIONS', () => {
    expect(constants.CTL_DECISION_OPTIONS).toBeDefined();
    expect(Array.isArray(constants.CTL_DECISION_OPTIONS)).toBe(true);
    
    const ids = constants.CTL_DECISION_OPTIONS.map(o => o.id);
    expect(ids).toContain('changed');
    expect(ids).toContain('not_changed');
    expect(ids).toContain('not_observed');
  });

  it('should have CTL_NOT_OBSERVED_REASONS', () => {
    expect(constants.CTL_NOT_OBSERVED_REASONS).toBeDefined();
    expect(Array.isArray(constants.CTL_NOT_OBSERVED_REASONS)).toBe(true);
    
    const ids = constants.CTL_NOT_OBSERVED_REASONS.map(o => o.id);
    expect(ids).toContain('no_opportunity');
    expect(ids).toContain('behavior_not_recurred');
    expect(ids).toContain('person_unavailable');
  });

  it('should have RED_SELF_ASSESSMENT with 4 questions', () => {
    expect(constants.RED_SELF_ASSESSMENT).toBeDefined();
    expect(Array.isArray(constants.RED_SELF_ASSESSMENT)).toBe(true);
    expect(constants.RED_SELF_ASSESSMENT.length).toBe(4);
    
    // Check required fields
    for (const q of constants.RED_SELF_ASSESSMENT) {
      expect(q.id).toBeDefined();
      expect(q.prompt).toBeDefined();
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should have CTL_DEFAULT_SCHEDULE_DAYS', () => {
    expect(constants.CTL_DEFAULT_SCHEDULE_DAYS).toBeDefined();
    expect(typeof constants.CTL_DEFAULT_SCHEDULE_DAYS).toBe('number');
    expect(constants.CTL_DEFAULT_SCHEDULE_DAYS).toBeGreaterThan(0);
  });
});
