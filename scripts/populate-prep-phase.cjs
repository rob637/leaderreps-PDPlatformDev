/**
 * Populate Prep Phase Data (Days 1-14)
 * 
 * PROGRESS-BASED MODEL:
 * - All actions are available from Day 1
 * - Users can complete ALL tasks in a single sitting if they choose
 * - Required items must be completed before Session One
 * - Optional items can be done anytime
 * 
 * REQUIRED ITEMS (5 total):
 * 1. Complete Leader Profile
 * 2. Complete Baseline Assessment
 * 3. Watch Foundation S1 Prep Video
 * 4. Download Foundation Workbook
 * 5. Complete Session 1 Prep Exercises
 * 
 * Run: node scripts/populate-prep-phase.cjs
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', 'leaderreps-pd-platform-firebase-adminsdk.json'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// All Prep Phase Actions - PROGRESS-BASED (not day-based)
// These are all available from Day 1 and can be completed in any order
const PREP_ACTIONS = [
  // REQUIRED ITEMS (5) - Must complete before Session One
  {
    id: 'action-prep-leader-profile',
    label: 'Complete Your Leader Profile',
    type: 'onboarding',
    description: 'Tell us about yourself to personalize your journey',
    required: true,
    optional: false,
    estimatedMinutes: 3,
    priority: 1,
    enabled: true
  },
  {
    id: 'action-prep-baseline-assessment',
    label: 'Complete Baseline Assessment',
    type: 'onboarding',
    description: 'Assess your current leadership skills',
    required: true,
    optional: false,
    estimatedMinutes: 5,
    priority: 2,
    enabled: true
  },
  {
    id: 'action-prep-001-video',
    label: 'Watch Foundation S1 Prep Video',
    type: 'content',
    resourceId: 'xi2YwVB6yhOSscH9Fuv9', // Session 1 Pre Work Video
    resourceType: 'video',
    resourceTitle: 'Session 1 Pre Work Video',
    description: 'Watch the preparation video for Session 1',
    required: true,
    optional: false,
    estimatedMinutes: 15,
    priority: 3,
    enabled: true
  },
  {
    id: 'action-prep-001-workbook',
    label: 'Download Foundation Workbook',
    type: 'content',
    resourceId: 'gjpKESqxHiqteFneAczq', // Foundation Workbook PDF
    resourceType: 'document',
    resourceTitle: 'Foundation Workbook',
    description: 'Download your workbook for the program',
    required: true,
    optional: false,
    estimatedMinutes: 2,
    priority: 4,
    enabled: true
  },
  {
    id: 'action-prep-003-exercises',
    label: 'Complete Session 1 Prep Exercises',
    type: 'weekly_action',
    description: 'Complete the pre-session exercises in your workbook',
    required: true,
    optional: false,
    estimatedMinutes: 20,
    priority: 5,
    enabled: true
  },
  
  // OPTIONAL ITEMS - Can be done anytime, not required for progress
  {
    id: 'action-prep-005-review',
    label: 'Review Your Assessment Results',
    type: 'task',
    description: 'Take time to reflect on your assessment feedback',
    required: false,
    optional: true,
    estimatedMinutes: 10,
    priority: 10,
    enabled: true
  },
  {
    id: 'action-prep-008-mindset',
    label: 'Watch Leadership Mindset Video',
    type: 'content',
    description: 'Optional bonus content on leadership mindset',
    required: false,
    optional: true,
    estimatedMinutes: 12,
    priority: 11,
    enabled: true
  },
  {
    id: 'action-prep-010-goals',
    label: 'Refine Your Learning Goals',
    type: 'task',
    description: 'Optional exercise to clarify your development goals',
    required: false,
    optional: true,
    estimatedMinutes: 10,
    priority: 12,
    enabled: true
  }
];

// Day configurations - primarily for content messaging (not for gating)
const PREP_PHASE_DAYS = [
  {
    dayNumber: 1,
    id: 'day-001',
    title: 'Welcome to Foundation',
    description: 'Your leadership journey begins! Complete these foundational tasks.',
    // ALL actions available from Day 1 in progress-based model
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'LeaderProfileWidget', 'BaselineAssessmentWidget', 'TodaysActionsWidget']
  },
  {
    dayNumber: 2,
    id: 'day-002',
    title: 'Build Your Foundation',
    description: 'Continue building your leadership foundation.',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 3,
    id: 'day-003',
    title: 'Prepare for Session 1',
    description: 'Work through your prep exercises.',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 4,
    id: 'day-004',
    title: 'Continue Preparation',
    description: 'Keep working through your preparation materials.',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 5,
    id: 'day-005',
    title: 'Midweek Check-in',
    description: 'Review your progress and continue preparation.',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 6,
    id: 'day-006',
    title: 'Weekend Prep',
    description: 'Use the weekend to catch up on any remaining prep work.',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 7,
    id: 'day-007',
    title: 'Week 1 Complete',
    description: 'Great progress! One week of prep down.',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 8,
    id: 'day-008',
    title: 'Week 2 Begins',
    description: 'Final week of preparation before your cohort starts.',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 9,
    id: 'day-009',
    title: 'Deepen Your Foundation',
    description: 'Continue building your leadership knowledge.',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 10,
    id: 'day-010',
    title: 'Almost There',
    description: 'Just 4 days until your journey officially begins!',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 11,
    id: 'day-011',
    title: 'Final Prep - Day 3',
    description: 'The countdown is on! 3 days to go.',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 12,
    id: 'day-012',
    title: 'Final Prep - Day 2',
    description: 'Just 2 days away! Make sure everything is complete.',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 13,
    id: 'day-013',
    title: 'Final Prep - Day 1',
    description: 'Tomorrow is the big day! Final preparations.',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 14,
    id: 'day-014',
    title: 'Launch Day Eve',
    description: 'Your leadership transformation begins tomorrow!',
    actions: PREP_ACTIONS,
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  }
];

async function populatePrepPhase() {
  console.log('🚀 Populating Prep Phase Data (PROGRESS-BASED MODEL)...\n');
  
  const batch = db.batch();
  
  for (const day of PREP_PHASE_DAYS) {
    const docRef = db.collection('daily_plan_v1').doc(day.id);
    
    // Add metadata
    const dayData = {
      ...day,
      phase: 'pre-start',
      phaseName: 'Prep Phase',
      progressBased: true, // Flag to indicate progress-based (not login-based)
      cumulativeActions: true, // All actions available throughout
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    batch.set(docRef, dayData, { merge: true });
    console.log(`  ✓ Day ${day.dayNumber}: ${day.title}`);
  }
  
  await batch.commit();
  
  console.log('\n✅ Prep Phase data populated successfully!');
  console.log('\nPROGRESS-BASED MODEL:');
  console.log('  - ALL actions available from Day 1');
  console.log('  - Users can complete everything in one sitting');
  console.log('  - Required items must be done before Session One');
  console.log('  - Optional items can be done anytime');
  
  // Summary
  const requiredActions = PREP_ACTIONS.filter(a => a.required);
  const optionalActions = PREP_ACTIONS.filter(a => a.optional);
  const totalTime = PREP_ACTIONS.reduce((sum, a) => sum + (a.estimatedMinutes || 0), 0);
  
  console.log(`\n📊 Summary:`);
  console.log(`  - Required items: ${requiredActions.length}`);
  console.log(`  - Optional items: ${optionalActions.length}`);
  console.log(`  - Est. total time: ${totalTime} minutes`);
  
  console.log(`\n📋 Required Items:`);
  requiredActions.forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.label} (~${a.estimatedMinutes} min)`);
  });
}

populatePrepPhase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
