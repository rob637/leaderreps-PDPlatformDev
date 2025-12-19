const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const TARGET_IDS = [
  '8Zs3zVk4dspWFoL7Q311', // PDQ Feedback Loop
  'gjpKESqxHiqteFneAczq'  // QuickStart Workbook
];

async function checkPlan() {
  console.log("Checking daily_plan for target IDs:", TARGET_IDS);
  
  const snapshot = await db.collection('daily_plan').get();
  let found = false;

  snapshot.forEach(doc => {
    const data = doc.data();
    const dayNum = data.dayNumber;
    
    // Check actions
    if (data.actions) {
      data.actions.forEach(action => {
        if (TARGET_IDS.includes(action.resourceId)) {
          console.log(`[FOUND] ID ${action.resourceId} in Day ${dayNum} (Action: ${action.label})`);
          found = true;
        }
      });
    }

    // Check content (legacy)
    if (data.content) {
      data.content.forEach(item => {
        if (TARGET_IDS.includes(item.id)) {
          console.log(`[FOUND] ID ${item.id} in Day ${dayNum} (Content: ${item.title})`);
          found = true;
        }
      });
    }
  });

  if (!found) {
    console.log("Target IDs NOT found in any daily_plan document.");
  }
}

checkPlan();
