const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function check() {
  const doc = await db.collection('communication_templates').doc('coaching_registration_user').get();
  if (doc.exists) {
    console.log('Template body:\n');
    console.log(doc.data().body);
  } else {
    console.log('Template not found - using fallback HTML');
  }
  process.exit(0);
}
check();
