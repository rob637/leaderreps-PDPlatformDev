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

async function checkGlobal() {
  // Check if there's a global leader_profiles collection
  const globalProfilesSnap = await db.collection('leader_profiles').limit(5).get();
  console.log('Global leader_profiles collection:', globalProfilesSnap.size, 'docs (showing first 5)');
  
  globalProfilesSnap.docs.forEach(doc => {
    const data = doc.data();
    console.log('  -', doc.id, '|', data.email || data.userEmail || 'no email', '|', data.name || data.displayName || 'no name');
  });
  
  // Also check users collection for any profile-related fields
  const usersSnap = await db.collection('users').where('email', '==', 'hsmith@equity.net').get();
  if (!usersSnap.empty) {
    const userData = usersSnap.docs[0].data();
    console.log('\n\nHolley Smith user doc fields:');
    Object.keys(userData).forEach(key => {
      const val = userData[key];
      if (typeof val === 'object' && val !== null && val.toDate) {
        console.log('  ', key, ':', val.toDate().toISOString());
      } else if (typeof val === 'object' && val !== null) {
        console.log('  ', key, ':', JSON.stringify(val).substring(0, 100));
      } else {
        console.log('  ', key, ':', val);
      }
    });
  }
  
  process.exit(0);
}

checkGlobal().catch(e => { console.error(e); process.exit(1); });
