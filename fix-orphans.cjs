const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const orphanedIds = [
  '1iErxFcD0Qu06ahFNO8k',
  '4agdYUy0kIPGxdk8cPEp',
  'WpstpPC0h98F6JesxkUo',
  'yFLHR5ofcx0wiEFIdplq'
];

async function cleanup() {
  const weeksToFix = ['week-01', '110', '120', '130'];
  
  for (const weekId of weeksToFix) {
    const weekRef = db.collection('development_plan_v1').doc(weekId);
    const weekDoc = await weekRef.get();
    
    if (!weekDoc.exists) {
      console.log('Week', weekId, 'not found, skipping');
      continue;
    }
    
    const weekData = weekDoc.data();
    const originalContent = weekData.content || [];
    
    // Filter out items with orphaned resourceIds
    const cleanedContent = originalContent.filter(item => !orphanedIds.includes(item.resourceId));
    
    const removed = originalContent.length - cleanedContent.length;
    
    if (removed > 0) {
      await weekRef.update({ content: cleanedContent });
      console.log('Week', weekId, '- Removed', removed, 'orphaned item(s)');
    } else {
      console.log('Week', weekId, '- No orphaned items found');
    }
  }
  
  console.log('\nCleanup complete!');
  process.exit(0);
}

cleanup().catch(e => { console.error(e); process.exit(1); });
