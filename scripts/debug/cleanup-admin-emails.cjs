const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-prod'
});

const db = admin.firestore();

// Real admin emails to keep
const REAL_ADMIN_EMAILS = [
  'rob@sagecg.com',
  'ryan@leaderreps.com'
];

async function run() {
  console.log('=== CLEANING UP ADMIN EMAILS IN PRODUCTION ===\n');
  
  const configRef = db.doc('metadata/config');
  const configSnap = await configRef.get();
  
  if (!configSnap.exists) {
    console.log('❌ metadata/config document not found!');
    process.exit(1);
  }
  
  const currentEmails = configSnap.data().adminemails || [];
  console.log('Current admin emails:', currentEmails.length);
  currentEmails.forEach(e => console.log(`  - ${e}`));
  
  console.log('\n--- UPDATING TO REAL EMAILS ONLY ---\n');
  console.log('New admin emails:', REAL_ADMIN_EMAILS.length);
  REAL_ADMIN_EMAILS.forEach(e => console.log(`  ✅ ${e}`));
  
  // Update Firestore
  await configRef.update({
    adminemails: REAL_ADMIN_EMAILS
  });
  
  console.log('\n✅ Admin emails updated successfully!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
