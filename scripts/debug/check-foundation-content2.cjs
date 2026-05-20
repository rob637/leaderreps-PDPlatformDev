const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json')) });
const db = admin.firestore();
(async () => {
  // try unified-content for QS Workbook
  for (const id of ['yFLHR5ofcx0wiEFIdplq', 'xi2YwVB6yhOSscH9Fuv9']) {
    const ucs = await db.doc('unified-content/' + id).get();
    console.log('unified-content/'+id, ucs.exists ? 'FOUND' : 'MISSING');
  }
  // check what collections content lives in - search for "QS Workbook"
  const cols = ['content_library','unified-content','content-groups','content_groups'];
  for (const c of cols) {
    const s = await db.collection(c).where('title','==','QS Workbook').limit(5).get().catch(()=>({size:0,docs:[]}));
    console.log(c, 'matches:', s.size);
    s.docs.forEach(d => console.log('  ', d.id, d.data().type));
  }
  // List a few content_library docs
  const all = await db.collection('content_library').limit(3).get();
  console.log('content_library sample:');
  all.docs.forEach(d => console.log('  ', d.id, d.data().title, d.data().type));
  process.exit(0);
})();
