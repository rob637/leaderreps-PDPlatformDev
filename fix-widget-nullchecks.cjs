const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixWidgets() {
  const featureDocRef = db.collection('config').doc('features');
  const doc = await featureDocRef.get();
  const data = doc.data();
  
  // Check if these widgets have stored code that needs updating
  if (data['dev-plan-focus-areas'] && data['dev-plan-focus-areas'].code) {
    const oldCode = data['dev-plan-focus-areas'].code;
    if (oldCode.includes('plan.focusAreas') && !oldCode.includes('plan && plan.focusAreas')) {
      const newCode = oldCode.replace('plan.focusAreas && plan.focusAreas.map', 'plan && plan.focusAreas && plan.focusAreas.map');
      await featureDocRef.update({
        'dev-plan-focus-areas.code': newCode
      });
      console.log('Fixed dev-plan-focus-areas code');
    } else {
      console.log('dev-plan-focus-areas code already fixed or no code');
    }
  }
  
  if (data['dev-plan-goal'] && data['dev-plan-goal'].code) {
    const oldCode = data['dev-plan-goal'].code;
    if (oldCode.includes('plan.openEndedAnswer') && !oldCode.includes('plan && plan.openEndedAnswer')) {
      const newCode = `
{plan && plan.openEndedAnswer && (
<Card title="Your Goal" icon={Flag} accent="ORANGE">
  <p className="text-slate-700 italic border-l-4 border-corporate-orange pl-4 py-1">
    "{plan.openEndedAnswer}"
  </p>
</Card>
)}
`;
      await featureDocRef.update({
        'dev-plan-goal.code': newCode
      });
      console.log('Fixed dev-plan-goal code');
    } else {
      console.log('dev-plan-goal code already fixed or no code');
    }
  }
  
  console.log('Done!');
}

fixWidgets().catch(console.error);
