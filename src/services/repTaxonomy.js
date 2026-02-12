// src/services/repTaxonomy.js
// Rep Taxonomy - 16 Canonical Leadership Rep Types
// Based on Ryan's Conditioning Layer specifications (020726)

/**
 * Rep Categories - High-level groupings for drill-down picker
 */
export const REP_CATEGORIES = {
  REINFORCING_REDIRECTING: {
    id: 'reinforcing_redirecting',
    label: 'Reinforcing & Redirecting',
    shortLabel: 'Feedback',
    description: 'Giving praise or corrective feedback',
    icon: 'MessageSquare',
    color: 'blue'
  },
  AMBIGUOUS_EMOTIONAL: {
    id: 'ambiguous_emotional',
    label: 'Ambiguous & Emotional',
    shortLabel: 'Hard Conversations',
    description: 'Conversations without clear behavioral charge',
    icon: 'Heart',
    color: 'teal'
  },
  STANDARDS_AUTHORITY: {
    id: 'standards_authority',
    label: 'Standards & Authority',
    shortLabel: 'Boundaries',
    description: 'Setting and enforcing boundaries',
    icon: 'Shield',
    color: 'amber'
  },
  ESCALATION_DECISIONS: {
    id: 'escalation_decisions',
    label: 'Escalation & Decisions',
    shortLabel: 'High Stakes',
    description: 'Escalation and irreversible decisions',
    icon: 'AlertTriangle',
    color: 'orange'
  }
};

/**
 * Difficulty levels for progression tracking
 */
export const DIFFICULTY_LEVELS = {
  LEVEL_1: { id: 'level_1', label: 'Level 1', description: 'Entry-level challenge' },
  LEVEL_2: { id: 'level_2', label: 'Level 2', description: 'Moderate stretch' },
  LEVEL_3: { id: 'level_3', label: 'Level 3', description: 'Significant stretch' }
};

/**
 * Risk levels - determines if prep is required
 */
export const RISK_LEVELS = {
  LOW: { id: 'low', label: 'Low Risk', prepRequired: false },
  MEDIUM: { id: 'medium', label: 'Medium Risk', prepRequired: false },
  HIGH: { id: 'high', label: 'High Risk', prepRequired: true }
};

/**
 * The 16 Canonical Rep Types
 * Each type includes: id, category, labels, difficulty, risk, and micro-rubric
 */
export const REP_TYPES = [
  // =========================================
  // A. REINFORCING & REDIRECTING (6 types)
  // =========================================
  {
    id: 'reinforce_public',
    category: 'reinforcing_redirecting',
    label: 'Reinforcing Behavior in Public',
    shortLabel: 'Public Praise',
    description: 'Recognize someone\'s good work in front of others',
    hardPart: 'Specificity without performative praise',
    defaultDifficulty: 'level_1',
    defaultRisk: 'low',
    prepRequired: false,
    progression: {
      level_1: 'Reinforce a direct report for something obvious',
      level_2: 'Reinforce publicly in a meeting',
      level_3: 'Reinforce in front of stakeholders or senior leaders'
    },
    rubric: [
      { id: 'specific_behavior', prompt: 'What specific behavior are you recognizing?' },
      { id: 'impact', prompt: 'What impact did their behavior have?' },
      { id: 'audience', prompt: 'Who will witness this recognition?' }
    ],
    stretchPrompts: [
      'Try reinforcing someone you don\'t know as well',
      'Reinforce in front of a larger group',
      'Reinforce a behavior that required courage from them'
    ]
  },
  {
    id: 'redirect_moment',
    category: 'reinforcing_redirecting',
    label: 'Redirecting in the Moment',
    shortLabel: 'In-the-Moment Redirect',
    description: 'Address something as it\'s happening - no prep time',
    hardPart: 'Courage under speed, emotional regulation',
    defaultDifficulty: 'level_3',
    defaultRisk: 'high',
    prepRequired: false, // Can't prep - it's in the moment
    progression: {
      level_1: 'Redirect small issue with direct report',
      level_2: 'Redirect in a meeting or group setting',
      level_3: 'Redirect senior person or under high pressure'
    },
    rubric: [
      { id: 'trigger', prompt: 'What happened that triggered your redirect?' },
      { id: 'words_used', prompt: 'What did you actually say?' },
      { id: 'tone', prompt: 'How did you manage your tone?' }
    ],
    stretchPrompts: [
      'Try redirecting in a higher-stakes setting',
      'Redirect someone with more seniority',
      'Redirect when you\'re emotionally activated'
    ]
  },
  {
    id: 'redirect_prepared',
    category: 'reinforcing_redirecting',
    label: 'Redirecting After the Fact (Prepared)',
    shortLabel: 'Prepared Redirect',
    description: 'Address a single instance with time to prepare',
    hardPart: 'Clarity without over-justifying',
    defaultDifficulty: 'level_2',
    defaultRisk: 'medium',
    prepRequired: false,
    progression: {
      level_1: 'Redirect a clear, recent issue with direct report',
      level_2: 'Redirect something that happened days ago',
      level_3: 'Redirect someone you have less authority over'
    },
    rubric: [
      { id: 'specific_instance', prompt: 'What specific instance are you addressing?' },
      { id: 'impact', prompt: 'What was the impact of their behavior?' },
      { id: 'request', prompt: 'What specific change are you asking for?' },
      { id: 'commitment', prompt: 'What commitment will you request?' }
    ],
    stretchPrompts: [
      'Try redirecting a pattern, not just an instance',
      'Address something with higher emotional stakes',
      'Redirect someone with more seniority'
    ]
  },
  {
    id: 'redirect_pattern',
    category: 'reinforcing_redirecting',
    label: 'Redirecting a Pattern',
    shortLabel: 'Pattern Redirect',
    description: 'Address a recurring behavior pattern, not just one instance',
    hardPart: 'Raising stakes without accusation',
    defaultDifficulty: 'level_3',
    defaultRisk: 'high',
    prepRequired: true,
    progression: {
      level_1: 'Address 2-instance pattern with direct report',
      level_2: 'Address chronic pattern with consequences stated',
      level_3: 'Address pattern with peer or skip-level'
    },
    rubric: [
      { id: 'pattern_specific', prompt: 'What specific pattern have you observed? List 2-3 instances.' },
      { id: 'impact', prompt: 'What is the cumulative impact on the team/work?' },
      { id: 'consequence', prompt: 'What happens if the pattern continues?' },
      { id: 'commitment', prompt: 'What specific change are you asking for?' }
    ],
    stretchPrompts: [
      'Add explicit consequences to the conversation',
      'Address a pattern you\'ve been avoiding for weeks',
      'Have this conversation with someone difficult'
    ]
  },
  {
    id: 'adjust_mid_feedback',
    category: 'reinforcing_redirecting',
    label: 'Adjusting Mid-Feedback Due to Pushback',
    shortLabel: 'Recover from Pushback',
    description: 'Regulate and repair when feedback goes sideways',
    hardPart: 'Not bulldozing or retreating',
    defaultDifficulty: 'level_3',
    defaultRisk: 'medium',
    prepRequired: false, // Happens in real-time
    progression: {
      level_1: 'Pause and ask a question when they push back',
      level_2: 'Name the dynamic and reset the conversation',
      level_3: 'Maintain your point while validating their emotion'
    },
    rubric: [
      { id: 'pushback_type', prompt: 'What kind of pushback did you encounter?' },
      { id: 'your_response', prompt: 'How did you respond in the moment?' },
      { id: 'recovery', prompt: 'How did you recover or redirect the conversation?' },
      { id: 'outcome', prompt: 'Where did the conversation land?' }
    ],
    stretchPrompts: [
      'Try naming the pushback directly in the moment',
      'Practice staying in the conversation longer before retreating',
      'Validate their emotion without abandoning your point'
    ]
  },
  {
    id: 'close_loop',
    category: 'reinforcing_redirecting',
    label: 'Closing the Loop After Redirecting',
    shortLabel: 'Follow-Up',
    description: 'Follow up on previous feedback to check for change',
    hardPart: 'Holding accountability without re-lecturing',
    defaultDifficulty: 'level_2',
    defaultRisk: 'low',
    prepRequired: false,
    progression: {
      level_1: 'Simple check-in on agreed change',
      level_2: 'Address lack of follow-through on commitment',
      level_3: 'Escalate when change hasn\'t happened'
    },
    rubric: [
      { id: 'original_feedback', prompt: 'What was the original feedback?' },
      { id: 'expected_change', prompt: 'What change was expected?' },
      { id: 'observation', prompt: 'What have you observed since?' },
      { id: 'next_step', prompt: 'What\'s the next step based on what you observed?' }
    ],
    stretchPrompts: [
      'Address lack of follow-through directly',
      'Set a tighter timeline for the next check-in',
      'Name consequences if change doesn\'t happen'
    ]
  },

  // =========================================
  // B. AMBIGUOUS & EMOTIONAL (3 types)
  // =========================================
  {
    id: 'whats_going_on',
    category: 'ambiguous_emotional',
    label: 'The "What\'s Going On?" Conversation',
    shortLabel: 'Check-In',
    description: 'Address a concern when you\'re not sure what\'s wrong',
    hardPart: 'Naming concern without accusation',
    defaultDifficulty: 'level_2',
    defaultRisk: 'medium',
    prepRequired: false,
    progression: {
      level_1: 'Check in on someone who seems off',
      level_2: 'Address declining performance with curiosity',
      level_3: 'Have this conversation when you suspect serious issues'
    },
    rubric: [
      { id: 'observation', prompt: 'What have you noticed that prompted this conversation?' },
      { id: 'genuine_curiosity', prompt: 'What are you genuinely curious about?' },
      { id: 'support_offer', prompt: 'What support can you offer?' },
      { id: 'next_check', prompt: 'When will you follow up?' }
    ],
    stretchPrompts: [
      'Go deeper - ask about root causes',
      'Be more direct about what you\'ve observed',
      'Have this conversation sooner (don\'t wait)'
    ]
  },
  {
    id: 'receive_feedback',
    category: 'ambiguous_emotional',
    label: 'Receiving Redirecting Feedback Well',
    shortLabel: 'Receive Feedback',
    description: 'Receive difficult feedback without defensiveness',
    hardPart: 'Resisting defensiveness, internal regulation',
    defaultDifficulty: 'level_3',
    defaultRisk: 'low',
    prepRequired: false,
    progression: {
      level_1: 'Receive feedback and thank them',
      level_2: 'Ask clarifying questions without defending',
      level_3: 'Act on feedback and report back'
    },
    rubric: [
      { id: 'feedback_received', prompt: 'What feedback did you receive?' },
      { id: 'your_response', prompt: 'How did you respond in the moment?' },
      { id: 'internal_state', prompt: 'What was going on for you internally?' },
      { id: 'action', prompt: 'What will you do with this feedback?' }
    ],
    stretchPrompts: [
      'Ask for more specific examples or details',
      'Share your internal reaction honestly',
      'Proactively seek feedback you\'ve been avoiding'
    ]
  },
  {
    id: 'lead_vulnerability',
    category: 'ambiguous_emotional',
    label: 'Leading with Vulnerability',
    shortLabel: 'Be Vulnerable',
    description: 'Own a mistake, apologize, or ask for help',
    hardPart: 'Status threat, ego management',
    defaultDifficulty: 'level_3',
    defaultRisk: 'medium',
    prepRequired: false,
    progression: {
      level_1: 'Admit you don\'t know something',
      level_2: 'Apologize for a mistake publicly',
      level_3: 'Ask for help on something visible'
    },
    rubric: [
      { id: 'what_shared', prompt: 'What did you share or admit?' },
      { id: 'audience', prompt: 'Who did you share this with?' },
      { id: 'their_response', prompt: 'How did they respond?' },
      { id: 'your_feeling', prompt: 'How did it feel?' }
    ],
    stretchPrompts: [
      'Admit something to a larger audience',
      'Be vulnerable about something you usually hide',
      'Ask for help on something you could probably figure out alone'
    ]
  },

  // =========================================
  // C. STANDARDS & AUTHORITY (4 types)
  // =========================================
  {
    id: 'delegate_clean',
    category: 'standards_authority',
    label: 'Delegating with a Clean Handoff',
    shortLabel: 'Delegate',
    description: 'Hand off work with clear expectations and restraint',
    hardPart: 'Not rescuing, tolerating their struggle',
    defaultDifficulty: 'level_2',
    defaultRisk: 'medium',
    prepRequired: false,
    progression: {
      level_1: 'Delegate a well-defined task',
      level_2: 'Delegate with ambiguity - let them figure it out',
      level_3: 'Delegate something you could do better yourself'
    },
    rubric: [
      { id: 'done_definition', prompt: 'What does "done" look like?' },
      { id: 'constraints', prompt: 'What constraints apply?' },
      { id: 'check_back', prompt: 'How will you check back?' },
      { id: 'not_taking_back', prompt: 'What are you NOT taking back?' }
    ],
    stretchPrompts: [
      'Delegate something with more ambiguity',
      'Wait longer before checking in',
      'Let them struggle more before helping'
    ]
  },
  {
    id: 'hold_line',
    category: 'standards_authority',
    label: 'Holding the Line After Pushback',
    shortLabel: 'Hold the Line',
    description: 'Maintain a boundary when someone resists',
    hardPart: 'Emotional steadiness, not caving',
    defaultDifficulty: 'level_3',
    defaultRisk: 'high',
    prepRequired: true,
    progression: {
      level_1: 'Hold a boundary with explanations',
      level_2: 'Hold without over-explaining',
      level_3: 'Hold when they escalate emotionally'
    },
    rubric: [
      { id: 'boundary', prompt: 'What boundary are you holding?' },
      { id: 'pushback', prompt: 'What pushback did you get?' },
      { id: 'your_response', prompt: 'How did you respond to the pushback?' },
      { id: 'outcome', prompt: 'Did the boundary hold?' }
    ],
    stretchPrompts: [
      'Say less when you hold the line',
      'Hold when you feel more pressure to cave',
      'Hold with someone who has more power'
    ]
  },
  {
    id: 'let_consequence',
    category: 'standards_authority',
    label: 'Letting Someone Experience Consequences',
    shortLabel: 'Allow Consequences',
    description: 'Step back and let natural consequences happen',
    hardPart: 'Tolerating discomfort, not rescuing',
    defaultDifficulty: 'level_3',
    defaultRisk: 'low',
    prepRequired: false,
    progression: {
      level_1: 'Let a small consequence play out',
      level_2: 'Let a visible consequence happen',
      level_3: 'Let a significant consequence occur without fixing'
    },
    rubric: [
      { id: 'situation', prompt: 'What situation were you tempted to fix?' },
      { id: 'consequence', prompt: 'What consequence did they experience?' },
      { id: 'your_response', prompt: 'What did you do (or not do)?' },
      { id: 'result', prompt: 'What was the result?' }
    ],
    stretchPrompts: [
      'Let a bigger consequence play out',
      'Resist the urge to explain after',
      'Let them feel the full weight of the consequence'
    ]
  },
  {
    id: 'say_no',
    category: 'standards_authority',
    label: 'Saying No / Re-Prioritizing Work',
    shortLabel: 'Say No',
    description: 'Decline a request or change priorities',
    hardPart: 'Tolerating disappointment, being disliked',
    defaultDifficulty: 'level_2',
    defaultRisk: 'medium',
    prepRequired: false,
    progression: {
      level_1: 'Say no with a full explanation',
      level_2: 'Say no without over-explaining',
      level_3: 'Say no to someone senior or important'
    },
    rubric: [
      { id: 'request', prompt: 'What were you asked to do?' },
      { id: 'your_response', prompt: 'What did you say?' },
      { id: 'their_reaction', prompt: 'How did they react?' },
      { id: 'stuck', prompt: 'Did your no stick?' }
    ],
    stretchPrompts: [
      'Say no faster (don\'t deliberate for days)',
      'Say no with fewer words',
      'Say no to someone you usually say yes to'
    ]
  },

  // =========================================
  // D. ESCALATION & DECISIONS (3 types)
  // =========================================
  {
    id: 'name_pattern_change',
    category: 'escalation_decisions',
    label: 'Naming a Pattern That Requires Change',
    shortLabel: 'Escalate Pattern',
    description: 'Signal that something must change (before formal consequences)',
    hardPart: 'Decisiveness, raising stakes clearly',
    defaultDifficulty: 'level_3',
    defaultRisk: 'high',
    prepRequired: true,
    progression: {
      level_1: 'Name the pattern and state concern',
      level_2: 'Name pattern with explicit timeline for change',
      level_3: 'Name pattern with clear consequences if unchanged'
    },
    rubric: [
      { id: 'pattern', prompt: 'What pattern have you observed?' },
      { id: 'signal', prompt: 'How did you signal this must change?' },
      { id: 'timeline', prompt: 'What timeline did you set?' },
      { id: 'consequence', prompt: 'What consequences did you name?' }
    ],
    stretchPrompts: [
      'Be more explicit about consequences',
      'Set a tighter timeline',
      'Have this conversation earlier in the pattern'
    ]
  },
  {
    id: 'coaching_to_consequence',
    category: 'escalation_decisions',
    label: 'Transitioning from Coaching to Consequence',
    shortLabel: 'Move to Consequences',
    description: 'PIPs, role changes, exit paths - irreversible stakes',
    hardPart: 'Decisiveness + humanity, not dragging it out',
    defaultDifficulty: 'level_3',
    defaultRisk: 'high',
    prepRequired: true,
    progression: {
      level_1: 'Initiate formal performance conversation',
      level_2: 'Deliver PIP or formal warning',
      level_3: 'Execute role change or separation'
    },
    rubric: [
      { id: 'background', prompt: 'What coaching has already happened?' },
      { id: 'decision', prompt: 'What decision have you made?' },
      { id: 'delivery', prompt: 'How did you deliver the news?' },
      { id: 'humanity', prompt: 'How did you show humanity in the conversation?' }
    ],
    stretchPrompts: [
      'Make the decision faster',
      'Be clearer about what happens next',
      'Hold the decision without softening it'
    ]
  },
  {
    id: 'mediate_conflict',
    category: 'escalation_decisions',
    label: 'Mediating Conflict Between Two People',
    shortLabel: 'Mediate',
    description: 'Facilitate resolution between two conflicting parties',
    hardPart: 'Neutrality + structure, not taking sides',
    defaultDifficulty: 'level_3',
    defaultRisk: 'medium',
    prepRequired: true,
    progression: {
      level_1: 'Mediate a minor disagreement',
      level_2: 'Mediate ongoing tension between two people',
      level_3: 'Mediate highly charged conflict'
    },
    rubric: [
      { id: 'parties', prompt: 'Who are the parties in conflict?' },
      { id: 'structure', prompt: 'What structure did you use?' },
      { id: 'neutrality', prompt: 'How did you maintain neutrality?' },
      { id: 'outcome', prompt: 'What was the outcome?' }
    ],
    stretchPrompts: [
      'Stay neutral longer before offering solutions',
      'Let them do more of the work',
      'Mediate a conflict with higher stakes'
    ]
  }
];

/**
 * Universal Rep Structure - fields captured for ALL rep types
 * These are the "what makes it a real rep" fields
 */
export const UNIVERSAL_REP_FIELDS = {
  trigger: {
    id: 'trigger',
    label: 'Trigger / Context',
    prompt: 'What situation is prompting this rep?',
    placeholder: 'e.g., "In our 1:1 on Thursday when we discuss..."',
    required: true
  },
  intended_outcome: {
    id: 'intended_outcome',
    label: 'Intended Outcome',
    prompt: 'What does success look like?',
    placeholder: 'e.g., "They understand the impact and commit to changing..."',
    required: true
  },
  standard: {
    id: 'standard',
    label: 'Standard Being Enforced',
    prompt: 'What expectation, boundary, goal, or role clarity?',
    placeholder: 'e.g., "Meeting deadlines", "Respectful communication"',
    required: true
  },
  hard_move: {
    id: 'hard_move',
    label: 'The Hard Move',
    prompt: 'What specific thing will YOU do or say?',
    placeholder: 'e.g., "I will say: I\'ve noticed X and I need Y..."',
    required: true
  },
  close_next: {
    id: 'close_next',
    label: 'Close / Next Step',
    prompt: 'What happens after this conversation?',
    placeholder: 'e.g., "Schedule follow-up in 1 week to check progress"',
    required: true
  }
};

/**
 * High-risk prep questions - required when risk is high
 */
export const HIGH_RISK_PREP_QUESTIONS = [
  { id: 'worst_case', prompt: 'What\'s the worst-case response?' },
  { id: 'recovery', prompt: 'How will you recover if it goes sideways?' },
  { id: 'support', prompt: 'What support do you need before this conversation?' },
  { id: 'timing', prompt: 'Is this the right moment? Why now?' }
];

// =========================================
// HELPER FUNCTIONS
// =========================================

/**
 * Difficulty sort order (easiest to hardest)
 */
const DIFFICULTY_SORT_ORDER = {
  'level_1': 1,
  'level_2': 2,
  'level_3': 3
};

/**
 * Sort rep types by difficulty (easiest to hardest)
 */
export const sortByDifficulty = (repTypes) => {
  return [...repTypes].sort((a, b) => {
    const aOrder = DIFFICULTY_SORT_ORDER[a.defaultDifficulty] || 2;
    const bOrder = DIFFICULTY_SORT_ORDER[b.defaultDifficulty] || 2;
    return aOrder - bOrder;
  });
};

/**
 * Get rep type by ID
 */
export const getRepType = (repTypeId) => {
  return REP_TYPES.find(t => t.id === repTypeId) || null;
};

/**
 * Get rep types by category (sorted by difficulty: easiest to hardest)
 */
export const getRepTypesByCategory = (categoryId) => {
  const types = REP_TYPES.filter(t => t.category === categoryId);
  return sortByDifficulty(types);
};

/**
 * Get category by ID
 */
export const getCategory = (categoryId) => {
  return Object.values(REP_CATEGORIES).find(c => c.id === categoryId) || null;
};

/**
 * Get all categories as array
 */
export const getCategoriesArray = () => {
  return Object.values(REP_CATEGORIES);
};

/**
 * Check if prep is required for a rep type + risk combination
 */
export const isPrepRequired = (repTypeId, riskLevel = null) => {
  const repType = getRepType(repTypeId);
  if (!repType) return false;
  
  // If rep type always requires prep, return true
  if (repType.prepRequired) return true;
  
  // If risk level is high, prep is required
  if (riskLevel === 'high') return true;
  
  return false;
};

/**
 * Get the rubric questions for a rep type
 */
export const getRubric = (repTypeId) => {
  const repType = getRepType(repTypeId);
  return repType?.rubric || [];
};

/**
 * Get stretch prompts for a rep type
 */
export const getStretchPrompts = (repTypeId) => {
  const repType = getRepType(repTypeId);
  return repType?.stretchPrompts || [];
};

/**
 * Get progression description for difficulty level
 */
export const getProgression = (repTypeId, difficultyLevel) => {
  const repType = getRepType(repTypeId);
  return repType?.progression?.[difficultyLevel] || null;
};

export default {
  REP_CATEGORIES,
  REP_TYPES,
  DIFFICULTY_LEVELS,
  RISK_LEVELS,
  UNIVERSAL_REP_FIELDS,
  HIGH_RISK_PREP_QUESTIONS,
  getRepType,
  getRepTypesByCategory,
  getCategory,
  getCategoriesArray,
  isPrepRequired,
  getRubric,
  getStretchPrompts,
  getProgression,
  sortByDifficulty
};
