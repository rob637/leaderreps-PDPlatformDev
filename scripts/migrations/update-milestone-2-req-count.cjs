#!/usr/bin/env node
/**
 * Migration: Update Milestone 2 Required Rep Count
 * 
 * Updates conditioning_milestones/foundation_2 to reduce requiredRepCount from 4 to 3.
 * 
 * This reflects the change from:
 *   - Lead with Vulnerability: 2 reps → 1 rep
 *   - Follow-up on Work: 2 reps (unchanged)
 *   - Total: 4 → 3
 * 
 * Lead with Vulnerability now behaves like Clear Expectations in Milestone 1
 * (single rep required, 20 min instead of 40 min).
 * 
 * Usage:
 *   node scripts/migrations/update-milestone-2-req-count.cjs --env=dev
 *   node scripts/migrations/update-milestone-2-req-count.cjs --env=test
 *   node scripts/migrations/update-milestone-2-req-count.cjs --env=prod
 *   node scripts/migrations/update-milestone-2-req-count.cjs --env=dev --dry-run
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

async function migrate() {
  console.log(`\n🔄 Updating Milestone 2 required rep count in ${env.toUpperCase()} environment...\n`);
  console.log(`   Project: ${config.projectId}`);
  console.log(`   Dry Run: ${isDryRun ? 'YES (no changes will be made)' : 'NO'}`);
  
  const milestoneRef = db.collection('conditioning_milestones').doc('foundation_2');
  const milestoneDoc = await milestoneRef.get();
  
  if (!milestoneDoc.exists) {
    console.log('\n⚠️  conditioning_milestones/foundation_2 document does not exist.');
    console.log('   Run migrate-rep-taxonomy-to-firestore.cjs first to create it.');
    process.exit(1);
  }
  
  const currentData = milestoneDoc.data();
  console.log('\n📊 Current Milestone 2 Configuration:');
  console.log(`   Label: ${currentData.label}`);
  console.log(`   Required Rep Count: ${currentData.requiredRepCount}`);
  console.log(`   Description: ${currentData.description}`);
  
  if (currentData.requiredRepCount === 3) {
    console.log('\n✅ Already updated to 3 - no changes needed.');
    process.exit(0);
  }
  
  if (currentData.requiredRepCount !== 4) {
    console.log(`\n⚠️  Unexpected requiredRepCount value: ${currentData.requiredRepCount}`);
    console.log('   Expected 4 (old value) to update to 3 (new value).');
    console.log('   Proceeding with caution...');
  }
  
  console.log('\n📝 Updating requiredRepCount from 4 to 3...');
  console.log('   (Lead with Vulnerability: 2 → 1 rep, Follow-up on Work: 2 reps unchanged)');
  
  if (!isDryRun) {
    await milestoneRef.update({
      requiredRepCount: 3,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('\n✅ Updated conditioning_milestones/foundation_2 successfully!');
  } else {
    console.log('\n   [DRY RUN] Would update requiredRepCount to 3');
  }
  
  // Verify the update
  if (!isDryRun) {
    const updatedDoc = await milestoneRef.get();
    const updatedData = updatedDoc.data();
    console.log('\n📊 Updated Milestone 2 Configuration:');
    console.log(`   Required Rep Count: ${updatedData.requiredRepCount}`);
  }
  
  console.log('\n✅ Migration complete!');
  console.log('\nSummary:');
  console.log('   - Lead with Vulnerability now requires 1 rep (was 2)');
  console.log('   - Follow-up on Work still requires 2 reps');
  console.log('   - Total milestone required reps: 3 (was 4)');
  console.log('   - Duration shown: 20 min (was 40 min)');
  
  process.exit(0);
}

migrate().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
