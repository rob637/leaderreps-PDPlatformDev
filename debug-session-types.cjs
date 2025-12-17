
const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkSessionTypes() {
  console.log('\n=== Checking community_session_types ===');
  try {
    const snapshot = await db.collection('community_session_types').get();
    console.log(`Found ${snapshot.size} documents.`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\nID: ${doc.id}`);
      console.log(`Title: ${data.title}`);
      console.log(`Name: ${data.name}`);
      console.log(`Label: ${data.label}`);
    });
  } catch (error) {
    console.error('Error fetching community types:', error);
  }

  console.log('\n=== Checking coaching_session_types ===');
  try {
    const snapshot = await db.collection('coaching_session_types').get();
    console.log(`Found ${snapshot.size} documents.`);
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`\nID: ${doc.id}`);
      console.log(`Title: ${data.title}`);
      console.log(`Name: ${data.name}`);
      console.log(`Label: ${data.label}`);
    });
  } catch (error) {
    console.error('Error fetching coaching types:', error);
  }
}

checkSessionTypes();
