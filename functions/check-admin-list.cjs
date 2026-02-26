const admin = require('firebase-admin');

const saPath = '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json';
const sa = require(saPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

async function main() {
  const db = admin.firestore();
  
  // Check metadata/config for admin emails
  const configDoc = await db.collection('metadata').doc('config').get();
  
  if (configDoc.exists) {
    const data = configDoc.data();
    console.log('Admin emails:', data.adminemails || 'none');
  } else {
    console.log('No metadata/config document');
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
