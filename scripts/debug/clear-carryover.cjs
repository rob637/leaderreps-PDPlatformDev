#!/usr/bin/env node
/**
 * Clear carryover document for a user (for testing)
 * Usage: node scripts/debug/clear-carryover.cjs <email>
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

(async () => {
  const email = process.argv[2];
  if (!email) {
    console.log('Usage: node scripts/debug/clear-carryover.cjs <email>');
    process.exit(1);
  }

  // Find user by email
  const usersSnap = await db.collection('users').where('email', '==', email).get();
  if (usersSnap.empty) {
    console.log('User not found:', email);
    process.exit(1);
  }
  
  const uid = usersSnap.docs[0].id;
  console.log('User:', email, '→', uid);
  
  // Delete the carryover doc
  const ref = db.doc(`users/${uid}/action_progress/_carryover`);
  const snap = await ref.get();
  
  if (!snap.exists) {
    console.log('No carryover doc exists - nothing to clear');
  } else {
    const data = snap.data();
    console.log('Current carryover:', data.items?.length || 0, 'items at level', data.currentLevel);
    await ref.delete();
    console.log('✓ Deleted _carryover doc');
  }
  
  process.exit(0);
})();
