const admin = require('firebase-admin');

const saPath = '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json';
const sa = require(saPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

async function main() {
  const db = admin.firestore();
  
  const users = [
    { email: 'rob+224l@sagecg.com', uid: 'UIEBLtWIB5U4pbpiH5N8G5OW28v2' },
    { email: 'rob@sagecg.com', uid: 'QUA65XyWmrWnMVmecG4yhIWMop52' }
  ];
  
  for (const user of users) {
    console.log(`\n=== ${user.email} ===`);
    
    // Check leader_profile
    const profileDoc = await db.doc(`user_data/${user.uid}/leader_profile/current`).get();
    if (profileDoc.exists) {
      const data = profileDoc.data();
      console.log('firstName:', data.firstName);
      console.log('lastName:', data.lastName);
    } else {
      console.log('No leader_profile/current doc');
    }
    
    // Check user_state
    const stateDoc = await db.doc(`user_data/${user.uid}/user_state/current`).get();
    if (stateDoc.exists) {
      const data = stateDoc.data();
      console.log('userState dailyProgress days:', Object.keys(data.dailyProgress || {}).length);
    } else {
      console.log('No user_state/current doc');
    }
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
