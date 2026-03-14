const admin = require('firebase-admin');

// Coach email mapping
const COACH_EMAILS = {
  'ryan': 'ryan@leaderreps.com',
  'cristina': 'cristina@leaderreps.com'
};

async function fixCoachEmails(projectId, credPath) {
  // Clear previous app if exists
  if (admin.apps.length) {
    await admin.app().delete();
  }
  
  const serviceAccount = require(credPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  const db = admin.firestore();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Fixing coach emails in: ${projectId}`);
  console.log('='.repeat(60));

  // Get all coaching sessions
  const sessions = await db.collection('coaching_sessions').get();
  console.log(`Found ${sessions.size} coaching sessions`);

  let updated = 0;
  let skipped = 0;

  for (const doc of sessions.docs) {
    const data = doc.data();
    const coach = (data.coach || '').toLowerCase().trim();
    
    // Find matching coach email
    let coachEmail = null;
    for (const [name, email] of Object.entries(COACH_EMAILS)) {
      if (coach.includes(name)) {
        coachEmail = email;
        break;
      }
    }

    if (coachEmail && data.coachEmail !== coachEmail) {
      console.log(`  Updating: ${doc.id}`);
      console.log(`    Coach: ${data.coach} -> Email: ${coachEmail}`);
      await doc.ref.update({ coachEmail });
      updated++;
    } else if (!coachEmail && !data.coachEmail) {
      console.log(`  Skipped (no match): ${doc.id} - Coach: "${data.coach}"`);
      skipped++;
    } else {
      // Already has correct email
    }
  }

  console.log(`\nUpdated: ${updated} sessions`);
  console.log(`Skipped: ${skipped} sessions (no coach match)`);
  
  return { updated, skipped };
}

async function main() {
  const environments = [
    { id: 'leaderreps-pd-platform', cred: '/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json' },
    { id: 'leaderreps-test', cred: '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json' },
    { id: 'leaderreps-prod', cred: '/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json' }
  ];

  for (const env of environments) {
    try {
      await fixCoachEmails(env.id, env.cred);
    } catch (err) {
      console.error(`Error in ${env.id}:`, err.message);
    }
  }

  console.log('\n✅ Done! Coaches will now receive email notifications.');
  process.exit(0);
}

main();
