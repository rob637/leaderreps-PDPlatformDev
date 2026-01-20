const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function checkRecentUsers() {
  console.log('=== All Users with signup dates ===');
  
  const usersSnap = await db.collection('users').get();
  console.log('Total users:', usersSnap.size);
  
  // Sort by createdAt if it exists
  const users = usersSnap.docs.map(doc => {
    const data = doc.data();
    let createdStr = 'unknown';
    if (data.createdAt) {
      if (data.createdAt.toDate) {
        createdStr = data.createdAt.toDate().toISOString();
      } else if (data.createdAt._seconds) {
        createdStr = new Date(data.createdAt._seconds * 1000).toISOString();
      } else {
        createdStr = String(data.createdAt);
      }
    }
    return { email: data.email || doc.id, created: createdStr, role: data.role };
  }).sort((a, b) => b.created.localeCompare(a.created));
  
  console.log('\nMost recent 10:');
  users.slice(0, 10).forEach((u, i) => {
    console.log(`[${i+1}] ${u.email} - ${u.created} - ${u.role || 'user'}`);
  });
}

checkRecentUsers().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
