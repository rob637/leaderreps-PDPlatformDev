const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json'); // dev env

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function run() {
  const ss = await db.collection('coaching_sessions').get();
  console.log("Total sessions:", ss.size);
  const types = {};
  ss.forEach(d => {
      const data = d.data();
      const t = data.sessionType || 'NONE';
      const title = data.title || data.name || 'NONE';
      types[`${t} | ${title}`] = (types[`${t} | ${title}`] || 0) + 1;
  });
  console.log(types);
}
run().then(() => process.exit());
