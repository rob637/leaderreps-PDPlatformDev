/**
 * Fix: Sync coaching session registrationCount with actual registrations
 * 
 * This script:
 * 1. Counts active registrations for each session
 * 2. Updates the session's registrationCount to match
 * 
 * Usage: node scripts/fixes/fix-registration-counts.cjs [env]
 * Default env: dev
 */
const admin = require('firebase-admin');

const ENV_CONFIG = {
  dev: {
    serviceAccount: '/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json',
    projectId: 'leaderreps-pd-platform',
  },
  test: {
    serviceAccount: '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json',
    projectId: 'leaderreps-test',
  },
  prod: {
    serviceAccount: '/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json',
    projectId: 'leaderreps-prod',
  },
};

const env = process.argv[2] || 'dev';

if (!ENV_CONFIG[env]) {
  console.error(`Invalid env: ${env}. Use dev, test, or prod.`);
  process.exit(1);
}

const config = ENV_CONFIG[env];
const serviceAccount = require(config.serviceAccount);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: config.projectId,
});

const db = admin.firestore();

async function run() {
  console.log(`\n=== Fixing Registration Counts in ${env.toUpperCase()} ===\n`);

  // Get all active registrations (not cancelled/no_show)
  const regsSnap = await db.collection('coaching_registrations')
    .where('status', 'in', ['registered', 'attended', 'certified'])
    .get();

  // Count registrations per session
  const sessionCounts = {};
  for (const doc of regsSnap.docs) {
    const data = doc.data();
    const sessionId = data.sessionId;
    if (sessionId) {
      sessionCounts[sessionId] = (sessionCounts[sessionId] || 0) + 1;
    }
  }

  console.log(`Found ${Object.keys(sessionCounts).length} sessions with registrations\n`);

  // Get all sessions
  const sessionsSnap = await db.collection('coaching_sessions').get();

  let updated = 0;
  let alreadyCorrect = 0;
  let zeroedOut = 0;

  for (const sessionDoc of sessionsSnap.docs) {
    const sessionId = sessionDoc.id;
    const sessionData = sessionDoc.data();
    const currentCount = sessionData.registrationCount || 0;
    const actualCount = sessionCounts[sessionId] || 0;

    if (currentCount !== actualCount) {
      console.log(`Fixing ${sessionId}: ${currentCount} -> ${actualCount}`);
      await db.collection('coaching_sessions').doc(sessionId).update({
        registrationCount: actualCount
      });
      updated++;
      if (actualCount === 0) zeroedOut++;
    } else {
      alreadyCorrect++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total sessions: ${sessionsSnap.size}`);
  console.log(`Already correct: ${alreadyCorrect}`);
  console.log(`Updated: ${updated}`);
  console.log(`Set to 0 (no registrations): ${zeroedOut}`);

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
