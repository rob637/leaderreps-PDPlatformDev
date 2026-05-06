const admin = require('firebase-admin');
const proj = process.argv[2];
const path = require('path');
const ROOT = '/workspaces/leaderreps-PDPlatformDev';
const keyMap = {
  'leaderreps-prod': path.join(ROOT, 'leaderreps-prod-firebase-adminsdk.json'),
  'leaderreps-test': path.join(ROOT, 'leaderreps-test-firebase-adminsdk.json'),
  'leaderreps-pd-platform': path.join(ROOT, 'leaderreps-pd-platform-firebase-adminsdk.json'),
};
admin.initializeApp({ credential: admin.credential.cert(require(keyMap[proj])), projectId: proj });
const db = admin.firestore();
const LL = 'll-';
(async () => {
  const cohorts = await db.collection(`${LL}cohorts`).where('isActive','==',true).get();
  console.log(`\n=== ${proj} — active cohorts: ${cohorts.size} ===`);
  let totalRecipients = 0;
  for (const c of cohorts.docs) {
    const cd = c.data();
    const members = await db.collection(`${LL}cohorts/${c.id}/members`).where('status','==','enrolled').get();
    console.log(`\nCohort: ${c.id}  name="${cd.name||''}"  startDate=${cd.startDate?.toDate?.().toISOString().slice(0,10)||cd.startDate||'?'}  members=${members.size}`);
    for (const m of members.docs) {
      const u = await db.doc(`${LL}users/${m.id}`).get();
      if (!u.exists) { console.log(`  - ${m.id}: NO USER DOC`); continue; }
      const ud = u.data();
      const willReceive = !!ud.smsOptIn && !!ud.phone;
      if (willReceive) totalRecipients++;
      console.log(`  ${willReceive?'✅':'❌'}  ${ud.firstName||''} ${ud.lastName||''}  <${ud.email||'?'}>  phone=${ud.phone?ud.phone.slice(0,3)+'***'+ud.phone.slice(-2):'NONE'}  smsOptIn=${!!ud.smsOptIn}  onboardingComplete=${!!ud.onboardingComplete}  tz=${ud.timezone||'?'}`);
    }
  }
  console.log(`\n=== ${proj} TOTAL eligible SMS recipients: ${totalRecipients} ===`);
  process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
