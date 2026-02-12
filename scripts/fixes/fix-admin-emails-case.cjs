/**
 * Fix admin emails case sensitivity in Firestore
 * This script ensures all admin emails are stored in lowercase
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function fixAdminEmails() {
  console.log('Fixing admin emails case sensitivity...\n');

  try {
    // Get current adminemails from metadata/config
    const configRef = db.doc('metadata/config');
    const configSnap = await configRef.get();
    
    if (!configSnap.exists) {
      console.log('metadata/config does not exist!');
      return;
    }

    const data = configSnap.data();
    const adminemails = data.adminemails || [];
    
    console.log('Current adminemails:', adminemails);
    
    // Convert all to lowercase and remove duplicates
    const lowercaseEmails = [...new Set(adminemails.map(e => e.toLowerCase()))];
    
    console.log('\nLowercase adminemails:', lowercaseEmails);
    
    // Check if there are any changes
    const hasChanges = adminemails.length !== lowercaseEmails.length || 
      adminemails.some((e, i) => e !== lowercaseEmails[i]);
    
    if (!hasChanges) {
      console.log('\n✓ All admin emails are already lowercase. No changes needed.');
      return;
    }
    
    // Update the document
    await configRef.update({
      adminemails: lowercaseEmails
    });
    
    console.log('\n✓ Updated adminemails to lowercase:', lowercaseEmails);
    
  } catch (error) {
    console.error('Error fixing admin emails:', error);
    throw error;
  }
}

fixAdminEmails().then(() => {
  console.log('\nDone!');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
