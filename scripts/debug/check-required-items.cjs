const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json')) });
const db = admin.firestore();
(async () => {
  const snap = await db.doc('daily_plan_v2/foundation-content').get();
  const items = (snap.data().contentItems || []).filter((i) => i.required || i.isRequiredContent);
  console.log(`Required items: ${items.length}`);
  for (const it of items) {
    const rid = it.resourceId || it.contentItemId;
    let status = 'NO_ID';
    if (rid) {
      const r = await db.doc('content_library/' + rid).get();
      status = r.exists ? `OK(${r.data().type})` : 'MISSING';
    }
    console.log(`  ${status.padEnd(15)} ${(it.contentItemLabel || it.label || '?').padEnd(30)} rid=${rid || '(none)'}`);
  }
  process.exit(0);
})();
