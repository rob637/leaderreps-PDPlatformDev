const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-test',
});

const db = admin.firestore();

async function run() {
  // Get all coaching sessions
  const sessionsSnap = await db.collection('coaching_sessions').get();
  console.log(`\n=== Coaching Sessions in TEST (${sessionsSnap.size} total) ===\n`);
  
  for (const doc of sessionsSnap.docs) {
    const data = doc.data();
    console.log(`Session: ${doc.id}`);
    console.log(`  Title: ${data.title}`);
    console.log(`  Type: ${data.sessionType}`);
    console.log(`  Date: ${data.date}`);
    console.log(`  Time: ${data.time}`);
    console.log(`  maxAttendees: ${data.maxAttendees}`);
    console.log(`  registrationCount: ${data.registrationCount}`);
    console.log(`  currentAttendees: ${data.currentAttendees}`);
    console.log(`  spotsLeft: ${data.spotsLeft}`);
    console.log('');
  }
  
  // Get registrations
  const regsSnap = await db.collection('coaching_registrations').get();
  console.log(`\n=== Coaching Registrations (${regsSnap.size} total) ===\n`);
  
  for (const doc of regsSnap.docs) {
    const data = doc.data();
    if (data.status !== 'cancelled') {
      console.log(`Registration: ${doc.id}`);
      console.log(`  User: ${data.userName} (${data.userEmail})`);
      console.log(`  Session: ${data.sessionId}`);
      console.log(`  Status: ${data.status}`);
      console.log('');
    }
  }
  
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
