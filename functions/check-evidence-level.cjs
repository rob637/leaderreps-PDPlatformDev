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
  const ryanQuery = await db.collection('users').where('email', '==', 'ryan@leaderreps.com').get();
  const ryanId = ryanQuery.docs[0].id;
  
  const repsSnap = await db.collection('users').doc(ryanId).collection('conditioning_reps').get();
  
  console.log('Ryan\'s reps - Evidence Level Check:');
  console.log('====================================');
  repsSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`\n${data.person} (${data.status}):`);
    console.log(`  Has evidence: ${!!data.evidence}`);
    if (data.evidence) {
      console.log(`  evidence.level: ${data.evidence.level || 'NOT SET'}`);
      console.log(`  evidence keys: ${Object.keys(data.evidence).join(', ')}`);
    }
  });
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
