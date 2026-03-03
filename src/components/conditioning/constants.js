// src/components/conditioning/constants.js
// Shared constants for Conditioning Layer components
// Centralizes options, configs, and labels used across multiple components

// ============================================
// REP OUTCOME OPTIONS (Close RR flow)
// ============================================
export const REP_OUTCOME_OPTIONS = [
  { id: 'did_it', label: 'Completed rep', icon: '✅', description: 'Executed the rep as planned' },
  { id: 'partial', label: 'Partially completed', icon: '⚠️', description: 'Some of it happened' },
  { id: 'missed', label: 'Missed it', icon: '❌', description: "Didn't get to it" },
  { id: 'pivoted', label: 'Pivoted', icon: '🔄', description: 'Did something different' }
];

// ============================================
// RESPONSE OPTIONS (How the other person responded)
// ============================================
export const RESPONSE_OPTIONS = [
  { id: 'accepted', label: 'Accepted it without resistance' },
  { id: 'disengaged', label: 'Disengaged (silence) or deflected' },
  { id: 'some_resistance', label: 'Some defensiveness or resistance' },
  { id: 'strong_pushback', label: 'Strong emotional pushback' },
  { id: 'unsure', label: 'Not sure / hard to tell' }
];

// ============================================
// BEHAVIOR CHANGE OPTIONS (Loop closure)
// ============================================
export const BEHAVIOR_CHANGE_OPTIONS = [
  { id: 'changed', label: 'The behavior changed as expected' },
  { id: 'some_change', label: 'Some change, but not consistent yet' },
  { id: 'no_change', label: 'No meaningful change' },
  { id: 'hard_to_tell', label: 'Hard to tell' }
];

// ============================================
// PUSHBACK HANDLING OPTIONS
// ============================================
export const PUSHBACK_RESPONSE_OPTIONS = [
  { id: 'acknowledged_emotion', label: 'Acknowledged emotion without agreeing' },
  { id: 'restated_expectation', label: 'Restated the expectation or boundary' },
  { id: 'clarifying_question', label: 'Asked a clarifying question' },
  { id: 'vcr', label: 'Used VCR - validated, challenged, and redirected' },
  { id: 'take_break', label: 'Suggested we take a break and revisit later' },
  { id: 'rebuilt_safety', label: 'Zoomed out and rebuilt safety' },
  { id: 'other', label: 'Other' }
];

// ============================================
// FEEDBACK REP TYPES (for conditional logic)
// ============================================
export const FEEDBACK_REP_TYPES = [
  'deliver_reinforcing_feedback',
  'deliver_redirecting_feedback'
];

// ============================================
// PUSHBACK LOG OPTIONS (How to log pushback)
// ============================================
export const PUSHBACK_LOG_OPTIONS = [
  { 
    id: 'link', 
    label: 'Link Handle Pushback to this rep',
    description: 'Same interaction — feedback and pushback happened together'
  },
  { 
    id: 'separate', 
    label: 'Log Handle Pushback as a separate Real Rep',
    description: 'Pushback happened later or deserves its own focus'
  },
  { 
    id: 'skip', 
    label: "I wouldn't - this doesn't qualify as a Handle Pushback Real Rep"
  }
];

// ============================================
// CLOSE LOOP LOG OPTIONS
// ============================================
export const CLOSE_LOOP_LOG_OPTIONS = [
  { 
    id: 'link', 
    label: 'Link Close the Loop to this rep',
    description: 'Verification and response happened in this interaction'
  },
  { 
    id: 'separate', 
    label: 'Log Close the Loop as a separate Real Rep',
    description: 'This deserves its own focus or occurred separately'
  },
  { 
    id: 'skip', 
    label: "I wouldn't - I don't want to log Close the Loop here"
  }
];

// ============================================
// CLOSE LOOP OPTIONS (Did you close the loop?)
// ============================================
export const CLOSE_LOOP_OPTIONS = [
  { id: 'yes', label: 'Yes, I was verifying change and closing the loop' },
  { id: 'no', label: 'No, this was not about closing the loop' },
  { id: 'unsure', label: 'Not sure / hard to tell' }
];
