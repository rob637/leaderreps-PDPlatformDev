const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const cohortId = 'X5pGc5YVgtBpwoOOZU0I';

async function check() {
  console.log('=== Full Week 2 Structure ===');
  
  const week2Doc = await db.collection('development_plan_v1').doc('week-02').get();
  if (week2Doc.exists) {
    const week = week2Doc.data();
    console.log('Full week data:', JSON.stringify(week, null, 2));
  }
  
  // Also check if AI Feedback Coach appears in content_coaching
  console.log('\\n=== content_coaching ===');
  const coachingSnap = await db.collection('content_coaching').get();
  coachingSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.title?.includes('Feedback') || data.label?.includes('Feedback')) {
      console.log(doc.id, ':', data.title || data.label);
    }
  });
  
  process.exit(0);
}
check().catch(e => { console.error(e); process.exit(1); });
