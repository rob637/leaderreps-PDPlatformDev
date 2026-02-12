/* eslint-disable */
// update-content-tiers.js
// Script to update all content collections from old tier system (basic/professional/elite) to new system (free/premium)

// RUN THIS FROM BROWSER CONSOLE ON CONTENT MANAGEMENT PAGE

// Tier mapping: basic/professional -> premium, anything else -> free
const TIER_MAPPING = {
  'basic': 'premium',
  'professional': 'premium',
  'pro': 'premium',
  'elite': 'premium',
  'free': 'free'
};

async function updateContentTiers() {
  const collections = ['content_readings', 'content_videos', 'content_courses'];
  let totalUpdated = 0;
  
  for (const collectionName of collections) {
    console.log(`\n📚 Processing ${collectionName}...`);
    
    const querySnapshot = await firebase.firestore().collection(collectionName).get();
    console.log(`Found ${querySnapshot.size} items in ${collectionName}`);
    
    let updated = 0;
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const oldTier = data.tier;
      const newTier = TIER_MAPPING[oldTier?.toLowerCase()] || 'free';
      
      if (oldTier !== newTier) {
        await doc.ref.update({ tier: newTier });
        console.log(`✅ Updated ${doc.id}: ${oldTier} → ${newTier}`);
        updated++;
      }
    }
    
    console.log(`Updated ${updated} items in ${collectionName}`);
    totalUpdated += updated;
  }
  
  console.log(`\n✅ Total updated: ${totalUpdated} items across all collections`);
}

// Run it
updateContentTiers().catch(console.error);
