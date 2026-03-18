/**
 * Clean up duplicate/mismatched carryover items for ALL users
 * Removes items synced with wrong labels that don't match Firestore definitions
 */
const admin = require('firebase-admin');
if (!admin.apps.length) {
  const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

// Items that were synced with wrong IDs (not action-* IDs)
const BAD_IDS = [
  'leader-profile',        // Should be action-* ID
  'baseline-assessment',   // Should be action-* ID
  'notifications-setup'    // Should be action-* ID
];

async function cleanup() {
  console.log('=== CLEANING UP ALL CARRYOVER DATA ===\n');
  
  const usersSnap = await db.collection('users').get();
  let cleanedCount = 0;
  let totalRemoved = 0;
  
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const carryoverRef = db.collection('users').doc(userId).collection('action_progress').doc('_carryover');
    const snap = await carryoverRef.get();
    
    if (!snap.exists) continue;
    
    const data = snap.data();
    const items = data.items || [];
    
    // Filter out bad items
    const cleanedItems = items.filter(item => {
      if (BAD_IDS.includes(item.id)) {
        return false;
      }
      return true;
    });
    
    const removedCount = items.length - cleanedItems.length;
    if (removedCount > 0) {
      await carryoverRef.update({ 
        items: cleanedItems, 
        lastUpdated: admin.firestore.FieldValue.serverTimestamp() 
      });
      console.log(`  ${userId}: removed ${removedCount} bad items`);
      cleanedCount++;
      totalRemoved += removedCount;
    }
  }
  
  console.log(`\nDone! Cleaned ${cleanedCount} users, removed ${totalRemoved} total bad items.`);
}

cleanup().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
