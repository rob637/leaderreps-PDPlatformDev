// src/components/conditioning/QualityAssessmentCard.jsx
// Phase 2: Displays quality assessment results after evidence submission
// V3: Enhanced with scoring transparency, improvement hints, and trends

import React, { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import conditioningService from '../../services/conditioningService.js';
import { Card } from '../ui';
import { 
  CheckCircle, XCircle, AlertTriangle, Send, RotateCcw,
  MessageSquare, Target, Handshake, Lightbulb, ChevronDown, HelpCircle,
  ClipboardCheck, Eye, UserCheck, ThumbsUp, Megaphone, X, TrendingUp, TrendingDown, Minus, Info, ArrowRight
} from 'lucide-react';

// Dimension icons and labels - use string keys to avoid module initialization order issues
// V2: 3 dimensions (specific_language, observed_response, reflection)
const DIMENSION_CONFIG = {
  specific_language: {
    icon: MessageSquare,
    label: 'What You Said',
    description: 'Described specifically what you said or did'
  },
  observed_response: {
    icon: Target,
    label: 'Their Response',
    description: 'Described how they responded'
  },
  // Legacy V1 dimensions (for backward compatibility with old reps)
  clear_request: {
    icon: Target,
    label: 'Clear Request',
    description: 'Made a clear ask or request'
  },
  named_commitment: {
    icon: Handshake,
    label: 'Named Commitment',
    description: 'Got or noted a specific commitment'
  },
  reflection: {
    icon: Lightbulb,
    label: 'Reflection',
    description: 'What went well & what to do differently'
  }
};

// SCE condition config - 4-condition scored rubric (0-3 per condition)
const SCE_CONDITION_CONFIG = {
  expectation_stated: {
    icon: MessageSquare,
    label: 'Expectation clearly stated',
    description: 'Stated the expectation using specific, observable language',
    isCritical: true,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Clear and actionable', example: '"Prepare a three-slide summary of the risks by Thursday"' },
      2: { label: 'Adequate', desc: 'Understandable but slightly vague', example: '"Put together a summary of the risks"' },
      1: { label: 'Weak', desc: 'Vague or incomplete', example: '"Handle this"' },
      0: { label: 'None', desc: 'No usable expectation', example: null }
    },
    improvementHint: 'Include an action, a clear object or outcome, and a specific instruction.'
  },
  success_defined: {
    icon: ClipboardCheck,
    label: 'Success criteria defined',
    description: 'Defined what success looks like in measurable terms',
    isCritical: true,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Clearly inspectable results', example: '"Include the three risks and recommended actions"' },
      2: { label: 'Adequate', desc: 'Outcome partially defined', example: '"Include the key risks"' },
      1: { label: 'Weak', desc: 'Outcome unclear', example: '"Make sure it\'s good"' },
      0: { label: 'None', desc: 'No success criteria provided', example: null }
    },
    improvementHint: 'Define what "done" looks like with scope, quantity, deadline, or measurable outcome.'
  },
  understanding_confirmed: {
    icon: Eye,
    label: 'Understanding confirmed',
    description: 'Confirmed the other person understood the expectation',
    isCritical: false,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Expectation restated', example: '"So you want three slides by Thursday"' },
      2: { label: 'Adequate', desc: 'Acknowledgement without restatement', example: '"Got it"' },
      1: { label: 'Weak', desc: 'Alignment assumed but not tested', example: null },
      0: { label: 'None', desc: 'No alignment evidence', example: null }
    },
    improvementHint: 'Ask them to restate the expectation or success criteria in their own words.'
  },
  ownership_established: {
    icon: UserCheck,
    label: 'Ownership established',
    description: 'Established ownership and commitment to act',
    isCritical: false,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Clearly accepted or reaffirmed', example: '"I\'ll take care of the report and have it ready Thursday"' },
      2: { label: 'Adequate', desc: 'Ownership implied but not explicit', example: '"I\'ll handle it"' },
      1: { label: 'Weak', desc: 'Uncertain or hesitant', example: '"I\'ll try"' },
      0: { label: 'None', desc: 'No ownership evidence', example: null }
    },
    improvementHint: 'Get explicit commitment: "Can I count on you to have this done by Thursday?"'
  }
};

// DRF condition config - 3-condition scored rubric (0-3 per condition)
const DRF_CONDITION_CONFIG = {
  behavior_named: {
    icon: Target,
    label: 'Observable Behavior Named',
    description: 'Described the observable behavior being reinforced',
    isCritical: true,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Clearly observable (Camera Test)', example: '"You stayed late to help the new rep learn the CRM"' },
      2: { label: 'Adequate', desc: 'Identifiable but slightly general', example: '"You did a nice job helping the team"' },
      1: { label: 'Weak', desc: 'Vague or interpreted', example: '"You showed great leadership"' },
      0: { label: 'None', desc: 'No behavior evidence', example: '"Great job" / "Nice work"' }
    },
    improvementHint: 'Apply the Camera Test: describe what a camera would actually capture.'
  },
  impact_explained: {
    icon: Megaphone,
    label: 'Impact Explained',
    description: 'Explained why the behavior matters',
    isCritical: false,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Impact clearly stated', example: '"That helped the team ramp faster"' },
      2: { label: 'Adequate', desc: 'Impact implied but not clearly explained', example: '"That really helped"' },
      1: { label: 'Weak', desc: 'Impact vague or generic', example: '"That was awesome"' },
      0: { label: 'None', desc: 'No impact stated', example: null }
    },
    improvementHint: 'Connect the behavior to team effectiveness, results, culture, or learning.'
  },
  reinforcement_given: {
    icon: ThumbsUp,
    label: 'Reinforcement Given',
    description: 'Reinforced or encouraged repeating the behavior',
    isCritical: false,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Clear encouragement to repeat', example: '"Keep doing that" / "That\'s exactly the approach we want"' },
      2: { label: 'Adequate', desc: 'Encouragement implied', example: '"I appreciate you doing that"' },
      1: { label: 'Weak', desc: 'Positive tone but no reinforcement signal', example: '"Nice" / "Good"' },
      0: { label: 'None', desc: 'No reinforcement present', example: null }
    },
    improvementHint: 'Signal you want to see this behavior again: "Keep doing that."'
  }
};

// FUW condition config - 3-condition scored rubric (0-3 per condition)
const FUW_CONDITION_CONFIG = {
  work_anchored: {
    icon: Target,
    label: 'Work Anchored & Status Requested',
    description: 'Asked about progress while referencing the specific work',
    isCritical: true,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Clear work reference and progress request', example: '"Where are you with the client proposal?"' },
      2: { label: 'Adequate', desc: 'Work referenced but slightly general', example: '"How\'s the proposal going?"' },
      1: { label: 'Weak', desc: 'Progress asked but work not clearly referenced', example: '"Any updates?"' },
      0: { label: 'None', desc: 'No progress question', example: null }
    },
    improvementHint: 'Anchor your follow-up to the specific work: "Where are you with [the work]?"'
  },
  progress_visible: {
    icon: Eye,
    label: 'Progress Visibility',
    description: 'The interaction revealed real execution progress',
    isCritical: false,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Leader validated progress with inspection', example: '"What\'s left to finish?"' },
      2: { label: 'Adequate', desc: 'Progress became visible without explicit validation', example: 'Direct clearly explained remaining work' },
      1: { label: 'Weak', desc: 'Leader accepted vague reassurance', example: '"It\'s going well"' },
      0: { label: 'None', desc: 'No visibility into progress', example: null }
    },
    improvementHint: 'Ask a validation question: "What\'s left to finish?" or "Where are you in the process?"'
  },
  ownership_preserved: {
    icon: UserCheck,
    label: 'Ownership Preserved',
    description: 'The work remained owned by the direct',
    isCritical: false,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Ownership clearly reinforced', example: '"What\'s your next step?" / "Sounds good — keep me posted"' },
      2: { label: 'Adequate', desc: 'Ownership implied but not clearly reinforced', example: '"Okay"' },
      1: { label: 'Weak', desc: 'Leader begins directing execution heavily', example: 'Prescribing the solution' },
      0: { label: 'None', desc: 'Leader takes back the work', example: '"Send it to me and I\'ll finish it"' }
    },
    improvementHint: 'Reinforce ownership: "What\'s your next step?" or "Keep me posted."'
  }
};

// LWV condition config - 3-condition scored rubric (0-3 per condition)
const LWV_CONDITION_CONFIG = {
  ownership_present: {
    icon: UserCheck,
    label: 'Ownership Present',
    description: 'Leader took personal responsibility for a mistake or learning gap',
    isCritical: true,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Clear personal ownership with no deflection', example: '"I rushed that decision and missed something important."' },
      2: { label: 'Adequate', desc: 'Ownership present but slightly hedged', example: '"I should have handled that differently."' },
      1: { label: 'Weak', desc: 'Ownership implied but not direct', example: '"Things could have gone better."' },
      0: { label: 'None', desc: 'No ownership or deflection to others', example: '"The team didn\'t execute well."' }
    },
    improvementHint: 'Lead with "I" — own the miss directly: "I rushed that decision" or "I should have caught that."'
  },
  statement_clarity: {
    icon: MessageSquare,
    label: 'Statement Clarity',
    description: 'The ownership statement was clear and specific',
    isCritical: false,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Clear, specific ownership that names the miss', example: '"I didn\'t give you enough context on the deadline."' },
      2: { label: 'Adequate', desc: 'Ownership stated but slightly general', example: '"I should have communicated better."' },
      1: { label: 'Weak', desc: 'Ownership vague or abstract', example: '"I made a mistake."' },
      0: { label: 'None', desc: 'No clear statement of ownership', example: null }
    },
    improvementHint: 'Be specific about what you owned: "I didn\'t [specific action] which led to [specific outcome]."'
  },
  forward_strength: {
    icon: ArrowRight,
    label: 'Forward Strength',
    description: 'The leader connected the ownership to forward action',
    isCritical: false,
    scoringGuide: {
      3: { label: 'Strong', desc: 'Clear forward commitment with specific action', example: '"Next time I\'ll brief you before the meeting."' },
      2: { label: 'Adequate', desc: 'Forward action implied but not specific', example: '"I\'ll do better next time."' },
      1: { label: 'Weak', desc: 'Forward action vague or absent', example: 'Acknowledged miss but no forward look' },
      0: { label: 'None', desc: 'No forward action or stuck in the past', example: null }
    },
    improvementHint: 'Connect ownership to action: "Next time I\'ll..." or "Going forward I\'m going to..."'
  }
};

// Map evaluationType to its condition config
const SCORED_CONDITION_CONFIGS = {
  sce_scored: SCE_CONDITION_CONFIG,
  drf_scored: DRF_CONDITION_CONFIG,
  fuw_scored: FUW_CONDITION_CONFIG,
  lwv_scored: LWV_CONDITION_CONFIG
};

// Scoring rubric metadata
const SCORING_RUBRICS = {
  sce_scored: {
    title: 'Set Clear Expectations',
    maxScore: 12,
    passThreshold: 6,
    autoFailRules: [
      'Any condition scores 0',
      'Two or more conditions score 1',
      'Expectation clearly stated = 1',
      'Success criteria defined = 1'
    ]
  },
  drf_scored: {
    title: 'Deliver Reinforcing Feedback',
    maxScore: 9,
    passThreshold: 5,
    autoFailRules: [
      'Any condition scores 0',
      'Two or more conditions score 1',
      'Observable Behavior Named = 1'
    ]
  },
  fuw_scored: {
    title: 'Follow-Up on the Work',
    maxScore: 9,
    passThreshold: 5,
    autoFailRules: [
      'Any condition scores 0',
      'Two or more conditions score 1',
      'Work Anchored & Status Requested = 1'
    ]
  },
  lwv_scored: {
    title: 'Lead With Vulnerability',
    maxScore: 9,
    passThreshold: 4,
    autoFailRules: [
      'Ownership Present < 2',
      'Any condition scores 0',
      'Two or more conditions score 1'
    ]
  }
};

const SCORE_COLORS = {
  3: { bg: 'bg-corporate-teal/10 dark:bg-corporate-teal/20', border: 'border-corporate-teal/30 dark:border-corporate-teal/40', text: 'text-corporate-teal', icon: 'bg-corporate-teal/20 dark:bg-corporate-teal/30' },
  2: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300/30 dark:border-blue-500/30', text: 'text-blue-600 dark:text-blue-400', icon: 'bg-blue-100 dark:bg-blue-900/30' },
  1: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300/30 dark:border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', icon: 'bg-amber-100 dark:bg-amber-900/30' },
  0: { bg: 'bg-corporate-orange/10 dark:bg-corporate-orange/20', border: 'border-corporate-orange/30 dark:border-corporate-orange/40', text: 'text-corporate-orange', icon: 'bg-corporate-orange/20 dark:bg-corporate-orange/30' },
};

// ============================================
// SCORING INFO MODAL
// ============================================
const ScoringInfoModal = ({ isOpen, onClose, evaluationType }) => {
  if (!isOpen) return null;
  
  const rubric = SCORING_RUBRICS[evaluationType];
  const conditionConfig = SCORED_CONDITION_CONFIGS[evaluationType];
  if (!rubric || !conditionConfig) return null;
  
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={(e) => { e.stopPropagation(); onClose(); }}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <h3 className="font-bold text-lg text-corporate-navy dark:text-white">
            Scoring Criteria
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Rep Type */}
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">Evaluating</p>
            <p className="font-semibold text-corporate-navy dark:text-white">{rubric.title}</p>
          </div>
          
          {/* Pass Threshold */}
          <div className="bg-corporate-teal/10 dark:bg-corporate-teal/20 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-corporate-navy dark:text-white">Pass Threshold</span>
              <span className="text-sm font-bold text-corporate-teal">{rubric.passThreshold}/{rubric.maxScore}</span>
            </div>
          </div>
          
          {/* Conditions That Prevent Passing - moved up for visibility */}
          <div>
            <h4 className="font-semibold text-sm text-corporate-navy dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-corporate-orange" />
              Conditions That Prevent Passing
            </h4>
            <ul className="space-y-1">
              {rubric.autoFailRules.map((rule, i) => (
                <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <span className="text-corporate-orange">•</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Score Levels */}
          <div>
            <h4 className="font-semibold text-sm text-corporate-navy dark:text-white mb-2">Score Levels</h4>
            <div className="grid grid-cols-4 gap-2">
              {[3, 2, 1, 0].map(score => (
                <div key={score} className={`p-2 rounded-lg text-center ${SCORE_COLORS[score].bg}`}>
                  <div className={`text-lg font-bold ${SCORE_COLORS[score].text}`}>{score}</div>
                  <div className={`text-xs ${SCORE_COLORS[score].text}`}>
                    {score === 3 ? 'Strong' : score === 2 ? 'Adequate' : score === 1 ? 'Weak' : 'None'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Conditions - in consistent order */}
          <div>
            <h4 className="font-semibold text-sm text-corporate-navy dark:text-white mb-2">Conditions Evaluated</h4>
            <div className="space-y-3">
              {/* Use fixed order from config keys for consistency */}
              {Object.keys(conditionConfig).map((key) => {
                const config = conditionConfig[key];
                const Icon = config.icon;
                return (
                  <div key={key} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-corporate-teal" />
                      <span className="font-medium text-sm text-corporate-navy dark:text-white">{config.label}</span>
                      {config.isCritical && (
                        <span className="text-xs bg-corporate-orange/10 text-corporate-orange px-1.5 py-0.5 rounded">Critical</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{config.description}</p>
                    
                    {/* Score examples - show Strong (3) examples prominently */}
                    <div className="space-y-1">
                      {[3, 2, 1].map(score => {
                        const guide = config.scoringGuide?.[score];
                        if (!guide?.example) return null;
                        return (
                          <div key={score} className="flex items-start gap-2 text-xs">
                            <span className={`font-semibold px-1.5 rounded ${SCORE_COLORS[score].bg} ${SCORE_COLORS[score].text}`}>{score}</span>
                            <span className="text-slate-600 dark:text-slate-400 italic">{guide.example}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Coaching question prompts for each dimension - designed to prompt reflection, not give answers
// V2: Updated for 3-dimension format
const PRACTICE_PROMPTS = {
  specific_language: 
    'Think back to that moment. If you were watching a video replay, what exact words would you hear yourself saying? Close your eyes and try to remember.',
  observed_response:
    'How did they react in the moment? What did you notice about their body language, tone, or words?',
  // Legacy V1 prompts (for backward compatibility)
  clear_request: 
    'What do you actually need from this person? And how might you say that in a way that makes the ask crystal clear?',
  named_commitment: 
    'What would a real commitment sound like from them? What specific action and timeline would you want them to agree to?',
  reflection: 
    'What surprised you about how this went? If you could go back and do it again, what would you do differently and why?'
};

// ============================================
// DIMENSION ROW
// ============================================
const DimensionRow = ({ dimension, assessment, onPractice }) => {
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceResponse, setPracticeResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState(null);
  
  const config = DIMENSION_CONFIG[dimension];
  if (!config || !assessment) return null;
  
  const Icon = config.icon;
  const { passed, feedback } = assessment;
  
  const handlePracticeClick = (e) => {
    e.stopPropagation();
    setIsPracticing(true);
    setPracticeFeedback(null);
    setPracticeResponse('');
  };
  
  const handleSubmitPractice = async (e) => {
    e.stopPropagation();
    if (!practiceResponse.trim() || !onPractice) return;
    
    setIsSubmitting(true);
    try {
      // Get instant assessment feedback
      const result = conditioningService.assessPracticeResponse(dimension, practiceResponse.trim());
      
      // Save to Firestore
      await onPractice(dimension, practiceResponse.trim(), result);
      
      // Show feedback inline
      setPracticeFeedback(result);
      setIsPracticing(false);
    } catch (err) {
      console.error('Error submitting practice:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={`p-3 rounded-lg border ${
      passed 
        ? 'bg-corporate-teal/10 dark:bg-corporate-teal/20 border-corporate-teal/30 dark:border-corporate-teal/40' 
        : 'bg-corporate-orange/10 dark:bg-corporate-orange/20 border-corporate-orange/30 dark:border-corporate-orange/40'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${
          passed ? 'bg-corporate-teal/20 dark:bg-corporate-teal/30' : 'bg-corporate-orange/20 dark:bg-corporate-orange/30'
        }`}>
          <Icon className={`w-4 h-4 ${
            passed ? 'text-corporate-teal' : 'text-corporate-orange'
          }`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-corporate-navy dark:text-white">{config.label}</span>
            {passed ? (
              <CheckCircle className="w-4 h-4 text-corporate-teal" />
            ) : (
              <XCircle className="w-4 h-4 text-corporate-orange" />
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{feedback}</p>
          
          {/* Show AI-extracted quote if available */}
          {assessment.quote && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-corporate-navy/5 dark:bg-corporate-navy/20 text-sm text-corporate-navy dark:text-slate-200 italic">
              "{assessment.quote}"
            </div>
          )}
          
          {/* Show coaching question for failed dimensions */}
          {!passed && assessment.coachingQuestion && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-corporate-teal/10 dark:bg-corporate-teal/20 border border-corporate-teal/20 dark:border-corporate-teal/30">
              <div className="flex items-center gap-1.5 text-xs font-medium text-corporate-teal dark:text-corporate-teal mb-1">
                <Lightbulb className="w-3.5 h-3.5" />
                Reflection:
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-200 italic">
                {assessment.coachingQuestion}
              </p>
            </div>
          )}
          
          {/* Practice button for failed dimensions - before any practice attempt */}
          {!passed && onPractice && !isPracticing && !practiceFeedback && (
            <button
              onClick={handlePracticeClick}
              className="mt-2 text-xs font-medium text-corporate-teal hover:underline"
            >
              Practice this →
            </button>
          )}
          
          {/* Practice feedback after submission */}
          {practiceFeedback && (
            <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
              {/* What they wrote */}
              <div className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-200 italic">
                "{practiceResponse}"
              </div>
              
              {/* AI Feedback */}
              <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm ${
                practiceFeedback.passed
                  ? 'bg-corporate-teal/10 dark:bg-corporate-teal/20 text-corporate-teal'
                  : 'bg-corporate-orange/10 dark:bg-corporate-orange/20 text-corporate-orange'
              }`}>
                {practiceFeedback.passed ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                )}
                <span>{practiceFeedback.feedback}</span>
              </div>
              
              {/* Try again if didn't pass */}
              {!practiceFeedback.passed && (
                <button
                  onClick={handlePracticeClick}
                  className="flex items-center gap-1.5 text-xs font-medium text-corporate-teal hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  Try again
                </button>
              )}
            </div>
          )}
          
          {/* Inline practice prompt */}
          {isPracticing && (
            <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {PRACTICE_PROMPTS[dimension]}
              </p>
              <textarea
                autoFocus
                value={practiceResponse}
                onChange={(e) => setPracticeResponse(e.target.value)}
                placeholder="Type your practice response..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                  focus:ring-2 focus:ring-corporate-teal focus:border-transparent resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSubmitPractice}
                  disabled={!practiceResponse.trim() || isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                    bg-corporate-teal text-white hover:bg-corporate-teal/90 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3 h-3" />
                  {isSubmitting ? 'Assessing...' : 'Submit'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setIsPracticing(false); setPracticeResponse(''); }}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SCORED CONDITION ROW (scored 0-3, used by SCE/DRF)
// ============================================
const ScoredConditionRow = ({ conditionKey, condition, conditionConfig }) => {
  const config = conditionConfig[conditionKey];
  if (!config || !condition) return null;
  
  const Icon = config.icon;
  const score = condition.score ?? 0;
  const colors = SCORE_COLORS[score] || SCORE_COLORS[0];
  const showImprovementHint = score < 3 && config.improvementHint;
  const nextLevel = score < 3 ? config.scoringGuide?.[score + 1] : null;
  
  return (
    <div className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${colors.icon}`}>
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-corporate-navy dark:text-white">{config.label}</span>
            {config.isCritical && (
              <span className="text-[10px] bg-corporate-orange/10 text-corporate-orange px-1 py-0.5 rounded">Critical</span>
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
              {score}/3{condition.label ? ` · ${condition.label}` : ''}
            </span>
          </div>
          {condition.feedback && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{condition.feedback}</p>
          )}
          {condition.quote && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-corporate-navy/5 dark:bg-corporate-navy/20 text-sm text-corporate-navy dark:text-slate-200 italic">
              &ldquo;{condition.quote}&rdquo;
            </div>
          )}
          {/* Improvement hint for scores < 3 - always aim for Strong */}
          {showImprovementHint && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-corporate-teal flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-corporate-teal">
                    To reach Strong:
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {config.improvementHint}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Track which assessments the user has manually toggled (persists across remounts within session)
const _userToggledAssessments = new Map();

// ============================================
// MAIN QUALITY CARD
// ============================================
const QualityAssessmentCard = ({ qualityAssessment, onPractice, compact = false, defaultExpanded = false, trend = null }) => {
  const isScored = !!SCORED_CONDITION_CONFIGS[qualityAssessment?.evaluationType];
  
  // Use a stable key from the assessment to track user toggle state across remounts
  const assessmentKey = qualityAssessment?.assessedAt || qualityAssessment?.timestamp || 'default';
  const userToggled = _userToggledAssessments.has(assessmentKey);
  const initialExpanded = userToggled ? _userToggledAssessments.get(assessmentKey) : defaultExpanded;
  
  const [expanded, setExpanded] = useState(initialExpanded);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Toggle that remembers user's choice
  const toggleExpanded = useCallback(() => {
    setExpanded(prev => {
      const next = !prev;
      _userToggledAssessments.set(assessmentKey, next);
      return next;
    });
  }, [assessmentKey]);
  
  if (!qualityAssessment) return null;
  
  const isSCE = qualityAssessment.evaluationType === 'sce_scored';
  const scoredConditionConfig = SCORED_CONDITION_CONFIGS[qualityAssessment.evaluationType] || {};
  
  const { 
    dimensions, 
    passedCount, 
    totalDimensions, 
    meetsStandard, 
    summary,
    isConstructive,
    constructiveFeedback,
    coachingTip,
    assessedBy,
    // SCE-specific fields
    conditions,
    totalScore,
    maxScore,
    repPassed,
    autoFailTriggered,
    autoFailReason,
    coachingQuestions,
    reflectionPrompt
  } = qualityAssessment;
  
  // For scored reps: use repPassed; for generic: use meetsStandard
  const passed = isScored ? repPassed : meetsStandard;
  
  // If not constructive, show warning state
  const showWarning = isConstructive === false;
  
  if (compact) {
    // Compact view for rep cards
    const compactLabel = isScored ? `${totalScore}/${maxScore}` : `${passedCount}/${totalDimensions} dimensions`;
    return (
      <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${
        showWarning
          ? 'bg-corporate-orange/10 dark:bg-corporate-orange/20 text-corporate-orange'
          : passed 
            ? 'bg-corporate-teal/10 dark:bg-corporate-teal/20 text-corporate-teal' 
            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
      }`}>
        {showWarning ? (
          <XCircle className="w-3 h-3" />
        ) : passed ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
        <span>{showWarning ? 'Needs review' : compactLabel}</span>
      </div>
    );
  }
  
  const scoreBarPct = isScored ? ((totalScore || 0) / (maxScore || 12)) * 100 : ((passedCount || 0) / (totalDimensions || 3)) * 100;
  const scoreBadge = isScored ? `${totalScore}/${maxScore}` : `${passedCount}/${totalDimensions}`;
  
  return (
    <Card className={`border-l-4 ${
      showWarning 
        ? 'border-l-corporate-orange'
        : passed ? 'border-l-corporate-teal' : 'border-l-amber-500'
    }`}>
      <div className="p-4">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <button
            onClick={toggleExpanded}
            className="flex-1 flex items-center gap-3"
          >
            <h4 className="font-bold text-corporate-navy dark:text-white">RepUp Review</h4>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              showWarning
                ? 'bg-corporate-orange/10 dark:bg-corporate-orange/20 text-corporate-orange'
                : passed 
                  ? 'bg-corporate-teal/10 dark:bg-corporate-teal/20 text-corporate-teal' 
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'
            }`}>
              {showWarning ? <XCircle className="w-3 h-3" /> : passed ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              <span>{showWarning ? 'Needs review' : scoreBadge}</span>
            </div>
            {/* Trend indicator */}
            {trend && (
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                trend.direction === 'up' ? 'bg-corporate-teal/10 text-corporate-teal' :
                trend.direction === 'down' ? 'bg-corporate-orange/10 text-corporate-orange' :
                'bg-slate-100 dark:bg-slate-700 text-slate-500'
              }`}>
                {trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> :
                 trend.direction === 'down' ? <TrendingDown className="w-3 h-3" /> :
                 <Minus className="w-3 h-3" />}
                <span>{trend.avgScore}</span>
              </div>
            )}
          </button>
          <div className="flex items-center gap-1">
            {/* Info button for scoring criteria */}
            {isScored && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowInfoModal(true); }}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title="Scoring criteria"
              >
                <Info className="w-4 h-4 text-slate-400 hover:text-corporate-teal" />
              </button>
            )}
            <button
              onClick={toggleExpanded}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                expanded ? 'rotate-180' : ''
              }`} />
            </button>
          </div>
        </div>
        
        {/* Score Bar - always visible (hide if not constructive) */}
        {!showWarning && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  passed ? 'bg-corporate-teal' : 'bg-amber-500'
                }`}
                style={{ width: `${scoreBarPct}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Pass / Not Pass Summary - always visible for scored reps */}
        {isScored && (
          <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            passed
              ? 'bg-corporate-teal/10 dark:bg-corporate-teal/20 text-corporate-teal'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}>
            {passed ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>
              {passed
                ? `Pass — Your rep met the standard (${totalScore}/${maxScore})`
                : `Did not pass — Your rep did not meet the standard (${totalScore}/${maxScore})`
              }
            </span>
          </div>
        )}
        
        {/* Expandable Detail */}
        {expanded && (
          <>
            {/* Non-constructive Warning Banner - only when expanded */}
            {showWarning && (
              <div className="mt-3 p-3 bg-corporate-orange/10 dark:bg-corporate-orange/20 border border-corporate-orange/30 dark:border-corporate-orange/40 rounded-lg">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-corporate-orange flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-corporate-orange">
                      This rep may not reflect constructive leadership
                    </p>
                    {constructiveFeedback && (
                      <p className="mt-1 text-sm text-corporate-orange/80">
                        {constructiveFeedback}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          <div className="mt-4 space-y-3">
            {/* Scored conditions (SCE, DRF, etc.) - use config order for consistency */}
            {isScored && conditions ? (
              <>
                {Object.keys(scoredConditionConfig).map((key) => {
                  const cond = conditions[key];
                  if (!cond) return null;
                  return (
                    <ScoredConditionRow key={key} conditionKey={key} condition={cond} conditionConfig={scoredConditionConfig} />
                  );
                })}
                
                {/* Auto-fail warning */}
                {autoFailTriggered && (
                  <div className="p-3 bg-corporate-orange/10 dark:bg-corporate-orange/20 border border-corporate-orange/30 dark:border-corporate-orange/40 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-corporate-orange flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-corporate-orange">Did Not Pass</p>
                        <p className="text-sm text-corporate-orange/80">{autoFailReason ? autoFailReason.replace(/auto.?fail/gi, 'did not pass').replace(/fail/gi, 'not pass') : 'One or more conditions did not meet the minimum threshold.'}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Coaching Questions */}
                {coachingQuestions?.length > 0 && (
                  <div className="p-3 bg-corporate-teal/10 dark:bg-corporate-teal/20 border border-corporate-teal/30 dark:border-corporate-teal/40 rounded-lg space-y-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium text-corporate-teal">
                      <HelpCircle className="w-4 h-4" />
                      Coaching Questions
                    </div>
                    <ul className="space-y-1.5">
                      {coachingQuestions.map((q, i) => (
                        <li key={i} className="text-sm text-corporate-navy dark:text-slate-200 pl-1">
                          &bull; {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Reflection Prompt */}
                {reflectionPrompt && (
                  <div className="p-3 bg-corporate-teal/10 dark:bg-corporate-teal/20 border border-corporate-teal/30 dark:border-corporate-teal/40 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-corporate-teal flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-corporate-teal">Reflection</p>
                        <p className="text-sm text-corporate-navy dark:text-slate-200 italic">{reflectionPrompt}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Generic pass/fail dimension rows */
              <>
                {Object.entries(dimensions || {}).map(([dimension, assessment]) => (
                  <DimensionRow
                    key={dimension}
                    dimension={dimension}
                    assessment={assessment}
                    onPractice={onPractice}
                  />
                ))}
              </>
            )}
            
            {/* Coaching Tip from AI (generic reps) */}
            {!isScored && coachingTip && (
              <div className="mt-4 p-3 bg-corporate-teal/10 dark:bg-corporate-teal/20 border border-corporate-teal/30 dark:border-corporate-teal/40 rounded-lg">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-corporate-teal flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-corporate-teal">Coaching Tip</p>
                    <p className="text-sm text-corporate-navy dark:text-slate-200">{coachingTip}</p>
                  </div>
                </div>
              </div>
            )}
            
            {summary && !showWarning && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">{summary}</p>
            )}
            
            {/* Show assessment source */}
            {assessedBy && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-right mt-2">
                Assessed by {assessedBy === 'ai' ? 'RepUp' : 'system'}
              </p>
            )}
          </div>
          </>
        )}
      </div>
      
      {/* Scoring Info Modal */}
      <ScoringInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        evaluationType={qualityAssessment.evaluationType}
      />
    </Card>
  );
};

export default QualityAssessmentCard;
