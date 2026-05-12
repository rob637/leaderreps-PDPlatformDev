const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json')) });
const db = admin.firestore();
(async () => {
  const ids = ['day-022', 'day-029', 'day-036', 'milestone-1', 'milestone-2', 'session2-config'];
  for (const id of ids) {
    const s = await db.doc('daily_plan_v1/' + id).get();
    if (!s.exists) { console.log(id, 'MISSING'); continue; }
    const d = s.data();
    console.log(`\n=== ${id} === keys:`, Object.keys(d).join(','));
    const ci = d.contentItems;
    if (Array.isArray(ci) && ci.length) {
      ci.slice(0, 8).forEach((it, i) => console.log(`  [${i}]`, JSON.stringify(it).slice(0, 200)));
    }
    // also check tools, reps, actions, etc.
    for (const k of ['tools','reps','actions','content','resources','readings','videos']) {
      if (Array.isArray(d[k]) && d[k].length) console.log(`  ${k}:`, JSON.stringify(d[k][0]).slice(0,200));
    }
  }
  process.exit(0);
})();
