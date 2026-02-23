/**
 * Fix Week 1 Stale Items
 * Removes "PDQ Feedback Loop" and "AI Feedback Coach" from Week 1 daily plan actions
 * 
 * Run: node scripts/fixes/fix-week1-stale-items.cjs
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (dev environment)
const serviceAccount = require('../../leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const STALE_ITEMS = [
  'PDQ Feedback Loop',
  'AI Feedback Coach'
];

async function fixWeek1StaleItems() {
  console.log('🔍 Checking for stale Week 1 items in daily_plan_v1...\n');
  
  // Check the global daily_plan_v1 collection (shared template)
  const dailyPlanSnap = await db.collection('daily_plan_v1').get();
  console.log(`Found ${dailyPlanSnap.size} documents in daily_plan_v1\n`);
  
  let totalFixed = 0;
  
  for (const dayDoc of dailyPlanSnap.docs) {
    const dayData = dayDoc.data();
    const dayNumber = dayData.dayNumber;
    
    // Week 1 is days 15-21 (start phase days 1-7)
    // Also check all days just in case
    let needsUpdate = false;
    const updates = {};
    
    // Check weeklyResources.weeklyCoaching
    if (dayData.weeklyResources?.weeklyCoaching) {
      const originalCount = dayData.weeklyResources.weeklyCoaching.length;
      const filteredCoaching = dayData.weeklyResources.weeklyCoaching.filter(item => {
        const label = item.label || item.title || '';
        return !STALE_ITEMS.some(stale => label.includes(stale));
      });
      
      if (filteredCoaching.length !== originalCount) {
        updates['weeklyResources.weeklyCoaching'] = filteredCoaching;
        needsUpdate = true;
        console.log(`📅 ${dayDoc.id} (day ${dayNumber}): Found ${originalCount - filteredCoaching.length} stale coaching items in weeklyResources`);
      }
    }
    
    // Check weeklyResources.weeklyContent
    if (dayData.weeklyResources?.weeklyContent) {
      const originalCount = dayData.weeklyResources.weeklyContent.length;
      const filteredContent = dayData.weeklyResources.weeklyContent.filter(item => {
        const label = item.label || item.title || '';
        return !STALE_ITEMS.some(stale => label.includes(stale));
      });
      
      if (filteredContent.length !== originalCount) {
        updates['weeklyResources.weeklyContent'] = filteredContent;
        needsUpdate = true;
        console.log(`📅 ${dayDoc.id} (day ${dayNumber}): Found ${originalCount - filteredContent.length} stale content items in weeklyResources`);
      }
    }
    
    // Check actions array
    if (dayData.actions?.length) {
      const originalCount = dayData.actions.length;
      const filteredActions = dayData.actions.filter(action => {
        const label = action.label || action.title || '';
        return !STALE_ITEMS.some(stale => label.includes(stale));
      });
      
      if (filteredActions.length !== originalCount) {
        updates['actions'] = filteredActions;
        needsUpdate = true;
        console.log(`📅 ${dayDoc.id} (day ${dayNumber}): Found ${originalCount - filteredActions.length} stale actions`);
      }
    }
    
    // Apply updates
    if (needsUpdate) {
      await dayDoc.ref.update(updates);
      totalFixed++;
      console.log(`   ✅ Updated ${dayDoc.id}`);
    }
  }
  
  console.log(`\n✨ Done! Fixed ${totalFixed} day documents.`);
}

fixWeek1StaleItems().catch(console.error);
