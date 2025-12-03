const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkWeek1() {
  console.log('\n=== Checking development_plan_v1/week-01 ===');
  const week1Ref = db.collection('development_plan_v1').doc('week-01');
  const doc = await week1Ref.get();

  if (!doc.exists) {
    console.log('Week 1 document does not exist!');
  } else {
    const data = doc.data();
    console.log('Week 1 Data:', JSON.stringify(data, null, 2));
    
    if (data.content) {
        console.log('\nContent IDs in Week 1:');
        data.content.forEach((item, index) => {
            console.log(`Item ${index}:`);
            console.log(`  - resourceId: ${item.resourceId}`);
            console.log(`  - contentItemId: ${item.contentItemId}`);
            console.log(`  - id: ${item.id}`);
            console.log(`  - title: ${item.title}`);
        });
    } else {
        console.log('No content array found in Week 1.');
    }
  }
  process.exit(0);
}

checkWeek1().catch(console.error);
