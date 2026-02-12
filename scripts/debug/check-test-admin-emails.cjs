const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-test-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkAdminConfig() {
  try {
    // Check metadata/config
    const metadataConfig = await db.collection('metadata').doc('config').get();
    console.log('\n=== TEST ENV: metadata/config ===');
    if (metadataConfig.exists) {
      const data = metadataConfig.data();
      console.log('Document exists:', JSON.stringify(data, null, 2));
      if (data.adminemails) {
        console.log('\nadminemails array:', data.adminemails);
        console.log('\nEmails that need to be in this array for admin access:');
        console.log('- cristina@leaderreps.com');
        console.log('- jeff@leaderreps.com');
        console.log('- (any other admin emails)');
      } else {
        console.log('\n❌ WARNING: No adminemails field found!');
        console.log('This is likely the issue - need to add adminemails array');
      }
    } else {
      console.log('❌ Document does NOT exist!');
      console.log('This is the issue - need to create metadata/config with adminemails array');
    }

    // Also check what users have admin role
    console.log('\n=== Users with role: admin ===');
    const usersSnap = await db.collection('users').where('role', '==', 'admin').get();
    usersSnap.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.email || doc.id} (role: ${data.role})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkAdminConfig();
