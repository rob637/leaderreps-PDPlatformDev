const admin = require('firebase-admin');
const serviceAccount = require('../../leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addNotificationSetup() {
  // Get day-001 document
  const docRef = db.collection('daily_plan_v1').doc('day-001');
  const doc = await docRef.get();
  
  if (!doc.exists) {
    console.log('day-001 not found!');
    return;
  }
  
  const data = doc.data();
  const actions = data.actions || [];
  
  // Check if notification setup already exists
  const hasNotification = actions.some(a => 
    (a.label || '').toLowerCase().includes('notification') ||
    a.handlerType === 'notification-setup'
  );
  
  if (hasNotification) {
    console.log('Notification setup already exists in day-001');
    return;
  }
  
  // Add notification setup action after Baseline Assessment
  const newAction = {
    id: 'prep-notification-setup',
    label: 'Set Up Notifications',
    type: 'onboarding',
    handlerType: 'notification-setup',
    required: true,
    optional: false,
    description: 'Choose how you want to be reminded',
    estimatedMinutes: 1
  };
  
  // Insert after Baseline Assessment (index 1), before Foundation Video Series
  const updatedActions = [
    ...actions.slice(0, 2),
    newAction,
    ...actions.slice(2)
  ];
  
  await docRef.update({ actions: updatedActions });
  
  console.log('Added notification setup to day-001');
  console.log('Updated actions:', updatedActions.map(a => a.label));
}

addNotificationSetup().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
