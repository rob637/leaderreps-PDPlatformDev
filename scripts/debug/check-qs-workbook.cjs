const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json')) });
const db = admin.firestore();
(async () => {
  const id = 'yFLHR5ofcx0wiEFIdplq';
  const collections = await db.listCollections();
  console.log('Collections:', collections.map((c) => c.id));
  for (const c of collections) {
    try {
      const r = await c.doc(id).get();
      if (r.exists) {
        console.log(`FOUND in ${c.id}:`, JSON.stringify(r.data(), null, 2).slice(0, 800));
      }
    } catch (e) {
      // ignore
    }
  }
  // also search by title
  for (const c of collections) {
    try {
      const s = await c.where('title', '==', 'QS Workbook').limit(3).get();
      if (s.size > 0) console.log(`title='QS Workbook' in ${c.id}: ${s.size} docs`, s.docs.map((d) => ({ id: d.id, type: d.data().type })));
    } catch (e) {}
  }
  process.exit(0);
})();
