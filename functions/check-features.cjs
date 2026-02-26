const admin = require('firebase-admin');

const saPath = '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json';
const sa = require(saPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

async function main() {
  const db = admin.firestore();
  
  const featuresDoc = await db.collection('config').doc('features').get();
  
  if (featuresDoc.exists) {
    const data = featuresDoc.data();
    console.log('=== config/features ===');
    console.log('prep-welcome-banner:', JSON.stringify(data['prep-welcome-banner'], null, 2));
    console.log('this-weeks-actions:', JSON.stringify(data['this-weeks-actions'], null, 2));
    console.log('\nAll feature keys:', Object.keys(data).join(', '));
  } else {
    console.log('No config/features document found');
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
