const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'leaderreps-prod'
  });
}

const db = admin.firestore();

async function check() {
  // Check Rob and Ryan's state subcollections in detail
  const emails = ['rob@sagecg.com', 'ryan@leaderreps.com'];
  
  for (const email of emails) {
    const usersSnap = await db.collection('users').where('email', '==', email).get();
    if (usersSnap.empty) continue;
    
    const userId = usersSnap.docs[0].id;
    console.log('='.repeat(60));
    console.log(email, '- UserID:', userId);
    
    // List ALL subcollections
    const collections = await db.collection('users').doc(userId).listCollections();
    console.log('\nSubcollections:');
    for (const coll of collections) {
      const docs = await coll.get();
      console.log(`  ${coll.id}: ${docs.size} docs`);
      
      // Show first few docs in each collection
      if (docs.size > 0 && docs.size <= 5) {
        docs.forEach(d => {
          console.log(`    - ${d.id}`);
        });
      }
    }
    
    // Check state/userState specifically
    const stateSnap = await db.collection('users').doc(userId).collection('state').doc('userState').get();
    if (stateSnap.exists) {
      console.log('\nuserState contents:');
      const data = stateSnap.data();
      console.log('  Fields:', Object.keys(data));
      console.log('  dailyProgress:', JSON.stringify(data.dailyProgress || {}).substring(0, 200));
      console.log('  actionProgress count:', Object.keys(data.actionProgress || {}).length);
      console.log('  sessionAttendance:', JSON.stringify(data.sessionAttendance || {}));
    } else {
      console.log('\n  ❌ NO userState document exists!');
    }
    
    // Check modules subcollection
    const modulesSnap = await db.collection('users').doc(userId).collection('modules').get();
    console.log('\nModules:');
    modulesSnap.forEach(d => {
      const data = d.data();
      console.log(`  ${d.id}:`);
      if (d.id === 'development_plan') {
        console.log('    currentPlan:', data.currentPlan ? 'EXISTS' : 'NONE');
        console.log('    dailyProgress:', Object.keys(data.dailyProgress || {}).length, 'days');
        console.log('    actionProgress:', Object.keys(data.actionProgress || {}).length, 'items');
      }
    });
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
