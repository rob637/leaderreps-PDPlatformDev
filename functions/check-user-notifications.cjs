const admin = require('firebase-admin');

const saPath = '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json';
const sa = require(saPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

async function main() {
  const db = admin.firestore();
  // Find user by email (rob)
  const usersSnap = await db.collection('users').get();
  
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    if (data.email?.includes('rob') || data.displayName?.toLowerCase().includes('rob')) {
      console.log(`\n=== User: ${data.email || data.displayName} ===`);
      console.log('notificationSettings:', JSON.stringify(data.notificationSettings, null, 2));
      console.log('foundationCommitment:', JSON.stringify(data.foundationCommitment, null, 2));
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
