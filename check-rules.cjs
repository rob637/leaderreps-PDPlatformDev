const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkRules() {
  console.log('Checking notification_rules collection...');
  const snapshot = await db.collection('notification_rules').get();
  
  if (snapshot.empty) {
    console.log('No documents found in notification_rules.');
  } else {
    console.log(`Found ${snapshot.size} rules:`);
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
    });
  }
}

checkRules();
