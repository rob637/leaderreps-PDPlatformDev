// src/components/conditioning/constants.js
// Shared constants for Conditioning Layer components
// Centralizes options, configs, and labels used across multiple components
// Updated March 2026 to match Conditioning Layer specifications

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
// Generic response options for most rep types
// ============================================
export const RESPONSE_OPTIONS = [
  { id: 'accepted', label: 'Accepted it without resistance' },
  { id: 'disengaged', label: 'Disengaged (silence) or deflected' },
  { id: 'some_resistance', label: 'Some defensiveness or resistance' },
  { id: 'strong_pushback', label: 'Strong emotional pushback' },
  { id: 'unsure', label: 'Not sure / hard to tell' }
];

// ============================================
// DELIVER REINFORCING FEEDBACK - RESPONSE OPTIONS
// ============================================
export const DRF_RESPONSE_OPTIONS = [
  { id: 'acknowledged', label: 'They acknowledged the feedback (e.g., "Thanks," "I appreciate that.")' },
  { id: 'agreed', label: 'They agreed with the observation' },
  { id: 'expanded', label: 'They expanded on the situation or shared more context' },
  { id: 'committed', label: 'They committed to continuing the behavior' },
  { id: 'minimal', label: 'Minimal or neutral response (acknowledged but little reaction)' },
  { id: 'other', label: 'Other' }
];

// ============================================
// SET CLEAR EXPECTATIONS - SITUATION-SPECIFIC RESPONSE OPTIONS
// Different response options based on which situation was selected
// ============================================

// #1 Assigning a Task
export const SCE_RESPONSE_ASSIGNING_TASK = [
  { id: 'confirmed_understanding', label: 'Explicitly confirmed their understanding' },
  { id: 'asked_questions_confirmed', label: 'Asked good questions and confirmed' },
  { id: 'pushback_then_confirmed', label: 'Pushed back and resisted at first, but confirmed' },
  { id: 'not_willing', label: 'Not willing/able to understand and confirm' },
  { id: 'other', label: 'Other' }
];

// #2 Delegating a Responsibility
export const SCE_RESPONSE_DELEGATING = [
  { id: 'accepted_ownership', label: 'Explicitly accepted ownership' },
  { id: 'accepted_with_questions', label: 'Accepted with clarifying questions' },
  { id: 'hesitated_accepted', label: 'Hesitated but accepted' },
  { id: 'resisted_ownership', label: 'Resisted or avoided ownership' },
  { id: 'other', label: 'Other' }
];

// #3 Setting Behavioral Standards
export const SCE_RESPONSE_BEHAVIORAL_STANDARDS = [
  { id: 'aligned_committed', label: 'Clearly aligned and committed' },
  { id: 'questions_committed', label: 'Asked clarifying questions and committed' },
  { id: 'resisted_committed', label: 'Initially resisted but ultimately committed' },
  { id: 'passive_acknowledgement', label: 'Passive acknowledgement only' },
  { id: 'did_not_align', label: 'Did not align/commit' },
  { id: 'other', label: 'Other' }
];

// #4 Resetting Expectations
export const SCE_RESPONSE_RESETTING = [
  { id: 'acknowledged_aligned', label: 'Acknowledged and aligned' },
  { id: 'questions_aligned', label: 'Asked clarifying questions and aligned' },
  { id: 'defensive_then_aligned', label: 'Defensive at first, then aligned' },
  { id: 'resisted_clarification', label: 'Resisted clarification' },
  { id: 'avoided_confirmation', label: 'Avoided clear confirmation' },
  { id: 'other', label: 'Other' }
];

// Helper to get the right response options based on situation
export const getSCEResponseOptions = (situationText) => {
  if (!situationText) return RESPONSE_OPTIONS;
  
  const lowerSituation = situationText.toLowerCase();

  if (lowerSituation.includes('assigning a task')) {
    return SCE_RESPONSE_ASSIGNING_TASK;
  } else if (lowerSituation.includes('delegating ongoing ownership')) {
    return SCE_RESPONSE_DELEGATING;
  } else if (lowerSituation.includes('behavioral standards')) {
    return SCE_RESPONSE_BEHAVIORAL_STANDARDS;
  } else if (lowerSituation.includes('resetting expectations')) {
    return SCE_RESPONSE_RESETTING;
  }
  
  return RESPONSE_OPTIONS;
};

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

// ============================================
// SET CLEAR EXPECTATIONS - SELF-ASSESSMENT QUESTIONS
// Situation-specific reflection questions for "Complete Real Rep" step
// ============================================

// #1 Assigning a Task - Self-assessment
export const SCE_SELF_ASSESS_ASSIGNING_TASK = [
  { 
    id: 'tested_misunderstanding', 
    prompt: '“Did I actively test for misunderstanding, or assume alignment?”',
    options: ['Actively tested', 'Partially tested', 'Assumed alignment']
  },
  { 
    id: 'ownership_clear', 
    prompt: '“Is task ownership unmistakably clear?”',
    options: ['Yes', 'Mostly', 'No']
  },
  { 
    id: 'accountability_clear', 
    prompt: '“If this fails, do we both know who is accountable?”',
    options: ['Yes', 'Probably', 'No']
  }
];

// #2 Delegating a Responsibility - Self-assessment
export const SCE_SELF_ASSESS_DELEGATING = [
  { 
    id: 'scope_clear', 
    prompt: '“Did I define success, scope, and boundaries clearly enough to prevent future drift?”',
    options: ['Fully clear', 'Mostly clear', 'Still implicit areas']
  },
  { 
    id: 'decision_authority', 
    prompt: '“Is decision authority unmistakably clear?”',
    options: ['Yes', 'Mostly', 'No']
  },
  { 
    id: 'accountability_clear', 
    prompt: '“If this responsibility falters, do we both know who is accountable?”',
    options: ['Yes', 'Probably', 'No']
  },
  { 
    id: 'let_go', 
    prompt: '“Am I prepared to let go and not take back responsibility too early?”',
    options: ['Yes', 'Probably', 'No']
  }
];

// #3 Setting Behavioral Standards - Self-assessment
export const SCE_SELF_ASSESS_BEHAVIORAL_STANDARDS = [
  { 
    id: 'explicit_observable', 
    prompt: 'Was the behavioral standard explicit and observable?',
    options: ['Fully explicit', 'Somewhat abstract', 'Too vague']
  },
  { 
    id: 'tested_misunderstanding', 
    prompt: '“Did I actively test for misunderstanding, or assume alignment?”',
    options: ['Actively tested', 'Partially tested', 'Assumed alignment']
  },
  { 
    id: 'reinforcement_clear', 
    prompt: '“Did I make clear how this standard will be reinforced?”',
    options: ['Yes', 'Probably', 'No']
  }
];

// #4 Resetting Expectations - Self-assessment  
export const SCE_SELF_ASSESS_RESETTING = [
  { 
    id: 'named_ambiguity', 
    prompt: 'Did I clearly name the previous ambiguity without blaming?',
    options: ['Yes, much clearer', 'Somewhat clearer', 'Still vague']
  },
  { 
    id: 'ownership_unchanged', 
    prompt: 'Did ownership remain clear and unchanged?',
    options: ['Yes', 'Mostly', 'No']
  }
];

// DELIVER REINFORCING FEEDBACK - Self-assessment
export const DRF_SELF_ASSESSMENT = [
  { 
    id: 'explicit_observable', 
    prompt: 'Did I clearly name the observable behavior?',
    options: ['Passed the Camera Test', 'Mostly clear', 'Too general', 'Conclusions or judgments']
  },
  { 
    id: 'explained_why', 
    prompt: 'Did I explain why this behavior matters?',
    options: ['Clear impact stated', 'Somewhat implied', 'Not stated']
  },
  { 
    id: 'encouraged_repeat', 
    prompt: 'Did I encourage repeating the behavior?',
    options: ['Yes - clear request', 'Somewhat implied', 'No']
  }
];

// Helper to get self-assessment questions by situation
export const getSCESelfAssessment = (situationText) => {
  if (!situationText) return [];
  
  const lowerSituation = situationText.toLowerCase();

  if (lowerSituation.includes('assigning a task')) {
    return SCE_SELF_ASSESS_ASSIGNING_TASK;
  } else if (lowerSituation.includes('delegating ongoing ownership')) {
    return SCE_SELF_ASSESS_DELEGATING;
  } else if (lowerSituation.includes('behavioral standards')) {
    return SCE_SELF_ASSESS_BEHAVIORAL_STANDARDS;
  } else if (lowerSituation.includes('resetting expectations')) {
    return SCE_SELF_ASSESS_RESETTING;
  }
  
  return [];
};

// ============================================
// SET CLEAR EXPECTATIONS - COMPLETE THE LOOP QUESTIONS
// Situation-specific reflection text inputs for closing the rep
// ============================================

// #1 Assigning a Task - Complete the Loop
export const SCE_COMPLETE_ASSIGNING_TASK = [
  { id: 'watch_for', prompt: 'What will I watch for to confirm this is on track?', type: 'text' },
  { id: 'reminder', prompt: 'Do I want a reminder to check progress?', type: 'date_optional' }
];

// #2 Delegating a Responsibility - Complete the Loop
export const SCE_COMPLETE_DELEGATING = [
  { id: 'sliding_back', prompt: '“What is the earliest sign this responsibility is sliding back to me?”', type: 'text' },
  { id: 'review_date', prompt: '“When will I review performance without reclaiming control?”', type: 'date' },
  { id: 'owner_confirmation', prompt: '“This responsibility is now owned by...?”', type: 'auto_fill_person' }
];

// #3 Setting Behavioral Standards - Complete the Loop
export const SCE_COMPLETE_BEHAVIORAL_STANDARDS = [
  { id: 'breakdown_risk', prompt: '“Where is this standard most likely to break down?”', type: 'text' },
  { id: 'first_violation', prompt: 'What will I do the first time this standard is violated?', type: 'text' },
  { id: 'reinforce_reminder', prompt: '“Do I want a reminder to reinforce this standard in the next 2 weeks?”', type: 'date_optional' }
];

// #4 Resetting Expectations - Complete the Loop
export const SCE_COMPLETE_RESETTING = [
  { id: 'drift_signal', prompt: 'What is the earliest signal this expectation is drifting again?', type: 'text' },
  { id: 'immediate_address', prompt: 'If this drifts, what will I address immediately?', type: 'text' },
  { id: 'alignment_reminder', prompt: '“Do I want a reminder to check alignment in the next 2 weeks?”', type: 'date_optional' }
];

// Helper to get Complete the Loop questions by situation
export const getSCECompleteLoopQuestions = (situationText) => {
  if (!situationText) return [];
  
  const lowerSituation = situationText.toLowerCase();

  if (lowerSituation.includes('assigning a task')) {
    return SCE_COMPLETE_ASSIGNING_TASK;
  } else if (lowerSituation.includes('delegating ongoing ownership')) {
    return SCE_COMPLETE_DELEGATING;
  } else if (lowerSituation.includes('behavioral standards')) {
    return SCE_COMPLETE_BEHAVIORAL_STANDARDS;
  } else if (lowerSituation.includes('resetting expectations')) {
    return SCE_COMPLETE_RESETTING;
  }
  
  return [];
};

// ============================================
// DELIVER REINFORCING FEEDBACK - COMPLETE THE LOOP
// ============================================
export const DRF_COMPLETE_LOOP = [
  { id: 'watch_for', prompt: '“What will I watch for to ensure behavior remains?”', type: 'text' },
  { id: 'reminder', prompt: '“Do I want a reminder to check and give additional feedback?”', type: 'date_optional' }
];

// ============================================
// DELIVER REINFORCING FEEDBACK - EVIDENCE QUESTIONS
// ============================================
export const DRF_EVIDENCE_QUESTIONS = [
  {
    id: 'describe_behavior',
    prompt: 'What did you say to describe the observable behavior?',
    placeholder: 'Describe it as close to verbatim as possible...',
    hint: 'Use specific wording',
    required: true
  },
  {
    id: 'why_matters',
    prompt: 'What did you say about why this behavior matters?',
    placeholder: 'Describe it as close to verbatim as possible...',
    hint: 'Use specific wording',
    required: true
  },
  {
    id: 'clr_elements',
    prompt: 'Did you include any of the following in your message?',
    hint: 'Check all that apply',
    type: 'checkbox_group',
    required: false,
    options: [
      { id: 'checked_openness', label: 'I checked for openness first (C)' },
      { id: 'labeled_intent', label: 'I labeled the intent (L)' },
      { id: 'requested_continue', label: 'I requested they continue the behavior (R)' }
    ]
  }
];

// ============================================
// SET CLEAR EXPECTATIONS - EVIDENCE CAPTURE QUESTIONS
// Situation-specific evidence fields for the "What Happened" screen
// ============================================

// #1 Assigning a Task - Evidence Questions
export const SCE_EVIDENCE_ASSIGNING_TASK = [
  { 
    id: 'define_success', 
    prompt: 'How did you define "success" or "done"?',
    placeholder: 'Describe it as close to verbatim as possible...',
    hint: 'Use specific wording',
    required: true 
  },
  { 
    id: 'other_expectations', 
    prompt: 'What other expectations were set?',
    placeholder: 'Did you include quality standards, time requirements, and/or reporting cadence?',
    hint: 'Use specific wording',
    required: false 
  },
  { 
    id: 'articulated_back', 
    prompt: 'Did they articulate back what "done" looks like?',
    type: 'yes_no_comment',
    required: true 
  },
  { 
    id: 'confirmed_ownership', 
    prompt: 'What did they say that confirmed ownership?',
    placeholder: 'Describe it as close to verbatim as possible...',
    hint: 'Use specific wording',
    required: true 
  }
];

// #2 Delegating a Responsibility - Evidence Questions
export const SCE_EVIDENCE_DELEGATING = [
  { 
    id: 'define_success', 
    prompt: 'How did you define what "success" looks like for this responsibility?',
    placeholder: 'Describe it as close to verbatim as possible... Include expected deliverables, quality standards, what "unacceptable" looks like, etc.',
    hint: 'Use specific wording',
    required: true 
  },
  { 
    id: 'boundaries', 
    prompt: 'What boundaries or constraints were explicitly stated?',
    placeholder: 'What\'s included? What\'s not included?',
    hint: 'Use specific wording',
    required: true 
  },
  { 
    id: 'decisions_independent', 
    prompt: 'What decisions can they make independently?',
    placeholder: 'What requires approval or input from you?',
    hint: 'Use specific wording',
    required: true 
  },
  { 
    id: 'reporting_cadence', 
    prompt: 'What reporting cadence was defined?',
    placeholder: 'When, how often, and how should they communicate status or issues?',
    hint: 'Use specific wording',
    required: true 
  },
  { 
    id: 'articulated_back', 
    prompt: 'Did they articulate back what success and scope looks like?',
    type: 'yes_no_comment',
    required: true 
  },
  { 
    id: 'confirmed_ownership', 
    prompt: 'What did they say that confirmed ownership?',
    placeholder: 'Describe it as close to verbatim as possible...',
    hint: 'Use specific wording',
    required: true 
  }
];

// #3 Setting Behavioral Standards - Evidence Questions
export const SCE_EVIDENCE_BEHAVIORAL_STANDARDS = [
  { 
    id: 'behavior_standard', 
    prompt: 'What behavior standard did you make explicit?',
    placeholder: 'Describe it as close to verbatim as possible...',
    hint: 'Use specific wording',
    required: true 
  },
  { 
    id: 'good_looks_like', 
    prompt: 'How did you describe what "good" looks like?',
    placeholder: 'Examples or observable behaviors',
    hint: 'Use specific wording',
    required: true 
  },
  { 
    id: 'consequences_clear', 
    prompt: 'Did you clarify what happens if the standard is not met?',
    type: 'options',
    options: ['Yes - clearly stated', 'Partially', 'No'],
    required: true 
  },
  { 
    id: 'test_understanding', 
    prompt: 'How did you test for understanding?',
    placeholder: 'Describe what you said or asked.',
    hint: 'Use specific wording',
    required: true 
  },
  { 
    id: 'confirmed_alignment', 
    prompt: 'What did they say that confirmed alignment and commitment to the standard?',
    placeholder: 'Describe what they said.',
    required: true 
  }
];

// #4 Resetting Expectations - Evidence Questions
export const SCE_EVIDENCE_RESETTING = [
  { 
    id: 'previous_unclear', 
    prompt: 'What expectation was drifting or unclear?',
    placeholder: 'Describe it as close to verbatim as possible...',
    hint: 'Use specific wording',
    required: true 
  },
  { 
    id: 'restated_success', 
    prompt: 'How did you restate or clarify what "success" looks like going forward?',
    placeholder: 'Examples or observable behaviors',
    hint: 'Use specific wording',
    required: true 
  },
  { 
    id: 'made_explicit', 
    prompt: 'What specific details were made explicit that were previously implicit?',
    placeholder: 'Examples: quality, timeline, format, decision authority, etc.',
    hint: 'Use specific wording',
    required: true 
  },
  { 
    id: 'ownership_same', 
    prompt: 'Did ownership remain with the same person?',
    type: 'ownership_check',
    options: ['Yes', 'No - Ownership changed'],
    warningOnNo: 'If ownership changed, this RR should be an "Assignment of task" or "Delegation of Responsibility" RR. Consider going back and selecting the proper RR.',
    required: true 
  },
  { 
    id: 'test_understanding', 
    prompt: 'How did you test for understanding of the reset expectation?',
    placeholder: 'Describe what you said or asked and what they said to confirm alignment.',
    hint: 'Use specific wording',
    required: true 
  }
];

// Helper to get evidence questions by situation for Set Clear Expectations
export const getSCEEvidenceQuestions = (situationText) => {
  if (!situationText) return [];
  
  const lowerSituation = situationText.toLowerCase();
  
  if (lowerSituation.includes('assigning a task')) {
    return SCE_EVIDENCE_ASSIGNING_TASK;
  } else if (lowerSituation.includes('delegating ongoing ownership')) {
    return SCE_EVIDENCE_DELEGATING;
  } else if (lowerSituation.includes('behavioral standards')) {
    return SCE_EVIDENCE_BEHAVIORAL_STANDARDS;
  } else if (lowerSituation.includes('resetting expectations')) {
    return SCE_EVIDENCE_RESETTING;
  }
  
  return [];
};

// Helper to determine SCE situation branch type
export const getSCESituationBranch = (situationText) => {
  if (!situationText) return null;
  
  const lowerSituation = situationText.toLowerCase();
  
  if (lowerSituation.includes('assigning a task')) {
    return 'assigning_task';
  } else if (lowerSituation.includes('delegating ongoing ownership')) {
    return 'delegating';
  } else if (lowerSituation.includes('behavioral standards')) {
    return 'behavioral_standards';
  } else if (lowerSituation.includes('resetting expectations')) {
    return 'resetting';
  }
  
  return null;
};

// ============================================
// FOLLOW-UP ON THE WORK (FUW) - RESPONSE OPTIONS
// How the other person responded during follow-up
// ============================================
export const FUW_RESPONSE_OPTIONS = [
  { id: 'explained_progress', label: 'They clearly explained the current progress' },
  { id: 'described_remaining', label: 'They described remaining work or the next milestone' },
  { id: 'surfaced_risk', label: 'They surfaced a risk or obstacle' },
  { id: 'vague_then_clarified', label: 'They initially gave a vague answer, but clarified after follow-up' },
  { id: 'struggled_explain', label: 'They struggled to explain their progress' },
  { id: 'other', label: 'Other' }
];

// ============================================
// FOLLOW-UP ON THE WORK - EVIDENCE QUESTIONS
// Evidence capture for all FUW situations (same flow regardless of situation)
// ============================================
export const FUW_EVIDENCE_QUESTIONS = [
  { 
    id: 'status_question', 
    prompt: 'What question did you ask to check the status of the work?',
    placeholder: 'Use the exact wording you used. Example: "Where are you with the client proposal?"',
    hint: 'Capture the actual question you asked',
    required: true 
  },
  { 
    id: 'vague_response', 
    prompt: 'Did the direct initially respond with a vague update?',
    type: 'options',
    options: ['No — they explained progress clearly', 'Yes — I asked a follow-up question to clarify'],
    required: true 
  },
  { 
    id: 'validation_question', 
    prompt: 'What follow-up question did you ask to validate progress? (Recommended)',
    placeholder: 'Use the exact wording you used. Examples: "What\'s left to finish?" or "Where are you in the process right now?"',
    hint: 'This helps surface real execution progress',
    required: false 
  },
  { 
    id: 'obstacle_question', 
    prompt: 'What question did you ask about obstacles or risks?',
    placeholder: 'Use the exact wording you used. Examples: "Anything getting in the way?" or "What might slow this down?"',
    hint: 'Capture the actual question you asked',
    required: false 
  }
];

// ============================================
// FOLLOW-UP ON THE WORK - SELF-ASSESSMENT QUESTIONS
// Self-reflection questions for "Complete Real Rep" step
// ============================================
export const FUW_SELF_ASSESSMENT = [
  { 
    id: 'work_anchored', 
    prompt: 'Did I connect the follow-up question to the specific work?',
    options: ['Clear reference to the work', 'Somewhat clear', 'Too vague']
  },
  { 
    id: 'progress_revealed', 
    prompt: 'Did the conversation reveal the actual progress of the work?',
    options: ['Clear progress surfaced', 'Some progress surfaced', 'Still unclear']
  },
  { 
    id: 'ownership_preserved', 
    prompt: 'Did ownership of the work remain with the direct?',
    options: ['Yes – clearly owned by them', 'Mostly – but I guided execution', 'No – I stepped in or took over']
  }
];

// ============================================
// FOLLOW-UP ON THE WORK - REFLECTION PROMPT
// ============================================
export const FUW_REFLECTION_PROMPT = 'Next time you follow up I will ask ______ to make progress more visible.';
export const FUW_REFLECTION_EXAMPLES = [
  '"What\'s left to finish?"',
  '"Where are you in the process?"',
  '"What\'s your next milestone?"'
];

// Helper to get FUW situation branch type
export const getFUWSituationBranch = (situationText) => {
  if (!situationText) return null;
  
  const lowerSituation = situationText.toLowerCase();
  
  if (lowerSituation.includes('task or project')) {
    return 'task_project';
  } else if (lowerSituation.includes('ongoing responsibility')) {
    return 'ongoing_responsibility';
  } else if (lowerSituation.includes('recently delegat')) {
    return 'recently_delegated';
  }
  
  return 'task_project'; // Default
};

// ============================================
// LEAD WITH VULNERABILITY (LWV) - RESPONSE OPTIONS
// How the other person responded to vulnerability
// ============================================
export const LWV_RESPONSE_OPTIONS = [
  { id: 'acknowledged', label: 'They acknowledged the statement' },
  { id: 'engaged', label: 'They engaged in the conversation openly' },
  { id: 'questions', label: 'They asked questions or explored the issue further' },
  { id: 'appreciation', label: 'They showed relief or appreciation for the honesty' },
  { id: 'minimal', label: 'Minimal reaction / neutral acknowledgment' },
  { id: 'other', label: 'Other' }
];

// ============================================
// LEAD WITH VULNERABILITY - EVIDENCE QUESTIONS
// Evidence capture for all LWV situations (same flow regardless of situation)
// ============================================
export const LWV_EVIDENCE_QUESTIONS = [
  { 
    id: 'vulnerability_statement', 
    prompt: 'What did you say to acknowledge your miss, uncertainty, or changed thinking?',
    placeholder: 'Write as close to verbatim as possible. Example: "I rushed that conversation earlier. That\'s on me."',
    hint: 'Capture the actual vulnerability statement you used',
    required: true 
  },
  { 
    id: 'forward_statement', 
    prompt: 'What did you say to show learning or forward direction? (Optional)',
    placeholder: 'Example: "Let\'s reset expectations so we\'re aligned." or "Next time I\'m going to slow that decision down."',
    hint: 'This reinforces leadership strength',
    required: false 
  }
];

// ============================================
// LEAD WITH VULNERABILITY - SELF-ASSESSMENT QUESTIONS
// Self-reflection questions for "Complete Real Rep" step
// ============================================
export const LWV_SELF_ASSESSMENT = [
  { 
    id: 'ownership_clear', 
    prompt: 'Did I clearly acknowledge my role in the situation?',
    options: ['Clear ownership', 'Some ownership', 'Weak or hedged ownership']
  },
  { 
    id: 'statement_clear', 
    prompt: 'Did my statement clearly describe what happened?',
    options: ['Clear and specific', 'Mostly clear', 'Too vague']
  },
  { 
    id: 'forward_strength', 
    prompt: 'Did I show learning or forward movement?',
    options: ['Yes – I reinforced direction or learning', 'Somewhat – learning implied', 'No – I only acknowledged the issue']
  }
];

// ============================================
// LEAD WITH VULNERABILITY - REFLECTION PROMPT
// ============================================
export const LWV_REFLECTION_PROMPT = 'Next time I lead with vulnerability I will say ______ to strengthen ownership or learning.';
export const LWV_REFLECTION_EXAMPLES = [
  '"I rushed that decision."',
  '"I should have handled that differently."',
  '"Here\'s how I\'m going to approach it next time."'
];

// Helper to get LWV situation branch type
export const getLWVSituationBranch = (situationText) => {
  if (!situationText) return null;
  
  const lowerSituation = situationText.toLowerCase();
  
  if (lowerSituation.includes('owned a mistake') || lowerSituation.includes('misjudgment')) {
    return 'owned_mistake';
  } else if (lowerSituation.includes('uncertainty') || lowerSituation.includes('didn\'t have the answer')) {
    return 'acknowledged_uncertainty';
  } else if (lowerSituation.includes('thinking changed') || lowerSituation.includes('new information')) {
    return 'thinking_changed';
  }
  
  return 'owned_mistake'; // Default
};
