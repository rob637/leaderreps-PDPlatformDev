const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'leaderreps-prod'
  });
}
const db = admin.firestore();

// Get current week ID
const now = new Date();
const jan1 = new Date(now.getFullYear(), 0, 1);
const dayOfYear = Math.floor((now - jan1) / 86400000);
const weekNum = Math.ceil((dayOfYear + jan1.getDay() + 1) / 7);
const currentWeekId = `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
console.log('Current week:', currentWeekId);
console.log('');

async function check() {
  const brittId = 'AgHqf6UYqlQBPZR2C25qGHqdOBp1'; // in2focus
  
  console.log('=== BRITT CONDITIONING WEEKS ===');
  const weeksSnap = await db.collection('users').doc(brittId).collection('conditioning_weeks').get();
  console.log(`Total week docs: ${weeksSnap.size}`);
  
  weeksSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`\nWeek: ${d.id}`);
    console.log(`  requiredRepCompleted: ${data.requiredRepCompleted}`);
    console.log(`  totalCompleted: ${data.totalCompleted}`);
    console.log(`  totalActive: ${data.totalActive}`);
  });
  
  // Check Rob too  
  const robId = 'n1K8995AYaYEzquD2sO4tTKftCs1';
  console.log('\n=== ROB CONDITIONING WEEKS ===');
  const robWeeksSnap = await db.collection('users').doc(robId).collection('conditioning_weeks').get();
  console.log(`Total week docs: ${robWeeksSnap.size}`);
  
  robWeeksSnap.docs.forEach(d => {
    const data = d.data();
    console.log(`\nWeek: ${d.id}`);
    console.log(`  requiredRepCompleted: ${data.requiredRepCompleted}`);
    console.log(`  totalCompleted/Active: ${data.totalCompleted}/${data.totalActive}`);
  });
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
