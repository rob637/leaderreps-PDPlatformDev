const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();
(async () => {
  const camps = await db.collection('team_pulse_campaigns').get();
  let totalDeleted = 0;
  for (const c of camps.docs) {
    const resps = await c.ref.collection('responses').get();
    for (const r of resps.docs) {
      await r.ref.delete();
      totalDeleted += 1;
    }
    // Also wipe cached insights since they reference the old data shape
    const insights = await c.ref.collection('insights').get();
    for (const i of insights.docs) await i.ref.delete();
  }
  console.log(`Deleted ${totalDeleted} responses + cached insights across ${camps.size} campaigns`);
  process.exit(0);
})();
