/**
 * Fix duplicate carryover items caused by label mismatch
 * Specifically removes "Create Your Leader Profile" duplicates when 
 * "Complete Leader Profile" already exists or is completed
 */

const admin = require('firebase-admin');

// DEV environment
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function fixDuplicateCarryover() {
  console.log('=== FIXING DUPLICATE CARRYOVER ITEMS ===\n');
  
  // Get all users with carryover data
  const usersSnap = await db.collection('users').get();
  let fixedCount = 0;
  
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const carryoverRef = db.collection('users').doc(userId).collection('action_progress').doc('carryover');
    const carryoverSnap = await carryoverRef.get();
    
    if (!carryoverSnap.exists) continue;
    
    const data = carryoverSnap.data();
    const items = data.items || [];
    
    // Find duplicates - "Create Your Leader Profile" when "Complete Leader Profile" exists
    const hasCompleteLeaderProfile = items.some(i => 
      (i.label || '').toLowerCase().includes('complete leader profile')
    );
    const hasCreateLeaderProfile = items.some(i => 
      (i.label || '').toLowerCase().includes('create your leader profile')
    );
    
    if (hasCompleteLeaderProfile && hasCreateLeaderProfile) {
      console.log(`User ${userId}: Found duplicate leader profile items, fixing...`);
      
      // Remove "Create Your Leader Profile" - keep "Complete Leader Profile"
      const filteredItems = items.filter(i => {
        const label = (i.label || '').toLowerCase();
        if (label.includes('create your leader profile')) {
          console.log(`  - Removing: "${i.label}"`);
          return false;
        }
        return true;
      });
      
      await carryoverRef.update({ items: filteredItems, lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
      console.log(`  Fixed! Items: ${items.length} -> ${filteredItems.length}`);
      fixedCount++;
    } else if (hasCreateLeaderProfile && !hasCompleteLeaderProfile) {
      // Solo "Create Your Leader Profile" - rename to "Complete Leader Profile"
      console.log(`User ${userId}: Renaming solo "Create Your Leader Profile"...`);
      
      const updatedItems = items.map(i => {
        if ((i.label || '').toLowerCase().includes('create your leader profile')) {
          console.log(`  - Renaming: "${i.label}" -> "Complete Leader Profile"`);
          return { ...i, label: 'Complete Leader Profile' };
        }
        return i;
      });
      
      await carryoverRef.update({ items: updatedItems, lastUpdated: admin.firestore.FieldValue.serverTimestamp() });
      console.log('  Fixed!');
      fixedCount++;
    }
  }
  
  console.log(`\nDone! Fixed ${fixedCount} users.`);
}

fixDuplicateCarryover()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
