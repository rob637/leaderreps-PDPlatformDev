#!/usr/bin/env node
/**
 * Reset all users' daily progress in Test environment
 */

const admin = require('firebase-admin');
const path = require('path');

const config = {
  projectId: 'leaderreps-test',
  serviceAccountPath: './leaderreps-test-firebase-adminsdk.json'
};

async function main() {
  console.log('\n🔥 Connecting to TEST environment...');
  
  const serviceAccount = require(path.resolve(config.serviceAccountPath));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: config.projectId
  });
  
  const db = admin.firestore();
  console.log('✅ Connected to leaderreps-test\n');
  
  // Get all users
  const usersSnapshot = await db.collection('users').get();
  console.log(`Found ${usersSnapshot.size} users\n`);
  
  let updatedCount = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const email = userData.email || userDoc.id;
    
    console.log(`Processing: ${email}`);
    
    // Fields to clear/reset
    const updates = {};
    
    // Clear daily progress tracking
    if (userData.dailyProgress) {
      updates.dailyProgress = admin.firestore.FieldValue.delete();
    }
    
    // Clear userState if it has stale dailyProgress
    if (userData.userState?.dailyProgress) {
      updates['userState.dailyProgress'] = admin.firestore.FieldValue.delete();
    }
    
    // Clear cached daily plan items
    if (userData.cachedDailyPlan) {
      updates.cachedDailyPlan = admin.firestore.FieldValue.delete();
    }
    
    // Clear itemsCompleted tracking
    if (userData.itemsCompleted) {
      updates.itemsCompleted = admin.firestore.FieldValue.delete();
    }
    
    if (Object.keys(updates).length > 0) {
      await userDoc.ref.update(updates);
      console.log(`  ✅ Cleared daily progress fields`);
      updatedCount++;
    } else {
      console.log(`  ⏭️  No daily progress to clear`);
    }
  }
  
  console.log(`\n════════════════════════════════════════`);
  console.log(`✅ Reset complete! Updated ${updatedCount} users`);
  console.log(`════════════════════════════════════════\n`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
