const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve('./leaderreps-test-firebase-adminsdk.json'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-test'
});

const db = admin.firestore();

async function main() {
  // Check all users' daily_logs and daily_practice
  const usersSnapshot = await db.collection('users').get();
  console.log('Total users:', usersSnapshot.size);
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    console.log('\n=== User:', userData.email, '===');
    
    // Check daily_logs
    const logsSnap = await userDoc.ref.collection('daily_logs').get();
    if (logsSnap.size > 0) {
      console.log('daily_logs:');
      logsSnap.forEach(doc => {
        const data = doc.data();
        console.log('  Doc:', doc.id);
        console.log('  Keys:', Object.keys(data).join(', '));
      });
    }
    
    // Check daily_practice
    const practiceSnap = await userDoc.ref.collection('daily_practice').get();
    if (practiceSnap.size > 0) {
      console.log('daily_practice:');
      practiceSnap.forEach(doc => {
        const data = doc.data();
        console.log('  Doc:', doc.id);
        console.log('  Keys:', Object.keys(data).join(', '));
      });
    }
    
    // Check content_progress (might be user's completion tracking)
    const progressSnap = await userDoc.ref.collection('content_progress').get();
    if (progressSnap.size > 0) {
      console.log('content_progress:', progressSnap.size, 'docs');
    }
    
    // Check completions
    const completionsSnap = await userDoc.ref.collection('completions').get();
    if (completionsSnap.size > 0) {
      console.log('completions:', completionsSnap.size, 'docs');
    }
  }
  
  process.exit(0);
}
main();
