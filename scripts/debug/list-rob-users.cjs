const admin = require('firebase-admin');
const path = require('path');
admin.initializeApp({ credential: admin.credential.cert(require(path.join(process.cwd(), 'leaderreps-pd-platform-firebase-adminsdk.json'))) });
const db = admin.firestore();
(async () => {
  const snap = await db.collection('users').get();
  const matches = [];
  snap.forEach(d => {
    const data = d.data() || {};
    const email = (data.email || '').toLowerCase();
    const name = (data.name || data.displayName || '').toLowerCase();
    if (/rob[._-]?\d/.test(email) || /rob[._-]?\d/.test(name) || /^rob\d/.test(d.id.toLowerCase())) {
      matches.push({ id: d.id, email: data.email, name: data.name || data.displayName });
    }
  });
  console.log(`Total users: ${snap.size}`);
  console.log(`Rob+digit pattern matches: ${matches.length}`);
  matches.slice(0, 30).forEach(m => console.log(' -', m.email || '(no email)', '|', m.name || '', '|', m.id));
  if (matches.length > 30) console.log(`  ...and ${matches.length - 30} more`);
  process.exit(0);
})();
