// migrate-tiers-to-free-premium.js
// Script to migrate content from old tier system (basic/professional/elite) to new system (free/premium)

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Firebase config - replace with your actual values or use environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDPnZ4WmnPYVmHlhXfQ43hZ8_6jAyYKVTk',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'leaderreps-pd-platform.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'leaderreps-pd-platform',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'leaderreps-pd-platform.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '519945862086',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:519945862086:web:5835f89a6e9c0fbfdfccc0',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Tier mapping: old tier -> new tier
const TIER_MAPPING = {
  'basic': 'free',
  'professional': 'premium',
  'elite': 'premium',
  'free': 'free',  // Already correct
  'premium': 'premium'  // Already correct
};

async function migrateCollection(collectionName) {
  console.log(`\n📚 Migrating collection: ${collectionName}`);
  
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    console.log(`Found ${snapshot.size} documents in ${collectionName}`);
    
    let updatedCount = 0;
    let unchangedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const oldTier = data.tier;
      
      if (!oldTier) {
        console.log(`⚠️  Document ${docSnapshot.id} has no tier field, skipping`);
        unchangedCount++;
        continue;
      }
      
      const newTier = TIER_MAPPING[oldTier.toLowerCase()];
      
      if (!newTier) {
        console.log(`⚠️  Unknown tier "${oldTier}" in document ${docSnapshot.id}, skipping`);
        unchangedCount++;
        continue;
      }
      
      if (oldTier === newTier) {
        console.log(`  ✓ Document ${docSnapshot.id}: "${oldTier}" already correct`);
        unchangedCount++;
        continue;
      }
      
      // Update the document
      const docRef = doc(db, collectionName, docSnapshot.id);
      await updateDoc(docRef, { tier: newTier });
      
      console.log(`  ✅ Updated document ${docSnapshot.id}: "${oldTier}" → "${newTier}"`);
      updatedCount++;
    }
    
    console.log(`\n✨ Migration complete for ${collectionName}:`);
    console.log(`   Updated: ${updatedCount} documents`);
    console.log(`   Unchanged: ${unchangedCount} documents`);
    
  } catch (error) {
    console.error(`❌ Error migrating ${collectionName}:`, error);
  }
}

async function main() {
  console.log('🚀 Starting tier migration from basic/professional/elite to free/premium\n');
  console.log('Tier mapping:');
  console.log('  basic → free');
  console.log('  professional → premium');
  console.log('  elite → premium');
  console.log('  free → free (unchanged)');
  console.log('  premium → premium (unchanged)');
  
  // Migrate all content collections
  await migrateCollection('content_readings');
  await migrateCollection('content_videos');
  await migrateCollection('content_courses');
  
  console.log('\n✅ All migrations complete!');
  console.log('\nNext steps:');
  console.log('1. Verify the changes in Firebase Console');
  console.log('2. Test the application with both free and premium tiers');
  console.log('3. Deploy the updated code');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
