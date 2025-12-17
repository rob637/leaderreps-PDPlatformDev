/**
 * Populate Prep Phase Data (Days 1-14)
 * 
 * CUMULATIVE MODEL:
 * - Day 1 actions persist through Day 14
 * - Each subsequent day can ADD new actions that persist until end of Prep Phase
 * - Actions from early days accumulate with later days
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

// Prep Phase Content Structure
// Actions are introduced on specific days and persist through Day 14
const PREP_PHASE_DAYS = [
  {
    dayNumber: 1,
    id: 'day-001',
    title: 'Welcome & First Steps',
    description: 'Your leadership journey begins! Complete these foundational tasks.',
    actions: [
      {
        id: 'action-prep-001-video',
        label: 'Watch QS S1 Prep Video',
        type: 'content',
        resourceId: 'xi2YwVB6yhOSscH9Fuv9', // Session 1 Pre Work Video
        resourceType: 'video',
        resourceTitle: 'Session 1 Pre Work Video',
        required: true,
        enabled: true
      },
      {
        id: 'action-prep-001-workbook',
        label: 'Download QS Workbook',
        type: 'content',
        resourceId: 'gjpKESqxHiqteFneAczq', // QuickStart Workbook PDF
        resourceType: 'document',
        resourceTitle: 'QuickStart Workbook',
        required: true,
        enabled: true
      }
    ],
    widgets: ['PrepWelcomeBanner', 'LeaderProfileWidget', 'BaselineAssessmentWidget', 'TodaysActionsWidget']
  },
  {
    dayNumber: 2,
    id: 'day-002',
    title: 'Build Your Foundation',
    description: 'Continue building your leadership foundation.',
    actions: [
      // Day 2 adds profile completion if not done
      {
        id: 'action-prep-002-profile',
        label: 'Complete Leader Profile',
        type: 'weekly_action',
        required: true,
        enabled: true
      },
      {
        id: 'action-prep-002-assessment',
        label: 'Complete Baseline Assessment',
        type: 'weekly_action',
        required: true,
        enabled: true
      }
    ],
    widgets: ['PrepWelcomeBanner', 'LeaderProfileWidget', 'BaselineAssessmentWidget', 'TodaysActionsWidget']
  },
  {
    dayNumber: 3,
    id: 'day-003',
    title: 'Prepare for Session 1',
    description: 'Start working through your prep exercises.',
    actions: [
      {
        id: 'action-prep-003-exercises',
        label: 'Start Session 1 Prep Exercises',
        type: 'weekly_action',
        required: true,
        enabled: true
      }
    ],
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 4,
    id: 'day-004',
    title: 'Continue Preparation',
    description: 'Keep working through your preparation materials.',
    actions: [], // No new actions - carry forward from previous days
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 5,
    id: 'day-005',
    title: 'Midweek Check-in',
    description: 'Review your progress and continue preparation.',
    actions: [
      {
        id: 'action-prep-005-review',
        label: 'Review Your Assessment Results',
        type: 'task',
        required: false,
        enabled: true
      }
    ],
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 6,
    id: 'day-006',
    title: 'Weekend Prep',
    description: 'Use the weekend to catch up on any remaining prep work.',
    actions: [], // Carry forward
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 7,
    id: 'day-007',
    title: 'Week 1 Complete',
    description: 'Great progress! One week of prep down.',
    actions: [], // Carry forward
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 8,
    id: 'day-008',
    title: 'Week 2 Begins',
    description: 'Final week of preparation before your cohort starts.',
    actions: [
      {
        id: 'action-prep-008-mindset',
        label: 'Watch Leadership Mindset Video',
        type: 'content',
        required: false,
        enabled: true
      }
    ],
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 9,
    id: 'day-009',
    title: 'Deepen Your Foundation',
    description: 'Continue building your leadership knowledge.',
    actions: [], // Carry forward
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 10,
    id: 'day-010',
    title: 'Almost There',
    description: 'Just 4 days until your journey officially begins!',
    actions: [
      {
        id: 'action-prep-010-goals',
        label: 'Refine Your Learning Goals',
        type: 'task',
        required: false,
        enabled: true
      }
    ],
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 11,
    id: 'day-011',
    title: 'Final Prep - Day 3',
    description: 'The countdown is on! 3 days to go.',
    actions: [
      {
        id: 'action-prep-011-checklist',
        label: 'Complete Final Prep Checklist',
        type: 'weekly_action',
        required: true,
        enabled: true
      }
    ],
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 12,
    id: 'day-012',
    title: 'Final Prep - Day 2',
    description: 'Just 2 days away! Make sure everything is complete.',
    actions: [], // Carry forward - focus on completing outstanding items
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 13,
    id: 'day-013',
    title: 'Final Prep - Day 1',
    description: 'Tomorrow is the big day! Final preparations.',
    actions: [
      {
        id: 'action-prep-013-ready',
        label: 'Mark Yourself Ready to Start',
        type: 'milestone',
        required: true,
        enabled: true
      }
    ],
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  },
  {
    dayNumber: 14,
    id: 'day-014',
    title: 'Launch Day Eve',
    description: 'Your leadership transformation begins tomorrow!',
    actions: [], // All prep should be complete - celebrate readiness
    widgets: ['PrepWelcomeBanner', 'TodaysActionsWidget']
  }
];

async function populatePrepPhase() {
  console.log('🚀 Populating Prep Phase Data (Days 1-14)...\n');
  
  const batch = db.batch();
  
  for (const day of PREP_PHASE_DAYS) {
    const docRef = db.collection('daily_plan_v1').doc(day.id);
    
    // Add metadata
    const dayData = {
      ...day,
      phase: 'pre-start',
      phaseName: 'Prep Phase',
      cumulativeActions: true, // Flag to indicate actions accumulate
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    batch.set(docRef, dayData, { merge: true });
    console.log(`  ✓ Day ${day.dayNumber}: ${day.title} (${day.actions.length} new actions)`);
  }
  
  await batch.commit();
  
  console.log('\n✅ Prep Phase data populated successfully!');
  console.log('\nCUMULATIVE MODEL:');
  console.log('  - Day 1 actions persist through Day 14');
  console.log('  - Each day\'s new actions are added to the cumulative list');
  console.log('  - Users see all actions from Day 1 to current day');
  
  // Summary
  let totalActions = 0;
  PREP_PHASE_DAYS.forEach(d => totalActions += d.actions.length);
  console.log(`\n📊 Total unique actions across Prep Phase: ${totalActions}`);
}

populatePrepPhase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
