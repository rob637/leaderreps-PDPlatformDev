const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function checkBookends() {
  // Check rob637's data (assuming that's you)
  const usersSnap = await db.collection('users').where('email', '==', 'rob637@me.com').get();
  
  if (usersSnap.empty) {
    console.log('User not found by email, checking all recent users...');
    const allUsers = await db.collection('users').limit(10).get();
    allUsers.docs.forEach(d => {
      console.log(`  ${d.id}: ${d.data().email || d.data().displayName}`);
    });
    process.exit(0);
  }
  
  const userId = usersSnap.docs[0].id;
  console.log('User ID:', userId);
  console.log('Email:', usersSnap.docs[0].data().email);
  
  // Check daily_practice module
  const dpSnap = await db.doc(`modules/${userId}/daily_practice/current`).get();
  
  if (!dpSnap.exists) {
    console.log('\n❌ daily_practice/current document does NOT exist!');
    process.exit(0);
  }
  
  const dpData = dpSnap.data();
  console.log('\n=== Daily Practice Document ===');
  console.log('Document exists:', dpSnap.exists);
  console.log('Fields present:', Object.keys(dpData));
  
  console.log('\n=== Morning Bookend ===');
  console.log('morningBookend:', JSON.stringify(dpData.morningBookend, null, 2));
  
  console.log('\n=== Evening Bookend ===');
  console.log('eveningBookend:', JSON.stringify(dpData.eveningBookend, null, 2));
  
  console.log('\n=== Other Key Fields ===');
  console.log('identityAnchor:', dpData.identityAnchor);
  console.log('habitAnchor:', dpData.habitAnchor);
  console.log('whyStatement:', dpData.whyStatement);
  
  process.exit(0);
}

checkBookends().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
