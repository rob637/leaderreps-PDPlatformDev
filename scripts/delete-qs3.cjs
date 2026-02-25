const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteQS3() {
  // Get day-029 from daily_plan_v1
  const dayRef = db.collection('daily_plan_v1').doc('day-029');
  const doc = await dayRef.get();
  
  if (!doc.exists) {
    console.log('day-029 not found');
    return;
  }
  
  const data = doc.data();
  console.log('Current day-029 actions:', data.actions?.length || 0);
  
  // Filter out the Live QS3 action
  const filteredActions = (data.actions || []).filter(a => {
    const isQS3 = a.id === 'action-1765979945924' || 
                  (a.label && a.label.includes('QS3'));
    if (isQS3) console.log('Removing:', a.id, a.label);
    return !isQS3;
  });
  
  console.log('Filtered actions:', filteredActions.length);
  
  // Update the document
  await dayRef.update({ actions: filteredActions });
  console.log('Updated day-029 successfully');
}

deleteQS3().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
