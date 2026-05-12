const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('../../leaderreps-pd-platform-firebase-adminsdk.json')) });
const db = admin.firestore();
(async () => {
  const snap = await db.collection('users').limit(200).get();
  console.log('Total users:', snap.size);
  const fieldFreq = {};
  const subcolFreq = {};
  let sample = null;
  for (const doc of snap.docs) {
    const d = doc.data();
    Object.keys(d).forEach(k => fieldFreq[k] = (fieldFreq[k]||0)+1);
    if (!sample) sample = { id: doc.id, email: d.email, keys: Object.keys(d) };
    const subs = await doc.ref.listCollections();
    subs.forEach(c => subcolFreq[c.id] = (subcolFreq[c.id]||0)+1);
  }
  console.log('\nTop-level user fields (freq):');
  Object.entries(fieldFreq).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${v.toString().padStart(3)} ${k}`));
  console.log('\nSubcollections (freq):');
  Object.entries(subcolFreq).sort((a,b)=>b[1]-a[1]).forEach(([k,v]) => console.log(`  ${v.toString().padStart(3)} ${k}`));
  console.log('\nSample user:', sample);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
