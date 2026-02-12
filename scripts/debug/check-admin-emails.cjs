const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkAdminConfig() {
  try {
    // Check metadata/config
    const metadataConfig = await db.collection('metadata').doc('config').get();
    console.log('\n=== metadata/config ===');
    if (metadataConfig.exists) {
      const data = metadataConfig.data();
      console.log('Document exists:', JSON.stringify(data, null, 2));
      if (data.adminemails) {
        console.log('\nadminemails array:', data.adminemails);
      } else {
        console.log('\nWARNING: No adminemails field found!');
      }
    } else {
      console.log('Document does NOT exist!');
    }

    // Check global/metadata
    const globalMetadata = await db.collection('global').doc('metadata').get();
    console.log('\n=== global/metadata ===');
    if (globalMetadata.exists) {
      const data = globalMetadata.data();
      console.log('Document exists:', JSON.stringify(data, null, 2));
      if (data.adminemails) {
        console.log('\nadminemails array:', data.adminemails);
      } else {
        console.log('\nNote: No adminemails field found in global/metadata');
      }
    } else {
      console.log('Document does NOT exist (this is okay if metadata/config has adminemails)');
    }

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkAdminConfig();
