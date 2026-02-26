const admin = require('firebase-admin');

const saPath = '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json';
const sa = require(saPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

async function main() {
  const db = admin.firestore();
  
  const users = ['rob+224l@sagecg.com', 'rob@sagecg.com'];
  
  for (const email of users) {
    const usersSnap = await db.collection('users').where('email', '==', email).get();
    
    for (const doc of usersSnap.docs) {
      const data = doc.data();
      console.log(`\n=== ${email} ===`);
      console.log('uid:', doc.id);
      console.log('displayName:', data.displayName);
      console.log('prepRequirementsComplete:', data.prepRequirementsComplete);
      console.log('dailyProgress keys:', Object.keys(data.dailyProgress || {}).join(', '));
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
