#!/usr/bin/env node
/**
 * Migration: Fix Milestone 2 Rep Links
 * 
 * Updates milestone-2 actions to properly link to conditioning reps:
 * - "S2 Real Rep: Lead with Vulnerability" → links to 'lead_with_vulnerability' rep type
 * - "S2 Real Rep: Follow-up on Work" → links to 'follow_up_work' rep type
 * 
 * These were incorrectly configured as type: "content" instead of conditioning-rep.
 * 
 * Milestone 2 Configuration:
 * - requiredRepCount: 3 (from conditioning_milestones)
 * - 2 rep types available (follow_up_work, lead_with_vulnerability)
 * - lead_with_vulnerability requires 1 rep, follow_up_work requires 2 reps
 * - ONE header card per rep type (progress tracked internally as "X of Y")
 * - Same pattern as Milestone 1
 * 
 * Usage:
 *   node scripts/migrations/fix-milestone-2-rep-links.cjs --env=dev
 *   node scripts/migrations/fix-milestone-2-rep-links.cjs --env=test
 *   node scripts/migrations/fix-milestone-2-rep-links.cjs --env=prod
 */

const admin = require('firebase-admin');

// Parse environment argument
const args = process.argv.slice(2);
const envArg = args.find(a => a.startsWith('--env='));
const dryRunArg = args.find(a => a === '--dry-run');
const env = envArg ? envArg.split('=')[1] : 'dev';
const isDryRun = !!dryRunArg;

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

// Define the corrected milestone-2 actions structure
// IMPORTANT: Only Real Reps go here. Session prep content (guides, videos) belongs in session2-config
// The system tracks progress (1 of 2, 2 of 2) internally based on completed reps
const CORRECTED_MILESTONE_2_ACTIONS = [
  // Real Rep 1: Lead with Vulnerability (one header, tracks "X of Y" internally)
  {
    id: 'action-s2-lead-with-vulnerability',
    type: 'conditioning-rep',
    label: 'S2 Real Rep: Lead with Vulnerability',
    enabled: true,
    isCompleted: false,
    required: true,
    handlerType: 'conditioning-rep',
    repTypeId: 'lead_with_vulnerability',
    completesWhen: 'loop_closed'
  },
  // Real Rep 2: Follow-up on Work (one header, tracks "X of Y" internally)
  {
    id: 'action-s2-follow-up-work',
    type: 'conditioning-rep',
    label: 'S2 Real Rep: Follow-up on Work',
    enabled: true,
    isCompleted: false,
    required: true,
    handlerType: 'conditioning-rep',
    repTypeId: 'follow_up_work',
    completesWhen: 'loop_closed'
  }
];

async function migrate() {
  console.log(`\n🔄 Fixing milestone-2 rep links in ${env.toUpperCase()} environment...\n`);
  console.log(`   Project: ${config.projectId}`);
  console.log(`   Dry Run: ${isDryRun ? 'YES (no changes will be made)' : 'NO'}`);
  
  const milestoneRef = db.collection('daily_plan_v1').doc('milestone-2');
  const milestoneDoc = await milestoneRef.get();
  
  if (!milestoneDoc.exists) {
    console.log('\n⚠️  milestone-2 document does not exist. Creating it...');
    
    if (!isDryRun) {
      await milestoneRef.set({
        id: 'milestone-2',
        label: 'Milestone 2: Follow Through',
        description: 'Building accountability and vulnerability',
        actions: CORRECTED_MILESTONE_2_ACTIONS,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Created milestone-2 with new actions');
    } else {
      console.log('   [DRY RUN] Would create milestone-2 with corrected actions');
    }
  } else {
    const currentData = milestoneDoc.data();
    const currentActions = currentData.actions || [];
    
    console.log('\n📋 Current milestone-2 actions:');
    currentActions.forEach((action, index) => {
      const repInfo = action.handlerType === 'conditioning-rep' 
        ? ` → repTypeId: ${action.repTypeId}` 
        : '';
      console.log(`   ${index + 1}. [${action.type}] ${action.label}${repInfo}`);
    });
    
    console.log('\n📋 Corrected milestone-2 actions:');
    CORRECTED_MILESTONE_2_ACTIONS.forEach((action, index) => {
      const repInfo = action.handlerType === 'conditioning-rep' 
        ? ` → repTypeId: ${action.repTypeId}` 
        : '';
      console.log(`   ${index + 1}. [${action.type}] ${action.label}${repInfo}`);
    });
    
    if (!isDryRun) {
      await milestoneRef.update({
        actions: CORRECTED_MILESTONE_2_ACTIONS,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('\n✅ Updated milestone-2 actions successfully!');
    } else {
      console.log('\n   [DRY RUN] Would update milestone-2 with corrected actions');
    }
  }
  
  // Verify the Milestone 2 configuration in conditioning_milestones
  const milestoneConfigRef = db.collection('conditioning_milestones').doc('foundation_2');
  const milestoneConfigDoc = await milestoneConfigRef.get();
  
  if (milestoneConfigDoc.exists) {
    const configData = milestoneConfigDoc.data();
    console.log('\n📊 Milestone 2 Configuration (conditioning_milestones/foundation_2):');
    console.log(`   Label: ${configData.label}`);
    console.log(`   Required Rep Count: ${configData.requiredRepCount}`);
    console.log(`   Phase: ${configData.phase}`);
  } else {
    console.log('\n⚠️  conditioning_milestones/foundation_2 document not found');
    console.log('   This document should define requiredRepCount for milestone completion tracking');
  }
  
  console.log('\n✅ Migration complete!');
  console.log('\nSummary:');
  console.log('   - 2 conditioning-rep headers now linked to rep types');
  console.log('   - Progress tracked internally (1 of 2, 2 of 2, etc.)');
  console.log('   - Clicking reps in dashboard will navigate to Conditioning screen');
  console.log('   - Rep completions will be tracked against milestone progress');
  console.log('   - requiredRepCount: 3 for Milestone 2 (1 Lead with Vulnerability + 2 Follow-up on Work)');
  
  process.exit(0);
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
