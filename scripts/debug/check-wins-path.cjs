const admin = require('firebase-admin');
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./leaderreps-pd-platform-firebase-adminsdk.json'))
  });
}
const db = admin.firestore();

(async () => {
  const userId = 'Njk0VesNQzaXhyDUqgHTqFBiRPx1';
  const path = 'modules/' + userId + '/daily_practice/current';
  
  const doc = await db.doc(path).get();
  const data = doc.data();
  
  // Get unique dates for each
  const winDates = [...new Set((data.winsList || []).map(w => w.date))].sort().reverse();
  const repDates = [...new Set((data.repsHistory || []).map(r => r.date))].sort().reverse();
  const reflectionDates = [...new Set((data.reflectionHistory || []).map(r => r.date))].sort().reverse();
  const scorecardDates = [...new Set((data.scorecardHistory || []).map(s => s.date))].sort().reverse();
  
  console.log('=== DATA SUMMARY FOR rob7@test.com ===\\n');
  console.log('WINS (AM Bookend):');
  console.log('  Total entries:', (data.winsList || []).length);
  console.log('  Unique dates:', winDates.length);
  console.log('  Dates:', winDates.join(', '));
  
  console.log('\\nREPS HISTORY:');
  console.log('  Total entries:', (data.repsHistory || []).length);
  console.log('  Unique dates:', repDates.length);
  console.log('  Dates:', repDates.join(', '));
  
  console.log('\\nREFLECTION HISTORY:');
  console.log('  Total entries:', (data.reflectionHistory || []).length);
  console.log('  Unique dates:', reflectionDates.length);
  console.log('  Dates:', reflectionDates.join(', '));
  
  console.log('\\nSCORECARD HISTORY:');
  console.log('  Total entries:', (data.scorecardHistory || []).length);
  console.log('  Unique dates:', scorecardDates.length);
  console.log('  Dates:', scorecardDates.join(', '));
  
  process.exit(0);
})();
