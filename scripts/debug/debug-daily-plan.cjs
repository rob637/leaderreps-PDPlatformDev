const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkDailyPlan() {
  // Check 'daily_plans' collection (if it exists) or 'plans'
  // Based on file list, there is 'check-legacy-plan.cjs' and 'check-journey.cjs'
  
  // Let's look for a plan template or a user's plan
  // Assuming there is a 'daily_plan_templates' or similar
  
  const collections = await db.listCollections();
  collections.forEach(col => console.log(col.id));
}

checkDailyPlan();
