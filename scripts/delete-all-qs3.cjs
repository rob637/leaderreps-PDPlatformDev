const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function deleteAllQS3() {
  // Check development_plan_v1 week-03
  const week03Ref = db.collection('development_plan_v1').doc('week-03');
  const week03Doc = await week03Ref.get();
  
  if (week03Doc.exists) {
    const data = week03Doc.data();
    console.log('week-03 community:', JSON.stringify(data.community));
    console.log('week-03 coaching:', JSON.stringify(data.coaching));
    
    // Remove QS3 items
    let updates = {};
    
    if (data.community) {
      const filtered = data.community.filter(item => {
        const hasQS3 = item.communityItemLabel?.includes('QS3');
        if (hasQS3) console.log('Removing from community:', item.communityItemLabel);
        return !hasQS3;
      });
      if (filtered.length !== data.community.length) {
        updates.community = filtered;
      }
    }
    
    if (data.coaching) {
      const filtered = data.coaching.filter(item => {
        const hasQS3 = item.coachingItemLabel?.includes('QS3');
        if (hasQS3) console.log('Removing from coaching:', item.coachingItemLabel);
        return !hasQS3;
      });
      if (filtered.length !== data.coaching.length) {
        updates.coaching = filtered;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await week03Ref.update(updates);
      console.log('Updated week-03');
    }
  }
  
  // Also check 120 (weekBlockId for week-03)
  const block120Ref = db.collection('development_plan_v1').doc('120');
  const block120Doc = await block120Ref.get();
  
  if (block120Doc.exists) {
    const data = block120Doc.data();
    console.log('\n120 community:', JSON.stringify(data.community));
    console.log('120 coaching:', JSON.stringify(data.coaching));
    
    let updates = {};
    
    if (data.community) {
      const filtered = data.community.filter(item => {
        const hasQS3 = item.communityItemLabel?.includes('QS3');
        if (hasQS3) console.log('Removing from 120 community:', item.communityItemLabel);
        return !hasQS3;
      });
      if (filtered.length !== data.community.length) {
        updates.community = filtered;
      }
    }
    
    if (data.coaching) {
      const filtered = data.coaching.filter(item => {
        const hasQS3 = item.coachingItemLabel?.includes('QS3');
        if (hasQS3) console.log('Removing from 120 coaching:', item.coachingItemLabel);
        return !hasQS3;
      });
      if (filtered.length !== data.coaching.length) {
        updates.coaching = filtered;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await block120Ref.update(updates);
      console.log('Updated 120');
    }
  }
  
  console.log('\nDone!');
}

deleteAllQS3().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
