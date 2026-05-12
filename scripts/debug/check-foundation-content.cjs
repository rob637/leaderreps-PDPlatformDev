const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json')) });
const db = admin.firestore();
(async () => {
  const snap = await db.doc('daily_plan_v2/foundation-content').get();
  if (!snap.exists) { console.log('NO DOC'); return; }
  const items = (snap.data().contentItems || []).slice(0,5);
  console.log(JSON.stringify(items, null, 2));
  // sample lookup
  for (const it of items) {
    if (it.resourceId) {
      const r = await db.doc('content_library/' + it.resourceId).get();
      console.log(it.resourceId, '->', r.exists ? 'FOUND' : 'MISSING', r.exists ? r.data().type : '');
    } else {
      console.log('no resourceId for', it.contentItemLabel);
    }
  }
  process.exit(0);
})();
