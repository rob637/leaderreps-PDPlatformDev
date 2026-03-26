#!/usr/bin/env node
/**
 * Migration: Add cohortAccess field to existing coaching sessions
 * 
 * This script updates all existing coaching_sessions documents to have:
 * - cohortAccess: 'all' (available to all active cohorts)
 * - cohortIds: [] (empty array, not restricting to specific cohorts)
 * 
 * Usage:
 *   node scripts/migrations/add-cohort-access-to-sessions.cjs [--env=dev|test|prod] [--dry-run]
 * 
 * Options:
 *   --env=dev|test|prod   Target environment (default: dev)
 *   --dry-run             Preview changes without writing to Firestore
 */

const admin = require('firebase-admin');

// Parse command line args
const args = process.argv.slice(2);
const env = args.find(a => a.startsWith('--env='))?.split('=')[1] || 'dev';
const dryRun = args.includes('--dry-run');

// Initialize Firebase Admin based on environment
const serviceAccountPaths = {
  dev: '../leaderreps-pd-platform-firebase-adminsdk.json',
  test: '../leaderreps-test-firebase-adminsdk.json',
  prod: '../leaderreps-prod-firebase-adminsdk.json'
};

const serviceAccountPath = serviceAccountPaths[env];
if (!serviceAccountPath) {
  console.error(`Unknown environment: ${env}. Use dev, test, or prod.`);
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (e) {
  console.error(`Failed to load service account for ${env}:`, e.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateCoachingSessions() {
  console.log(`\n🔄 Migrating coaching sessions to add cohortAccess field`);
  console.log(`   Environment: ${env.toUpperCase()}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log('');
  
  const sessionsRef = db.collection('coaching_sessions');
  const snapshot = await sessionsRef.get();
  
  console.log(`Found ${snapshot.docs.length} coaching sessions`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Skip if already has cohortAccess
    if (data.cohortAccess) {
      console.log(`   ⏭️  ${doc.id} - already has cohortAccess: ${data.cohortAccess}`);
      skipped++;
      continue;
    }
    
    // Update with cohortAccess = 'all'
    const update = {
      cohortAccess: 'all',
      cohortIds: []
    };
    
    try {
      if (dryRun) {
        console.log(`   ✅ ${doc.id} - would set cohortAccess: 'all' (dry run)`);
      } else {
        await sessionsRef.doc(doc.id).update(update);
        console.log(`   ✅ ${doc.id} - set cohortAccess: 'all'`);
      }
      updated++;
    } catch (err) {
      console.error(`   ❌ ${doc.id} - error:`, err.message);
      errors++;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped (already had cohortAccess): ${skipped}`);
  console.log(`   Errors: ${errors}`);
  
  if (dryRun) {
    console.log('\n⚠️  This was a dry run. No changes were made.');
    console.log('   Run without --dry-run to apply changes.');
  }
}

migrateCoachingSessions()
  .then(() => {
    console.log('\n✅ Migration complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  });
