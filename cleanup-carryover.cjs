const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function cleanup() {
  const usersSnap = await db.collection('users').where('email', '==', 'rob0315h@sagecg.com').get();
  const userId = usersSnap.docs[0].id;
  console.log('Cleaning up user:', userId);
  
  const carryoverRef = db.collection('users').doc(userId).collection('action_progress').doc('_carryover');
  const snap = await carryoverRef.get();
  
  if (!snap.exists) {
    console.log('No _carryover doc');
    return;
  }
  
  const data = snap.data();
  const items = data.items || [];
  
  console.log('\nBefore cleanup:');
  items.forEach((item, i) => console.log(`  ${i}: ${item.label} [${item.id}]`));
  
  // Remove duplicate items that were added by syncCompletionToCarryover with wrong labels
  // Keep only items with action-* IDs (from the official config)
  // Remove: leader-profile, baseline-assessment (wrong labels from old sync)
  const cleanedItems = items.filter(item => {
    // Remove items added by old sync code (have handler IDs not action-* IDs)
    if (item.id === 'leader-profile') {
      console.log('  Removing: "Create Your Leader Profile" [leader-profile]');
      return false;
    }
    if (item.id === 'baseline-assessment') {
      console.log('  Removing: "Complete Baseline Skills Assessment" [baseline-assessment]');
      return false;
    }
    return true;
  });
  
  console.log('\nAfter cleanup:');
  cleanedItems.forEach((item, i) => console.log(`  ${i}: ${item.label} [${item.id}]`));
  
  await carryoverRef.update({ 
    items: cleanedItems, 
    lastUpdated: admin.firestore.FieldValue.serverTimestamp() 
  });
  
  console.log('\nDone! Removed', items.length - cleanedItems.length, 'duplicate items');
}

cleanup().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
