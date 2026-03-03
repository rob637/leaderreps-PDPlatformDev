#!/usr/bin/env node
/**
 * Migrate Rep Taxonomy to Firestore
 * ==================================
 * Moves conditioning rep type definitions from repTaxonomy.js to Firestore collections.
 * This enables admin management of rep types without code deployments.
 * 
 * Collections created:
 * - conditioning_categories: Rep type groupings
 * - conditioning_rep_types: Master rep type definitions
 * - conditioning_quality_dimensions: Scoring criteria for AI assessment
 * - conditioning_coach_prompts: AI coaching prompt templates
 * 
 * Usage:
 *   node scripts/migrations/migrate-rep-taxonomy-to-firestore.cjs --env=dev
 *   node scripts/migrations/migrate-rep-taxonomy-to-firestore.cjs --env=test
 *   node scripts/migrations/migrate-rep-taxonomy-to-firestore.cjs --env=prod --dry-run
 */

const admin = require('firebase-admin');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const envArg = args.find(a => a.startsWith('--env='));
const isDryRun = args.includes('--dry-run');
const env = envArg ? envArg.split('=')[1] : 'dev';

// Environment config
const ENV_CONFIG = {
  dev: {
    projectId: 'leaderreps-pd-platform',
    credentialsFile: 'leaderreps-pd-platform-firebase-adminsdk.json'
  },
  test: {
    projectId: 'leaderreps-test',
    credentialsFile: 'leaderreps-test-firebase-adminsdk.json'
  },
  prod: {
    projectId: 'leaderreps-prod',
    credentialsFile: 'leaderreps-prod-firebase-adminsdk.json'
  }
};

const config = ENV_CONFIG[env];
if (!config) {
  console.error(`Invalid environment: ${env}. Use dev, test, or prod.`);
  process.exit(1);
}

// Initialize Firebase
const serviceAccountPath = path.resolve(__dirname, '../../', config.credentialsFile);
const serviceAccount = require(serviceAccountPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Migrate Rep Taxonomy to Firestore                           ║
╠══════════════════════════════════════════════════════════════╣
║  Environment: ${env.toUpperCase().padEnd(45)}║
║  Project:     ${config.projectId.padEnd(45)}║
║  Mode:        ${(isDryRun ? 'DRY RUN (no writes)' : 'LIVE').padEnd(45)}║
╚══════════════════════════════════════════════════════════════╝
`);

// ============================================
// DATA DEFINITIONS (from repTaxonomy.js)
// ============================================

// V2 Categories - the active ones
const CATEGORIES = [
  {
    id: 'lead_the_work',
    label: 'Lead the Work',
    shortLabel: 'Lead the Work',
    description: 'Setting expectations, handoffs, follow-up, and boundaries',
    icon: 'Briefcase',
    color: 'teal',
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'lead_the_team',
    label: 'Lead the Team',
    shortLabel: 'Lead the Team',
    description: 'Feedback, accountability, and handling reactions',
    icon: 'Users',
    color: 'navy',
    sortOrder: 2,
    isActive: true
  },
  {
    id: 'lead_yourself',
    label: 'Lead Yourself',
    shortLabel: 'Lead Yourself',
    description: 'Vulnerability, curiosity, and self-leadership',
    icon: 'User',
    color: 'orange',
    sortOrder: 3,
    isActive: true
  }
];

// V2 Rep Types (10 canonical types)
const REP_TYPES = [
  // LEAD THE WORK (4 types)
  {
    id: 'set_clear_expectations',
    categoryId: 'lead_the_work',
    label: 'Set Clear Expectations',
    shortLabel: 'Set Expectations',
    description: 'Define the work and what success looks like',
    detailedDescription: 'Setting clear expectations is the foundation of effective delegation and accountability. This rep focuses on articulating what success looks like before work begins.',
    exampleScenarios: [
      'Assigning a new project to a team member',
      'Clarifying deliverables for a cross-functional initiative',
      'Setting quality standards for ongoing work'
    ],
    defaultScaffoldingPrompts: {
      level1: ['What specifically needs to be done?', 'When does it need to be complete?', 'What does "done" look like?'],
      level2: ['What constraints or boundaries apply?', 'What authority does the person have?', 'How will you know if they need help?'],
      level3: ['What happens if expectations aren\'t met?', 'How will you follow up?', 'What support will you provide?']
    },
    qualityDimensions: ['clarity', 'specificity', 'completeness'],
    prerequisites: [],
    baseDifficultyTier: 1,
    estimatedMinutes: 15,
    prepOptional: true,
    allowSoloRep: false,
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'make_clean_handoff',
    categoryId: 'lead_the_work',
    label: 'Make a Clean Handoff',
    shortLabel: 'Clean Handoff',
    description: 'Explicitly transfer ownership of the work',
    detailedDescription: 'A clean handoff ensures the recipient has full ownership and context. This rep is often linked to another rep (like Set Expectations or Feedback) to practice the transition moment.',
    exampleScenarios: [
      'Transferring project ownership after setting expectations',
      'Handing off follow-up responsibility after giving feedback',
      'Delegating ongoing work to a new owner'
    ],
    defaultScaffoldingPrompts: {
      level1: ['What exactly are you handing off?', 'Who is receiving ownership?', 'What did you say to make ownership explicit?'],
      level2: ['How did you confirm they accepted ownership?', 'What questions did they ask?', 'What support did you offer?'],
      level3: ['How did you resist the urge to take it back?', 'What happens if they struggle?', 'When will you check in?']
    },
    qualityDimensions: ['clarity', 'ownership_transfer', 'completeness'],
    prerequisites: [],
    baseDifficultyTier: 1,
    estimatedMinutes: 10,
    prepOptional: true,
    allowSoloRep: false,
    sortOrder: 2,
    isActive: true
  },
  {
    id: 'follow_up_work',
    categoryId: 'lead_the_work',
    label: 'Follow-up on the Work',
    shortLabel: 'Follow Up',
    description: 'Check progress, remove obstacles, and reinforce ownership',
    detailedDescription: 'Following up is not micromanaging - it\'s providing support while maintaining accountability. This rep focuses on checking in without taking ownership back.',
    exampleScenarios: [
      'Checking progress on a delegated project',
      'Removing obstacles for a struggling team member',
      'Reinforcing ownership when someone tries to hand work back'
    ],
    defaultScaffoldingPrompts: {
      level1: ['What work are you following up on?', 'How did you check in?', 'What did you learn?'],
      level2: ['What obstacles did you help remove?', 'How did you reinforce their ownership?', 'What\'s the next check-in?'],
      level3: ['Did they try to hand it back? How did you handle it?', 'What support did you provide without taking over?']
    },
    qualityDimensions: ['clarity', 'ownership_support', 'boundaries'],
    prerequisites: [],
    baseDifficultyTier: 2,
    estimatedMinutes: 15,
    prepOptional: true,
    allowSoloRep: false,
    sortOrder: 3,
    isActive: true
  },
  {
    id: 'hold_the_line',
    categoryId: 'lead_the_work',
    label: 'Hold the Line',
    shortLabel: 'Hold the Line',
    description: 'Support development without taking back ownership',
    detailedDescription: 'Holding the line is about maintaining boundaries and standards while supporting someone\'s growth. It\'s the discipline to let someone struggle productively.',
    exampleScenarios: [
      'Someone asks you to just do it for them',
      'A team member wants to lower the standard',
      'Pressure to rescue someone from their own work'
    ],
    defaultScaffoldingPrompts: {
      level1: ['What boundary were you holding?', 'What pressure did you face?', 'How did you respond?'],
      level2: ['How did you support without rescuing?', 'What was their reaction?', 'How did you maintain the standard?'],
      level3: ['What was the hardest part about not taking over?', 'What did they learn from the struggle?']
    },
    qualityDimensions: ['boundaries', 'clarity', 'growth_mindset'],
    prerequisites: [],
    baseDifficultyTier: 3,
    estimatedMinutes: 15,
    prepOptional: true,
    allowSoloRep: false,
    sortOrder: 4,
    isActive: true
  },
  
  // LEAD THE TEAM (4 types)
  {
    id: 'deliver_reinforcing_feedback',
    categoryId: 'lead_the_team',
    label: 'Deliver Reinforcing Feedback',
    shortLabel: 'Reinforcing Feedback',
    description: 'Build the noticing muscle and normalize feedback',
    detailedDescription: 'Reinforcing feedback builds trust and makes redirecting feedback easier to receive. This rep focuses on specific, meaningful recognition of good work.',
    exampleScenarios: [
      'Recognizing someone\'s contribution in a meeting',
      'Praising specific behavior, not just results',
      'Reinforcing someone who took a risk'
    ],
    defaultScaffoldingPrompts: {
      level1: ['What specific behavior did you reinforce?', 'What impact did it have?', 'How did they respond?'],
      level2: ['What made this recognition meaningful?', 'Did you do it publicly or privately?', 'What did you notice in their reaction?'],
      level3: ['How do you build a habit of noticing?', 'What feedback have you been avoiding giving?']
    },
    qualityDimensions: ['specificity', 'impact_awareness', 'authenticity'],
    prerequisites: [],
    baseDifficultyTier: 1,
    estimatedMinutes: 10,
    prepOptional: true,
    allowSoloRep: false,
    sortOrder: 5,
    isActive: true
  },
  {
    id: 'deliver_redirecting_feedback',
    categoryId: 'lead_the_team',
    label: 'Deliver Redirecting Feedback',
    shortLabel: 'Redirecting Feedback',
    description: 'Address performance gaps early, clearly, and directly',
    detailedDescription: 'Redirecting feedback addresses gaps before they become patterns. This rep focuses on clarity, directness, and care in addressing issues.',
    exampleScenarios: [
      'Addressing a missed deadline or quality issue',
      'Correcting behavior in a meeting',
      'Having a difficult conversation about performance'
    ],
    defaultScaffoldingPrompts: {
      level1: ['What specific behavior did you address?', 'What was the impact?', 'What change did you request?'],
      level2: ['How did you deliver it with care?', 'What was their reaction?', 'What commitment did you get?'],
      level3: ['How will you follow up?', 'What happens if the behavior doesn\'t change?']
    },
    qualityDimensions: ['clarity', 'specificity', 'directness', 'care'],
    prerequisites: [],
    baseDifficultyTier: 2,
    estimatedMinutes: 20,
    prepOptional: true,
    allowSoloRep: false,
    sortOrder: 6,
    isActive: true
  },
  {
    id: 'close_the_loop',
    categoryId: 'lead_the_team',
    label: 'Close the Loop',
    shortLabel: 'Close the Loop',
    description: 'Verify that feedback actually drives behavior change',
    detailedDescription: 'Closing the loop is following up on previous feedback to confirm change happened. Without this step, feedback has no accountability.',
    exampleScenarios: [
      'Checking if previous feedback was implemented',
      'Acknowledging improvement since last conversation',
      'Addressing continued issues after prior feedback'
    ],
    defaultScaffoldingPrompts: {
      level1: ['What was the original feedback?', 'What change did you observe?', 'What did you say?'],
      level2: ['How did you acknowledge their progress?', 'What still needs work?', 'What\'s the next milestone?'],
      level3: ['What if there was no change?', 'How do you escalate appropriately?']
    },
    qualityDimensions: ['follow_through', 'specificity', 'clarity'],
    prerequisites: [],
    baseDifficultyTier: 2,
    estimatedMinutes: 15,
    prepOptional: true,
    allowSoloRep: false,
    sortOrder: 7,
    isActive: true
  },
  {
    id: 'handle_pushback',
    categoryId: 'lead_the_team',
    label: 'Handle Pushback',
    shortLabel: 'Handle Pushback',
    description: 'Stay composed and adapt when met with pushback',
    detailedDescription: 'Handling pushback is about staying regulated and maintaining your message while adapting to the other person\'s response. It\'s not about winning - it\'s about staying in the conversation.',
    exampleScenarios: [
      'Someone gets defensive during feedback',
      'A team member disagrees with your decision',
      'Receiving unexpected resistance to a request'
    ],
    defaultScaffoldingPrompts: {
      level1: ['What kind of pushback did you encounter?', 'How did you respond in the moment?', 'What was the outcome?'],
      level2: ['How did you stay regulated?', 'Did you adapt your approach?', 'What did you learn?'],
      level3: ['What was your internal experience?', 'How did you avoid either bulldozing or retreating?']
    },
    qualityDimensions: ['emotional_regulation', 'adaptability', 'clarity'],
    prerequisites: [],
    baseDifficultyTier: 3,
    estimatedMinutes: 20,
    prepOptional: true,
    allowSoloRep: false,
    sortOrder: 8,
    isActive: true
  },
  
  // LEAD YOURSELF (2 types)
  {
    id: 'lead_with_vulnerability',
    categoryId: 'lead_yourself',
    label: 'Lead with Vulnerability',
    shortLabel: 'Be Vulnerable',
    description: 'Model vulnerability and build psychological safety',
    detailedDescription: 'Leading with vulnerability means showing your humanity - admitting mistakes, asking for help, or sharing uncertainty. It builds trust and makes it safe for others to do the same.',
    exampleScenarios: [
      'Admitting you don\'t know something',
      'Apologizing for a mistake publicly',
      'Asking for help on something visible'
    ],
    defaultScaffoldingPrompts: {
      level1: ['What did you share or admit?', 'Who did you share it with?', 'How did they respond?'],
      level2: ['What risk did this feel like?', 'What impact did it have on the team?', 'How did it feel?'],
      level3: ['What vulnerability have you been avoiding?', 'What would it look like to go bigger?']
    },
    qualityDimensions: ['authenticity', 'courage', 'impact_awareness'],
    prerequisites: [],
    baseDifficultyTier: 2,
    estimatedMinutes: 15,
    prepOptional: true,
    allowSoloRep: true,
    sortOrder: 9,
    isActive: true
  },
  {
    id: 'be_curious',
    categoryId: 'lead_yourself',
    label: 'Be Curious',
    shortLabel: 'Be Curious',
    description: 'Lead with a coach-like mindset and create space',
    detailedDescription: 'Being curious means asking questions instead of giving answers, creating space for others to think, and resisting the urge to solve. It\'s a coaching mindset that develops others.',
    exampleScenarios: [
      'Asking questions instead of giving the answer',
      'Creating space for someone to problem-solve',
      'Staying curious when you\'re frustrated'
    ],
    defaultScaffoldingPrompts: {
      level1: ['What question did you ask?', 'What space did you create?', 'What happened?'],
      level2: ['How hard was it to not give the answer?', 'What did they discover?', 'What did you learn about them?'],
      level3: ['Where else could you be more curious?', 'What assumptions are you carrying?']
    },
    qualityDimensions: ['curiosity', 'restraint', 'development_mindset'],
    prerequisites: [],
    baseDifficultyTier: 2,
    estimatedMinutes: 15,
    prepOptional: true,
    allowSoloRep: true,
    sortOrder: 10,
    isActive: true
  }
];

// Quality Dimensions for AI assessment
const QUALITY_DIMENSIONS = [
  {
    id: 'clarity',
    label: 'Clarity',
    description: 'How clear and unambiguous was the communication?',
    scoringGuidance: {
      excellent: 'Message was crystal clear with no room for misinterpretation',
      good: 'Message was mostly clear with minor ambiguities',
      developing: 'Message had significant unclear elements'
    },
    weight: 1.0,
    appliesToCategories: ['lead_the_work', 'lead_the_team', 'lead_yourself'],
    isActive: true
  },
  {
    id: 'specificity',
    label: 'Specificity',
    description: 'How specific were the examples, behaviors, or requests?',
    scoringGuidance: {
      excellent: 'Highly specific with concrete examples and observable behaviors',
      good: 'Reasonably specific with some concrete details',
      developing: 'Vague or generic without clear specifics'
    },
    weight: 1.0,
    appliesToCategories: ['lead_the_work', 'lead_the_team'],
    isActive: true
  },
  {
    id: 'completeness',
    label: 'Completeness',
    description: 'Were all necessary elements covered?',
    scoringGuidance: {
      excellent: 'All essential elements addressed thoroughly',
      good: 'Most elements addressed with minor gaps',
      developing: 'Key elements missing or incomplete'
    },
    weight: 0.8,
    appliesToCategories: ['lead_the_work'],
    isActive: true
  },
  {
    id: 'ownership_transfer',
    label: 'Ownership Transfer',
    description: 'Was ownership explicitly transferred and confirmed?',
    scoringGuidance: {
      excellent: 'Clear explicit handoff with confirmed acceptance',
      good: 'Handoff occurred but acceptance not explicitly confirmed',
      developing: 'Ownership remained ambiguous after conversation'
    },
    weight: 1.2,
    appliesToCategories: ['lead_the_work'],
    isActive: true
  },
  {
    id: 'ownership_support',
    label: 'Ownership Support',
    description: 'Was ownership supported without rescuing?',
    scoringGuidance: {
      excellent: 'Provided support while clearly maintaining their ownership',
      good: 'Some support given, mostly maintained boundaries',
      developing: 'Took back ownership or failed to provide needed support'
    },
    weight: 1.0,
    appliesToCategories: ['lead_the_work'],
    isActive: true
  },
  {
    id: 'boundaries',
    label: 'Boundaries',
    description: 'Were appropriate boundaries maintained?',
    scoringGuidance: {
      excellent: 'Clear boundaries held with appropriate firmness',
      good: 'Boundaries mostly maintained with minor wavering',
      developing: 'Boundaries unclear or not maintained'
    },
    weight: 1.0,
    appliesToCategories: ['lead_the_work', 'lead_the_team'],
    isActive: true
  },
  {
    id: 'growth_mindset',
    label: 'Growth Mindset',
    description: 'Was growth and development prioritized despite short-term discomfort?',
    scoringGuidance: {
      excellent: 'Clearly prioritized long-term growth over short-term ease',
      good: 'Generally supported growth with some comfort-seeking',
      developing: 'Prioritized comfort over growth opportunity'
    },
    weight: 0.8,
    appliesToCategories: ['lead_the_work'],
    isActive: true
  },
  {
    id: 'impact_awareness',
    label: 'Impact Awareness',
    description: 'Was the impact of behavior/action clearly articulated?',
    scoringGuidance: {
      excellent: 'Impact clearly articulated with specific consequences',
      good: 'Impact mentioned but not fully detailed',
      developing: 'Impact not addressed or unclear'
    },
    weight: 1.0,
    appliesToCategories: ['lead_the_team', 'lead_yourself'],
    isActive: true
  },
  {
    id: 'authenticity',
    label: 'Authenticity',
    description: 'Did the action feel genuine and authentic?',
    scoringGuidance: {
      excellent: 'Clearly genuine with personal investment',
      good: 'Mostly authentic with minor performative elements',
      developing: 'Felt forced or inauthentic'
    },
    weight: 1.0,
    appliesToCategories: ['lead_the_team', 'lead_yourself'],
    isActive: true
  },
  {
    id: 'directness',
    label: 'Directness',
    description: 'Was the message delivered directly without hedging?',
    scoringGuidance: {
      excellent: 'Direct and clear without excessive softening',
      good: 'Mostly direct with some hedging',
      developing: 'Overly hedged or indirect'
    },
    weight: 1.0,
    appliesToCategories: ['lead_the_team'],
    isActive: true
  },
  {
    id: 'care',
    label: 'Care',
    description: 'Was care and respect shown while delivering the message?',
    scoringGuidance: {
      excellent: 'Clear care and respect throughout, dignity preserved',
      good: 'Generally caring with room for improvement',
      developing: 'Came across as uncaring or harsh'
    },
    weight: 1.0,
    appliesToCategories: ['lead_the_team'],
    isActive: true
  },
  {
    id: 'follow_through',
    label: 'Follow Through',
    description: 'Was there clear follow-through on previous commitments?',
    scoringGuidance: {
      excellent: 'Strong follow-through with clear accountability',
      good: 'Followed through but could be more explicit',
      developing: 'Weak or no follow-through'
    },
    weight: 1.0,
    appliesToCategories: ['lead_the_team'],
    isActive: true
  },
  {
    id: 'emotional_regulation',
    label: 'Emotional Regulation',
    description: 'Was composure maintained under pressure?',
    scoringGuidance: {
      excellent: 'Stayed composed and regulated throughout',
      good: 'Mostly composed with brief moments of reactivity',
      developing: 'Lost composure or became reactive'
    },
    weight: 1.2,
    appliesToCategories: ['lead_the_team'],
    isActive: true
  },
  {
    id: 'adaptability',
    label: 'Adaptability',
    description: 'Was there appropriate adaptation to the situation?',
    scoringGuidance: {
      excellent: 'Skillfully adapted approach while maintaining message',
      good: 'Made some adaptations appropriately',
      developing: 'Rigid or changed message entirely'
    },
    weight: 0.8,
    appliesToCategories: ['lead_the_team'],
    isActive: true
  },
  {
    id: 'courage',
    label: 'Courage',
    description: 'Was appropriate risk taken in being vulnerable?',
    scoringGuidance: {
      excellent: 'Showed real courage in sharing something risky',
      good: 'Some courage shown, could go deeper',
      developing: 'Played it safe, minimal risk taken'
    },
    weight: 1.2,
    appliesToCategories: ['lead_yourself'],
    isActive: true
  },
  {
    id: 'curiosity',
    label: 'Curiosity',
    description: 'Was genuine curiosity demonstrated?',
    scoringGuidance: {
      excellent: 'Deep genuine curiosity that created space for others',
      good: 'Some curiosity shown',
      developing: 'More telling than asking'
    },
    weight: 1.0,
    appliesToCategories: ['lead_yourself'],
    isActive: true
  },
  {
    id: 'restraint',
    label: 'Restraint',
    description: 'Was there appropriate restraint from providing answers?',
    scoringGuidance: {
      excellent: 'Resisted urge to solve, created space for their thinking',
      good: 'Mostly restrained with occasional solving',
      developing: 'Jumped to solutions or advice'
    },
    weight: 1.0,
    appliesToCategories: ['lead_yourself'],
    isActive: true
  },
  {
    id: 'development_mindset',
    label: 'Development Mindset',
    description: 'Was the focus on developing others?',
    scoringGuidance: {
      excellent: 'Clearly focused on their development and growth',
      good: 'Some development focus',
      developing: 'More focused on task completion than development'
    },
    weight: 0.8,
    appliesToCategories: ['lead_yourself'],
    isActive: true
  }
];

// Coach Prompts for AI assessment
const COACH_PROMPTS = [
  {
    id: 'evidence_assessment_default',
    promptType: 'evidence_assessment',
    repTypeId: null,
    milestoneId: null,
    template: `You are an expert leadership coach evaluating a Real Rep practice session.

A Real Rep is a leadership skill practiced in a real workplace situation. The leader has committed to a specific rep type and is now providing evidence of what happened.

Rep Type: {{repTypeLabel}}
Rep Description: {{repTypeDescription}}

The leader's evidence submission:
---
{{evidence}}
---

Evaluate this evidence across these dimensions:
{{qualityDimensions}}

Provide:
1. An overall assessment (Excellent / Good / Developing)
2. Specific feedback on what they did well
3. One suggestion for next time
4. An encouraging closing thought

Keep your response conversational and supportive. This is coaching, not grading.`,
    isActive: true,
    version: 1
  },
  {
    id: 'scaffolding_intro',
    promptType: 'scaffolding',
    repTypeId: null,
    milestoneId: null,
    template: `You're about to practice: {{repTypeLabel}}

{{repTypeDescription}}

Before you do this rep, let's prepare. I'll ask you a few questions to help you think through what you want to accomplish.`,
    isActive: true,
    version: 1
  },
  {
    id: 'debrief_prompt',
    promptType: 'debrief',
    repTypeId: null,
    milestoneId: null,
    template: `Now that you've captured your evidence, let's debrief.

Looking at what you shared:
{{evidenceSummary}}

A few reflection questions:
1. What went well in this rep?
2. What would you do differently next time?
3. What did you learn about yourself?

Take a moment to reflect before moving on.`,
    isActive: true,
    version: 1
  }
];

// Milestone definitions (for reference - these already exist in daily_plan_v1)
const MILESTONES = [
  {
    id: 'foundation_1',
    phase: 'foundation',
    milestoneNumber: 1,
    label: 'Reinforcing',
    description: 'Core leadership fundamentals and self-awareness',
    theme: 'reinforcing',
    icon: 'Target',
    requiredRepCount: 4,
    sortOrder: 1,
    isActive: true
  },
  {
    id: 'foundation_2',
    phase: 'foundation',
    milestoneNumber: 2,
    label: 'Follow Through',
    description: 'Building accountability and vulnerability',
    theme: 'follow_through',
    icon: 'CheckCircle',
    requiredRepCount: 4,
    sortOrder: 2,
    isActive: true
  },
  {
    id: 'foundation_3',
    phase: 'foundation',
    milestoneNumber: 3,
    label: 'One-on-One',
    description: 'Direct feedback and closing loops',
    theme: 'one_on_one',
    icon: 'MessageSquare',
    requiredRepCount: 4,
    sortOrder: 3,
    isActive: true
  },
  {
    id: 'foundation_4',
    phase: 'foundation',
    milestoneNumber: 4,
    label: 'Redirecting',
    description: 'Handling resistance and holding accountability',
    theme: 'redirecting',
    icon: 'Shield',
    requiredRepCount: 4,
    sortOrder: 4,
    isActive: true
  },
  {
    id: 'foundation_5',
    phase: 'foundation',
    milestoneNumber: 5,
    label: 'Readiness',
    description: 'Curiosity, coaching mindset, and readiness for Ascent',
    theme: 'readiness',
    icon: 'Compass',
    requiredRepCount: 4,
    sortOrder: 5,
    isActive: true
  }
];

// ============================================
// MIGRATION FUNCTIONS
// ============================================

async function migrateCategories() {
  console.log('\n📁 Migrating Categories...');
  const batch = db.batch();
  let count = 0;
  
  for (const category of CATEGORIES) {
    const docRef = db.collection('conditioning_categories').doc(category.id);
    const data = {
      ...category,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (isDryRun) {
      console.log(`   Would create: conditioning_categories/${category.id}`);
    } else {
      batch.set(docRef, data);
    }
    count++;
  }
  
  if (!isDryRun) {
    await batch.commit();
  }
  console.log(`   ✓ ${count} categories ${isDryRun ? 'would be' : ''} migrated`);
  return count;
}

async function migrateRepTypes() {
  console.log('\n📋 Migrating Rep Types...');
  const batch = db.batch();
  let count = 0;
  
  for (const repType of REP_TYPES) {
    const docRef = db.collection('conditioning_rep_types').doc(repType.id);
    const data = {
      ...repType,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (isDryRun) {
      console.log(`   Would create: conditioning_rep_types/${repType.id}`);
    } else {
      batch.set(docRef, data);
    }
    count++;
  }
  
  if (!isDryRun) {
    await batch.commit();
  }
  console.log(`   ✓ ${count} rep types ${isDryRun ? 'would be' : ''} migrated`);
  return count;
}

async function migrateQualityDimensions() {
  console.log('\n📊 Migrating Quality Dimensions...');
  const batch = db.batch();
  let count = 0;
  
  for (const dimension of QUALITY_DIMENSIONS) {
    const docRef = db.collection('conditioning_quality_dimensions').doc(dimension.id);
    const data = {
      ...dimension,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (isDryRun) {
      console.log(`   Would create: conditioning_quality_dimensions/${dimension.id}`);
    } else {
      batch.set(docRef, data);
    }
    count++;
  }
  
  if (!isDryRun) {
    await batch.commit();
  }
  console.log(`   ✓ ${count} quality dimensions ${isDryRun ? 'would be' : ''} migrated`);
  return count;
}

async function migrateCoachPrompts() {
  console.log('\n💬 Migrating Coach Prompts...');
  const batch = db.batch();
  let count = 0;
  
  for (const prompt of COACH_PROMPTS) {
    const docRef = db.collection('conditioning_coach_prompts').doc(prompt.id);
    const data = {
      ...prompt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (isDryRun) {
      console.log(`   Would create: conditioning_coach_prompts/${prompt.id}`);
    } else {
      batch.set(docRef, data);
    }
    count++;
  }
  
  if (!isDryRun) {
    await batch.commit();
  }
  console.log(`   ✓ ${count} coach prompts ${isDryRun ? 'would be' : ''} migrated`);
  return count;
}

async function migrateMilestones() {
  console.log('\n🎯 Migrating Milestones (reference collection)...');
  const batch = db.batch();
  let count = 0;
  
  for (const milestone of MILESTONES) {
    const docRef = db.collection('conditioning_milestones').doc(milestone.id);
    const data = {
      ...milestone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (isDryRun) {
      console.log(`   Would create: conditioning_milestones/${milestone.id}`);
    } else {
      batch.set(docRef, data);
    }
    count++;
  }
  
  if (!isDryRun) {
    await batch.commit();
  }
  console.log(`   ✓ ${count} milestones ${isDryRun ? 'would be' : ''} migrated`);
  return count;
}

// ============================================
// MAIN
// ============================================

async function main() {
  try {
    console.log('Starting migration...\n');
    
    const results = {
      categories: await migrateCategories(),
      repTypes: await migrateRepTypes(),
      qualityDimensions: await migrateQualityDimensions(),
      coachPrompts: await migrateCoachPrompts(),
      milestones: await migrateMilestones()
    };
    
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Migration Complete!                                         ║
╠══════════════════════════════════════════════════════════════╣
║  Categories:         ${String(results.categories).padStart(3)} documents                        ║
║  Rep Types:          ${String(results.repTypes).padStart(3)} documents                        ║
║  Quality Dimensions: ${String(results.qualityDimensions).padStart(3)} documents                        ║
║  Coach Prompts:      ${String(results.coachPrompts).padStart(3)} documents                        ║
║  Milestones:         ${String(results.milestones).padStart(3)} documents                        ║
╠══════════════════════════════════════════════════════════════╣
║  Mode: ${(isDryRun ? 'DRY RUN - No changes made' : 'LIVE - Data written').padEnd(52)}║
╚══════════════════════════════════════════════════════════════╝
`);

    if (!isDryRun) {
      console.log('Next steps:');
      console.log('1. Verify data in Firebase Console');
      console.log('2. Update repTypeService.js to read from Firestore');
      console.log('3. Update components to use new hooks');
      console.log('4. Build and test locally');
      console.log('5. Deploy to dev for testing');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
