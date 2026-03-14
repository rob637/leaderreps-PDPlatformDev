const admin = require('firebase-admin');

// Initialize with prod credentials
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function check() {
  // Get recent registrations to find the one with Ryan
  const regs = await db.collection('coaching_registrations')
    .orderBy('registeredAt', 'desc')
    .limit(5)
    .get();
  
  console.log('Recent registrations:\n');
  for (const doc of regs.docs) {
    const data = doc.data();
    console.log(`ID: ${doc.id}`);
    console.log(`  Session: ${data.sessionTitle}`);
    console.log(`  Coach: ${data.coach}`);
    console.log(`  Coach Email: ${data.coachEmail || 'NOT SET'}`);
    console.log(`  User: ${data.userName} (${data.userEmail})`);
    console.log(`  Registered: ${data.registeredAt?.toDate?.() || data.registeredAt}`);
    console.log(`  Notification Sent: ${data.notificationSentAt ? 'YES' : 'NO'}`);
    console.log('');
  }

  // Also check the session itself
  if (regs.docs.length > 0) {
    const firstReg = regs.docs[0].data();
    if (firstReg.sessionId) {
      const session = await db.collection('coaching_sessions').doc(firstReg.sessionId).get();
      if (session.exists) {
        const sData = session.data();
        console.log('\nSession details:');
        console.log(`  Title: ${sData.title}`);
        console.log(`  Coach: ${sData.coach}`);
        console.log(`  Coach Email: ${sData.coachEmail || 'NOT SET'}`);
      }
    }
  }

  process.exit(0);
}

check().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
