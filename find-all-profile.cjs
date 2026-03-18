const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function find() {
  // Check prep-requirements
  const prepSnap = await db.collection('prep-requirements').get();
  console.log('prep-requirements:');
  prepSnap.forEach(doc => {
    const data = doc.data();
    console.log(`\n${doc.id}:`);
    (data.items || []).forEach((item, i) => {
      console.log(`  ${i}: ${item.label || item.title} [${item.id}] handler: ${item.handlerType || 'none'}`);
    });
  });
  
  // Also check metadata/requirements
  const metaSnap = await db.collection('metadata').doc('requirements').get();
  if (metaSnap.exists) {
    console.log('\nmetadata/requirements:');
    const data = metaSnap.data();
    Object.keys(data).forEach(key => {
      if (Array.isArray(data[key])) {
        console.log(`\n${key}:`);
        data[key].forEach((item, i) => {
          if (item.label) console.log(`  ${i}: ${item.label} [${item.id}]`);
        });
      }
    });
  }
}

find().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
