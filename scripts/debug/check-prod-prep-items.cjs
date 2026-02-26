const admin = require('firebase-admin');
const serviceAccount = require('../../leaderreps-prod-firebase-adminsdk.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function check() {
  const planSnap = await db.collection('daily_plan_v1').get();
  
  console.log('=== All Prep Phase Days (phase = pre-start) in PRODUCTION ===\n');
  let prepItemCount = 0;
  const prepDocs = [];
  
  for (const doc of planSnap.docs) {
    const data = doc.data();
    if (data.phase === 'pre-start') {
      const actions = data.actions || [];
      const rqActions = actions.filter(a => a.required !== false && !a.optional && a.type !== 'daily_rep');
      prepDocs.push({ 
        id: doc.id, 
        dayNumber: data.dayNumber, 
        rqCount: rqActions.length,
        actions: rqActions.map(a => a.label || 'no-label')
      });
      prepItemCount += rqActions.length;
    }
  }
  
  prepDocs.sort((a,b) => (a.dayNumber || 999) - (b.dayNumber || 999));
  
  console.log('Document ID'.padEnd(28) + '| Day# | Required Items');
  console.log('-'.repeat(70));
  
  prepDocs.forEach(d => {
    console.log(`${d.id.padEnd(28)}| ${String(d.dayNumber || 'N/A').padEnd(4)} | ${d.rqCount}`);
    d.actions.forEach(label => console.log(`                              - ${label}`));
  });
  
  console.log('-'.repeat(70));
  console.log(`TOTAL REQUIRED PREP ITEMS: ${prepItemCount}`);
  console.log('\nNOTE: User is seeing 14 but expected 9. Difference = duplicates.');
  
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
