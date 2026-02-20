const admin = require('firebase-admin');
admin.initializeApp({ projectId: 'leaderreps-test' });
const db = admin.firestore();

async function main() {
  // Get all users with gmail settings
  const usersSnap = await db.collection('users').get();
  console.log(`\nChecking ${usersSnap.size} users for Gmail connections...\n`);
  
  for (const userDoc of usersSnap.docs) {
    const gmailSnap = await db.collection('users').doc(userDoc.id).collection('settings').doc('gmail').get();
    if (gmailSnap.exists) {
      const data = gmailSnap.data();
      console.log(`✓ ${data.email || 'Unknown'}`);
      console.log(`  User ID: ${userDoc.id}`);
      console.log(`  Connected: ${data.connectedAt}`);
      console.log(`  Has refresh token: ${!!data.refreshToken}`);
      console.log('');
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
