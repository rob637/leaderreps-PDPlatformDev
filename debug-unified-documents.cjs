const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const UNIFIED_COLLECTION = 'content_library';

const TARGET_IDS = [
  '8Zs3zVk4dspWFoL7Q311', // PDQ Feedback Loop
  'gjpKESqxHiqteFneAczq'  // QuickStart Workbook
];

async function checkUnified() {
  console.log(`Checking ${UNIFIED_COLLECTION} for target IDs...`);
  
  for (const id of TARGET_IDS) {
    const doc = await db.collection(UNIFIED_COLLECTION).doc(id).get();
    if (doc.exists) {
      const data = doc.data();
      console.log(`\n[FOUND] ID: ${doc.id}`);
      console.log(`Title: ${data.title}`);
      console.log(`Type: ${data.type}`);
      console.log(`Status: ${data.status}`);
      console.log(`IsHiddenUntilUnlocked: ${data.isHiddenUntilUnlocked}`);
    } else {
      console.log(`\n[MISSING] ID: ${id} not found in ${UNIFIED_COLLECTION}`);
    }
  }
}

checkUnified();
