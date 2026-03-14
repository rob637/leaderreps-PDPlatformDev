#!/usr/bin/env node
/**
 * Fix Registration Counts
 * 
 * Syncs the denormalized registrationCount field on coaching_sessions
 * with the actual count of active registrations in coaching_registrations.
 * 
 * This fixes cases where registrationCount got out of sync due to:
 * - Failed increment operations
 * - Network issues during registration
 * - Manual data edits
 * 
 * Usage:
 *   node scripts/fixes/fix-session-registration-counts.cjs --env=dev
 *   node scripts/fixes/fix-session-registration-counts.cjs --env=test
 *   node scripts/fixes/fix-session-registration-counts.cjs --env=prod
 *   node scripts/fixes/fix-session-registration-counts.cjs --env=test --dry-run
 */

const admin = require('firebase-admin');

// Parse arguments
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

async function fixRegistrationCounts() {
  console.log(`\n🔄 Fixing registration counts in ${env.toUpperCase()} environment...\n`);
  console.log(`   Project: ${config.projectId}`);
  console.log(`   Dry Run: ${isDryRun ? 'YES (no changes will be made)' : 'NO'}\n`);

  // Get all sessions
  const sessionsSnap = await db.collection('coaching_sessions').get();
  console.log(`Found ${sessionsSnap.size} coaching sessions\n`);

  let fixedCount = 0;
  let correctCount = 0;
  let mismatches = [];

  for (const sessionDoc of sessionsSnap.docs) {
    const session = sessionDoc.data();
    const sessionId = sessionDoc.id;
    
    // Count actual active registrations
    const regsSnap = await db.collection('coaching_registrations')
      .where('sessionId', '==', sessionId)
      .where('status', '==', 'registered')
      .get();
    
    const actualCount = regsSnap.size;
    const storedCount = session.registrationCount ?? 0;
    
    if (actualCount !== storedCount) {
      mismatches.push({
        sessionId,
        title: session.title,
        date: session.date,
        time: session.time,
        storedCount,
        actualCount
      });
      
      console.log(`❌ Mismatch: ${sessionId}`);
      console.log(`   Title: ${session.title}`);
      console.log(`   Date: ${session.date} ${session.time}`);
      console.log(`   Stored: ${storedCount}, Actual: ${actualCount}`);
      
      if (!isDryRun) {
        await db.collection('coaching_sessions').doc(sessionId).update({
          registrationCount: actualCount
        });
        console.log(`   ✅ Fixed to ${actualCount}`);
      } else {
        console.log(`   [DRY RUN] Would fix to ${actualCount}`);
      }
      console.log('');
      fixedCount++;
    } else {
      correctCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Summary:');
  console.log(`   Total sessions: ${sessionsSnap.size}`);
  console.log(`   Already correct: ${correctCount}`);
  console.log(`   Mismatches found: ${fixedCount}`);
  if (!isDryRun) {
    console.log(`   Fixed: ${fixedCount}`);
  }
  
  if (mismatches.length > 0) {
    console.log('\nMismatched sessions:');
    mismatches.forEach(m => {
      console.log(`   - ${m.title} (${m.date} ${m.time}): ${m.storedCount} → ${m.actualCount}`);
    });
  }
  
  console.log('\n✅ Done!\n');
  process.exit(0);
}

fixRegistrationCounts().catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
