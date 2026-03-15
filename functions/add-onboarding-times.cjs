const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');
try { admin.app().delete(); } catch (e) {}
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const TIME_ESTIMATES = {
  'Watch Onboarding Videos': 15,
  'Complete Leader Profile': 10,
  'Complete Leadership Skills Baseline': 15,
  'Setup Notifications': 2
};

async function main() {
  const ref = db.doc('daily_plan_v1/onboarding-config');
  const snap = await ref.get();
  const data = snap.data();
  
  const updatedActions = data.actions.map(action => {
    const time = TIME_ESTIMATES[action.label];
    if (time && !action.estimatedMinutes) {
      console.log('Adding', time, 'min to:', action.label);
      return { ...action, estimatedMinutes: time };
    }
    return action;
  });
  
  await ref.update({ 
    actions: updatedActions,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('Updated onboarding-config');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
