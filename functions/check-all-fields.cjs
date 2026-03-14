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

const emails = [
  'hsmith@equity.net',
  'lydia@irvinpr.com',
  'jesse.spates@voicebrook.com',
  'matt.kruckenberg@josephgroup.com'
];

async function check() {
  for (const email of emails) {
    const usersSnap = await db.collection('users').where('email', '==', email).get();
    if (usersSnap.empty) continue;
    
    const userId = usersSnap.docs[0].id;
    const userData = usersSnap.docs[0].data();
    
    console.log('='.repeat(60));
    console.log(email);
    console.log('  foundationStartDate:', userData.foundationStartDate || 'NOT SET');
    console.log('  onboardingComplete:', userData.onboardingComplete || false);
    console.log('  prepStatus:', JSON.stringify(userData.prepStatus || {}));
    console.log('  cohortId:', userData.cohortId);
    
    // Check subcollections
    const dailyPlanSnap = await db.collection('users').doc(userId).collection('daily_plan_v1').get();
    console.log('  daily_plan_v1 docs:', dailyPlanSnap.size);
    
    // Check state/userState
    const stateSnap = await db.collection('users').doc(userId).collection('state').doc('userState').get();
    console.log('  userState exists:', stateSnap.exists);
    
    // Check for profile subcollection variants
    const collections = ['leader_profile', 'profile', 'leaderProfile'];
    for (const coll of collections) {
      const snap = await db.collection('users').doc(userId).collection(coll).get();
      if (snap.size > 0) {
        console.log('  Found', coll, 'subcollection with', snap.size, 'docs');
      }
    }
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
