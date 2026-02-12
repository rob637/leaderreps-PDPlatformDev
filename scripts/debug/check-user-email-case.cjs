/**
 * Check user email case in Firestore
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkUsers() {
  console.log('Checking user emails...\n');

  try {
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    console.log('Users with mixed-case emails:\n');
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const email = data.email || '';
      if (email !== email.toLowerCase()) {
        console.log(`  ${doc.id}: "${email}" (should be "${email.toLowerCase()}")`);
      }
    });
    
    // Also check specifically for rob12
    console.log('\nLooking for rob12 user...');
    const rob12Query = await usersRef.where('email', '>=', 'rob12').where('email', '<=', 'rob12\uf8ff').get();
    rob12Query.docs.forEach(doc => {
      console.log(`Found: ${doc.id} - email: "${doc.data().email}"`);
    });
    
    // Check case-insensitive
    console.log('\nAll users with "rob" in email:');
    snapshot.docs.forEach(doc => {
      const email = doc.data().email || '';
      if (email.toLowerCase().includes('rob')) {
        console.log(`  ${doc.id}: "${email}"`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

checkUsers().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
