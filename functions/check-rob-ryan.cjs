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
  'rob@leaderreps.com',
  'ryan@leaderreps.com',
  'hsmith@equity.net'  // Compare to one that's not working
];

async function check() {
  for (const email of emails) {
    const usersSnap = await db.collection('users').where('email', '==', email).get();
    if (usersSnap.empty) {
      console.log(email, '- NOT FOUND');
      continue;
    }
    
    const userId = usersSnap.docs[0].id;
    const userData = usersSnap.docs[0].data();
    
    console.log('='.repeat(60));
    console.log(email);
    console.log('  cohortId:', userData.cohortId || 'NONE');
    console.log('  foundationStartDate:', userData.foundationStartDate || 'NOT SET');
    console.log('  onboardingComplete:', userData.onboardingComplete || false);
    console.log('  role:', userData.role);
    console.log('  prepStatus:', JSON.stringify(userData.prepStatus || {}));
    
    // Check daily_plan_v1 subcollection
    const dailyPlanSnap = await db.collection('users').doc(userId).collection('daily_plan_v1').get();
    console.log('  daily_plan_v1 docs:', dailyPlanSnap.size);
    
    // Check state/userState
    const stateSnap = await db.collection('users').doc(userId).collection('state').doc('userState').get();
    console.log('  userState exists:', stateSnap.exists);
    if (stateSnap.exists) {
      const state = stateSnap.data();
      console.log('    dailyProgress keys:', Object.keys(state.dailyProgress || {}).length);
    }
  }
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
