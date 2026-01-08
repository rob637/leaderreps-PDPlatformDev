/**
 * Check Firebase Auth user's email case
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth();

async function checkAuthUser() {
  console.log('Checking Firebase Auth users with "rob" in email...\n');

  try {
    // List all users (paginated)
    const listUsersResult = await auth.listUsers(1000);
    
    listUsersResult.users.forEach(user => {
      const email = user.email || '';
      if (email.toLowerCase().includes('rob')) {
        console.log(`UID: ${user.uid}`);
        console.log(`  Email: "${email}"`);
        console.log(`  Email lowercase: "${email.toLowerCase()}"`);
        console.log(`  emailVerified: ${user.emailVerified}`);
        console.log('');
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

checkAuthUser().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
