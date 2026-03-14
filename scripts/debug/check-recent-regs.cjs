const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function check() {
  // Get recent registrations including cancelled ones
  const regs = await db.collection('coaching_registrations')
    .orderBy('registeredAt', 'desc')
    .limit(10)
    .get();
  
  console.log('Recent registrations (including cancelled):\n');
  for (const doc of regs.docs) {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  Status: ${data.status}`);
    console.log(`  Session: ${data.sessionTitle}`);
    console.log(`  User: ${data.userName}`);
    console.log(`  Coach Email: ${data.coachEmail || 'NOT SET'}`);
    console.log(`  Registered: ${data.registeredAt?.toDate?.() || 'N/A'}`);
    console.log(`  Cancelled: ${data.cancelledAt?.toDate?.() || 'N/A'}`);
    console.log(`  Cancel Reason: ${data.cancelReason || 'N/A'}`);
    console.log('');
  }
  process.exit(0);
}
check();
