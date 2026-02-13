const admin = require('firebase-admin');
const serviceAccount = require('../leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  // Get daily_plan_v1 collection
  const daysSnapshot = await db.collection('daily_plan_v1').orderBy('dayNumber', 'asc').get();
  console.log('daily_plan_v1 docs:', daysSnapshot.size);
  
  // Find days for week 3 (days 29-35)
  const week3Days = [];
  daysSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.dayNumber >= 29 && data.dayNumber <= 35) {
      week3Days.push({ id: doc.id, ...data });
    }
  });
  
  console.log('\nWeek 3 days found:', week3Days.length);
  
  week3Days.sort((a, b) => a.dayNumber - b.dayNumber);
  
  week3Days.forEach(day => {
    console.log('\n=== Day', day.dayNumber, '===');
    console.log('Actions:', (day.actions || []).length);
    (day.actions || []).forEach(a => {
      console.log('  -', a.label, '| type:', a.type || a.resourceType || '?');
    });
    
    if (day.weeklyResources) {
      const wr = day.weeklyResources;
      if (wr.weeklyCoaching && wr.weeklyCoaching.length > 0) {
        console.log('  Weekly Coaching:');
        wr.weeklyCoaching.forEach(c => {
          console.log('    -', c.coachingItemLabel, '| type:', c.coachingItemType || 'coaching');
        });
      }
      if (wr.weeklyCommunity && wr.weeklyCommunity.length > 0) {
        console.log('  Weekly Community:');
        wr.weeklyCommunity.forEach(c => {
          console.log('    -', c.communityItemLabel);
        });
      }
    }
  });
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
