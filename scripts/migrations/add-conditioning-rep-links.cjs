#!/usr/bin/env node
/**
 * Migration: Add Conditioning Rep Links to Milestone Actions
 * 
 * Updates milestone-1 actions to link content items to conditioning reps:
 * - "S1 Real Rep: Clear Expectations" → links to 'set_clear_expectations' rep type
 * - "S1 Real Rep: Reinforcing Feedback" → links to 'deliver_reinforcing_feedback' rep type
 * - "S1 Real Rep: Clean Handoffs" → becomes TWO items, each linked to a parent rep
 * 
 * Usage:
 *   node scripts/migrations/add-conditioning-rep-links.cjs --env=dev
 *   node scripts/migrations/add-conditioning-rep-links.cjs --env=test
 *   node scripts/migrations/add-conditioning-rep-links.cjs --env=prod
 */

const admin = require('firebase-admin');

// Parse environment argument
const args = process.argv.slice(2);
const envArg = args.find(a => a.startsWith('--env='));
const env = envArg ? envArg.split('=')[1] : 'dev';

// Validate environment
if (!['dev', 'test', 'prod'].includes(env)) {
  console.error('Invalid environment. Use --env=dev, --env=test, or --env=prod');
  process.exit(1);
}

// Map environment to Firebase project and credentials
const envConfig = {
  dev: {
    projectId: 'leaderreps-pd-platform',
    credFile: 'leaderreps-pd-platform-firebase-adminsdk.json'
  },
  test: {
    projectId: 'leaderreps-test',
    credFile: 'leaderreps-test-firebase-adminsdk.json'
  },
  prod: {
    projectId: 'leaderreps-prod',
    credFile: 'leaderreps-prod-firebase-adminsdk.json'
  }
};

const config = envConfig[env];

// Initialize Firebase Admin
const serviceAccount = require(`../../${config.credFile}`);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: config.projectId
});

const db = admin.firestore();

// Define the new action structure
const NEW_MILESTONE_1_ACTIONS = [
  {
    id: 'action-s1-deliberate-practice',
    type: 'content',
    label: 'Session 1: Deliberate Practice',
    enabled: true,
    isCompleted: false,
    required: true
    // Regular content - no conditioning link
  },
  {
    id: 'action-s1-clear-expectations',
    type: 'conditioning-rep',
    label: 'S1 Real Rep: Clear Expectations',
    enabled: true,
    isCompleted: false,
    required: true,
    handlerType: 'conditioning-rep',
    repTypeId: 'set_clear_expectations',
    // Completes when user has a loop_closed rep of this type
    completesWhen: 'loop_closed'
  },
  {
    id: 'action-s1-clean-handoffs-expectations',
    type: 'conditioning-rep',
    label: 'S1 Real Rep: Clean Handoffs (for your Expectation)',
    enabled: true,
    isCompleted: false,
    required: true,
    handlerType: 'conditioning-rep',
    repTypeId: 'make_clean_handoff',
    // Only unlocks after Clear Expectations rep is loop_closed
    linkedToRepType: 'set_clear_expectations',
    completesWhen: 'loop_closed'
  },
  {
    id: 'action-s1-reinforcing-feedback',
    type: 'conditioning-rep',
    label: 'S1 Real Rep: Reinforcing Feedback',
    enabled: true,
    isCompleted: false,
    required: true,
    handlerType: 'conditioning-rep',
    repTypeId: 'deliver_reinforcing_feedback',
    completesWhen: 'loop_closed'
  },
  {
    id: 'action-s1-clean-handoffs-feedback',
    type: 'conditioning-rep',
    label: 'S1 Real Rep: Clean Handoffs (for your Feedback)',
    enabled: true,
    isCompleted: false,
    required: true,
    handlerType: 'conditioning-rep',
    repTypeId: 'make_clean_handoff',
    // Only unlocks after Reinforcing Feedback rep is loop_closed
    linkedToRepType: 'deliver_reinforcing_feedback',
    completesWhen: 'loop_closed'
  }
];

async function migrate() {
  console.log(`\n🔄 Migrating milestone-1 actions in ${env.toUpperCase()} environment...\n`);
  console.log(`   Project: ${config.projectId}`);
  console.log(`   Actions to set: ${NEW_MILESTONE_1_ACTIONS.length}`);
  
  try {
    // Get current milestone-1 doc
    const milestoneRef = db.collection('daily_plan_v1').doc('milestone-1');
    const milestoneSnap = await milestoneRef.get();
    
    if (!milestoneSnap.exists) {
      console.log('\n⚠️  milestone-1 document does not exist. Creating it...');
      await milestoneRef.set({
        id: 'milestone-1',
        milestone: 1,
        phase: 'foundation',
        title: 'Deliberate Practice',
        description: 'Learn and practice core leadership reps',
        actions: NEW_MILESTONE_1_ACTIONS,
        resources: [],
        coachingSessionTypes: ['one_on_one'],
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Created milestone-1 with new actions');
    } else {
      // Show current state
      const currentData = milestoneSnap.data();
      console.log('\n📋 Current milestone-1 actions:');
      (currentData.actions || []).forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.label} (${a.handlerType || a.type})`);
      });
      
      // Update with new actions
      console.log('\n📝 Updating to new actions:');
      NEW_MILESTONE_1_ACTIONS.forEach((a, i) => {
        const linkedInfo = a.linkedToRepType ? ` [linked to ${a.linkedToRepType}]` : '';
        const repInfo = a.repTypeId ? ` → ${a.repTypeId}` : '';
        console.log(`   ${i + 1}. ${a.label}${repInfo}${linkedInfo}`);
      });
      
      await milestoneRef.update({
        actions: NEW_MILESTONE_1_ACTIONS,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('\n✅ Updated milestone-1 actions successfully!');
    }
    
    // Also update LINKED_REPS info in metadata for reference
    console.log('\n📚 Note: LINKED_REPS config in repTaxonomy.js allows make_clean_handoff');
    console.log('   to unlock after completing set_clear_expectations OR deliver_reinforcing_feedback');
    console.log('   The linkedToRepType on each action specifies WHICH parent unlocks THAT specific item.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
  
  console.log('\n🎉 Migration complete!\n');
  process.exit(0);
}

// Run migration
migrate();
