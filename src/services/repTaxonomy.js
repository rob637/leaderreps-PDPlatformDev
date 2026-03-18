// src/services/repTaxonomy.js
// Rep Taxonomy - 16 Canonical Leadership Rep Types
// Based on Ryan's Conditioning Layer specifications (020726)

// ============================================
// DYNAMIC FIRESTORE CACHE
// Populated by RepTypeProvider on startup
// Helper functions check this cache first before falling back to hardcoded data
// ============================================
let _dynamicCache = {
  isHydrated: false,
  repTypes: null,
  repTypesById: null,
  situations: null,    // { repTypeId: [ situations ] }
  prompts: null,       // { repTypeId: { behaviorFocus, activeReminder } }
  categories: null,
  milestones: null
};

/**
 * Hydrate the dynamic cache with Firestore data
 * Called by RepTypeProvider after loading data from Firestore
 */
export const hydrateTaxonomyCache = ({
  repTypes = null,
  categories = null,
  milestones = null,
  situations = null,
  prompts = null
}) => {
  if (repTypes) {
    _dynamicCache.repTypes = repTypes;
    _dynamicCache.repTypesById = {};
    repTypes.forEach(rt => {
      _dynamicCache.repTypesById[rt.id] = rt;
    });
  }
  if (categories) _dynamicCache.categories = categories;
  if (milestones) _dynamicCache.milestones = milestones;
  if (situations) _dynamicCache.situations = situations;
  if (prompts) _dynamicCache.prompts = prompts;
  
  _dynamicCache.isHydrated = true;
  console.log('[repTaxonomy] Cache hydrated from Firestore', {
    repTypes: repTypes?.length || 0,
    situations: situations ? Object.keys(situations).length : 0,
    prompts: prompts ? Object.keys(prompts).length : 0
  });
};

/**
 * Clear the cache (for testing)
 */
export const clearTaxonomyCache = () => {
  _dynamicCache = {
    isHydrated: false,
    repTypes: null,
    repTypesById: null,
    situations: null,
    prompts: null,
    categories: null,
    milestones: null
  };
};

/**
 * Check if cache is hydrated
 */
export const isTaxonomyCacheHydrated = () => _dynamicCache.isHydrated;

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
 * Legacy rep type mapping - maps old rep type IDs to new canonical types
 * Used to support rolling forward reps created before the 16-type taxonomy
 */
export const LEGACY_REP_TYPE_MAPPING = {
  '1:1': 'redirect_prepared',        // 1:1 conversations → prepared redirect
  'feedback': 'redirect_prepared',   // Generic feedback → prepared redirect
  'coaching': 'whats_going_on',      // Coaching conversations → what's going on
  'praise': 'reinforce_public',      // Praise → public reinforcement
  'redirect': 'redirect_moment',     // Generic redirect → in-the-moment redirect
  'difficult': 'hold_line',          // Difficult conversations → hold the line
  'delegation': 'delegate_clean',    // Delegation → clean delegation
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
 * Supports legacy rep type IDs via LEGACY_REP_TYPE_MAPPING
 */
export const getRepType = (repTypeId) => {
  // First try direct match
  let repType = REP_TYPES.find(t => t.id === repTypeId);
  
  // If not found, check legacy mapping
  if (!repType && LEGACY_REP_TYPE_MAPPING[repTypeId]) {
    const mappedId = LEGACY_REP_TYPE_MAPPING[repTypeId];
    repType = REP_TYPES.find(t => t.id === mappedId);
    if (repType) {
      console.log(`[RepTaxonomy] Mapped legacy rep type "${repTypeId}" to "${mappedId}"`);
    }
  }
  
  return repType || null;
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

// =========================================
// V2 TAXONOMY (Feb 2026 - Ryan's Redesign)
// 10 Rep Types in 3 Categories
// =========================================

/**
 * V2 Rep Categories - Action-oriented groupings
 */
export const REP_CATEGORIES_V2 = {
  LEAD_THE_WORK: {
    id: 'lead_the_work',
    label: 'Lead the Work',
    shortLabel: 'Lead the Work',
    description: 'Setting expectations, handoffs, follow-up, and boundaries',
    icon: 'Briefcase',
    color: 'teal',
    order: 1
  },
  LEAD_THE_TEAM: {
    id: 'lead_the_team',
    label: 'Lead the Team',
    shortLabel: 'Lead the Team',
    description: 'Feedback, accountability, and handling reactions',
    icon: 'Users',
    color: 'navy',
    order: 2
  },
  LEAD_YOURSELF: {
    id: 'lead_yourself',
    label: 'Lead Yourself',
    shortLabel: 'Lead Yourself',
    description: 'Vulnerability, curiosity, and self-leadership',
    icon: 'User',
    color: 'orange',
    order: 3
  }
};

/**
 * V2 Rep Types - 10 Canonical Types
 * No difficulty labels shown to users
 * All prep is optional by default
 */
export const REP_TYPES_V2 = [
  // =========================================
  // LEAD THE WORK (4 types)
  // =========================================
  {
    id: 'set_clear_expectations',
    category: 'lead_the_work',
    label: 'Set Clear Expectations',
    shortLabel: 'Set Expectations',
    description: 'Define the work and what success looks like',
    order: 1,
    prepOptional: true,
    allowSoloRep: false
  },
  {
    id: 'make_clean_handoff',
    category: 'lead_the_work',
    label: 'Make a Clean Handoff',
    shortLabel: 'Clean Handoff',
    description: 'Explicitly transfer ownership of the work',
    order: 2,
    prepOptional: true,
    allowSoloRep: false
  },
  {
    id: 'follow_up_work',
    category: 'lead_the_work',
    label: 'Follow-up on the Work',
    shortLabel: 'Follow Up',
    description: 'Check progress, remove obstacles, and reinforce ownership',
    order: 3,
    prepOptional: true,
    allowSoloRep: false
  },
  {
    id: 'hold_the_line',
    category: 'lead_the_work',
    label: 'Hold the Line',
    shortLabel: 'Hold the Line',
    description: 'Support development without taking back ownership',
    order: 4,
    prepOptional: true,
    allowSoloRep: false
  },

  // =========================================
  // LEAD THE TEAM (4 types)
  // =========================================
  {
    id: 'deliver_reinforcing_feedback',
    category: 'lead_the_team',
    label: 'Deliver Reinforcing Feedback',
    shortLabel: 'Reinforcing Feedback',
    description: 'Build the noticing muscle and normalize feedback',
    order: 1,
    prepOptional: true,
    allowSoloRep: false
  },
  {
    id: 'deliver_redirecting_feedback',
    category: 'lead_the_team',
    label: 'Deliver Redirecting Feedback',
    shortLabel: 'Redirecting Feedback',
    description: 'Address performance gaps early, clearly, and directly',
    order: 2,
    prepOptional: true,
    allowSoloRep: false
  },
  {
    id: 'close_the_loop',
    category: 'lead_the_team',
    label: 'Close the Loop',
    shortLabel: 'Close the Loop',
    description: 'Verify that feedback actually drives behavior change',
    order: 3,
    prepOptional: true,
    allowSoloRep: false
  },
  {
    id: 'handle_pushback',
    category: 'lead_the_team',
    label: 'Handle Pushback',
    shortLabel: 'Handle Pushback',
    description: 'Stay composed and adapt when met with pushback',
    order: 4,
    prepOptional: true,
    allowSoloRep: false
  },

  // =========================================
  // LEAD YOURSELF (2 types)
  // =========================================
  {
    id: 'lead_with_vulnerability',
    category: 'lead_yourself',
    label: 'Lead with Vulnerability',
    shortLabel: 'Be Vulnerable',
    description: 'Model vulnerability and build psychological safety',
    order: 1,
    prepOptional: true,
    allowSoloRep: true
  },
  {
    id: 'be_curious',
    category: 'lead_yourself',
    label: 'Be Curious',
    shortLabel: 'Be Curious',
    description: 'Lead with a coach-like mindset and create space',
    order: 2,
    prepOptional: true,
    allowSoloRep: true
  }
];

/**
 * MILESTONE UNLOCKING CONFIGURATION (Legacy)
 * ==================================
 * Maps Foundation milestones (1-5) to which rep types unlock.
 * Users see ALL rep types from Day 1, but can only commit to unlocked ones.
 * 
 * Milestone 1: Core foundation reps
 * Milestone 2: Follow-up and vulnerability
 * Milestone 3: Redirecting feedback and closing loops
 * Milestone 4: Handling resistance and holding accountability
 * Milestone 5: Curiosity and coaching mindset
 * 
 * NOTE: Kept for backward compatibility. Session-based unlocking (SESSION_REP_UNLOCKS)
 * is now the primary method.
 */
export const MILESTONE_REP_UNLOCKS = {
  1: ['set_clear_expectations', 'deliver_reinforcing_feedback'],
  2: ['follow_up_work', 'lead_with_vulnerability'],
  3: ['deliver_redirecting_feedback', 'close_the_loop'],
  4: ['handle_pushback', 'hold_the_line', 'be_curious'],
  5: []
};

/**
 * SESSION-BASED REP UNLOCKING (Primary Method)
 * =============================================
 * Maps session attendance (marked by trainers) to which rep types unlock.
 * Reps only unlock when trainer marks attendance for specific sessions.
 * 
 * Session 1: Deliberate Practice → SCE, DRF
 * Session 2: 1:1 Coaching → FUW, LWV
 * Session 3: Open Gym → RED, CTL
 * Session 4: Open Gym → HPB, HTL, BEC
 * Session 5: Graduation → Ascent access (not rep unlocking)
 */
export const SESSION_REP_UNLOCKS = {
  'action-s1-deliberate-practice': ['set_clear_expectations', 'deliver_reinforcing_feedback'],
  'action-s2-deliberate-practice': ['follow_up_work', 'lead_with_vulnerability'],
  'action-s3-deliberate-practice': ['deliver_redirecting_feedback', 'close_the_loop'],
  'action-s4-deliberate-practice': ['handle_pushback', 'hold_the_line', 'be_curious']
  // Session 5 unlocks Ascent access, not specific reps
};

/**
 * Session metadata for display purposes
 */
export const SESSION_METADATA = {
  'action-s1-deliberate-practice': { number: 1, name: 'Session 1: Deliberate Practice' },
  'action-s2-deliberate-practice': { number: 2, name: 'Session 2: 1:1 Coaching' },
  'action-s3-deliberate-practice': { number: 3, name: 'Session 3: Open Gym' },
  'action-s4-deliberate-practice': { number: 4, name: 'Session 4: Open Gym' },
  'action-s5-deliberate-practice': { number: 5, name: 'Session 5: Graduation' }
};

/**
 * LINKED REPS CONFIGURATION
 * ==========================
 * Some reps become available only after completing a "parent" rep.
 * Example: "Make a Clean Handoff" becomes available after completing
 * "Set Clear Expectations" or "Deliver Reinforcing Feedback".
 * 
 * Key: rep type ID that requires a parent
 * Value: array of parent rep type IDs (any one unlocks it)
 */
export const LINKED_REPS = {
  'make_clean_handoff': ['set_clear_expectations', 'deliver_reinforcing_feedback']
};

/**
 * Get all rep types unlocked by a given milestone (cumulative)
 * Milestone 2 includes all of Milestone 1, etc.
 * @param {number} milestoneNumber - 1 to 5
 * @returns {string[]} Array of unlocked rep type IDs
 */
export const getUnlockedRepsByMilestone = (milestoneNumber) => {
  const unlocked = [];
  for (let m = 1; m <= milestoneNumber; m++) {
    if (MILESTONE_REP_UNLOCKS[m]) {
      unlocked.push(...MILESTONE_REP_UNLOCKS[m]);
    }
  }
  return unlocked;
};

/**
 * Get the session ID that unlocks a specific rep type
 * @param {string} repTypeId - The rep type ID
 * @returns {string|null} Session ID (e.g., 'action-s1-deliberate-practice') or null
 */
export const getSessionForRep = (repTypeId) => {
  for (const [sessionId, reps] of Object.entries(SESSION_REP_UNLOCKS)) {
    if (reps.includes(repTypeId)) {
      return sessionId;
    }
  }
  // Check if it's a linked rep (not directly unlocked by session)
  if (LINKED_REPS[repTypeId]) {
    return null;
  }
  return null;
};

/**
 * Get all rep types unlocked based on session attendance (cumulative)
 * @param {Object} sessionAttendance - User's sessionAttendance object from Firestore
 * @returns {string[]} Array of unlocked rep type IDs
 */
export const getUnlockedRepsBySessionAttendance = (sessionAttendance = {}) => {
  const unlocked = [];
  for (const [sessionId, reps] of Object.entries(SESSION_REP_UNLOCKS)) {
    if (sessionAttendance[sessionId]?.attended === true) {
      unlocked.push(...reps);
    }
  }
  return unlocked;
};

/**
 * Get the milestone number that unlocks a specific rep type
 * @param {string} repTypeId - The rep type ID
 * @returns {number|null} Milestone number (1-5) or null if not milestone-gated
 */
export const getMilestoneForRep = (repTypeId) => {
  for (const [milestone, reps] of Object.entries(MILESTONE_REP_UNLOCKS)) {
    if (reps.includes(repTypeId)) {
      return parseInt(milestone, 10);
    }
  }
  // Check if it's a linked rep (not directly unlocked by milestone)
  if (LINKED_REPS[repTypeId]) {
    return null; // Linked reps don't have a specific milestone
  }
  return null;
};

/**
 * Check if a rep type is unlocked for a user based on session attendance
 * (Primary method) or milestone progress (legacy fallback).
 * 
 * @param {string} repTypeId - The rep type ID
 * @param {Object} milestoneProgress - User's milestoneProgress object from Firestore (legacy)
 * @param {string[]} completedRepTypes - Array of rep type IDs the user has completed
 * @param {Object} sessionAttendance - User's sessionAttendance object from Firestore (primary)
 * @returns {{ unlocked: boolean, reason: string, session?: string, milestone?: number }}
 */
export const isRepUnlocked = (repTypeId, milestoneProgress = {}, completedRepTypes = [], sessionAttendance = null) => {
  // Check for prerequisites (linked reps) - first from Firestore cache, then hardcoded fallback
  let prerequisiteRepIds = null;
  
  // Check dynamic cache first (loaded from Firestore)
  if (_dynamicCache.isHydrated && _dynamicCache.repTypesById && _dynamicCache.repTypesById[repTypeId]) {
    const repType = _dynamicCache.repTypesById[repTypeId];
    if (repType.prerequisiteRepIds && repType.prerequisiteRepIds.length > 0) {
      prerequisiteRepIds = repType.prerequisiteRepIds;
    }
  }
  
  // Fall back to hardcoded LINKED_REPS if not in cache
  if (!prerequisiteRepIds && LINKED_REPS[repTypeId]) {
    prerequisiteRepIds = LINKED_REPS[repTypeId];
  }
  
  // If this rep has prerequisites, check if user has completed any of them
  if (prerequisiteRepIds && prerequisiteRepIds.length > 0) {
    const hasCompletedPrereq = prerequisiteRepIds.some(parentId => completedRepTypes.includes(parentId));
    if (hasCompletedPrereq) {
      return { unlocked: true, reason: 'Unlocked by completing prerequisite rep' };
    }
    // Find which reps could unlock this
    const parentLabels = prerequisiteRepIds.map(id => {
      // Try cache first
      if (_dynamicCache.repTypesById && _dynamicCache.repTypesById[id]) {
        return _dynamicCache.repTypesById[id].shortLabel || _dynamicCache.repTypesById[id].label;
      }
      // Fall back to hardcoded
      const rep = REP_TYPES_V2.find(r => r.id === id);
      return rep?.shortLabel || id;
    });
    return { 
      unlocked: false, 
      reason: `Complete "${parentLabels.join('" or "')}" first`,
      isLinkedRep: true
    };
  }

  // ============================================
  // SESSION-BASED UNLOCKING (Primary Method)
  // ============================================
  if (sessionAttendance !== null) {
    const requiredSession = getSessionForRep(repTypeId);
    
    if (requiredSession === null) {
      // Not gated by session - always available
      return { unlocked: true, reason: 'Always available' };
    }
    
    // Check if user attended the required session
    const isAttended = sessionAttendance[requiredSession]?.attended === true;
    
    if (isAttended) {
      const sessionMeta = SESSION_METADATA[requiredSession] || {};
      return { 
        unlocked: true, 
        reason: sessionMeta.name || `Session attended`,
        session: requiredSession 
      };
    }
    
    // Rep is locked - find which session is needed
    const sessionMeta = SESSION_METADATA[requiredSession] || {};
    return { 
      unlocked: false, 
      reason: `Attend ${sessionMeta.name || 'session'} to unlock`,
      session: requiredSession
    };
  }

  // ============================================
  // MILESTONE-BASED UNLOCKING (Legacy Fallback)
  // ============================================  
  const requiredMilestone = getMilestoneForRep(repTypeId);
  if (requiredMilestone === null) {
    // Not gated by milestone - always available
    return { unlocked: true, reason: 'Always available' };
  }
  
  // Check if user has completed or is on this milestone
  // Milestone 1 is always unlocked (starting point)
  if (requiredMilestone === 1) {
    return { unlocked: true, reason: 'Milestone 1 (starting reps)', milestone: 1 };
  }
  
  // For milestones 2-5, check if previous milestone is signed off
  const previousMilestone = `milestone_${requiredMilestone - 1}`;
  const prevMilestoneData = milestoneProgress[previousMilestone] || {};
  const isUnlocked = prevMilestoneData.signedOff === true;
  
  if (isUnlocked) {
    return { unlocked: true, reason: `Milestone ${requiredMilestone}`, milestone: requiredMilestone };
  }
  
  return { 
    unlocked: false, 
    reason: `Unlocks at Milestone ${requiredMilestone}`,
    milestone: requiredMilestone
  };
};

/**
 * Get all available (unlocked) rep types for a user
 * @param {Object} milestoneProgress - User's milestoneProgress object
 * @param {string[]} completedRepTypes - Array of completed rep type IDs
 * @returns {Object[]} Array of rep type objects with unlocked status
 */
export const getAvailableRepTypes = (milestoneProgress = {}, completedRepTypes = []) => {
  return REP_TYPES_V2.map(repType => {
    const unlockStatus = isRepUnlocked(repType.id, milestoneProgress, completedRepTypes);
    return {
      ...repType,
      ...unlockStatus
    };
  });
};

/**
 * Suggested Situations - 4 options per rep type + "Something else"
 * Used in the Situation step of both Planned and In-the-Moment flows
 * Updated March 2026 to match Conditioning Layer specifications
 * 
 * Some rep types have branching logic where different situations lead to
 * different evidence capture flows (e.g., Set Clear Expectations has 4 
 * situations that branch into different evidence screens).
 */
export const SUGGESTED_SITUATIONS = {
  // SET CLEAR EXPECTATIONS - 4 situations with branching evidence capture
  // #1 & #2 are linked RR (expectations + handoff)
  // #3 & #4 need softer alignment/commitment at the end
  'set_clear_expectations': [
    'I\'m assigning a task and defining what done looks like',
    'I\'m delegating ongoing ownership of a responsibility',
    'I\'m setting or clarifying behavioral standards',
    'I\'m resetting expectations without changing ownership'
  ],
  
  // DELIVER REINFORCING FEEDBACK - 4 situations
  'deliver_reinforcing_feedback': [
    'I\'m reinforcing a behavior I want repeated',
    'I\'m acknowledging improvement after prior feedback',
    'I\'m recognizing strong follow-through',
    'I\'m reinforcing ownership taken without prompting'
  ],
  
  // DELIVER REDIRECTING FEEDBACK - 4 situations (Result vs Behavior)
  'deliver_redirecting_feedback': [
    'I\'m addressing a missed deadline or broken commitment',
    'I\'m correcting work that did not meet the standard',
    'I\'m addressing behavior that undermines trust',
    'I\'m confronting a repeated pattern'
  ],
  
  // FOLLOW UP ON THE WORK - 3 situations (all use same evidence flow)
  'follow_up_work': [
    'I\'m checking progress on a task or project',
    'I\'m checking progress on an ongoing responsibility',
    'I\'m checking progress after recently delegating ownership'
  ],
  
  // CLOSE THE LOOP - 4 situations (Improvement vs No Improvement)
  'close_the_loop': [
    'I\'m checking whether prior feedback led to change',
    'I\'m reinforcing improvement after prior feedback',
    'I\'m addressing a previously discussed issue that resurfaced',
    'I\'m escalating after feedback didn\'t lead to change'
  ],
  
  // HANDLE PUSHBACK - 4 situations (Emotion vs Disagreement)
  'handle_pushback': [
    'I\'m responding to defensiveness',
    'I\'m stabilizing a reactive conversation',
    'I\'m addressing disagreement about the standard',
    'I\'m redirecting from intent to impact'
  ],
  
  // HOLD THE LINE - 4 situations (Ownership, Deadline, Standard)
  'hold_the_line': [
    'I\'m keeping ownership with them',
    'I\'m not stealing, rescuing, or fixing their work',
    'I\'m holding or renegotiating a deadline',
    'I\'m maintaining the standard under pressure'
  ],
  
  // LEAD WITH VULNERABILITY - 3 situations (all use same evidence flow)
  'lead_with_vulnerability': [
    'I owned a mistake or misjudgment',
    'I acknowledged uncertainty or that I didn\'t have the answer',
    'My thinking changed after new information'
  ],
  
  // BE CURIOUS - 4 situations
  'be_curious': [
    'I\'m exploring a change in performance',
    'I\'m asking questions instead of offering advice',
    'I\'m trying to understand what\'s really going on',
    'I\'m seeking first to understand'
  ],
  
  // MAKE A CLEAN HANDOFF - 4 situations (linked rep)
  'make_clean_handoff': [
    'I\'m transferring ownership of a task or responsibility',
    'I\'m delegating decision authority with clear boundaries',
    'I\'m handing off work with explicit success criteria',
    'I\'m transitioning ongoing responsibility to someone new'
  ]
};

/**
 * Behavior Focus Reminders - shown at commit time and on In-the-Moment type selection
 */
export const BEHAVIOR_FOCUS_REMINDERS = {
  'deliver_reinforcing_feedback': 
    'Notice the specific behavior and name why it matters so it gets repeated.',
  'set_clear_expectations': 
    'Be explicit about what success looks like and confirm shared understanding.',
  'make_clean_handoff': 
    'Transfer ownership clearly and confirm it is accepted.',
  'follow_up_work': 
    'Check progress against expectations without fixing or taking back ownership.',
  'lead_with_vulnerability': 
    'Go first and model vulnerability by owning a miss, asking for help, etc.',
  'deliver_redirecting_feedback': 
    'Name the behavior gap, its impact, and the expected change directly.',
  'close_the_loop': 
    'Verify that behavior actually changed and respond intentionally.',
  'handle_pushback': 
    'Acknowledge the reaction and hold the standard without arguing or retreating.',
  'hold_the_line': 
    'Support thinking while keeping ownership with the other person.',
  'be_curious': 
    'Seek to understand what\'s really happening without correcting or fixing.'
};

/**
 * Active Rep Card Reminders - shown on committed rep cards (5 types only)
 * These remind the leader what's required for the rep to "pass"
 */
export const ACTIVE_REP_REMINDERS = {
  'set_clear_expectations': 
    'You\'ll need to define what "good" or "done" looks like when submitting evidence.',
  'make_clean_handoff': 
    'This rep presumes expectations were clearly set. Ownership must be explicitly accepted to pass.',
  'follow_up_work': 
    'This rep should reference a prior handoff. Fixing or re-owning the work will fail this rep.',
  'deliver_redirecting_feedback': 
    'All CLEAR elements are required for this rep to pass.',
  'close_the_loop': 
    'This should link to a prior feedback rep. Closure must be based on observed behavior.'
};

/**
 * Prep Prompts - Max 2 prompts per rep type, 60-120 second alignment check
 * Hard character limits to prevent over-thinking
 */
export const PREP_PROMPTS = {
  'deliver_reinforcing_feedback': [
    { prompt: 'What behavior are you reinforcing?', maxChars: 100 },
    { prompt: 'Why does it matter?', maxChars: 100 }
  ],
  'set_clear_expectations': [
    { prompt: 'What does "done" or "good" look like?', maxChars: 100 },
    { prompt: 'How will you confirm shared understanding?', maxChars: 100 }
  ],
  'make_clean_handoff': [
    { prompt: 'What ownership are you transferring?', maxChars: 100 },
    { prompt: 'How will you confirm they accept it?', maxChars: 100 }
  ],
  'follow_up_work': [
    { prompt: 'What expectations are you checking against?', maxChars: 100 },
    { prompt: 'What will you NOT fix or take back?', maxChars: 100 }
  ],
  'lead_with_vulnerability': [
    { prompt: 'What are you owning or admitting?', maxChars: 100 },
    { prompt: 'What makes this feel risky?', maxChars: 100 }
  ],
  'deliver_redirecting_feedback': [
    { prompt: 'What behavior are you naming?', maxChars: 100 },
    { prompt: 'What standard are you holding?', maxChars: 100 }
  ],
  'close_the_loop': [
    { prompt: 'What prior feedback are you following up on?', maxChars: 100 },
    { prompt: 'What behavior change are you looking for?', maxChars: 100 }
  ],
  'handle_pushback': [
    { prompt: 'What reaction might show up?', maxChars: 100 },
    { prompt: 'What boundary must you hold?', maxChars: 100 }
  ],
  'hold_the_line': [
    { prompt: 'What are you most tempted to fix?', maxChars: 100 },
    { prompt: 'What question will you ask instead?', maxChars: 100 }
  ],
  'be_curious': [
    { prompt: 'What feels off that you want to explore?', maxChars: 100 },
    { prompt: 'What assumption are you setting aside?', maxChars: 100 }
  ]
};

/**
 * Legacy V1 to V2 Rep Type Mapping
 * Maps old 16-type taxonomy IDs to new 10-type taxonomy
 */
export const V1_TO_V2_REP_MAPPING = {
  // Reinforcing types → deliver_reinforcing_feedback
  'reinforce_public': 'deliver_reinforcing_feedback',
  
  // Redirecting types → deliver_redirecting_feedback or close_the_loop
  'redirect_moment': 'deliver_redirecting_feedback',
  'redirect_prepared': 'deliver_redirecting_feedback',
  'redirect_pattern': 'deliver_redirecting_feedback',
  'adjust_mid_feedback': 'handle_pushback',
  'close_loop': 'close_the_loop',
  
  // Ambiguous/Emotional → be_curious or lead_with_vulnerability
  'whats_going_on': 'be_curious',
  'receive_feedback': 'lead_with_vulnerability',
  'lead_vulnerability': 'lead_with_vulnerability',
  
  // Standards/Authority → various
  'delegate_clean': 'make_clean_handoff',
  'hold_line': 'hold_the_line',
  'let_consequence': 'hold_the_line',
  'say_no': 'set_clear_expectations',
  
  // Escalation/Decisions → various
  'name_pattern_change': 'deliver_redirecting_feedback',
  'coaching_to_consequence': 'deliver_redirecting_feedback',
  'mediate_conflict': 'handle_pushback'
};

// =========================================
// V2 HELPER FUNCTIONS
// =========================================

/**
 * Get V2 rep type by ID
 */
export const getRepTypeV2 = (repTypeId) => {
  // First try direct V2 match
  let repType = REP_TYPES_V2.find(t => t.id === repTypeId);
  
  // If not found, try V1 to V2 mapping
  if (!repType && V1_TO_V2_REP_MAPPING[repTypeId]) {
    const mappedId = V1_TO_V2_REP_MAPPING[repTypeId];
    repType = REP_TYPES_V2.find(t => t.id === mappedId);
    if (repType) {
      console.log(`[RepTaxonomy V2] Mapped V1 type "${repTypeId}" to V2 "${mappedId}"`);
    }
  }
  
  return repType || null;
};

/**
 * Get V2 rep types by category (sorted by order)
 */
export const getRepTypesByCategoryV2 = (categoryId) => {
  return REP_TYPES_V2
    .filter(t => t.category === categoryId)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get V2 category by ID
 */
export const getCategoryV2 = (categoryId) => {
  return Object.values(REP_CATEGORIES_V2).find(c => c.id === categoryId) || null;
};

/**
 * Get all V2 categories as array (sorted by order)
 */
export const getCategoriesArrayV2 = () => {
  return Object.values(REP_CATEGORIES_V2).sort((a, b) => a.order - b.order);
};

/**
 * Get suggested situations for a rep type
 * Uses Firestore cache if available, falls back to hardcoded data
 */
export const getSuggestedSituations = (repTypeId) => {
  // Check dynamic cache first (populated by RepTypeProvider from Firestore)
  if (_dynamicCache.isHydrated && _dynamicCache.situations && _dynamicCache.situations[repTypeId]) {
    return _dynamicCache.situations[repTypeId];
  }
  // Fall back to hardcoded data
  return SUGGESTED_SITUATIONS[repTypeId] || [];
};

/**
 * Get behavior focus reminder for a rep type
 * Uses Firestore cache if available, falls back to hardcoded data
 */
export const getBehaviorFocusReminder = (repTypeId) => {
  // Check dynamic cache first
  if (_dynamicCache.isHydrated && _dynamicCache.prompts && _dynamicCache.prompts[repTypeId]?.behaviorFocus) {
    return _dynamicCache.prompts[repTypeId].behaviorFocus;
  }
  // Fall back to hardcoded data
  return BEHAVIOR_FOCUS_REMINDERS[repTypeId] || null;
};

/**
 * Get active rep card reminder for a rep type (if applicable)
 * Uses Firestore cache if available, falls back to hardcoded data
 */
export const getActiveRepReminder = (repTypeId) => {
  // Check dynamic cache first
  if (_dynamicCache.isHydrated && _dynamicCache.prompts && _dynamicCache.prompts[repTypeId]?.activeReminder) {
    return _dynamicCache.prompts[repTypeId].activeReminder;
  }
  // Fall back to hardcoded data
  return ACTIVE_REP_REMINDERS[repTypeId] || null;
};

/**
 * Get prep prompts for a rep type
 */
export const getPrepPrompts = (repTypeId) => {
  return PREP_PROMPTS[repTypeId] || [];
};

// V2 alias for getPrepPrompts (same data, clearer naming)
export const getPrepPromptsV2 = getPrepPrompts;

export default {
  // V1 exports (backward compatibility)
  REP_CATEGORIES,
  REP_TYPES,
  DIFFICULTY_LEVELS,
  RISK_LEVELS,
  UNIVERSAL_REP_FIELDS,
  HIGH_RISK_PREP_QUESTIONS,
  LEGACY_REP_TYPE_MAPPING,
  getRepType,
  getRepTypesByCategory,
  getCategory,
  getCategoriesArray,
  isPrepRequired,
  getRubric,
  getStretchPrompts,
  getProgression,
  sortByDifficulty,
  
  // V2 exports (new taxonomy)
  REP_CATEGORIES_V2,
  REP_TYPES_V2,
  SUGGESTED_SITUATIONS,
  BEHAVIOR_FOCUS_REMINDERS,
  ACTIVE_REP_REMINDERS,
  PREP_PROMPTS,
  V1_TO_V2_REP_MAPPING,
  getRepTypeV2,
  getRepTypesByCategoryV2,
  getCategoryV2,
  getCategoriesArrayV2,
  getSuggestedSituations,
  getBehaviorFocusReminder,
  getActiveRepReminder,
  getPrepPrompts,
  getPrepPromptsV2,
  
  // Milestone unlocking exports (legacy)
  MILESTONE_REP_UNLOCKS,
  LINKED_REPS,
  getUnlockedRepsByMilestone,
  getMilestoneForRep,
  isRepUnlocked,
  getAvailableRepTypes,
  
  // Session-based unlocking exports (primary)
  SESSION_REP_UNLOCKS,
  SESSION_METADATA,
  getSessionForRep,
  getUnlockedRepsBySessionAttendance
};
