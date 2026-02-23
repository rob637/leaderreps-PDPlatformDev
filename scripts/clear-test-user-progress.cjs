/**
 * Clear all user progress data in Test environment
 * Deletes daily_logs and daily_practice subcollection documents
 */
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve('./leaderreps-test-firebase-adminsdk.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-test'
});

const db = admin.firestore();

async function deleteCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  if (snapshot.empty) return 0;
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
}

async function main() {
  console.log('Clearing user progress data in Test environment...\n');
  
  const usersSnapshot = await db.collection('users').get();
  console.log(`Found ${usersSnapshot.size} users\n`);
  
  let totalLogsDeleted = 0;
  let totalPracticeDeleted = 0;
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const email = userData.email || userDoc.id;
    
    // Delete daily_logs
    const logsRef = userDoc.ref.collection('daily_logs');
    const logsDeleted = await deleteCollection(logsRef);
    
    // Delete daily_practice
    const practiceRef = userDoc.ref.collection('daily_practice');
    const practiceDeleted = await deleteCollection(practiceRef);
    
    if (logsDeleted > 0 || practiceDeleted > 0) {
      console.log(`${email}: deleted ${logsDeleted} daily_logs, ${practiceDeleted} daily_practice`);
      totalLogsDeleted += logsDeleted;
      totalPracticeDeleted += practiceDeleted;
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total daily_logs deleted: ${totalLogsDeleted}`);
  console.log(`Total daily_practice deleted: ${totalPracticeDeleted}`);
  console.log('Done!');
  
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
