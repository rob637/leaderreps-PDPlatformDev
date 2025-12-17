const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const uid = '18BmIs35txM4VkyfxiycGcDvXIA3'; // Robert
  
  // Check dev plan
  const devPlanDoc = await db.doc('modules/' + uid + '/development_plan/current').get();
  const data = devPlanDoc.data();
  
  console.log('Dev Plan Data:');
  // console.log('  Full data:', JSON.stringify(data, null, 2));
  
  if (data.startDate) {
    console.log('  startDate type:', typeof data.startDate, data.startDate.constructor?.name);
    if (data.startDate.toDate) {
      console.log('  startDate value:', data.startDate.toDate());
    } else if (data.startDate._seconds) {
      console.log('  startDate value:', new Date(data.startDate._seconds * 1000));
    }
  }
  
  if (data.prepPhaseFirstVisit) {
    console.log('  prepPhaseFirstVisit type:', typeof data.prepPhaseFirstVisit, data.prepPhaseFirstVisit.constructor?.name);
    
    // Handle different timestamp formats
    let firstVisit;
    if (data.prepPhaseFirstVisit.toDate) {
      firstVisit = data.prepPhaseFirstVisit.toDate();
    } else if (data.prepPhaseFirstVisit._seconds) {
      firstVisit = new Date(data.prepPhaseFirstVisit._seconds * 1000);
    } else {
      firstVisit = new Date(data.prepPhaseFirstVisit);
    }
    
    console.log('  prepPhaseFirstVisit value:', firstVisit);
    
    const now = new Date();
    console.log('  Current Time:', now);

    // OLD LOGIC
    const diffMsOld = now.getTime() - firstVisit.getTime();
    const diffDaysOld = Math.floor(diffMsOld / (1000 * 60 * 60 * 24));
    console.log('  [OLD LOGIC] journeyDay:', diffDaysOld + 1);

    // NEW LOGIC (Calendar Days)
    const firstVisitDate = new Date(firstVisit.getFullYear(), firstVisit.getMonth(), firstVisit.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffMsNew = nowDate.getTime() - firstVisitDate.getTime();
    const diffDaysNew = Math.round(diffMsNew / (1000 * 60 * 60 * 24));
    console.log('  [NEW LOGIC] journeyDay:', diffDaysNew + 1);
    
  } else {
    console.log('  prepPhaseFirstVisit not set - journeyDay defaults to 1');
  }
  
  process.exit(0);
}
check();
