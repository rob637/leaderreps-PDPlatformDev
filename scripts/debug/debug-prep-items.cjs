const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  // The correct collection name
  const docs = await db.collection('daily_plan_v1').get();
  
  console.log('=== daily_plan_v1 Items ===\n');
  
  docs.docs.forEach(doc => {
    const data = doc.data();
    if (data.phase === 'pre-start' || doc.id.includes('onboarding') || doc.id.includes('session1-config')) {
      console.log(`\n${doc.id} (phase: ${data.phase}):`);
      if (data.actions) {
        data.actions.forEach((a, i) => {
          const id = a.id || `daily-${doc.id}-${i}`;
          console.log(`  ${i}: id="${id}" label="${a.label}"`);
        });
      }
    }
  });
  
  process.exit(0);
})();
