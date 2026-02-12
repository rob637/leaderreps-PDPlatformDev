const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkSkills() {
  console.log('--- Checking "skills" collection ---');
  const skillsSnap = await db.collection('skills').get();
  console.log(`Found ${skillsSnap.size} documents in "skills".`);
  skillsSnap.forEach(doc => console.log(`[${doc.id}] ${doc.data().name}`));

  console.log('\n--- Checking "content_library" for type="SKILL" ---');
  const unifiedSnap = await db.collection('content_library').where('type', '==', 'SKILL').get();
  console.log(`Found ${unifiedSnap.size} documents in "content_library" with type="SKILL".`);
  unifiedSnap.forEach(doc => console.log(`[${doc.id}] ${doc.data().title}`));
}

checkSkills().catch(console.error);
