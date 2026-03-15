const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');
try { admin.app().delete(); } catch (e) {}
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  // Find user by email
  const users = await db.collection('users').get();
  let userId = null;
  users.forEach(doc => {
    if ((doc.data().email || '').toLowerCase() === 'rob@capxpartners.com') {
      userId = doc.id;
    }
  });
  
  if (!userId) {
    console.log('User not found');
    process.exit(1);
  }
  
  console.log('Found user:', userId);
  
  // Clear carried over prep data so fresh items load with new metadata
  const carryOverRef = db.doc('users/' + userId + '/action_progress/_carried_over_prep');
  await carryOverRef.delete();
  console.log('Cleared _carried_over_prep - refresh page to see new metadata');
  
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
